import { useState } from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { PublicUser } from '../types';

const STATUS_PRESETS = ['متصل', 'مسافر', 'مشغول', 'في العمل', 'في الدراسة', 'متاح للدردشة'];

interface OnboardingBioModalProps {
  token: string;
  user: PublicUser;
  onCompleted: (updated: PublicUser) => void;
  onShowToast: (msg: string) => void;
}

export function OnboardingBioModal({
  token,
  user,
  onCompleted,
  onShowToast,
}: OnboardingBioModalProps) {
  const [step, setStep] = useState<'prompt' | 'editor'>('prompt');
  const [bio, setBio] = useState(user.bio || '');
  const [currentStatus, setCurrentStatus] = useState(user.currentStatus || 'متصل');
  const [saving, setSaving] = useState(false);

  async function handleSkip() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await apiRequest<{ user: PublicUser }>('/api/auth/profile', {
        method: 'PATCH',
        token,
        body: { needsOnboarding: false },
      });
      onCompleted(res.user);
    } catch {
      onCompleted({ ...user, needsOnboarding: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const res = await apiRequest<{ user: PublicUser }>('/api/auth/profile', {
        method: 'PATCH',
        token,
        body: {
          bio: bio.trim(),
          currentStatus: currentStatus.trim() || 'متصل',
          needsOnboarding: false,
        },
      });
      onShowToast('تم حفظ نبذتك وحالتك بنجاح');
      onCompleted(res.user);
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر حفظ النبذة');
    } finally {
      setSaving(false);
    }
  }

  if (step === 'prompt') {
    return (
      <div className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-[#141c19] p-6 shadow-2xl space-y-5">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto sm:hidden" />

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#c5efe0] dark:bg-[#00513d] text-[#006c51] dark:text-[#4fd8b0] flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">هل تريد إعداد نبذة عنك؟</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                أضف لمحة تعريفية قصيرة وحدد حالتك الآن (مثل: متصل، مسافر، مشغول) ليراها أصدقاؤك عند الدخول لملفك.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setStep('editor')}
              className="flex-1 min-h-[48px] rounded-full bg-[#006c51] hover:bg-[#005842] text-white text-sm font-bold cursor-pointer active:scale-[0.99] transition-transform"
            >
              متابعة
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSkip()}
              className="min-h-[48px] px-5 rounded-full bg-[#eff4f0] dark:bg-[#1d2623] text-slate-700 dark:text-slate-200 text-sm font-semibold cursor-pointer"
            >
              لاحقاً
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[65] bg-[#f7f9f7] dark:bg-[#0d1311] flex flex-col overflow-hidden">
      <header className="h-14 px-4 bg-white dark:bg-[#141c19] border-b border-emerald-950/10 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep('prompt')}
            aria-label="رجوع"
            className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold">إعداد النبذة والحالة</h2>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSkip()}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer px-2 py-1"
        >
          تخطي
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <form onSubmit={handleSave} className="max-w-lg mx-auto space-y-5">
          <section className="bg-white dark:bg-[#141c19] rounded-3xl p-5 shadow-xs border border-emerald-950/5 dark:border-white/5 space-y-3">
            <label className="block text-sm font-bold">حالتك الآن</label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              اختر حالة سريعة أو اكتب حالتك المفضلة
            </p>

            <div className="flex flex-wrap gap-2">
              {STATUS_PRESETS.map((preset) => {
                const selected = currentStatus === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCurrentStatus(preset)}
                    className={`min-h-[38px] px-4 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      selected
                        ? 'bg-[#006c51] text-white'
                        : 'bg-[#eff4f0] dark:bg-[#1d2623] text-slate-700 dark:text-slate-200 hover:bg-[#e1ece4]'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    <span>{preset}</span>
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              maxLength={50}
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
              placeholder="أو اكتب حالتك الآن (مثلاً: مسافر إلى القاهرة)..."
              className="w-full min-h-[46px] px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm mt-2"
            />
          </section>

          <section className="bg-white dark:bg-[#141c19] rounded-3xl p-5 shadow-xs border border-emerald-950/5 dark:border-white/5 space-y-2.5">
            <label className="block text-sm font-bold">لمحة عنك</label>
            <textarea
              rows={4}
              maxLength={140}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="اكتب نبذة مختصرة عنك، اهتماماتك، أو عملك..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 text-left tabular-nums">
              {bio.length} / 140
            </p>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="w-full min-h-[50px] rounded-full bg-[#006c51] hover:bg-[#005842] disabled:opacity-60 text-white text-sm font-bold cursor-pointer shadow-md"
          >
            {saving ? 'جارٍ الحفظ...' : 'حفظ ومتابعة'}
          </button>
        </form>
      </div>
    </div>
  );
}
