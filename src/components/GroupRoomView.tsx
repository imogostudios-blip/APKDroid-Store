import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckSquare,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Info,
  Link2,
  Mic,
  MoreVertical,
  Paperclip,
  Plus,
  Send,
  Share2,
  Sparkles,
  Trash,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  apiRequest,
  downloadAuthorizedFile,
  fetchAuthorizedBlobUrl,
  formatDuration,
  formatFileSize,
  formatTime,
} from '../lib/api';
import { getChatWallpaper } from '../lib/wallpapers';
import type { GroupMessage, GroupSummary, PublicUser } from '../types';
import { AudioMessagePlayer } from './AudioMessagePlayer';
import { UserAvatar } from './UserAvatar';

interface GroupRoomViewProps {
  group: GroupSummary;
  token: string;
  currentUser: PublicUser;
  friends: PublicUser[];
  incomingMessage: GroupMessage | null;
  incomingDeletedMsg?: {
    groupId: string;
    messageId: string;
    lastMessage: GroupMessage | null;
  } | null;
  incomingDeletedBulk?: {
    groupId: string;
    messageIds: string[];
    lastMessage: GroupMessage | null;
  } | null;
  onBack: () => void;
  onGroupUpdated: (group: GroupSummary) => void;
  onShareGroup: (group: GroupSummary) => void;
  onImageClick: (url: string, title: string) => void;
  onShowToast: (msg: string) => void;
}

