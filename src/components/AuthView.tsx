import { useEffect, useState } from 'react';
import { AtSign, Check, Eye, EyeOff, Lock, Moon, Sun, User, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { PublicUser, UsernameCheckResult } from '../types';

interface AuthViewProps {
  darkMode: boolean;
  onToggleDark: () => void;
  onAuthenticated: (token: string, user: PublicUser) => void;
}

export function AuthView({ darkMode, onToggleDark, onAuthenticated }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameCheckResult | null>(null);
  const [submitSuggestions, setSubmitSuggestions] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setErrorMsg('');
    setSubmitSuggestions([]);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'register') {
      setUsernameStatus(null);
      return;
    }

    const cleaned = username.trim().replace(/^@+/, '').toLowerCase();
    if (!cleaned) {
      setUsernameStatus(null);
      return;
    }

    let cancelled = false;
    setCheckingUsername(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await apiRequest<UsernameCheckResult>(
          `/api/auth/check-username?username=${encodeURIComponent(cleaned)}`
        );
        if (!cancelled) {
          setUsernameStatus(res);
          setSubmitSuggestions([]);
        }
      } catch {
        if (!cancelled) setUsernameStatus(null);
      } finally {
        if (!cancelled) setCheckingUsername(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [username, mode]);

  const activeSuggestions =
    submitSuggestions.length > 0
      ? submitSuggestions
      : usernameStatus && !usernameStatus.available
        ? usernameStatus.suggestions
        : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSubmitSuggestions([]);
    setSubmitting(true);

    try {
      if (mode === 'register') {
        const res = await apiRequest<{ token: string; user: PublicUser }>('/api/auth/register', {
          method: 'POST',
          body: {
            displayName: displayName.trim(),
            username: username.trim(),
            password,
          },
        });
        onAuthenticated(res.token, res.user);
      } else {
        const res = await apiRequest<{ token: string; user: PublicUser }>('/api/auth/login', {
          method: 'POST',
          body: {
            username: username.trim(),
            password,
          },
        });
        onAuthenticated(res.token, res.user);
      }
    } catch (err) {
      const eObj = err as Error & { data?: { suggestions?: string[] } };
      setErrorMsg(eObj.message || 'تعذر إتمام العملية');
      if (eObj.data?.suggestions && Array.isArray(eObj.data.suggestions)) {
        setSubmitSuggestions(eObj.data.suggestions);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#f4f7f5] dark:bg-[#0d1311] text-[#181d1b] dark:text-[#e6ece9] flex items-center justify-center p-0 sm:p-4">
      <div className="w-full min-h-dvh sm:min-h-0 sm:max-w-[430px] bg-white dark:bg-[#141c19] sm:rounded-[32px] sm:border sm:border-emerald-950/10 dark:sm:border-emerald-100/10 sm:shadow-2xl flex flex-col justify-between p-6 sm:p-8">
        {/* Top App Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/faction.png"
              alt="RetChat"
              className="w-11 h-11 rounded-2xl shadow-sm object-cover shrink-0"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-tight">RetChat</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">تراسل ومكالمات فورية</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleDark}
            aria-label={darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
            className="w-11 h-11 rounded-full bg-[#eff4f0] dark:bg-[#1d2623] text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Center Auth Form */}
        <div className="my-auto py-8 space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-[#181d1b] dark:text-white">
              {mode === 'register' ? 'إنشاء حسابك' : 'مرحباً بعودتك'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {mode === 'register'
                ? 'اختر معرّفاً فريداً يبدأ بـ @ للتواصل مع أصدقائك'
                : 'أدخل معرّف حسابك وكلمة المرور للمتابعة'}
            </p>
          </div>

          {/* Material 3 Segmented Button */}
          <div className="grid grid-cols-2 p-1 rounded-full bg-[#eff4f0] dark:bg-[#1d2623] border border-emerald-950/5 dark:border-white/5">
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`min-h-[42px] rounded-full text-sm font-semibold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#c5efe0] dark:bg-[#00513d] text-[#002117] dark:text-[#b8f3dd]'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              حساب جديد
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`min-h-[42px] rounded-full text-sm font-semibold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#c5efe0] dark:bg-[#00513d] text-[#002117] dark:text-[#b8f3dd]'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              تسجيل الدخول
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5"
                >
                  الاسم الظاهر
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="displayName"
                    type="text"
                    required
                    minLength={2}
                    maxLength={40}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="أحمد محمد"
                    className="w-full min-h-[50px] pr-11 pl-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm focus:outline-none focus:ring-2 focus:ring-[#006c51]/35 focus:border-[#006c51]"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  معرّف الحساب
                </label>
                {username.trim() && (
                  <span className="font-mono-handle text-xs text-[#006c51] dark:text-[#4fd8b0]">
                    @{username.trim().replace(/^@+/, '').toLowerCase()}
                  </span>
                )}
              </div>

              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  dir="ltr"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ahmad"
                  className="font-mono-handle text-left w-full min-h-[50px] pl-10 pr-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm focus:outline-none focus:ring-2 focus:ring-[#006c51]/35 focus:border-[#006c51]"
                />
              </div>

              {mode === 'register' && (
                <div className="mt-2 min-h-[20px]">
                  {checkingUsername ? (
                    <p className="text-xs text-slate-500">جارٍ التحقق...</p>
                  ) : usernameStatus ? (
                    usernameStatus.available ? (
                      <p className="text-xs font-medium text-[#006c51] dark:text-[#4fd8b0] flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          المعرّف <span className="font-mono-handle">@{usernameStatus.username}</span>{' '}
                          متاح
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <X className="w-3.5 h-3.5 shrink-0" />
                        <span>{usernameStatus.reason}</span>
                      </p>
                    )
                  ) : null}
                </div>
              )}

              {mode === 'register' && activeSuggestions.length > 0 && (
                <div className="mt-2.5 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 space-y-2">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                    معرّفات مقترحة متاحة:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setUsername(s);
                          setErrorMsg('');
                          setSubmitSuggestions([]);
                        }}
                        className="font-mono-handle text-xs font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-[#1b2421] border border-amber-300 dark:border-amber-700 text-[#006c51] dark:text-[#4fd8b0] cursor-pointer active:scale-95 transition-transform"
                      >
                        @{s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  className="w-full min-h-[50px] pr-11 pl-12 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm focus:outline-none focus:ring-2 focus:ring-[#006c51]/35 focus:border-[#006c51]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium"
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[50px] rounded-full bg-[#006c51] hover:bg-[#005842] disabled:opacity-60 text-white font-semibold text-sm transition-all active:scale-[0.99] cursor-pointer shadow-sm"
            >
              {submitting
                ? 'جارٍ المعالجة...'
                : mode === 'register'
                  ? 'إنشاء الحساب'
                  : 'دخول'}
            </button>
          </form>
        </div>

        <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
          RetChat · دردشة فورية ومكالمات صوتية مشفرة الجلسة
        </p>
      </div>
    </div>
  );
}
