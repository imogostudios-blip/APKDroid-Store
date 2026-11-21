import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { formatDuration } from '../lib/api';
import type { PublicUser } from '../types';
import { UserAvatar } from './UserAvatar';

export interface ActiveCallState {
  callId: string;
  conversationId: string;
  peer: PublicUser;
  direction: 'outgoing' | 'incoming';
  phase: 'ringing' | 'connecting' | 'connected';
  startedAt: number | null;
  muted: boolean;
  micError?: string | null;
}

interface CallOverlayProps {
  call: ActiveCallState;
  elapsedSec: number;
  audioLevel: number;
  onAccept: () => void;
  onReject: () => void;
  onHangup: () => void;
  onToggleMute: () => void;
}

export function CallOverlay({
  call,
  elapsedSec,
  audioLevel,
  onAccept,
  onReject,
  onHangup,
  onToggleMute,
}: CallOverlayProps) {
  const isIncomingRinging = call.direction === 'incoming' && call.phase === 'ringing';

  const statusText =
    call.phase === 'connected'
      ? `متصل · ${formatDuration(elapsedSec)}`
      : call.phase === 'connecting'
        ? 'جارٍ الربط الصوتي...'
        : call.direction === 'incoming'
          ? 'مكالمة صوتية واردة'
          : 'جارٍ الاتصال...';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#111b21] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center shadow-2xl space-y-6">
        <div className="space-y-3">
          <div
            className="relative mx-auto w-24 h-24 rounded-full shadow-md transition-transform duration-150"
            style={{
              transform:
                call.phase === 'connected'
                  ? `scale(${1 + Math.min(0.12, audioLevel * 0.14)})`
                  : 'scale(1)',
            }}
          >
            <UserAvatar
              displayName={call.peer.displayName}
              avatarColor={call.peer.avatarColor}
              avatarUrl={call.peer.avatarUrl}
              sizeClass="w-24 h-24"
              textClass="text-2xl"
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {call.peer.displayName}
            </h2>
            <p className="font-mono-handle text-xs text-slate-500 dark:text-slate-400">
              @{call.peer.username}
            </p>
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400 tabular-nums pt-1">
              {statusText}
            </p>
          </div>
        </div>

        {call.phase === 'connected' && (
          <div className="flex items-center justify-center gap-1.5 h-8" aria-hidden="true">
            {[0.4, 0.7, 1, 0.85, 0.55, 0.9, 0.6].map((factor, i) => {
              const barHeight = call.muted
                ? 20
                : Math.max(20, Math.min(100, Math.round(20 + audioLevel * 85 * factor)));
              return (
                <span
                  key={i}
                  style={{ height: `${barHeight}%` }}
                  className="w-1.5 rounded-full bg-teal-600 dark:bg-teal-400 transition-all duration-100"
                />
              );
            })}
          </div>
        )}

        {call.micError && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
            {call.micError}
          </div>
        )}

        <div className="flex items-center justify-center gap-5 pt-2">
          {isIncomingRinging ? (
            <>
              <button
                type="button"
                onClick={onReject}
                aria-label="رفض المكالمة"
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-lg"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={onAccept}
                aria-label="قبول المكالمة"
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-lg"
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={call.muted ? 'إلغاء كتم الميكروفون' : 'كتم الميكروفون'}
                className={`w-13 h-13 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  call.muted
                    ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
                }`}
              >
                {call.muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <div className="w-13 h-13 rounded-full bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>

              <button
                type="button"
                onClick={onHangup}
                aria-label="إنهاء المكالمة"
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-lg"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
