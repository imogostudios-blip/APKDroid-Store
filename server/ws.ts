import crypto from 'node:crypto';
import type { Server as HttpServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { verifyAuthToken } from './auth.ts';
import {
  db,
  getFriendshipRelation,
  getPeerIdFromConversation,
  isConversationMember,
  type DbConversationRow,
  type DbUserRow,
} from './db.ts';

interface AuthedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

const activeSockets = new Map<string, Set<AuthedWebSocket>>();

export function isUserOnline(userId: string): boolean {
  const set = activeSockets.get(userId);
  return Boolean(set && set.size > 0);
}

export function sendToUser(userId: string, payload: Record<string, unknown>): void {
  const set = activeSockets.get(userId);
  if (!set) return;
  const serialized = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(serialized);
    }
  }
}

export function broadcastAll(payload: Record<string, unknown>): void {
  const serialized = JSON.stringify(payload);
  for (const set of activeSockets.values()) {
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(serialized);
      }
    }
  }
}

function broadcastPresence(userId: string, online: boolean, lastSeen: number): void {
  const msg = JSON.stringify({
    type: 'presence:update',
    userId,
    online,
    lastSeen,
  });
  for (const [uid, set] of activeSockets.entries()) {
    if (uid === userId) continue;
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }
}

function markPendingMessagesDelivered(userId: string): void {
  const convs = db
    .prepare('SELECT * FROM conversations WHERE user_a = ? OR user_b = ?')
    .all(userId, userId) as DbConversationRow[];

  const stmtDeliver = db.prepare(
    `UPDATE messages SET status = 'delivered'
     WHERE conversation_id = ? AND sender_id = ? AND status = 'sent'`
  );

  for (const conv of convs) {
    const peerId = getPeerIdFromConversation(conv, userId);
    const res = stmtDeliver.run(conv.id, peerId);
    if (res.changes > 0) {
      sendToUser(peerId, {
        type: 'messages:status',
        conversationId: conv.id,
        status: 'delivered',
      });
    }
  }
}

function toPublicUser(row: DbUserRow) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    currentStatus: row.current_status || 'متصل',
    needsOnboarding: Boolean(row.needs_bio_onboarding),
    avatarColor: row.avatar_color,
    avatarUrl: row.avatar_url || null,
    chatWallpaper: row.chat_wallpaper || 'doodle-teal',
    online: isUserOnline(row.id),
    lastSeen: row.last_seen,
  };
}

