import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, AtSign, Camera, Plus, Radio, Send, Share2, X } from 'lucide-react';
import { apiRequest, formatTime, uploadMediaFile } from '../lib/api';
import type { ChannelPost, ChannelSummary } from '../types';

interface ChannelsViewProps {
  token: string;
  searchQuery: string;
  searchScope: 'friends' | 'global';
  incomingPost: ChannelPost | null;
  incomingChannel: ChannelSummary | null;
  incomingChannelUpdated: ChannelSummary | null;
  onShareChannel: (ch: ChannelSummary) => void;
  onShowToast: (msg: string) => void;
  onChannelOpenChange?: (isOpen: boolean) => void;
}

export function ChannelsView({
  token,
  searchQuery,
  searchScope,
  incomingPost,
  incomingChannel,
  incomingChannelUpdated,
  onShareChannel,
  onShowToast,
  onChannelOpenChange,
}: ChannelsViewProps) {
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postText, setPostText] = useState('');
  const [sendingPost, setSendingPost] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const createAvatarRef = useRef<HTMLInputElement | null>(null);
  const editAvatarRef = useRef<HTMLInputElement | null>(null);
  const postInputRef = useRef<HTMLTextAreaElement | null>(null);

  const loadChannels = useCallback(async () => {
    try {
      const res = await apiRequest<{ channels: ChannelSummary[] }>('/api/channels', { token });
      setChannels(res.channels);
    } catch {
      // Ignore transient error
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    onChannelOpenChange?.(Boolean(selectedChannelId));
  }, [selectedChannelId, onChannelOpenChange]);

  useEffect(() => {
    return () => {
      onChannelOpenChange?.(false);
    };
  }, [onChannelOpenChange]);

  useEffect(() => {
    const el = postInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [postText, selectedChannelId]);

  useEffect(() => {
    if (!incomingChannel) return;
    setChannels((prev) =>
      prev.some((c) => c.id === incomingChannel.id) ? prev : [incomingChannel, ...prev]
    );
  }, [incomingChannel]);

  useEffect(() => {
    if (!incomingChannelUpdated) return;
    setChannels((prev) =>
      prev.map((c) =>
        c.id === incomingChannelUpdated.id
          ? { ...c, ...incomingChannelUpdated, isMember: c.isMember, isOwner: c.isOwner }
          : c
      )
    );
  }, [incomingChannelUpdated]);

  useEffect(() => {
    if (!incomingPost) return;
    setChannels((prev) =>
      prev.map((c) =>
        c.id === incomingPost.channelId
          ? { ...c, lastPostContent: incomingPost.content, lastPostAt: incomingPost.createdAt }
          : c
      )
    );
    if (selectedChannelId === incomingPost.channelId) {
      setPosts((prev) =>
        prev.some((p) => p.id === incomingPost.id) ? prev : [...prev, incomingPost]
      );
    }
  }, [incomingPost, selectedChannelId]);

  async function openChannel(channelId: string) {
    setSelectedChannelId(channelId);
    setLoadingPosts(true);
    try {
      const res = await apiRequest<{ posts: ChannelPost[] }>(
        `/api/channels/${encodeURIComponent(channelId)}/posts`,
        { token }
      );
      setPosts(res.posts);
    } catch {
      onShowToast('تعذر تحميل منشورات القناة');
    } finally {
      setLoadingPosts(false);
    }
  }

  async function toggleMembership(ch: ChannelSummary) {
    try {
      const res = await apiRequest<{ isMember: boolean; memberCount: number }>(
        `/api/channels/${encodeURIComponent(ch.id)}/join`,
        {
          method: ch.isMember ? 'DELETE' : 'POST',
          token,
        }
      );
      setChannels((prev) =>
        prev.map((c) =>
          c.id === ch.id ? { ...c, isMember: res.isMember, memberCount: res.memberCount } : c
        )
      );
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر تحديث الاشتراك');
    }
  }

  async function handleUploadNewChannelAvatar(file: File) {
    setUploadingAvatar(true);
    try {
      const res = await uploadMediaFile(file, token);
      if (res.isVideo) {
        onShowToast('يرجى اختيار صورة للقناة');
        return;
      }
      setNewAvatarUrl(res.url);
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر رفع صورة القناة');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleUpdateChannelAvatar(channel: ChannelSummary, file: File) {
    setUploadingAvatar(true);
    try {
      const media = await uploadMediaFile(file, token);
      if (media.isVideo) {
        onShowToast('يرجى اختيار صورة للقناة');
        return;
      }
      const res = await apiRequest<{ channel: ChannelSummary }>(
        `/api/channels/${encodeURIComponent(channel.id)}`,
        {
          method: 'PATCH',
          token,
          body: { avatarUrl: media.url },
        }
      );
      setChannels((prev) => prev.map((c) => (c.id === res.channel.id ? res.channel : c)));
      onShowToast('تم تحديث صورة القناة');
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر تحديث صورة القناة');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleCreateChannel(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const res = await apiRequest<{ channel: ChannelSummary }>('/api/channels', {
        method: 'POST',
        token,
        body: {
          name: newName.trim(),
          handle: newHandle.trim(),
          description: newDesc.trim(),
          avatarUrl: newAvatarUrl,
        },
      });
      setChannels((prev) =>
        prev.some((c) => c.id === res.channel.id) ? prev : [res.channel, ...prev]
      );
      setShowCreateModal(false);
      setNewName('');
      setNewHandle('');
      setNewDesc('');
      setNewAvatarUrl('');
      await openChannel(res.channel.id);
    } catch (err) {
      setCreateError((err as Error).message || 'تعذر إنشاء القناة');
    } finally {
      setCreating(false);
    }
  }

  async function handleSendPost(e?: React.FormEvent) {
    e?.preventDefault();
    if (!selectedChannelId || !postText.trim() || sendingPost) return;
    setSendingPost(true);
    try {
      const res = await apiRequest<{ post: ChannelPost }>(
        `/api/channels/${encodeURIComponent(selectedChannelId)}/posts`,
        {
          method: 'POST',
          token,
          body: { content: postText.trim() },
        }
      );
      setPosts((prev) =>
        prev.some((p) => p.id === res.post.id) ? prev : [...prev, res.post]
      );
      setPostText('');
    } catch (err) {
      onShowToast((err as Error).message || 'تعذر نشر الرسالة');
    } finally {
      setSendingPost(false);
    }
  }

  const filteredChannels = channels.filter((ch) => {
    if (searchScope === 'friends' && !ch.isMember && searchQuery.trim() === '') {
      return true;
    }
    const q = searchQuery.trim().replace(/^@+/, '').toLowerCase();
    if (!q) return true;
    return ch.name.toLowerCase().includes(q) || ch.handle.toLowerCase().includes(q);
  });

  const activeChannel = channels.find((c) => c.id === selectedChannelId) ?? null;

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden relative">
      {/* Channels List */}
      <div
        className={`w-full h-full flex flex-col bg-white dark:bg-[#141c19] shrink-0 relative ${
          selectedChannelId ? 'hidden' : 'flex'
        }`}
      >
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 pb-20">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-[#eff4f0] dark:bg-[#1b2421] animate-pulse"
                />
              ))}
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="p-8 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-[#c5efe0] dark:bg-[#00513d] text-[#002117] dark:text-[#b8f3dd] flex items-center justify-center mx-auto">
                <Radio className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold">لا توجد قنوات حالياً</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اضغط على زر + بالأسفل لإنشاء أول قناة بث.
              </p>
            </div>
          ) : (
            filteredChannels.map((ch) => (
              <div
                key={ch.id}
                onClick={() => void openChannel(ch.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') void openChannel(ch.id);
                }}
                className={`px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  selectedChannelId === ch.id
                    ? 'bg-[#e6f4ee] dark:bg-[#1d2b26]'
                    : 'hover:bg-[#f7f9f7] dark:hover:bg-[#192320]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {ch.avatarUrl ? (
                    <img
                      src={ch.avatarUrl}
                      alt={ch.name}
                      className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-[#c5efe0] dark:bg-[#00513d] text-[#002117] dark:text-[#b8f3dd] flex items-center justify-center shrink-0">
                      <Radio className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{ch.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      <span className="font-mono-handle text-[#006c51] dark:text-[#4fd8b0]">
                        @{ch.handle}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span className="tabular-nums">{ch.memberCount} متابع</span>
                    </p>
                  </div>
                </div>

                {!ch.isOwner && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void toggleMembership(ch);
                    }}
                    className={`min-h-[34px] px-3.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                      ch.isMember
                        ? 'bg-[#eff4f0] dark:bg-[#1d2623] text-slate-700 dark:text-slate-200'
                        : 'bg-[#006c51] text-white'
                    }`}
                  >
                    {ch.isMember ? 'متابَع' : 'متابعة'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Material 3 FAB */}
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          aria-label="إنشاء قناة جديدة"
          className="absolute bottom-4 left-4 h-14 px-5 rounded-2xl bg-[#006c51] hover:bg-[#005842] text-white shadow-lg flex items-center gap-2 font-semibold text-sm cursor-pointer active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
          <span>قناة جديدة</span>
        </button>
      </div>

      {/* Active Channel Feed (Fullscreen above search & nav bars) */}
      {activeChannel && (
        <div className="fixed inset-0 z-40 bg-[#f7f9f7] dark:bg-[#0d1311] flex flex-col min-w-0 overflow-hidden">
          <input
            ref={editAvatarRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f && activeChannel) void handleUpdateChannelAvatar(activeChannel, f);
            }}
          />

          <header className="h-14 px-4 bg-white dark:bg-[#141c19] border-b border-emerald-950/10 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedChannelId(null)}
                aria-label="العودة للقنوات"
                className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

                <button
                  type="button"
                  onClick={() => {
                    if (activeChannel.isOwner) editAvatarRef.current?.click();
                  }}
                  title={activeChannel.isOwner ? 'تغيير صورة القناة' : undefined}
                  className={`relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${
                    activeChannel.avatarUrl ? '' : 'bg-[#006c51] text-white'
                  } ${activeChannel.isOwner ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {activeChannel.avatarUrl ? (
                    <img
                      src={activeChannel.avatarUrl}
                      alt={activeChannel.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Radio className="w-4 h-4" />
                  )}
                </button>

                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate">{activeChannel.name}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <span className="font-mono-handle">@{activeChannel.handle}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-nums">{activeChannel.memberCount} متابع</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onShareChannel(activeChannel)}
                  aria-label="مشاركة القناة"
                  className="min-h-[36px] px-3 rounded-full bg-[#eff4f0] dark:bg-[#1d2623] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#006c51] dark:text-[#4fd8b0]" />
                  <span>مشاركة</span>
                </button>

                {!activeChannel.isOwner && (
                  <button
                    type="button"
                    onClick={() => void toggleMembership(activeChannel)}
                    className={`min-h-[36px] px-4 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      activeChannel.isMember
                        ? 'bg-[#eff4f0] dark:bg-[#1d2623] text-slate-700 dark:text-slate-200'
                        : 'bg-[#006c51] text-white'
                    }`}
                  >
                    {activeChannel.isMember ? 'إلغاء المتابعة' : 'متابعة'}
                  </button>
                )}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto chat-canvas-bg p-4 sm:p-6 space-y-3">
              {activeChannel.description && (
                <div className="max-w-xl mx-auto p-3 rounded-2xl bg-white/95 dark:bg-[#1b2421] text-xs text-slate-600 dark:text-slate-300 text-center shadow-xs">
                  {activeChannel.description}
                </div>
              )}

              {loadingPosts ? (
                <p className="text-center text-sm text-slate-500">جارٍ التحميل...</p>
              ) : posts.length === 0 ? (
                <div className="max-w-xs mx-auto mt-10 p-5 rounded-3xl bg-white/95 dark:bg-[#1b2421] text-center space-y-1 shadow-xs">
                  <p className="text-sm font-semibold">لا توجد منشورات بعد</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeChannel.isOwner
                      ? 'اكتب أول منشور لقناتك من الأسفل.'
                      : 'ستظهر التحديثات هنا فور نشرها.'}
                  </p>
                </div>
              ) : (
                posts.map((p) => (
                  <div
                    key={p.id}
                    className="max-w-xl mx-auto p-4 rounded-[20px] bg-white dark:bg-[#1d2623] shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-[#006c51] dark:text-[#4fd8b0]">
                        {p.authorName}
                      </span>
                      <span className="tabular-nums">{formatTime(p.createdAt)}</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.content}</p>
                  </div>
                ))
              )}
            </div>

            {activeChannel.isOwner && (
              <footer className="bg-[#f7f9f7] dark:bg-[#141c19] border-t border-emerald-950/10 dark:border-white/10 px-2.5 py-1.5 shrink-0">
                <form onSubmit={handleSendPost} className="flex items-end gap-2 max-w-2xl mx-auto">
                  <textarea
                    ref={postInputRef}
                    rows={1}
                    enterKeyHint="enter"
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        void handleSendPost();
                      }
                    }}
                    placeholder="اكتب منشوراً للقناة..."
                    className="flex-1 min-h-[38px] max-h-32 overflow-y-auto resize-none leading-5 px-4 py-2 rounded-[22px] bg-white dark:bg-[#1d2623] border border-emerald-950/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#006c51]/30"
                  />
                  <button
                    type="submit"
                    disabled={sendingPost || !postText.trim()}
                    aria-label="نشر"
                    className="w-10 h-10 rounded-full bg-[#006c51] hover:bg-[#005842] disabled:opacity-50 text-white flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </footer>
            )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#141c19] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">إنشاء قناة</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-3.5">
              {/* Channel Avatar Upload */}
              <div className="flex items-center gap-3.5">
                <input
                  ref={createAvatarRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) void handleUploadNewChannelAvatar(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => createAvatarRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="relative w-16 h-16 rounded-2xl bg-[#eff4f0] dark:bg-[#1d2623] border border-emerald-950/10 dark:border-white/10 flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
                >
                  {newAvatarUrl ? (
                    <img
                      src={newAvatarUrl}
                      alt="صورة القناة"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Radio className="w-6 h-6 text-[#006c51] dark:text-[#4fd8b0]" />
                  )}
                  <span className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-[#006c51] text-white flex items-center justify-center shadow-xs">
                    <Camera className="w-3 h-3" />
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold">صورة القناة (اختياري)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {uploadingAvatar ? 'جارٍ الرفع...' : 'اضغط لإضافة صورة مخصصة لقناتك'}
                  </p>
                  {newAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setNewAvatarUrl('')}
                      className="text-[11px] text-rose-600 font-semibold mt-0.5 cursor-pointer"
                    >
                      إزالة الصورة
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">اسم القناة</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={50}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="أخبار التقنية"
                  className="w-full min-h-[46px] px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">معرّف القناة</label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    dir="ltr"
                    required
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    placeholder="tech_news"
                    className="font-mono-handle text-left w-full min-h-[46px] pl-10 pr-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">الوصف (اختياري)</label>
                <input
                  type="text"
                  maxLength={200}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="نبذة مختصرة عن القناة"
                  className="w-full min-h-[46px] px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#f7f9f7] dark:bg-[#1b2421] text-sm"
                />
              </div>

              {createError && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{createError}</p>
              )}

              <button
                type="submit"
                disabled={creating || uploadingAvatar}
                className="w-full min-h-[48px] rounded-full bg-[#006c51] hover:bg-[#005842] text-white text-sm font-semibold cursor-pointer"
              >
                {creating ? 'جارٍ الإنشاء...' : 'إنشاء القناة'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
