import { useRef, useState } from 'react';
import {
  Bell,
  Camera,
  Check,
  Copy,
  Image as ImageIcon,
  LogOut,
  Moon,
  Share2,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { CHAT_WALLPAPERS, DEFAULT_CHAT_WALLPAPER, type ChatWallpaperId } from '../lib/wallpapers';
import type { PublicUser } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { UserAvatar } from './UserAvatar';

const COLOR_OPTIONS = [
  '#006c51',
  '#0284c7',
  '#059669',
  '#d97706',
  '#dc2626',
  '#4f46e5',
  '#7c3aed',
  '#be123c',
];

const STATUS_PRESETS = ['متصل', 'مسافر', 'مشغول', 'في العمل', 'في دراسة', 'متاح للدردشة'];

interface SettingsViewProps {
  user: PublicUser;
  token: string;
  darkMode: boolean;
  soundEnabled: boolean;
  wsConnected: boolean;
  onToggleDark: () => void;
  onToggleSound: () => void;
  onUpdated: (user: PublicUser) => void;
  onShareSelf?: () => void;
  onLogout: () => void;
  onShowToast: (msg: string) => void;
}

export function SettingsView({
  user,
  token,
  darkMode,
  soundEnabled,
  wsConnected,
  onToggleDark,
  onToggleSound,
  onUpdated,
  onShareSelf,
  onLogout,
  onShowToast,
}: SettingsViewProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [currentStatus, setCurrentStatus] = useState(user.currentStatus || 'متصل');
  const [avatarColor, setAvatarColor] = useState(user.avatarColor);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingWallpaper, setSavingWallpaper] = useState<ChatWallpaperId | null>(null);
  const [copied, setCopied] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const currentWallpaper = (user.chatWallpaper as ChatWallpaperId) || DEFAULT_CHAT_WALLPAPER;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiRequest<{ user: PublicUser }>('/api/auth/profile', {
        method: 'PATCH',
        token,
        body: {
          displayName,
          bio,
          currentStatus: currentStatus.trim() || 'متصل',
          avatarColor,
        },
      });
      onUpdated(res.user);
      onShowToast('تم حفظ بيانات الحساب');
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarSelect(file: File) {
    if (uploadingAvatar) return;
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as { user?: PublicUser; error?: string };
      if (!res.ok || !data.user) {
        throw new Error(data.error || 'تعذر رفع الصورة الشخصية');
      }
      onUpdated(data.user);
      onShowToast('تم تحديث الصورة الشخصية');
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر رفع الصورة الشخصية');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    if (uploadingAvatar || !user.avatarUrl) return;
    setUploadingAvatar(true);
    try {
      const res = await apiRequest<{ user: PublicUser }>('/api/auth/avatar', {
        method: 'DELETE',
        token,
      });
      onUpdated(res.user);
      onShowToast('تمت إزالة الصورة الشخصية');
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر إزالة الصورة');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSelectWallpaper(wallpaperId: ChatWallpaperId) {
    if (savingWallpaper || currentWallpaper === wallpaperId) return;
    setSavingWallpaper(wallpaperId);
    try {
      const res = await apiRequest<{ user: PublicUser }>('/api/auth/profile', {
        method: 'PATCH',
        token,
        body: { chatWallpaper: wallpaperId },
      });
      onUpdated(res.user);
      onShowToast('تم تغيير خلفية الدردشة');
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر حفظ الخلفية');
    } finally {
      setSavingWallpaper(null);
    }
  }

  function copyHandle() {
    void navigator.clipboard.writeText(`@${user.username}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f7f9f7] dark:bg-[#0d1311] p-4 sm:p-6">
      <div className="max-w-xl mx-auto space-y-4 pb-6">
        {/* Account & Profile Photo Card */}
        <section className="bg-white dark:bg-[#141c19] border border-emerald-950/5 dark:border-white/5 rounded-3xl p-5 space-y-5 shadow-xs">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void handleAvatarSelect(file);
            }}
          />

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <UserAvatar
                  displayName={displayName || user.displayName}
                  avatarColor={avatarColor}
                  avatarUrl={user.avatarUrl}
                  sizeClass="w-16 h-16"
                  textClass="text-lg"
                />
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label="تغيير الصورة الشخصية"
                  className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-[#006c51] hover:bg-[#005842] text-white flex items-center justify-center ring-2 ring-white dark:ring-[#141c19] cursor-pointer shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="min-w-0">
                <p className="text-base font-bold truncate">{displayName || user.displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="font-mono-handle text-[#006c51] dark:text-[#4fd8b0]">
                    @{user.username}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className={wsConnected ? 'text-[#006c51] dark:text-[#4fd8b0]' : 'text-amber-600'}>
                    {wsConnected ? 'متصل' : 'جارٍ الاتصال'}
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="text-[11px] font-semibold text-[#006c51] dark:text-[#4fd8b0] hover:underline cursor-pointer"
                  >
                    {uploadingAvatar
                      ? 'جارٍ الرفع...'
                      : user.avatarUrl
                        ? 'تغيير الصورة'
                        : 'إضافة صورة شخصية'}
                  </button>
                  {user.avatarUrl && (
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={() => void handleRemoveAvatar()}
                      className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>إزالة</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyHandle}
                className="min-h-[38px] px-3.5 rounded-full bg-[#eff4f0] dark:bg-[#1d2623] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#006c51]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ المعرّف'}</span>
              </button>

              {onShareSelf && (
                <button
                  type="button"
                  onClick={onShareSelf}
                  aria-label="مشاركة حسابي"
                  className="min-h-[38px] px-3.5 rounded-full bg-[#c5efe0] dark:bg-[#00513d] text-[#002117] dark:text-[#b8f3dd] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>مشاركة</span>
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5 pt-3 border-t border-slate-100 dark:border-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  الاسم الظاهر
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={40}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  حالتك الآن
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  placeholder="مثال: متصل، مسافر، مشغول..."
                  className="w-full min-h-[44px] px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {STATUS_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCurrentStatus(preset)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                    currentStatus === preset
                      ? 'bg-[#006c51] text-white'
                      : 'bg-[#eff4f0] dark:bg-[#1d2623] text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                النبذة التعريفية
              </label>
              <input
                type="text"
                maxLength={140}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="اكتب نبذة قصيرة عنك..."
                className="w-full min-h-[44px] px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm"
              />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    aria-label={`اختيار اللون ${c}`}
                    className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${
                      avatarColor === c ? 'ring-2 ring-offset-2 ring-[#006c51] scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="min-h-[42px] px-5 rounded-full bg-[#006c51] hover:bg-[#005842] disabled:opacity-60 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                {saving ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
            </div>
          </form>
        </section>

        {/* Chat Wallpaper Selector */}
        <section className="bg-white dark:bg-[#141c19] border border-emerald-950/5 dark:border-white/5 rounded-3xl p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#eff4f0] dark:bg-[#1d2623] text-[#006c51] dark:text-[#4fd8b0] flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold">خلفية الدردشة</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اختر خلفية المحادثات المفضلة لديك
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {CHAT_WALLPAPERS.map((wp) => {
              const selected = currentWallpaper === wp.id;
              const isSavingThis = savingWallpaper === wp.id;
              return (
                <button
                  key={wp.id}
                  type="button"
                  disabled={Boolean(savingWallpaper)}
                  onClick={() => void handleSelectWallpaper(wp.id)}
                  className={`group relative rounded-2xl overflow-hidden text-right cursor-pointer transition-all border-2 ${
                    selected
                      ? 'border-[#006c51] dark:border-[#4fd8b0] ring-2 ring-[#006c51]/25 scale-[1.01]'
                      : 'border-transparent hover:border-emerald-950/20 dark:hover:border-white/20'
                  }`}
                >
                  <div
                    className="aspect-[9/14] w-full bg-cover bg-center relative"
                    style={{
                      backgroundColor: wp.fallbackBg,
                      backgroundImage: `url(${wp.src})`,
                    }}
                  >
                    {/* Mini chat bubble preview */}
                    <div className="absolute inset-x-2 top-3 space-y-1.5 pointer-events-none">
                      <div className="w-3/4 h-3.5 rounded-xl bg-white/95 shadow-xs ml-auto" />
                      <div className="w-4/5 h-3.5 rounded-xl bg-[#d8f5e5]/95 shadow-xs mr-auto" />
                    </div>

                    {selected && (
                      <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#006c51] text-white flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}

                    {isSavingThis && (
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="p-2 bg-[#f7f9f7] dark:bg-[#1b2421]">
                    <p className="text-[11px] font-bold truncate">{wp.label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {wp.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Android Settings List */}
        <section className="bg-white dark:bg-[#141c19] border border-emerald-950/5 dark:border-white/5 rounded-3xl divide-y divide-slate-100 dark:divide-white/5 shadow-xs overflow-hidden">
          <PWAInstallButton />

          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#eff4f0] dark:bg-[#1d2623] text-[#006c51] dark:text-[#4fd8b0] flex items-center justify-center">
                {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold">المظهر الداكن</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {darkMode ? 'مفعّل' : 'الوضع الفاتح'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleDark}
              className={`min-h-[38px] px-4 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                darkMode
                  ? 'bg-[#006c51] text-white'
                  : 'bg-[#eff4f0] dark:bg-[#1d2623] text-slate-700 dark:text-slate-200'
              }`}
            >
              {darkMode ? 'إيقاف' : 'تفعيل'}
            </button>
          </div>

          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#eff4f0] dark:bg-[#1d2623] text-[#006c51] dark:text-[#4fd8b0] flex items-center justify-center">
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold">نغمات الرسائل</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  صوت تنبيه عند استلام رسالة جديدة
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleSound}
              className={`min-h-[38px] px-4 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-[#006c51] text-white'
                  : 'bg-[#eff4f0] dark:bg-[#1d2623] text-slate-700 dark:text-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{soundEnabled ? 'مفعّل' : 'مكتوم'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full p-4 flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">تسجيل الخروج</p>
                <p className="text-xs opacity-80">العودة إلى شاشة الدخول</p>
              </div>
            </div>
          </button>
        </section>
      </div>
    </div>
  );
}
