import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp } from 'lucide-react';
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

// ── Types (mirrors App.tsx) ───────────────────────────────────────────────────

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
  isFixingArtwork?: boolean;
  artworkFailed?: boolean;
  tags?: string;
  genre?: string;
  game_pass?: number;
  release_date?: string;
  installed?: boolean;
  hidden?: boolean;
  steam_url?: string;
  lowest_price?: string;
  metacritic?: number;
  steam_rating?: string;
  allkeyshop_url?: string;
  description?: string;
  hltb_main?: number | null;
  matchedTags?: string[];
}

interface FriendEntry { id: number | string; username: string; avatar?: string; online_status: string; current_game?: string; }

// ── Props ─────────────────────────────────────────────────────────────────────

export interface InProgressModalProps {
  showProgressModal: boolean;
  setShowProgressModal: (v: boolean) => void;
  launcherGames: LauncherGame[];
  user: any;
  appFriends: FriendEntry[];
  companionProgress: Record<number | string, any[]>;
  parseAchievements: (game: LauncherGame) => { unlocked: number; total: number } | null;
  isProgressGame: (game: LauncherGame) => boolean;
  hltbProgress: (game: LauncherGame) => number | null;
  setSelectedGame: (g: any) => void;
  fetchLauncherGameDetails: (id: number) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InProgressModal(props: InProgressModalProps) {
  const {
    showProgressModal, setShowProgressModal, launcherGames, user,
    appFriends, companionProgress, parseAchievements, isProgressGame,
    hltbProgress, setSelectedGame, fetchLauncherGameDetails,
  } = props;

  return (
    <AnimatePresence>
      {showProgressModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProgressModal(false)} className="absolute inset-0 bg-black/85"/>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.15 }}
            className="relative w-full max-w-3xl bg-[#1a1a1a] rounded-[40px] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute inset-0 pointer-events-none z-10" style={{ boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)', borderRadius: 'inherit' }}/>
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tighter uppercase italic font-serif flex items-center gap-3">
                <TrendingUp className="text-teal-500" size={24}/>
                In Progress
              </h2>
              <button onClick={() => setShowProgressModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"><X size={24}/></button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
              {(() => {
                const allStarted = launcherGames.filter(g => (g.playtime ?? 0) > 0);
                const withPcts = allStarted.map(game => {
                  const ach = parseAchievements(game);
                  const achPct = ach ? ach.unlocked / ach.total : null;
                  const hpct = isProgressGame(game) ? hltbProgress(game) : null;
                  const hasCombo = achPct !== null && hpct !== null;
                  const completedByAch = achPct !== null && achPct >= 1;
                  const completedByHltb = hpct !== null && hpct >= 1;
                  const isComplete = completedByAch || completedByHltb;
                  const pct = hasCombo ? (achPct! + hpct!) / 2 : achPct ?? hpct ?? 0;
                  const barType = achPct !== null ? 'ach' : 'hltb';
                  const steamId = game.platform === 'steam' ? game.external_id : undefined;
                  const heroBannerUrl = steamId
                    ? `https://shared.steamstatic.com/store_item_assets/steam/apps/${steamId}/library_hero.jpg`
                    : game.artwork;
                  return { game, pct, barType, ach, achPct, hpct, hasCombo, isComplete, completedByAch, completedByHltb, steamId, heroBannerUrl };
                });
                const gamePcts = withPcts.filter(g => !g.isComplete).sort((a, b) => b.pct - a.pct);
                const completedList = withPcts.filter(g => g.isComplete);
                const avgPct = gamePcts.length ? Math.round(gamePcts.reduce((s, g) => s + g.pct, 0) / gamePcts.length * 100) : 0;
                const spotlight = gamePcts[0];
                const achCount = withPcts.filter(g => g.achPct !== null && !g.isComplete).length;
                const hltbCount = withPcts.filter(g => g.hpct !== null && !g.isComplete).length;
                const comboCount = withPcts.filter(g => g.hasCombo && !g.isComplete).length;
                const medals = ['🥇','🥈','🥉'];

                const renderBar = (g: typeof withPcts[0], delay: number, height = 'h-1.5') => {
                  if (g.hasCombo) {
                    return (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-bold text-emerald-400/50 w-10 shrink-0">Ach</span>
                          <div className={`flex-1 ${height} rounded-full overflow-hidden`} style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${g.achPct! * 100}%` }} transition={{ delay: delay + 0.05, duration: 0.6, ease: 'easeOut' }}
                              className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)' }}/>
                          </div>
                          <span className="text-[9px] font-mono text-emerald-400/60 w-8 text-right shrink-0">{Math.round(g.achPct! * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-bold text-indigo-400/50 w-10 shrink-0">HLTB</span>
                          <div className={`flex-1 ${height} rounded-full overflow-hidden`} style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${g.hpct! * 100}%` }} transition={{ delay: delay + 0.1, duration: 0.6, ease: 'easeOut' }}
                              className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }}/>
                          </div>
                          <span className="text-[9px] font-mono text-indigo-400/60 w-8 text-right shrink-0">{Math.round(g.hpct! * 100)}%</span>
                        </div>
                      </div>
                    );
                  }
                  const barGrad = g.barType === 'ach' ? 'linear-gradient(90deg,#10b981,#06b6d4)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)';
                  const glowColor = g.barType === 'ach' ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.4)';
                  return (
                    <div className={`${height} rounded-full overflow-hidden`} style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${g.pct * 100}%` }} transition={{ delay, duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full" style={{ background: barGrad, boxShadow: g.pct > 0.5 ? `0 0 6px ${glowColor}` : undefined }}/>
                    </div>
                  );
                };
                return (
                  <>
                    {/* Next Finish Line spotlight */}
                    {spotlight && (
                      <div className="relative overflow-hidden rounded-3xl border border-teal-500/20 cursor-pointer group/spot"
                        style={{ background: 'linear-gradient(135deg,rgba(20,184,166,0.12) 0%,rgba(6,182,212,0.06) 100%)' }}
                        onClick={() => { setShowProgressModal(false); setSelectedGame(spotlight.game as any); fetchLauncherGameDetails(spotlight.game.id); }}>
                        {(spotlight.heroBannerUrl || spotlight.game.artwork) && (
                          <div className="relative h-36 overflow-hidden">
                            <img src={spotlight.heroBannerUrl || spotlight.game.artwork} alt=""
                              className="w-full h-full object-cover opacity-40 group-hover/spot:opacity-55 transition-opacity scale-105"
                              onError={(e) => { const t = e.target as HTMLImageElement; if (t.src !== spotlight.game.artwork) t.src = spotlight.game.artwork; }}/>
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1a1a]"/>
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent pointer-events-none"/>
                            <div className="absolute top-3 right-4">
                              <div className="w-14 h-14 rounded-full border-4 flex items-center justify-center text-sm font-black"
                                style={{ borderColor: `hsl(${140 * spotlight.pct},70%,50%)`, color: `hsl(${140 * spotlight.pct},70%,65%)`, boxShadow: `0 0 20px hsla(${140 * spotlight.pct},70%,50%,0.45)` }}>
                                {Math.round(spotlight.pct * 100)}%
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="px-6 pb-5 pt-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400/60 mb-1">Next Finish Line</p>
                          <p className="text-xl font-black text-white mb-3">{spotlight.game.title}</p>
                          {renderBar(spotlight, 0, 'h-2.5')}
                          <p className="text-[10px] text-white/35 italic mt-2">{spotlight.pct > 0.8 ? 'Almost there — push through!' : spotlight.pct > 0.5 ? 'Over halfway — keep the momentum!' : 'Getting started — good luck!'}</p>
                        </div>
                      </div>
                    )}

                    {/* Hero stats — 2 col */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-5">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-teal-400/60 mb-1">In Progress</p>
                        <p className="text-4xl font-black text-teal-400">{gamePcts.length}</p>
                        <p className="text-[10px] text-teal-400/40 mt-1">active games</p>
                      </div>
                      <div className="rounded-2xl p-5 border" style={{ background: `hsla(${avgPct * 1.4},60%,50%,0.1)`, borderColor: `hsla(${avgPct * 1.4},60%,50%,0.25)` }}>
                        <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: `hsla(${avgPct * 1.4},60%,65%,0.7)` }}>Avg Complete</p>
                        <p className="text-4xl font-black" style={{ color: `hsl(${avgPct * 1.4},60%,65%)` }}>{avgPct}<span className="text-xl opacity-50">%</span></p>
                        <p className="text-[10px] mt-1" style={{ color: `hsla(${avgPct * 1.4},60%,65%,0.4)` }}>across all games</p>
                      </div>
                    </div>

                    {/* Tracking Methods */}
                    {gamePcts.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Tracking Methods</h3>
                        <div className="flex gap-3">
                          {achCount > 0 && (
                            <div className="flex-1 rounded-2xl p-4 border border-emerald-500/20" style={{ background: 'rgba(16,185,129,0.08)' }}>
                              <p className="text-2xl font-black text-emerald-400">{achCount}</p>
                              <p className="text-[10px] font-bold text-emerald-400/50 uppercase tracking-wider mt-0.5">Achievements</p>
                              <div className="mt-2 h-1 bg-emerald-500/15 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(achCount / gamePcts.length) * 100}%` }} transition={{ duration: 0.5 }} className="h-full bg-emerald-400 rounded-full"/>
                              </div>
                            </div>
                          )}
                          {hltbCount > 0 && (
                            <div className="flex-1 rounded-2xl p-4 border border-indigo-500/20" style={{ background: 'rgba(99,102,241,0.08)' }}>
                              <p className="text-2xl font-black text-indigo-400">{hltbCount}</p>
                              <p className="text-[10px] font-bold text-indigo-400/50 uppercase tracking-wider mt-0.5">HowLongToBeat</p>
                              <div className="mt-2 h-1 bg-indigo-500/15 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(hltbCount / gamePcts.length) * 100}%` }} transition={{ duration: 0.5, delay: 0.1 }} className="h-full bg-indigo-400 rounded-full"/>
                              </div>
                            </div>
                          )}
                          {comboCount > 0 && (
                            <div className="flex-1 rounded-2xl p-4 border border-purple-500/20" style={{ background: 'rgba(168,85,247,0.08)' }}>
                              <p className="text-2xl font-black text-purple-400">{comboCount}</p>
                              <p className="text-[10px] font-bold text-purple-400/50 uppercase tracking-wider mt-0.5">Ach + HLTB</p>
                              <div className="mt-2 h-1 bg-purple-500/15 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(comboCount / gamePcts.length) * 100}%` }} transition={{ duration: 0.5, delay: 0.15 }} className="h-full bg-purple-400 rounded-full"/>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress Ladder */}
                    {gamePcts.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Progress Ladder</h3>
                        <div className="space-y-2">
                          {gamePcts.map((g, idx) => {
                            const { game, pct, barType, ach, hpct, hasCombo } = g;
                            const pctColor = hasCombo ? '#c084fc' : barType === 'hltb' ? '#818cf8' : `hsl(${140 * pct},80%,60%)`;
                            const hrs = Math.round((game.playtime ?? 0) / 60 * 10) / 10;
                            const detail = hasCombo && ach && game.hltb_main
                              ? `${ach.unlocked}/${ach.total} achievements · ${hrs}h / ~${game.hltb_main}h (HowLongToBeat)`
                              : barType === 'ach' && ach ? `${ach.unlocked}/${ach.total} achievements`
                              : game.hltb_main && game.hltb_main > 0 ? `${hrs}h played · ~${game.hltb_main}h main story (HowLongToBeat)`
                              : `${hrs}h played`;
                            return (
                              <motion.div key={game.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-all border border-transparent hover:border-white/8"
                                onClick={() => { setShowProgressModal(false); setSelectedGame(game as any); fetchLauncherGameDetails(game.id); }}>
                                <span className="w-6 text-center shrink-0 text-base">{idx < 3 ? medals[idx] : <span className="text-xs font-black text-white/20">{idx + 1}</span>}</span>
                                <SuggestionThumb steamAppID={g.steamId || undefined} title={game.title} fallbackThumb={game.artwork} size="w-10 h-10 rounded-xl"/>
                                <div className="flex-1 min-w-0 space-y-1">
                                  <p className="text-sm font-bold truncate">{game.title}</p>
                                  {renderBar(g, 0.1 + idx * 0.05)}
                                  <p className="text-[10px] text-white/30">{detail}</p>
                                </div>
                                {!hasCombo && <span className="text-lg font-black shrink-0 tabular-nums" style={{ color: pctColor }}>{Math.round(pct * 100)}%</span>}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Friends Race */}
                    {appFriends.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Friends' Race</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-4 rounded-2xl border border-teal-500/20" style={{ background: 'rgba(20,184,166,0.08)' }}>
                            {user?.avatar
                              ? <img src={user.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt=""/>
                              : <div className="w-9 h-9 rounded-full bg-teal-500/30 flex items-center justify-center text-xs font-black text-teal-300 shrink-0">{user?.username?.[0]?.toUpperCase()}</div>
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-teal-300">You</p>
                              <p className="text-[10px] text-white/30">{gamePcts.length} in progress</p>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(20,184,166,0.15)' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${avgPct}%` }} transition={{ duration: 0.5 }} className="h-full bg-teal-400 rounded-full"/>
                              </div>
                              <span className="text-sm font-black text-teal-400 w-12 text-right tabular-nums">{avgPct}%</span>
                            </div>
                          </div>
                          {appFriends.map((friend, idx) => {
                            const fGames = companionProgress[friend.id];
                            const fPcts = fGames ? fGames.map((g: any) => {
                              const fa = (() => { try { const a = JSON.parse(g.achievements || '[]') as {unlocked:boolean}[]; return a.length > 0 ? {unlocked: a.filter((x:any)=>x.unlocked).length, total: a.length} : null; } catch { return null; } })();
                              const fachPct = fa ? fa.unlocked / fa.total : null;
                              const fhpct = (g.hltb_main && g.hltb_main > 0) ? Math.min(1, g.playtime / (g.hltb_main * 60)) : null;
                              return fachPct ?? fhpct ?? Math.min(1, g.playtime / 3000);
                            }) : null;
                            const fAvg = fPcts && fPcts.length ? Math.round(fPcts.reduce((s: number, p: number) => s + p, 0) / fPcts.length * 100) : null;
                            const isAhead = fAvg !== null && fAvg > avgPct;
                            return (
                              <motion.div key={friend.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/8 hover:border-white/10 transition-all">
                                {friend.avatar
                                  ? <img src={friend.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" referrerPolicy="no-referrer"/>
                                  : <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-black shrink-0">{friend.username[0]?.toUpperCase()}</div>
                                }
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-bold truncate">{friend.username}</p>
                                    {isAhead && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20 shrink-0">Ahead of you!</span>}
                                    {fAvg !== null && !isAhead && fAvg < avgPct && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shrink-0">You're winning</span>}
                                  </div>
                                  <p className="text-[10px] text-white/30">{fGames ? `${fGames.length} in progress` : 'Loading...'}</p>
                                </div>
                                {fAvg !== null ? (
                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                      <motion.div initial={{ width: 0 }} animate={{ width: `${fAvg}%` }} transition={{ duration: 0.5, delay: 0.1 + idx * 0.05 }}
                                        className="h-full rounded-full" style={{ background: isAhead ? 'linear-gradient(90deg,#f43f5e,#fb7185)' : 'rgba(255,255,255,0.3)' }}/>
                                    </div>
                                    <span className="text-sm font-black w-12 text-right tabular-nums" style={{ color: isAhead ? '#fb7185' : 'rgba(255,255,255,0.4)' }}>{fAvg}%</span>
                                  </div>
                                ) : !fGames ? (
                                  <div className="w-24 h-1.5 bg-white/10 rounded-full animate-pulse shrink-0"/>
                                ) : null}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Completed Games */}
                    {completedList.length > 0 && (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">Completed</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">{completedList.length} game{completedList.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-2">
                          {completedList.map((g, idx) => {
                            const { game, completedByAch, completedByHltb, ach } = g;
                            const howLabel = completedByAch && completedByHltb ? 'Achievements + HowLongToBeat'
                              : completedByAch ? (ach ? `${ach.total}/${ach.total} achievements` : 'All achievements')
                              : `~${game.hltb_main}h via HowLongToBeat`;
                            return (
                              <motion.div key={game.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                                className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-all border border-emerald-500/10 hover:border-emerald-500/20"
                                style={{ background: 'rgba(16,185,129,0.04)' }}
                                onClick={() => { setShowProgressModal(false); setSelectedGame(game as any); fetchLauncherGameDetails(game.id); }}>
                                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-black/40 relative">
                                  <SuggestionThumb steamAppID={g.steamId || undefined} title={game.title} fallbackThumb={game.artwork} size="w-10 h-10 rounded-xl opacity-60"/>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-base">✅</span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate text-white/70">{game.title}</p>
                                  <p className="text-[10px] text-emerald-400/60">{howLabel}</p>
                                </div>
                                <span className="text-xs font-black text-emerald-400/60 shrink-0">Done</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
