import { useState } from 'react';
import { Check, Copy, Send, Share2, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { ConversationSummary, GroupSummary } from '../types';
import { UserAvatar } from './UserAvatar';

export interface SharePayload {
  kind: 'friend' | 'group' | 'channel';
  title: string;
  subtitle: string;
  shareUrl: string;
  shareText: string;
}

interface ShareSheetModalProps {
  payload: SharePayload;
  token: string;
  conversations: ConversationSummary[];
  groups: GroupSummary[];
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export function ShareSheetModal({
  payload,
  token,
  conversations,
  groups,
  onClose,
  onShowToast,
}: ShareSheetModalProps) {
  const [copied, setCopied] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);

  function copyLink() {
    const text = `${payload.shareText}\n${payload.shareUrl}`;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast('تم نسخ رابط المشاركة');
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function nativeShare() {
    if (!navigator.share) {
      copyLink();
      return;
    }
    try {
      await navigator.share({
        title: payload.title,
        text: payload.shareText,
        url: payload.shareUrl,
      });
    } catch {
      // User dismissed native share
    }
  }

  async function sendToConversation(conv: ConversationSummary) {
    if (sendingId || sentIds.has(conv.id)) return;
    setSendingId(conv.id);
    try {
      await apiRequest(`/api/conversations/${encodeURIComponent(conv.id)}/messages`, {
        method: 'POST',
        token,
        body: {
          type: 'text',
          content: `${payload.shareText}\n${payload.shareUrl}`,
        },
      });
      setSentIds((prev) => new Set(prev).add(conv.id));
      onShowToast(`تمت المشاركة مع ${conv.peer.displayName}`);
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر إرسال المشاركة');
    } finally {
      setSendingId(null);
    }
  }

  async function sendToGroup(group: GroupSummary) {
    if (sendingId || sentIds.has(group.id)) return;
    setSendingId(group.id);
    try {
      await apiRequest(`/api/groups/${encodeURIComponent(group.id)}/messages`, {
        method: 'POST',
        token,
        body: {
          type: 'text',
          content: `${payload.shareText}\n${payload.shareUrl}`,
        },
      });
      setSentIds((prev) => new Set(prev).add(group.id));
      onShowToast(`تمت المشاركة في مجموعة ${group.name}`);
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر إرسال المشاركة');
    } finally {
      setSendingId(null);
    }
  }

  const kindLabel =
    payload.kind === 'group'
      ? 'مشاركة المجموعة'
      : payload.kind === 'channel'
        ? 'مشاركة القناة'
        : 'مشاركة جهة الاتصال';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[85dvh] rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-[#141c19] shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-3 sm:hidden" />

        <div className="px-5 py-3.5 border-b border-emerald-950/10 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold truncate">{kindLabel}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {payload.title} · {payload.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={copyLink}
              className="min-h-[46px] px-4 rounded-2xl bg-[#eff4f0] dark:bg-[#1d2623] hover:bg-[#e1ece4] dark:hover:bg-[#24302c] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0]" />
              ) : (
                <Copy className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0]" />
              )}
              <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
            </button>

            <button
              type="button"
              onClick={() => void nativeShare()}
              className="min-h-[46px] px-4 rounded-2xl bg-[#006c51] hover:bg-[#005842] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة خارجية</span>
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-[#f7f9f7] dark:bg-[#1b2421] text-[11px] text-slate-600 dark:text-slate-300 break-all dir-ltr text-left">
            {payload.shareUrl}
          </div>

          {/* Direct In-App Quick Send */}
          {(conversations.length > 0 || groups.length > 0) && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                إرسال سريع داخل RetChat
              </p>
              <div className="divide-y divide-slate-100 dark:divide-white/5 rounded-2xl border border-emerald-950/10 dark:border-white/10 overflow-hidden">
                {conversations.map((conv) => {
                  const sent = sentIds.has(conv.id);
                  return (
                    <div
                      key={conv.id}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 bg-white dark:bg-[#141c19]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          displayName={conv.peer.displayName}
                          avatarColor={conv.peer.avatarColor}
                          avatarUrl={conv.peer.avatarUrl}
                          sizeClass="w-9 h-9"
                          textClass="text-xs"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{conv.peer.displayName}</p>
                          <p className="text-[11px] font-mono-handle text-slate-500 truncate">
                            @{conv.peer.username}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={sent || sendingId === conv.id}
                        onClick={() => void sendToConversation(conv)}
                        className={`min-h-[34px] px-3 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0 ${
                          sent
                            ? 'bg-[#c5efe0] dark:bg-[#00513d] text-[#002117] dark:text-[#b8f3dd]'
                            : 'bg-[#006c51] text-white'
                        }`}
                      >
                        {sent ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{sent ? 'أُرسل' : 'إرسال'}</span>
                      </button>
                    </div>
                  );
                })}

                {groups.map((g) => {
                  const sent = sentIds.has(g.id);
                  return (
                    <div
                      key={g.id}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 bg-white dark:bg-[#141c19]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {g.avatarUrl ? (
                          <img
                            src={g.avatarUrl}
                            alt={g.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#c5efe0] dark:bg-[#00513d] text-[#006c51] dark:text-[#4fd8b0] text-xs font-bold flex items-center justify-center shrink-0">
                            {g.name.slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{g.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            مجموعة · {g.memberCount} أعضاء
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={sent || sendingId === g.id}
                        onClick={() => void sendToGroup(g)}
                        className={`min-h-[34px] px-3 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0 ${
                          sent
                            ? 'bg-[#c5efe0] dark:bg-[#00513d] text-[#002117] dark:text-[#b8f3dd]'
                            : 'bg-[#006c51] text-white'
                        }`}
                      >
                        {sent ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{sent ? 'أُرسل' : 'إرسال'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
