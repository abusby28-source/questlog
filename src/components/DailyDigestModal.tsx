import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, X, TrendingDown, Users, Library, Gamepad2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const XboxIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 372.36823 372.57281" fill="currentColor" className={className}>
    <g transform="translate(-1.5706619,12.357467)">
      <path d="M 169.18811,359.44924 C 140.50497,356.70211 111.4651,346.40125 86.518706,330.1252 65.614374,316.48637 60.893704,310.87967 60.893704,299.69061 c 0,-22.47524 24.711915,-61.84014 66.992496,-106.71584 24.01246,-25.48631 57.46022,-55.36001 61.0775,-54.55105 7.0309,1.57238 63.25048,56.41053 84.29655,82.2252 33.28077,40.82148 48.58095,74.24535 40.808,89.14682 -5.9087,11.32753 -42.57224,33.4669 -69.50775,41.97242 -22.19984,7.01011 -51.35538,9.9813 -75.37239,7.68108 z M 32.660004,276.3228 C 15.288964,249.67326 6.5125436,223.43712 2.2752336,185.49086 c -1.39917002,-12.53 -0.89778,-19.69701 3.17715,-45.41515 5.0788204,-32.05404 23.3330104,-69.136381 45.2671304,-91.957616 9.34191,-9.719732 10.17624,-9.956543 21.56341,-6.120482 13.828357,4.658436 28.595936,14.857457 51.498366,35.56661 l 13.36254,12.082873 -7.2969,8.96431 C 95.97448,140.22403 60.217254,199.2085 46.741444,235.70071 c -7.32599,19.83862 -10.28084,39.75281 -7.12868,48.04363 2.12818,5.59752 0.17339,3.51093 -6.95276,-7.42154 z m 304.915426,4.53255 c 1.71605,-8.37719 -0.4544,-23.76257 -5.5413,-39.28002 -11.01667,-33.60598 -47.83964,-96.12421 -81.65282,-138.63054 L 239.73699,89.563875 251.25285,78.989784 c 15.03631,-13.806637 25.47602,-22.073835 36.74025,-29.094513 8.88881,-5.540156 21.59109,-10.444558 27.05113,-10.444558 3.36626,0 15.21723,12.298726 24.78421,25.720611 14.81725,20.787711 25.71782,45.986976 31.24045,72.219686 3.56833,16.9498 3.8657,53.23126 0.57486,70.13935 -2.70068,13.87582 -8.40314,31.87484 -13.9661,44.08195 -4.16823,9.14657 -14.53521,26.91044 -19.0783,32.69074 -2.33569,2.97175 -2.33761,2.96527 -1.02393,-3.4477 z M 172.25917,33.104812 c -15.60147,-7.922671 -39.6696,-16.427164 -52.96493,-18.715209 -4.66097,-0.802124 -12.61193,-1.249474 -17.6688,-0.994114 -10.969613,0.55394 -10.479662,-0.0197 7.11783,-8.3336652 14.63023,-6.912081 26.83386,-10.976696 43.40044,-14.455218 18.6362,-3.9130858 53.66559,-3.9590088 72.00507,-0.0944 19.80818,4.174105 43.13297,12.854085 56.27623,20.9423862 l 3.90633,2.403927 -8.96247,-0.452584 c -17.81002,-0.899366 -43.76575,6.295879 -71.63269,19.857459 -8.40538,4.090523 -15.71788,7.357511 -16.25,7.25997 -0.53211,-0.09754 -7.38426,-3.43589 -15.22701,-7.418555 z"/>
    </g>
  </svg>
);

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

interface DailyDigestModalProps {
  showDailyDigest: boolean;
  sessionInvites: any[];
  homeData: any;
  digestLastSeen: string | null;
  digestLibraryActivity: any[];
  user: any;
  games: any[];
  setShowDailyDigest: (v: boolean) => void;
  dismissSessionInvite: (id: number) => void;
  setSelectedGame: (g: any) => void;
  addToCalendar: (invite: any) => void;
}

