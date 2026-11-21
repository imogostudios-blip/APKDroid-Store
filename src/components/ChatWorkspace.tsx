import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCheck,
  CheckSquare,
  Copy,
  Mic,
  Paperclip,
  Phone,
  Pin,
  PinOff,
  Plus,
  Reply,
  Search,
  Send,
  Share2,
  Smile,
  SmilePlus,
  Trash,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  apiRequest,
  formatDuration,
  formatLastSeen,
  formatTime,
} from '../lib/api';
import { playMessageSound, startRingtone, stopRingtone } from '../lib/sound';
import { getChatWallpaper } from '../lib/wallpapers';
import type {
  AppEvent,
  ChannelPost,
  ChannelSummary,
  ChatMessage,
  ConversationSummary,
  GroupMessage,
  GroupSummary,
  MessageReaction,
  PublicUser,
} from '../types';
import { BottomNavBar, type BottomTab } from './BottomNavBar';
import { CallOverlay, type ActiveCallState } from './CallOverlay';
import { ChannelsView } from './ChannelsView';
import { ContactProfileModal } from './ContactProfileModal';
import { CreateGroupModal } from './CreateGroupModal';
import { EventsView } from './EventsView';
import { FindUserModal } from './FindUserModal';
import { GroupRoomView } from './GroupRoomView';
import { MessageBubble } from './MessageBubble';
import { OnboardingBioModal } from './OnboardingBioModal';
import { SettingsView } from './SettingsView';
import { ShareSheetModal, type SharePayload } from './ShareSheetModal';
import { UserAvatar } from './UserAvatar';

const QUICK_EMOJIS = ['👍', '❤️', '😊', '😂', '🙏', '🔥', '👏', '🎉', '✅', '💯', '👋', '🤝'];
const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥'];

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ],
};

interface ChatWorkspaceProps {
  token: string;
  currentUser: PublicUser;
  darkMode: boolean;
  onToggleDark: () => void;
  onUserUpdated: (user: PublicUser) => void;
  onLogout: () => void;
}

