import React from 'react';
import { motion } from 'motion/react';
import { Clock, Users, Sparkles, Play, Library, Gamepad2, Activity, Trophy, TrendingUp } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CachedImg } from '../components/CachedImg';
import { HorizontalScrollRow } from '../components/HorizontalScrollRow';
import { FriendBubbles } from '../components/FriendBubble';
import InProgressModal from '../components/InProgressModal';
import PlaytimeStatsModal from '../components/PlaytimeStatsModal';
import { parseAchievements, isProgressGame, hltbProgress, getSteamId, jumpBackInTag, scoreJumpBackIn } from '../utils/gameUtils';
import type { Game, User, LauncherGame, HomeData, DiscoverGame } from '../types';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// SteamIcon inline (needed for Friends Online section)
const SteamIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 65 65" fill="currentColor" className={className}>
    <path d="M30.31 23.985l.003.158-7.83 11.375c-1.268-.058-2.54.165-3.748.662a8.14 8.14 0 0 0-1.498.8L.042 29.893s-.398 6.546 1.26 11.424l12.156 5.016c.6 2.728 2.48 5.12 5.242 6.27a8.88 8.88 0 0 0 11.603-4.782 8.89 8.89 0 0 0 .684-3.656L42.18 36.16l.275.005c6.705 0 12.155-5.466 12.155-12.18s-5.44-12.16-12.155-12.174c-6.702 0-12.155 5.46-12.155 12.174zm-1.88 23.05c-1.454 3.5-5.466 5.147-8.953 3.694a6.84 6.84 0 0 1-3.524-3.362l3.957 1.64a5.04 5.04 0 0 0 6.591-2.719 5.05 5.05 0 0 0-2.715-6.601l-4.1-1.695c1.578-.6 3.372-.62 5.05.077 1.7.703 3 2.027 3.696 3.72s.692 3.56-.01 5.246M42.466 32.1a8.12 8.12 0 0 1-8.098-8.113 8.12 8.12 0 0 1 8.098-8.111 8.12 8.12 0 0 1 8.1 8.111 8.12 8.12 0 0 1-8.1 8.113m-6.068-8.126a6.09 6.09 0 0 1 6.08-6.095c3.355 0 6.084 2.73 6.084 6.095a6.09 6.09 0 0 1-6.084 6.093 6.09 6.09 0 0 1-6.081-6.093z"/>
  </svg>
);

const XboxIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 372.36823 372.57281" fill="currentColor" className={className}>
    <g transform="translate(-1.5706619,12.357467)">
      <path d="M 169.18811,359.44924 C 140.50497,356.70211 111.4651,346.40125 86.518706,330.1252 65.614374,316.48637 60.893704,310.87967 60.893704,299.69061 c 0,-22.47524 24.711915,-61.84014 66.992496,-106.71584 24.01246,-25.48631 57.46022,-55.36001 61.0775,-54.55105 7.0309,1.57238 63.25048,56.41053 84.29655,82.2252 33.28077,40.82148 48.58095,74.24535 40.808,89.14682 -5.9087,11.32753 -42.57224,33.4669 -69.50775,41.97242 -22.19984,7.01011 -51.35538,9.9813 -75.37239,7.68108 z M 32.660004,276.3228 C 15.288964,249.67326 6.5125436,223.43712 2.2752336,185.49086 c -1.39917002,-12.53 -0.89778,-19.69701 3.17715,-45.41515 5.0788204,-32.05404 23.3330104,-69.136381 45.2671304,-91.957616 9.34191,-9.719732 10.17624,-9.956543 21.56341,-6.120482 13.828357,4.658436 28.595936,14.857457 51.498366,35.56661 l 13.36254,12.082873 -7.2969,8.96431 C 95.97448,140.22403 60.217254,199.2085 46.741444,235.70071 c -7.32599,19.83862 -10.28084,39.75281 -7.12868,48.04363 2.12818,5.59752 0.17339,3.51093 -6.95276,-7.42154 z m 304.915426,4.53255 c 1.71605,-8.37719 -0.4544,-23.76257 -5.5413,-39.28002 -11.01667,-33.60598 -47.83964,-96.12421 -81.65282,-138.63054 L 239.73699,89.563875 251.25285,78.989784 c 15.03631,-13.806637 25.47602,-22.073835 36.74025,-29.094513 8.88881,-5.540156 21.59109,-10.444558 27.05113,-10.444558 3.36626,0 15.21723,12.298726 24.78421,25.720611 14.81725,20.787711 25.71782,45.986976 31.24045,72.219686 3.56833,16.9498 3.8657,53.23126 0.57486,70.13935 -2.70068,13.87582 -8.40314,31.87484 -13.9661,44.08195 -4.16823,9.14657 -14.53521,26.91044 -19.0783,32.69074 -2.33569,2.97175 -2.33761,2.96527 -1.02393,-3.4477 z M 172.25917,33.104812 c -15.60147,-7.922671 -39.6696,-16.427164 -52.96493,-18.715209 -4.66097,-0.802124 -12.61193,-1.249474 -17.6688,-0.994114 -10.969613,0.55394 -10.479662,-0.0197 7.11783,-8.3336652 14.63023,-6.912081 26.83386,-10.976696 43.40044,-14.455218 18.6362,-3.9130858 53.66559,-3.9590088 72.00507,-0.0944 19.80818,4.174105 43.13297,12.854085 56.27623,20.9423862 l 3.90633,2.403927 -8.96247,-0.452584 c -17.81002,-0.899366 -43.76575,6.295879 -71.63269,19.857459 -8.40538,4.090523 -15.71788,7.357511 -16.25,7.25997 -0.53211,-0.09754 -7.38426,-3.43589 -15.22701,-7.418555 z"/>
    </g>
  </svg>
);

const EpicIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 647.167 750.977" className={className}>
    <defs>
      <mask id="home-epic-mask">
        <g transform="matrix(1.3333333,0,0,-1.3333333,-278.05173,902.58312)">
          <g transform="translate(649.8358,676.9377)">
            <path fill="white" fillRule="evenodd" d="m 0,0 -397.219,0 c -32.196,0 -44.078,-11.882 -44.078,-44.093 l 0,-388.676 c 0,-3.645 0.147,-7.031 0.469,-10.168 0.733,-7.031 0.871,-13.844 7.41,-21.601 0.639,-0.76 7.315,-5.728 7.315,-5.728 3.591,-1.761 6.043,-3.058 10.093,-4.688 l 195.596,-81.948 c 10.154,-4.655 14.4,-6.469 21.775,-6.323 l 0,-0.001 c 0.019,0 0.039,0 0.058,0 l 0,0.001 c 7.375,-0.146 11.621,1.668 21.776,6.323 l 195.595,81.948 c 4.051,1.63 6.502,2.927 10.094,4.688 0,0 6.676,4.968 7.314,5.728 6.539,7.757 6.677,14.57 7.41,21.601 0.322,3.137 0.47,6.523 0.47,10.168 l 0,388.676 C 44.078,-11.882 32.195,0 0,0" />
          </g>
        </g>
      </mask>
    </defs>
    <rect width="647.167" height="750.977" fill="currentColor" mask="url(#home-epic-mask)" />
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.862-1.297 1.201-1.99a.076.076 0 0 0-.041-.105 13.1 13.1 0 0 1-1.872-.89.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.291a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.89.076.076 0 0 0-.041.106c.34.693.74 1.362 1.201 1.991a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
  </svg>
);

const SuggestionThumb: React.FC<{ steamAppID?: string; title: string; fallbackThumb?: string; size?: string }> = React.memo(({ steamAppID, title, fallbackThumb, size = 'w-10 h-10' }) => {
  const [iconUrl, setIconUrl] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const endpoint = steamAppID
      ? `/api/steamgriddb/icon/steam/${steamAppID}`
      : `/api/steamgriddb/icon/name/${encodeURIComponent(title)}`;
    fetch(endpoint)
      .then(r => r.ok ? r.json() : { url: null })
      .then(d => { if (!cancelled) { setIconUrl(d.url || null); setDone(true); } })
      .catch(() => { if (!cancelled) setDone(true); });
    return () => { cancelled = true; };
  }, [steamAppID, title]);

  const src = iconUrl || (done ? fallbackThumb : null);
  if (!src) return <div className={`${size} rounded bg-white/5 shrink-0 animate-pulse`}/>;
  return (
    <img src={src} alt="" referrerPolicy="no-referrer"
      className={`${size} object-contain rounded bg-white/10 shrink-0`}
      onError={e => { if (fallbackThumb && (e.target as HTMLImageElement).src !== fallbackThumb) (e.target as HTMLImageElement).src = fallbackThumb; }}
    />
  );
});