function saveCallLogMessage(
  conversationId: string,
  senderId: string,
  callStatus: 'completed' | 'missed' | 'rejected' | 'busy',
  durationSec: number | null
) {
  const now = Date.now();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO messages (id, conversation_id, sender_id, type, content, duration_sec, call_status, status, created_at)
     VALUES (?, ?, ?, 'call', '', ?, ?, 'delivered', ?)`
  ).run(id, conversationId, senderId, durationSec, callStatus, now);

  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversationId);

  return {
    id,
    conversationId,
    senderId,
    type: 'call',
    content: '',
    file: null,
    durationSec,
    callStatus,
    status: 'delivered',
    createdAt: now,
  };
}

export function setupWebSocketServer(httpServer: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req, socket, head) => {
    const pathname = (req.url || '').split('?')[0];
    if (pathname !== '/ws') {
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  const heartbeatInterval = setInterval(() => {
    for (const set of activeSockets.values()) {
      for (const ws of set) {
        if (ws.isAlive === false) {
          ws.terminate();
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', (rawWs) => {
    const ws = rawWs as AuthedWebSocket;
    ws.isAlive = true;

    const authTimeout = setTimeout(() => {
      if (!ws.userId) {
        ws.close(4001, 'Authentication timeout');
      }
    }, 6000);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(data.toString('utf8')) as Record<string, unknown>;
      } catch {
        return;
      }

      if (typeof msg.type !== 'string') return;

      if (msg.type === 'auth') {
        const token = typeof msg.token === 'string' ? msg.token : '';
        const payload = verifyAuthToken(token);
        if (!payload) {
          ws.send(JSON.stringify({ type: 'auth:error', error: 'Invalid session token' }));
          ws.close(4003, 'Unauthorized');
          return;
        }
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub) as
          | DbUserRow
          | undefined;
        if (!user) {
          ws.close(4003, 'User not found');
          return;
        }

        clearTimeout(authTimeout);
        ws.userId = user.id;

        let set = activeSockets.get(user.id);
        const wasOffline = !set || set.size === 0;
        if (!set) {
          set = new Set();
          activeSockets.set(user.id, set);
        }
        set.add(ws);

        const now = Date.now();
        db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(now, user.id);

        ws.send(JSON.stringify({ type: 'auth:ok', userId: user.id }));
        markPendingMessagesDelivered(user.id);
        if (wasOffline) {
          broadcastPresence(user.id, true, now);
        }
        return;
      }

      const selfId = ws.userId;
      if (!selfId) return;

      if (msg.type === 'typing:start' || msg.type === 'typing:stop') {
        const conversationId = typeof msg.conversationId === 'string' ? msg.conversationId : '';
        const conv = isConversationMember(conversationId, selfId);
        if (!conv) return;
        const peerId = getPeerIdFromConversation(conv, selfId);
        sendToUser(peerId, {
          type: msg.type,
          conversationId,
          userId: selfId,
        });
        return;
      }

      if (msg.type === 'messages:delivered') {
        const conversationId = typeof msg.conversationId === 'string' ? msg.conversationId : '';
        const conv = isConversationMember(conversationId, selfId);
        if (!conv) return;
        const peerId = getPeerIdFromConversation(conv, selfId);
        const result = db
          .prepare(
            `UPDATE messages SET status = 'delivered'
             WHERE conversation_id = ? AND sender_id = ? AND status = 'sent'`
          )
          .run(conversationId, peerId);
        if (result.changes > 0) {
          sendToUser(peerId, {
            type: 'messages:status',
            conversationId,
            status: 'delivered',
          });
        }
        return;
      }

      if (msg.type === 'messages:read') {
        const conversationId = typeof msg.conversationId === 'string' ? msg.conversationId : '';
        const conv = isConversationMember(conversationId, selfId);
        if (!conv) return;
        const peerId = getPeerIdFromConversation(conv, selfId);
        const result = db
          .prepare(
            `UPDATE messages SET status = 'read'
             WHERE conversation_id = ? AND sender_id = ? AND status != 'read'`
          )
          .run(conversationId, peerId);
        if (result.changes > 0) {
          sendToUser(peerId, {
            type: 'messages:status',
            conversationId,
            status: 'read',
          });
        }
        return;
      }

      if (msg.type === 'call:offer') {
        const conversationId = typeof msg.conversationId === 'string' ? msg.conversationId : '';
        const callId = typeof msg.callId === 'string' ? msg.callId : '';
        if (!conversationId || !callId || !msg.sdp) return;

        const conv = isConversationMember(conversationId, selfId);
        if (!conv) return;
        const peerId = getPeerIdFromConversation(conv, selfId);

        if (getFriendshipRelation(selfId, peerId) !== 'accepted') {
          sendToUser(selfId, {
            type: 'call:unavailable',
            callId,
            reason: 'يجب قبول طلب الصداقة أولاً لإجراء المكالمات',
          });
          return;
        }

        const selfUser = db.prepare('SELECT * FROM users WHERE id = ?').get(selfId) as
          | DbUserRow
          | undefined;
        if (!selfUser) return;

        if (!isUserOnline(peerId)) {
          const logMsg = saveCallLogMessage(conversationId, selfId, 'missed', null);
          sendToUser(selfId, { type: 'message:new', message: logMsg });
          sendToUser(selfId, {
            type: 'call:unavailable',
            callId,
            reason: 'المستخدم غير متصل حالياً',
          });
          return;
        }

        sendToUser(peerId, {
          type: 'call:incoming',
          callId,
          conversationId,
          fromUser: toPublicUser(selfUser),
          sdp: msg.sdp,
        });
        return;
      }

      if (msg.type === 'call:ringing') {
        const toUserId = typeof msg.toUserId === 'string' ? msg.toUserId : '';
        const callId = typeof msg.callId === 'string' ? msg.callId : '';
        if (!toUserId || !callId) return;
        sendToUser(toUserId, { type: 'call:ringing', callId, fromUserId: selfId });
        return;
      }

      if (msg.type === 'call:answer') {
        const toUserId = typeof msg.toUserId === 'string' ? msg.toUserId : '';
        const callId = typeof msg.callId === 'string' ? msg.callId : '';
        if (!toUserId || !callId || !msg.sdp) return;
        sendToUser(toUserId, {
          type: 'call:answer',
          callId,
          fromUserId: selfId,
          sdp: msg.sdp,
        });
        return;
      }

      if (msg.type === 'call:ice-candidate') {
        const toUserId = typeof msg.toUserId === 'string' ? msg.toUserId : '';
        const callId = typeof msg.callId === 'string' ? msg.callId : '';
        if (!toUserId || !callId || !msg.candidate) return;
        sendToUser(toUserId, {
          type: 'call:ice-candidate',
          callId,
          fromUserId: selfId,
          candidate: msg.candidate,
        });
        return;
      }

      if (msg.type === 'call:reject') {
        const toUserId = typeof msg.toUserId === 'string' ? msg.toUserId : '';
        const callId = typeof msg.callId === 'string' ? msg.callId : '';
        const conversationId = typeof msg.conversationId === 'string' ? msg.conversationId : '';
        if (!toUserId || !callId) return;

        const conv = conversationId ? isConversationMember(conversationId, selfId) : null;
        if (conv) {
          const logMsg = saveCallLogMessage(conversationId, toUserId, 'rejected', null);
          sendToUser(selfId, { type: 'message:new', message: logMsg });
          sendToUser(toUserId, { type: 'message:new', message: logMsg });
        }

        sendToUser(toUserId, {
          type: 'call:rejected',
          callId,
          fromUserId: selfId,
          reason: typeof msg.reason === 'string' ? msg.reason : 'busy',
        });
        return;
      }

      if (msg.type === 'call:hangup') {
        const toUserId = typeof msg.toUserId === 'string' ? msg.toUserId : '';
        const callId = typeof msg.callId === 'string' ? msg.callId : '';
        const conversationId = typeof msg.conversationId === 'string' ? msg.conversationId : '';
        const wasConnected = Boolean(msg.wasConnected);
        const isInitiator = Boolean(msg.isInitiator);
        const durationSec =
          typeof msg.durationSec === 'number' && Number.isFinite(msg.durationSec)
            ? Math.max(0, Math.round(msg.durationSec))
            : 0;
        if (!toUserId || !callId) return;

        const conv = conversationId ? isConversationMember(conversationId, selfId) : null;
        if (conv && Boolean(msg.saveLog)) {
          const initiatorId = isInitiator ? selfId : toUserId;
          const callStatus = wasConnected ? 'completed' : 'missed';
          const logMsg = saveCallLogMessage(
            conversationId,
            initiatorId,
            callStatus,
            wasConnected ? durationSec : null
          );
          sendToUser(selfId, { type: 'message:new', message: logMsg });
          sendToUser(toUserId, { type: 'message:new', message: logMsg });
        }

        sendToUser(toUserId, {
          type: 'call:ended',
          callId,
          fromUserId: selfId,
        });
      }
    });

    ws.on('close', () => {
      clearTimeout(authTimeout);
      const userId = ws.userId;
      if (!userId) return;
      const set = activeSockets.get(userId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) {
          activeSockets.delete(userId);
          const now = Date.now();
          db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(now, userId);
          broadcastPresence(userId, false, now);
        }
      }
    });
  });
}
