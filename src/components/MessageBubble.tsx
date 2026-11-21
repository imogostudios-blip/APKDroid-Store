import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCheck,
  Download,
  FileText,
  Mic,
  MoreVertical,
  Phone,
  PhoneMissed,
  PhoneOff,
  Pin,
} from 'lucide-react';
import {
  downloadAuthorizedFile,
  fetchAuthorizedBlobUrl,
  formatDuration,
  formatFileSize,
  formatTime,
} from '../lib/api';
import type { ChatMessage } from '../types';
import { AudioMessagePlayer } from './AudioMessagePlayer';

interface MessageBubbleProps {
  message: ChatMessage;
  isOutgoing: boolean;
  isPinned: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
  isMultiSelected?: boolean;
  isHighlighted?: boolean;
  currentUserId: string;
  peerName: string;
  token: string;
  onImageClick: (url: string, title: string) => void;
  onLongPressMenu: (message: ChatMessage, rect: DOMRect) => void;
  onToggleSelect?: (message: ChatMessage) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onJumpToMessage?: (messageId: string) => void;
  onDownloadError?: (msg: string) => void;
}

export function MessageBubble({
  message,
  isOutgoing,
  isPinned,
  isSelected = false,
  selectionMode = false,
  isMultiSelected = false,
  isHighlighted = false,
  currentUserId,
  peerName,
  token,
  onImageClick,
  onLongPressMenu,
  onToggleSelect,
  onToggleReaction,
  onJumpToMessage,
  onDownloadError,
}: MessageBubbleProps) {
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [pressing, setPressing] = useState(false);

  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const longPressedRef = useRef(false);

  const isImageFile =
    message.type === 'file' &&
    Boolean(message.file?.mimeType?.startsWith('image/'));
  const isVideoFile =
    message.type === 'file' &&
    Boolean(message.file?.mimeType?.startsWith('video/'));

  useEffect(() => {
    if ((!isImageFile && !isVideoFile) || !message.file) return;
    let active = true;
    fetchAuthorizedBlobUrl(message.file.id, token)
      .then((url) => {
        if (active) setMediaPreviewUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isImageFile, isVideoFile, message.file, token]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const groupedReactions = useMemo(() => {
    const map = new Map<string, { emoji: string; count: number; reactedByMe: boolean }>();
    for (const r of message.reactions ?? []) {
      const prev = map.get(r.emoji);
      if (prev) {
        prev.count += 1;
        if (r.userId === currentUserId) prev.reactedByMe = true;
      } else {
        map.set(r.emoji, {
          emoji: r.emoji,
          count: 1,
          reactedByMe: r.userId === currentUserId,
        });
      }
    }
    return Array.from(map.values());
  }, [message.reactions, currentUserId]);

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    if (!message.file || downloading) return;
    setDownloading(true);
    try {
      await downloadAuthorizedFile(message.file.id, message.file.originalName, token);
    } catch (err) {
      onDownloadError?.((err as Error).message || 'تعذر تنزيل الملف');
    } finally {
      setDownloading(false);
    }
  }

  function clearLongPress() {
    setPressing(false);
    startPosRef.current = null;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function triggerMenu() {
    const el = bubbleRef.current;
    if (!el) return;
    longPressedRef.current = true;
    setPressing(false);
    try {
      navigator.vibrate?.(18);
    } catch {
      // Ignore unsupported vibrate
    }
    onLongPressMenu(message, el.getBoundingClientRect());
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (selectionMode) return;
    if (e.button === 2) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('input[type="range"]')) return;
    longPressedRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setPressing(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      triggerMenu();
    }, 380);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!startPosRef.current || !timerRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 10 || dy > 10) {
      clearLongPress();
    }
  }

  function handleContextMenu(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    clearLongPress();
    if (selectionMode) {
      onToggleSelect?.(message);
      return;
    }
    triggerMenu();
  }

  function handleBubbleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (selectionMode) {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelect?.(message);
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
    const selectedText = window.getSelection()?.toString().trim() ?? '';
    if (selectedText.length > 0) return;
    triggerMenu();
  }

  if (message.type === 'call') {
    const isMissed = message.callStatus === 'missed';
    const isRejected = message.callStatus === 'rejected';
    const label = isMissed
      ? isOutgoing
        ? 'مكالمة صادرة لم يُرد عليها'
        : 'مكالمة فائتة'
      : isRejected
        ? 'تم رفض المكالمة الصوتية'
        : `مكالمة صوتية · ${formatDuration(message.durationSec ?? 0)}`;

    return (
      <div
        id={`msg-${message.id}`}
        onClick={selectionMode ? () => onToggleSelect?.(message) : undefined}
        className={`flex items-center justify-center gap-2 my-1.5 px-2 py-1 -mx-2 rounded-xl transition-colors ${
          selectionMode ? 'cursor-pointer' : ''
        } ${
          selectionMode && isMultiSelected
            ? 'bg-[#006c51]/18 dark:bg-[#4fd8b0]/20 ring-1 ring-[#006c51] dark:ring-[#4fd8b0]'
            : ''
        }`}
      >
        {selectionMode && (
          <span
            aria-hidden="true"
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
              isMultiSelected
                ? 'bg-[#006c51] border-[#006c51] text-white'
                : 'bg-white/90 dark:bg-[#141c19] border-slate-400 dark:border-slate-500'
            }`}
          >
            {isMultiSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </span>
        )}
        <div
          ref={bubbleRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={clearLongPress}
          onPointerCancel={clearLongPress}
          onContextMenu={handleContextMenu}
          onClick={handleBubbleClick}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#1b2421] border border-emerald-950/10 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer ${
            isSelected || isMultiSelected
              ? 'ring-2 ring-[#006c51] dark:ring-[#4fd8b0]'
              : ''
          }`}
        >
          {isMissed ? (
            <PhoneMissed className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          ) : isRejected ? (
            <PhoneOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          ) : (
            <Phone className="w-3.5 h-3.5 text-[#006c51] dark:text-[#4fd8b0] shrink-0" />
          )}
          <span className="tabular-nums">{label}</span>
          <span aria-hidden="true" className="text-slate-400">
            ·
          </span>
          <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  const receiptLabel =
    message.status === 'read'
      ? 'تمت القراءة'
      : message.status === 'delivered'
        ? 'تم الاستلام'
        : 'تم الإرسال';

  const replySenderLabel = message.replyTo
    ? message.replyTo.senderId === currentUserId
      ? 'أنت'
      : peerName
    : '';

  const replyPreviewText = message.replyTo
    ? message.replyTo.type === 'voice'
      ? 'رسالة صوتية'
      : message.replyTo.type === 'file'
        ? message.replyTo.content || message.replyTo.fileOriginalName || 'مرفق'
        : message.replyTo.content
    : '';

  return (
    <div
      id={`msg-${message.id}`}
      onClick={
        selectionMode
          ? (e) => {
              e.stopPropagation();
              onToggleSelect?.(message);
            }
          : undefined
      }
      className={`flex items-center gap-2 my-1 px-2 py-0.5 -mx-2 rounded-xl transition-colors ${
        isOutgoing ? 'justify-end' : 'justify-start'
      } ${groupedReactions.length > 0 ? 'mb-3' : ''} ${
        selectionMode ? 'cursor-pointer select-none' : ''
      } ${
        selectionMode && isMultiSelected
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
        ref={bubbleRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={clearLongPress}
        onPointerCancel={clearLongPress}
        onContextMenu={handleContextMenu}
        onClick={handleBubbleClick}
        className={`relative max-w-[78%] sm:max-w-[58%] rounded-[16px] px-3 py-1.5 shadow-xs transition-transform duration-150 cursor-pointer ${
          pressing ? 'scale-[0.97]' : ''
        } ${
          isMultiSelected
            ? 'ring-2 ring-[#006c51] dark:ring-[#4fd8b0] shadow-md'
            : isSelected
              ? 'ring-2 ring-[#006c51] dark:ring-[#4fd8b0] ring-offset-1 ring-offset-transparent'
              : isHighlighted
                ? 'ring-2 ring-[#4fd8b0] ring-offset-2 ring-offset-transparent'
                : ''
        } ${
          isOutgoing
            ? 'bg-[#d8f5e5] dark:bg-[#004d3b] text-[#0b291e] dark:text-[#e4f7ef] rounded-tl-[5px]'
            : 'bg-white dark:bg-[#1d2623] text-[#181d1b] dark:text-[#e6ece9] rounded-tr-[5px] border border-emerald-950/5 dark:border-white/5'
        }`}
      >
        {message.replyTo && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onJumpToMessage?.(message.replyTo!.id);
            }}
            className={`w-full text-right mb-2 px-2.5 py-1.5 rounded-xl border-r-[3px] border-[#006c51] dark:border-[#4fd8b0] cursor-pointer block ${
              isOutgoing
                ? 'bg-black/5 dark:bg-black/20'
                : 'bg-[#eff4f0] dark:bg-black/25'
            }`}
          >
            <p className="text-[11px] font-bold text-[#006c51] dark:text-[#4fd8b0] truncate">
              {replySenderLabel}
            </p>
            <p className="text-[11px] opacity-80 truncate flex items-center gap-1">
              {message.replyTo.type === 'voice' && <Mic className="w-3 h-3 shrink-0" />}
              <span>{replyPreviewText}</span>
            </p>
          </button>
        )}

        {message.type === 'voice' && message.file && (
          <AudioMessagePlayer
            fileId={message.file.id}
            token={token}
            initialDuration={message.durationSec}
            isOutgoing={isOutgoing}
          />
        )}

        {message.type === 'file' && message.file && (
          <div className="space-y-2">
            {isImageFile && mediaPreviewUrl ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick(mediaPreviewUrl, message.file!.originalName);
                }}
                className="block rounded-2xl overflow-hidden max-w-[280px] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#006c51]"
              >
                <img
                  src={mediaPreviewUrl}
                  alt={message.file.originalName}
                  className="w-full max-h-64 object-cover"
                />
              </button>
            ) : isVideoFile && mediaPreviewUrl ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="rounded-2xl overflow-hidden max-w-[280px] bg-black"
              >
                <video
                  src={mediaPreviewUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full max-h-64 object-contain"
                />
              </div>
            ) : null}

            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-black/5 dark:bg-black/20">
              <div className="w-10 h-10 rounded-xl bg-[#006c51]/15 text-[#006c51] dark:text-[#4fd8b0] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="selectable-message text-xs font-semibold truncate">
                  {message.file.originalName}
                </p>
                <p className="text-[11px] tabular-nums opacity-75">
                  {formatFileSize(message.file.sizeBytes)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                aria-label={`تنزيل ${message.file.originalName}`}
                className="w-10 h-10 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {message.content && (
          <p className="selectable-message text-[13.5px] leading-snug whitespace-pre-wrap break-words mt-0.5 first:mt-0">
            {message.content}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-0.5 text-[10px] tabular-nums opacity-75">
          {!selectionMode ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerMenu();
              }}
              aria-label="خيارات الرسالة"
              className="w-5 h-5 -mr-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer"
            >
              <MoreVertical className="w-3 h-3" />
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1.5">
            {isPinned && (
              <span title="رسالة مثبّتة" className="inline-flex items-center text-[#006c51] dark:text-[#4fd8b0]">
                <Pin className="w-3 h-3" />
              </span>
            )}
            <span>{formatTime(message.createdAt)}</span>
            {isOutgoing && (
              <span
                title={receiptLabel}
                aria-label={receiptLabel}
                className="inline-flex items-center"
              >
                {message.status === 'read' ? (
                  <CheckCheck className="w-4 h-4 text-[#0284c7] dark:text-[#38bdf8] stroke-[2.25]" />
                ) : message.status === 'delivered' ? (
                  <CheckCheck className="w-4 h-4 opacity-75 stroke-[2]" />
                ) : (
                  <Check className="w-3.5 h-3.5 opacity-75 stroke-[2]" />
                )}
              </span>
            )}
          </div>
        </div>

        {groupedReactions.length > 0 && (
          <div
            className={`flex flex-wrap gap-1 mt-1.5 ${
              isOutgoing ? 'justify-end' : 'justify-start'
            }`}
          >
            {groupedReactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleReaction(message.id, r.emoji);
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs shadow-xs cursor-pointer transition-transform active:scale-90 ${
                  r.reactedByMe
                    ? 'bg-[#c5efe0] dark:bg-[#00513d] text-[#002117] dark:text-[#b8f3dd] ring-1 ring-[#006c51]/40'
                    : 'bg-white/95 dark:bg-[#141c19] text-slate-800 dark:text-slate-100 border border-emerald-950/10 dark:border-white/10'
                }`}
              >
                <span>{r.emoji}</span>
                {r.count > 1 && <span className="text-[10px] font-bold tabular-nums">{r.count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
