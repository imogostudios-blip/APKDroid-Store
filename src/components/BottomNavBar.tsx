import { useLayoutEffect, useRef, useState } from 'react';

export type BottomTab = 'chats' | 'channels' | 'events' | 'settings';

interface BottomNavBarProps {
  activeNav: BottomTab;
  totalUnread: number;
  hiddenOnMobileChat: boolean;
  onSelect: (tab: BottomTab) => void;
}

function cancelAll(el: Element | null) {
  if (!el || typeof el.getAnimations !== 'function') return;
  for (const anim of el.getAnimations()) {
    anim.cancel();
  }
}

function runAnim(
  el: Element | null,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions
) {
  if (!el || typeof el.animate !== 'function') return;
  cancelAll(el);
  el.animate(keyframes, { ...options, fill: 'none' });
}

export function BottomNavBar({
  activeNav,
  totalUnread,
  hiddenOnMobileChat,
  onSelect,
}: BottomNavBarProps) {
  const [animSeq, setAnimSeq] = useState(0);

  const pillRefs = useRef<Record<BottomTab, HTMLSpanElement | null>>({
    chats: null,
    channels: null,
    events: null,
    settings: null,
  });

  const iconRefs = useRef<Record<BottomTab, HTMLDivElement | null>>({
    chats: null,
    channels: null,
    events: null,
    settings: null,
  });

  const chatDotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const waveLeftOuterRef = useRef<SVGPathElement | null>(null);
  const waveRightOuterRef = useRef<SVGPathElement | null>(null);
  const waveLeftInnerRef = useRef<SVGPathElement | null>(null);
  const waveRightInnerRef = useRef<SVGPathElement | null>(null);
  const eventStarRef = useRef<SVGPathElement | null>(null);
  const settingsGearRef = useRef<SVGGElement | null>(null);

  function handlePress(tab: BottomTab) {
    setAnimSeq((n) => n + 1);
    onSelect(tab);
  }

  useLayoutEffect(() => {
    if (animSeq === 0) return;

    // 1. Expand the green indicator from a crisp circle into the full pill rapidly
    const pillEl = pillRefs.current[activeNav];
    runAnim(
      pillEl,
      [
        { transform: 'scaleX(0.38) scaleY(0.76)', opacity: 0.45, offset: 0 },
        { transform: 'scaleX(0.47) scaleY(0.94)', opacity: 0.9, offset: 0.22 },
        { transform: 'scaleX(1.06) scaleY(1.03)', opacity: 1, offset: 0.72 },
        { transform: 'scaleX(1) scaleY(1)', opacity: 1, offset: 1 },
      ],
      {
        duration: 300,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }
    );

    // 2. Signature playful motion per icon (always ends cleanly at natural full size)
    const iconEl = iconRefs.current[activeNav];

    if (activeNav === 'chats') {
      runAnim(
        iconEl,
        [
          { transform: 'scale(0.84) rotate(-10deg)', offset: 0 },
          { transform: 'scale(1.24) rotate(8deg)', offset: 0.38 },
          { transform: 'scale(0.94) rotate(-4deg)', offset: 0.68 },
          { transform: 'scale(1.05) rotate(2deg)', offset: 0.86 },
          { transform: 'scale(1) rotate(0deg)', offset: 1 },
        ],
        { duration: 460, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );

      chatDotRefs.current.forEach((dot, idx) => {
        runAnim(
          dot,
          [
            { transform: 'translateY(0px) scale(1)', offset: 0 },
            { transform: 'translateY(-3.5px) scale(1.25)', offset: 0.42 },
            { transform: 'translateY(1px) scale(0.95)', offset: 0.75 },
            { transform: 'translateY(0px) scale(1)', offset: 1 },
          ],
          { duration: 340, delay: idx * 65, easing: 'ease-out' }
        );
      });
    } else if (activeNav === 'channels') {
      runAnim(
        iconEl,
        [
          { transform: 'scale(0.86) rotate(-14deg)', offset: 0 },
          { transform: 'scale(1.2) rotate(12deg)', offset: 0.4 },
          { transform: 'scale(0.96) rotate(-6deg)', offset: 0.72 },
          { transform: 'scale(1) rotate(0deg)', offset: 1 },
        ],
        { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );

      [waveLeftInnerRef.current, waveRightInnerRef.current].forEach((el) => {
        runAnim(
          el,
          [
            { transform: 'scale(0.82)', opacity: 0.45, offset: 0 },
            { transform: 'scale(1.18)', opacity: 1, offset: 0.5 },
            { transform: 'scale(1)', opacity: 1, offset: 1 },
          ],
          { duration: 360, easing: 'ease-out' }
        );
      });

      [waveLeftOuterRef.current, waveRightOuterRef.current].forEach((el) => {
        runAnim(
          el,
          [
            { transform: 'scale(0.75)', opacity: 0.3, offset: 0 },
            { transform: 'scale(1.24)', opacity: 1, offset: 0.55 },
            { transform: 'scale(1)', opacity: 1, offset: 1 },
          ],
          { duration: 420, delay: 55, easing: 'ease-out' }
        );
      });
    } else if (activeNav === 'events') {
      runAnim(
        iconEl,
        [
          { transform: 'translateY(0px) scale(0.88) rotate(0deg)', offset: 0 },
          { transform: 'translateY(-8px) scale(1.2) rotate(-10deg)', offset: 0.35 },
          { transform: 'translateY(2px) scale(0.94, 1.06) rotate(6deg)', offset: 0.68 },
          { transform: 'translateY(-2px) scale(1.04) rotate(-2deg)', offset: 0.85 },
          { transform: 'translateY(0px) scale(1) rotate(0deg)', offset: 1 },
        ],
        { duration: 480, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );

      runAnim(
        eventStarRef.current,
        [
          { transform: 'rotate(0deg) scale(1)', offset: 0 },
          { transform: 'rotate(72deg) scale(1.38)', offset: 0.45 },
          { transform: 'rotate(144deg) scale(1)', offset: 1 },
        ],
        { duration: 460, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    } else if (activeNav === 'settings') {
      runAnim(
        iconEl,
        [
          { transform: 'scale(0.86)', offset: 0 },
          { transform: 'scale(1.22)', offset: 0.42 },
          { transform: 'scale(0.96)', offset: 0.74 },
          { transform: 'scale(1)', offset: 1 },
        ],
        { duration: 440, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );

      runAnim(
        settingsGearRef.current,
        [
          { transform: 'rotate(0deg)', offset: 0 },
          { transform: 'rotate(196deg)', offset: 0.68 },
          { transform: 'rotate(175deg)', offset: 0.86 },
          { transform: 'rotate(180deg)', offset: 1 },
        ],
        { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    }
  }, [activeNav, animSeq]);

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className={`bg-white dark:bg-[#141c19] border-t border-emerald-950/10 dark:border-white/10 shrink-0 z-20 ${
        hiddenOnMobileChat ? 'hidden lg:block' : 'block'
      }`}
    >
      <div className="max-w-2xl mx-auto grid grid-cols-4 h-[80px] px-2">
        {/* 1. الدردشات */}
        <button
          type="button"
          onClick={() => handlePress('chats')}
          className="min-w-0 h-full flex flex-col items-center justify-center gap-1 cursor-pointer select-none group"
        >
          <div className="relative w-[74px] h-9 flex items-center justify-center shrink-0">
            {activeNav === 'chats' && (
              <span
                ref={(el) => {
                  pillRefs.current.chats = el;
                }}
                className="pointer-events-none absolute inset-0 rounded-full bg-[#c5efe0] dark:bg-[#00513d] origin-center shadow-xs"
              />
            )}

            <div
              ref={(el) => {
                iconRefs.current.chats = el;
              }}
              className={`relative z-10 w-8 h-8 flex items-center justify-center shrink-0 transition-colors ${
                activeNav === 'chats'
                  ? 'text-[#002117] dark:text-[#b8f3dd]'
                  : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
              }`}
            >
              <svg viewBox="0 0 28 28" className="w-[30px] h-[30px] overflow-visible" fill="none">
                <path
                  d="M14 4C8.2 4 3.5 8.1 3.5 13.2C3.5 15.8 4.7 18.2 6.7 19.9L5.4 23.8C5.2 24.3 5.7 24.8 6.2 24.6L10.7 22.8C11.7 23.1 12.8 23.2 14 23.2C19.8 23.2 24.5 19.1 24.5 14C24.5 8.9 19.8 4 14 4Z"
                  fill={activeNav === 'chats' ? 'currentColor' : 'none'}
                  fillOpacity={activeNav === 'chats' ? 0.16 : 0}
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  ref={(el) => {
                    chatDotRefs.current[0] = el;
                  }}
                  cx="9.8"
                  cy="13.6"
                  r="1.45"
                  fill="currentColor"
                  style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                />
                <circle
                  ref={(el) => {
                    chatDotRefs.current[1] = el;
                  }}
                  cx="14"
                  cy="13.6"
                  r="1.45"
                  fill="currentColor"
                  style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                />
                <circle
                  ref={(el) => {
                    chatDotRefs.current[2] = el;
                  }}
                  cx="18.2"
                  cy="13.6"
                  r="1.45"
                  fill="currentColor"
                  style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                />
              </svg>
            </div>

            {totalUnread > 0 && (
              <span className="absolute -top-0.5 left-3 z-20 min-w-[18px] h-[18px] px-1 rounded-full bg-[#006c51] text-white text-[10px] font-bold tabular-nums flex items-center justify-center ring-2 ring-white dark:ring-[#141c19]">
                {totalUnread}
              </span>
            )}
          </div>
          <span
            className={`text-xs whitespace-nowrap transition-colors ${
              activeNav === 'chats'
                ? 'font-bold text-[#002117] dark:text-[#b8f3dd]'
                : 'font-medium text-slate-600 dark:text-slate-400'
            }`}
          >
            الدردشات
          </span>
        </button>

        {/* 2. القنوات */}
        <button
          type="button"
          onClick={() => handlePress('channels')}
          className="min-w-0 h-full flex flex-col items-center justify-center gap-1 cursor-pointer select-none group"
        >
          <div className="relative w-[74px] h-9 flex items-center justify-center shrink-0">
            {activeNav === 'channels' && (
              <span
                ref={(el) => {
                  pillRefs.current.channels = el;
                }}
                className="pointer-events-none absolute inset-0 rounded-full bg-[#c5efe0] dark:bg-[#00513d] origin-center shadow-xs"
              />
            )}

            <div
              ref={(el) => {
                iconRefs.current.channels = el;
              }}
              className={`relative z-10 w-8 h-8 flex items-center justify-center shrink-0 transition-colors ${
                activeNav === 'channels'
                  ? 'text-[#002117] dark:text-[#b8f3dd]'
                  : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
              }`}
            >
              <svg viewBox="0 0 28 28" className="w-[30px] h-[30px] overflow-visible" fill="none">
                <path
                  ref={waveLeftOuterRef}
                  d="M6.3 20.7C4.5 18.8 3.5 16.3 3.5 13.5C3.5 10.7 4.5 8.2 6.3 6.3"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                />
                <path
                  ref={waveRightOuterRef}
                  d="M21.7 6.3C23.5 8.2 24.5 10.7 24.5 13.5C24.5 16.3 23.5 18.8 21.7 20.7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                />
                <path
                  ref={waveLeftInnerRef}
                  d="M9.4 17.8C8.3 16.7 7.7 15.2 7.7 13.5C7.7 11.8 8.3 10.3 9.4 9.2"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                />
                <path
                  ref={waveRightInnerRef}
                  d="M18.6 9.2C19.7 10.3 20.3 11.8 20.3 13.5C20.3 15.2 19.7 16.7 18.6 17.8"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                />
                <circle cx="14" cy="13.5" r="2.7" fill="currentColor" />
                <path
                  d="M14 16.5V23.5"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <span
            className={`text-xs whitespace-nowrap transition-colors ${
              activeNav === 'channels'
                ? 'font-bold text-[#002117] dark:text-[#b8f3dd]'
                : 'font-medium text-slate-600 dark:text-slate-400'
            }`}
          >
            القنوات
          </span>
        </button>

        {/* 3. الأحداث */}
        <button
          type="button"
          onClick={() => handlePress('events')}
          className="min-w-0 h-full flex flex-col items-center justify-center gap-1 cursor-pointer select-none group"
        >
          <div className="relative w-[74px] h-9 flex items-center justify-center shrink-0">
            {activeNav === 'events' && (
              <span
                ref={(el) => {
                  pillRefs.current.events = el;
                }}
                className="pointer-events-none absolute inset-0 rounded-full bg-[#c5efe0] dark:bg-[#00513d] origin-center shadow-xs"
              />
            )}

            <div
              ref={(el) => {
                iconRefs.current.events = el;
              }}
              className={`relative z-10 w-8 h-8 flex items-center justify-center shrink-0 transition-colors ${
                activeNav === 'events'
                  ? 'text-[#002117] dark:text-[#b8f3dd]'
                  : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
              }`}
            >
              <svg viewBox="0 0 28 28" className="w-[30px] h-[30px] overflow-visible" fill="none">
                <rect
                  x="4"
                  y="6.2"
                  width="20"
                  height="17.8"
                  rx="5"
                  fill={activeNav === 'events' ? 'currentColor' : 'none'}
                  fillOpacity={activeNav === 'events' ? 0.16 : 0}
                  stroke="currentColor"
                  strokeWidth="2.2"
                />
                <path
                  d="M9.5 4V7.5M18.5 4V7.5M4.5 11.2H23.5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  ref={eventStarRef}
                  d="M14 13.6L15.1 16L17.7 16.3L15.8 18.1L16.3 20.7L14 19.4L11.7 20.7L12.2 18.1L10.3 16.3L12.9 16L14 13.6Z"
                  fill="currentColor"
                  style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                />
              </svg>
            </div>
          </div>
          <span
            className={`text-xs whitespace-nowrap transition-colors ${
              activeNav === 'events'
                ? 'font-bold text-[#002117] dark:text-[#b8f3dd]'
                : 'font-medium text-slate-600 dark:text-slate-400'
            }`}
          >
            الأحداث
          </span>
        </button>

        {/* 4. الإعدادات */}
        <button
          type="button"
          onClick={() => handlePress('settings')}
          className="min-w-0 h-full flex flex-col items-center justify-center gap-1 cursor-pointer select-none group"
        >
          <div className="relative w-[74px] h-9 flex items-center justify-center shrink-0">
            {activeNav === 'settings' && (
              <span
                ref={(el) => {
                  pillRefs.current.settings = el;
                }}
                className="pointer-events-none absolute inset-0 rounded-full bg-[#c5efe0] dark:bg-[#00513d] origin-center shadow-xs"
              />
            )}

            <div
              ref={(el) => {
                iconRefs.current.settings = el;
              }}
              className={`relative z-10 w-8 h-8 flex items-center justify-center shrink-0 transition-colors ${
                activeNav === 'settings'
                  ? 'text-[#002117] dark:text-[#b8f3dd]'
                  : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
              }`}
            >
              <svg viewBox="0 0 28 28" className="w-[30px] h-[30px] overflow-visible" fill="none">
                <g transform="translate(14 14)">
                  <g
                    ref={settingsGearRef}
                    style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                  >
                    <path
                      d="M10.2 -2.2L10.2 2.2L7.1 2.9L6.1 4.7L7.0 7.7L3.2 9.9L1.1 7.6L-1.1 7.6L-3.2 9.9L-7.0 7.7L-6.1 4.7L-7.1 2.9L-10.2 2.2L-10.2 -2.2L-7.1 -2.9L-6.1 -4.7L-7.0 -7.7L-3.2 -9.9L-1.1 -7.6L1.1 -7.6L3.2 -9.9L7.0 -7.7L6.1 -4.7L7.1 -2.9Z"
                      fill={activeNav === 'settings' ? 'currentColor' : 'none'}
                      fillOpacity={activeNav === 'settings' ? 0.16 : 0}
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="0"
                      cy="0"
                      r="3.4"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    />
                  </g>
                </g>
              </svg>
            </div>
          </div>
          <span
            className={`text-xs whitespace-nowrap transition-colors ${
              activeNav === 'settings'
                ? 'font-bold text-[#002117] dark:text-[#b8f3dd]'
                : 'font-medium text-slate-600 dark:text-slate-400'
            }`}
          >
            الإعدادات
          </span>
        </button>
      </div>
    </nav>
  );
}
