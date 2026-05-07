import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AVATAR_COLORS } from '../constants';
import type { FriendEntry } from '../types';
import { PlatformBadge } from './PlatformBadge';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const friendStatusDot: Record<string, string> = {
  online: 'bg-emerald-500',
  in_game: 'bg-blue-400',
  away: 'bg-yellow-400',
  idle: 'bg-yellow-400',
  busy: 'bg-red-500',
  dnd: 'bg-red-500',
  offline: 'bg-white/20',
};
export const friendStatusLabel: Record<string, string> = {
  online: 'Online',
  in_game: 'In Game',
  away: 'Away',
  idle: 'Idle',
  busy: 'Do Not Disturb',
  dnd: 'Do Not Disturb',
  offline: 'Offline',
};

export const FriendRow = memo(({ friend, showStatus = true, lastPlayedAt, platform, compact = false }: { friend: FriendEntry; showStatus?: boolean; lastPlayedAt?: string; platform?: string; compact?: boolean }) => {
  const status = friend.online_status ||'offline';
  const dotClass = friendStatusDot[status] ??'bg-white/20';
  const statusLabel = friendStatusLabel[status] ?? status;
  return (
    <div className={cn("flex items-center group cursor-pointer", compact ? "gap-2.5" : "gap-4")}>
      <div className="relative shrink-0">
        <img src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
          className={cn("object-cover", compact ? "w-7 h-7 rounded-xl" : "w-10 h-10 rounded-2xl")} alt={friend.username}/>
        {showStatus && (
          <div className={cn("absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[#0a0a0a]", dotClass, compact ? "w-2.5 h-2.5" : "w-3.5 h-3.5")}/>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn("font-bold truncate group-hover:text-emerald-500 transition-colors", compact ? "text-xs" : "")}>{friend.username}</p>
          <PlatformBadge platform={platform}/>
        </div>
        {showStatus && (
          <p className={cn("truncate", compact ? "text-[10px] text-white/40" : "text-xs text-white/40")}>
            {friend.current_game
              ? <span className="text-blue-300">{friend.current_game}</span>
              : statusLabel}
          </p>
        )}
        {lastPlayedAt && (
          <p className="text-[10px] text-white/30 font-mono">Last played {lastPlayedAt}</p>
        )}
      </div>
    </div>
  );
});

// Compact avatar bubble used in Friends Online — circle avatar + status dot + name
export const FriendBubble = memo(({ friend }: { friend: FriendEntry }) => {
  const [expanded, setExpanded] = React.useState(false);
  const status = friend.online_status || 'offline';
  const dotClass = friendStatusDot[status] ?? 'bg-white/20';
  const statusLabel = friendStatusLabel[status] ?? 'Offline';
  const statusColor = status === 'online' ? 'text-emerald-400'
    : status === 'in_game' ? 'text-blue-400'
    : (status === 'idle') ? 'text-yellow-400'
    : (status === 'dnd' || status === 'busy') ? 'text-red-400'
    : 'text-white/30';

  return (
    <div className="relative group/bubble">
      {/* Hover name tooltip — only when collapsed */}
      {!expanded && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-[9px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 group-hover/bubble:opacity-100 transition-opacity pointer-events-none z-20">
          {friend.current_game ? `${friend.username} · ${friend.current_game}` : friend.username}
        </div>
      )}
      <motion.div
        layout
        onClick={() => setExpanded(e => !e)}
        className={cn(
          "flex items-center gap-2 cursor-pointer",
          expanded ? "bg-white/5 ring-1 ring-white/10 pr-3 rounded-full" : "rounded-full"
        )}
        style={{ height: 36 }}
        transition={{ layout: { duration: 0.2, ease: 'easeInOut' } }}
      >
        <div className="relative shrink-0">
          <img
            src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10 group-hover/bubble:ring-white/30 transition-all"
            alt={friend.username}
          />
          <div className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-[#0a0a0a]", dotClass)}/>
          {friend.current_game && (
            <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-blue-400 border-[1.5px] border-[#0a0a0a]"/>
          )}
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="flex flex-col overflow-hidden whitespace-nowrap pr-1"
            >
              <span className="text-[11px] font-semibold text-white leading-tight">{friend.username}</span>
              <span className={cn("text-[9px] font-medium leading-tight", statusColor)}>
                {friend.current_game || statusLabel}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
});

// Row of avatar bubbles with overflow chip
export const FriendBubbles = ({ friends, max = 7 }: { friends: FriendEntry[]; max?: number }) => {
  const shown = friends.slice(0, max);
  const overflow = friends.length - max;
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {shown.map(f => <FriendBubble key={f.id} friend={f}/>)}
      {overflow > 0 && (
        <div className="w-9 h-9 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center" title={`+${overflow} more`}>
          <span className="text-[10px] font-bold text-white/40">+{overflow}</span>
        </div>
      )}
    </div>
  );
};

// Reusable member avatar — shows initials on broken/missing image
function avatarColor(username: string) { return AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length]; }

export const MemberAvatar = React.memo(function MemberAvatar({ username, avatar, size = 'md', owns, onClick, className }: {
  username: string; avatar?: string | null; size?: 'xs' | 'sm' | 'md' | 'lg'; owns?: boolean; onClick?: (e: React.MouseEvent) => void; className?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const dim = { xs: 'w-5 h-5 text-[9px]', sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' }[size];
  const border = owns === true ? 'border-2 border-emerald-400' : owns === false ? 'border-2 border-white/20' : 'border-2 border-[#141414]';
  const muted = owns === false ? 'grayscale opacity-50' : '';
  return (
    <div
      onClick={onClick}
      title={username}
      className={cn('rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0', dim, border, muted, onClick && 'cursor-pointer hover:scale-110 active:scale-95 transition-transform', className)}
      style={failed || !avatar ? { backgroundColor: avatarColor(username) } : undefined}
    >
      {!failed && avatar
        ? <img src={avatar} alt={username} className="w-full h-full object-cover" onError={() => setFailed(true)} />
        : <span className="text-white leading-none select-none">{(username[0] || '?').toUpperCase()}</span>
      }
    </div>
  );
});

export default FriendBubble;
