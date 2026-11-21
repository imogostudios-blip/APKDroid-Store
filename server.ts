import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import {
  type AuthenticatedRequest,
  hashPassword,
  requireAuth,
  signAuthToken,
  verifyPassword,
} from './server/auth.ts';
import {
  ALLOWED_WALLPAPERS,
  AVATAR_COLORS,
  AVATAR_DIR,
  db,
  DEFAULT_CHAT_WALLPAPER,
  generateUsernameSuggestions,
  getFriendIds,
  getFriendshipRelation,
  getGroupMemberIds,
  getMappedMessageById,
  getOrCreateDirectConversation,
  getPeerIdFromConversation,
  getReactionsForMessageIds,
  hydrateMessages,
  isConversationMember,
  isGroupMember,
  isUsernameTaken,
  mapMessageRow,
  MEDIA_DIR,
  normalizeUsername,
  orderedUserPair,
  UPLOAD_DIR,
  validateUsernameFormat,
  type DbConversationRow,
  type DbGroupRow,
  type DbMessageJoinRow,
  type DbUserRow,
} from './server/db.ts';
import { broadcastAll, isUserOnline, sendToUser, setupWebSocketServer } from './server/ws.ts';

const PORT = 3000;

const INLINE_SAFE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/aac',
  'audio/x-m4a',
  'audio/flac',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
]);

const BLOCKED_UPLOAD_MIMES = new Set([
  'text/html',
  'application/xhtml+xml',
  'image/svg+xml',
]);

const AVATAR_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const MEDIA_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

function toPublicUser(row: DbUserRow, viewerId?: string) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    currentStatus: row.current_status || 'متصل',
    needsOnboarding: Boolean(row.needs_bio_onboarding),
    avatarColor: row.avatar_color,
    avatarUrl: row.avatar_url || null,
    chatWallpaper:
      row.chat_wallpaper && ALLOWED_WALLPAPERS.has(row.chat_wallpaper)
        ? row.chat_wallpaper
        : DEFAULT_CHAT_WALLPAPER,
    online: isUserOnline(row.id),
    lastSeen: row.last_seen,
    ...(viewerId && viewerId !== row.id
      ? { friendshipStatus: getFriendshipRelation(viewerId, row.id) }
      : {}),
  };
}

function isSafeMediaUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  return /^\/api\/media\/[a-f0-9-]+\.(jpg|png|webp|gif|mp4|webm|mov)$/i.test(url.trim());
}

function sanitizeExtraLinks(raw: unknown): Array<{ label: string; url: string }> {
  if (!Array.isArray(raw)) return [];
  const result: Array<{ label: string; url: string }> = [];
  for (const item of raw.slice(0, 6)) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const rawUrl = typeof obj.url === 'string' ? obj.url.trim() : '';
    const rawLabel = typeof obj.label === 'string' ? obj.label.trim().slice(0, 50) : '';
    if (!rawUrl) continue;
    try {
      const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      const parsed = new URL(normalized);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') continue;
      result.push({
        label: rawLabel || parsed.hostname,
        url: parsed.toString(),
      });
    } catch {
      // Ignore invalid URL
    }
  }
  return result;
}

function parseJsonArray<T>(raw: string | null | undefined, fallback: T[] = []): T[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function removeOldAvatarFile(avatarUrl: string) {
  if (!avatarUrl || !avatarUrl.startsWith('/api/avatars/')) return;
  const filename = path.basename(avatarUrl.slice('/api/avatars/'.length));
  if (!/^[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(filename)) return;
  const resolved = path.resolve(AVATAR_DIR, filename);
  if (resolved.startsWith(AVATAR_DIR + path.sep)) {
    fs.unlink(resolved, () => {});
  }
}

function removeUploadedFileById(fileId: string | null | undefined) {
  if (!fileId) return;
  const fileRow = db
    .prepare('SELECT id, stored_name FROM files WHERE id = ?')
    .get(fileId) as { id: string; stored_name: string } | undefined;
  if (!fileRow) return;
  db.prepare('DELETE FROM files WHERE id = ?').run(fileId);
  const resolved = path.resolve(UPLOAD_DIR, path.basename(fileRow.stored_name));
  if (resolved.startsWith(UPLOAD_DIR + path.sep)) {
    fs.unlink(resolved, () => {});
  }
}

function getSafeExtension(originalName: string, mimeType: string): string {
  const extFromName = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  if (extFromName && extFromName.length <= 10) {
    return extFromName;
  }
  if (mimeType.startsWith('audio/webm')) return '.webm';
  if (mimeType.startsWith('audio/ogg')) return '.ogg';
  if (mimeType.startsWith('audio/mp4')) return '.m4a';
  if (mimeType.startsWith('video/mp4')) return '.mp4';
  if (mimeType.startsWith('video/quicktime')) return '.mov';
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'application/pdf') return '.pdf';
  return '.bin';
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = getSafeExtension(file.originalname, file.mimetype);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const baseMime = (file.mimetype || 'application/octet-stream').split(';')[0].trim().toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (BLOCKED_UPLOAD_MIMES.has(baseMime) || ['.html', '.htm', '.svg'].includes(ext)) {
      cb(new Error('هذا النوع من الملفات غير مسموح به لأسباب أمنية'));
      return;
    }
    cb(null, true);
  },
});

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, AVATAR_DIR);
  },
  filename: (_req, file, cb) => {
    const baseMime = file.mimetype.split(';')[0].trim().toLowerCase();
    const ext = AVATAR_MIME_TO_EXT[baseMime] ?? '.jpg';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const baseMime = file.mimetype.split(';')[0].trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(AVATAR_MIME_TO_EXT, baseMime)) {
      cb(null, true);
      return;
    }
    cb(new Error('يرجى اختيار صورة صالحة (JPG أو PNG أو WebP أو GIF)'));
  },
});

const mediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, MEDIA_DIR);
  },
  filename: (_req, file, cb) => {
    const baseMime = file.mimetype.split(';')[0].trim().toLowerCase();
    const ext = MEDIA_MIME_TO_EXT[baseMime] ?? '.bin';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const mediaUpload = multer({
  storage: mediaStorage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const baseMime = file.mimetype.split(';')[0].trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(MEDIA_MIME_TO_EXT, baseMime)) {
      cb(null, true);
      return;
    }
    cb(new Error('يرجى اختيار صورة (JPG/PNG/WebP/GIF) أو فيديو (MP4/WebM/MOV)'));
  },
});

