import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { fetchAuthorizedBlobUrl, formatDuration } from '../lib/api';

interface AudioMessagePlayerProps {
  fileId: string;
  token: string;
  initialDuration?: number | null;
  isOutgoing: boolean;
}

const WAVE_BARS = [35, 65, 45, 85, 55, 95, 70, 40, 80, 60, 90, 50, 75, 45, 85, 60, 40, 70, 50, 35];

export function AudioMessagePlayer({
  fileId,
  token,
  initialDuration,
  isOutgoing,
}: AudioMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration && initialDuration > 0 ? initialDuration : 0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAuthorizedBlobUrl(fileId, token)
      .then((url) => {
        if (active) setSrcUrl(url);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fileId, token]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !srcUrl) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play().catch(() => setError(true));
    }
  }

  function cycleSpeed() {
    setPlaybackRate((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const next = Number(e.target.value);
    audio.currentTime = next;
    setCurrentTime(next);
  }

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="flex items-center gap-2.5 min-w-[220px] sm:min-w-[250px]" dir="ltr">
      {srcUrl && (
        <audio
          ref={audioRef}
          src={srcUrl}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setCurrentTime(0);
          }}
          onTimeUpdate={(e) => {
            setCurrentTime(e.currentTarget.currentTime);
          }}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) {
              setDuration(d);
            }
          }}
        />
      )}

      <button
        type="button"
        onClick={togglePlay}
        disabled={loading || error || !srcUrl}
        aria-label={playing ? 'إيقاف التشغيل' : 'تشغيل التسجيل الصوتي'}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-50 ${
          isOutgoing
            ? 'bg-teal-700/20 hover:bg-teal-700/30 text-teal-900 dark:bg-white/15 dark:hover:bg-white/25 dark:text-white'
            : 'bg-teal-600 hover:bg-teal-700 text-white'
        }`}
      >
        {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="relative h-6 flex items-center gap-[3px]">
          {WAVE_BARS.map((height, idx) => {
            const barPct = ((idx + 1) / WAVE_BARS.length) * 100;
            const active = barPct <= progressPct;
            return (
              <div
                key={idx}
                style={{ height: `${height}%` }}
                className={`flex-1 rounded-full transition-colors ${
                  active
                    ? isOutgoing
                      ? 'bg-teal-700 dark:bg-teal-300'
                      : 'bg-teal-600 dark:bg-teal-400'
                    : isOutgoing
                      ? 'bg-teal-900/20 dark:bg-white/25'
                      : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            );
          })}
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            aria-label="شريط تقدم التسجيل الصوتي"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] tabular-nums text-slate-600 dark:text-slate-300">
          <span>{error ? 'تعذر التشغيل' : formatDuration(playing ? currentTime : duration)}</span>
          <button
            type="button"
            onClick={cycleSpeed}
            className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[10px] font-semibold cursor-pointer"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
