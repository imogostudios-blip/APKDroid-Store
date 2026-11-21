import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOAD_DIR = path.resolve(DATA_DIR, 'uploads');
export const AVATAR_DIR = path.resolve(DATA_DIR, 'avatars');
export const MEDIA_DIR = path.resolve(DATA_DIR, 'media');
export const DEFAULT_CHAT_WALLPAPER = 'doodle-teal';
export const ALLOWED_WALLPAPERS = new Set(['doodle-teal', 'doodle-neon', 'doodle-rainbow']);

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(AVATAR_DIR, { recursive: true });
fs.mkdirSync(MEDIA_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, 'mersal.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    current_status TEXT NOT NULL DEFAULT 'متصل',
    needs_bio_onboarding INTEGER NOT NULL DEFAULT 1,
    avatar_color TEXT NOT NULL,
    avatar_url TEXT NOT NULL DEFAULT '',
    chat_wallpaper TEXT NOT NULL DEFAULT 'doodle-teal',
    last_seen INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS friendships (
    user_a TEXT NOT NULL,
    user_b TEXT NOT NULL,
    requester_id TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_a, user_b)
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_a TEXT NOT NULL,
    user_b TEXT NOT NULL,
    pinned_message_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(user_a, user_b)
  );

  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    uploader_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    file_id TEXT,
    duration_sec REAL,
    call_status TEXT,
    reply_to_id TEXT,
    status TEXT NOT NULL DEFAULT 'sent',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS message_reactions (
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (message_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    promo_text TEXT NOT NULL DEFAULT '',
    extra_links TEXT NOT NULL DEFAULT '[]',
    avatar_url TEXT NOT NULL DEFAULT '',
    invite_code TEXT UNIQUE NOT NULL,
    owner_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (group_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS group_messages (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    file_id TEXT,
    duration_sec REAL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    handle TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    owner_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS channel_members (
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (channel_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS channel_posts (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'post',
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    event_time TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    media_urls TEXT NOT NULL DEFAULT '[]',
    links TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS event_rsvps (
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL,
    PRIMARY KEY (event_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS hidden_messages (
    user_id TEXT NOT NULL,
    message_scope TEXT NOT NULL,
    message_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, message_scope, message_id)
  );

  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_friendships_a ON friendships(user_a, status);
  CREATE INDEX IF NOT EXISTS idx_friendships_b ON friendships(user_b, status);
  CREATE INDEX IF NOT EXISTS idx_conv_user_a ON conversations(user_a);
  CREATE INDEX IF NOT EXISTS idx_conv_user_b ON conversations(user_b);
  CREATE INDEX IF NOT EXISTS idx_messages_conv_time ON messages(conversation_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_reactions_msg ON message_reactions(message_id);
  CREATE INDEX IF NOT EXISTS idx_hidden_msgs ON hidden_messages(user_id, message_scope, message_id);
  CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
  CREATE INDEX IF NOT EXISTS idx_group_messages_time ON group_messages(group_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_channel_posts_time ON channel_posts(channel_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
`);

const userColumns = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
const userColNames = new Set(userColumns.map((c) => c.name));
if (!userColNames.has('avatar_url')) {
  db.exec(`ALTER TABLE users ADD COLUMN avatar_url TEXT NOT NULL DEFAULT ''`);
}
if (!userColNames.has('chat_wallpaper')) {
  db.exec(`ALTER TABLE users ADD COLUMN chat_wallpaper TEXT NOT NULL DEFAULT 'doodle-teal'`);
}
if (!userColNames.has('current_status')) {
  db.exec(`ALTER TABLE users ADD COLUMN current_status TEXT NOT NULL DEFAULT 'متصل'`);
}
if (!userColNames.has('needs_bio_onboarding')) {
  db.exec(`ALTER TABLE users ADD COLUMN needs_bio_onboarding INTEGER NOT NULL DEFAULT 1`);
}

const convColumns = db.prepare('PRAGMA table_info(conversations)').all() as Array<{ name: string }>;
if (!convColumns.some((c) => c.name === 'pinned_message_id')) {
  db.exec(`ALTER TABLE conversations ADD COLUMN pinned_message_id TEXT`);
}

const msgColumns = db.prepare('PRAGMA table_info(messages)').all() as Array<{ name: string }>;
if (!msgColumns.some((c) => c.name === 'reply_to_id')) {
  db.exec(`ALTER TABLE messages ADD COLUMN reply_to_id TEXT`);
}

const channelColumns = db.prepare('PRAGMA table_info(channels)').all() as Array<{ name: string }>;
if (!channelColumns.some((c) => c.name === 'avatar_url')) {
  db.exec(`ALTER TABLE channels ADD COLUMN avatar_url TEXT NOT NULL DEFAULT ''`);
}

const eventColumns = db.prepare('PRAGMA table_info(events)').all() as Array<{ name: string }>;
const eventColNames = new Set(eventColumns.map((c) => c.name));
if (!eventColNames.has('event_type')) {
  db.exec(`ALTER TABLE events ADD COLUMN event_type TEXT NOT NULL DEFAULT 'post'`);
}
if (!eventColNames.has('media_urls')) {
  db.exec(`ALTER TABLE events ADD COLUMN media_urls TEXT NOT NULL DEFAULT '[]'`);
}
if (!eventColNames.has('links')) {
  db.exec(`ALTER TABLE events ADD COLUMN links TEXT NOT NULL DEFAULT '[]'`);
}

export const AVATAR_COLORS = [
  '#0d9488',
  '#0284c7',
  '#059669',
  '#d97706',
  '#dc2626',
  '#4f46e5',
  '#7c3aed',
  '#be123c',
];

export const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

export function validateUsernameFormat(username: string): { valid: boolean; reason?: string } {
  if (!username) {
    return { valid: false, reason: 'يرجى إدخال اسم المستخدم' };
  }
  if (username.length < 3) {
    return { valid: false, reason: 'يجب أن يكون اسم المستخدم 3 أحرف على الأقل' };
  }
  if (username.length > 24) {
    return { valid: false, reason: 'يجب ألا يتجاوز اسم المستخدم 24 حرفاً' };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, reason: 'يُسمح فقط بالأحرف الإنجليزية والأرقام والشرطة السفلية (_)' };
  }
  return { valid: true };
}

const stmtFindUserByUsername = db.prepare('SELECT id FROM users WHERE username = ?');

export function isUsernameTaken(username: string): boolean {
  const row = stmtFindUserByUsername.get(username) as { id: string } | undefined;
  return Boolean(row);
}

export function generateUsernameSuggestions(baseRaw: string, count = 3): string[] {
  const cleaned = normalizeUsername(baseRaw).replace(/[^a-z0-9_]/g, '') || 'user';
  const base = cleaned.slice(0, 18).replace(/_+$/, '') || 'user';
  const suggestions: string[] = [];
  const seen = new Set<string>();

  let attempts = 0;
  while (suggestions.length < count && attempts < 40) {
    attempts++;
    const num = crypto.randomInt(1000, 9999);
    const candidate = `${base}_${num}`;
    if (candidate.length <= 24 && !seen.has(candidate) && !isUsernameTaken(candidate)) {
      seen.add(candidate);
      suggestions.push(candidate);
    }
  }
  return suggestions;
}

export interface DbUserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  bio: string;
  current_status: string;
  needs_bio_onboarding: number;
  avatar_color: string;
  avatar_url: string;
  chat_wallpaper: string;
  last_seen: number;
  created_at: number;
}

export interface DbGroupRow {
  id: string;
  name: string;
  description: string;
  promo_text: string;
  extra_links: string;
  avatar_url: string;
  invite_code: string;
  owner_id: string;
  created_at: number;
  updated_at: number;
}

export interface DbConversationRow {
  id: string;
  user_a: string;
  user_b: string;
  pinned_message_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface DbMessageJoinRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: string;
  content: string;
  file_id: string | null;
  duration_sec: number | null;
  call_status: string | null;
  reply_to_id: string | null;
  status: string;
  created_at: number;
  file_original_name: string | null;
  file_mime_type: string | null;
  file_size_bytes: number | null;
}

export function getOrCreateDirectConversation(userId1: string, userId2: string): DbConversationRow {
  const [userA, userB] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  const existing = db
    .prepare('SELECT * FROM conversations WHERE user_a = ? AND user_b = ?')
    .get(userA, userB) as DbConversationRow | undefined;
  if (existing) {
    return existing;
  }

  const now = Date.now();
  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO conversations (id, user_a, user_b, pinned_message_id, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?)'
  ).run(id, userA, userB, now, now);

  return {
    id,
    user_a: userA,
    user_b: userB,
    pinned_message_id: null,
    created_at: now,
    updated_at: now,
  };
}

export function isConversationMember(conversationId: string, userId: string): DbConversationRow | null {
  const conv = db
    .prepare('SELECT * FROM conversations WHERE id = ?')
    .get(conversationId) as DbConversationRow | undefined;
  if (!conv) return null;
  if (conv.user_a !== userId && conv.user_b !== userId) return null;
  return conv;
}

export function getPeerIdFromConversation(conv: DbConversationRow, selfId: string): string {
  return conv.user_a === selfId ? conv.user_b : conv.user_a;
}

export function mapMessageRow(row: DbMessageJoinRow) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    type: row.type,
    content: row.content,
    file: row.file_id
      ? {
          id: row.file_id,
          originalName: row.file_original_name ?? 'file',
          mimeType: row.file_mime_type ?? 'application/octet-stream',
          sizeBytes: row.file_size_bytes ?? 0,
        }
      : null,
    durationSec: row.duration_sec,
    callStatus: row.call_status,
    replyTo: null as {
      id: string;
      senderId: string;
      type: string;
      content: string;
      fileOriginalName: string | null;
    } | null,
    reactions: [] as Array<{ userId: string; emoji: string }>,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function getReactionsForMessageIds(
  messageIds: string[]
): Map<string, Array<{ userId: string; emoji: string }>> {
  const map = new Map<string, Array<{ userId: string; emoji: string }>>();
  if (messageIds.length === 0) return map;

  const placeholders = messageIds.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT message_id, user_id, emoji FROM message_reactions
       WHERE message_id IN (${placeholders})
       ORDER BY created_at ASC`
    )
    .all(...messageIds) as Array<{ message_id: string; user_id: string; emoji: string }>;

  for (const r of rows) {
    const arr = map.get(r.message_id) ?? [];
    arr.push({ userId: r.user_id, emoji: r.emoji });
    map.set(r.message_id, arr);
  }
  return map;
}

export function hydrateMessages(rows: DbMessageJoinRow[]) {
  if (rows.length === 0) return [];

  const msgIds = rows.map((r) => r.id);
  const reactionsMap = getReactionsForMessageIds(msgIds);

  const replyIds = Array.from(
    new Set(rows.map((r) => r.reply_to_id).filter((id): id is string => Boolean(id)))
  );
  const replyMap = new Map<
    string,
    { id: string; senderId: string; type: string; content: string; fileOriginalName: string | null }
  >();

  if (replyIds.length > 0) {
    const placeholders = replyIds.map(() => '?').join(',');
    const replyRows = db
      .prepare(
        `SELECT m.id, m.sender_id, m.type, m.content, f.original_name AS file_original_name
         FROM messages m
         LEFT JOIN files f ON m.file_id = f.id
         WHERE m.id IN (${placeholders})`
      )
      .all(...replyIds) as Array<{
      id: string;
      sender_id: string;
      type: string;
      content: string;
      file_original_name: string | null;
    }>;

    for (const rr of replyRows) {
      replyMap.set(rr.id, {
        id: rr.id,
        senderId: rr.sender_id,
        type: rr.type,
        content: rr.content,
        fileOriginalName: rr.file_original_name,
      });
    }
  }

  return rows.map((row) => {
    const mapped = mapMessageRow(row);
    mapped.replyTo = row.reply_to_id ? replyMap.get(row.reply_to_id) ?? null : null;
    mapped.reactions = reactionsMap.get(row.id) ?? [];
    return mapped;
  });
}

export function getMappedMessageById(messageId: string | null | undefined) {
  if (!messageId) return null;
  const row = db
    .prepare(
      `SELECT m.*, f.original_name AS file_original_name, f.mime_type AS file_mime_type, f.size_bytes AS file_size_bytes
       FROM messages m
       LEFT JOIN files f ON m.file_id = f.id
       WHERE m.id = ?`
    )
    .get(messageId) as DbMessageJoinRow | undefined;
  if (!row) return null;
  return hydrateMessages([row])[0] ?? null;
}

export type FriendshipRelation = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export function orderedUserPair(u1: string, u2: string): [string, string] {
  return u1 < u2 ? [u1, u2] : [u2, u1];
}

export function getFriendshipRelation(selfId: string, otherId: string): FriendshipRelation {
  if (!selfId || !otherId || selfId === otherId) return 'none';
  const [userA, userB] = orderedUserPair(selfId, otherId);
  const row = db
    .prepare('SELECT requester_id, status FROM friendships WHERE user_a = ? AND user_b = ?')
    .get(userA, userB) as { requester_id: string; status: string } | undefined;

  if (!row || row.status === 'declined') return 'none';
  if (row.status === 'accepted') return 'accepted';
  if (row.status === 'pending') {
    return row.requester_id === selfId ? 'pending_sent' : 'pending_received';
  }
  return 'none';
}

export function getFriendIds(selfId: string): string[] {
  const rows = db
    .prepare(
      `SELECT user_a, user_b FROM friendships
       WHERE (user_a = ? OR user_b = ?) AND status = 'accepted'`
    )
    .all(selfId, selfId) as Array<{ user_a: string; user_b: string }>;

  return rows.map((r) => (r.user_a === selfId ? r.user_b : r.user_a));
}

export function isGroupMember(groupId: string, userId: string): { role: string } | null {
  const row = db
    .prepare('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?')
    .get(groupId, userId) as { role: string } | undefined;
  return row ?? null;
}

export function getGroupMemberIds(groupId: string): string[] {
  const rows = db
    .prepare('SELECT user_id FROM group_members WHERE group_id = ?')
    .all(groupId) as Array<{ user_id: string }>;
  return rows.map((r) => r.user_id);
}

// Backfill accepted friendships for any pre-existing conversations that already have messages
db.exec(`
  INSERT OR IGNORE INTO friendships (user_a, user_b, requester_id, status, created_at, updated_at)
  SELECT c.user_a, c.user_b, c.user_a, 'accepted', c.created_at, c.updated_at
  FROM conversations c
  WHERE EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id);
`);

