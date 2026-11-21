export type ChatWallpaperId = 'doodle-teal' | 'doodle-neon' | 'doodle-rainbow';

export interface ChatWallpaperOption {
  id: ChatWallpaperId;
  label: string;
  subtitle: string;
  src: string;
  fallbackBg: string;
}

export const DEFAULT_CHAT_WALLPAPER: ChatWallpaperId = 'doodle-teal';

export const CHAT_WALLPAPERS: ChatWallpaperOption[] = [
  {
    id: 'doodle-teal',
    label: 'الزمردية الكلاسيكية',
    subtitle: 'الافتراضية',
    src: '/assets/aistudio/5c7cd6da2db5a7dc8bf727b6cdfd5626_71a63546.jpg',
    fallbackBg: '#0b2d36',
  },
  {
    id: 'doodle-neon',
    label: 'نيون وردي وأزرق',
    subtitle: 'داكنة عصرية',
    src: '/assets/aistudio/453d01f9abbae30d7aa6539259d7d214_5f91cdc8.jpg',
    fallbackBg: '#07090d',
  },
  {
    id: 'doodle-rainbow',
    label: 'طيف الألوان',
    subtitle: 'نيون متدرج',
    src: '/assets/aistudio/94a1f20408c23ff513c0b7e06364eb42_078f6cc9.jpg',
    fallbackBg: '#05060a',
  },
];

export function getChatWallpaper(id?: string | null): ChatWallpaperOption {
  return CHAT_WALLPAPERS.find((w) => w.id === id) ?? CHAT_WALLPAPERS[0];
}
