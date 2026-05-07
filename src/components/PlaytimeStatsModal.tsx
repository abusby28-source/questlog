import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingDown, Calendar } from 'lucide-react';
import {
  AreaChart, Area, Tooltip, ResponsiveContainer,
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// ── Inline helpers ────────────────────────────────────────────────────────────

const SuggestionThumb: React.FC<{ steamAppID?: string; title: string; fallbackThumb?: string; size?: string }> = memo(({ steamAppID, title, fallbackThumb, size = 'w-10 h-10' }) => {
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

const EAIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1000 486.308" fill="currentColor" className={className}>
    <g transform="translate(-175.12634,-267.07553)">
      <path d="m 867.91758,267.07575 -246.27934,389.28988 -269.90232,0 62.20107,-95.7643 167.90548,0 60.94743,-97.00005 -374.37103,0 -60.94734,97.00005 89.54963,0 -121.89482,192.78219 502.49835,0 190.29289,-303.46551 69.65166,110.68332 -59.71163,0 -60.92959,95.7643 181.58874,0 60.94724,97.01789 115.6623,0 -307.20872,-486.30777"/>
      <path d="m 787.07217,270.80081 -396.75834,0 -60.94753,97.01815 396.75835,-1.23496 60.94752,-95.78245"/>
    </g>
  </svg>
);

const EpicIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 647.167 750.977" className={className} fill="currentColor">
    <path d="M 323.583,0 C 144.874,0 0,168.266 0,375.488 c 0,207.223 144.874,375.489 323.583,375.489 178.71,0 323.584,-168.266 323.584,-375.489 C 647.167,168.266 502.293,0 323.583,0 Z"/>
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface LauncherGame {
  id: number;
  title: string;
  artwork: string;
  banner: string;
  horizontal_grid?: string;
  logo?: string;
  platform: 'steam' | 'xbox' | 'local' | 'ea';
  external_id: string;
  launch_path: string;
  playtime: number;
  achievements?: string;
  last_played: string | null;
  created_at: string;
  tags?: string;
  genre?: string;
  steam_url?: string;
  hltb_main?: number | null;
}

interface Game {
  id: number;
  title: string;
  artwork: string;
  genre?: string;
  tags?: string;
  steam_url?: string;
  release_date?: string;
  created_at: string;
  game_pass?: number;
  lowest_price?: string;
  previous_price?: string;
  allkeyshop_url?: string;
  game_pass_added_at?: string;
  horizontal_grid?: string;
}

interface FriendEntry { id: number | string; username: string; avatar?: string; online_status: string; current_game?: string; }

interface FriendLibraryStats {
  libraryCount: number;
  genreStats: { genre: string; count: number }[];
  platformStats: { platform: string; count: number }[];
  tagStats: { tag: string; count: number }[];
  topGame?: { title: string; playtime: number };
  recentGame?: { title: string };
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PlaytimeStatsModalProps {
  showStatsDetail: 'library' | 'playtime' | 'backlog' | null;
  setShowStatsDetail: (v: 'library' | 'playtime' | 'backlog' | null) => void;
  homeData: any;
  launcherGames: LauncherGame[];
  games: Game[];
  user: any;
  appFriends: FriendEntry[];
  friendsLibraryStats: Record<number, FriendLibraryStats>;
  revealTotalHours: boolean;
  setRevealTotalHours: (v: boolean) => void;
  buildTagline: (tags: { tag: string; count: number }[], topGame?: { title: string; playtime: number } | null, recentGameTitle?: string | null, libraryCount?: number) => string;
  buildBacklogTagline: (tags: { tag: string; count: number }[], backlogCount?: number, oldestTitle?: string | null, spotlightTitle?: string | null, oldestTags?: string | null) => string;
  getCountdown: (releaseDateStr: string | undefined | null) => { days: number; hours: number; minutes: number; isImminent: boolean } | null;
  getVagueUpcoming: (releaseDateStr: string | undefined | null) => string | null;
  getSteamId: (game: any) => string | null;
  setSelectedGame: (g: any) => void;
  fetchAppFriends: () => void;
  fetchPendingRequests: () => void;
  fetchNotificationCount: () => void;
  fetchFriendActivity: (userId: number) => void;
  setFriendsModalTab: (tab: 'friends' | 'messages' | 'settings') => void;
  setShowQuestlogFriends: (v: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlaytimeStatsModal(props: PlaytimeStatsModalProps) {
  const {
    showStatsDetail, setShowStatsDetail, homeData, launcherGames, games, user,
    appFriends, friendsLibraryStats, revealTotalHours, setRevealTotalHours,
    buildTagline, buildBacklogTagline, getCountdown, getVagueUpcoming,
    getSteamId, setSelectedGame, fetchAppFriends, fetchPendingRequests,
    fetchNotificationCount, fetchFriendActivity, setFriendsModalTab, setShowQuestlogFriends,
  } = props;

  return (
    <AnimatePresence>
      {showStatsDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStatsDetail(null)}
            className="absolute inset-0 bg-black/85"
/>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.15 }}
            className="relative w-full max-w-4xl bg-[#1a1a1a] rounded-[40px] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
>
            <div className="absolute inset-0 pointer-events-none z-10" style={{ boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)', borderRadius: 'inherit' }}/>
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tighter uppercase italic font-serif">
                {showStatsDetail ==='library' ?'Library Insights' : showStatsDetail ==='playtime' ?'Playtime Analytics' :'Backlog Breakdown'}
              </h2>
              <button onClick={() => setShowStatsDetail(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24}/>
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-10">
              {showStatsDetail ==='library' && (() => {
                const myCount = homeData?.stats?.libraryCount || 0;
                const myTags = homeData?.stats?.tagStats || [];
                const tagColors = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#f97316','#a78bfa','#34d399','#fb923c'];
                const platformCounts: Record<string, number> = {};
                launcherGames.forEach(g => { if (g.platform) platformCounts[g.platform] = (platformCounts[g.platform] || 0) + 1; });
                const activePlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
                const platformColors: Record<string, string> = { steam: '#1b9fe0', xbox: '#107c10', epic: '#c0c0c0', ea: '#ff4500' };
                const allCounts = [myCount, ...appFriends.map(f => friendsLibraryStats[f.id as number]?.libraryCount || 0)];
                const maxCount = Math.max(...allCounts, 1);
                const topGame = [...launcherGames].sort((a, b) => b.playtime - a.playtime)[0];
                const recentGameTitle = homeData?.recentlyPlayed?.[0]?.title ?? null;
                const tagline = buildTagline(myTags, topGame ?? null, recentGameTitle, myCount);
                return (
                  <div className="space-y-8">
                    {/* Tagline banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 px-6 py-5">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none"/>
                      <p className="text-lg font-black italic text-white/90">"{tagline}"</p>
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {myTags.slice(0, 5).map((t: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ backgroundColor: tagColors[i] + '22', color: tagColors[i], border: `1px solid ${tagColors[i]}40` }}>
                            {t.tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Hero numbers */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-blue-400/60 mb-1">Total Games</p>
                        <p className="text-4xl font-black text-blue-400">{myCount}</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Tags</p>
                        <p className="text-4xl font-black">{myTags.length}</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Platforms</p>
                        <p className="text-4xl font-black">{activePlatforms.length}</p>
                      </div>
                    </div>

                    {/* Tags + Platform + Recent */}
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5">Top Tags</h3>
                        <div className="space-y-3">
                          {myTags.slice(0, 10).map((stat: any, idx: number) => (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold">{stat.tag}</span>
                                <span className="text-[10px] font-mono text-white/30">{stat.count} {stat.count === 1 ? 'game' : 'games'}</span>
                              </div>
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(stat.count / (myTags[0]?.count || 1)) * 100}%` }}
                                  transition={{ delay: idx * 0.04, duration: 0.5, ease: 'easeOut' }}
                                  style={{ backgroundColor: tagColors[idx % tagColors.length] }}
                                  className="h-full rounded-full"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {myTags.length === 0 && (
                          <p className="text-xs text-white/20 italic">No tags yet — add games to see your profile.</p>
                        )}

                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 mt-7">Platforms</h3>
                        <div className="flex flex-wrap gap-2">
                          {activePlatforms.map(([platform, count]) => {
                            const platformIcon: Record<string, React.ReactNode> = {
                              steam: <SteamIcon className="w-4 h-4"/>,
                              xbox:  <XboxIcon  className="w-4 h-4"/>,
                              ea:    <EAIcon    className="w-4 h-4"/>,
                              epic:  <EpicIcon  className="w-4 h-4"/>,
                            };
                            const color = platformColors[platform] || '#ffffff';
                            return (
                              <div key={platform} className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold"
                                style={{ backgroundColor: color + '22', border: `1px solid ${color}40`, color }}>
                                {platformIcon[platform] ?? null}
                                <span className="opacity-60">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5">Recent Additions</h3>
                        <div className="space-y-3">
                          {launcherGames.slice(0, 6).map(game => (
                            <div key={game.id} className="flex items-center gap-3 cursor-pointer rounded-xl p-1 -m-1 hover:bg-white/5 transition-colors"
                              onClick={() => { setShowStatsDetail(null); setSelectedGame(game); }}>
                              <SuggestionThumb steamAppID={getSteamId(game) || undefined} title={game.title} size="w-9 h-9"/>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{game.title}</p>
                                <p className="text-[10px] text-white/30 font-mono">{new Date(game.created_at).toLocaleDateString('en-GB')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Friends comparison */}
                    {appFriends.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Library vs Friends</h3>
                        <div className="space-y-2">
                          {/* You */}
                          <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                            {user?.avatar
                              ? <img src={user.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt=""/>
                              : <div className="w-9 h-9 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-black text-blue-300 shrink-0">{user?.username?.[0]?.toUpperCase()}</div>
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-blue-300">You</p>
                              <p className="text-[11px] text-white/40 italic truncate">"{tagline}"</p>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(myCount / maxCount) * 100}%` }} transition={{ duration: 0.5 }} className="h-full bg-blue-400 rounded-full"/>
                              </div>
                              <span className="text-sm font-black text-blue-400 w-8 text-right">{myCount}</span>
                            </div>
                          </div>
                          {/* Friends */}
                          {appFriends.map((friend, idx) => {
                            const stats = friendsLibraryStats[friend.id as number];
                            const fCount = stats?.libraryCount ?? null;
                            const friendTagline = stats
                              ? buildTagline(stats.tagStats || [], stats.topGame ?? null, stats.recentGame?.title ?? null, stats.libraryCount)
                              : null;
                            return (
                              <motion.div key={friend.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                onClick={() => { setShowStatsDetail(null); fetchAppFriends(); fetchPendingRequests(); fetchNotificationCount(); fetchFriendActivity(friend.id as number); setFriendsModalTab('friends'); setShowQuestlogFriends(true); }}
                                className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-white/15 transition-all">
                                {friend.avatar
                                  ? <img src={friend.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt=""/>
                                  : <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-black shrink-0">{friend.username[0]?.toUpperCase()}</div>
                                }
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate">{friend.username}</p>
                                  {friendTagline
                                    ? <p className="text-[11px] text-white/35 italic truncate">"{friendTagline}"</p>
                                    : <div className="h-3 w-40 bg-white/10 rounded animate-pulse mt-1"/>
                                  }
                                </div>
                                {fCount !== null ? (
                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                      <motion.div initial={{ width: 0 }} animate={{ width: `${(fCount / maxCount) * 100}%` }} transition={{ duration: 0.5, delay: 0.1 + idx * 0.05 }} className="h-full bg-white/40 rounded-full"/>
                                    </div>
                                    <span className="text-sm font-black text-white/40 w-8 text-right">{fCount}</span>
                                  </div>
                                ) : (
                                  <div className="w-24 h-1.5 bg-white/10 rounded-full animate-pulse shrink-0"/>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {showStatsDetail ==='playtime' && (() => {
                const totalHours = homeData?.stats?.playtimeHours || 0;
                const weeklyHours = homeData?.stats?.weeklyPlaytimeHours || 0;
                const history = homeData?.history || [];
                const history7 = history.slice(-7);
                const topGames = [...launcherGames].sort((a, b) => b.playtime - a.playtime).slice(0, 5);

                const bestDay = history.reduce((best: any, d: any) => d.minutes > (best?.minutes || 0) ? d : best, history[0]);
                const bestDayHours = bestDay ? Math.round(bestDay.minutes / 60 * 10) / 10 : 0;

                const dowTotals = new Array(7).fill(0);
                const dowCounts = new Array(7).fill(0);
                history.forEach((d: any) => {
                  const dow = new Date(d.date).getDay();
                  dowTotals[dow] += d.minutes;
                  if (d.minutes > 0) dowCounts[dow]++;
                });
                const dowAvg = dowTotals.map((t: number, i: number) => ({ day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i], avg: dowCounts[i] ? Math.round(t / dowCounts[i]) : 0 }));
                const peakDow = dowAvg.reduce((best: any, d: any) => d.avg > best.avg ? d : best, dowAvg[0]);
                const maxDowAvg = Math.max(...dowAvg.map((d: any) => d.avg), 1);

                const playedDates = new Set(history.filter((d: any) => d.minutes > 0).map((d: any) => d.date));
                const sorted = [...playedDates].sort() as string[];
                let cur = 0, bestStreak = 0;
                sorted.forEach((date: string, i: number) => {
                  if (i === 0) { cur = 1; }
                  else { const prev = new Date(sorted[i - 1]); prev.setDate(prev.getDate() + 1); cur = prev.toISOString().slice(0, 10) === date ? cur + 1 : 1; }
                  if (cur > bestStreak) bestStreak = cur;
                });

                const days = Math.round(totalHours / 24);
                const movies = Math.round(totalHours / 2);
                const funFact = days >= 2 ? days + ' full days of your life, gone. Worth it.' : 'The equivalent of ' + movies + ' movies. No regrets.';

                const heatDays: { date: string; minutes: number }[] = [];
                for (let i = 29; i >= 0; i--) {
                  const d = new Date(); d.setDate(d.getDate() - i);
                  const key = d.toISOString().slice(0, 10);
                  heatDays.push({ date: key, minutes: history.find((h: any) => h.date === key)?.minutes || 0 });
                }
                const maxHeatMin = Math.max(...heatDays.map(d => d.minutes), 1);
                const heatStyle = (min: number): React.CSSProperties => {
                  if (min === 0) return { backgroundColor: 'rgba(255,255,255,0.05)' };
                  const pct = min / maxHeatMin;
                  const r = Math.round(56 + pct * 199);
                  const g = Math.round(189 - pct * 170);
                  const b = Math.round(248 - pct * 8);
                  return { backgroundColor: 'rgba(' + r + ',' + g + ',' + b + ',' + (0.25 + pct * 0.75) + ')', boxShadow: pct > 0.6 ? '0 0 6px rgba(' + r + ',' + g + ',' + b + ',' + (pct * 0.5) + ')' : undefined };
                };

                const maxWeekMin = Math.max(...history7.map((d: any) => d.minutes), 1);
                const sessionEmoji = (min: number) => { if (min === 0) return '💤'; if (min < 60) return '🎮'; if (min < 180) return '🔥'; return '⚡'; };
                const medalLabels = ['🥇','🥈','🥉'];

                return (
                  <div className="space-y-6">

                    {/* Total hours — hidden reveal */}
                    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 px-6 py-5"
                      style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,182,212,0.08) 50%, rgba(139,92,246,0.08) 100%)' }}>
                      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.1) 0%, transparent 70%)' }}/>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">Total Hours Played</p>
                      {revealTotalHours ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                          <p className="text-5xl font-black text-emerald-400 mb-1">{totalHours}<span className="text-2xl ml-1.5 text-emerald-400/50">hrs</span></p>
                          <p className="text-sm text-white/40 italic">{funFact}</p>
                        </motion.div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="text-5xl font-black blur-sm select-none text-emerald-400/60 pointer-events-none">????</div>
                          <button onClick={() => setRevealTotalHours(true)}
                            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 transition-all hover:scale-105 active:scale-95">
                            Reveal 👀
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hero numbers — 3-col like Library */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-2xl p-5 border" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)' }}>
                        <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: '#10b98180' }}>This Week</p>
                        <p className="text-4xl font-black" style={{ color: '#10b981' }}>{weeklyHours}<span className="text-xl ml-1 opacity-50">h</span></p>
                      </div>
                      <div className="rounded-2xl p-5 border" style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)' }}>
                        <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: '#f59e0b80' }}>Best Day</p>
                        <p className="text-4xl font-black" style={{ color: '#f59e0b' }}>{bestDayHours}<span className="text-xl ml-1 opacity-50">h</span></p>
                        {bestDay && <p className="text-[10px] text-white/20 font-mono mt-1">{new Date(bestDay.date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</p>}
                      </div>
                      <div className="rounded-2xl p-5 border" style={{ background: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.25)' }}>
                        <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: '#38bdf880' }}>Best Streak</p>
                        <p className="text-4xl font-black" style={{ color: '#38bdf8' }}>{bestStreak}<span className="text-xl ml-1 opacity-50">d</span></p>
                        {bestStreak > 0 && <p className="text-[10px] text-white/20 font-mono mt-1">consecutive days</p>}
                      </div>
                    </div>

                    {/* This week's sessions */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">Your Week</h3>
                        <span className="text-[10px] font-mono text-emerald-400/50">{weeklyHours}h total</span>
                      </div>
                      <div className="space-y-2.5">
                        {history7.map((d: any, i: number) => {
                          const hrs = Math.round(d.minutes / 60 * 10) / 10;
                          const pct = d.minutes / maxWeekMin;
                          const isToday = d.date === new Date().toISOString().slice(0, 10);
                          const dayLabel = new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short' });
                          return (
                            <div key={i} className="flex items-center gap-2.5">
                              <span className={'text-sm w-5 text-center ' + (d.minutes === 0 ? 'opacity-20' : '')}>{sessionEmoji(d.minutes)}</span>
                              <span className={'text-[9px] font-mono w-7 shrink-0 ' + (isToday ? 'text-emerald-400 font-bold' : 'text-white/25')}>{dayLabel}</span>
                              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: (pct * 100) + '%' }}
                                  transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
                                  className="h-full rounded-full"
                                  style={(() => {
                                    if (d.minutes === 0) return {};
                                    if (isToday) return { background: 'linear-gradient(to right, #10b981, #34d399)', boxShadow: pct > 0.2 ? '0 0 8px rgba(16,185,129,0.5)' : undefined };
                                    if (d.minutes >= 120) return { background: 'linear-gradient(to right, #f59e0b, #fbbf24)', boxShadow: pct > 0.5 ? '0 0 6px rgba(245,158,11,0.4)' : undefined };
                                    if (d.minutes >= 45) return { background: 'linear-gradient(to right, #8b5cf6, #a78bfa)' };
                                    return { background: 'linear-gradient(to right, #0ea5e9, #38bdf8)' };
                                  })()}
                                />
                              </div>
                              <span className={'text-[9px] font-mono tabular-nums w-7 text-right shrink-0 ' + (hrs === 0 ? 'text-white/10' : '')} style={hrs > 0 ? { color: isToday ? '#10b981' : d.minutes >= 120 ? '#f59e0b' : d.minutes >= 45 ? '#a78bfa' : '#38bdf8' } : undefined}>
                                {hrs > 0 ? hrs + 'h' : '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Trend + Heatmap — 2-col bento */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl p-4 border border-white/10 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">30-Day Trend</span>
                          {peakDow.avg > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                              Peak: {({ Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat', Sun: 'Sun' } as Record<string,string>)[peakDow.day] || peakDow.day}
                            </span>
                          )}
                        </div>
                        <div style={{ height: 72 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="ptGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="minutes" stroke="#a78bfa" strokeWidth={1.5} fill="url(#ptGrad)" dot={false}/>
                              <Tooltip contentStyle={{ backgroundColor:'#111', border:'1px solid rgba(139,92,246,0.3)', borderRadius:'10px', fontSize:'10px', padding:'4px 8px' }}
                                formatter={(v: any) => [Math.round(v / 60 * 10) / 10 + 'h', '']}
                                labelFormatter={(l) => new Date(l).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}/>
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[8px] text-white/15 font-mono">30 days ago</span>
                          <span className="text-[8px] text-white/15 font-mono">today</span>
                        </div>
                      </div>
                      <div className="rounded-2xl p-4 border border-white/10 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">30-Day Activity</span>
                        <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
                          {heatDays.map((d, i) => (
                            <div key={i} title={d.date + ': ' + Math.round(d.minutes / 60 * 10) / 10 + 'h'}
                              style={{ ...heatStyle(d.minutes), aspectRatio: '1', borderRadius: 2 }}
                              className="cursor-default transition-transform hover:scale-125"/>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] text-white/15 font-mono">less</span>
                          {[0,0.33,0.66,1].map((p,i) => {
                            if (p === 0) return <div key={i} style={{ width:8, height:8, borderRadius:1, backgroundColor: 'rgba(255,255,255,0.05)' }}/>;
                            const r = Math.round(56 + p * 199), g = Math.round(189 - p * 170), b = Math.round(248 - p * 8);
                            return <div key={i} style={{ width:8, height:8, borderRadius:1, backgroundColor: 'rgba('+r+','+g+','+b+','+(0.25+p*0.75)+')' }}/>;
                          })}
                          <span className="text-[8px] text-white/15 font-mono">more</span>
                        </div>
                      </div>
                    </div>

                    {/* Most Played */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Most Played</h3>
                      <div className="space-y-2">
                        {topGames.map((game, idx) => {
                          const hrs = Math.round(game.playtime / 60);
                          const pct = (game.playtime / (topGames[0].playtime || 1)) * 100;
                          const rankColors = ['#f59e0b','#94a3b8','#cd7c3a'];
                          const barGrads   = [
                            'linear-gradient(to right, #f59e0b, #fbbf24)',
                            'linear-gradient(to right, #8b5cf6, #a78bfa)',
                            'linear-gradient(to right, #0ea5e9, #38bdf8)',
                            'linear-gradient(to right, #10b981, #34d399)',
                            'linear-gradient(to right, #f43f5e, #fb7185)',
                          ];
                          const c = rankColors[idx] || 'rgba(255,255,255,0.35)';
                          return (
                            <motion.div key={game.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}
                              onClick={() => { setShowStatsDetail(null); setSelectedGame(game); }}
                              className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                              <span className="w-6 text-center text-sm shrink-0">{idx < 3 ? medalLabels[idx] : <span className="text-xs font-black text-white/20">{idx + 1}</span>}</span>
                              <SuggestionThumb steamAppID={getSteamId(game) || undefined} title={game.title} size="w-9 h-9"/>
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <p className="text-sm font-bold truncate">{game.title}</p>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: pct + '%' }} transition={{ delay: 0.15 + idx * 0.06, duration: 0.6, ease: 'easeOut' }}
                                    className="h-full rounded-full" style={{ background: barGrads[idx] || 'rgba(255,255,255,0.2)' }}/>
                                </div>
                              </div>
                              <span className="text-sm font-black shrink-0 tabular-nums" style={{ color: c }}>{hrs}h</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                );
              })()}

              {showStatsDetail ==='backlog' && (() => {
                const backlogCount = homeData?.stats?.backlogCount || 0;
                const priceDrops = homeData?.updates?.priceDrops || [];
                const gamePassGames = homeData?.updates?.gamePass || [];

                const hasGamesLoaded = games.length > 0;
                const gpCount = hasGamesLoaded ? games.filter((g: any) => g.game_pass).length : gamePassGames.length;

                const tagMap = new Map<string, number>();
                if (hasGamesLoaded) games.forEach((g: any) => {
                  if (g.tags) g.tags.split(',').map((t: string) => t.trim()).filter(Boolean).forEach((t: string) => tagMap.set(t, (tagMap.get(t) || 0) + 1));
                });
                const tagList = [...tagMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
                const maxTag = tagList[0]?.[1] || 1;
                const tagObjs = tagList.map(([tag, count]) => ({ tag, count }));

                const openGame = (game: any) => {
                  const full = games.find((g: any) => g.id === game.id) || game;
                  setShowStatsDetail(null);
                  setSelectedGame(full as any);
                };

                const spotlight = hasGamesLoaded
                  ? games[Math.floor(Date.now() / 86400000) % games.length]
                  : null;
                const spotlightSteamId = spotlight ? getSteamId(spotlight as any) : null;

                const longestWaiting = hasGamesLoaded
                  ? [...games].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).slice(0, 4)
                  : [];
                const oldest = longestWaiting[0] as any;
                const daysWaiting = (g: any) => Math.floor((Date.now() - new Date(g.created_at).getTime()) / 86400000);
                const waitLabel = (days: number) => {
                  if (days >= 365) { const y = Math.floor(days / 365); const m = Math.floor((days % 365) / 30); return y + 'y' + (m > 0 ? ' ' + m + 'm' : ''); }
                  if (days >= 30) return Math.floor(days / 30) + 'm';
                  return days + 'd';
                };

                const tagline = buildBacklogTagline(tagObjs, backlogCount, oldest?.title ?? null, spotlight?.title ?? null, oldest?.tags ?? null);

                const getBacklogSteamId = (game: any) => {
                  if (game.steam_url) { const m = game.steam_url.match(/\/app\/(\d+)/); return m ? m[1] : null; }
                  return null;
                };

                const upcomingCount = hasGamesLoaded ? games.filter((g: any) => !!getCountdown(g.release_date) || !!getVagueUpcoming(g.release_date)).length : 0;

                return (
                  <div className="space-y-6">

                    {/* 4-col hero stats */}
                    <div className="grid grid-cols-4 gap-3">
                      {([
                        { label: 'In Backlog',   value: backlogCount,         color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.25)' },
                        { label: 'On Game Pass', value: gpCount,              color: '#10b981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.25)' },
                        { label: 'Price Drops',  value: priceDrops.length,    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)' },
                        { label: 'Upcoming',     value: upcomingCount,        color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',   border: 'rgba(56,189,248,0.25)' },
                      ]).map(({ label, value, color, bg, border }) => (
                        <div key={label} className="rounded-2xl p-4 border" style={{ background: bg, borderColor: border }}>
                          <p className="text-[9px] font-mono uppercase tracking-widest mb-1.5" style={{ color: color + 'aa' }}>{label}</p>
                          <p className="text-3xl font-black" style={{ color }}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Today's Pick */}
                    {spotlight && (
                      <div className="relative overflow-hidden rounded-2xl cursor-pointer group h-32 border border-white/10"
                        onClick={() => openGame(spotlight)}>
                        {spotlightSteamId ? (
                          <img
                            src={`https://shared.steamstatic.com/store_item_assets/steam/apps/${spotlightSteamId}/library_hero.jpg`}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : null}
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.1) 100%)' }}/>
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, transparent 60%)' }}/>
                        <div className="relative h-full flex items-center gap-4 px-5">
                          <SuggestionThumb steamAppID={spotlightSteamId || undefined} title={spotlight.title} size="w-14 h-14"/>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-mono uppercase tracking-widest text-violet-400/70 mb-1">Today's Pick</p>
                            <p className="text-xl font-black truncate">{spotlight.title}</p>
                            {spotlight.genre && <p className="text-[10px] text-white/40 font-mono mt-0.5">{spotlight.genre}</p>}
                            <p className="text-[10px] italic text-white/30 mt-1.5">"Maybe today's the day?"</p>
                          </div>
                          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Price Drops */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingDown size={13} className="text-amber-400"/>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Price Drops</span>
                      </div>
                      {priceDrops.length > 0 ? (
                        <div className="space-y-1">
                          {priceDrops.map((game: any, idx: number) => (
                            <motion.div key={game.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}
                              onClick={() => openGame(game)}
                              className="flex items-center gap-3 cursor-pointer rounded-xl px-2 py-1.5 hover:bg-white/5 transition-colors group">
                              <SuggestionThumb steamAppID={getBacklogSteamId(game) || undefined} title={game.title} size="w-9 h-9"/>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold truncate">{game.title}</p>
                                <p className="text-[10px] text-white/30 font-mono mt-0.5">{game.genre || 'Unknown'}</p>
                              </div>
                              <div className="flex flex-col items-end">
                                {game.previous_price && <span className="text-[9px] font-mono text-white/30 line-through tabular-nums">{game.previous_price}</span>}
                                <span className="text-sm font-black tabular-nums" style={{ color: '#f59e0b' }}>{game.lowest_price}</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-white/20 italic px-2">No noticeable price drops right now.</p>
                      )}
                    </div>

                    {/* Game Pass */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <XboxIcon className="w-3.5 h-3.5 text-emerald-400"/>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Now on Game Pass</span>
                      </div>
                      {gamePassGames.length > 0 ? (
                        <div className="space-y-1">
                          {gamePassGames.map((game: any, idx: number) => (
                            <motion.div key={game.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}
                              onClick={() => openGame(game)}
                              className="flex items-center gap-3 cursor-pointer rounded-xl px-2 py-1.5 hover:bg-white/5 transition-colors">
                              <SuggestionThumb steamAppID={getBacklogSteamId(game) || undefined} title={game.title} size="w-9 h-9"/>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold truncate">{game.title}</p>
                                <p className="text-[10px] text-white/30 font-mono mt-0.5">{game.genre || 'Unknown'}</p>
                              </div>
                              <span className="text-[10px] font-mono text-white/30 shrink-0">{game.game_pass_added_at ? new Date(game.game_pass_added_at).toLocaleDateString('en-GB') : ''}</span>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-white/20 italic px-2">None recently added.</p>
                      )}
                    </div>

                    {/* Top Tags + Longest Waiting — 2-col bento */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Top Tags */}
                      <div className="rounded-2xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Top Tags</span>
                        {tagList.length > 0 ? (
                          <div className="space-y-2.5 mt-3">
                            {tagList.map(([tag, count], i) => {
                              const tagColors = ['#a78bfa','#38bdf8','#f59e0b','#10b981','#f43f5e'];
                              const c = tagColors[i] || '#ffffff';
                              return (
                                <div key={tag} className="flex items-center gap-2">
                                  <span className="text-[9px] font-mono w-16 shrink-0 truncate" style={{ color: c + 'cc' }}>{tag}</span>
                                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: (count / maxTag * 100) + '%' }}
                                      transition={{ delay: i * 0.05, duration: 0.5 }}
                                      className="h-full rounded-full" style={{ background: c }}/>
                                  </div>
                                  <span className="text-[9px] font-mono w-4 text-right shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-white/20 italic mt-3">Visit your Questlog tab to load tag data.</p>
                        )}
                      </div>

                      {/* Longest Waiting bento */}
                      <div className="rounded-2xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Longest Waiting</span>
                        {longestWaiting.length > 0 ? (
                          <div className="space-y-2.5 mt-3">
                            {longestWaiting.map((game: any, idx: number) => {
                              const days = daysWaiting(game);
                              const label = waitLabel(days);
                              const intensity = Math.min(days / 730, 1);
                              const cr = Math.round(167 + intensity * 68);
                              const cg = Math.round(139 - intensity * 110);
                              const cb = Math.round(250 - intensity * 200);
                              const accentColor = `rgb(${cr},${cg},${cb})`;
                              return (
                                <motion.div key={game.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}
                                  onClick={() => openGame(game)}
                                  className="flex items-center gap-2.5 cursor-pointer rounded-xl p-1 -m-1 hover:bg-white/5 transition-colors">
                                  <SuggestionThumb steamAppID={getSteamId(game as any) || undefined} title={game.title} size="w-8 h-8"/>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold truncate">{game.title}</p>
                                  </div>
                                  <span className="text-[10px] font-black shrink-0 tabular-nums px-1.5 py-0.5 rounded-full" style={{ color: accentColor, background: accentColor + '22' }}>{label}</span>
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-white/20 italic mt-3">Visit your Questlog tab to load data.</p>
                        )}
                      </div>
                    </div>

                    {/* Release Radar */}
                    {(() => {
                      const precise = games
                        .filter((g: any) => !!getCountdown(g.release_date))
                        .sort((a: any, b: any) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
                      const vague = games.filter((g: any) => !!getVagueUpcoming(g.release_date));
                      const all = [...precise, ...vague];
                      if (all.length === 0) return null;
                      return (
                        <div className="rounded-2xl p-4 border border-amber-500/20" style={{ background: 'rgba(245,158,11,0.04)' }}>
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar size={13} className="text-amber-400"/>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400/60">Release Radar</span>
                          </div>
                          <div className="space-y-2.5">
                            {all.map((game: any, idx: number) => {
                              const cd = getCountdown(game.release_date);
                              return (
                                <motion.div key={game.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                  onClick={() => openGame(game)}
                                  className="flex items-center gap-3 cursor-pointer rounded-xl p-1.5 -m-1.5 hover:bg-white/5 transition-colors">
                                  <SuggestionThumb steamAppID={getBacklogSteamId(game) || undefined} title={game.title} size="w-9 h-9"/>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold truncate">{game.title}</p>
                                    <p className="text-[10px] font-mono text-white/30 mt-0.5">{game.release_date}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    {cd ? (
                                      cd.days > 0 ? (
                                        <>
                                          <p className={cn("text-base font-black leading-none tabular-nums", cd.isImminent ? "text-amber-400" : "text-white/80")}>{cd.days}</p>
                                          <p className="text-[8px] font-mono uppercase text-white/30">days</p>
                                        </>
                                      ) : (
                                        <p className="text-[10px] font-black text-amber-400">Today!</p>
                                      )
                                    ) : (
                                      <p className="text-[10px] font-bold text-white/30">TBA</p>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
