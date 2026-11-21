import { useState } from 'react';
import {
  ArrowRight,
  AtSign,
  Check,
  Clock,
  Copy,
  Info,
  Palette,
  Phone,
  Share2,
  Sparkles,
  UserCheck,
  UserPlus,
  UserX,
} from 'lucide-react';
import { formatLastSeen } from '../lib/api';
import type { PublicUser } from '../types';
import { UserAvatar } from './UserAvatar';

interface ContactProfileModalProps {
  user: PublicUser;
  onClose: () => void;
  onStartCall?: () => void;
  onShareContact: (user: PublicUser) => void;
  onSendFriendRequest?: (user: PublicUser) => Promise<void>;
  onRespondFriendRequest?: (userId: string, action: 'accept' | 'decline') => Promise<void>;
  onImageClick?: (url: string, title: string) => void;
}

export function ContactProfileModal({
  user,
  onClose,
  onStartCall,
  onShareContact,
  onSendFriendRequest,
  onRespondFriendRequest,
  onImageClick,
}: ContactProfileModalProps) {
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [busy, setBusy] = useState(false);

  const relation = user.friendshipStatus ?? 'accepted';

  function copyHandle() {
    void navigator.clipboard.writeText(`@${user.username}`);
    setCopiedHandle(true);
    window.setTimeout(() => setCopiedHandle(false), 1800);
  }

  async function handleFriendAction(fn?: () => Promise<void>) {
    if (!fn || busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[#f7f9f7] dark:bg-[#0d1311] flex flex-col overflow-hidden">
      {/* Top Android Bar */}
      <header className="h-14 px-3 sm:px-5 bg-white dark:bg-[#141c19] border-b border-emerald-950/10 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="رجوع"
            className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold truncate">معلومات جهة الاتصال</h2>
        </div>

        <button
          type="button"
          onClick={() => onShareContact(user)}
          className="min-h-[38px] px-3.5 rounded-full bg-[#eff4f0] dark:bg-[#1d2623] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Share2 className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0]" />
          <span>مشاركة</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Hero Photo & Name Card */}
          <section className="bg-white dark:bg-[#141c19] rounded-3xl p-6 text-center shadow-xs border border-emerald-950/5 dark:border-white/5 space-y-4">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  if (user.avatarUrl && onImageClick) {
                    onImageClick(user.avatarUrl, user.displayName);
                  }
                }}
                className={user.avatarUrl && onImageClick ? 'cursor-pointer' : 'cursor-default'}
              >
                <UserAvatar
                  displayName={user.displayName}
                  avatarColor={user.avatarColor}
                  avatarUrl={user.avatarUrl}
                  sizeClass="w-28 h-28"
                  textClass="text-3xl"
                  online={user.online}
                />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold">{user.displayName}</h3>
              <p className="text-sm font-mono-handle text-[#006c51] dark:text-[#4fd8b0]">
                @{user.username}
              </p>
              <p
                className={`text-xs ${
                  user.online
                    ? 'text-[#006c51] dark:text-[#4fd8b0] font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {user.online ? 'متصل الآن' : `آخر ظهور ${formatLastSeen(user.lastSeen)}`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {relation === 'accepted' && onStartCall && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartCall();
                  }}
                  className="min-h-[42px] px-5 rounded-full bg-[#006c51] hover:bg-[#005842] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>مكالمة صوتية</span>
                </button>
              )}

              {relation === 'none' && onSendFriendRequest && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleFriendAction(() => onSendFriendRequest(user))}
                  className="min-h-[42px] px-5 rounded-full bg-[#006c51] hover:bg-[#005842] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{busy ? 'جارٍ الإرسال...' : 'إرسال طلب صداقة'}</span>
                </button>
              )}

              {relation === 'pending_sent' && (
                <div className="min-h-[42px] px-5 rounded-full bg-[#eff4f0] dark:bg-[#1d2623] text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>تم إرسال طلب الصداقة</span>
                </div>
              )}

              {relation === 'pending_received' && onRespondFriendRequest && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handleFriendAction(() => onRespondFriendRequest(user.id, 'accept'))
                    }
                    className="min-h-[42px] px-5 rounded-full bg-[#006c51] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>قبول الصداقة</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handleFriendAction(() => onRespondFriendRequest(user.id, 'decline'))
                    }
                    className="min-h-[42px] px-4 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserX className="w-4 h-4" />
                    <span>رفض</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={copyHandle}
                className="min-h-[42px] px-4 rounded-full bg-[#eff4f0] dark:bg-[#1d2623] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedHandle ? (
                  <Check className="w-4 h-4 text-[#006c51]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copiedHandle ? 'تم نسخ المعرّف' : 'نسخ المعرّف'}</span>
              </button>
            </div>
          </section>

          {/* Complete Contact Details List */}
          <section className="bg-white dark:bg-[#141c19] rounded-3xl divide-y divide-slate-100 dark:divide-white/5 shadow-xs border border-emerald-950/5 dark:border-white/5 overflow-hidden">
            <div className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#eff4f0] dark:bg-[#1d2623] text-[#006c51] dark:text-[#4fd8b0] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  الحالة الآن
                </p>
                <p className="text-sm font-bold mt-0.5">{user.currentStatus || 'متصل'}</p>
              </div>
            </div>

            <div className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#eff4f0] dark:bg-[#1d2623] text-[#006c51] dark:text-[#4fd8b0] flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  النبذة التعريفية
                </p>
                <p className="text-sm leading-relaxed mt-0.5">
                  {user.bio || 'لم يضف نبذة بعد'}
                </p>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#eff4f0] dark:bg-[#1d2623] text-[#006c51] dark:text-[#4fd8b0] flex items-center justify-center shrink-0">
                <AtSign className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  معرّف الحساب
                </p>
                <p className="text-sm font-mono-handle font-bold mt-0.5">@{user.username}</p>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#eff4f0] dark:bg-[#1d2623] text-[#006c51] dark:text-[#4fd8b0] flex items-center justify-center shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    اللون المميّز
                  </p>
                  <p className="text-xs font-mono-handle font-semibold mt-0.5 dir-ltr text-right">
                    {user.avatarColor}
                  </p>
                </div>
              </div>
              <span
                className="w-9 h-9 rounded-full ring-2 ring-emerald-950/10 dark:ring-white/15 shrink-0"
                style={{ backgroundColor: user.avatarColor }}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
