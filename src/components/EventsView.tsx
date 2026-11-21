import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Link2,
  MapPin,
  Play,
  Plus,
  Star,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { apiRequest, formatTime, uploadMediaFile } from '../lib/api';
import type { AppEvent, ExtraLink, RsvpStatus } from '../types';
import { UserAvatar } from './UserAvatar';

interface EventsViewProps {
  token: string;
  searchQuery: string;
  incomingEvent: AppEvent | null;
  incomingRsvp: { eventId: string; goingCount: number; interestedCount: number } | null;
  onImageClick: (url: string, title: string) => void;
  onShowToast: (msg: string) => void;
}

export function EventsView({
  token,
  searchQuery,
  incomingEvent,
  incomingRsvp,
  onImageClick,
  onShowToast,
}: EventsViewProps) {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [showTypeChooser, setShowTypeChooser] = useState(false);
  const [createMode, setCreateMode] = useState<'post' | 'video' | null>(null);

  const [title, setTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [links, setLinks] = useState<ExtraLink[]>([]);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [activeShort, setActiveShort] = useState<AppEvent | null>(null);
  const [shortMuted, setShortMuted] = useState(false);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const res = await apiRequest<{ events: AppEvent[] }>('/api/events', { token });
      setEvents(res.events);
    } catch {
      // Ignore transient error
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!incomingEvent) return;
    setEvents((prev) =>
      prev.some((ev) => ev.id === incomingEvent.id) ? prev : [incomingEvent, ...prev]
    );
  }, [incomingEvent]);

  useEffect(() => {
    if (!incomingRsvp) return;
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === incomingRsvp.eventId
          ? {
              ...ev,
              goingCount: incomingRsvp.goingCount,
              interestedCount: incomingRsvp.interestedCount,
            }
          : ev
      )
    );
    setActiveShort((prev) =>
      prev && prev.id === incomingRsvp.eventId
        ? {
            ...prev,
            goingCount: incomingRsvp.goingCount,
            interestedCount: incomingRsvp.interestedCount,
          }
        : prev
    );
  }, [incomingRsvp]);

  function resetCreateForm() {
    setCreateMode(null);
    setTitle('');
    setEventTime('');
    setLocation('');
    setDescription('');
    setMediaUrls([]);
    setLinks([]);
    setLinkLabel('');
    setLinkUrl('');
    setError('');
  }

  async function handleUploadImage(file: File) {
    setUploadingMedia(true);
    try {
      const res = await uploadMediaFile(file, token);
      if (res.isVideo) {
        onShowToast('يرجى اختيار صورة في وضع المنشور');
        return;
      }
      setMediaUrls((prev) => [...prev.slice(0, 5), res.url]);
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر رفع الصورة');
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleUploadVideo(file: File) {
    setUploadingMedia(true);
    try {
      const res = await uploadMediaFile(file, token);
      if (!res.isVideo) {
        onShowToast('يرجى اختيار ملف فيديو (MP4 أو WebM)');
        return;
      }
      setMediaUrls([res.url]);
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر رفع الفيديو');
    } finally {
      setUploadingMedia(false);
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
      setLinks((prev) => [
        ...prev.slice(0, 5),
        { label: linkLabel.trim() || parsed.hostname, url: parsed.toString() },
      ]);
      setLinkLabel('');
      setLinkUrl('');
    } catch {
      onShowToast('صيغة الرابط غير صالحة');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createMode) return;
    setError('');

    if (createMode === 'video' && mediaUrls.length === 0) {
      setError('يرجى اختيار فيديو شورتس أولاً');
      return;
    }

    setCreating(true);
    try {
      const res = await apiRequest<{ event: AppEvent }>('/api/events', {
        method: 'POST',
        token,
        body: {
          eventType: createMode,
          title: title.trim() || (createMode === 'video' ? 'فيديو شورتس' : ''),
          eventTime: eventTime.trim() || 'الآن',
          location: location.trim(),
          description: description.trim(),
          mediaUrls,
          links: createMode === 'post' ? links : [],
        },
      });
      setEvents((prev) =>
        prev.some((ev) => ev.id === res.event.id) ? prev : [res.event, ...prev]
      );
      resetCreateForm();
      onShowToast(createMode === 'video' ? 'تم نشر فيديو الشورتس للأصدقاء' : 'تم نشر الحدث للأصدقاء');
    } catch (err) {
      setError((err as Error).message || 'تعذر نشر الحدث');
    } finally {
      setCreating(false);
    }
  }

  async function toggleRsvp(ev: AppEvent, nextStatus: RsvpStatus) {
    const finalStatus: RsvpStatus = ev.myRsvp === nextStatus ? 'none' : nextStatus;
    try {
      const res = await apiRequest<{
        myRsvp: RsvpStatus;
        goingCount: number;
        interestedCount: number;
      }>(`/api/events/${encodeURIComponent(ev.id)}/rsvp`, {
        method: 'POST',
        token,
        body: { status: finalStatus },
      });
      setEvents((prev) =>
        prev.map((item) =>
          item.id === ev.id
            ? {
                ...item,
                myRsvp: res.myRsvp,
                goingCount: res.goingCount,
                interestedCount: res.interestedCount,
              }
            : item
        )
      );
      setActiveShort((prev) =>
        prev && prev.id === ev.id
          ? {
              ...prev,
              myRsvp: res.myRsvp,
              goingCount: res.goingCount,
              interestedCount: res.interestedCount,
            }
          : prev
      );
    } catch {
      onShowToast('تعذر تحديث التفاعل');
    }
  }

  const filtered = events.filter((ev) => {
    const q = searchQuery.trim().replace(/^@+/, '').toLowerCase();
    if (!q) return true;
    return (
      ev.title.toLowerCase().includes(q) ||
      ev.description.toLowerCase().includes(q) ||
      ev.creatorName.toLowerCase().includes(q) ||
      ev.creatorUsername.toLowerCase().includes(q) ||
      ev.location.toLowerCase().includes(q)
    );
  });

  const videoShorts = filtered.filter((ev) => ev.eventType === 'video' && ev.mediaUrls.length > 0);
  const postEvents = filtered.filter((ev) => ev.eventType !== 'video');

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col bg-[#f7f9f7] dark:bg-[#0d1311]">
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-3xl bg-white dark:bg-[#141c19] animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-[#141c19] rounded-3xl p-8 text-center space-y-2.5 mt-6 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#c5efe0] dark:bg-[#00513d] text-[#002117] dark:text-[#b8f3dd] flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold">لا توجد أحداث من أصدقائك حالياً</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تظهر هنا منشورات وفيديوهات الشورتس الخاصة بأصدقائك فقط. اضغط على + لمشاركة منشور أو شورتس جديد.
              </p>
            </div>
          ) : (
            <>
              {/* Top 9:16 Shorts Shelf (Always pinned at top whenever videos exist) */}
              {videoShorts.length > 0 && (
                <section className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-[#006c51] dark:text-[#4fd8b0]" />
                      <h2 className="text-sm font-bold">فيديوهات شورتس</h2>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {videoShorts.length} فيديو · 9:16
                    </span>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                    {videoShorts.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setActiveShort(ev)}
                        className="relative w-[156px] sm:w-[176px] aspect-[9/16] rounded-3xl overflow-hidden bg-black shrink-0 snap-start shadow-sm group cursor-pointer text-right"
                      >
                        <video
                          src={ev.mediaUrls[0]}
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

                        <span className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/45 backdrop-blur-xs text-white flex items-center justify-center">
                          <Play className="w-4 h-4 fill-current" />
                        </span>

                        <div className="absolute inset-x-3 bottom-3 space-y-1.5 text-white">
                          <div className="flex items-center gap-1.5">
                            <UserAvatar
                              displayName={ev.creatorName}
                              avatarColor={ev.creatorAvatarColor}
                              avatarUrl={ev.creatorAvatarUrl}
                              sizeClass="w-6 h-6"
                              textClass="text-[9px]"
                            />
                            <span className="text-[11px] font-bold truncate">{ev.creatorName}</span>
                          </div>
                          <p className="text-xs font-semibold line-clamp-2 leading-snug">
                            {ev.title}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Friends' Rich Posts Feed */}
              {postEvents.length > 0 && (
                <section className="space-y-3">
                  {videoShorts.length > 0 && (
                    <h2 className="text-sm font-bold px-1">منشورات الأصدقاء</h2>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {postEvents.map((ev) => (
                      <article
                        key={ev.id}
                        className="bg-white dark:bg-[#141c19] border border-emerald-950/5 dark:border-white/5 rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xs"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              displayName={ev.creatorName}
                              avatarColor={ev.creatorAvatarColor}
                              avatarUrl={ev.creatorAvatarUrl}
                              sizeClass="w-9 h-9"
                              textClass="text-xs"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{ev.creatorName}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                <span className="font-mono-handle">@{ev.creatorUsername}</span>
                                <span aria-hidden="true"> · </span>
                                <span className="tabular-nums">{formatTime(ev.createdAt)}</span>
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-base font-bold">{ev.title}</h3>
                            {ev.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {ev.description}
                              </p>
                            )}
                          </div>

                          {/* Post Attached Images */}
                          {ev.mediaUrls.length > 0 && (
                            <div
                              className={`grid gap-2 ${
                                ev.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                              }`}
                            >
                              {ev.mediaUrls.map((url, idx) => (
                                <button
                                  key={`${url}-${idx}`}
                                  type="button"
                                  onClick={() => onImageClick(url, ev.title)}
                                  className="block rounded-2xl overflow-hidden bg-slate-100 dark:bg-black/30 cursor-pointer"
                                >
                                  <img
                                    src={url}
                                    alt={ev.title}
                                    className="w-full max-h-60 object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Post Attached Links */}
                          {ev.links.length > 0 && (
                            <div className="space-y-1.5">
                              {ev.links.map((lnk, idx) => (
                                <a
                                  key={`${lnk.url}-${idx}`}
                                  href={lnk.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 rounded-2xl bg-[#eff4f0] dark:bg-[#1d2623] hover:bg-[#e1ece4] dark:hover:bg-[#24302c] flex items-center justify-between gap-2 text-xs transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Link2 className="w-3.5 h-3.5 text-[#006c51] dark:text-[#4fd8b0] shrink-0" />
                                    <span className="font-semibold truncate">{lnk.label}</span>
                                  </div>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                </a>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#006c51] dark:text-[#4fd8b0]" />
                              <span>{ev.eventTime}</span>
                            </span>
                            {ev.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#006c51] dark:text-[#4fd8b0]" />
                                <span>{ev.location}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                          <button
                            type="button"
                            onClick={() => void toggleRsvp(ev, 'going')}
                            className={`min-h-[38px] px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                              ev.myRsvp === 'going'
                                ? 'bg-[#006c51] text-white'
                                : 'bg-[#eff4f0] dark:bg-[#1d2623] text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>سأحضر</span>
                            <span className="tabular-nums">({ev.goingCount})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => void toggleRsvp(ev, 'interested')}
                            className={`min-h-[38px] px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                              ev.myRsvp === 'interested'
                                ? 'bg-amber-600 text-white'
                                : 'bg-[#eff4f0] dark:bg-[#1d2623] text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span>مهتم</span>
                            <span className="tabular-nums">({ev.interestedCount})</span>
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {/* Material 3 FAB -> Opens Bottom Sheet Type Chooser */}
      <button
        type="button"
        onClick={() => setShowTypeChooser(true)}
        aria-label="نشر حدث جديد"
        className="absolute bottom-4 left-4 h-14 px-5 rounded-2xl bg-[#006c51] hover:bg-[#005842] text-white shadow-lg flex items-center gap-2 font-semibold text-sm cursor-pointer active:scale-95 transition-transform"
      >
        <Plus className="w-5 h-5" />
        <span>حدث جديد</span>
      </button>

      {/* Bottom Sheet: Choose Event Type (Post vs 9:16 Video Short) */}
      {showTypeChooser && (
        <div
          onClick={() => setShowTypeChooser(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-[#141c19] p-6 shadow-2xl space-y-4"
          >
            <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto sm:hidden" />

            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">اختر نوع الحدث</h3>
              <button
                type="button"
                onClick={() => setShowTypeChooser(false)}
                className="w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowTypeChooser(false);
                  resetCreateForm();
                  setCreateMode('video');
                }}
                className="p-4 rounded-3xl bg-[#eff4f0] dark:bg-[#1b2421] hover:bg-[#d8f5e5] dark:hover:bg-[#1d2b26] flex items-center gap-3.5 text-right cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#006c51] text-white flex items-center justify-center shrink-0">
                  <Film className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold">فيديو شورتس (9:16)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    يظهر دائماً في شريط الفيديوهات العمودية بالأعلى للأصدقاء
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTypeChooser(false);
                  resetCreateForm();
                  setCreateMode('post');
                }}
                className="p-4 rounded-3xl bg-[#eff4f0] dark:bg-[#1b2421] hover:bg-[#d8f5e5] dark:hover:bg-[#1d2b26] flex items-center gap-3.5 text-right cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#c5efe0] dark:bg-[#00513d] text-[#006c51] dark:text-[#4fd8b0] flex items-center justify-center shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold">منشور (صور وروابط)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    أضف تفاصيل الحدث مع إمكانية إرفاق صور وروابط إضافية
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Post / Video Short Modal */}
      {createMode && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-h-[92dvh] sm:max-w-md rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-[#141c19] p-6 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-lg font-bold">
                {createMode === 'video' ? 'نشر فيديو شورتس (9:16)' : 'نشر منشور جديد'}
              </h3>
              <button
                type="button"
                onClick={resetCreateForm}
                className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto space-y-3.5">
              {createMode === 'video' ? (
                <div className="space-y-3">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) void handleUploadVideo(f);
                    }}
                  />

                  {mediaUrls[0] ? (
                    <div className="w-48 mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-black relative shadow-md">
                      <video
                        src={mediaUrls[0]}
                        controls
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setMediaUrls([])}
                        className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingMedia}
                      onClick={() => videoInputRef.current?.click()}
                      className="w-48 mx-auto aspect-[9/16] rounded-3xl border-2 border-dashed border-[#006c51]/40 bg-[#eff4f0] dark:bg-[#1b2421] flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer"
                    >
                      <Upload className="w-7 h-7 text-[#006c51] dark:text-[#4fd8b0]" />
                      <span className="text-xs font-bold">
                        {uploadingMedia ? 'جارٍ رفع الفيديو...' : 'اختر فيديو شورتس 9:16'}
                      </span>
                      <span className="text-[10px] text-slate-500">MP4 / WebM (حتى 50MB)</span>
                    </button>
                  )}

                  <div>
                    <label className="block text-xs font-semibold mb-1">عنوان / تعليق الفيديو</label>
                    <input
                      type="text"
                      maxLength={80}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="لحظات سريعة مع الأصدقاء..."
                      className="w-full min-h-[46px] px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1">عنوان المنشور</label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="جلسة نقاش مسائية"
                      className="w-full min-h-[46px] px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">الموعد</label>
                      <input
                        type="text"
                        maxLength={60}
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        placeholder="غداً 8:00 مساءً"
                        className="w-full min-h-[46px] px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">المكان</label>
                      <input
                        type="text"
                        maxLength={80}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="مقهى المدينة"
                        className="w-full min-h-[46px] px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">التفاصيل</label>
                    <textarea
                      rows={3}
                      maxLength={600}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="اكتب تفاصيل المنشور..."
                      className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm"
                    />
                  </div>

                  {/* Attach Images */}
                  <div className="space-y-2">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) void handleUploadImage(f);
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold">صور مرفقة</label>
                      <button
                        type="button"
                        disabled={uploadingMedia || mediaUrls.length >= 6}
                        onClick={() => imageInputRef.current?.click()}
                        className="min-h-[34px] px-3 rounded-full bg-[#eff4f0] dark:bg-[#1d2623] text-[#006c51] dark:text-[#4fd8b0] text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{uploadingMedia ? 'جارٍ الرفع...' : 'إرفاق صورة'}</span>
                      </button>
                    </div>
                    {mediaUrls.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {mediaUrls.map((url, idx) => (
                          <div
                            key={`${url}-${idx}`}
                            className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() =>
                                setMediaUrls((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/65 text-white flex items-center justify-center cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Attach Links */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold">روابط مرفقة</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={50}
                        value={linkLabel}
                        onChange={(e) => setLinkLabel(e.target.value)}
                        placeholder="العنوان"
                        className="w-1/3 min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-xs"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 min-w-0 min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-xs text-left"
                      />
                      <button
                        type="button"
                        onClick={addLink}
                        className="min-h-[40px] px-3 rounded-xl bg-[#eff4f0] dark:bg-[#1d2623] text-[#006c51] dark:text-[#4fd8b0] text-xs font-bold cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {links.map((lnk, idx) => (
                      <div
                        key={`${lnk.url}-${idx}`}
                        className="px-3 py-1.5 rounded-xl bg-[#f7f9f7] dark:bg-[#1b2421] flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="truncate font-semibold">{lnk.label}</span>
                        <button
                          type="button"
                          onClick={() => setLinks((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={creating || uploadingMedia}
                className="w-full min-h-[48px] rounded-full bg-[#006c51] hover:bg-[#005842] text-white text-sm font-semibold cursor-pointer"
              >
                {creating ? 'جارٍ النشر...' : 'نشر للأصدقاء'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 9:16 Vertical Shorts Player Modal */}
      {activeShort && (
        <div
          onClick={() => setActiveShort(null)}
          className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-3 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative h-[88dvh] max-h-[820px] aspect-[9/16] max-w-full rounded-[28px] overflow-hidden bg-black shadow-2xl"
          >
            <video
              src={activeShort.mediaUrls[0]}
              autoPlay
              loop
              muted={shortMuted}
              controls
              playsInline
              className="w-full h-full object-cover"
            />

            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
              <button
                type="button"
                onClick={() => setShortMuted((m) => !m)}
                aria-label={shortMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
                className="pointer-events-auto w-10 h-10 rounded-full bg-black/50 backdrop-blur-xs text-white flex items-center justify-center cursor-pointer"
              >
                {shortMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveShort(null)}
                aria-label="إغلاق الفيديو"
                className="pointer-events-auto w-10 h-10 rounded-full bg-black/50 backdrop-blur-xs text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="absolute bottom-14 inset-x-3 p-3 rounded-2xl bg-black/55 backdrop-blur-xs text-white space-y-2 pointer-events-auto">
              <div className="flex items-center gap-2">
                <UserAvatar
                  displayName={activeShort.creatorName}
                  avatarColor={activeShort.creatorAvatarColor}
                  avatarUrl={activeShort.creatorAvatarUrl}
                  sizeClass="w-8 h-8"
                  textClass="text-xs"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{activeShort.creatorName}</p>
                  <p className="text-[11px] opacity-80 truncate">@{activeShort.creatorUsername}</p>
                </div>
              </div>
              <p className="text-xs font-semibold">{activeShort.title}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void toggleRsvp(activeShort, 'going')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    activeShort.myRsvp === 'going' ? 'bg-[#006c51] text-white' : 'bg-white/20'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>أعجبني ({activeShort.goingCount})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