export function GroupRoomView({
  group,
  token,
  currentUser,
  friends,
  incomingMessage,
  incomingDeletedMsg,
  incomingDeletedBulk,
  onBack,
  onGroupUpdated,
  onShareGroup,
  onImageClick,
  onShowToast,
}: GroupRoomViewProps) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);

  const [showInfo, setShowInfo] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);

  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [contextMenu, setContextMenu] = useState<{
    message: GroupMessage;
    rect: DOMRect;
  } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draftInputRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<BlobPart[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const recordCancelRef = useRef(false);
  const longPressTimerRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressedRef = useRef(false);

  const activeWallpaper = getChatWallpaper(currentUser.chatWallpaper);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ messages: GroupMessage[] }>(
        `/api/groups/${encodeURIComponent(group.id)}/messages`,
        { token }
      );
      setMessages(res.messages);
    } catch {
      onShowToast('تعذر تحميل رسائل المجموعة');
    } finally {
      setLoading(false);
    }
  }, [group.id, token, onShowToast]);

  useEffect(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setBulkDeleteConfirmOpen(false);
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!incomingMessage || incomingMessage.groupId !== group.id) return;
    setMessages((prev) =>
      prev.some((m) => m.id === incomingMessage.id) ? prev : [...prev, incomingMessage]
    );
  }, [incomingMessage, group.id]);

  useEffect(() => {
    if (!incomingDeletedMsg || incomingDeletedMsg.groupId !== group.id) return;
    setMessages((prev) => prev.filter((m) => m.id !== incomingDeletedMsg.messageId));
    setSelectedIds((prev) => {
      if (!prev.has(incomingDeletedMsg.messageId)) return prev;
      const next = new Set(prev);
      next.delete(incomingDeletedMsg.messageId);
      return next;
    });
    setContextMenu((prev) =>
      prev && prev.message.id === incomingDeletedMsg.messageId ? null : prev
    );
  }, [incomingDeletedMsg, group.id]);

  useEffect(() => {
    if (!incomingDeletedBulk || incomingDeletedBulk.groupId !== group.id) return;
    const removedSet = new Set(incomingDeletedBulk.messageIds);
    setMessages((prev) => prev.filter((m) => !removedSet.has(m.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of removedSet) next.delete(id);
      return next;
    });
    setContextMenu((prev) => (prev && removedSet.has(prev.message.id) ? null : prev));
  }, [incomingDeletedBulk, group.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, group.id]);

  useEffect(() => {
    const el = draftInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [draft, group.id]);

  useEffect(() => {
    let active = true;
    for (const msg of messages) {
      if (
        msg.type === 'file' &&
        (msg.file?.mimeType?.startsWith('image/') || msg.file?.mimeType?.startsWith('video/')) &&
        !mediaUrls[msg.file.id]
      ) {
        const fid = msg.file.id;
        void fetchAuthorizedBlobUrl(fid, token)
          .then((url) => {
            if (active) {
              setMediaUrls((prev) => ({ ...prev, [fid]: url }));
            }
          })
          .catch(() => {});
      }
    }
    return () => {
      active = false;
    };
  }, [messages, token, mediaUrls]);

  async function handleSendText(e?: React.FormEvent) {
    e?.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft('');
    try {
      const res = await apiRequest<{ message: GroupMessage }>(
        `/api/groups/${encodeURIComponent(group.id)}/messages`,
        {
          method: 'POST',
          token,
          body: { type: 'text', content },
        }
      );
      setMessages((prev) =>
        prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]
      );
    } catch (err) {
      setDraft(content);
      onShowToast((err as Error).message || 'تعذر إرسال الرسالة');
    } finally {
      setSending(false);
    }
  }

  async function uploadAndSend(file: File, type: 'file' | 'voice', durationSec?: number) {
    if (file.size > 50 * 1024 * 1024) {
      onShowToast('الحد الأقصى للملف 50 ميجابايت');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('groupId', group.id);
      formData.append('file', file);

      const uploadRes = await apiRequest<{ file: { id: string } }>('/api/upload', {
        method: 'POST',
        token,
        formData,
      });

      const msgRes = await apiRequest<{ message: GroupMessage }>(
        `/api/groups/${encodeURIComponent(group.id)}/messages`,
        {
          method: 'POST',
          token,
          body: {
            type,
            fileId: uploadRes.file.id,
            durationSec: durationSec ?? null,
          },
        }
      );
      setMessages((prev) =>
        prev.some((m) => m.id === msgRes.message.id) ? prev : [...prev, msgRes.message]
      );
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر رفع الملف');
    } finally {
      setUploading(false);
    }
  }

  function openMsgMenu(msg: GroupMessage, el: HTMLElement) {
    longPressedRef.current = true;
    try {
      navigator.vibrate?.(18);
    } catch {
      // Ignore
    }
    setContextMenu({ message: msg, rect: el.getBoundingClientRect() });
  }

  function clearPressTimer() {
    pressStartRef.current = null;
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function handleCopyGroupMessage(msg: GroupMessage) {
    const text =
      msg.content || (msg.type === 'file' ? msg.file?.originalName ?? '' : 'رسالة صوتية');
    if (text) {
      void navigator.clipboard.writeText(text);
      onShowToast('تم نسخ الرسالة');
    }
    setContextMenu(null);
  }

  async function handleDeleteGroupMessage(msg: GroupMessage, scope: 'me' | 'everyone') {
    setContextMenu(null);
    try {
      const res = await apiRequest<{
        deleted: boolean;
        scope: 'me' | 'everyone';
        messageId: string;
        lastMessage: GroupMessage | null;
      }>(
        `/api/groups/${encodeURIComponent(group.id)}/messages/${encodeURIComponent(msg.id)}?scope=${scope}`,
        {
          method: 'DELETE',
          token,
          body: { scope },
        }
      );
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      onGroupUpdated({
        ...group,
        lastMessage: res.lastMessage,
      });
      onShowToast(scope === 'everyone' ? 'تم مسح الرسالة لدى الجميع' : 'تم مسح الرسالة لديك');
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر مسح الرسالة');
    }
  }

  function startMultiSelect(msg: GroupMessage) {
    setContextMenu(null);
    setSelectionMode(true);
    setSelectedIds(new Set([msg.id]));
  }

  function toggleSelectMessage(msgId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (messages.length === 0) return;
    setSelectedIds((prev) =>
      prev.size === messages.length ? new Set() : new Set(messages.map((m) => m.id))
    );
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setBulkDeleteConfirmOpen(false);
  }

  async function handleBulkDeleteGroup(scope: 'me' | 'everyone') {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || deletingBulk) return;
    setDeletingBulk(true);
    try {
      const res = await apiRequest<{
        deleted: boolean;
        scope: 'me' | 'everyone';
        deletedIds: string[];
        lastMessage: GroupMessage | null;
      }>(`/api/groups/${encodeURIComponent(group.id)}/messages/bulk-delete`, {
        method: 'POST',
        token,
        body: { messageIds: ids, scope },
      });
      const deletedSet = new Set(res.deletedIds);
      setMessages((prev) => prev.filter((m) => !deletedSet.has(m.id)));
      onGroupUpdated({
        ...group,
        lastMessage: res.lastMessage,
      });
      exitSelectionMode();
      onShowToast(
        scope === 'everyone'
          ? `تم مسح ${res.deletedIds.length} رسالة لدى الجميع`
          : `تم مسح ${res.deletedIds.length} رسالة لديك`
      );
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر حذف الرسائل المحددة');
    } finally {
      setDeletingBulk(false);
    }
  }

  async function startRecording() {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        for (const t of stream.getTracks()) t.stop();
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
        void uploadAndSend(audioFile, 'voice', dur);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSec(0);
      recordTimerRef.current = window.setInterval(() => {
        setRecordingSec(Math.floor((Date.now() - startedAt) / 1000));
      }, 400);
    } catch {
      onShowToast('يرجى السماح بالوصول إلى الميكروفون');
    }
  }

  function stopRecording(cancel: boolean) {
    recordCancelRef.current = cancel;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }

  async function addFriendToGroup(friendId: string) {
    if (addingMembers) return;
    setAddingMembers(true);
    try {
      const res = await apiRequest<{ group: GroupSummary }>(
        `/api/groups/${encodeURIComponent(group.id)}/members`,
        {
          method: 'POST',
          token,
          body: { memberIds: [friendId] },
        }
      );
      onGroupUpdated(res.group);
      onShowToast('تمت إضافة الصديق إلى المجموعة');
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر إضافة الصديق');
    } finally {
      setAddingMembers(false);
    }
  }

  const memberIdSet = new Set(group.members.map((m) => m.id));
  const addableFriends = friends.filter((f) => !memberIdSet.has(f.id));
  const allSelected = messages.length > 0 && selectedIds.size === messages.length;
  const canDeleteSelectedForEveryone =
    selectedIds.size > 0 &&
    (group.isOwner ||
      messages
        .filter((m) => selectedIds.has(m.id))
        .every((m) => m.senderId === currentUser.id));

  return (
    <div className="fixed inset-0 z-40 bg-[#f7f9f7] dark:bg-[#0d1311] flex flex-col overflow-hidden">
      {/* Standalone Fullscreen Group Header / Top Multi-Selection Bar */}
      {selectionMode ? (
        <header className="h-14 px-3 sm:px-5 bg-[#e6f4ee] dark:bg-[#132620] border-b border-[#006c51]/25 dark:border-[#4fd8b0]/20 flex items-center justify-between gap-2 shrink-0">
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
              تم تحديد {selectedIds.size}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="min-h-[36px] px-3.5 rounded-full bg-white dark:bg-[#1d2b26] border border-[#006c51]/20 dark:border-[#4fd8b0]/20 text-xs font-bold text-[#006c51] dark:text-[#4fd8b0] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{allSelected ? 'إلغاء الكل' : 'تحديد الكل'}</span>
            </button>

            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setBulkDeleteConfirmOpen(true)}
              className="min-h-[36px] px-3.5 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-45 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف</span>
            </button>
          </div>
        </header>
      ) : (
        <header className="h-14 px-3 sm:px-5 bg-white dark:bg-[#141c19] border-b border-emerald-950/10 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={onBack}
              aria-label="رجوع"
              className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer shrink-0"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-right cursor-pointer rounded-xl py-1 px-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {group.avatarUrl ? (
                <img
                  src={group.avatarUrl}
                  alt={group.name}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#006c51] text-white flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold truncate">{group.name}</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate tabular-nums">
                  مجموعة خاصة · {group.memberCount} أعضاء · اضغط للتفاصيل
                </p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onShareGroup(group)}
              aria-label="مشاركة المجموعة"
              className="min-h-[38px] px-3.5 rounded-full bg-[#c5efe0] dark:bg-[#00513d] text-[#002117] dark:text-[#b8f3dd] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة</span>
            </button>
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              aria-label="معلومات المجموعة"
              className="w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Group Messages Feed (Outgoing LEFT, Incoming RIGHT) */}
      <div
        className="relative flex-1 min-h-0 flex flex-col overflow-hidden"
        style={{ backgroundColor: activeWallpaper.fallbackBg }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${activeWallpaper.src})` }}
        />

        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4 space-y-2">
          {group.promoText && (
            <div className="max-w-md mx-auto mb-3 p-3 rounded-2xl bg-white/95 dark:bg-[#1b2421]/95 text-center text-xs text-slate-600 dark:text-slate-300 shadow-xs">
              {group.promoText}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center pt-10">
              <p className="px-4 py-2 rounded-full bg-white/95 dark:bg-[#1b2421]/95 text-xs font-semibold shadow-xs">
                جارٍ التحميل...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center pt-10">
              <div className="max-w-xs text-center p-5 rounded-3xl bg-white/95 dark:bg-[#1b2421]/95 shadow-sm space-y-1">
                <p className="text-sm font-bold">مرحباً في {group.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ابدأ المحادثة مع أعضاء المجموعة الخاصة الآن.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isOutgoing = msg.senderId === currentUser.id;
              const isImage =
                msg.type === 'file' && Boolean(msg.file?.mimeType?.startsWith('image/'));
              const isVideo =
                msg.type === 'file' && Boolean(msg.file?.mimeType?.startsWith('video/'));
              const previewUrl = msg.file ? mediaUrls[msg.file.id] : null;
              const isSelected = contextMenu?.message.id === msg.id;
              const isMultiSelected = selectionMode && selectedIds.has(msg.id);

              return (
                <div
                  key={msg.id}
                  onClick={
                    selectionMode
                      ? (e) => {
                          e.stopPropagation();
                          toggleSelectMessage(msg.id);
                        }
                      : undefined
                  }
                  className={`flex items-center gap-2 px-2 py-0.5 -mx-2 rounded-xl transition-colors ${
                    isOutgoing ? 'justify-end' : 'justify-start'
                  } ${selectionMode ? 'cursor-pointer select-none' : ''} ${
                    isMultiSelected
                      ? 'bg-[#006c51]/18 dark:bg-[#4fd8b0]/20 ring-1 ring-[#006c51] dark:ring-[#4fd8b0]'
                      : ''
                  }`}
                >
                  {selectionMode && (
                    <span
                      aria-hidden="true"
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isMultiSelected
                          ? 'bg-[#006c51] border-[#006c51] text-white shadow-xs'
                          : 'bg-white/90 dark:bg-[#141c19] border-slate-400 dark:border-slate-500'
                      }`}
                    >
                      {isMultiSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  )}

                  <div
                    onPointerDown={(e) => {
                      if (selectionMode) return;
                      if (e.button === 2) return;
                      const target = e.target as HTMLElement | null;
                      if (target?.closest('input[type="range"]')) return;
                      longPressedRef.current = false;
                      pressStartRef.current = { x: e.clientX, y: e.clientY };
                      const el = e.currentTarget;
                      longPressTimerRef.current = window.setTimeout(() => {
                        longPressTimerRef.current = null;
                        openMsgMenu(msg, el);
                      }, 380);
                    }}
                    onPointerMove={(e) => {
                      if (!pressStartRef.current || !longPressTimerRef.current) return;
                      if (
                        Math.abs(e.clientX - pressStartRef.current.x) > 10 ||
                        Math.abs(e.clientY - pressStartRef.current.y) > 10
                      ) {
                        clearPressTimer();
                      }
                    }}
                    onPointerUp={clearPressTimer}
                    onPointerCancel={clearPressTimer}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      clearPressTimer();
                      if (selectionMode) {
                        toggleSelectMessage(msg.id);
                        return;
                      }
                      openMsgMenu(msg, e.currentTarget);
                    }}
                    onClick={(e) => {
                      if (selectionMode) {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelectMessage(msg.id);
                        return;
                      }
                      if (longPressedRef.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        longPressedRef.current = false;
                        return;
                      }
                      const target = e.target as HTMLElement | null;
                      if (target?.closest('button, a, input, video, audio')) return;
                      if ((window.getSelection()?.toString().trim() ?? '').length > 0) return;
                      openMsgMenu(msg, e.currentTarget);
                    }}
                    data-msg-card="true"
                    className={`max-w-[78%] sm:max-w-[58%] rounded-[16px] px-3 py-1.5 shadow-xs cursor-pointer transition-transform ${
                      isMultiSelected
                        ? 'ring-2 ring-[#006c51] dark:ring-[#4fd8b0] shadow-md'
                        : isSelected
                          ? 'ring-2 ring-[#006c51] dark:ring-[#4fd8b0] ring-offset-1 ring-offset-transparent'
                          : ''
                    } ${
                      isOutgoing
                        ? 'bg-[#d8f5e5] dark:bg-[#004d3b] text-[#0b291e] dark:text-[#e4f7ef] rounded-tl-[5px]'
                        : 'bg-white dark:bg-[#1d2623] text-[#181d1b] dark:text-[#e6ece9] rounded-tr-[5px] border border-emerald-950/5 dark:border-white/5'
                    }`}
                  >
                    {!isOutgoing && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <UserAvatar
                          displayName={msg.senderName}
                          avatarColor={msg.senderAvatarColor}
                          avatarUrl={msg.senderAvatarUrl}
                          sizeClass="w-5 h-5"
                          textClass="text-[9px]"
                        />
                        <span className="text-[11px] font-bold text-[#006c51] dark:text-[#4fd8b0]">
                          {msg.senderName}
                        </span>
                      </div>
                    )}

                    {msg.type === 'voice' && msg.file && (
                      <AudioMessagePlayer
                        fileId={msg.file.id}
                        token={token}
                        initialDuration={msg.durationSec}
                        isOutgoing={isOutgoing}
                      />
                    )}

                    {msg.type === 'file' && msg.file && (
                      <div className="space-y-2">
                        {isImage && previewUrl ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onImageClick(previewUrl, msg.file!.originalName);
                            }}
                            className="block rounded-2xl overflow-hidden max-w-[260px] cursor-pointer"
                          >
                            <img
                              src={previewUrl}
                              alt={msg.file.originalName}
                              className="w-full max-h-60 object-cover"
                            />
                          </button>
                        ) : isVideo && previewUrl ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-2xl overflow-hidden max-w-[260px] bg-black"
                          >
                            <video
                              src={previewUrl}
                              controls
                              playsInline
                              preload="metadata"
                              className="w-full max-h-60 object-contain"
                            />
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/5 dark:bg-black/20">
                          <FileText className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="selectable-message text-xs font-semibold truncate">
                              {msg.file.originalName}
                            </p>
                            <p className="text-[10px] opacity-75 tabular-nums">
                              {formatFileSize(msg.file.sizeBytes)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void downloadAuthorizedFile(
                                msg.file!.id,
                                msg.file!.originalName,
                                token
                              ).catch((err) =>
                                onShowToast((err as Error).message || 'تعذر تنزيل الملف')
                              );
                            }}
                            aria-label="تنزيل"
                            className="w-8 h-8 rounded-full hover:bg-black/10 flex items-center justify-center cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {msg.content && (
                      <p className="selectable-message text-[13.5px] leading-snug whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-0.5 text-[10px] opacity-70 tabular-nums">
                      {!selectionMode ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const card = e.currentTarget.closest('[data-msg-card="true"]') as HTMLElement | null;
                            openMsgMenu(msg, card ?? e.currentTarget);
                          }}
                          aria-label="خيارات الرسالة"
                          className="w-5 h-5 -mr-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      ) : (
                        <span />
                      )}
                      <span>{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Group Composer */}
      <footer className="bg-[#f0ebe3] dark:bg-[#0b1210] px-2.5 sm:px-4 py-1.5 shrink-0 border-t border-emerald-950/5 dark:border-white/5">
        {uploading && (
          <p className="mb-1 text-xs font-semibold text-[#006c51] dark:text-[#4fd8b0]">
            جارٍ رفع المرفق...
          </p>
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
                  await uploadAndSend(file, 'file');
                }
              })();
            }
          }}
        />

        {isRecording ? (
          <div className="flex items-center justify-between gap-2 bg-white dark:bg-[#1d2623] rounded-full p-1 shadow-sm">
            <button
              type="button"
              onClick={() => stopRecording(true)}
              aria-label="إلغاء التسجيل"
              className="w-9 h-9 rounded-full text-rose-600 flex items-center justify-center cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold tabular-nums text-rose-600">
              {formatDuration(recordingSec)}
            </span>
            <button
              type="button"
              onClick={() => stopRecording(false)}
              aria-label="إرسال الصوت"
              className="w-10 h-10 rounded-full bg-[#006c51] text-white flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendText} className="flex items-end gap-2">
            <div className="flex-1 min-w-0 flex items-end bg-white dark:bg-[#1d2623] rounded-[22px] px-1.5 py-0.5 shadow-xs">
              <textarea
                ref={draftInputRef}
                rows={1}
                enterKeyHint="enter"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    void handleSendText();
                  }
                }}
                placeholder={`رسالة إلى ${group.name}...`}
                className="flex-1 min-w-0 bg-transparent text-sm leading-5 px-2.5 py-1.5 max-h-32 overflow-y-auto resize-none focus:outline-none"
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

            {draft.trim() ? (
              <button
                type="submit"
                disabled={sending}
                aria-label="إرسال"
                className="w-10 h-10 rounded-full bg-[#006c51] text-white flex items-center justify-center cursor-pointer shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startRecording()}
                aria-label="تسجيل صوتي"
                className="w-10 h-10 rounded-full bg-[#006c51] text-white flex items-center justify-center cursor-pointer shrink-0 shadow-sm"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </form>
        )}
      </footer>

      {/* Group Info & Members & Extra Links Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 bg-[#f7f9f7] dark:bg-[#0d1311] flex flex-col overflow-hidden">
          <header className="h-14 px-4 bg-white dark:bg-[#141c19] border-b border-emerald-950/10 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                aria-label="إغلاق"
                className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold">تفاصيل المجموعة</h3>
            </div>
            <button
              type="button"
              onClick={() => onShareGroup(group)}
              className="min-h-[38px] px-4 rounded-full bg-[#006c51] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة المجموعة</span>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-lg mx-auto space-y-4">
              {/* Group Profile Hero */}
              <section className="bg-white dark:bg-[#141c19] rounded-3xl p-6 text-center shadow-xs space-y-3">
                <div className="flex justify-center">
                  {group.avatarUrl ? (
                    <img
                      src={group.avatarUrl}
                      alt={group.name}
                      className="w-24 h-24 rounded-3xl object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-3xl bg-[#c5efe0] dark:bg-[#00513d] text-[#006c51] dark:text-[#4fd8b0] flex items-center justify-center">
                      <Users className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <h4 className="text-xl font-bold">{group.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  مجموعة خاصة · {group.memberCount} أعضاء
                </p>
                {group.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                    {group.description}
                  </p>
                )}
              </section>

              {/* Promo Text */}
              {group.promoText && (
                <section className="bg-white dark:bg-[#141c19] rounded-3xl p-4 shadow-xs flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#eff4f0] dark:bg-[#1d2623] text-[#006c51] dark:text-[#4fd8b0] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-500">الدعائية</p>
                    <p className="text-sm mt-0.5 leading-relaxed">{group.promoText}</p>
                  </div>
                </section>
              )}

              {/* Extra Links */}
              {group.extraLinks.length > 0 && (
                <section className="bg-white dark:bg-[#141c19] rounded-3xl p-4 shadow-xs space-y-2.5">
                  <p className="text-xs font-bold text-slate-500">روابط إضافية</p>
                  <div className="space-y-2">
                    {group.extraLinks.map((lnk, idx) => (
                      <a
                        key={`${lnk.url}-${idx}`}
                        href={lnk.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-2xl bg-[#f7f9f7] dark:bg-[#1b2421] hover:bg-[#e6f4ee] dark:hover:bg-[#1d2b26] flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Link2 className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{lnk.label}</p>
                            <p className="text-[11px] text-slate-500 truncate dir-ltr text-right">
                              {lnk.url}
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Add More Friends (Owner only) */}
              {group.isOwner && addableFriends.length > 0 && (
                <section className="bg-white dark:bg-[#141c19] rounded-3xl p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0]" />
                    <p className="text-xs font-bold">إضافة أصدقاء للمجموعة</p>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {addableFriends.map((f) => (
                      <div key={f.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar
                            displayName={f.displayName}
                            avatarColor={f.avatarColor}
                            avatarUrl={f.avatarUrl}
                            sizeClass="w-9 h-9"
                            textClass="text-xs"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{f.displayName}</p>
                            <p className="text-[11px] font-mono-handle text-slate-500 truncate">
                              @{f.username}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={addingMembers}
                          onClick={() => void addFriendToGroup(f.id)}
                          className="min-h-[34px] px-3 rounded-full bg-[#c5efe0] dark:bg-[#00513d] text-[#002117] dark:text-[#b8f3dd] text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Members List */}
              <section className="bg-white dark:bg-[#141c19] rounded-3xl p-4 shadow-xs space-y-2">
                <p className="text-xs font-bold text-slate-500">الأعضاء ({group.memberCount})</p>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {group.members.map((m) => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          displayName={m.displayName}
                          avatarColor={m.avatarColor}
                          avatarUrl={m.avatarUrl}
                          sizeClass="w-10 h-10"
                          textClass="text-xs"
                          online={m.online}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{m.displayName}</p>
                          <p className="text-[11px] font-mono-handle text-slate-500 truncate">
                            @{m.username}
                          </p>
                        </div>
                      </div>
                      {m.id === group.ownerId && (
                        <span className="text-[11px] font-semibold text-[#006c51] dark:text-[#4fd8b0]">
                          منشئ المجموعة
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Group Message Context Menu (Select, Copy, Delete for Me, Delete for Everyone) */}
      {contextMenu && (
        <div
          onClick={() => setContextMenu(null)}
          className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[1px]"
        >
          {(() => {
            const { message, rect } = contextMenu;
            const canDeleteEveryone = message.senderId === currentUser.id || group.isOwner;
            const menuWidth = 216;
            const menuHeight = canDeleteEveryone ? 202 : 156;
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
                className="fixed rounded-3xl bg-white dark:bg-[#1b2421] border border-emerald-950/10 dark:border-white/10 shadow-2xl overflow-hidden py-1.5 divide-y divide-slate-100 dark:divide-white/5"
              >
                <button
                  type="button"
                  onClick={() => startMultiSelect(message)}
                  className="w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-3 hover:bg-[#eff4f0] dark:hover:bg-[#232f2b] cursor-pointer"
                >
                  <span>تحديد</span>
                  <CheckSquare className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0]" />
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyGroupMessage(message)}
                  className="w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-3 hover:bg-[#eff4f0] dark:hover:bg-[#232f2b] cursor-pointer"
                >
                  <span>نسخ</span>
                  <Copy className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  type="button"
                  onClick={() => void handleDeleteGroupMessage(message, 'me')}
                  className="w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-3 hover:bg-[#eff4f0] dark:hover:bg-[#232f2b] cursor-pointer text-slate-700 dark:text-slate-200"
                >
                  <span>مسح لدي</span>
                  <Trash className="w-4 h-4 text-slate-500" />
                </button>

                {canDeleteEveryone && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteGroupMessage(message, 'everyone')}
                    className="w-full px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-3 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer text-rose-600 dark:text-rose-400"
                  >
                    <span>مسح لدى الجميع</span>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirmOpen && (
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
                حذف {selectedIds.size} {selectedIds.size === 1 ? 'رسالة' : 'رسائل'}؟
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اختر هل تريد مسح الرسائل المحددة من حسابك فقط أم لدى الجميع:
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={deletingBulk}
                onClick={() => void handleBulkDeleteGroup('me')}
                className="w-full min-h-[44px] px-4 rounded-2xl bg-[#eff4f0] dark:bg-[#1d2623] hover:bg-[#e1ebe4] dark:hover:bg-[#26322e] text-sm font-bold flex items-center justify-between cursor-pointer disabled:opacity-50"
              >
                <span>مسح لدي</span>
                <Trash className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>

              <button
                type="button"
                disabled={deletingBulk || !canDeleteSelectedForEveryone}
                onClick={() => void handleBulkDeleteGroup('everyone')}
                className="w-full min-h-[44px] px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center justify-between cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="text-right">
                  <span>مسح لدى الجميع</span>
                  {!canDeleteSelectedForEveryone && (
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
      )}
    </div>
  );
}
