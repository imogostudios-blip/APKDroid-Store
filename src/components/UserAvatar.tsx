import { useEffect, useState } from 'react';
import { getInitials } from '../lib/api';

interface UserAvatarProps {
  displayName: string;
  avatarColor: string;
  avatarUrl?: string | null;
  sizeClass?: string;
  textClass?: string;
  online?: boolean;
  ringClass?: string;
}

export function UserAvatar({
  displayName,
  avatarColor,
  avatarUrl,
  sizeClass = 'w-12 h-12',
  textClass = 'text-sm',
  online = false,
  ringClass = 'ring-white dark:ring-[#141c19]',
}: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  const showImg = Boolean(avatarUrl) && !imgFailed;

  return (
    <div className={`relative shrink-0 ${sizeClass}`}>
      {showImg ? (
        <img
          src={avatarUrl!}
          alt={displayName}
          onError={() => setImgFailed(true)}
          className="w-full h-full rounded-full object-cover bg-slate-200 dark:bg-slate-800"
        />
      ) : (
        <div
          className={`w-full h-full rounded-full flex items-center justify-center font-bold text-white select-none ${textClass}`}
          style={{ backgroundColor: avatarColor }}
        >
          {getInitials(displayName)}
        </div>
      )}

      {online && (
        <span
          title="متصل الآن"
          className={`absolute bottom-0 left-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ${ringClass}`}
        />
      )}
    </div>
  );
}