function getSteamHorizontalArtwork(game: Game | LauncherGame, refreshKey?: number) {
  if (!game) return '';
  if (game.horizontal_grid && !refreshKey) return game.horizontal_grid;
  let steamId: string | null = null;
  if ('platform' in game && game.platform === 'steam') {
    steamId = game.external_id;
  } else if ('steam_url' in game && game.steam_url) {
    const match = game.steam_url.match(/\/app\/(\d+)/);
    if (match) steamId = match[1];
  }
  const cacheBust = refreshKey ? `?t=${refreshKey}` : '';
  if (steamId) {
    return `/api/steamgriddb/horizontal/${steamId}${cacheBust}`;
  }
  const safeTitle = encodeURIComponent(game.title);
  return `/api/steamgriddb/horizontal-by-name/${safeTitle}${cacheBust}`;
}

function getBannerUrl(game: Game | LauncherGame) {
  if (!game) return '';
  if ((game as any)._external) {
    const g = game as any;
    if (g.banner && !g.banner.includes('placeholder')) return g.banner;
    return `/api/steamgriddb/hero-by-name/${encodeURIComponent(game.title)}`;
  }
  if (game.banner && !game.banner.includes('placeholder')) return game.banner;
  let steamId: string | null = null;
  if ('steam_url' in game && game.steam_url) {
    const match = game.steam_url.match(/\/app\/(\d+)/);
    if (match) steamId = match[1];
  } else if ('platform' in game && game.platform === 'steam') {
    steamId = game.external_id;
  }
  if (steamId) {
    return `/api/steamgriddb/hero/${steamId}`;
  }
  return `/api/steamgriddb/hero-by-name/${encodeURIComponent(game.title)}`;
}

import { buildTagline, getCountdown } from '../utils/gameUtils';

