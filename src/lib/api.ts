export async function apiRequest<T>(
  url: string,
  options: {
    method?: string;
    token?: string | null;
    body?: unknown;
    formData?: FormData;
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.formData
      ? options.formData
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    const err = new Error(data.error || 'حدث خطأ غير متوقع') as Error & {
      status?: number;
      data?: unknown;
    };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function uploadMediaFile(
  file: File,
  token: string
): Promise<{ url: string; mimeType: string; isVideo: boolean; sizeBytes: number }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<{ url: string; mimeType: string; isVideo: boolean; sizeBytes: number }>(
    '/api/media/upload',
    {
      method: 'POST',
      token,
      formData,
    }
  );
}

const blobUrlCache = new Map<string, string>();

export async function fetchAuthorizedBlobUrl(fileId: string, token: string): Promise<string> {
  const cacheKey = `${fileId}:${token.slice(-12)}`;
  const cached = blobUrlCache.get(cacheKey);
  if (cached) return cached;

  const res = await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('تعذر تحميل الملف');
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  blobUrlCache.set(cacheKey, objectUrl);
  return objectUrl;
}

export async function downloadAuthorizedFile(
  fileId: string,
  fileName: string,
  token: string
): Promise<void> {
  const res = await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('تعذر تنزيل الملف');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function formatTime(ts: number): string {
  return new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ts));
}

export function formatLastSeen(ts: number): string {
  const diffMs = Date.now() - ts;
  if (diffMs < 60_000) return 'منذ لحظات';
  if (diffMs < 3_600_000) {
    const mins = Math.floor(diffMs / 60_000);
    return `منذ ${mins} دقيقة`;
  }
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return `اليوم ${formatTime(ts)}`;
  }
  return new Intl.DateTimeFormat('ar-EG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}${parts[1][0]}`;
}
