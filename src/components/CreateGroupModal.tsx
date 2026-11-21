import { useRef, useState } from 'react';
import { Camera, Check, Link2, Plus, Trash2, Users, X } from 'lucide-react';
import { apiRequest, uploadMediaFile } from '../lib/api';
import type { ExtraLink, GroupSummary, PublicUser } from '../types';
import { UserAvatar } from './UserAvatar';

interface CreateGroupModalProps {
  token: string;
  friends: PublicUser[];
  onClose: () => void;
  onCreated: (group: GroupSummary) => void;
  onShowToast: (msg: string) => void;
}

export function CreateGroupModal({
  token,
  friends,
  onClose,
  onCreated,
  onShowToast,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promoText, setPromoText] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [extraLinks, setExtraLinks] = useState<ExtraLink[]>([]);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  async function handleAvatarChange(file: File) {
    setUploadingAvatar(true);
    try {
      const res = await uploadMediaFile(file, token);
      if (res.isVideo) {
        onShowToast('يرجى اختيار صورة للمجموعة');
        return;
      }
      setAvatarUrl(res.url);
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر رفع صورة المجموعة');
    } finally {
      setUploadingAvatar(false);
    }
  }

  function addLink() {
    const rawUrl = linkUrl.trim();
    if (!rawUrl) return;
    const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    try {
      const parsed = new URL(normalized);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        onShowToast('يرجى إدخال رابط يبدأ بـ http أو https');
        return;
      }
      setExtraLinks((prev) => [
        ...prev.slice(0, 5),
        { label: linkLabel.trim() || parsed.hostname, url: parsed.toString() },
      ]);
      setLinkLabel('');
      setLinkUrl('');
    } catch {
      onShowToast('صيغة الرابط غير صالحة');
    }
  }

  function toggleFriend(id: string) {
    setSelectedFriendIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('اسم المجموعة يجب أن يكون حرفين على الأقل');
      return;
    }

    setCreating(true);
    try {
      const res = await apiRequest<{ group: GroupSummary }>('/api/groups', {
        method: 'POST',
        token,
        body: {
          name: name.trim(),
          description: description.trim(),
          promoText: promoText.trim(),
          avatarUrl,
          extraLinks,
          memberIds: Array.from(selectedFriendIds),
        },
      });
      onCreated(res.group);
    } catch (err) {
      setError((err as Error).message || 'تعذر إنشاء المجموعة');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-h-[92dvh] sm:max-w-lg rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-[#141c19] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-emerald-950/10 dark:border-white/10 flex items-center justify-between shrink-0">
          <h3 className="text-base font-bold">إنشاء مجموعة خاصة</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Group Photo Picker */}
          <div className="flex items-center gap-4">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void handleAvatarChange(f);
              }}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="relative w-18 h-18 rounded-3xl bg-[#eff4f0] dark:bg-[#1d2623] border border-emerald-950/10 dark:border-white/10 flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="صورة المجموعة" className="w-full h-full object-cover" />
              ) : (
                <Users className="w-7 h-7 text-[#006c51] dark:text-[#4fd8b0]" />
              )}
              <span className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-[#006c51] text-white flex items-center justify-center shadow-xs">
                <Camera className="w-3.5 h-3.5" />
              </span>
            </button>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-bold">صورة المجموعة</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {uploadingAvatar ? 'جارٍ رفع الصورة...' : 'اضغط لاختيار صورة للمجموعة الخاصة'}
              </p>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-[11px] font-semibold text-rose-600 cursor-pointer"
                >
                  إزالة الصورة
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">اسم المجموعة</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: فريق العمل، أصدقاء الجامعة..."
              className="w-full min-h-[44px] px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">وصف المجموعة</label>
            <textarea
              rows={2}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="نبذة عن هدف المجموعة وقوانينها..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">النص الدعائي / نبذة الدعوة</label>
            <input
              type="text"
              maxLength={300}
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
              placeholder="جملة ترويجية أو دعائية تظهر عند مشاركة المجموعة..."
              className="w-full min-h-[44px] px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm"
            />
          </div>

          {/* Extra Links Builder */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold">روابط إضافية</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                maxLength={50}
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="اسم الرابط (مثلاً: الموقع)"
                className="sm:w-1/3 min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-xs"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 min-w-0 min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-xs text-left"
                />
                <button
                  type="button"
                  onClick={addLink}
                  className="min-h-[40px] px-3.5 rounded-xl bg-[#eff4f0] dark:bg-[#1d2623] text-[#006c51] dark:text-[#4fd8b0] text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              </div>
            </div>

            {extraLinks.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {extraLinks.map((lnk, idx) => (
                  <div
                    key={`${lnk.url}-${idx}`}
                    className="px-3 py-2 rounded-xl bg-[#f7f9f7] dark:bg-[#1b2421] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Link2 className="w-3.5 h-3.5 text-[#006c51] dark:text-[#4fd8b0] shrink-0" />
                      <span className="font-semibold truncate">{lnk.label}</span>
                      <span className="text-slate-400 truncate dir-ltr">{lnk.url}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExtraLinks((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-rose-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Friends Multi-Select */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">إضافة أصدقاء للمجموعة</label>
              <span className="text-[11px] font-semibold text-[#006c51] dark:text-[#4fd8b0] tabular-nums">
                مختار: {selectedFriendIds.size}
              </span>
            </div>

            {friends.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 p-3 rounded-2xl bg-[#f7f9f7] dark:bg-[#1b2421]">
                لا يوجد أصدقاء مضافون بعد. يمكنك إضافة الأصدقاء لاحقاً أو مشاركة رابط المجموعة معهم.
              </p>
            ) : (
              <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                {friends.map((f) => {
                  const checked = selectedFriendIds.has(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFriend(f.id)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-right hover:bg-[#f7f9f7] dark:hover:bg-[#1b2421] cursor-pointer"
                    >
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
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          checked
                            ? 'bg-[#006c51] text-white'
                            : 'border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={creating || uploadingAvatar}
            className="w-full min-h-[48px] rounded-full bg-[#006c51] hover:bg-[#005842] disabled:opacity-60 text-white text-sm font-bold cursor-pointer"
          >
            {creating ? 'جارٍ إنشاء المجموعة...' : 'إنشاء المجموعة الخاصة'}
          </button>
        </form>
      </div>
    </div>
  );
}