export function buildBacklogTagline(
  tags: { tag: string; count: number }[],
  backlogCount = 0,
  oldestTitle?: string | null,
  spotlightTitle?: string | null,
  oldestTags?: string | null
): string {
  const dayIndex = Math.floor(Date.now() / 86400000);
  const topTagNames = tags.slice(0, 5).map(t => t.tag.toLowerCase());
  const has = (t: string) => topTagNames.some(n => n.includes(t));
  const oldestTagNames = (oldestTags || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const oldestHas = (t: string) => oldestTagNames.some(n => n.includes(t));
  const clip = (s: string, n = 28) => s.length > n ? s.slice(0, n - 1) + '…' : s;
  const oldest = oldestTitle ? clip(oldestTitle) : null;
  const pool: string[] = [];
  if (oldest) {
    if (oldestHas('rpg')) pool.push(`${oldest} has been waiting. It's an RPG. It has time.`);
    else pool.push(`${oldest} has been waiting the longest. Still there. Still judging.`);
  }
  if (has('rpg') && backlogCount > 5) pool.push(`${backlogCount} games queued. A lot of RPGs. A lot of hubris.`);
  pool.push(`${backlogCount} games. The intention was there. The time was not.`);
  return pool[dayIndex % pool.length];
}

export function getVagueUpcoming(releaseDateStr: string | undefined | null): string | null {
  if (!releaseDateStr || releaseDateStr === 'Unknown') return null;
  if (getCountdown(releaseDateStr)) return null;
  if (!isNaN(new Date(releaseDateStr).getTime())) return null;
  const s = releaseDateStr.trim().toUpperCase();
  const currentYear = new Date().getFullYear();
  if (/\bTBA\b|\bTBD\b|COMING SOON|TO BE ANNOUNCED/.test(s)) return releaseDateStr;
  const yearMatch = s.match(/\b(20\d{2})\b/);
  if (yearMatch && parseInt(yearMatch[1]) >= currentYear) return releaseDateStr;
  return null;
}

interface HomePageProps {
  homeData: HomeData | null;
  launcherGames: LauncherGame[];
  user: User | null;
  appFriends: { id: number; username: string; avatar?: string; online_status?: string; current_game?: string }[];
  showProgressModal: boolean;
  setShowProgressModal: (v: boolean) => void;
  showStatsDetail: 'library' | 'playtime' | 'backlog' | null;
  setShowStatsDetail: (v: 'library' | 'playtime' | 'backlog' | null) => void;
  revealTotalHours: boolean;
  setRevealTotalHours: (v: boolean) => void;
  playtimeChartTab: '7d' | '30d';
  setPlaytimeChartTab: (v: '7d' | '30d') => void;
  artworkRefreshKey: number;
  nowTick: number;
  upcomingSessions: any[];
  showHiddenGames: boolean;
  companionProgress: Record<number, any[]>;
  setCompanionProgress: React.Dispatch<React.SetStateAction<Record<number, any[]>>>;
  friendsLibraryStats: Record<number, any>;
  showRecentAchievements: boolean;
  setShowRecentAchievements: (v: boolean) => void;
  games: Game[];
  setSelectedGame: (g: any) => void;
  fetchLauncherGameDetails: (id: number) => void;
  setCurrentTab: (tab: 'home' | 'questlog' | 'launcher' | 'discover') => void;
  setSessionModal: (v: { game: Game; groupId: number } | null) => void;
  showCardTooltip: (title: string, x: number, y: number) => void;
  hideCardTooltip: () => void;
  handleFriendActivityClick: (game: DiscoverGame) => void;
  fetchQuestlogFriends: (game: Game) => void;
  handleSyncXbox: () => void;
  handleSyncEpic: () => void;
  handleLinkProfile: (platform: 'steam' | 'xbox' | 'discord') => void;
  handleOpenDiscordGuildPicker: () => void;
  setShowSteamLinkModal: (v: boolean) => void;
  fetchAppFriends: () => void;
  fetchPendingRequests: () => void;
  fetchNotificationCount: () => void;
  fetchFriendActivity: (userId: number) => void;
  setFriendsModalTab: (tab: 'friends' | 'messages' | 'settings') => void;
  setShowQuestlogFriends: (v: boolean) => void;
  remoteGetFriendProgress: (id: number) => Promise<any>;
}

const HomePage: React.FC<HomePageProps> = ({
  homeData,
  launcherGames,
  user,
  appFriends,
  showProgressModal,
  setShowProgressModal,
  showStatsDetail,
  setShowStatsDetail,
  revealTotalHours,
  setRevealTotalHours,
  playtimeChartTab,
  setPlaytimeChartTab,
  artworkRefreshKey,
  nowTick,
  upcomingSessions,
  showHiddenGames,
  companionProgress,
  setCompanionProgress,
  friendsLibraryStats,
  showRecentAchievements,
  setShowRecentAchievements,
  games,
  setSelectedGame,
  fetchLauncherGameDetails,
  setCurrentTab,
  setSessionModal,
  showCardTooltip,
  hideCardTooltip,
  handleFriendActivityClick,
  fetchQuestlogFriends,
  handleSyncXbox,
  handleSyncEpic,
  handleLinkProfile,
  handleOpenDiscordGuildPicker,
  setShowSteamLinkModal,
  fetchAppFriends,
  fetchPendingRequests,
  fetchNotificationCount,
  fetchFriendActivity,
  setFriendsModalTab,
  setShowQuestlogFriends,
  remoteGetFriendProgress,
}) => {
  const homeSidebarRef = React.useRef<HTMLDivElement | null>(null);
  const homeGridRef = React.useRef<HTMLDivElement | null>(null);
  const friendsActivityRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div className="space-y-8">
      <section className="relative h-[400px] rounded-[40px] overflow-hidden group">
        <img
          src={
            homeData?.recentlyPlayed?.[0]
              ? getBannerUrl(homeData.recentlyPlayed[0])
              : 'https://picsum.photos/seed/gaming/1920/1080'
          }
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          alt="Hero"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent"/>
        <div className="absolute bottom-12 left-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-widest rounded-full">
                Featured
              </span>
              <span className="text-white/60 text-sm font-medium">Continue your journey</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-white">
              Welcome back, <span className="text-emerald-500">{user?.username}</span>
            </h1>
            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={() => {
                  if (homeData?.recentlyPlayed?.[0]) {
                    setSelectedGame(homeData.recentlyPlayed[0] as any);
                    fetchLauncherGameDetails(homeData.recentlyPlayed[0].id);
                  }
                }}
                className="px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-3 group/btn"
              >
                <Play size={20} fill="currentColor"/>
                Resume Last Game
              </button>
              <button
                onClick={() => setCurrentTab('launcher')}
                className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all border border-white/10"
              >
                View Library
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <div ref={homeGridRef} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <HorizontalScrollRow title="Jump Back In" icon={<Clock size={12} className="text-emerald-500/60"/>}>
            {[...(homeData?.recentlyPlayed ?? [])]
              .filter(g => g.id !== homeData?.recentlyPlayed?.[0]?.id && !((g as any).tags?.toLowerCase().includes('party') || (g as any).genre?.toLowerCase().includes('party')))
              .sort((a, b) => scoreJumpBackIn(b) - scoreJumpBackIn(a))
              .map((game) => {
                const ach = parseAchievements(game);
                const achPct = ach ? ach.unlocked / ach.total : null;
                const hpct = isProgressGame(game) ? hltbProgress(game) : null;
                const pct = achPct ?? hpct ?? null;
                const barType = achPct !== null ? 'ach' : 'hltb';
                const tag = jumpBackInTag(game);
                return (
                  <motion.div key={game.id} whileHover={{ y: -5 }}
                    onClick={() => { setSelectedGame(game as any); fetchLauncherGameDetails(game.id); }}
                    onMouseEnter={(e) => showCardTooltip(game.title, e.clientX, e.clientY)}
                    onMouseLeave={hideCardTooltip}
                    className="group relative w-[calc(50%-0.5rem)] aspect-[92/43] rounded-2xl overflow-hidden cursor-pointer ring-1 ring-white/5 bg-white/5 snap-start shrink-0"
                  >
                    <CachedImg proxyUrl={getSteamHorizontalArtwork(game, artworkRefreshKey)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" alt={game.title}
                      onError={(e) => { const t = e.target as HTMLImageElement; if (!t.src.includes(getBannerUrl(game))) t.src = getBannerUrl(game); }}
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'radial-gradient(ellipse at top left, rgba(0,0,0,0.55) 0%, transparent 65%)' }}/>
                    <div className="absolute top-2.5 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <p className={cn('text-[8px] font-bold uppercase tracking-widest mb-1', tag.color)}>{tag.label}</p>
                      {pct !== null && (
                        <div className="flex items-center gap-1.5">
                          <div className="relative h-[3px] w-14 rounded-full overflow-hidden bg-white/15">
                            <div className="absolute inset-y-0 left-0 rounded-full"
                              style={{
                                width: `${pct * 100}%`,
                                background: barType === 'ach'  ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                                           : barType === 'hltb' ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                                           :                       'linear-gradient(90deg, #f59e0b, #f97316)',
                                boxShadow: barType === 'ach'  ? '0 0 5px rgba(16,185,129,0.6)'
                                           : barType === 'hltb' ? '0 0 5px rgba(99,102,241,0.6)'
                                           :                       '0 0 5px rgba(245,158,11,0.5)',
                              }}
                            />
                            {[0.25, 0.5, 0.75].map(mark => (
                              <div key={mark} className="absolute inset-y-0 w-px bg-black/40" style={{ left: `${mark * 100}%` }}/>
                            ))}
                          </div>
                          <span className="text-[8px] font-bold" style={{ color: barType === 'hltb' ? `hsl(${250 + pct * 30}, 70%, 70%)` : `hsl(${140 * pct}, 80%, 60%)` }}>
                            {Math.round(pct * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
          </HorizontalScrollRow>

          <HorizontalScrollRow title="Picked for You" icon={<Sparkles size={12} className="text-amber-400/60"/>}>
            {homeData?.pickedForYou?.map((game) => {
              const tags = (game.matchedTags ?? []).slice(0, 3);
              const isLibrary = game._source === 'library';
              return (
                <motion.div key={`${game._source}-${game.id}`} whileHover={{ y: -5 }}
                  onClick={() => {
                    setSelectedGame(game as any);
                    if (isLibrary) fetchLauncherGameDetails(game.id);
                    else fetchQuestlogFriends(game as any);
                  }}
                  onMouseEnter={(e) => showCardTooltip(game.title, e.clientX, e.clientY)}
                  onMouseLeave={hideCardTooltip}
                  className="group relative w-[calc(50%-0.5rem)] aspect-[92/43] rounded-2xl overflow-hidden cursor-pointer ring-1 ring-white/5 bg-white/5 snap-start shrink-0"
                >
                  <CachedImg proxyUrl={getSteamHorizontalArtwork(game, artworkRefreshKey)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" alt={game.title}
                    onError={(e) => { const t = e.target as HTMLImageElement; if (!t.src.includes(getBannerUrl(game))) t.src = getBannerUrl(game); }}
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'radial-gradient(ellipse at top left, rgba(0,0,0,0.6) 0%, transparent 65%)' }}/>
                  <div className="absolute top-2.5 left-3 flex flex-wrap gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className={cn('flex items-center justify-center w-5 h-5 rounded-full',
                      isLibrary ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                    )}>
                      {isLibrary ? <Library size={10}/> : <Gamepad2 size={10}/>}
                    </span>
                    {tags.map((tag, i) => (
                      <span key={tag} className={cn('text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full',
                        i === 0 ? 'bg-emerald-500/25 text-emerald-300' :
                        i === 1 ? 'bg-amber-500/25 text-amber-300' :
                                  'bg-rose-500/25 text-rose-300'
                      )}>{tag}</span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </HorizontalScrollRow>

          {/* Friends Activity */}
          {homeData?.friendsActivity && homeData.friendsActivity.length > 0 && (() => {
            const ncA = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
            const allOnline = [
              ...(homeData.friendsOnline?.steam ?? []),
              ...(homeData.friendsOnline?.xbox ?? []),
              ...(homeData.friendsOnline?.epic ?? []),
              ...(homeData.friendsOnline?.discord ?? []),
              ...(homeData.friendsOnline?.app ?? []),
            ];
            const liveGames = new Set(allOnline.filter(f => f.current_game).map(f => ncA(f.current_game!)));
            type ActivityGroup = {
              game: DiscoverGame;
              friends: { name: string; avatar: string; playedAt?: string }[];
              isLive: boolean;
              matchedLibraryId: number | null;
              matchedQuestlogId: number | null;
            };
            const groups = new Map<string, ActivityGroup>();
            for (const item of homeData.friendsActivity) {
              const key = ncA(item.title);
              if (!groups.has(key)) {
                groups.set(key, {
                  game: item,
                  friends: [],
                  isLive: liveGames.has(key),
                  matchedLibraryId: item.matchedLibraryId ?? null,
                  matchedQuestlogId: item.matchedQuestlogId ?? null,
                });
              }
              const grp = groups.get(key)!;
              if (item.friendName) {
                grp.friends.push({ name: item.friendName, avatar: item.friendAvatar || '', playedAt: item.lastPlayed });
              }
            }
            const sorted = [...groups.values()].sort((a, b) => {
              if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
              return b.friends.length - a.friends.length;
            });
            return (
              <div ref={friendsActivityRef}>
                <HorizontalScrollRow title="Friends Activity" icon={<Users size={12} className="text-blue-400/60"/>}>
                  {sorted.map((group) => {
                    const { game, friends, isLive, matchedLibraryId, matchedQuestlogId } = group;
                    const steamAppID = game.steamAppID;
                    const proxyUrl = steamAppID
                      ? `/api/steamgriddb/horizontal/${steamAppID}`
                      : `/api/steamgriddb/horizontal-by-name/${encodeURIComponent(game.title)}`;
                    return (
                      <motion.div key={game.id} whileHover={{ y: -5 }}
                        onClick={() => handleFriendActivityClick(game)}
                        onMouseEnter={(e) => showCardTooltip(game.title, e.clientX, e.clientY)}
                        onMouseLeave={hideCardTooltip}
                        className="group relative w-[calc(50%-0.5rem)] aspect-[92/43] rounded-2xl overflow-hidden cursor-pointer ring-1 ring-white/5 bg-white/5 snap-start shrink-0"
                      >
                        <CachedImg proxyUrl={proxyUrl} alt={game.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'radial-gradient(ellipse at top left, rgba(0,0,0,0.65) 0%, transparent 65%)' }}/>
                        <div className="absolute top-2.5 left-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span className={cn('flex items-center justify-center w-5 h-5 rounded-full shrink-0',
                            matchedLibraryId ? 'bg-blue-500 text-white' :
                            matchedQuestlogId ? 'bg-purple-500 text-white' :
                            'bg-white/20 text-white/60'
                          )}>
                            {matchedLibraryId ? <Library size={10}/> :
                             matchedQuestlogId ? <Gamepad2 size={10}/> :
                             <Sparkles size={10}/>}
                          </span>
                          {friends.slice(0, 2).map((f) => (
                            <div key={f.name} className="flex items-center gap-1">
                              <div className="w-5 h-5 rounded-full border border-black/60 overflow-hidden shrink-0">
                                <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" referrerPolicy="no-referrer"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              </div>
                              <span className="text-[8px] font-semibold text-white/80 leading-none whitespace-nowrap">{f.name}</span>
                            </div>
                          ))}
                          {friends.length > 2 && (
                            <span className="text-[7px] text-white/40 leading-none">+{friends.length - 2}</span>
                          )}
                          {isLive && (
                            <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"/>
                              Live
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </HorizontalScrollRow>
              </div>
            );
          })()}
        </div>

        <div ref={homeSidebarRef} className="lg:col-span-4 flex flex-col gap-10">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-5 flex items-center gap-2.5">
              <Users size={12} className="text-blue-500"/>
              Friends Online
            </h3>

            <div className="space-y-6">
              {/* Steam */}
              <div className="flex items-center gap-4 min-h-[36px]">
                <SteamIcon className="w-6 h-6 text-white/20 shrink-0"/>
                {user?.steam_id ? (
                  (() => { const online = (homeData?.friendsOnline?.steam ?? []).filter(f => f.online_status === 'online'); return online.length > 0
                    ? <FriendBubbles friends={online}/>
                    : <p className="text-[10px] text-white/20 italic">No one online</p>; })()
                ) : (
                  <button onClick={() => setShowSteamLinkModal(true)} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors cursor-pointer">
                    + Connect
                  </button>
                )}
              </div>

              {/* Xbox */}
              <div className="flex items-center gap-4 min-h-[36px]">
                <XboxIcon className="w-6 h-6 text-white/20 shrink-0"/>
                {user?.xbox_id ? (
                  (() => { const online = (homeData?.friendsOnline?.xbox ?? []).filter(f => f.online_status === 'online'); return online.length > 0
                    ? <FriendBubbles friends={online}/>
                    : <p className="text-[10px] text-white/20 italic">No one online</p>; })()
                ) : (
                  <button onClick={handleSyncXbox} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors cursor-pointer">
                    + Connect
                  </button>
                )}
              </div>

              {/* Epic */}
              <div className="flex items-center gap-4 min-h-[36px]">
                <EpicIcon className="w-6 h-6 text-white/20 shrink-0"/>
                {user?.epic_account_id ? (
                  (homeData?.friendsOnline?.epic ?? []).length > 0
                    ? <FriendBubbles friends={homeData!.friendsOnline.epic}/>
                    : <p className="text-[10px] text-white/20 italic">No one online</p>
                ) : (
                  <button onClick={handleSyncEpic} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors cursor-pointer">
                    + Connect
                  </button>
                )}
              </div>

              {/* Discord */}
              <div className="flex items-center gap-4 min-h-[36px]">
                <DiscordIcon className="w-6 h-6 text-white/20 shrink-0"/>
                {!user?.discord_id ? (
                  <button onClick={() => handleLinkProfile('discord')} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors cursor-pointer">
                    + Connect
                  </button>
                ) : !homeData?.discordGuildId ? (
                  <button onClick={handleOpenDiscordGuildPicker} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors cursor-pointer">
                    + Pick a server
                  </button>
                ) : !homeData?.discordGuildCached ? (
                  <button onClick={handleOpenDiscordGuildPicker} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#5865F2]/50 hover:text-[#5865F2] transition-colors cursor-pointer">
                    + Invite bot for presence
                  </button>
                ) : (homeData.friendsOnline?.discord ?? []).length > 0 ? (
                  <div className="flex-1 min-w-0">
                    <FriendBubbles friends={homeData.friendsOnline.discord} max={8}/>
                  </div>
                ) : (
                  <p className="text-[10px] text-white/20 italic">No one online</p>
                )}
                {user?.discord_id && homeData?.discordGuildId && (
                  <button onClick={handleOpenDiscordGuildPicker} className="ml-auto text-[9px] font-bold uppercase tracking-widest text-white/15 hover:text-white/40 transition-colors cursor-pointer shrink-0">
                    Change
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="flex-1 flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2.5">
              <Activity size={12} className="text-emerald-500"/>
              Quick Stats
            </h3>
            <div className="flex-1 flex flex-col gap-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowStatsDetail('library')}
                  className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl text-left hover:bg-blue-500/20 transition-all group">
                  <Library className="text-blue-500 mb-4 group-hover:scale-[1.03] transition-transform"/>
                  <div className="text-2xl font-black">{homeData?.stats?.libraryCount}</div>
                  <div className="text-xs font-bold text-blue-500/60 uppercase tracking-widest">Library</div>
                </button>
                <button onClick={() => { setShowStatsDetail('playtime'); setRevealTotalHours(false); }}
                  className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-left hover:bg-emerald-500/20 transition-all group">
                  <Clock className="text-emerald-500 mb-3 group-hover:scale-[1.03] transition-transform"/>
                  <div className="text-2xl font-black">{homeData?.stats?.weeklyPlaytimeHours ?? 0}h</div>
                  <div className="text-xs font-bold text-emerald-500/60 uppercase tracking-widest">This Week</div>
                </button>
                <button onClick={() => setShowStatsDetail('backlog')}
                  className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-3xl text-left hover:bg-purple-500/20 transition-all group">
                  <Gamepad2 className="text-purple-500 mb-4 group-hover:scale-[1.03] transition-transform"/>
                  <div className="text-2xl font-black">{homeData?.stats?.backlogCount}</div>
                  <div className="text-xs font-bold text-purple-500/60 uppercase tracking-widest">Backlog</div>
                </button>
                <button onClick={() => setShowRecentAchievements(true)}
                  className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-3xl text-left hover:bg-orange-500/20 transition-all group">
                  <Trophy className="text-orange-500 mb-4 group-hover:scale-[1.03] transition-transform"/>
                  <div className="text-2xl font-black">{homeData?.recentAchievements?.length}</div>
                  <div className="text-xs font-bold text-orange-500/60 uppercase tracking-widest">Achievements</div>
                </button>
              </div>
              <button onClick={() => {
                setShowProgressModal(true);
                appFriends.forEach(async f => {
                  if (companionProgress[f.id]) return;
                  try { setCompanionProgress(p => ({ ...p, [f.id]: [] })); const data = await remoteGetFriendProgress(f.id); setCompanionProgress(p => ({ ...p, [f.id]: data })); } catch {}
                });
              }}
                className="flex-1 w-full px-6 pt-4 pb-6 bg-teal-500/10 border border-teal-500/20 rounded-3xl text-left hover:bg-teal-500/20 transition-all group flex flex-col justify-start">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-teal-500 group-hover:scale-[1.03] transition-transform"/>
                    <div className="text-xs font-bold text-teal-500/60 uppercase tracking-widest">In Progress</div>
                  </div>
                  <div className="text-2xl font-black">{(homeData?.recentlyPlayed ?? []).filter(g => (g.playtime ?? 0) > 0).length}</div>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  {(homeData?.recentlyPlayed ?? []).filter(g => (g.playtime ?? 0) > 0).slice(0, 3).map(game => {
                    const ach = parseAchievements(game);
                    const achPct = ach ? ach.unlocked / ach.total : null;
                    const hpct = isProgressGame(game) ? hltbProgress(game) : null;
                    const pct = achPct ?? hpct ?? null;
                    const barType = achPct !== null ? 'ach' : 'hltb';
                    const barGrad = barType === 'ach' ? 'linear-gradient(90deg,#10b981,#06b6d4)' : 'linear-gradient(90deg,#6366f1,#a855f7)';
                    const pctColor = barType === 'hltb' ? '#a78bfa' : `hsl(${140 * (pct ?? 0)},80%,60%)`;
                    const steamId = game.platform === 'steam' ? game.external_id : undefined;
                    return (
                      <div key={game.id} className="flex items-center gap-2">
                        <SuggestionThumb steamAppID={steamId} title={game.title} fallbackThumb={game.artwork} size="w-6 h-6"/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-semibold truncate text-white/80">{game.title}</p>
                            {pct !== null && <span className="text-[10px] font-black ml-1.5 shrink-0 tabular-nums" style={{ color: pctColor }}>{Math.round(pct * 100)}%</span>}
                          </div>
                          <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
                            {pct !== null && <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct * 100}%`, background: barGrad }}/>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </button>
            </div>
          </section>
        </div>
      </div>

      <InProgressModal
        showProgressModal={showProgressModal}
        setShowProgressModal={setShowProgressModal}
        launcherGames={launcherGames}
        user={user}
        appFriends={appFriends}
        companionProgress={companionProgress}
        parseAchievements={parseAchievements}
        isProgressGame={isProgressGame}
        hltbProgress={hltbProgress}
        setSelectedGame={setSelectedGame}
        fetchLauncherGameDetails={fetchLauncherGameDetails}
      />

      <PlaytimeStatsModal
        showStatsDetail={showStatsDetail}
        setShowStatsDetail={setShowStatsDetail}
        homeData={homeData}
        launcherGames={launcherGames}
        games={games}
        user={user}
        appFriends={appFriends}
        friendsLibraryStats={friendsLibraryStats}
        revealTotalHours={revealTotalHours}
        setRevealTotalHours={setRevealTotalHours}
        buildTagline={buildTagline}
        buildBacklogTagline={buildBacklogTagline}
        getCountdown={getCountdown}
        getVagueUpcoming={getVagueUpcoming}
        getSteamId={getSteamId}
        setSelectedGame={setSelectedGame}
        fetchAppFriends={fetchAppFriends}
        fetchPendingRequests={fetchPendingRequests}
        fetchNotificationCount={fetchNotificationCount}
        fetchFriendActivity={fetchFriendActivity}
        setFriendsModalTab={setFriendsModalTab}
        setShowQuestlogFriends={setShowQuestlogFriends}
      />
    </div>
  );
};

export default HomePage;