export default function DailyDigestModal(props: DailyDigestModalProps) {
  const {
    showDailyDigest, sessionInvites, homeData, digestLastSeen, digestLibraryActivity,
    user, games, setShowDailyDigest, dismissSessionInvite, setSelectedGame, addToCalendar,
  } = props;

  return (
    <AnimatePresence>
      {showDailyDigest && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[190] bg-black/70 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-0.5">
                  {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
                </p>
                <h2 className="text-xl font-bold italic font-serif tracking-tighter uppercase text-white">What's New</h2>
              </div>
              <button onClick={() => { setShowDailyDigest(false); sessionInvites.forEach(i => dismissSessionInvite(i.id)); }} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <X size={14} className="text-white/50"/>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto px-6 pb-6 space-y-5 flex-1">

              {/* Session invites */}
              {sessionInvites.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={13} className="text-emerald-400"/>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Play Together</span>
                  </div>
                  <div className="space-y-2">
                    {sessionInvites.map(invite => (
                      <div key={invite.id} className="bg-white/5 border border-white/10 rounded-2xl p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              {invite.created_by_avatar && (
                                <img src={invite.created_by_avatar} alt={invite.created_by_username} className="w-4 h-4 rounded-full object-cover"/>
                              )}
                              <span className="text-[10px] font-bold text-emerald-400">{invite.created_by_username}</span>
                              <span className="text-[10px] text-white/30">wants to play</span>
                            </div>
                            <p className="font-bold italic font-serif tracking-tighter uppercase text-white text-sm leading-tight truncate">{invite.game_title}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock size={9} className="text-white/30 shrink-0"/>
                              <span className="text-[10px] text-white/50">
                                {new Date(invite.scheduled_at).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {invite.message && <p className="text-[10px] text-white/40 mt-1 italic">"{invite.message}"</p>}
                          </div>
                          <button onClick={() => dismissSessionInvite(invite.id)} className="shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                            <X size={10} className="text-white/60"/>
                          </button>
                        </div>
                        <button
                          onClick={() => addToCalendar(invite)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest text-emerald-400 transition-colors"
                        >
                          <Calendar size={10}/>
                          Add to Calendar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shared log additions by others */}
              {(() => {
                const newShared = (homeData?.sharedLogActivity || []).filter(g =>
                  !digestLastSeen || new Date(g.created_at) > new Date(digestLastSeen)
                );
                if (newShared.length === 0) return null;
                return (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users size={13} className="text-purple-400"/>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Added to Shared Log</span>
                    </div>
                    <div className="space-y-1">
                      {newShared.map((game: any, idx: number) => (
                        <motion.div key={game.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}
                          className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                          <SuggestionThumb steamAppID={undefined} title={game.title} size="w-9 h-9"/>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold truncate">{game.title}</p>
                            <p className="text-[10px] text-white/30 font-mono mt-0.5 truncate">
                              <span className="text-purple-400">{game.added_by}</span> · {game.group_name}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Library adds by group members */}
              {(() => {
                const newLibrary = digestLibraryActivity.filter(a =>
                  a.username !== user?.username &&
                  (!digestLastSeen || new Date(a.created_at) > new Date(digestLastSeen))
                );
                if (newLibrary.length === 0) return null;
                return (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Library size={13} className="text-indigo-400"/>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Added to Library</span>
                    </div>
                    <div className="space-y-1">
                      {newLibrary.map((item: any, idx: number) => (
                        <motion.div key={item.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}
                          className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                          <SuggestionThumb steamAppID={undefined} title={item.game_title} size="w-9 h-9"/>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold truncate">{item.game_title}</p>
                            <p className="text-[10px] text-white/30 font-mono mt-0.5 truncate">
                              <span className="text-indigo-300">{item.username}</span> · {item.group_name}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Price drops */}
              {(homeData?.updates?.priceDrops?.length ?? 0) > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown size={13} className="text-amber-400"/>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Price Drops</span>
                  </div>
                  <div className="space-y-1">
                    {homeData!.updates.priceDrops.map((game: any, idx: number) => (
                      <motion.div key={game.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}
                        onClick={() => { setShowDailyDigest(false); setSelectedGame((games.find((g: any) => g.id === game.id) || game) as any); }}
                        className="flex items-center gap-3 cursor-pointer rounded-xl px-2 py-1.5 hover:bg-white/5 transition-colors">
                        <SuggestionThumb steamAppID={game.steam_url?.match(/\/app\/(\d+)/)?.[1]} title={game.title} size="w-9 h-9"/>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold truncate">{game.title}</p>
                          <p className="text-[10px] text-white/30 font-mono mt-0.5">{game.genre || 'Unknown'}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          {game.previous_price && <span className="text-[9px] font-mono text-white/30 line-through tabular-nums">{game.previous_price}</span>}
                          <span className="text-sm font-black tabular-nums text-amber-400">{game.lowest_price}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Game Pass */}
              {(homeData?.updates?.gamePass?.length ?? 0) > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <XboxIcon className="w-3.5 h-3.5 text-emerald-400"/>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Now on Game Pass</span>
                  </div>
                  <div className="space-y-1">
                    {homeData!.updates.gamePass.map((game: any, idx: number) => (
                      <motion.div key={game.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}
                        onClick={() => { setShowDailyDigest(false); setSelectedGame((games.find((g: any) => g.id === game.id) || game) as any); }}
                        className="flex items-center gap-3 cursor-pointer rounded-xl px-2 py-1.5 hover:bg-white/5 transition-colors">
                        <SuggestionThumb steamAppID={game.steam_url?.match(/\/app\/(\d+)/)?.[1]} title={game.title} size="w-9 h-9"/>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold truncate">{game.title}</p>
                          <p className="text-[10px] text-white/30 font-mono mt-0.5">{game.genre || 'Unknown'}</p>
                        </div>
                        <span className="text-[10px] font-mono text-white/30 shrink-0">{game.game_pass_added_at ? new Date(game.game_pass_added_at).toLocaleDateString('en-GB') : ''}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nothing to show */}
              {sessionInvites.length === 0 && (homeData?.updates?.priceDrops?.length ?? 0) === 0 && (homeData?.updates?.gamePass?.length ?? 0) === 0 && (homeData?.sharedLogActivity?.filter((g: any) => !digestLastSeen || new Date(g.created_at) > new Date(digestLastSeen)).length ?? 0) === 0 && (
                <p className="text-[11px] text-white/20 italic text-center py-4">You're all caught up!</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 shrink-0">
              <button
                onClick={() => { setShowDailyDigest(false); sessionInvites.forEach(i => dismissSessionInvite(i.id)); }}
                className="w-full py-2.5 rounded-xl bg-white text-[#141414] text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-colors"
              >
                All good!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