export function ChatWorkspace({
  token,
  currentUser,
  darkMode,
  onToggleDark,
  onUserUpdated,
  onLogout,
}: ChatWorkspaceProps) {
  const [activeNav, setActiveNav] = useState<BottomTab>('chats');
  const [searchQuery, setSearchQuery] = useState('');

  const [wsConnected, setWsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, ChatMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [friends, setFriends] = useState<PublicUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<PublicUser[]>([]);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [chatFilterTab, setChatFilterTab] = useState<'all' | 'chats' | 'groups'>('all');
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [contactProfileUser, setContactProfileUser] = useState<PublicUser | null>(null);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(
    Boolean(currentUser.needsOnboarding)
  );

  const [typingByConv, setTypingByConv] = useState<Record<string, boolean>>({});
  const [draftText, setDraftText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedSelfHandle, setCopiedSelfHandle] = useState(false);
  const [showFindUserModal, setShowFindUserModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    message: ChatMessage;
    rect: DOMRect;
    showEmojis: boolean;
  } | null>(null);

  const [incomingChannel, setIncomingChannel] = useState<ChannelSummary | null>(null);
  const [incomingChannelUpdated, setIncomingChannelUpdated] = useState<ChannelSummary | null>(null);
  const [incomingChannelPost, setIncomingChannelPost] = useState<ChannelPost | null>(null);
  const [incomingGroupMessage, setIncomingGroupMessage] = useState<GroupMessage | null>(null);
  const [incomingDeletedGroupMsg, setIncomingDeletedGroupMsg] = useState<{
    groupId: string;
    messageId: string;
    lastMessage: GroupMessage | null;
  } | null>(null);
  const [incomingDeletedGroupBulk, setIncomingDeletedGroupBulk] = useState<{
    groupId: string;
    messageIds: string[];
    lastMessage: GroupMessage | null;
  } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [isChannelOpen, setIsChannelOpen] = useState(false);
  const [incomingEvent, setIncomingEvent] = useState<AppEvent | null>(null);
  const [incomingRsvp, setIncomingRsvp] = useState<{
    eventId: string;
    goingCount: number;
    interestedCount: number;
  } | null>(null);

  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [callElapsedSec, setCallElapsedSec] = useState(0);
  const [callAudioLevel, setCallAudioLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const selectedConvIdRef = useRef<string | null>(null);
  const selectedGroupIdRef = useRef<string | null>(null);
  const activeNavRef = useRef<BottomTab>('chats');
  const soundEnabledRef = useRef<boolean>(true);
  const activeCallRef = useRef<ActiveCallState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draftInputRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastTypingEmitRef = useRef<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<BlobPart[]>([]);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const recordCancelRef = useRef<boolean>(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localCallStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const levelRafRef = useRef<number | null>(null);
  const analyserCtxRef = useRef<AudioContext | null>(null);

  selectedConvIdRef.current = selectedConvId;
  selectedGroupIdRef.current = selectedGroupId;
  activeNavRef.current = activeNav;
  soundEnabledRef.current = soundEnabled;
  activeCallRef.current = activeCall;

  useEffect(() => {
    if (currentUser.needsOnboarding) {
      setShowOnboardingModal(true);
    }
  }, [currentUser.needsOnboarding]);

  const showToast = useCallback((text: string) => {
    setToastMsg(text);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === text ? null : prev));
    }, 3400);
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res = await apiRequest<{ conversations: ConversationSummary[] }>('/api/conversations', {
        token,
      });
      setConversations(res.conversations);
    } catch {
      // Ignore transient load error
    } finally {
      setLoadingConvs(false);
    }
  }, [token]);

  const loadFriends = useCallback(async () => {
    try {
      const res = await apiRequest<{
        friends: PublicUser[];
        incomingRequests: PublicUser[];
      }>('/api/friends', { token });
      setFriends(res.friends);
      setIncomingRequests(res.incomingRequests);
    } catch {
      // Ignore transient error
    }
  }, [token]);

  const loadGroups = useCallback(async () => {
    try {
      const res = await apiRequest<{ groups: GroupSummary[] }>('/api/groups', { token });
      setGroups(res.groups);
    } catch {
      // Ignore transient error
    }
  }, [token]);

  useEffect(() => {
    void loadConversations();
    void loadFriends();
    void loadGroups();
  }, [loadConversations, loadFriends, loadGroups]);

  // Handle shareable URL invite links (?invite_group=CODE or ?add_friend=HANDLE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite_group');
    const addFriendHandle = params.get('add_friend');

    if (!inviteCode && !addFriendHandle) return;
    window.history.replaceState({}, '', window.location.pathname);

    if (inviteCode) {
      void (async () => {
        try {
          const res = await apiRequest<{ group: GroupSummary }>(
            `/api/groups/join/${encodeURIComponent(inviteCode)}`,
            { method: 'POST', token }
          );
          setGroups((prev) => {
            const rest = prev.filter((g) => g.id !== res.group.id);
            return [res.group, ...rest];
          });
          setActiveNav('chats');
          setSelectedConvId(null);
          setSelectedGroupId(res.group.id);
          showToast(`تم الانضمام إلى مجموعة "${res.group.name}"`);
        } catch (err) {
          showToast((err as Error).message || 'رابط دعوة المجموعة غير صالح');
        }
      })();
      return;
    }

    if (addFriendHandle) {
      void (async () => {
        try {
          const res = await apiRequest<{ user: PublicUser }>(
            `/api/users/lookup?handle=${encodeURIComponent(addFriendHandle)}`,
            { token }
          );
          if (res.user.id !== currentUser.id) {
            setContactProfileUser(res.user);
          }
        } catch {
          showToast('تعذر العثور على الحساب المطلوب');
        }
      })();
    }
  }, [token, currentUser.id, showToast]);

  const cleanupCallMedia = useCallback(() => {
    stopRingtone();
    if (levelRafRef.current !== null) {
      cancelAnimationFrame(levelRafRef.current);
      levelRafRef.current = null;
    }
    if (analyserCtxRef.current) {
      void analyserCtxRef.current.close().catch(() => {});
      analyserCtxRef.current = null;
    }
    if (localCallStreamRef.current) {
      for (const track of localCallStreamRef.current.getTracks()) {
        track.stop();
      }
      localCallStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    pendingOfferRef.current = null;
    iceQueueRef.current = [];
    setCallAudioLevel(0);
    setCallElapsedSec(0);
  }, []);

  const startAudioLevelMeter = useCallback((stream: MediaStream) => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      analyserCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / (data.length * 255);
        setCallAudioLevel(avg);
        levelRafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Ignore if AudioContext unavailable
    }
  }, []);

  useEffect(() => {
    if (!activeCall || activeCall.phase !== 'connected' || !activeCall.startedAt) {
      setCallElapsedSec(0);
      return;
    }
    const timer = window.setInterval(() => {
      if (activeCall.startedAt) {
        setCallElapsedSec(Math.floor((Date.now() - activeCall.startedAt) / 1000));
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [activeCall]);

  useEffect(() => {
    let closedByUser = false;
    let reconnectTimer: number | null = null;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', token }));
      };

      ws.onmessage = (event) => {
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(event.data as string) as Record<string, unknown>;
        } catch {
          return;
        }

        const type = data.type;
        if (typeof type !== 'string') return;

        if (type === 'auth:ok') {
          setWsConnected(true);
          return;
        }

        if (type === 'presence:update') {
          const userId = data.userId as string;
          const online = Boolean(data.online);
          const lastSeen = Number(data.lastSeen) || Date.now();
          setConversations((prev) =>
            prev.map((c) =>
              c.peer.id === userId ? { ...c, peer: { ...c.peer, online, lastSeen } } : c
            )
          );
          setFriends((prev) =>
            prev.map((f) => (f.id === userId ? { ...f, online, lastSeen } : f))
          );
          setContactProfileUser((prev) =>
            prev && prev.id === userId ? { ...prev, online, lastSeen } : prev
          );
          return;
        }

        if (type === 'user:updated') {
          const updatedUser = data.user as PublicUser | undefined;
          if (!updatedUser) return;
          setConversations((prev) =>
            prev.map((c) =>
              c.peer.id === updatedUser.id
                ? { ...c, peer: { ...c.peer, ...updatedUser } }
                : c
            )
          );
          setFriends((prev) =>
            prev.map((f) => (f.id === updatedUser.id ? { ...f, ...updatedUser } : f))
          );
          setContactProfileUser((prev) =>
            prev && prev.id === updatedUser.id ? { ...prev, ...updatedUser } : prev
          );
          setActiveCall((prev) =>
            prev && prev.peer.id === updatedUser.id
              ? { ...prev, peer: { ...prev.peer, ...updatedUser } }
              : prev
          );
          return;
        }

        if (type === 'friend:request') {
          const fromUser = data.fromUser as PublicUser | undefined;
          if (!fromUser) return;
          setIncomingRequests((prev) => {
            const rest = prev.filter((u) => u.id !== fromUser.id);
            return [{ ...fromUser, friendshipStatus: 'pending_received' }, ...rest];
          });
          setContactProfileUser((prev) =>
            prev && prev.id === fromUser.id
              ? { ...prev, ...fromUser, friendshipStatus: 'pending_received' }
              : prev
          );
          if (soundEnabledRef.current) playMessageSound();
          showToast(`طلب صداقة جديد من ${fromUser.displayName}`);
          return;
        }

        if (type === 'friend:accepted') {
          const acceptedUser = data.user as PublicUser | undefined;
          if (!acceptedUser) return;
          setIncomingRequests((prev) => prev.filter((u) => u.id !== acceptedUser.id));
          setContactProfileUser((prev) =>
            prev && prev.id === acceptedUser.id
              ? { ...prev, ...acceptedUser, friendshipStatus: 'accepted' }
              : prev
          );
          void loadFriends();
          void loadConversations();
          showToast(`أصبح ${acceptedUser.displayName} صديقك الآن`);
          return;
        }

        if (type === 'friend:declined') {
          const declinedUserId = data.userId as string | undefined;
          if (!declinedUserId) return;
          setIncomingRequests((prev) => prev.filter((u) => u.id !== declinedUserId));
          setContactProfileUser((prev) =>
            prev && prev.id === declinedUserId ? { ...prev, friendshipStatus: 'none' } : prev
          );
          return;
        }

        if ((type === 'group:added' || type === 'group:updated') && data.group) {
          const grp = data.group as GroupSummary;
          setGroups((prev) => {
            const rest = prev.filter((g) => g.id !== grp.id);
            return [grp, ...rest].sort((a, b) => b.updatedAt - a.updatedAt);
          });
          if (type === 'group:added' && grp.ownerId !== currentUser.id) {
            showToast(`تمت إضافتك إلى مجموعة "${grp.name}"`);
          }
          return;
        }

        if (type === 'group:message' && data.message) {
          const gm = data.message as GroupMessage;
          setIncomingGroupMessage(gm);
          setGroups((prev) => {
            const target = prev.find((g) => g.id === gm.groupId);
            if (!target) {
              void loadGroups();
              return prev;
            }
            const updated: GroupSummary = {
              ...target,
              lastMessage: gm,
              updatedAt: gm.createdAt,
            };
            const rest = prev.filter((g) => g.id !== gm.groupId);
            return [updated, ...rest];
          });
          if (
            gm.senderId !== currentUser.id &&
            (activeNavRef.current !== 'chats' || selectedGroupIdRef.current !== gm.groupId) &&
            soundEnabledRef.current
          ) {
            playMessageSound();
          }
          return;
        }

        if (type === 'group:message:deleted') {
          const groupId = data.groupId as string;
          const messageId = data.messageId as string;
          const lastMessage = (data.lastMessage as GroupMessage | null) ?? null;
          setIncomingDeletedGroupMsg({ groupId, messageId, lastMessage });
          setGroups((prev) =>
            prev.map((g) => (g.id === groupId ? { ...g, lastMessage } : g))
          );
          return;
        }

        if (type === 'group:messages:deleted-bulk') {
          const groupId = data.groupId as string;
          const messageIds = Array.isArray(data.messageIds) ? (data.messageIds as string[]) : [];
          const lastMessage = (data.lastMessage as GroupMessage | null) ?? null;
          setIncomingDeletedGroupBulk({ groupId, messageIds, lastMessage });
          setGroups((prev) =>
            prev.map((g) => (g.id === groupId ? { ...g, lastMessage } : g))
          );
          return;
        }

        if (type === 'typing:start' || type === 'typing:stop') {
          const convId = data.conversationId as string;
          setTypingByConv((prev) => ({ ...prev, [convId]: type === 'typing:start' }));
          return;
        }

        if (type === 'messages:status') {
          const convId = data.conversationId as string;
          const nextStatus = (data.status === 'delivered' ? 'delivered' : 'read') as
            | 'delivered'
            | 'read';

          setMessagesByConv((prev) => {
            const list = prev[convId];
            if (!list) return prev;
            return {
              ...prev,
              [convId]: list.map((m) => {
                if (m.senderId !== currentUser.id) return m;
                if (nextStatus === 'delivered' && m.status === 'sent') {
                  return { ...m, status: 'delivered' };
                }
                if (nextStatus === 'read' && m.status !== 'read') {
                  return { ...m, status: 'read' };
                }
                return m;
              }),
            };
          });

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId || !c.lastMessage) return c;
              if (c.lastMessage.senderId !== currentUser.id) return c;
              if (nextStatus === 'delivered' && c.lastMessage.status === 'sent') {
                return { ...c, lastMessage: { ...c.lastMessage, status: 'delivered' } };
              }
              if (nextStatus === 'read' && c.lastMessage.status !== 'read') {
                return { ...c, lastMessage: { ...c.lastMessage, status: 'read' } };
              }
              return c;
            })
          );
          return;
        }

        if (type === 'message:reactions') {
          const convId = data.conversationId as string;
          const messageId = data.messageId as string;
          const reactions = (data.reactions as MessageReaction[]) ?? [];
          setMessagesByConv((prev) => {
            const list = prev[convId];
            if (!list) return prev;
            return {
              ...prev,
              [convId]: list.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
            };
          });
          return;
        }

        if (type === 'conversation:pin') {
          const convId = data.conversationId as string;
          const pinnedMessage = (data.pinnedMessage as ChatMessage | null) ?? null;
          setConversations((prev) =>
            prev.map((c) => (c.id === convId ? { ...c, pinnedMessage } : c))
          );
          return;
        }

        if (type === 'message:deleted') {
          const convId = data.conversationId as string;
          const messageId = data.messageId as string;
          const lastMessage = (data.lastMessage as ChatMessage | null) ?? null;
          const wasPinned = Boolean(data.wasPinned);
          setMessagesByConv((prev) => {
            const list = prev[convId];
            if (!list) return prev;
            return {
              ...prev,
              [convId]: list.filter((m) => m.id !== messageId),
            };
          });
          setSelectedMsgIds((prev) => {
            if (!prev.has(messageId)) return prev;
            const next = new Set(prev);
            next.delete(messageId);
            return next;
          });
          setContextMenu((prev) => (prev?.message.id === messageId ? null : prev));
          setReplyingTo((prev) => (prev?.id === messageId ? null : prev));
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    lastMessage,
                    pinnedMessage: wasPinned ? null : c.pinnedMessage,
                  }
                : c
            )
          );
          return;
        }

        if (type === 'messages:deleted-bulk') {
          const convId = data.conversationId as string;
          const messageIds = Array.isArray(data.messageIds) ? (data.messageIds as string[]) : [];
          const removedSet = new Set(messageIds);
          const lastMessage = (data.lastMessage as ChatMessage | null) ?? null;
          const wasPinned = Boolean(data.wasPinned);
          setMessagesByConv((prev) => {
            const list = prev[convId];
            if (!list) return prev;
            return {
              ...prev,
              [convId]: list.filter((m) => !removedSet.has(m.id)),
            };
          });
          setSelectedMsgIds((prev) => {
            const next = new Set(prev);
            for (const id of removedSet) next.delete(id);
            return next;
          });
          setContextMenu((prev) => (prev && removedSet.has(prev.message.id) ? null : prev));
          setReplyingTo((prev) => (prev && removedSet.has(prev.id) ? null : prev));
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    lastMessage,
                    pinnedMessage: wasPinned ? null : c.pinnedMessage,
                  }
                : c
            )
          );
          return;
        }

        if (type === 'message:new') {
          const message = data.message as ChatMessage;
          if (!message) return;

          setMessagesByConv((prev) => {
            const existing = prev[message.conversationId] ?? [];
            if (existing.some((m) => m.id === message.id)) return prev;
            return {
              ...prev,
              [message.conversationId]: [...existing, message],
            };
          });

          const isActiveChat =
            activeNavRef.current === 'chats' &&
            selectedConvIdRef.current === message.conversationId;

          if (message.senderId !== currentUser.id) {
            if (ws.readyState === WebSocket.OPEN) {
              if (isActiveChat) {
                ws.send(
                  JSON.stringify({ type: 'messages:read', conversationId: message.conversationId })
                );
              } else {
                ws.send(
                  JSON.stringify({
                    type: 'messages:delivered',
                    conversationId: message.conversationId,
                  })
                );
              }
            }
            if (!isActiveChat && message.type !== 'call' && soundEnabledRef.current) {
              playMessageSound();
            }
          }

          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === message.conversationId);
            if (idx === -1) {
              void loadConversations();
              return prev;
            }
            const target = prev[idx];
            const updated: ConversationSummary = {
              ...target,
              lastMessage: message,
              updatedAt: message.createdAt,
              unreadCount:
                message.senderId !== currentUser.id && !isActiveChat && message.type !== 'call'
                  ? target.unreadCount + 1
                  : target.unreadCount,
            };
            const rest = prev.filter((_, i) => i !== idx);
            return [updated, ...rest];
          });
          return;
        }

        if (type === 'channel:created' && data.channel) {
          setIncomingChannel(data.channel as ChannelSummary);
          return;
        }

        if (type === 'channel:updated' && data.channel) {
          setIncomingChannelUpdated(data.channel as ChannelSummary);
          return;
        }

        if (type === 'channel:post' && data.post) {
          setIncomingChannelPost(data.post as ChannelPost);
          return;
        }

        if (type === 'event:created' && data.event) {
          setIncomingEvent(data.event as AppEvent);
          return;
        }

        if (type === 'event:rsvp') {
          setIncomingRsvp({
            eventId: data.eventId as string,
            goingCount: Number(data.goingCount) || 0,
            interestedCount: Number(data.interestedCount) || 0,
          });
          return;
        }

        if (type === 'call:incoming') {
          const callId = data.callId as string;
          const conversationId = data.conversationId as string;
          const fromUser = data.fromUser as PublicUser;
          const sdp = data.sdp as RTCSessionDescriptionInit;

          if (activeCallRef.current) {
            ws.send(
              JSON.stringify({
                type: 'call:reject',
                callId,
                toUserId: fromUser.id,
                conversationId,
                reason: 'busy',
              })
            );
            return;
          }

          pendingOfferRef.current = sdp;
          iceQueueRef.current = [];
          setActiveCall({
            callId,
            conversationId,
            peer: fromUser,
            direction: 'incoming',
            phase: 'ringing',
            startedAt: null,
            muted: false,
          });
          ws.send(JSON.stringify({ type: 'call:ringing', callId, toUserId: fromUser.id }));
          startRingtone(true);
          return;
        }

        if (type === 'call:answer') {
          const sdp = data.sdp as RTCSessionDescriptionInit;
          const pc = pcRef.current;
          if (!pc) return;
          stopRingtone();
          void pc.setRemoteDescription(new RTCSessionDescription(sdp)).then(async () => {
            for (const cand of iceQueueRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
            iceQueueRef.current = [];
            setActiveCall((prev) =>
              prev ? { ...prev, phase: 'connected', startedAt: Date.now() } : null
            );
          });
          return;
        }

        if (type === 'call:ice-candidate') {
          const candidate = data.candidate as RTCIceCandidateInit;
          const pc = pcRef.current;
          if (pc && pc.remoteDescription) {
            void pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          } else {
            iceQueueRef.current.push(candidate);
          }
          return;
        }

        if (type === 'call:rejected') {
          cleanupCallMedia();
          setActiveCall(null);
          showToast(
            data.reason === 'busy'
              ? 'الطرف الآخر مشغول في مكالمة أخرى'
              : 'تم رفض المكالمة الصوتية'
          );
          return;
        }

        if (type === 'call:unavailable') {
          cleanupCallMedia();
          setActiveCall(null);
          showToast((data.reason as string) || 'المستخدم غير متصل حالياً');
          return;
        }

        if (type === 'call:ended') {
          cleanupCallMedia();
          setActiveCall(null);
          showToast('انتهت المكالمة الصوتية');
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (!closedByUser) {
          reconnectTimer = window.setTimeout(connect, 2000);
        }
      };
    }

    connect();

    return () => {
      closedByUser = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      cleanupCallMedia();
      wsRef.current?.close();
    };
  }, [
    token,
    currentUser.id,
    loadConversations,
    loadFriends,
    loadGroups,
    cleanupCallMedia,
    showToast,
  ]);

  const openConversation = useCallback(
    async (convId: string) => {
      setActiveNav('chats');
      setSelectedGroupId(null);
      setSelectedConvId(convId);
      setReplyingTo(null);
      setContextMenu(null);
      setSelectionMode(false);
      setSelectedMsgIds(new Set());
      setBulkDeleteConfirmOpen(false);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );

      setLoadingMessages(true);
      try {
        const res = await apiRequest<{
          messages: ChatMessage[];
          pinnedMessage?: ChatMessage | null;
        }>(`/api/conversations/${encodeURIComponent(convId)}/messages`, { token });
        setMessagesByConv((prev) => ({ ...prev, [convId]: res.messages }));
        if (res.pinnedMessage !== undefined) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId ? { ...c, pinnedMessage: res.pinnedMessage ?? null } : c
            )
          );
        }
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'messages:read', conversationId: convId }));
        }
      } catch {
        showToast('تعذر تحميل رسائل المحادثة');
      } finally {
        setLoadingMessages(false);
      }
    },
    [token, showToast]
  );

  function openGroup(groupId: string) {
    setActiveNav('chats');
    setSelectedConvId(null);
    setSelectedGroupId(groupId);
    setReplyingTo(null);
    setContextMenu(null);
  }

  async function startChatWithUser(targetUser: PublicUser) {
    try {
      const res = await apiRequest<{ conversation: ConversationSummary }>('/api/conversations', {
        method: 'POST',
        token,
        body: { targetUserId: targetUser.id },
      });
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === res.conversation.id);
        if (exists) return prev;
        return [res.conversation, ...prev];
      });
      await openConversation(res.conversation.id);
    } catch (err) {
      showToast((err as Error).message || 'تعذر بدء المحادثة');
    }
  }

  async function handleSendFriendRequest(targetUser: PublicUser) {
    try {
      const res = await apiRequest<{
        friendshipStatus: 'accepted' | 'pending_sent' | 'pending_received' | 'none';
        user: PublicUser;
        conversationId?: string;
      }>('/api/friends/request', {
        method: 'POST',
        token,
        body: { targetUserId: targetUser.id },
      });
      setContactProfileUser((prev) =>
        prev && prev.id === targetUser.id ? { ...prev, ...res.user } : prev
      );
      if (res.friendshipStatus === 'accepted') {
        void loadFriends();
        void loadConversations();
        showToast(`أصبحتما أصدقاء الآن مع ${targetUser.displayName}`);
      } else {
        showToast(`تم إرسال طلب الصداقة إلى ${targetUser.displayName}`);
      }
    } catch (err) {
      showToast((err as Error).message || 'تعذر إرسال طلب الصداقة');
    }
  }

  async function handleRespondFriendRequest(fromUserId: string, action: 'accept' | 'decline') {
    try {
      const res = await apiRequest<{
        friendshipStatus: 'accepted' | 'pending_sent' | 'pending_received' | 'none';
        user: PublicUser;
        conversationId?: string;
      }>('/api/friends/respond', {
        method: 'POST',
        token,
        body: { userId: fromUserId, action },
      });
      setIncomingRequests((prev) => prev.filter((u) => u.id !== fromUserId));
      if (action === 'accept' && res.friendshipStatus === 'accepted') {
        void loadFriends();
        void loadConversations();
        setContactProfileUser((prev) =>
          prev && prev.id === fromUserId ? { ...prev, ...res.user } : prev
        );
        showToast('تم قبول طلب الصداقة');
      } else {
        setContactProfileUser((prev) =>
          prev && prev.id === fromUserId ? { ...prev, ...res.user } : prev
        );
        showToast('تم رفض طلب الصداقة');
      }
    } catch (err) {
      showToast((err as Error).message || 'تعذر تنفيذ الطلب');
    }
  }

  function shareContact(user: PublicUser) {
    const shareUrl = `${window.location.origin}/?add_friend=${encodeURIComponent(user.username)}`;
    setSharePayload({
      kind: 'friend',
      title: user.displayName,
      subtitle: `@${user.username}`,
      shareUrl,
      shareText: `تواصل مع ${user.displayName} (@${user.username}) على RetChat`,
    });
  }

  function shareGroup(group: GroupSummary) {
    const shareUrl = `${window.location.origin}/?invite_group=${encodeURIComponent(group.inviteCode)}`;
    setSharePayload({
      kind: 'group',
      title: group.name,
      subtitle: group.promoText || group.description || `${group.memberCount} أعضاء`,
      shareUrl,
      shareText: `انضم إلى مجموعة "${group.name}" الخاصة على RetChat`,
    });
  }

  function shareChannel(ch: ChannelSummary) {
    const shareUrl = `${window.location.origin}/?channel=${encodeURIComponent(ch.handle)}`;
    setSharePayload({
      kind: 'channel',
      title: ch.name,
      subtitle: `@${ch.handle}`,
      shareUrl,
      shareText: `تابع قناة "${ch.name}" (@${ch.handle}) على RetChat`,
    });
  }

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConvId) ?? null,
    [conversations, selectedConvId]
  );

  const activeMessages = useMemo(
    () => (selectedConvId ? messagesByConv[selectedConvId] ?? [] : []),
    [messagesByConv, selectedConvId]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, selectedConvId]);

  useEffect(() => {
    const el = draftInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [draftText, selectedConvId]);

  function emitTyping(isTyping: boolean) {
    if (!selectedConvId || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        type: isTyping ? 'typing:start' : 'typing:stop',
        conversationId: selectedConvId,
      })
    );
  }

  function handleDraftChange(val: string) {
    setDraftText(val);
    const now = Date.now();
    if (val.trim() && now - lastTypingEmitRef.current > 1200) {
      lastTypingEmitRef.current = now;
      emitTyping(true);
    }
    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      emitTyping(false);
    }, 2000);
  }

  async function handleSendText(e?: React.FormEvent) {
    e?.preventDefault();
    if (!selectedConvId || sendingMessage) return;
    const content = draftText.trim();
    if (!content) return;

    const replyTarget = replyingTo;
    setSendingMessage(true);
    setDraftText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    emitTyping(false);

    try {
      await apiRequest<{ message: ChatMessage }>(
        `/api/conversations/${encodeURIComponent(selectedConvId)}/messages`,
        {
          method: 'POST',
          token,
          body: {
            type: 'text',
            content,
            replyToId: replyTarget?.id ?? null,
          },
        }
      );
    } catch (err) {
      setDraftText(content);
      setReplyingTo(replyTarget);
      showToast((err as Error).message || 'تعذر إرسال الرسالة');
    } finally {
      setSendingMessage(false);
    }
  }

  async function uploadAndSendFile(file: File, messageType: 'file' | 'voice', durationSec?: number) {
    if (!selectedConvId) return;
    if (file.size > 50 * 1024 * 1024) {
      showToast('حجم الملف يتجاوز الحد الأقصى (50 ميجابايت)');
      return;
    }

    const replyTarget = replyingTo;
    setReplyingTo(null);
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('conversationId', selectedConvId);
      formData.append('file', file);

      const uploadRes = await apiRequest<{ file: { id: string } }>('/api/upload', {
        method: 'POST',
        token,
        formData,
      });

      await apiRequest<{ message: ChatMessage }>(
        `/api/conversations/${encodeURIComponent(selectedConvId)}/messages`,
        {
          method: 'POST',
          token,
          body: {
            type: messageType,
            fileId: uploadRes.file.id,
            durationSec: durationSec ?? null,
            replyToId: replyTarget?.id ?? null,
          },
        }
      );
    } catch (err) {
      showToast((err as Error).message || 'تعذر رفع الملف');
    } finally {
      setUploadingFile(false);
    }
  }

  function jumpToMessage(messageId: string) {
    const el = document.getElementById(`msg-${messageId}`);
    if (!el) {
      showToast('الرسالة غير ظاهرة في السجل الحالي');
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMsgId(messageId);
    window.setTimeout(() => {
      setHighlightedMsgId((prev) => (prev === messageId ? null : prev));
    }, 1500);
  }

  async function handleToggleReaction(messageId: string, emoji: string) {
    if (!selectedConvId) return;
    setContextMenu(null);
    try {
      const res = await apiRequest<{ reactions: MessageReaction[] }>(
        `/api/conversations/${encodeURIComponent(selectedConvId)}/messages/${encodeURIComponent(messageId)}/react`,
        {
          method: 'POST',
          token,
          body: { emoji },
        }
      );
      setMessagesByConv((prev) => {
        const list = prev[selectedConvId];
        if (!list) return prev;
        return {
          ...prev,
          [selectedConvId]: list.map((m) =>
            m.id === messageId ? { ...m, reactions: res.reactions } : m
          ),
        };
      });
    } catch {
      showToast('تعذر حفظ التعليق');
    }
  }

  async function handleTogglePin(messageId: string | null) {
    if (!selectedConvId) return;
    setContextMenu(null);
    try {
      const res = await apiRequest<{ pinnedMessage: ChatMessage | null }>(
        `/api/conversations/${encodeURIComponent(selectedConvId)}/pin`,
        {
          method: 'POST',
          token,
          body: { messageId },
        }
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId ? { ...c, pinnedMessage: res.pinnedMessage } : c
        )
      );
      showToast(res.pinnedMessage ? 'تم تثبيت الرسالة بالأعلى' : 'تم إلغاء تثبيت الرسالة');
    } catch {
      showToast('تعذر تحديث تثبيت الرسالة');
    }
  }

  function handleCopyMessage(msg: ChatMessage) {
    const text =
      msg.content ||
      (msg.type === 'file' ? msg.file?.originalName ?? '' : 'رسالة صوتية');
    if (text) {
      void navigator.clipboard.writeText(text);
      showToast('تم نسخ الرسالة');
    }
    setContextMenu(null);
  }

  function handleStartReply(msg: ChatMessage) {
    setReplyingTo(msg);
    setContextMenu(null);
    window.setTimeout(() => {
      draftInputRef.current?.focus();
    }, 40);
  }

  async function handleDeleteDirectMessage(msg: ChatMessage, scope: 'me' | 'everyone') {
    if (!selectedConvId) return;
    const convId = selectedConvId;
    setContextMenu(null);
    try {
      const res = await apiRequest<{
        deleted: boolean;
        scope: 'me' | 'everyone';
        messageId: string;
        lastMessage: ChatMessage | null;
        wasPinned?: boolean;
      }>(
        `/api/conversations/${encodeURIComponent(convId)}/messages/${encodeURIComponent(msg.id)}?scope=${scope}`,
        {
          method: 'DELETE',
          token,
          body: { scope },
        }
      );

      setMessagesByConv((prev) => {
        const list = prev[convId];
        if (!list) return prev;
        return { ...prev, [convId]: list.filter((m) => m.id !== msg.id) };
      });
      setReplyingTo((prev) => (prev?.id === msg.id ? null : prev));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                lastMessage: res.lastMessage,
                pinnedMessage: res.wasPinned ? null : c.pinnedMessage,
              }
            : c
        )
      );
      showToast(scope === 'everyone' ? 'تم مسح الرسالة لدى الجميع' : 'تم مسح الرسالة لديك');
    } catch (err) {
      showToast((err as Error).message || 'تعذر مسح الرسالة');
    }
  }

  function handleStartMultiSelect(msg: ChatMessage) {
    setContextMenu(null);
    setSelectionMode(true);
    setSelectedMsgIds(new Set([msg.id]));
  }

  function toggleSelectMessage(msgId: string) {
    setSelectedMsgIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  }

  function toggleSelectAllMessages() {
    if (activeMessages.length === 0) return;
    setSelectedMsgIds((prev) =>
      prev.size === activeMessages.length ? new Set() : new Set(activeMessages.map((m) => m.id))
    );
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedMsgIds(new Set());
    setBulkDeleteConfirmOpen(false);
  }

  async function handleBulkDeleteDirectMessages(scope: 'me' | 'everyone') {
    if (!selectedConvId || deletingBulk) return;
    const convId = selectedConvId;
    const ids = Array.from(selectedMsgIds);
    if (ids.length === 0) return;
    setDeletingBulk(true);
    try {
      const res = await apiRequest<{
        deleted: boolean;
        scope: 'me' | 'everyone';
        deletedIds: string[];
        lastMessage: ChatMessage | null;
        wasPinned?: boolean;
      }>(`/api/conversations/${encodeURIComponent(convId)}/messages/bulk-delete`, {
        method: 'POST',
        token,
        body: { messageIds: ids, scope },
      });

      const deletedSet = new Set(res.deletedIds);
      setMessagesByConv((prev) => {
        const list = prev[convId];
        if (!list) return prev;
        return { ...prev, [convId]: list.filter((m) => !deletedSet.has(m.id)) };
      });
      setReplyingTo((prev) => (prev && deletedSet.has(prev.id) ? null : prev));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                lastMessage: res.lastMessage,
                pinnedMessage: res.wasPinned ? null : c.pinnedMessage,
              }
            : c
        )
      );
      exitSelectionMode();
      showToast(
        scope === 'everyone'
          ? `تم مسح ${res.deletedIds.length} رسالة لدى الجميع`
          : `تم مسح ${res.deletedIds.length} رسالة لديك`
      );
    } catch (err) {
      showToast((err as Error).message || 'تعذر حذف الرسائل المحددة');
    } finally {
      setDeletingBulk(false);
    }
  }

  async function startVoiceRecording() {
    if (!selectedConvId || isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordStreamRef.current = stream;

      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      const chosenMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
      const recorder = chosenMime
        ? new MediaRecorder(stream, { mimeType: chosenMime })
        : new MediaRecorder(stream);

      recordChunksRef.current = [];
      recordCancelRef.current = false;
      const startedAt = Date.now();

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) recordChunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        for (const track of stream.getTracks()) track.stop();
        recordStreamRef.current = null;
        if (recordTimerRef.current !== null) {
          window.clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        setIsRecording(false);
        const dur = Math.max(1, (Date.now() - startedAt) / 1000);
        setRecordingSec(0);

        if (recordCancelRef.current || recordChunksRef.current.length === 0) return;

        const mime = recorder.mimeType || 'audio/webm';
        const ext = mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'm4a' : 'webm';
        const blob = new Blob(recordChunksRef.current, { type: mime });
        const audioFile = new File([blob], `voice-${Date.now()}.${ext}`, { type: mime });
        void uploadAndSendFile(audioFile, 'voice', dur);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSec(0);
      recordTimerRef.current = window.setInterval(() => {
        setRecordingSec(Math.floor((Date.now() - startedAt) / 1000));
      }, 400);
    } catch {
      showToast('يرجى السماح بالوصول إلى الميكروفون لتسجيل رسالة صوتية');
    }
  }

  function stopVoiceRecording(cancel: boolean) {
    recordCancelRef.current = cancel;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }

  function createPeerConnection(callId: string, peerId: string) {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'call:ice-candidate',
            callId,
            toUserId: peerId,
            candidate: event.candidate.toJSON(),
          })
        );
      }
    };

    pc.ontrack = (event) => {
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
        void remoteAudioRef.current.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        stopRingtone();
        setActiveCall((prev) =>
          prev && prev.phase !== 'connected'
            ? { ...prev, phase: 'connected', startedAt: prev.startedAt ?? Date.now() }
            : prev
        );
      }
    };

    return pc;
  }

  async function startVoiceCall() {
    if (!activeConversation || activeCall) return;
    if (!activeConversation.peer.online) {
      showToast('المستخدم غير متصل حالياً لإجراء مكالمة صوتية');
      return;
    }

    const callId = crypto.randomUUID();
    const peer = activeConversation.peer;
    const convId = activeConversation.id;

    let stream: MediaStream | null = null;
    let micError: string | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localCallStreamRef.current = stream;
      startAudioLevelMeter(stream);
    } catch {
      micError = 'تعذر الوصول للميكروفون؛ المكالمة بالاستماع فقط';
    }

    const pc = createPeerConnection(callId, peer.id);
    if (stream) {
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }
    } else {
      pc.addTransceiver('audio', { direction: 'recvonly' });
    }

    setActiveCall({
      callId,
      conversationId: convId,
      peer,
      direction: 'outgoing',
      phase: 'ringing',
      startedAt: null,
      muted: false,
      micError,
    });
    startRingtone(false);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      wsRef.current?.send(
        JSON.stringify({
          type: 'call:offer',
          callId,
          conversationId: convId,
          sdp: offer,
        })
      );
    } catch {
      cleanupCallMedia();
      setActiveCall(null);
      showToast('تعذر بدء المكالمة الصوتية');
    }
  }

  async function acceptIncomingCall() {
    const call = activeCallRef.current;
    const offer = pendingOfferRef.current;
    if (!call || !offer) return;

    stopRingtone();
    setActiveCall((prev) => (prev ? { ...prev, phase: 'connecting' } : null));

    let stream: MediaStream | null = null;
    let micError: string | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localCallStreamRef.current = stream;
      startAudioLevelMeter(stream);
    } catch {
      micError = 'تعذر الوصول للميكروفون؛ المكالمة بالاستماع فقط';
    }

    const pc = createPeerConnection(call.callId, call.peer.id);
    if (stream) {
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      for (const cand of iceQueueRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
      }
      iceQueueRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsRef.current?.send(
        JSON.stringify({
          type: 'call:answer',
          callId: call.callId,
          toUserId: call.peer.id,
          sdp: answer,
        })
      );

      setActiveCall((prev) =>
        prev
          ? { ...prev, phase: 'connected', startedAt: Date.now(), micError }
          : null
      );
    } catch {
      cleanupCallMedia();
      setActiveCall(null);
      showToast('تعذر قبول المكالمة');
    }
  }

  function rejectIncomingCall() {
    const call = activeCallRef.current;
    if (!call) return;
    wsRef.current?.send(
      JSON.stringify({
        type: 'call:reject',
        callId: call.callId,
        toUserId: call.peer.id,
        conversationId: call.conversationId,
        reason: 'rejected',
      })
    );
    cleanupCallMedia();
    setActiveCall(null);
  }

  function hangupCall() {
    const call = activeCallRef.current;
    if (!call) return;
    const wasConnected = call.phase === 'connected';
    const durationSec =
      wasConnected && call.startedAt ? Math.round((Date.now() - call.startedAt) / 1000) : 0;

    wsRef.current?.send(
      JSON.stringify({
        type: 'call:hangup',
        callId: call.callId,
        toUserId: call.peer.id,
        conversationId: call.conversationId,
        wasConnected,
        isInitiator: call.direction === 'outgoing',
        durationSec,
        saveLog: true,
      })
    );
    cleanupCallMedia();
    setActiveCall(null);
  }

  function toggleCallMute() {
    setActiveCall((prev) => {
      if (!prev) return null;
      const nextMuted = !prev.muted;
      if (localCallStreamRef.current) {
        for (const track of localCallStreamRef.current.getAudioTracks()) {
          track.enabled = !nextMuted;
        }
      }
      return { ...prev, muted: nextMuted };
    });
  }

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().replace(/^@+/, '').toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.peer.username.toLowerCase().includes(q) ||
        c.peer.displayName.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.promoText.toLowerCase().includes(q)
    );
  }, [groups, searchQuery]);

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  );

  function copyOwnHandle() {
    void navigator.clipboard.writeText(`@${currentUser.username}`);
    setCopiedSelfHandle(true);
    window.setTimeout(() => setCopiedSelfHandle(false), 1800);
  }

  const isInsideGroup = activeNav === 'chats' && Boolean(activeGroup);
  const isInsideChannel = activeNav === 'channels' && isChannelOpen;
  const hideOuterChrome = isInsideGroup || isInsideChannel;
  const isMobileInsideChat = activeNav === 'chats' && Boolean(selectedConvId || activeGroup);
  const activeWallpaper = getChatWallpaper(currentUser.chatWallpaper);

  return (
    <div className="h-dvh w-full bg-[#e5ece7] dark:bg-[#060a09] flex items-center justify-center overflow-hidden">
      {/* Android Adaptive App Container */}
      <div className="w-full h-dvh lg:max-w-[1160px] lg:h-[calc(100dvh-24px)] lg:rounded-[28px] lg:border lg:border-emerald-950/10 dark:lg:border-white/10 lg:shadow-2xl overflow-hidden bg-[#f7f9f7] dark:bg-[#0d1311] text-[#181d1b] dark:text-[#e6ece9] flex flex-col">
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        {/* Clean Top App Bar + Friends Search Bar (completely hidden inside private group, open channel, or mobile active chat) */}
        {!hideOuterChrome && (
          <header
            className={`bg-white dark:bg-[#141c19] border-b border-emerald-950/10 dark:border-white/10 px-4 pt-3 pb-3 space-y-2.5 shrink-0 z-30 ${
              isMobileInsideChat ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/faction.png"
                  alt="RetChat"
                  className="w-9 h-9 rounded-xl object-cover shadow-xs shrink-0"
                />
                <div className="flex items-baseline gap-2">
                  <h1 className="text-lg font-bold leading-none">RetChat</h1>
                  <span className="text-[11px] font-medium text-[#006c51] dark:text-[#4fd8b0]">
                    {wsConnected ? '· متصل' : '· جارٍ الاتصال'}
                  </span>
                </div>
              </div>

              <span className="font-mono-handle text-xs text-slate-500 dark:text-slate-400">
                @{currentUser.username}
              </span>
            </div>

            {/* Friends-only Long Search Bar */}
            {activeNav !== 'settings' && (
              <div className="flex items-center bg-[#eff4f0] dark:bg-[#1d2623] rounded-full px-3.5 py-1 gap-2 focus-within:ring-2 focus-within:ring-[#006c51]/35">
                <Search className="w-4 h-4 text-slate-500 shrink-0 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeNav === 'chats'
                      ? 'ابحث في الأصدقاء والمجموعات...'
                      : activeNav === 'channels'
                        ? 'ابحث في القنوات...'
                        : 'ابحث في أحداث الأصدقاء...'
                  }
                  className="flex-1 min-w-0 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none py-1.5"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="مسح البحث"
                    className="w-7 h-7 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </header>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {activeNav === 'chats' && activeGroup ? (
            <GroupRoomView
              group={activeGroup}
              token={token}
              currentUser={currentUser}
              friends={friends}
              incomingMessage={incomingGroupMessage}
              incomingDeletedMsg={incomingDeletedGroupMsg}
              incomingDeletedBulk={incomingDeletedGroupBulk}
              onBack={() => setSelectedGroupId(null)}
              onGroupUpdated={(updatedGroup) => {
                setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
              }}
              onShareGroup={shareGroup}
              onImageClick={(url, title) => setLightboxImage({ url, title })}
              onShowToast={showToast}
            />
          ) : activeNav === 'chats' && (
            <>
              {/* Friends, Incoming Requests & Private Groups List + Bottom (+) FAB */}
              <aside
                className={`relative w-full lg:w-[350px] h-full flex flex-col bg-white dark:bg-[#141c19] border-l border-emerald-950/10 dark:border-white/10 shrink-0 ${
                  selectedConvId ? 'hidden lg:flex' : 'flex'
                }`}
              >
                {/* Segmented Filter Tabs */}
                <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 flex items-center gap-1.5 shrink-0">
                  {(
                    [
                      { id: 'all', label: 'الكل' },
                      { id: 'chats', label: `المحادثات (${conversations.length})` },
                      { id: 'groups', label: `المجموعات (${groups.length})` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setChatFilterTab(tab.id)}
                      className={`flex-1 min-h-[34px] px-2.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                        chatFilterTab === tab.id
                          ? 'bg-[#c5efe0] dark:bg-[#00513d] text-[#002117] dark:text-[#b8f3dd]'
                          : 'bg-[#f7f9f7] dark:bg-[#1b2421] text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto pb-24">
                  {/* Incoming Friend Requests Section */}
                  {incomingRequests.length > 0 && (
                    <div className="p-3 bg-[#f2fbf7] dark:bg-[#13221d] border-b border-emerald-950/10 dark:border-white/10 space-y-2">
                      <p className="text-[11px] font-bold text-[#006c51] dark:text-[#4fd8b0] flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>طلبات صداقة واردة ({incomingRequests.length})</span>
                      </p>
                      <div className="space-y-2">
                        {incomingRequests.map((reqUser) => (
                          <div
                            key={reqUser.id}
                            className="p-2.5 rounded-2xl bg-white dark:bg-[#1b2421] flex items-center justify-between gap-2 shadow-xs"
                          >
                            <button
                              type="button"
                              onClick={() => setContactProfileUser(reqUser)}
                              className="flex items-center gap-2.5 min-w-0 flex-1 text-right cursor-pointer"
                            >
                              <UserAvatar
                                displayName={reqUser.displayName}
                                avatarColor={reqUser.avatarColor}
                                avatarUrl={reqUser.avatarUrl}
                                sizeClass="w-10 h-10"
                                textClass="text-xs"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{reqUser.displayName}</p>
                                <p className="font-mono-handle text-[11px] text-[#006c51] dark:text-[#4fd8b0] truncate">
                                  @{reqUser.username}
                                </p>
                              </div>
                            </button>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => void handleRespondFriendRequest(reqUser.id, 'accept')}
                                className="min-h-[32px] px-3 rounded-full bg-[#006c51] text-white text-[11px] font-bold cursor-pointer"
                              >
                                قبول
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleRespondFriendRequest(reqUser.id, 'decline')}
                                className="min-h-[32px] px-2.5 rounded-full bg-[#eff4f0] dark:bg-[#26322e] text-slate-600 dark:text-slate-300 text-[11px] font-semibold cursor-pointer"
                              >
                                رفض
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Private Groups List */}
                  {(chatFilterTab === 'all' || chatFilterTab === 'groups') && filteredGroups.length > 0 && (
                    <div className="divide-y divide-slate-100 dark:divide-white/5 border-b border-slate-100 dark:border-white/5">
                      {chatFilterTab === 'all' && (
                        <div className="px-4 py-1.5 bg-[#f7f9f7] dark:bg-[#18201d] text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#006c51] dark:text-[#4fd8b0]" />
                          <span>المجموعات الخاصة</span>
                        </div>
                      )}
                      {filteredGroups.map((grp) => {
                        const lastGm = grp.lastMessage;
                        const grpPreview = !lastGm
                          ? grp.promoText || grp.description || `${grp.memberCount} أعضاء`
                          : lastGm.type === 'voice'
                            ? `${lastGm.senderName}: رسالة صوتية`
                            : lastGm.type === 'file'
                              ? `${lastGm.senderName}: ${lastGm.file?.originalName ?? 'مرفق'}`
                              : `${lastGm.senderName}: ${lastGm.content}`;

                        return (
                          <button
                            key={grp.id}
                            type="button"
                            onClick={() => openGroup(grp.id)}
                            className="w-full px-4 py-3.5 flex items-center gap-3.5 text-right transition-colors cursor-pointer hover:bg-[#f7f9f7] dark:hover:bg-[#192320]"
                          >
                            {grp.avatarUrl ? (
                              <img
                                src={grp.avatarUrl}
                                alt={grp.name}
                                className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-xs"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-[#c5efe0] dark:bg-[#00513d] text-[#006c51] dark:text-[#4fd8b0] flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold truncate">{grp.name}</span>
                                <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                                  {formatTime(lastGm ? lastGm.createdAt : grp.updatedAt)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-0.5">
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {grpPreview}
                                </p>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#eff4f0] dark:bg-[#1d2623] text-[#006c51] dark:text-[#4fd8b0] shrink-0">
                                  {grp.memberCount}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Direct Friend Conversations */}
                  {(chatFilterTab === 'all' || chatFilterTab === 'chats') && (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                      {loadingConvs ? (
                        <div className="p-4 space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-16 rounded-2xl bg-[#eff4f0] dark:bg-[#1b2421] animate-pulse"
                            />
                          ))}
                        </div>
                      ) : filteredConversations.length === 0 &&
                        (chatFilterTab === 'chats' || filteredGroups.length === 0) ? (
                        <div className="p-8 text-center space-y-2.5 mt-4">
                          <p className="text-sm font-bold">
                            {searchQuery ? 'لا توجد نتائج في الأصدقاء' : 'لا توجد محادثات بعد'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            اضغط على زر{' '}
                            <span className="font-bold text-[#006c51] dark:text-[#4fd8b0]">+</span>{' '}
                            بالأسفل لإرسال طلب صداقة عبر المعرّف أو إنشاء مجموعة خاصة.
                          </p>
                        </div>
                      ) : (
                        filteredConversations.map((conv) => {
                          const isSelected = conv.id === selectedConvId;
                          const isTyping = Boolean(typingByConv[conv.id]);
                          const lastMsg = conv.lastMessage;
                          const isLastOutgoing = lastMsg?.senderId === currentUser.id;
                          const lastPreview = isTyping
                            ? 'يكتب الآن...'
                            : !lastMsg
                              ? conv.peer.currentStatus || `@${conv.peer.username}`
                              : lastMsg.type === 'voice'
                                ? 'رسالة صوتية'
                                : lastMsg.type === 'file'
                                  ? `ملف: ${lastMsg.file?.originalName ?? ''}`
                                  : lastMsg.type === 'call'
                                    ? lastMsg.callStatus === 'missed'
                                      ? 'مكالمة فائتة'
                                      : lastMsg.callStatus === 'rejected'
                                        ? 'مكالمة مرفوضة'
                                        : 'مكالمة صوتية'
                                    : lastMsg.content;

                          return (
                            <button
                              key={conv.id}
                              type="button"
                              onClick={() => void openConversation(conv.id)}
                              className={`w-full px-4 py-3.5 flex items-center gap-3.5 text-right transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#e6f4ee] dark:bg-[#1d2b26]'
                                  : 'hover:bg-[#f7f9f7] dark:hover:bg-[#192320]'
                              }`}
                            >
                              <UserAvatar
                                displayName={conv.peer.displayName}
                                avatarColor={conv.peer.avatarColor}
                                avatarUrl={conv.peer.avatarUrl}
                                sizeClass="w-12 h-12"
                                textClass="text-sm"
                                online={conv.peer.online}
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-sm font-bold truncate">
                                      {conv.peer.displayName}
                                    </span>
                                    {conv.peer.online && (
                                      <span className="text-[11px] font-medium text-[#006c51] dark:text-[#4fd8b0] shrink-0">
                                        · {conv.peer.currentStatus || 'متصل'}
                                      </span>
                                    )}
                                  </div>
                                  {lastMsg && (
                                    <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                                      {formatTime(lastMsg.createdAt)}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                  <div className="flex items-center gap-1 min-w-0 flex-1">
                                    {isLastOutgoing && lastMsg && lastMsg.type !== 'call' && (
                                      <span className="inline-flex items-center shrink-0">
                                        {lastMsg.status === 'read' ? (
                                          <CheckCheck className="w-3.5 h-3.5 text-[#0284c7] dark:text-[#38bdf8]" />
                                        ) : lastMsg.status === 'delivered' ? (
                                          <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5 text-slate-400" />
                                        )}
                                      </span>
                                    )}
                                    <p
                                      className={`text-xs truncate ${
                                        isTyping
                                          ? 'text-[#006c51] dark:text-[#4fd8b0] font-semibold'
                                          : 'text-slate-500 dark:text-slate-400'
                                      }`}
                                    >
                                      {lastPreview}
                                    </p>
                                  </div>

                                  {conv.unreadCount > 0 && (
                                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#006c51] text-white text-[11px] font-bold tabular-nums flex items-center justify-center shrink-0">
                                      {conv.unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {chatFilterTab === 'groups' && filteredGroups.length === 0 && (
                    <div className="p-8 text-center space-y-2.5 mt-4">
                      <p className="text-sm font-bold">لا توجد مجموعات خاصة بعد</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        اضغط على زر + لإنشاء مجموعة خاصة مع أصدقائك.
                      </p>
                    </div>
                  )}
                </div>

                {/* Speed-Dial Menu above Bottom (+) FAB */}
                {showFabMenu && (
                  <>
                    <div
                      onClick={() => setShowFabMenu(false)}
                      className="fixed inset-0 z-10"
                    />
                    <div className="absolute bottom-20 left-4 z-20 flex flex-col items-start gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowFabMenu(false);
                          setShowCreateGroupModal(true);
                        }}
                        className="min-h-[42px] px-4 rounded-2xl bg-white dark:bg-[#1b2421] border border-emerald-950/10 dark:border-white/10 shadow-lg text-xs font-bold flex items-center gap-2.5 cursor-pointer hover:bg-[#eff4f0] dark:hover:bg-[#23302c]"
                      >
                        <Users className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0]" />
                        <span>إنشاء مجموعة خاصة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowFabMenu(false);
                          setShowFindUserModal(true);
                        }}
                        className="min-h-[42px] px-4 rounded-2xl bg-white dark:bg-[#1b2421] border border-emerald-950/10 dark:border-white/10 shadow-lg text-xs font-bold flex items-center gap-2.5 cursor-pointer hover:bg-[#eff4f0] dark:hover:bg-[#23302c]"
                      >
                        <UserPlus className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0]" />
                        <span>إضافة صديق بالمعرّف</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Bottom (+) Floating Action Button */}
                <button
                  type="button"
                  onClick={() => setShowFabMenu((v) => !v)}
                  aria-label="بحث أو إنشاء مجموعة"
                  className={`absolute bottom-4 left-4 w-14 h-14 rounded-2xl bg-[#006c51] hover:bg-[#005842] text-white shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform z-20 ${
                    showFabMenu ? 'rotate-45' : ''
                  }`}
                >
                  <Plus className="w-6 h-6" />
                </button>
              </aside>

              {/* Active Chat Stage (Mobile-optimized fixed header + scrollable feed + fixed composer) */}
              <main
                className={`flex-1 h-full min-h-0 flex flex-col relative min-w-0 ${
                  selectedConvId ? 'flex' : 'hidden lg:flex'
                }`}
                onDragOver={(e) => {
                  if (!selectedConvId) return;
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (!selectedConvId) return;
                  const files = Array.from(e.dataTransfer.files ?? []);
                  if (files.length > 0) {
                    void (async () => {
                      for (const file of files) {
                        await uploadAndSendFile(file, 'file');
                      }
                    })();
                  }
                }}
              >
                {activeConversation ? (
                  <>
                    {/* Chat Header OR Multi-Selection Action Bar */}
                    {selectionMode ? (
                      <header className="h-14 px-3 sm:px-4 bg-[#e6f4ee] dark:bg-[#132620] border-b border-[#006c51]/25 dark:border-[#4fd8b0]/20 flex items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={exitSelectionMode}
                            aria-label="إلغاء التحديد"
                            className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer shrink-0"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <span className="text-sm font-bold tabular-nums truncate">
                            تم تحديد {selectedMsgIds.size}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={toggleSelectAllMessages}
                            className="min-h-[36px] px-3.5 rounded-full bg-white dark:bg-[#1d2b26] border border-[#006c51]/20 dark:border-[#4fd8b0]/20 text-xs font-bold text-[#006c51] dark:text-[#4fd8b0] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>
                              {activeMessages.length > 0 &&
                              selectedMsgIds.size === activeMessages.length
                                ? 'إلغاء الكل'
                                : 'تحديد الكل'}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={selectedMsgIds.size === 0}
                            onClick={() => setBulkDeleteConfirmOpen(true)}
                            className="min-h-[36px] px-3.5 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-45 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </header>
                    ) : (
                      <header className="h-14 px-3 sm:px-4 bg-white dark:bg-[#141c19] border-b border-emerald-950/10 dark:border-white/10 flex items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => {
                              exitSelectionMode();
                              setSelectedConvId(null);
                            }}
                            aria-label="العودة"
                            className="lg:hidden w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer shrink-0"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setContactProfileUser({
                                ...activeConversation.peer,
                                friendshipStatus: 'accepted',
                              })
                            }
                            aria-label="عرض معلومات جهة الاتصال"
                            className="flex items-center gap-2.5 min-w-0 flex-1 text-right cursor-pointer rounded-2xl py-1 px-1.5 hover:bg-[#eff4f0] dark:hover:bg-[#1d2623] transition-colors"
                          >
                            <UserAvatar
                              displayName={activeConversation.peer.displayName}
                              avatarColor={activeConversation.peer.avatarColor}
                              avatarUrl={activeConversation.peer.avatarUrl}
                              sizeClass="w-9 h-9"
                              textClass="text-xs"
                              online={activeConversation.peer.online}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h2 className="text-sm font-bold truncate">
                                  {activeConversation.peer.displayName}
                                </h2>
                                <span className="hidden sm:inline font-mono-handle text-[11px] text-slate-400">
                                  @{activeConversation.peer.username}
                                </span>
                              </div>
                              <p
                                className={`text-[11px] truncate ${
                                  typingByConv[activeConversation.id] || activeConversation.peer.online
                                    ? 'text-[#006c51] dark:text-[#4fd8b0] font-medium'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {typingByConv[activeConversation.id]
                                  ? 'يكتب الآن...'
                                  : activeConversation.peer.online
                                    ? activeConversation.peer.currentStatus &&
                                      activeConversation.peer.currentStatus !== 'متصل'
                                      ? `متصل · ${activeConversation.peer.currentStatus}`
                                      : 'متصل الآن'
                                    : `آخر ظهور ${formatLastSeen(activeConversation.peer.lastSeen)}`}
                              </p>
                            </div>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => shareContact(activeConversation.peer)}
                            aria-label="مشاركة جهة الاتصال"
                            className="w-9 h-9 rounded-full bg-[#eff4f0] dark:bg-[#1d2623] text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void startVoiceCall()}
                            aria-label="مكالمة صوتية"
                            className="min-h-[38px] px-3.5 rounded-full bg-[#c5efe0] dark:bg-[#00513d] text-[#002117] dark:text-[#b8f3dd] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 active:scale-95 transition-transform"
                          >
                            <Phone className="w-4 h-4" />
                            <span>اتصال</span>
                          </button>
                        </div>
                      </header>
                    )}

                    {/* Pinned Message Banner */}
                    {activeConversation.pinnedMessage && (
                      <div className="px-3 sm:px-4 py-2 bg-[#eff4f0] dark:bg-[#192320] border-b border-emerald-950/10 dark:border-white/10 flex items-center justify-between gap-2 shrink-0 z-10">
                        <button
                          type="button"
                          onClick={() => jumpToMessage(activeConversation.pinnedMessage!.id)}
                          className="min-w-0 flex-1 flex items-center gap-2.5 text-right cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#c5efe0] dark:bg-[#00513d] text-[#006c51] dark:text-[#4fd8b0] flex items-center justify-center shrink-0">
                            <Pin className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-[#006c51] dark:text-[#4fd8b0]">
                              رسالة مثبّتة
                            </p>
                            <p className="text-xs text-slate-700 dark:text-slate-200 truncate">
                              {activeConversation.pinnedMessage.type === 'voice'
                                ? 'رسالة صوتية'
                                : activeConversation.pinnedMessage.type === 'file'
                                  ? activeConversation.pinnedMessage.content ||
                                    activeConversation.pinnedMessage.file?.originalName ||
                                    'ملف مرفق'
                                  : activeConversation.pinnedMessage.content}
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleTogglePin(null)}
                          aria-label="إلغاء تثبيت الرسالة"
                          title="إلغاء التثبيت"
                          className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 flex items-center justify-center cursor-pointer shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Scrollable Messages Feed over Selected Wallpaper */}
                    <div
                      className="relative flex-1 min-h-0 flex flex-col overflow-hidden"
                      style={{ backgroundColor: activeWallpaper.fallbackBg }}
                    >
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-cover bg-center pointer-events-none"
                        style={{ backgroundImage: `url(${activeWallpaper.src})` }}
                      />
                      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4 space-y-1">
                        {loadingMessages ? (
                          <div className="flex items-center justify-center h-full">
                            <p className="px-4 py-2 rounded-full bg-white/95 dark:bg-[#1b2421]/95 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs">
                              جارٍ التحميل...
                            </p>
                          </div>
                        ) : activeMessages.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="max-w-xs text-center p-5 rounded-3xl bg-white/95 dark:bg-[#1b2421]/95 shadow-sm space-y-1">
                              <p className="text-sm font-bold">
                                ابدأ المحادثة مع {activeConversation.peer.displayName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                أرسل نصاً، تسجيلاً صوتياً، ملفاً، أو ابدأ مكالمة.
                              </p>
                            </div>
                          </div>
                        ) : (
                          activeMessages.map((msg) => (
                            <MessageBubble
                              key={msg.id}
                              message={msg}
                              isOutgoing={msg.senderId === currentUser.id}
                              isPinned={activeConversation.pinnedMessage?.id === msg.id}
                              isHighlighted={highlightedMsgId === msg.id}
                              isSelected={contextMenu?.message.id === msg.id}
                              selectionMode={selectionMode}
                              isMultiSelected={selectionMode && selectedMsgIds.has(msg.id)}
                              currentUserId={currentUser.id}
                              peerName={activeConversation.peer.displayName}
                              token={token}
                              onImageClick={(url, title) => setLightboxImage({ url, title })}
                              onLongPressMenu={(m, rect) =>
                                setContextMenu({ message: m, rect, showEmojis: false })
                              }
                              onToggleSelect={(m) => toggleSelectMessage(m.id)}
                              onToggleReaction={(mId, em) => void handleToggleReaction(mId, em)}
                              onJumpToMessage={jumpToMessage}
                              onDownloadError={showToast}
                            />
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {dragActive && (
                      <div className="absolute inset-0 z-30 bg-[#006c51]/15 backdrop-blur-xs border-2 border-dashed border-[#006c51] flex items-center justify-center pointer-events-none">
                        <div className="px-6 py-4 rounded-3xl bg-white dark:bg-[#141c19] shadow-lg text-sm font-semibold text-[#006c51] dark:text-[#4fd8b0]">
                          أفلت الملف هنا لإرساله
                        </div>
                      </div>
                    )}

                    {/* Fixed Mobile-Friendly Slim Bottom Composer & Send/Mic Button */}
                    <footer className="relative bg-[#f0ebe3] dark:bg-[#0b1210] px-2.5 sm:px-4 py-1.5 shrink-0 border-t border-emerald-950/5 dark:border-white/5">
                      {uploadingFile && (
                        <div className="mb-1.5 px-4 py-1 rounded-full bg-white dark:bg-[#1d2623] text-xs text-[#006c51] dark:text-[#4fd8b0] font-semibold inline-block shadow-xs">
                          جارٍ رفع المرفق...
                        </div>
                      )}

                      {replyingTo && (
                        <div className="mb-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-[#1d2623] border-r-4 border-[#006c51] dark:border-[#4fd8b0] flex items-center justify-between gap-2 shadow-xs">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-[#006c51] dark:text-[#4fd8b0] truncate">
                              الرد على{' '}
                              {replyingTo.senderId === currentUser.id
                                ? 'نفسك'
                                : activeConversation.peer.displayName}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                              {replyingTo.type === 'voice'
                                ? 'رسالة صوتية'
                                : replyingTo.type === 'file'
                                  ? replyingTo.content ||
                                    replyingTo.file?.originalName ||
                                    'مرفق'
                                  : replyingTo.content}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReplyingTo(null)}
                            aria-label="إلغاء الرد"
                            className="w-7 h-7 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 flex items-center justify-center cursor-pointer shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {showEmojiPicker && (
                        <div className="absolute bottom-full right-3 mb-2 p-2.5 rounded-3xl bg-white dark:bg-[#1b2421] shadow-xl flex flex-wrap gap-1.5 max-w-[260px] z-20">
                          {QUICK_EMOJIS.map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => setDraftText((t) => `${t}${em}`)}
                              className="w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-lg flex items-center justify-center cursor-pointer"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          e.target.value = '';
                          if (files.length > 0) {
                            void (async () => {
                              for (const file of files) {
                                await uploadAndSendFile(file, 'file');
                              }
                            })();
                          }
                        }}
                      />

                      {isRecording ? (
                        <div className="flex items-center justify-between gap-2 bg-white dark:bg-[#1d2623] rounded-full p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => stopVoiceRecording(true)}
                            aria-label="إلغاء التسجيل"
                            className="w-9 h-9 rounded-full text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="flex-1 flex items-center justify-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse shrink-0" />
                            <span className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                              {formatDuration(recordingSec)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => stopVoiceRecording(false)}
                            aria-label="إرسال التسجيل الصوتي"
                            className="w-10 h-10 rounded-full bg-[#006c51] text-white flex items-center justify-center cursor-pointer shrink-0"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSendText} className="flex items-end gap-2 w-full">
                          <div className="flex-1 min-w-0 flex items-end bg-white dark:bg-[#1d2623] rounded-[22px] px-1 py-0.5 shadow-xs border border-emerald-950/5 dark:border-white/5">
                            <button
                              type="button"
                              onClick={() => setShowEmojiPicker((v) => !v)}
                              aria-label="الرموز التعبيرية"
                              className="w-8 h-8 mb-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 cursor-pointer shrink-0"
                            >
                              <Smile className="w-4 h-4" />
                            </button>

                            <textarea
                              ref={draftInputRef}
                              rows={1}
                              enterKeyHint="enter"
                              value={draftText}
                              onChange={(e) => handleDraftChange(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                  e.preventDefault();
                                  void handleSendText();
                                }
                              }}
                              placeholder="رسالة..."
                              className="flex-1 min-w-0 bg-transparent text-sm leading-5 px-2 py-1.5 max-h-32 overflow-y-auto resize-none focus:outline-none"
                            />

                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              aria-label="إرفاق ملف"
                              className="w-8 h-8 mb-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 cursor-pointer shrink-0"
                            >
                              <Paperclip className="w-4 h-4" />
                            </button>
                          </div>

                          {draftText.trim() ? (
                            <button
                              type="submit"
                              disabled={sendingMessage}
                              aria-label="إرسال"
                              className="w-10 h-10 rounded-full bg-[#006c51] hover:bg-[#005842] text-white flex items-center justify-center cursor-pointer shrink-0 shadow-sm active:scale-95 transition-transform"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void startVoiceRecording()}
                              aria-label="تسجيل صوتي"
                              className="w-10 h-10 rounded-full bg-[#006c51] hover:bg-[#005842] text-white flex items-center justify-center cursor-pointer shrink-0 shadow-sm active:scale-95 transition-transform"
                            >
                              <Mic className="w-4 h-4" />
                            </button>
                          )}
                        </form>
                      )}
                    </footer>
                  </>
                ) : (
                  <div
                    className="relative flex-1 flex items-center justify-center p-6 overflow-hidden"
                    style={{ backgroundColor: activeWallpaper.fallbackBg }}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-cover bg-center pointer-events-none"
                      style={{ backgroundImage: `url(${activeWallpaper.src})` }}
                    />
                    <div className="relative z-10 max-w-sm w-full bg-white/95 dark:bg-[#141c19]/95 rounded-3xl p-7 text-center space-y-4 shadow-md">
                      <div className="flex justify-center">
                        <UserAvatar
                          displayName={currentUser.displayName}
                          avatarColor={currentUser.avatarColor}
                          avatarUrl={currentUser.avatarUrl}
                          sizeClass="w-16 h-16"
                          textClass="text-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <h2 className="text-lg font-bold">مرحباً {currentUser.displayName}</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          اختر محادثة من القائمة أو اضغط على زر + لإيجاد أي مستخدم عبر معرّفه.
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#f7f9f7] dark:bg-[#1b2421] flex items-center justify-between gap-2">
                        <span className="font-mono-handle text-xs font-semibold text-[#006c51] dark:text-[#4fd8b0] truncate">
                          @{currentUser.username}
                        </span>
                        <button
                          type="button"
                          onClick={copyOwnHandle}
                          className="min-h-[34px] px-3 rounded-full bg-white dark:bg-[#141c19] text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {copiedSelfHandle ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#006c51]" />
                              <span>تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>نسخ</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </main>
            </>
          )}

          {activeNav === 'channels' && (
            <ChannelsView
              token={token}
              searchQuery={searchQuery}
              searchScope="friends"
              incomingPost={incomingChannelPost}
              incomingChannel={incomingChannel}
              incomingChannelUpdated={incomingChannelUpdated}
              onShareChannel={shareChannel}
              onShowToast={showToast}
              onChannelOpenChange={setIsChannelOpen}
            />
          )}

          {activeNav === 'events' && (
            <EventsView
              token={token}
              searchQuery={searchQuery}
              incomingEvent={incomingEvent}
              incomingRsvp={incomingRsvp}
              onImageClick={(url, title) => setLightboxImage({ url, title })}
              onShowToast={showToast}
            />
          )}

          {activeNav === 'settings' && (
            <SettingsView
              user={currentUser}
              token={token}
              darkMode={darkMode}
              soundEnabled={soundEnabled}
              wsConnected={wsConnected}
              onToggleDark={onToggleDark}
              onToggleSound={() => setSoundEnabled((v) => !v)}
              onUpdated={onUserUpdated}
              onShareSelf={() => shareContact(currentUser)}
              onLogout={onLogout}
              onShowToast={showToast}
            />
          )}
        </div>

        {/* Playful Animated Android Bottom Navigation Bar (hidden inside private group or open channel) */}
        {!hideOuterChrome && (
          <BottomNavBar
            activeNav={activeNav}
            totalUnread={totalUnread}
            hiddenOnMobileChat={isMobileInsideChat}
            onSelect={(tab) => {
              setSelectedGroupId(null);
              if (tab !== 'channels') setIsChannelOpen(false);
              setActiveNav(tab);
            }}
          />
        )}

        {/* Toast Banner */}
        {toastMsg && (
          <div
            role="status"
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#181d1b] dark:bg-[#e6ece9] text-white dark:text-[#181d1b] text-xs font-semibold shadow-lg"
          >
            {toastMsg}
          </div>
        )}

        {/* Voice Call Overlay */}
        {activeCall && (
          <CallOverlay
            call={activeCall}
            elapsedSec={callElapsedSec}
            audioLevel={callAudioLevel}
            onAccept={() => void acceptIncomingCall()}
            onReject={rejectIncomingCall}
            onHangup={hangupCall}
            onToggleMute={toggleCallMute}
          />
        )}

        {/* Global Handle Search & Friend Requests Modal */}
        {showFindUserModal && (
          <FindUserModal
            token={token}
            onClose={() => setShowFindUserModal(false)}
            onStartChat={startChatWithUser}
            onFriendAccepted={() => {
              void loadFriends();
              void loadConversations();
            }}
            onShareContact={shareContact}
            onShowToast={showToast}
          />
        )}

        {/* Create Private Group Modal */}
        {showCreateGroupModal && (
          <CreateGroupModal
            token={token}
            friends={friends}
            onClose={() => setShowCreateGroupModal(false)}
            onCreated={(newGroup) => {
              setGroups((prev) => [newGroup, ...prev.filter((g) => g.id !== newGroup.id)]);
              setShowCreateGroupModal(false);
              openGroup(newGroup.id);
              showToast(`تم إنشاء مجموعة "${newGroup.name}"`);
            }}
            onShowToast={showToast}
          />
        )}

        {/* Contact Full Profile Modal */}
        {contactProfileUser && (
          <ContactProfileModal
            user={contactProfileUser}
            onClose={() => setContactProfileUser(null)}
            onStartCall={
              contactProfileUser.friendshipStatus === 'accepted' ||
              activeConversation?.peer.id === contactProfileUser.id
                ? () => {
                    const peer = contactProfileUser;
                    setContactProfileUser(null);
                    const conv = conversations.find((c) => c.peer.id === peer.id);
                    if (conv) {
                      if (selectedConvId !== conv.id) {
                        void openConversation(conv.id);
                      }
                      window.setTimeout(() => void startVoiceCall(), 150);
                    }
                  }
                : undefined
            }
            onShareContact={shareContact}
            onSendFriendRequest={handleSendFriendRequest}
            onRespondFriendRequest={handleRespondFriendRequest}
            onImageClick={(url, title) => setLightboxImage({ url, title })}
          />
        )}

        {/* Universal Share Sheet (Friends, Groups, Channels) */}
        {sharePayload && (
          <ShareSheetModal
            payload={sharePayload}
            token={token}
            conversations={conversations}
            groups={groups}
            onClose={() => setSharePayload(null)}
            onShowToast={showToast}
          />
        )}

        {/* Post-Login Bio & Status Onboarding Sheet */}
        {showOnboardingModal && (
          <OnboardingBioModal
            token={token}
            user={currentUser}
            onCompleted={(updated) => {
              onUserUpdated(updated);
              setShowOnboardingModal(false);
            }}
            onShowToast={showToast}
          />
        )}

        {/* Long-Press Floating Message Action Menu */}
        {contextMenu && (
          <div
            onClick={() => setContextMenu(null)}
            className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[1px]"
          >
            {(() => {
              const { message, rect, showEmojis } = contextMenu;
              const isPinned = activeConversation?.pinnedMessage?.id === message.id;
              const canDeleteEveryone = message.senderId === currentUser.id;
              const menuWidth = showEmojis ? 276 : 216;
              const menuHeight = canDeleteEveryone
                ? showEmojis
                  ? 390
                  : 330
                : showEmojis
                  ? 344
                  : 286;
              const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
              const vh = typeof window !== 'undefined' ? window.innerHeight : 844;

              const preferredLeft =
                message.senderId === currentUser.id ? rect.left : rect.right - menuWidth;
              const left = Math.max(12, Math.min(vw - menuWidth - 12, preferredLeft));
              const spaceBelow = vh - rect.bottom;
              const top =
                spaceBelow >= menuHeight + 16
                  ? rect.bottom + 8
                  : Math.max(12, rect.top - menuHeight - 8);

              return (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ top, left, width: menuWidth }}
                  className="fixed rounded-3xl bg-white dark:bg-[#1b2421] border border-emerald-950/10 dark:border-white/10 shadow-2xl overflow-hidden"
                >
                  {showEmojis && (
                    <div className="px-2.5 py-2 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-1 bg-[#f7f9f7] dark:bg-[#141c19]">
                      {REACTION_EMOJIS.map((em) => {
                        const mine = message.reactions?.some(
                          (r) => r.userId === currentUser.id && r.emoji === em
                        );
                        return (
                          <button
                            key={em}
                            type="button"
                            onClick={() => void handleToggleReaction(message.id, em)}
                            className={`w-8 h-8 rounded-full text-lg flex items-center justify-center cursor-pointer transition-transform active:scale-125 ${
                              mine
                                ? 'bg-[#c5efe0] dark:bg-[#00513d] ring-1 ring-[#006c51]/40'
                                : 'hover:bg-black/5 dark:hover:bg-white/10'
                            }`}
                          >
                            {em}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="py-1.5 divide-y divide-slate-100 dark:divide-white/5">
                    <button
                      type="button"
                      onClick={() => handleStartMultiSelect(message)}
                      className="w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-3 hover:bg-[#eff4f0] dark:hover:bg-[#232f2b] cursor-pointer"
                    >
                      <span>تحديد</span>
                      <CheckSquare className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(message)}
                      className="w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-3 hover:bg-[#eff4f0] dark:hover:bg-[#232f2b] cursor-pointer"
                    >
                      <span>نسخ</span>
                      <Copy className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartReply(message)}
                      className="w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-3 hover:bg-[#eff4f0] dark:hover:bg-[#232f2b] cursor-pointer"
                    >
                      <span>رد</span>
                      <Reply className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0]" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setContextMenu((prev) =>
                          prev ? { ...prev, showEmojis: !prev.showEmojis } : null
                        )
                      }
                      className="w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-3 hover:bg-[#eff4f0] dark:hover:bg-[#232f2b] cursor-pointer"
                    >
                      <span>تعليق</span>
                      <SmilePlus className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleTogglePin(isPinned ? null : message.id)}
                      className="w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-3 hover:bg-[#eff4f0] dark:hover:bg-[#232f2b] cursor-pointer"
                    >
                      <span>{isPinned ? 'إلغاء التثبيت' : 'تثبيت'}</span>
                      {isPinned ? (
                        <PinOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Pin className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDeleteDirectMessage(message, 'me')}
                      className="w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-3 hover:bg-[#eff4f0] dark:hover:bg-[#232f2b] cursor-pointer text-slate-700 dark:text-slate-200"
                    >
                      <span>مسح لدي</span>
                      <Trash className="w-4 h-4 text-slate-500" />
                    </button>

                    {canDeleteEveryone && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteDirectMessage(message, 'everyone')}
                        className="w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-3 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer text-rose-600 dark:text-rose-400"
                      >
                        <span>مسح لدى الجميع</span>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Bulk Delete Confirmation Modal (Direct Messages) */}
        {bulkDeleteConfirmOpen && (() => {
          const canDeleteAllForEveryone =
            selectedMsgIds.size > 0 &&
            activeMessages
              .filter((m) => selectedMsgIds.has(m.id))
              .every((m) => m.senderId === currentUser.id);

          return (
            <div
              onClick={() => !deletingBulk && setBulkDeleteConfirmOpen(false)}
              className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#141c19] border border-emerald-950/10 dark:border-white/10 p-5 shadow-2xl space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-bold">
                    حذف {selectedMsgIds.size} {selectedMsgIds.size === 1 ? 'رسالة' : 'رسائل'}؟
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    اختر هل تريد مسح الرسائل المحددة من حسابك فقط أم لدى الجميع:
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={deletingBulk}
                    onClick={() => void handleBulkDeleteDirectMessages('me')}
                    className="w-full min-h-[44px] px-4 rounded-2xl bg-[#eff4f0] dark:bg-[#1d2623] hover:bg-[#e1ebe4] dark:hover:bg-[#26322e] text-sm font-bold flex items-center justify-between cursor-pointer disabled:opacity-50"
                  >
                    <span>مسح لدي</span>
                    <Trash className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>

                  <button
                    type="button"
                    disabled={deletingBulk || !canDeleteAllForEveryone}
                    onClick={() => void handleBulkDeleteDirectMessages('everyone')}
                    className="w-full min-h-[44px] px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center justify-between cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="text-right">
                      <span>مسح لدى الجميع</span>
                      {!canDeleteAllForEveryone && (
                        <p className="text-[10px] font-normal opacity-80">
                          متاح فقط للرسائل المرسلة منك
                        </p>
                      )}
                    </div>
                    <Trash2 className="w-4 h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    disabled={deletingBulk}
                    onClick={() => setBulkDeleteConfirmOpen(false)}
                    className="w-full min-h-[42px] px-4 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Image Lightbox */}
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          >
            <div className="w-full max-w-4xl flex items-center justify-between text-white mb-3">
              <span className="text-sm font-medium truncate">{lightboxImage.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                aria-label="إغلاق المعاينة"
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[82vh] max-w-full rounded-2xl object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
