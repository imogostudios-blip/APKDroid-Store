import { useEffect, useState } from 'react';
import {
  ArrowRight,
  AtSign,
  Check,
  Clock,
  MessageSquare,
  Palette,
  Search,
  Share2,
  Sparkles,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';
import { apiRequest, formatLastSeen } from '../lib/api';
import type { FriendshipRelation, PublicUser } from '../types';
import { UserAvatar } from './UserAvatar';

interface FindUserModalProps {
  token: string;
  onClose: () => void;
  onStartChat: (user: PublicUser) => Promise<void>;
  onFriendAccepted: (user: PublicUser, conversationId?: string) => void;
  onShareContact: (user: PublicUser) => void;
  onShowToast: (msg: string) => void;
}

export function FindUserModal({
  token,
  onClose,
  onStartChat,
  onFriendAccepted,
  onShareContact,
  onShowToast,
}: FindUserModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const cleaned = query.trim().replace(/^@+/, '').toLowerCase();
    const timer = window.setTimeout(async () => {
      try {
        const res = await apiRequest<{ users: PublicUser[] }>(
          `/api/users?q=${encodeURIComponent(cleaned)}`,
          { token }
        );
        if (!cancelled) {
          setUsers(res.users);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message || 'تعذر البحث عن المعرّفات');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, token]);

  function updateUserInState(updated: PublicUser) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setSelectedUser((prev) => (prev && prev.id === updated.id ? updated : prev));
  }

  async function sendFriendRequest(user: PublicUser) {
    if (busyId) return;
    setBusyId(user.id);
    try {
      const res = await apiRequest<{
        friendshipStatus: FriendshipRelation;
        user: PublicUser;
        conversationId?: string;
      }>('/api/friends/request', {
        method: 'POST',
        token,
        body: { targetUserId: user.id },
      });
      updateUserInState(res.user);
      if (res.friendshipStatus === 'accepted') {
        onShowToast(`أصبحتما أصدقاء الآن مع ${res.user.displayName}`);
        onFriendAccepted(res.user, res.conversationId);
      } else {
        onShowToast(`تم إرسال طلب صداقة إلى @${user.username}`);
      }
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر إرسال طلب الصداقة');
    } finally {
      setBusyId(null);
    }
  }

  async function respondFriendRequest(user: PublicUser, action: 'accept' | 'decline' | 'cancel') {
    if (busyId) return;
    setBusyId(user.id);
    try {
      const res = await apiRequest<{
        friendshipStatus: FriendshipRelation;
        user: PublicUser;
        conversationId?: string;
      }>('/api/friends/respond', {
        method: 'POST',
        token,
        body: { userId: user.id, action },
      });
      updateUserInState(res.user);
      if (action === 'accept' && res.friendshipStatus === 'accepted') {
        onShowToast(`تم قبول صداقة ${res.user.displayName}`);
        onFriendAccepted(res.user, res.conversationId);
      } else if (action === 'cancel') {
        onShowToast('تم إلغاء طلب الصداقة');
      } else {
        onShowToast('تم رفض الطلب');
      }
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر تنفيذ الإجراء');
    } finally {
      setBusyId(null);
    }
  }

  async function handleOpenChat(user: PublicUser) {
    if (busyId) return;
    setBusyId(user.id);
    try {
      await onStartChat(user);
      onClose();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full h-[92dvh] sm:h-[600px] sm:max-w-md rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-[#141c19] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-emerald-950/10 dark:border-white/10 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (selectedUser) setSelectedUser(null);
              else onClose();
            }}
            aria-label="رجوع"
            className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold truncate">
              {selectedUser ? selectedUser.displayName : 'البحث في المعرّفات'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {selectedUser
                ? `@${selectedUser.username}`
                : 'ابحث عالمياً عن معرّف أي شخص لإرسال طلب صداقة'}
            </p>
          </div>
          {selectedUser && (
            <button
              type="button"
              onClick={() => onShareContact(selectedUser)}
              aria-label="مشاركة"
              className="w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer shrink-0"
            >
              <Share2 className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0]" />
            </button>
          )}
        </div>

        {selectedUser ? (
          /* User Profile & Friend Request Preview (NO direct chat input until accepted) */
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="text-center space-y-3 pt-2">
              <div className="flex justify-center">
                <UserAvatar
                  displayName={selectedUser.displayName}
                  avatarColor={selectedUser.avatarColor}
                  avatarUrl={selectedUser.avatarUrl}
                  sizeClass="w-24 h-24"
                  textClass="text-2xl"
                  online={selectedUser.online}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold">{selectedUser.displayName}</h3>
                <p className="text-xs font-mono-handle text-[#006c51] dark:text-[#4fd8b0]">
                  @{selectedUser.username}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedUser.online
                    ? 'متصل الآن'
                    : `آخر ظهور ${formatLastSeen(selectedUser.lastSeen)}`}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-[#f7f9f7] dark:bg-[#1b2421] divide-y divide-slate-200/70 dark:divide-white/5 overflow-hidden">
              <div className="p-3.5 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0] shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-slate-500">الحالة الآن</p>
                  <p className="text-xs font-bold">{selectedUser.currentStatus || 'متصل'}</p>
                </div>
              </div>
              <div className="p-3.5">
                <p className="text-[10px] font-semibold text-slate-500">النبذة</p>
                <p className="text-xs mt-0.5 leading-relaxed">
                  {selectedUser.bio || 'لا توجد نبذة مضافة'}
                </p>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0]" />
                  <span className="text-xs font-semibold">اللون المميّز</span>
                </div>
                <span
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: selectedUser.avatarColor }}
                />
              </div>
            </div>

            {/* Friend Request / Chat Action Zone */}
            <div className="pt-1 space-y-2.5">
              {selectedUser.friendshipStatus === 'accepted' ? (
                <button
                  type="button"
                  disabled={busyId === selectedUser.id}
                  onClick={() => void handleOpenChat(selectedUser)}
                  className="w-full min-h-[48px] rounded-full bg-[#006c51] hover:bg-[#005842] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{busyId === selectedUser.id ? 'جارٍ الفتح...' : 'فتح المحادثة'}</span>
                </button>
              ) : selectedUser.friendshipStatus === 'pending_sent' ? (
                <div className="space-y-2">
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-semibold text-center flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>تم إرسال طلب الصداقة · بانتظار موافقة الطرف الآخر للمحادثة</span>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === selectedUser.id}
                    onClick={() => void respondFriendRequest(selectedUser, 'cancel')}
                    className="w-full min-h-[44px] rounded-full bg-[#eff4f0] dark:bg-[#1d2623] text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    إلغاء الطلب
                  </button>
                </div>
              ) : selectedUser.friendshipStatus === 'pending_received' ? (
                <div className="space-y-2.5">
                  <p className="text-xs text-center font-semibold text-[#006c51] dark:text-[#4fd8b0]">
                    أرسل لك {selectedUser.displayName} طلب صداقة
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === selectedUser.id}
                      onClick={() => void respondFriendRequest(selectedUser, 'accept')}
                      className="flex-1 min-h-[46px] rounded-full bg-[#006c51] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>قبول وبدء الدردشة</span>
                    </button>
                    <button
                      type="button"
                      disabled={busyId === selectedUser.id}
                      onClick={() => void respondFriendRequest(selectedUser, 'decline')}
                      className="min-h-[46px] px-4 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <UserX className="w-4 h-4" />
                      <span>رفض</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                    للمحافظة على الخصوصية، يجب إرسال طلب صداقة وموافقة الطرف الآخر قبل فتح المحادثة.
                  </p>
                  <button
                    type="button"
                    disabled={busyId === selectedUser.id}
                    onClick={() => void sendFriendRequest(selectedUser)}
                    className="w-full min-h-[48px] rounded-full bg-[#006c51] hover:bg-[#005842] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {busyId === selectedUser.id ? 'جارٍ الإرسال...' : 'إرسال طلب صداقة'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Global Handle Search Input */}
            <div className="p-3.5 border-b border-emerald-950/5 dark:border-white/5 shrink-0">
              <div className="flex items-center bg-[#eff4f0] dark:bg-[#1d2623] rounded-full px-3.5 py-1.5 gap-2 focus-within:ring-2 focus-within:ring-[#006c51]/35">
                <AtSign className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0] shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="اكتب المعرّف مثل ahmad_4678 أو الاسم..."
                  className="flex-1 min-w-0 bg-transparent text-sm py-1.5 focus:outline-none"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="مسح"
                    className="w-7 h-7 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
              {error ? (
                <p className="p-6 text-center text-xs text-rose-600 dark:text-rose-400">{error}</p>
              ) : loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-14 rounded-2xl bg-[#eff4f0] dark:bg-[#1b2421] animate-pulse"
                    />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-sm font-semibold">لا توجد نتائج مطابقة</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    تأكد من كتابة المعرّف بشكل صحيح، أو جرّب البحث باسم آخر.
                  </p>
                </div>
              ) : (
                users.map((u) => {
                  const status = u.friendshipStatus ?? 'none';
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-right hover:bg-[#f7f9f7] dark:hover:bg-[#1b2421] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          displayName={u.displayName}
                          avatarColor={u.avatarColor}
                          avatarUrl={u.avatarUrl}
                          sizeClass="w-12 h-12"
                          textClass="text-sm"
                          online={u.online}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{u.displayName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            <span className="font-mono-handle text-[#006c51] dark:text-[#4fd8b0]">
                              @{u.username}
                            </span>
                            <span aria-hidden="true"> · </span>
                            <span>{u.currentStatus || (u.online ? 'متصل الآن' : 'متاح')}</span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`min-h-[34px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 ${
                          status === 'accepted'
                            ? 'bg-[#c5efe0] dark:bg-[#00513d] text-[#002117] dark:text-[#b8f3dd]'
                            : status === 'pending_sent'
                              ? 'bg-[#eff4f0] dark:bg-[#1d2623] text-slate-600 dark:text-slate-300'
                              : status === 'pending_received'
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                : 'bg-[#006c51] text-white'
                        }`}
                      >
                        {status === 'accepted' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>صديق</span>
                          </>
                        ) : status === 'pending_sent' ? (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>معلّق</span>
                          </>
                        ) : status === 'pending_received' ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>طلب وارد</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>إضافة</span>
                          </>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