function buildGroupSummary(group: DbGroupRow, selfId: string) {
  const memberRows = db
    .prepare(
      `SELECT u.* FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY gm.role = 'owner' DESC, gm.joined_at ASC
       LIMIT 60`
    )
    .all(group.id) as DbUserRow[];

  const countRow = db
    .prepare('SELECT COUNT(*) AS cnt FROM group_members WHERE group_id = ?')
    .get(group.id) as { cnt: number };

  const lastMsgRow = db
    .prepare(
      `SELECT gm.*, u.display_name AS sender_name, u.username AS sender_username,
              u.avatar_color AS sender_avatar_color, u.avatar_url AS sender_avatar_url,
              f.original_name AS file_original_name, f.mime_type AS file_mime_type, f.size_bytes AS file_size_bytes
       FROM group_messages gm
       JOIN users u ON gm.sender_id = u.id
       LEFT JOIN files f ON gm.file_id = f.id
       WHERE gm.group_id = ?
         AND NOT EXISTS (
           SELECT 1 FROM hidden_messages hm
           WHERE hm.user_id = ? AND hm.message_scope = 'group' AND hm.message_id = gm.id
         )
       ORDER BY gm.created_at DESC
       LIMIT 1`
    )
    .get(group.id, selfId) as
    | {
        id: string;
        group_id: string;
        sender_id: string;
        sender_name: string;
        sender_username: string;
        sender_avatar_color: string;
        sender_avatar_url: string;
        type: string;
        content: string;
        file_id: string | null;
        duration_sec: number | null;
        created_at: number;
        file_original_name: string | null;
        file_mime_type: string | null;
        file_size_bytes: number | null;
      }
    | undefined;

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    promoText: group.promo_text,
    extraLinks: parseJsonArray<{ label: string; url: string }>(group.extra_links),
    avatarUrl: group.avatar_url || null,
    inviteCode: group.invite_code,
    ownerId: group.owner_id,
    isOwner: group.owner_id === selfId,
    memberCount: countRow.cnt,
    members: memberRows.map((u) => toPublicUser(u, selfId)),
    lastMessage: lastMsgRow
      ? {
          id: lastMsgRow.id,
          groupId: lastMsgRow.group_id,
          senderId: lastMsgRow.sender_id,
          senderName: lastMsgRow.sender_name,
          senderUsername: lastMsgRow.sender_username,
          senderAvatarColor: lastMsgRow.sender_avatar_color,
          senderAvatarUrl: lastMsgRow.sender_avatar_url || null,
          type: lastMsgRow.type,
          content: lastMsgRow.content,
          file: lastMsgRow.file_id
            ? {
                id: lastMsgRow.file_id,
                originalName: lastMsgRow.file_original_name ?? 'file',
                mimeType: lastMsgRow.file_mime_type ?? 'application/octet-stream',
                sizeBytes: lastMsgRow.file_size_bytes ?? 0,
              }
            : null,
          durationSec: lastMsgRow.duration_sec,
          createdAt: lastMsgRow.created_at,
        }
      : null,
    createdAt: group.created_at,
    updatedAt: group.updated_at,
  };
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/auth/check-username', (req, res) => {
    const raw = typeof req.query.username === 'string' ? req.query.username : '';
    const username = normalizeUsername(raw);
    const validation = validateUsernameFormat(username);
    if (!validation.valid) {
      res.json({
        available: false,
        valid: false,
        username,
        reason: validation.reason,
        suggestions: [],
      });
      return;
    }

    const taken = isUsernameTaken(username);
    if (taken) {
      res.json({
        available: false,
        valid: true,
        username,
        reason: `المعرف @${username} محجوز لمستخدم آخر`,
        suggestions: generateUsernameSuggestions(username, 3),
      });
      return;
    }

    res.json({
      available: true,
      valid: true,
      username,
      suggestions: [],
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const rawUsername = typeof body.username === 'string' ? body.username : '';
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    const username = normalizeUsername(rawUsername);
    const validation = validateUsernameFormat(username);
    if (!validation.valid) {
      res.status(400).json({ error: validation.reason });
      return;
    }

    if (displayName.length < 2 || displayName.length > 40) {
      res.status(400).json({ error: 'يجب أن يكون الاسم الظاهر بين حرفين و40 حرفاً' });
      return;
    }

    if (password.length < 6 || password.length > 100) {
      res.status(400).json({ error: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' });
      return;
    }

    if (isUsernameTaken(username)) {
      res.status(409).json({
        error: `اسم المستخدم @${username} مسجل مسبقاً. اختر اسماً آخر أو استخدم أحد الاقتراحات:`,
        suggestions: generateUsernameSuggestions(username, 3),
      });
      return;
    }

    const now = Date.now();
    const userId = crypto.randomUUID();
    const avatarColor = AVATAR_COLORS[crypto.randomInt(0, AVATAR_COLORS.length)];
    const passwordHash = hashPassword(password);

    try {
      db.prepare(
        `INSERT INTO users (id, username, display_name, password_hash, bio, avatar_color, last_seen, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(userId, username, displayName, passwordHash, 'متاح على RetChat', avatarColor, now, now);
    } catch {
      res.status(409).json({
        error: `اسم المستخدم @${username} مسجل مسبقاً`,
        suggestions: generateUsernameSuggestions(username, 3),
      });
      return;
    }

    const createdUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as DbUserRow;
    const token = signAuthToken(userId, username);

    res.status(201).json({
      token,
      user: toPublicUser(createdUser),
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const rawUsername = typeof body.username === 'string' ? body.username : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const username = normalizeUsername(rawUsername);

    if (!username || !password) {
      res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as
      | DbUserRow
      | undefined;
    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
      return;
    }

    const token = signAuthToken(user.id, user.username);
    res.json({
      token,
      user: toPublicUser(user),
    });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: toPublicUser(req.authUser!) });
  });

  app.patch('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const body = req.body as Record<string, unknown>;
    const displayName =
      typeof body.displayName === 'string' ? body.displayName.trim() : user.display_name;
    const bio = typeof body.bio === 'string' ? body.bio.trim().slice(0, 140) : user.bio;
    const currentStatus =
      typeof body.currentStatus === 'string'
        ? body.currentStatus.trim().slice(0, 50) || 'متصل'
        : user.current_status || 'متصل';
    const needsBioOnboarding =
      typeof body.needsOnboarding === 'boolean'
        ? body.needsOnboarding
          ? 1
          : 0
        : user.needs_bio_onboarding;
    const avatarColor =
      typeof body.avatarColor === 'string' && AVATAR_COLORS.includes(body.avatarColor)
        ? body.avatarColor
        : user.avatar_color;
    const chatWallpaper =
      typeof body.chatWallpaper === 'string' && ALLOWED_WALLPAPERS.has(body.chatWallpaper)
        ? body.chatWallpaper
        : user.chat_wallpaper || DEFAULT_CHAT_WALLPAPER;

    if (displayName.length < 2 || displayName.length > 40) {
      res.status(400).json({ error: 'الاسم الظاهر يجب أن يكون بين حرفين و40 حرفاً' });
      return;
    }

    db.prepare(
      `UPDATE users
       SET display_name = ?, bio = ?, current_status = ?, needs_bio_onboarding = ?, avatar_color = ?, chat_wallpaper = ?
       WHERE id = ?`
    ).run(displayName, bio, currentStatus, needsBioOnboarding, avatarColor, chatWallpaper, user.id);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as DbUserRow;
    const publicUser = toPublicUser(updated);
    broadcastAll({ type: 'user:updated', user: publicUser });
    res.json({ user: publicUser });
  });

  app.post('/api/auth/avatar', requireAuth, (req: AuthenticatedRequest, res) => {
    avatarUpload.single('avatar')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message || 'فشل رفع الصورة الشخصية' });
        return;
      }
      const uploaded = req.file;
      if (!uploaded) {
        res.status(400).json({ error: 'لم يتم اختيار صورة' });
        return;
      }

      const user = req.authUser!;
      const nextUrl = `/api/avatars/${uploaded.filename}`;
      removeOldAvatarFile(user.avatar_url);

      db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(nextUrl, user.id);
      const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as DbUserRow;
      const publicUser = toPublicUser(updated);
      broadcastAll({ type: 'user:updated', user: publicUser });
      res.json({ user: publicUser });
    });
  });

  app.delete('/api/auth/avatar', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    removeOldAvatarFile(user.avatar_url);
    db.prepare(`UPDATE users SET avatar_url = '' WHERE id = ?`).run(user.id);
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as DbUserRow;
    const publicUser = toPublicUser(updated);
    broadcastAll({ type: 'user:updated', user: publicUser });
    res.json({ user: publicUser });
  });

  app.get('/api/avatars/:filename', (req, res) => {
    const filename = path.basename(String(req.params.filename || ''));
    if (!/^[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(filename)) {
      res.status(404).end();
      return;
    }
    const resolved = path.resolve(AVATAR_DIR, filename);
    if (!resolved.startsWith(AVATAR_DIR + path.sep) || !fs.existsSync(resolved)) {
      res.status(404).end();
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(resolved);
  });

  app.post('/api/media/upload', requireAuth, (req: AuthenticatedRequest, res) => {
    mediaUpload.single('file')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message || 'فشل رفع الوسائط' });
        return;
      }
      const uploaded = req.file;
      if (!uploaded) {
        res.status(400).json({ error: 'لم يتم اختيار ملف' });
        return;
      }
      const baseMime = uploaded.mimetype.split(';')[0].trim().toLowerCase();
      res.status(201).json({
        url: `/api/media/${uploaded.filename}`,
        mimeType: baseMime,
        isVideo: baseMime.startsWith('video/'),
        sizeBytes: uploaded.size,
      });
    });
  });

  app.get('/api/media/:filename', (req, res) => {
    const filename = path.basename(String(req.params.filename || ''));
    if (!/^[a-f0-9-]+\.(jpg|png|webp|gif|mp4|webm|mov)$/i.test(filename)) {
      res.status(404).end();
      return;
    }
    const resolved = path.resolve(MEDIA_DIR, filename);
    if (!resolved.startsWith(MEDIA_DIR + path.sep) || !fs.existsSync(resolved)) {
      res.status(404).end();
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(resolved);
  });

  app.get('/api/users', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const qRaw = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const qClean = qRaw.replace(/^@+/, '').toLowerCase();

    let rows: DbUserRow[];
    if (qClean) {
      const pattern = `%${qClean}%`;
      rows = db
        .prepare(
          `SELECT * FROM users
           WHERE id != ? AND (LOWER(username) LIKE ? OR LOWER(display_name) LIKE ?)
           ORDER BY last_seen DESC
           LIMIT 30`
        )
        .all(selfId, pattern, pattern) as DbUserRow[];
    } else {
      rows = db
        .prepare('SELECT * FROM users WHERE id != ? ORDER BY last_seen DESC LIMIT 30')
        .all(selfId) as DbUserRow[];
    }

    res.json({ users: rows.map((r) => toPublicUser(r, selfId)) });
  });

  app.get('/api/friends', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const rows = db
      .prepare(
        `SELECT f.*,
                CASE WHEN f.user_a = ? THEN f.user_b ELSE f.user_a END AS other_id
         FROM friendships f
         WHERE (f.user_a = ? OR f.user_b = ?) AND f.status IN ('accepted', 'pending')
         ORDER BY f.updated_at DESC`
      )
      .all(selfId, selfId, selfId) as Array<{
      user_a: string;
      user_b: string;
      requester_id: string;
      status: string;
      other_id: string;
      updated_at: number;
    }>;

    const stmtUser = db.prepare('SELECT * FROM users WHERE id = ?');
    const friends: ReturnType<typeof toPublicUser>[] = [];
    const incomingRequests: ReturnType<typeof toPublicUser>[] = [];
    const outgoingRequests: ReturnType<typeof toPublicUser>[] = [];

    for (const r of rows) {
      const u = stmtUser.get(r.other_id) as DbUserRow | undefined;
      if (!u) continue;
      const pub = toPublicUser(u, selfId);
      if (r.status === 'accepted') {
        friends.push(pub);
      } else if (r.status === 'pending') {
        if (r.requester_id === selfId) {
          outgoingRequests.push(pub);
        } else {
          incomingRequests.push(pub);
        }
      }
    }

    res.json({ friends, incomingRequests, outgoingRequests });
  });

  app.post('/api/friends/request', requireAuth, (req: AuthenticatedRequest, res) => {
    const self = req.authUser!;
    const body = req.body as Record<string, unknown>;
    const targetUserId = typeof body.targetUserId === 'string' ? body.targetUserId.trim() : '';

    if (!targetUserId || targetUserId === self.id) {
      res.status(400).json({ error: 'معرف المستخدم غير صالح' });
      return;
    }

    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId) as
      | DbUserRow
      | undefined;
    if (!targetUser) {
      res.status(404).json({ error: 'المستخدم غير موجود' });
      return;
    }

    const [userA, userB] = orderedUserPair(self.id, targetUserId);
    const existing = db
      .prepare('SELECT * FROM friendships WHERE user_a = ? AND user_b = ?')
      .get(userA, userB) as { requester_id: string; status: string } | undefined;

    const now = Date.now();
    if (existing?.status === 'accepted') {
      const conv = getOrCreateDirectConversation(self.id, targetUserId);
      res.json({
        friendshipStatus: 'accepted',
        user: toPublicUser(targetUser, self.id),
        conversationId: conv.id,
      });
      return;
    }

    if (existing?.status === 'pending' && existing.requester_id !== self.id) {
      db.prepare(
        `UPDATE friendships SET status = 'accepted', updated_at = ? WHERE user_a = ? AND user_b = ?`
      ).run(now, userA, userB);
      const conv = getOrCreateDirectConversation(self.id, targetUserId);
      sendToUser(targetUserId, {
        type: 'friend:accepted',
        user: toPublicUser(self, targetUserId),
        conversationId: conv.id,
      });
      sendToUser(self.id, {
        type: 'friend:accepted',
        user: toPublicUser(targetUser, self.id),
        conversationId: conv.id,
      });
      res.json({
        friendshipStatus: 'accepted',
        user: toPublicUser(targetUser, self.id),
        conversationId: conv.id,
      });
      return;
    }

    db.prepare(
      `INSERT INTO friendships (user_a, user_b, requester_id, status, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?)
       ON CONFLICT(user_a, user_b) DO UPDATE
       SET requester_id = excluded.requester_id, status = 'pending', updated_at = excluded.updated_at`
    ).run(userA, userB, self.id, now, now);

    sendToUser(targetUserId, {
      type: 'friend:request',
      fromUser: toPublicUser(self, targetUserId),
    });

    res.status(201).json({
      friendshipStatus: 'pending_sent',
      user: toPublicUser(targetUser, self.id),
    });
  });

  app.post('/api/friends/respond', requireAuth, (req: AuthenticatedRequest, res) => {
    const self = req.authUser!;
    const body = req.body as Record<string, unknown>;
    const otherUserId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const action = typeof body.action === 'string' ? body.action : '';

    if (!otherUserId || otherUserId === self.id || !['accept', 'decline', 'cancel'].includes(action)) {
      res.status(400).json({ error: 'طلب غير صالح' });
      return;
    }

    const otherUser = db.prepare('SELECT * FROM users WHERE id = ?').get(otherUserId) as
      | DbUserRow
      | undefined;
    if (!otherUser) {
      res.status(404).json({ error: 'المستخدم غير موجود' });
      return;
    }

    const [userA, userB] = orderedUserPair(self.id, otherUserId);
    const existing = db
      .prepare('SELECT * FROM friendships WHERE user_a = ? AND user_b = ?')
      .get(userA, userB) as { requester_id: string; status: string } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'لا يوجد طلب صداقة' });
      return;
    }

    const now = Date.now();
    if (action === 'accept') {
      if (existing.status !== 'pending' || existing.requester_id !== otherUserId) {
        res.status(400).json({ error: 'لا يوجد طلب صداقة وارد لقبوله' });
        return;
      }
      db.prepare(
        `UPDATE friendships SET status = 'accepted', updated_at = ? WHERE user_a = ? AND user_b = ?`
      ).run(now, userA, userB);

      const conv = getOrCreateDirectConversation(self.id, otherUserId);
      sendToUser(otherUserId, {
        type: 'friend:accepted',
        user: toPublicUser(self, otherUserId),
        conversationId: conv.id,
      });
      sendToUser(self.id, {
        type: 'friend:accepted',
        user: toPublicUser(otherUser, self.id),
        conversationId: conv.id,
      });

      res.json({
        friendshipStatus: 'accepted',
        user: toPublicUser(otherUser, self.id),
        conversationId: conv.id,
      });
      return;
    }

    db.prepare('DELETE FROM friendships WHERE user_a = ? AND user_b = ?').run(userA, userB);
    sendToUser(otherUserId, {
      type: 'friend:declined',
      userId: self.id,
    });
    sendToUser(self.id, {
      type: 'friend:declined',
      userId: otherUserId,
    });

    res.json({
      friendshipStatus: 'none',
      user: toPublicUser(otherUser, self.id),
    });
  });

  app.get('/api/conversations', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const convs = db
      .prepare(
        `SELECT * FROM conversations
         WHERE user_a = ? OR user_b = ?
         ORDER BY updated_at DESC`
      )
      .all(selfId, selfId) as DbConversationRow[];

    const stmtPeer = db.prepare('SELECT * FROM users WHERE id = ?');
    const stmtLastMsg = db.prepare(
      `SELECT m.*, f.original_name AS file_original_name, f.mime_type AS file_mime_type, f.size_bytes AS file_size_bytes
       FROM messages m
       LEFT JOIN files f ON m.file_id = f.id
       WHERE m.conversation_id = ?
         AND NOT EXISTS (
           SELECT 1 FROM hidden_messages hm
           WHERE hm.user_id = ? AND hm.message_scope = 'dm' AND hm.message_id = m.id
         )
       ORDER BY m.created_at DESC
       LIMIT 1`
    );
    const stmtUnread = db.prepare(
      `SELECT COUNT(*) AS cnt FROM messages m
       WHERE m.conversation_id = ? AND m.sender_id != ? AND m.status != 'read'
         AND NOT EXISTS (
           SELECT 1 FROM hidden_messages hm
           WHERE hm.user_id = ? AND hm.message_scope = 'dm' AND hm.message_id = m.id
         )`
    );

    const result = [];
    for (const conv of convs) {
      const peerId = getPeerIdFromConversation(conv, selfId);
      if (getFriendshipRelation(selfId, peerId) !== 'accepted') continue;
      const peer = stmtPeer.get(peerId) as DbUserRow | undefined;
      if (!peer) continue;

      const lastRow = stmtLastMsg.get(conv.id, selfId) as DbMessageJoinRow | undefined;
      const unreadRow = stmtUnread.get(conv.id, selfId, selfId) as { cnt: number };

      result.push({
        id: conv.id,
        peer: toPublicUser(peer, selfId),
        lastMessage: lastRow ? mapMessageRow(lastRow) : null,
        pinnedMessage: getMappedMessageById(conv.pinned_message_id),
        unreadCount: unreadRow.cnt,
        updatedAt: conv.updated_at,
      });
    }

    res.json({ conversations: result });
  });

  app.post('/api/conversations', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const body = req.body as Record<string, unknown>;
    const targetUserId = typeof body.targetUserId === 'string' ? body.targetUserId : '';

    if (!targetUserId || targetUserId === selfId) {
      res.status(400).json({ error: 'معرف المستخدم غير صالح' });
      return;
    }

    const peer = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId) as
      | DbUserRow
      | undefined;
    if (!peer) {
      res.status(404).json({ error: 'المستخدم غير موجود' });
      return;
    }

    if (getFriendshipRelation(selfId, targetUserId) !== 'accepted') {
      res.status(403).json({ error: 'يجب قبول طلب الصداقة أولاً قبل بدء المحادثة' });
      return;
    }

    const conv = getOrCreateDirectConversation(selfId, targetUserId);
    const lastRow = db
      .prepare(
        `SELECT m.*, f.original_name AS file_original_name, f.mime_type AS file_mime_type, f.size_bytes AS file_size_bytes
         FROM messages m
         LEFT JOIN files f ON m.file_id = f.id
         WHERE m.conversation_id = ?
           AND NOT EXISTS (
             SELECT 1 FROM hidden_messages hm
             WHERE hm.user_id = ? AND hm.message_scope = 'dm' AND hm.message_id = m.id
           )
         ORDER BY m.created_at DESC
         LIMIT 1`
      )
      .get(conv.id, selfId) as DbMessageJoinRow | undefined;

    res.json({
      conversation: {
        id: conv.id,
        peer: toPublicUser(peer, selfId),
        lastMessage: lastRow ? mapMessageRow(lastRow) : null,
        pinnedMessage: getMappedMessageById(conv.pinned_message_id),
        unreadCount: 0,
        updatedAt: conv.updated_at,
      },
    });
  });

  app.get('/api/conversations/:id/messages', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const convId = String(req.params.id || '');
    const conv = isConversationMember(convId, selfId);
    if (!conv) {
      res.status(403).json({ error: 'غير مصرح بالوصول إلى هذه المحادثة' });
      return;
    }

    const peerId = getPeerIdFromConversation(conv, selfId);
    const markRead = db
      .prepare(
        `UPDATE messages SET status = 'read'
         WHERE conversation_id = ? AND sender_id = ? AND status != 'read'`
      )
      .run(convId, peerId);

    if (markRead.changes > 0) {
      sendToUser(peerId, {
        type: 'messages:status',
        conversationId: convId,
        status: 'read',
      });
    }

    const rows = db
      .prepare(
        `SELECT m.*, f.original_name AS file_original_name, f.mime_type AS file_mime_type, f.size_bytes AS file_size_bytes
         FROM messages m
         LEFT JOIN files f ON m.file_id = f.id
         WHERE m.conversation_id = ?
           AND NOT EXISTS (
             SELECT 1 FROM hidden_messages hm
             WHERE hm.user_id = ? AND hm.message_scope = 'dm' AND hm.message_id = m.id
           )
         ORDER BY m.created_at ASC
         LIMIT 300`
      )
      .all(convId, selfId) as DbMessageJoinRow[];

    res.json({
      messages: hydrateMessages(rows),
      pinnedMessage: getMappedMessageById(conv.pinned_message_id),
    });
  });

  app.post('/api/conversations/:id/messages', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const convId = String(req.params.id || '');
    const conv = isConversationMember(convId, selfId);
    if (!conv) {
      res.status(403).json({ error: 'غير مصرح بالإرسال في هذه المحادثة' });
      return;
    }

    const peerCheckId = getPeerIdFromConversation(conv, selfId);
    if (getFriendshipRelation(selfId, peerCheckId) !== 'accepted') {
      res.status(403).json({ error: 'يجب قبول طلب الصداقة أولاً قبل إرسال الرسائل' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const type = typeof body.type === 'string' ? body.type : 'text';
    const content = typeof body.content === 'string' ? body.content.trim().slice(0, 4000) : '';
    const fileId = typeof body.fileId === 'string' ? body.fileId : null;
    const replyToId =
      typeof body.replyToId === 'string' && body.replyToId.trim() ? body.replyToId.trim() : null;
    const durationSec =
      typeof body.durationSec === 'number' && Number.isFinite(body.durationSec)
        ? Math.max(0, Math.min(3600, body.durationSec))
        : null;

    if (!['text', 'voice', 'file'].includes(type)) {
      res.status(400).json({ error: 'نوع الرسالة غير صالح' });
      return;
    }

    if (type === 'text' && !content) {
      res.status(400).json({ error: 'لا يمكن إرسال رسالة فارغة' });
      return;
    }

    let replyTo: {
      id: string;
      senderId: string;
      type: string;
      content: string;
      fileOriginalName: string | null;
    } | null = null;

    if (replyToId) {
      const targetRow = db
        .prepare(
          `SELECT m.id, m.sender_id, m.type, m.content, f.original_name AS file_original_name
           FROM messages m
           LEFT JOIN files f ON m.file_id = f.id
           WHERE m.id = ? AND m.conversation_id = ?`
        )
        .get(replyToId, convId) as
        | {
            id: string;
            sender_id: string;
            type: string;
            content: string;
            file_original_name: string | null;
          }
        | undefined;
      if (!targetRow) {
        res.status(400).json({ error: 'الرسالة المردود عليها غير موجودة في هذه المحادثة' });
        return;
      }
      replyTo = {
        id: targetRow.id,
        senderId: targetRow.sender_id,
        type: targetRow.type,
        content: targetRow.content,
        fileOriginalName: targetRow.file_original_name,
      };
    }

    let fileAttachment = null;
    if (type === 'voice' || type === 'file') {
      if (!fileId) {
        res.status(400).json({ error: 'الملف المرفق مفقود' });
        return;
      }
      const fileRow = db
        .prepare('SELECT * FROM files WHERE id = ? AND conversation_id = ? AND uploader_id = ?')
        .get(fileId, convId, selfId) as
        | { id: string; original_name: string; mime_type: string; size_bytes: number }
        | undefined;
      if (!fileRow) {
        res.status(404).json({ error: 'تعذر العثور على الملف المرفق' });
        return;
      }
      fileAttachment = {
        id: fileRow.id,
        originalName: fileRow.original_name,
        mimeType: fileRow.mime_type,
        sizeBytes: fileRow.size_bytes,
      };
    }

    const peerId = getPeerIdFromConversation(conv, selfId);
    const peerOnline = isUserOnline(peerId);
    const status = peerOnline ? 'delivered' : 'sent';
    const now = Date.now();
    const messageId = crypto.randomUUID();

    db.prepare(
      `INSERT INTO messages (id, conversation_id, sender_id, type, content, file_id, duration_sec, reply_to_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(messageId, convId, selfId, type, content, fileId, durationSec, replyToId, status, now);

    db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, convId);

    const message = {
      id: messageId,
      conversationId: convId,
      senderId: selfId,
      type,
      content,
      file: fileAttachment,
      durationSec,
      callStatus: null,
      replyTo,
      reactions: [],
      status,
      createdAt: now,
    };

    sendToUser(peerId, { type: 'message:new', message });
    sendToUser(selfId, { type: 'message:new', message });

    res.status(201).json({ message });
  });

  app.post(
    '/api/conversations/:id/messages/:msgId/react',
    requireAuth,
    (req: AuthenticatedRequest, res) => {
      const selfId = req.authUser!.id;
      const convId = String(req.params.id || '');
      const msgId = String(req.params.msgId || '');
      const conv = isConversationMember(convId, selfId);
      if (!conv) {
        res.status(403).json({ error: 'غير مصرح بالوصول إلى هذه المحادثة' });
        return;
      }

      const msgExists = db
        .prepare('SELECT id FROM messages WHERE id = ? AND conversation_id = ?')
        .get(msgId, convId);
      if (!msgExists) {
        res.status(404).json({ error: 'الرسالة غير موجودة' });
        return;
      }

      const body = req.body as Record<string, unknown>;
      const emoji = typeof body.emoji === 'string' ? body.emoji.trim().slice(0, 16) : '';
      if (!emoji) {
        res.status(400).json({ error: 'يرجى اختيار رمز تعبيري صالح' });
        return;
      }

      const existing = db
        .prepare('SELECT emoji FROM message_reactions WHERE message_id = ? AND user_id = ?')
        .get(msgId, selfId) as { emoji: string } | undefined;

      if (existing && existing.emoji === emoji) {
        db.prepare('DELETE FROM message_reactions WHERE message_id = ? AND user_id = ?').run(
          msgId,
          selfId
        );
      } else {
        db.prepare(
          `INSERT INTO message_reactions (message_id, user_id, emoji, created_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(message_id, user_id) DO UPDATE SET emoji = excluded.emoji, created_at = excluded.created_at`
        ).run(msgId, selfId, emoji, Date.now());
      }

      const reactions = getReactionsForMessageIds([msgId]).get(msgId) ?? [];
      const peerId = getPeerIdFromConversation(conv, selfId);

      sendToUser(peerId, {
        type: 'message:reactions',
        conversationId: convId,
        messageId: msgId,
        reactions,
      });
      sendToUser(selfId, {
        type: 'message:reactions',
        conversationId: convId,
        messageId: msgId,
        reactions,
      });

      res.json({ reactions });
    }
  );

  app.post('/api/conversations/:id/pin', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const convId = String(req.params.id || '');
    const conv = isConversationMember(convId, selfId);
    if (!conv) {
      res.status(403).json({ error: 'غير مصرح بتعديل هذه المحادثة' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const messageId =
      typeof body.messageId === 'string' && body.messageId.trim() ? body.messageId.trim() : null;

    if (messageId) {
      const msgExists = db
        .prepare('SELECT id FROM messages WHERE id = ? AND conversation_id = ?')
        .get(messageId, convId);
      if (!msgExists) {
        res.status(404).json({ error: 'الرسالة غير موجودة في هذه المحادثة' });
        return;
      }
      db.prepare('UPDATE conversations SET pinned_message_id = ? WHERE id = ?').run(
        messageId,
        convId
      );
    } else {
      db.prepare('UPDATE conversations SET pinned_message_id = NULL WHERE id = ?').run(convId);
    }

    const pinnedMessage = getMappedMessageById(messageId);
    const peerId = getPeerIdFromConversation(conv, selfId);

    sendToUser(peerId, {
      type: 'conversation:pin',
      conversationId: convId,
      pinnedMessage,
    });
    sendToUser(selfId, {
      type: 'conversation:pin',
      conversationId: convId,
      pinnedMessage,
    });

    res.json({ pinnedMessage });
  });

  app.delete(
    '/api/conversations/:id/messages/:msgId',
    requireAuth,
    (req: AuthenticatedRequest, res) => {
      const selfId = req.authUser!.id;
      const convId = String(req.params.id || '');
      const msgId = String(req.params.msgId || '');
      const conv = isConversationMember(convId, selfId);
      if (!conv) {
        res.status(403).json({ error: 'غير مصرح بالوصول إلى هذه المحادثة' });
        return;
      }

      const msgRow = db
        .prepare('SELECT id, sender_id, file_id FROM messages WHERE id = ? AND conversation_id = ?')
        .get(msgId, convId) as
        | { id: string; sender_id: string; file_id: string | null }
        | undefined;
      if (!msgRow) {
        res.status(404).json({ error: 'الرسالة غير موجودة' });
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const scopeRaw = typeof body.scope === 'string' ? body.scope : String(req.query.scope || 'me');
      const scope = scopeRaw === 'everyone' ? 'everyone' : 'me';

      const getLastVisible = (viewerId: string) => {
        const lastRow = db
          .prepare(
            `SELECT m.*, f.original_name AS file_original_name, f.mime_type AS file_mime_type, f.size_bytes AS file_size_bytes
             FROM messages m
             LEFT JOIN files f ON m.file_id = f.id
             WHERE m.conversation_id = ?
               AND NOT EXISTS (
                 SELECT 1 FROM hidden_messages hm
                 WHERE hm.user_id = ? AND hm.message_scope = 'dm' AND hm.message_id = m.id
               )
             ORDER BY m.created_at DESC
             LIMIT 1`
          )
          .get(convId, viewerId) as DbMessageJoinRow | undefined;
        return lastRow ? mapMessageRow(lastRow) : null;
      };

      if (scope === 'me') {
        db.prepare(
          `INSERT OR IGNORE INTO hidden_messages (user_id, message_scope, message_id, created_at)
           VALUES (?, 'dm', ?, ?)`
        ).run(selfId, msgId, Date.now());

        const lastMessage = getLastVisible(selfId);
        res.json({ deleted: true, scope: 'me', messageId: msgId, lastMessage });
        return;
      }

      if (msgRow.sender_id !== selfId) {
        res.status(403).json({ error: 'يمكنك مسح رسائلك فقط لدى الجميع' });
        return;
      }

      const wasPinned = conv.pinned_message_id === msgId;
      if (wasPinned) {
        db.prepare('UPDATE conversations SET pinned_message_id = NULL WHERE id = ?').run(convId);
      }
      db.prepare('UPDATE messages SET reply_to_id = NULL WHERE reply_to_id = ?').run(msgId);
      db.prepare('DELETE FROM message_reactions WHERE message_id = ?').run(msgId);
      db.prepare(`DELETE FROM hidden_messages WHERE message_scope = 'dm' AND message_id = ?`).run(
        msgId
      );
      db.prepare('DELETE FROM messages WHERE id = ?').run(msgId);
      removeUploadedFileById(msgRow.file_id);

      const peerId = getPeerIdFromConversation(conv, selfId);
      const lastForSelf = getLastVisible(selfId);
      const lastForPeer = getLastVisible(peerId);

      sendToUser(selfId, {
        type: 'message:deleted',
        conversationId: convId,
        messageId: msgId,
        scope: 'everyone',
        wasPinned,
        lastMessage: lastForSelf,
      });
      sendToUser(peerId, {
        type: 'message:deleted',
        conversationId: convId,
        messageId: msgId,
        scope: 'everyone',
        wasPinned,
        lastMessage: lastForPeer,
      });

      res.json({
        deleted: true,
        scope: 'everyone',
        messageId: msgId,
        wasPinned,
        lastMessage: lastForSelf,
      });
    }
  );

  app.post(
    '/api/conversations/:id/messages/bulk-delete',
    requireAuth,
    (req: AuthenticatedRequest, res) => {
      const selfId = req.authUser!.id;
      const convId = String(req.params.id || '');
      const conv = isConversationMember(convId, selfId);
      if (!conv) {
        res.status(403).json({ error: 'غير مصرح بالوصول إلى هذه المحادثة' });
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const rawIds = Array.isArray(body.messageIds) ? body.messageIds : [];
      const messageIds = Array.from(
        new Set(rawIds.filter((x): x is string => typeof x === 'string' && x.trim().length > 0))
      ).slice(0, 300);

      if (messageIds.length === 0) {
        res.status(400).json({ error: 'لم يتم تحديد أي رسائل للحذف' });
        return;
      }

      const scope = body.scope === 'everyone' ? 'everyone' : 'me';
      const placeholders = messageIds.map(() => '?').join(',');
      const msgRows = db
        .prepare(
          `SELECT id, sender_id, file_id FROM messages WHERE conversation_id = ? AND id IN (${placeholders})`
        )
        .all(convId, ...messageIds) as Array<{
        id: string;
        sender_id: string;
        file_id: string | null;
      }>;

      if (msgRows.length === 0) {
        res.status(404).json({ error: 'الرسائل المحددة غير موجودة' });
        return;
      }

      const getLastVisible = (viewerId: string) => {
        const lastRow = db
          .prepare(
            `SELECT m.*, f.original_name AS file_original_name, f.mime_type AS file_mime_type, f.size_bytes AS file_size_bytes
             FROM messages m
             LEFT JOIN files f ON m.file_id = f.id
             WHERE m.conversation_id = ?
               AND NOT EXISTS (
                 SELECT 1 FROM hidden_messages hm
                 WHERE hm.user_id = ? AND hm.message_scope = 'dm' AND hm.message_id = m.id
               )
             ORDER BY m.created_at DESC
             LIMIT 1`
          )
          .get(convId, viewerId) as DbMessageJoinRow | undefined;
        return lastRow ? mapMessageRow(lastRow) : null;
      };

      const validIds = msgRows.map((r) => r.id);

      if (scope === 'me') {
        const now = Date.now();
        const insertHide = db.prepare(
          `INSERT OR IGNORE INTO hidden_messages (user_id, message_scope, message_id, created_at)
           VALUES (?, 'dm', ?, ?)`
        );
        const runHide = db.transaction((ids: string[]) => {
          for (const id of ids) insertHide.run(selfId, id, now);
        });
        runHide(validIds);

        res.json({
          deleted: true,
          scope: 'me',
          deletedIds: validIds,
          lastMessage: getLastVisible(selfId),
        });
        return;
      }

      if (msgRows.some((r) => r.sender_id !== selfId)) {
        res.status(403).json({ error: 'يمكنك مسح رسائلك فقط لدى الجميع' });
        return;
      }

      const wasPinned = Boolean(conv.pinned_message_id && validIds.includes(conv.pinned_message_id));
      const validPlaceholders = validIds.map(() => '?').join(',');
      const runDeleteEveryone = db.transaction((ids: string[]) => {
        if (wasPinned) {
          db.prepare('UPDATE conversations SET pinned_message_id = NULL WHERE id = ?').run(convId);
        }
        db.prepare(
          `UPDATE messages SET reply_to_id = NULL WHERE reply_to_id IN (${validPlaceholders})`
        ).run(...ids);
        db.prepare(
          `DELETE FROM message_reactions WHERE message_id IN (${validPlaceholders})`
        ).run(...ids);
        db.prepare(
          `DELETE FROM hidden_messages WHERE message_scope = 'dm' AND message_id IN (${validPlaceholders})`
        ).run(...ids);
        db.prepare(`DELETE FROM messages WHERE id IN (${validPlaceholders})`).run(...ids);
      });
      runDeleteEveryone(validIds);

      for (const r of msgRows) {
        removeUploadedFileById(r.file_id);
      }

      const peerId = getPeerIdFromConversation(conv, selfId);
      const lastForSelf = getLastVisible(selfId);
      const lastForPeer = getLastVisible(peerId);

      sendToUser(selfId, {
        type: 'messages:deleted-bulk',
        conversationId: convId,
        messageIds: validIds,
        scope: 'everyone',
        wasPinned,
        lastMessage: lastForSelf,
      });
      sendToUser(peerId, {
        type: 'messages:deleted-bulk',
        conversationId: convId,
        messageIds: validIds,
        scope: 'everyone',
        wasPinned,
        lastMessage: lastForPeer,
      });

      res.json({
        deleted: true,
        scope: 'everyone',
        deletedIds: validIds,
        wasPinned,
        lastMessage: lastForSelf,
      });
    }
  );

  app.post('/api/upload', requireAuth, (req: AuthenticatedRequest, res) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message || 'فشل رفع الملف' });
        return;
      }
      const uploaded = req.file;
      if (!uploaded) {
        res.status(400).json({ error: 'لم يتم تحديد ملف للرفع' });
        return;
      }

      const selfId = req.authUser!.id;
      const conversationId =
        typeof req.body?.conversationId === 'string' ? req.body.conversationId.trim() : '';
      const groupId = typeof req.body?.groupId === 'string' ? req.body.groupId.trim() : '';

      let scopeKey = '';
      if (conversationId && isConversationMember(conversationId, selfId)) {
        scopeKey = conversationId;
      } else if (groupId && isGroupMember(groupId, selfId)) {
        scopeKey = `group:${groupId}`;
      } else {
        fs.unlink(uploaded.path, () => {});
        res.status(403).json({ error: 'غير مصرح برفع ملفات لهذا السياق' });
        return;
      }

      const fileId = crypto.randomUUID();
      const baseMime =
        (uploaded.mimetype || 'application/octet-stream')
          .split(';')[0]
          .trim()
          .toLowerCase() || 'application/octet-stream';
      const rawOrig = uploaded.originalname || 'file';
      const needsUtf8Fix =
        /[\u0080-\u00ff]/.test(rawOrig) && !/[^\u0000-\u00ff]/.test(rawOrig);
      const decodedOrig = needsUtf8Fix ? Buffer.from(rawOrig, 'latin1').toString('utf8') : rawOrig;
      const safeOriginalName = path.basename(decodedOrig).slice(0, 180) || 'file';
      const now = Date.now();

      db.prepare(
        `INSERT INTO files (id, uploader_id, conversation_id, original_name, stored_name, mime_type, size_bytes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        fileId,
        selfId,
        scopeKey,
        safeOriginalName,
        uploaded.filename,
        baseMime,
        uploaded.size,
        now
      );

      res.status(201).json({
        file: {
          id: fileId,
          originalName: safeOriginalName,
          mimeType: baseMime,
          sizeBytes: uploaded.size,
        },
      });
    });
  });

  app.get('/api/files/:fileId', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const fileId = String(req.params.fileId || '');

    const fileRow = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId) as
      | {
          id: string;
          conversation_id: string;
          original_name: string;
          stored_name: string;
          mime_type: string;
          size_bytes: number;
        }
      | undefined;

    if (!fileRow) {
      res.status(404).json({ error: 'الملف غير موجود' });
      return;
    }

    const isAllowed = fileRow.conversation_id.startsWith('group:')
      ? Boolean(isGroupMember(fileRow.conversation_id.slice(6), selfId))
      : Boolean(isConversationMember(fileRow.conversation_id, selfId));

    if (!isAllowed) {
      res.status(403).json({ error: 'غير مصرح بالوصول إلى هذا الملف' });
      return;
    }

    const resolvedPath = path.resolve(UPLOAD_DIR, fileRow.stored_name);
    if (!resolvedPath.startsWith(UPLOAD_DIR + path.sep) || !fs.existsSync(resolvedPath)) {
      res.status(404).json({ error: 'الملف غير متاح على الخادم' });
      return;
    }

    const disposition = INLINE_SAFE_MIMES.has(fileRow.mime_type) ? 'inline' : 'attachment';
    const encodedName = encodeURIComponent(fileRow.original_name);
    res.setHeader('Content-Type', fileRow.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodedName}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.sendFile(resolvedPath);
  });

  app.get('/api/users/lookup', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const raw = typeof req.query.handle === 'string' ? req.query.handle : '';
    const handle = normalizeUsername(raw);
    if (!handle) {
      res.status(400).json({ error: 'يرجى إدخال معرف الحساب' });
      return;
    }
    const row = db
      .prepare('SELECT * FROM users WHERE username = ? AND id != ?')
      .get(handle, selfId) as DbUserRow | undefined;
    if (!row) {
      res.status(404).json({ error: `لم يتم العثور على حساب بالمعرف @${handle}` });
      return;
    }
    res.json({ user: toPublicUser(row, selfId) });
  });

  // Private Groups Endpoints
  app.get('/api/groups', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const rows = db
      .prepare(
        `SELECT g.* FROM groups g
         JOIN group_members gm ON g.id = gm.group_id
         WHERE gm.user_id = ?
         ORDER BY g.updated_at DESC`
      )
      .all(selfId) as DbGroupRow[];

    res.json({ groups: rows.map((g) => buildGroupSummary(g, selfId)) });
  });

  app.post('/api/groups', requireAuth, (req: AuthenticatedRequest, res) => {
    const self = req.authUser!;
    const body = req.body as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 60) : '';
    const description =
      typeof body.description === 'string' ? body.description.trim().slice(0, 300) : '';
    const promoText =
      typeof body.promoText === 'string' ? body.promoText.trim().slice(0, 300) : '';
    const avatarUrl = isSafeMediaUrl(body.avatarUrl) ? body.avatarUrl.trim() : '';
    const extraLinks = sanitizeExtraLinks(body.extraLinks);
    const memberIdsRaw = Array.isArray(body.memberIds) ? body.memberIds : [];

    if (name.length < 2) {
      res.status(400).json({ error: 'يجب أن يكون اسم المجموعة حرفين على الأقل' });
      return;
    }

    const friendSet = new Set(getFriendIds(self.id));
    const validMemberIds = Array.from(
      new Set(
        memberIdsRaw.filter(
          (id): id is string => typeof id === 'string' && id !== self.id && friendSet.has(id)
        )
      )
    ).slice(0, 50);

    const now = Date.now();
    const id = crypto.randomUUID();
    const inviteCode = crypto.randomBytes(4).toString('hex');

    db.prepare(
      `INSERT INTO groups (id, name, description, promo_text, extra_links, avatar_url, invite_code, owner_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      name,
      description,
      promoText,
      JSON.stringify(extraLinks),
      avatarUrl,
      inviteCode,
      self.id,
      now,
      now
    );

    const insertMember = db.prepare(
      'INSERT OR IGNORE INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)'
    );
    insertMember.run(id, self.id, 'owner', now);
    for (const memberId of validMemberIds) {
      insertMember.run(id, memberId, 'member', now);
    }

    const createdRow = db.prepare('SELECT * FROM groups WHERE id = ?').get(id) as DbGroupRow;
    for (const memberId of validMemberIds) {
      sendToUser(memberId, {
        type: 'group:added',
        group: buildGroupSummary(createdRow, memberId),
      });
    }

    res.status(201).json({ group: buildGroupSummary(createdRow, self.id) });
  });

  app.patch('/api/groups/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const groupId = String(req.params.id || '');
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId) as
      | DbGroupRow
      | undefined;

    if (!group) {
      res.status(404).json({ error: 'المجموعة غير موجودة' });
      return;
    }
    if (group.owner_id !== selfId) {
      res.status(403).json({ error: 'تعديل إعدادات المجموعة متاح للمنشئ فقط' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const name =
      typeof body.name === 'string' && body.name.trim().length >= 2
        ? body.name.trim().slice(0, 60)
        : group.name;
    const description =
      typeof body.description === 'string' ? body.description.trim().slice(0, 300) : group.description;
    const promoText =
      typeof body.promoText === 'string' ? body.promoText.trim().slice(0, 300) : group.promo_text;
    const avatarUrl =
      body.avatarUrl === ''
        ? ''
        : isSafeMediaUrl(body.avatarUrl)
          ? body.avatarUrl.trim()
          : group.avatar_url;
    const extraLinks =
      body.extraLinks !== undefined
        ? JSON.stringify(sanitizeExtraLinks(body.extraLinks))
        : group.extra_links;

    db.prepare(
      `UPDATE groups
       SET name = ?, description = ?, promo_text = ?, extra_links = ?, avatar_url = ?, updated_at = ?
       WHERE id = ?`
    ).run(name, description, promoText, extraLinks, avatarUrl, Date.now(), groupId);

    const updated = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId) as DbGroupRow;
    for (const memberId of getGroupMemberIds(groupId)) {
      sendToUser(memberId, {
        type: 'group:updated',
        group: buildGroupSummary(updated, memberId),
      });
    }

    res.json({ group: buildGroupSummary(updated, selfId) });
  });

  app.post('/api/groups/:id/members', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const groupId = String(req.params.id || '');
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId) as
      | DbGroupRow
      | undefined;

    if (!group) {
      res.status(404).json({ error: 'المجموعة غير موجودة' });
      return;
    }
    if (group.owner_id !== selfId) {
      res.status(403).json({ error: 'إضافة الأعضاء متاحة لمنشئ المجموعة فقط' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const memberIdsRaw = Array.isArray(body.memberIds) ? body.memberIds : [];
    const friendSet = new Set(getFriendIds(selfId));
    const validIds = Array.from(
      new Set(
        memberIdsRaw.filter(
          (id): id is string => typeof id === 'string' && id !== selfId && friendSet.has(id)
        )
      )
    );

    const now = Date.now();
    const stmtInsert = db.prepare(
      'INSERT OR IGNORE INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)'
    );
    const newlyAdded: string[] = [];
    for (const uid of validIds) {
      const info = stmtInsert.run(groupId, uid, 'member', now);
      if (info.changes > 0) newlyAdded.push(uid);
    }

    db.prepare('UPDATE groups SET updated_at = ? WHERE id = ?').run(now, groupId);
    const updated = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId) as DbGroupRow;

    for (const memberId of getGroupMemberIds(groupId)) {
      sendToUser(memberId, {
        type: newlyAdded.includes(memberId) ? 'group:added' : 'group:updated',
        group: buildGroupSummary(updated, memberId),
      });
    }

    res.json({ group: buildGroupSummary(updated, selfId) });
  });

  app.post('/api/groups/join/:inviteCode', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const inviteCode = String(req.params.inviteCode || '').trim().toLowerCase();
    const group = db
      .prepare('SELECT * FROM groups WHERE LOWER(invite_code) = ?')
      .get(inviteCode) as DbGroupRow | undefined;
    if (!group) {
      res.status(404).json({ error: 'رابط دعوة المجموعة غير صالح أو منتهي' });
      return;
    }

    db.prepare(
      'INSERT OR IGNORE INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)'
    ).run(group.id, selfId, 'member', Date.now());

    const updated = db.prepare('SELECT * FROM groups WHERE id = ?').get(group.id) as DbGroupRow;
    for (const memberId of getGroupMemberIds(group.id)) {
      sendToUser(memberId, {
        type: 'group:updated',
        group: buildGroupSummary(updated, memberId),
      });
    }

    res.json({ group: buildGroupSummary(updated, selfId) });
  });

  app.get('/api/groups/:id/messages', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const groupId = String(req.params.id || '');
    if (!isGroupMember(groupId, selfId)) {
      res.status(403).json({ error: 'غير مصرح بالوصول إلى رسائل هذه المجموعة' });
      return;
    }

    const rows = db
      .prepare(
        `SELECT gm.*, u.display_name AS sender_name, u.username AS sender_username,
                u.avatar_color AS sender_avatar_color, u.avatar_url AS sender_avatar_url,
                f.original_name AS file_original_name, f.mime_type AS file_mime_type, f.size_bytes AS file_size_bytes
         FROM group_messages gm
         JOIN users u ON gm.sender_id = u.id
         LEFT JOIN files f ON gm.file_id = f.id
         WHERE gm.group_id = ?
           AND NOT EXISTS (
             SELECT 1 FROM hidden_messages hm
             WHERE hm.user_id = ? AND hm.message_scope = 'group' AND hm.message_id = gm.id
           )
         ORDER BY gm.created_at ASC
         LIMIT 300`
      )
      .all(groupId, selfId) as Array<{
      id: string;
      group_id: string;
      sender_id: string;
      sender_name: string;
      sender_username: string;
      sender_avatar_color: string;
      sender_avatar_url: string;
      type: string;
      content: string;
      file_id: string | null;
      duration_sec: number | null;
      created_at: number;
      file_original_name: string | null;
      file_mime_type: string | null;
      file_size_bytes: number | null;
    }>;

    res.json({
      messages: rows.map((r) => ({
        id: r.id,
        groupId: r.group_id,
        senderId: r.sender_id,
        senderName: r.sender_name,
        senderUsername: r.sender_username,
        senderAvatarColor: r.sender_avatar_color,
        senderAvatarUrl: r.sender_avatar_url || null,
        type: r.type,
        content: r.content,
        file: r.file_id
          ? {
              id: r.file_id,
              originalName: r.file_original_name ?? 'file',
              mimeType: r.file_mime_type ?? 'application/octet-stream',
              sizeBytes: r.file_size_bytes ?? 0,
            }
          : null,
        durationSec: r.duration_sec,
        createdAt: r.created_at,
      })),
    });
  });

  app.post('/api/groups/:id/messages', requireAuth, (req: AuthenticatedRequest, res) => {
    const self = req.authUser!;
    const groupId = String(req.params.id || '');
    if (!isGroupMember(groupId, self.id)) {
      res.status(403).json({ error: 'غير مصرح بالإرسال في هذه المجموعة' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const type = typeof body.type === 'string' ? body.type : 'text';
    const content = typeof body.content === 'string' ? body.content.trim().slice(0, 4000) : '';
    const fileId = typeof body.fileId === 'string' ? body.fileId : null;
    const durationSec =
      typeof body.durationSec === 'number' && Number.isFinite(body.durationSec)
        ? Math.max(0, Math.min(3600, body.durationSec))
        : null;

    if (!['text', 'voice', 'file'].includes(type)) {
      res.status(400).json({ error: 'نوع الرسالة غير صالح' });
      return;
    }
    if (type === 'text' && !content) {
      res.status(400).json({ error: 'لا يمكن إرسال رسالة فارغة' });
      return;
    }

    let fileAttachment = null;
    if (type === 'voice' || type === 'file') {
      if (!fileId) {
        res.status(400).json({ error: 'الملف المرفق مفقود' });
        return;
      }
      const fileRow = db
        .prepare('SELECT * FROM files WHERE id = ? AND conversation_id = ? AND uploader_id = ?')
        .get(fileId, `group:${groupId}`, self.id) as
        | { id: string; original_name: string; mime_type: string; size_bytes: number }
        | undefined;
      if (!fileRow) {
        res.status(404).json({ error: 'تعذر العثور على الملف المرفق' });
        return;
      }
      fileAttachment = {
        id: fileRow.id,
        originalName: fileRow.original_name,
        mimeType: fileRow.mime_type,
        sizeBytes: fileRow.size_bytes,
      };
    }

    const now = Date.now();
    const msgId = crypto.randomUUID();
    db.prepare(
      `INSERT INTO group_messages (id, group_id, sender_id, type, content, file_id, duration_sec, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(msgId, groupId, self.id, type, content, fileId, durationSec, now);

    db.prepare('UPDATE groups SET updated_at = ? WHERE id = ?').run(now, groupId);

    const message = {
      id: msgId,
      groupId,
      senderId: self.id,
      senderName: self.display_name,
      senderUsername: self.username,
      senderAvatarColor: self.avatar_color,
      senderAvatarUrl: self.avatar_url || null,
      type,
      content,
      file: fileAttachment,
      durationSec,
      createdAt: now,
    };

    for (const memberId of getGroupMemberIds(groupId)) {
      sendToUser(memberId, { type: 'group:message', message });
    }

    res.status(201).json({ message });
  });

  app.delete('/api/groups/:id/messages/:msgId', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const groupId = String(req.params.id || '');
    const msgId = String(req.params.msgId || '');

    if (!isGroupMember(groupId, selfId)) {
      res.status(403).json({ error: 'غير مصرح بالوصول إلى هذه المجموعة' });
      return;
    }

    const group = db.prepare('SELECT id, owner_id FROM groups WHERE id = ?').get(groupId) as
      | { id: string; owner_id: string }
      | undefined;
    if (!group) {
      res.status(404).json({ error: 'المجموعة غير موجودة' });
      return;
    }

    const msgRow = db
      .prepare('SELECT id, sender_id, file_id FROM group_messages WHERE id = ? AND group_id = ?')
      .get(msgId, groupId) as
      | { id: string; sender_id: string; file_id: string | null }
      | undefined;
    if (!msgRow) {
      res.status(404).json({ error: 'الرسالة غير موجودة' });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const scopeRaw = typeof body.scope === 'string' ? body.scope : String(req.query.scope || 'me');
    const scope = scopeRaw === 'everyone' ? 'everyone' : 'me';

    const getLastVisibleGroupMsg = (viewerId: string) => {
      const r = db
        .prepare(
          `SELECT gm.*, u.display_name AS sender_name, u.username AS sender_username,
                  u.avatar_color AS sender_avatar_color, u.avatar_url AS sender_avatar_url,
                  f.original_name AS file_original_name, f.mime_type AS file_mime_type, f.size_bytes AS file_size_bytes
           FROM group_messages gm
           JOIN users u ON gm.sender_id = u.id
           LEFT JOIN files f ON gm.file_id = f.id
           WHERE gm.group_id = ?
             AND NOT EXISTS (
               SELECT 1 FROM hidden_messages hm
               WHERE hm.user_id = ? AND hm.message_scope = 'group' AND hm.message_id = gm.id
             )
           ORDER BY gm.created_at DESC
           LIMIT 1`
        )
        .get(groupId, viewerId) as
        | {
            id: string;
            group_id: string;
            sender_id: string;
            sender_name: string;
            sender_username: string;
            sender_avatar_color: string;
            sender_avatar_url: string;
            type: string;
            content: string;
            file_id: string | null;
            duration_sec: number | null;
            created_at: number;
            file_original_name: string | null;
            file_mime_type: string | null;
            file_size_bytes: number | null;
          }
        | undefined;
      if (!r) return null;
      return {
        id: r.id,
        groupId: r.group_id,
        senderId: r.sender_id,
        senderName: r.sender_name,
        senderUsername: r.sender_username,
        senderAvatarColor: r.sender_avatar_color,
        senderAvatarUrl: r.sender_avatar_url || null,
        type: r.type,
        content: r.content,
        file: r.file_id
          ? {
              id: r.file_id,
              originalName: r.file_original_name ?? 'file',
              mimeType: r.file_mime_type ?? 'application/octet-stream',
              sizeBytes: r.file_size_bytes ?? 0,
            }
          : null,
        durationSec: r.duration_sec,
        createdAt: r.created_at,
      };
    };

    if (scope === 'me') {
      db.prepare(
        `INSERT OR IGNORE INTO hidden_messages (user_id, message_scope, message_id, created_at)
         VALUES (?, 'group', ?, ?)`
      ).run(selfId, msgId, Date.now());
      res.json({
        deleted: true,
        scope: 'me',
        messageId: msgId,
        lastMessage: getLastVisibleGroupMsg(selfId),
      });
      return;
    }

    if (msgRow.sender_id !== selfId && group.owner_id !== selfId) {
      res.status(403).json({ error: 'يمكنك مسح رسائلك فقط لدى الجميع' });
      return;
    }

    db.prepare(`DELETE FROM hidden_messages WHERE message_scope = 'group' AND message_id = ?`).run(
      msgId
    );
    db.prepare('DELETE FROM group_messages WHERE id = ?').run(msgId);
    removeUploadedFileById(msgRow.file_id);

    for (const memberId of getGroupMemberIds(groupId)) {
      sendToUser(memberId, {
        type: 'group:message:deleted',
        groupId,
        messageId: msgId,
        scope: 'everyone',
        lastMessage: getLastVisibleGroupMsg(memberId),
      });
    }

    res.json({
      deleted: true,
      scope: 'everyone',
      messageId: msgId,
      lastMessage: getLastVisibleGroupMsg(selfId),
    });
  });

  app.post('/api/groups/:id/messages/bulk-delete', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const groupId = String(req.params.id || '');

    if (!isGroupMember(groupId, selfId)) {
      res.status(403).json({ error: 'غير مصرح بالوصول إلى هذه المجموعة' });
      return;
    }

    const group = db.prepare('SELECT id, owner_id FROM groups WHERE id = ?').get(groupId) as
      | { id: string; owner_id: string }
      | undefined;
    if (!group) {
      res.status(404).json({ error: 'المجموعة غير موجودة' });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const rawIds = Array.isArray(body.messageIds) ? body.messageIds : [];
    const messageIds = Array.from(
      new Set(rawIds.filter((x): x is string => typeof x === 'string' && x.trim().length > 0))
    ).slice(0, 300);

    if (messageIds.length === 0) {
      res.status(400).json({ error: 'لم يتم تحديد أي رسائل للحذف' });
      return;
    }

    const scope = body.scope === 'everyone' ? 'everyone' : 'me';
    const placeholders = messageIds.map(() => '?').join(',');
    const msgRows = db
      .prepare(
        `SELECT id, sender_id, file_id FROM group_messages WHERE group_id = ? AND id IN (${placeholders})`
      )
      .all(groupId, ...messageIds) as Array<{
      id: string;
      sender_id: string;
      file_id: string | null;
    }>;

    if (msgRows.length === 0) {
      res.status(404).json({ error: 'الرسائل المحددة غير موجودة' });
      return;
    }

    const getLastVisibleGroupMsg = (viewerId: string) => {
      const r = db
        .prepare(
          `SELECT gm.*, u.display_name AS sender_name, u.username AS sender_username,
                  u.avatar_color AS sender_avatar_color, u.avatar_url AS sender_avatar_url,
                  f.original_name AS file_original_name, f.mime_type AS file_mime_type, f.size_bytes AS file_size_bytes
           FROM group_messages gm
           JOIN users u ON gm.sender_id = u.id
           LEFT JOIN files f ON gm.file_id = f.id
           WHERE gm.group_id = ?
             AND NOT EXISTS (
               SELECT 1 FROM hidden_messages hm
               WHERE hm.user_id = ? AND hm.message_scope = 'group' AND hm.message_id = gm.id
             )
           ORDER BY gm.created_at DESC
           LIMIT 1`
        )
        .get(groupId, viewerId) as
        | {
            id: string;
            group_id: string;
            sender_id: string;
            sender_name: string;
            sender_username: string;
            sender_avatar_color: string;
            sender_avatar_url: string;
            type: string;
            content: string;
            file_id: string | null;
            duration_sec: number | null;
            created_at: number;
            file_original_name: string | null;
            file_mime_type: string | null;
            file_size_bytes: number | null;
          }
        | undefined;
      if (!r) return null;
      return {
        id: r.id,
        groupId: r.group_id,
        senderId: r.sender_id,
        senderName: r.sender_name,
        senderUsername: r.sender_username,
        senderAvatarColor: r.sender_avatar_color,
        senderAvatarUrl: r.sender_avatar_url || null,
        type: r.type,
        content: r.content,
        file: r.file_id
          ? {
              id: r.file_id,
              originalName: r.file_original_name ?? 'file',
              mimeType: r.file_mime_type ?? 'application/octet-stream',
              sizeBytes: r.file_size_bytes ?? 0,
            }
          : null,
        durationSec: r.duration_sec,
        createdAt: r.created_at,
      };
    };

    const validIds = msgRows.map((r) => r.id);

    if (scope === 'me') {
      const now = Date.now();
      const insertHide = db.prepare(
        `INSERT OR IGNORE INTO hidden_messages (user_id, message_scope, message_id, created_at)
         VALUES (?, 'group', ?, ?)`
      );
      const runHide = db.transaction((ids: string[]) => {
        for (const id of ids) insertHide.run(selfId, id, now);
      });
      runHide(validIds);

      res.json({
        deleted: true,
        scope: 'me',
        deletedIds: validIds,
        lastMessage: getLastVisibleGroupMsg(selfId),
      });
      return;
    }

    if (group.owner_id !== selfId && msgRows.some((r) => r.sender_id !== selfId)) {
      res.status(403).json({ error: 'يمكنك مسح رسائلك فقط لدى الجميع' });
      return;
    }

    const validPlaceholders = validIds.map(() => '?').join(',');
    const runDeleteEveryone = db.transaction((ids: string[]) => {
      db.prepare(
        `DELETE FROM hidden_messages WHERE message_scope = 'group' AND message_id IN (${validPlaceholders})`
      ).run(...ids);
      db.prepare(`DELETE FROM group_messages WHERE id IN (${validPlaceholders})`).run(...ids);
    });
    runDeleteEveryone(validIds);

    for (const r of msgRows) {
      removeUploadedFileById(r.file_id);
    }

    for (const memberId of getGroupMemberIds(groupId)) {
      sendToUser(memberId, {
        type: 'group:messages:deleted-bulk',
        groupId,
        messageIds: validIds,
        scope: 'everyone',
        lastMessage: getLastVisibleGroupMsg(memberId),
      });
    }

    res.json({
      deleted: true,
      scope: 'everyone',
      deletedIds: validIds,
      lastMessage: getLastVisibleGroupMsg(selfId),
    });
  });

  app.get('/api/channels', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const qRaw = typeof req.query.q === 'string' ? req.query.q.trim().replace(/^@+/, '').toLowerCase() : '';

    const rows = (
      qRaw
        ? db
            .prepare(
              `SELECT c.*, u.display_name AS owner_name
               FROM channels c
               JOIN users u ON c.owner_id = u.id
               WHERE LOWER(c.name) LIKE ? OR LOWER(c.handle) LIKE ?
               ORDER BY c.created_at DESC
               LIMIT 50`
            )
            .all(`%${qRaw}%`, `%${qRaw}%`)
        : db
            .prepare(
              `SELECT c.*, u.display_name AS owner_name
               FROM channels c
               JOIN users u ON c.owner_id = u.id
               ORDER BY c.created_at DESC
               LIMIT 50`
            )
            .all()
    ) as Array<{
      id: string;
      handle: string;
      name: string;
      description: string;
      avatar_url: string;
      owner_id: string;
      owner_name: string;
      created_at: number;
    }>;

    const stmtCount = db.prepare('SELECT COUNT(*) AS cnt FROM channel_members WHERE channel_id = ?');
    const stmtMember = db.prepare(
      'SELECT 1 FROM channel_members WHERE channel_id = ? AND user_id = ?'
    );
    const stmtLastPost = db.prepare(
      'SELECT content, created_at FROM channel_posts WHERE channel_id = ? ORDER BY created_at DESC LIMIT 1'
    );

    const channels = rows.map((r) => {
      const countRow = stmtCount.get(r.id) as { cnt: number };
      const isMember = Boolean(stmtMember.get(r.id, selfId));
      const lastPost = stmtLastPost.get(r.id) as
        | { content: string; created_at: number }
        | undefined;
      return {
        id: r.id,
        handle: r.handle,
        name: r.name,
        description: r.description,
        avatarUrl: r.avatar_url || null,
        ownerId: r.owner_id,
        ownerName: r.owner_name,
        memberCount: countRow.cnt,
        isMember,
        isOwner: r.owner_id === selfId,
        lastPostContent: lastPost?.content ?? null,
        lastPostAt: lastPost?.created_at ?? null,
        createdAt: r.created_at,
      };
    });

    res.json({ channels });
  });

  app.post('/api/channels', requireAuth, (req: AuthenticatedRequest, res) => {
    const self = req.authUser!;
    const body = req.body as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const rawHandle = typeof body.handle === 'string' ? body.handle : '';
    const description = typeof body.description === 'string' ? body.description.trim().slice(0, 200) : '';
    const avatarUrl = isSafeMediaUrl(body.avatarUrl) ? body.avatarUrl.trim() : '';

    if (name.length < 2 || name.length > 50) {
      res.status(400).json({ error: 'اسم القناة يجب أن يكون بين حرفين و50 حرفاً' });
      return;
    }

    const handle = normalizeUsername(rawHandle);
    const validation = validateUsernameFormat(handle);
    if (!validation.valid) {
      res.status(400).json({ error: validation.reason });
      return;
    }

    const existing = db.prepare('SELECT id FROM channels WHERE handle = ?').get(handle);
    if (existing) {
      res.status(409).json({ error: `معرف القناة @${handle} مستخدم بالفعل` });
      return;
    }

    const now = Date.now();
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO channels (id, handle, name, description, avatar_url, owner_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, handle, name, description, avatarUrl, self.id, now);

    db.prepare(
      'INSERT INTO channel_members (channel_id, user_id, joined_at) VALUES (?, ?, ?)'
    ).run(id, self.id, now);

    const channel = {
      id,
      handle,
      name,
      description,
      avatarUrl: avatarUrl || null,
      ownerId: self.id,
      ownerName: self.display_name,
      memberCount: 1,
      isMember: true,
      isOwner: true,
      lastPostContent: null,
      lastPostAt: null,
      createdAt: now,
    };

    broadcastAll({ type: 'channel:created', channel });
    res.status(201).json({ channel });
  });

  app.patch('/api/channels/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const self = req.authUser!;
    const channelId = String(req.params.id || '');
    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId) as
      | {
          id: string;
          handle: string;
          name: string;
          description: string;
          avatar_url: string;
          owner_id: string;
          created_at: number;
        }
      | undefined;

    if (!channel) {
      res.status(404).json({ error: 'القناة غير موجودة' });
      return;
    }
    if (channel.owner_id !== self.id) {
      res.status(403).json({ error: 'تعديل القناة متاح للمنشئ فقط' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const name =
      typeof body.name === 'string' && body.name.trim().length >= 2
        ? body.name.trim().slice(0, 50)
        : channel.name;
    const description =
      typeof body.description === 'string' ? body.description.trim().slice(0, 200) : channel.description;
    const avatarUrl =
      body.avatarUrl === ''
        ? ''
        : isSafeMediaUrl(body.avatarUrl)
          ? body.avatarUrl.trim()
          : channel.avatar_url;

    db.prepare('UPDATE channels SET name = ?, description = ?, avatar_url = ? WHERE id = ?').run(
      name,
      description,
      avatarUrl,
      channelId
    );

    const countRow = db
      .prepare('SELECT COUNT(*) AS cnt FROM channel_members WHERE channel_id = ?')
      .get(channelId) as { cnt: number };
    const lastPost = db
      .prepare('SELECT content, created_at FROM channel_posts WHERE channel_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(channelId) as { content: string; created_at: number } | undefined;

    const updatedChannel = {
      id: channel.id,
      handle: channel.handle,
      name,
      description,
      avatarUrl: avatarUrl || null,
      ownerId: channel.owner_id,
      ownerName: self.display_name,
      memberCount: countRow.cnt,
      isMember: true,
      isOwner: true,
      lastPostContent: lastPost?.content ?? null,
      lastPostAt: lastPost?.created_at ?? null,
      createdAt: channel.created_at,
    };

    broadcastAll({ type: 'channel:updated', channel: updatedChannel });
    res.json({ channel: updatedChannel });
  });

  app.post('/api/channels/:id/join', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const channelId = String(req.params.id || '');
    const channel = db.prepare('SELECT id FROM channels WHERE id = ?').get(channelId);
    if (!channel) {
      res.status(404).json({ error: 'القناة غير موجودة' });
      return;
    }
    db.prepare(
      'INSERT OR IGNORE INTO channel_members (channel_id, user_id, joined_at) VALUES (?, ?, ?)'
    ).run(channelId, selfId, Date.now());
    const countRow = db
      .prepare('SELECT COUNT(*) AS cnt FROM channel_members WHERE channel_id = ?')
      .get(channelId) as { cnt: number };
    res.json({ isMember: true, memberCount: countRow.cnt });
  });

  app.delete('/api/channels/:id/join', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const channelId = String(req.params.id || '');
    db.prepare('DELETE FROM channel_members WHERE channel_id = ? AND user_id = ?').run(
      channelId,
      selfId
    );
    const countRow = db
      .prepare('SELECT COUNT(*) AS cnt FROM channel_members WHERE channel_id = ?')
      .get(channelId) as { cnt: number };
    res.json({ isMember: false, memberCount: countRow.cnt });
  });

  app.get('/api/channels/:id/posts', requireAuth, (req: AuthenticatedRequest, res) => {
    const channelId = String(req.params.id || '');
    const channel = db.prepare('SELECT id FROM channels WHERE id = ?').get(channelId);
    if (!channel) {
      res.status(404).json({ error: 'القناة غير موجودة' });
      return;
    }
    const rows = db
      .prepare(
        `SELECT p.*, u.display_name AS author_name
         FROM channel_posts p
         JOIN users u ON p.author_id = u.id
         WHERE p.channel_id = ?
         ORDER BY p.created_at ASC
         LIMIT 200`
      )
      .all(channelId) as Array<{
      id: string;
      channel_id: string;
      author_id: string;
      author_name: string;
      content: string;
      created_at: number;
    }>;

    res.json({
      posts: rows.map((r) => ({
        id: r.id,
        channelId: r.channel_id,
        authorId: r.author_id,
        authorName: r.author_name,
        content: r.content,
        createdAt: r.created_at,
      })),
    });
  });

  app.post('/api/channels/:id/posts', requireAuth, (req: AuthenticatedRequest, res) => {
    const self = req.authUser!;
    const channelId = String(req.params.id || '');
    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId) as
      | { id: string; owner_id: string }
      | undefined;
    if (!channel) {
      res.status(404).json({ error: 'القناة غير موجودة' });
      return;
    }
    if (channel.owner_id !== self.id) {
      res.status(403).json({ error: 'النشر متاح لمنشئ القناة فقط' });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const content = typeof body.content === 'string' ? body.content.trim().slice(0, 2000) : '';
    if (!content) {
      res.status(400).json({ error: 'محتوى المنشور فارغ' });
      return;
    }

    const now = Date.now();
    const id = crypto.randomUUID();
    db.prepare(
      'INSERT INTO channel_posts (id, channel_id, author_id, content, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, channelId, self.id, content, now);

    const post = {
      id,
      channelId,
      authorId: self.id,
      authorName: self.display_name,
      content,
      createdAt: now,
    };

    broadcastAll({ type: 'channel:post', post });
    res.status(201).json({ post });
  });

  app.get('/api/events', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const allowedCreatorIds = [selfId, ...getFriendIds(selfId)];
    const placeholders = allowedCreatorIds.map(() => '?').join(',');

    const rows = db
      .prepare(
        `SELECT e.*, u.display_name AS creator_name, u.username AS creator_username, u.avatar_color AS creator_avatar_color, u.avatar_url AS creator_avatar_url
         FROM events e
         JOIN users u ON e.creator_id = u.id
         WHERE e.creator_id IN (${placeholders})
         ORDER BY e.created_at DESC
         LIMIT 60`
      )
      .all(...allowedCreatorIds) as Array<{
      id: string;
      creator_id: string;
      creator_name: string;
      creator_username: string;
      creator_avatar_color: string;
      creator_avatar_url: string;
      event_type: string;
      title: string;
      description: string;
      event_time: string;
      location: string;
      media_urls: string;
      links: string;
      created_at: number;
    }>;

    const stmtCounts = db.prepare(
      `SELECT status, COUNT(*) AS cnt FROM event_rsvps WHERE event_id = ? GROUP BY status`
    );
    const stmtMine = db.prepare(
      'SELECT status FROM event_rsvps WHERE event_id = ? AND user_id = ?'
    );

    const events = rows.map((r) => {
      const counts = stmtCounts.all(r.id) as Array<{ status: string; cnt: number }>;
      let goingCount = 0;
      let interestedCount = 0;
      for (const c of counts) {
        if (c.status === 'going') goingCount = c.cnt;
        if (c.status === 'interested') interestedCount = c.cnt;
      }
      const mine = stmtMine.get(r.id, selfId) as { status: string } | undefined;
      return {
        id: r.id,
        creatorId: r.creator_id,
        creatorName: r.creator_name,
        creatorUsername: r.creator_username,
        creatorAvatarColor: r.creator_avatar_color,
        creatorAvatarUrl: r.creator_avatar_url || null,
        eventType: r.event_type === 'video' ? ('video' as const) : ('post' as const),
        title: r.title,
        description: r.description,
        eventTime: r.event_time,
        location: r.location,
        mediaUrls: parseJsonArray<string>(r.media_urls).filter((u) => isSafeMediaUrl(u)),
        links: parseJsonArray<{ label: string; url: string }>(r.links),
        goingCount,
        interestedCount,
        myRsvp: mine?.status ?? 'none',
        createdAt: r.created_at,
      };
    });

    res.json({ events });
  });

  app.post('/api/events', requireAuth, (req: AuthenticatedRequest, res) => {
    const self = req.authUser!;
    const body = req.body as Record<string, unknown>;
    const eventType = body.eventType === 'video' ? 'video' : 'post';
    const rawTitle = typeof body.title === 'string' ? body.title.trim().slice(0, 80) : '';
    const description =
      typeof body.description === 'string' ? body.description.trim().slice(0, 600) : '';
    const eventTime =
      typeof body.eventTime === 'string' ? body.eventTime.trim().slice(0, 60) : '';
    const location = typeof body.location === 'string' ? body.location.trim().slice(0, 80) : '';

    const mediaUrls = Array.isArray(body.mediaUrls)
      ? body.mediaUrls.filter((u): u is string => isSafeMediaUrl(u)).slice(0, 6)
      : [];
    const links = sanitizeExtraLinks(body.links);

    if (eventType === 'video' && mediaUrls.length === 0) {
      res.status(400).json({ error: 'يرجى رفع فيديو شورتس لنشر الحدث' });
      return;
    }

    const title = rawTitle || (eventType === 'video' ? 'فيديو شورتس' : '');
    if (title.length < 2) {
      res.status(400).json({ error: 'يرجى كتابة عنوان للحدث (حرفان على الأقل)' });
      return;
    }

    const now = Date.now();
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO events (id, creator_id, event_type, title, description, event_time, location, media_urls, links, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      self.id,
      eventType,
      title,
      description,
      eventTime || 'الآن',
      location,
      JSON.stringify(mediaUrls),
      JSON.stringify(links),
      now
    );

    db.prepare(
      'INSERT INTO event_rsvps (event_id, user_id, status) VALUES (?, ?, ?)'
    ).run(id, self.id, 'going');

    const eventItem = {
      id,
      creatorId: self.id,
      creatorName: self.display_name,
      creatorUsername: self.username,
      creatorAvatarColor: self.avatar_color,
      creatorAvatarUrl: self.avatar_url || null,
      eventType,
      title,
      description,
      eventTime: eventTime || 'الآن',
      location,
      mediaUrls,
      links,
      goingCount: 1,
      interestedCount: 0,
      myRsvp: 'going' as const,
      createdAt: now,
    };

    const recipientIds = new Set([self.id, ...getFriendIds(self.id)]);
    for (const uid of recipientIds) {
      sendToUser(uid, { type: 'event:created', event: eventItem });
    }
    res.status(201).json({ event: eventItem });
  });

  app.post('/api/events/:id/rsvp', requireAuth, (req: AuthenticatedRequest, res) => {
    const selfId = req.authUser!.id;
    const eventId = String(req.params.id || '');
    const eventRow = db
      .prepare('SELECT id, creator_id FROM events WHERE id = ?')
      .get(eventId) as { id: string; creator_id: string } | undefined;
    if (!eventRow) {
      res.status(404).json({ error: 'الحدث غير موجود' });
      return;
    }

    if (
      eventRow.creator_id !== selfId &&
      getFriendshipRelation(selfId, eventRow.creator_id) !== 'accepted'
    ) {
      res.status(403).json({ error: 'التفاعل متاح لأحداث الأصدقاء فقط' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const status = typeof body.status === 'string' ? body.status : 'none';
    if (!['going', 'interested', 'none'].includes(status)) {
      res.status(400).json({ error: 'حالة غير صالحة' });
      return;
    }

    if (status === 'none') {
      db.prepare('DELETE FROM event_rsvps WHERE event_id = ? AND user_id = ?').run(
        eventId,
        selfId
      );
    } else {
      db.prepare(
        `INSERT INTO event_rsvps (event_id, user_id, status) VALUES (?, ?, ?)
         ON CONFLICT(event_id, user_id) DO UPDATE SET status = excluded.status`
      ).run(eventId, selfId, status);
    }

    const counts = db
      .prepare('SELECT status, COUNT(*) AS cnt FROM event_rsvps WHERE event_id = ? GROUP BY status')
      .all(eventId) as Array<{ status: string; cnt: number }>;
    let goingCount = 0;
    let interestedCount = 0;
    for (const c of counts) {
      if (c.status === 'going') goingCount = c.cnt;
      if (c.status === 'interested') interestedCount = c.cnt;
    }

    const recipientIds = new Set([
      eventRow.creator_id,
      ...getFriendIds(eventRow.creator_id),
      selfId,
    ]);
    for (const uid of recipientIds) {
      sendToUser(uid, { type: 'event:rsvp', eventId, goingCount, interestedCount });
    }
    res.json({ myRsvp: status, goingCount, interestedCount });
  });

  app.get(['/retchat-project.zip', '/api/download-project'], (_req, res) => {
    const zipPath = path.resolve(process.cwd(), 'public', 'retchat-project.zip');
    if (!fs.existsSync(zipPath)) {
      res.status(404).json({ error: 'ملف المشروع غير متوفر حالياً' });
      return;
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="retchat-project.zip"');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(zipPath);
  });

  const httpServer = http.createServer(app);
  setupWebSocketServer(httpServer);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`RetChat server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
