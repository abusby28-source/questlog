import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Loader2, RefreshCw, Plus, Trash2, AlertTriangle,
  Gamepad2, Library, Eye, EyeOff, Clock, Check, Download, ChevronDown,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LauncherGame, User } from '../types';
import { TagDropdown } from '../components/TagDropdown';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// ── Inline icon components ────────────────────────────────────────────────────

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
  <svg viewBox="0 0 647.167 750.977" className={className}>
    <defs>
      <mask id="launcher-epic-icon-mask">
        <g transform="matrix(1.3333333,0,0,-1.3333333,-278.05173,902.58312)">
          <g transform="translate(649.8358,676.9377)">
            <path fill="white" fillRule="evenodd" d="m 0,0 -397.219,0 c -32.196,0 -44.078,-11.882 -44.078,-44.093 l 0,-388.676 c 0,-3.645 0.147,-7.031 0.469,-10.168 0.733,-7.031 0.871,-13.844 7.41,-21.601 0.639,-0.76 7.315,-5.728 7.315,-5.728 3.591,-1.761 6.043,-3.058 10.093,-4.688 l 195.596,-81.948 c 10.154,-4.655 14.4,-6.469 21.775,-6.323 l 0,-0.001 c 0.019,0 0.039,0 0.058,0 l 0,0.001 c 7.375,-0.146 11.621,1.668 21.776,6.323 l 195.595,81.948 c 4.051,1.63 6.502,2.927 10.094,4.688 0,0 6.676,4.968 7.314,5.728 6.539,7.757 6.677,14.57 7.41,21.601 0.322,3.137 0.47,6.523 0.47,10.168 l 0,388.676 C 44.078,-11.882 32.195,0 0,0" />
          </g>
          <g transform="translate(312.9946,481.1594)">
            <path fill="black" d="m 0,0 38.683,0 0,29.922 -38.683,0 0,61.086 40.223,0 0,29.922 -73.072,0 0,-215.951 73.684,0 0,29.923 -40.835,0 z" />
          </g>
          <g transform="translate(428.3257,506.1461)">
            <path fill="black" d="m 0,0 c 0,-8.639 -3.987,-12.652 -12.277,-12.652 l -13.511,0 0,79.596 13.511,0 C -3.987,66.944 0,62.935 0,54.298 Z m -7.061,95.944 -51.577,0 0,-215.952 32.85,0 0,78.362 18.727,0 c 26.711,0 39.911,13.263 39.911,40.1 l 0,57.384 c 0,26.842 -13.2,40.106 -39.911,40.106" />
          </g>
          <path fill="black" d="m 475.995,386.138 32.854,0 0,215.952 -32.854,0 z" />
          <g transform="translate(590.0699,474.6773)">
            <path fill="black" d="m 0,0 0,-48.744 c 0,-8.639 -3.993,-12.647 -12.278,-12.647 l -6.144,0 c -8.595,0 -12.588,4.008 -12.588,12.647 l 0,136.362 c 0,8.638 3.993,12.646 12.588,12.646 l 5.527,0 c 8.29,0 12.283,-4.008 12.283,-12.646 l 0,-42.269 32.233,0 0,44.12 c 0,26.837 -12.895,39.795 -39.6,39.795 l -15.969,0 C -50.654,129.264 -63.86,116 -63.86,89.158 l 0,-139.442 c 0,-26.843 13.206,-40.106 39.912,-40.106 l 16.274,0 c 26.712,0 39.911,13.263 39.911,40.106 l 0,50.284 z" />
          </g>
          <g transform="translate(357.6425,190.8749)">
            <path fill="black" fillRule="evenodd" d="M 0,0 188.054,0 92.068,-31.654 Z" />
          </g>
        </g>
      </mask>
    </defs>
    <rect width="647.167" height="750.977" fill="currentColor" mask="url(#launcher-epic-icon-mask)" />
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────────────

export interface LauncherPageProps {
  user: User | null;
  launcherGames: LauncherGame[];
  filteredLauncherGames: LauncherGame[];
  launcherSearch: string;
  launcherPlatformFilter: 'all' | 'steam' | 'xbox' | 'ea' | 'epic';
  launcherInstalledFilter: 'all' | 'installed' | 'not-installed';
  launcherSelectedTags: string[];
  openPlatformSettings: string | null;
  steamId: string;
  isSyncing: boolean;
  isSyncingHltb: boolean;
  confirmClearLibrary: boolean;
  showHiddenGames: boolean;
  setLauncherSearch: (v: string) => void;
  setLauncherPlatformFilter: (v: 'all' | 'steam' | 'xbox' | 'ea' | 'epic') => void;
  setLauncherInstalledFilter: (v: 'all' | 'installed' | 'not-installed') => void;
  setLauncherSelectedTags: (v: string[]) => void;
  setOpenPlatformSettings: (v: string | null) => void;
  setSteamId: (v: string) => void;
  setIsAddingLocalGame: (v: boolean) => void;
  setConfirmClearLibrary: (v: boolean) => void;
  setShowHiddenGames: (v: boolean) => void;
  setSelectedGame: (game: any) => void;
  handleSyncSteam: () => void;
  handleSyncXbox: () => void;
  handleSyncEa: () => void;
  handleSyncEpic: () => void;
  handleSyncHltb: () => void;
  handleRefreshLibrary: () => void;
  handleHideGame: (id: number) => void;
  handleUnhideGame: (id: number) => void;
  clearLauncherLibrary: () => void;
  fetchLauncherGameDetails: (id: number) => void;
}

// ── Page component ─────────────────────────────────────────────────────────────

export default function LauncherPage({
  user,
  launcherGames,
  filteredLauncherGames,
  launcherSearch,
  launcherPlatformFilter,
  launcherInstalledFilter,
  launcherSelectedTags,
  openPlatformSettings,
  steamId,
  isSyncing,
  isSyncingHltb,
  confirmClearLibrary,
  showHiddenGames,
  setLauncherSearch,
  setLauncherPlatformFilter,
  setLauncherInstalledFilter,
  setLauncherSelectedTags,
  setOpenPlatformSettings,
  setSteamId,
  setIsAddingLocalGame,
  setConfirmClearLibrary,
  setShowHiddenGames,
  setSelectedGame,
  handleSyncSteam,
  handleSyncXbox,
  handleSyncEa,
  handleSyncEpic,
  handleSyncHltb,
  handleRefreshLibrary,
  handleHideGame,
  handleUnhideGame,
  clearLauncherLibrary,
  fetchLauncherGameDetails,
}: LauncherPageProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-8">
        <div className="space-y-4 flex-1">
          <p className="text-xs font-mono uppercase tracking-[0.2em] opacity-50">Game Launcher</p>
          <h2 className="text-6xl font-light tracking-tight">Your <span className="italic font-serif">Library</span></h2>
          <div className="flex flex-col gap-4 pt-4">
            {/* 3-col grid: search | pill box | refresh. Connect panel spans cols 1–2 only,
                so its right edge always aligns with the pill box, not the refresh button. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 448px) auto auto', columnGap: '16px', rowGap: '8px', alignSelf: 'flex-start', maxWidth: '100%' }}>
              {/* Col 1: Search bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18}/>
                <input
                  type="text"
                  placeholder="Search library..."
                  value={launcherSearch}
                  onChange={(e) => setLauncherSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 focus:outline-none focus:border-white/30 transition-all text-sm"
                />
              </div>
              {/* Col 2: Platform pill box */}
              <div className="flex items-center">
                <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 gap-0.5">
                  {([
                    { id: 'steam' as const, icon: <SteamIcon className="w-4 h-4"/>, label: 'Steam', activeClass: 'bg-[#1b2838] text-[#c7d5e0]', inactiveClass: 'text-[#c7d5e0]/50 hover:text-[#c7d5e0]' },
                    { id: 'xbox' as const, icon: <XboxIcon className="w-4 h-4"/>, label: 'Xbox', activeClass: 'bg-[#107c10] text-white', inactiveClass: 'text-[#52b043]/60 hover:text-[#52b043]' },
                    { id: 'ea' as const, icon: <EAIcon className="w-4 h-4"/>, label: 'EA', activeClass: 'bg-[#ff4500] text-white', inactiveClass: 'text-[#ff6b35]/60 hover:text-[#ff6b35]' },
                    { id: 'epic' as const, icon: <EpicIcon className="w-4 h-4"/>, label: 'Epic', activeClass: 'bg-[#0078f2] text-white', inactiveClass: 'text-[#4da6ff]/60 hover:text-[#4da6ff]' },
                  ]).map(p => {
                    const isSelected = launcherPlatformFilter === p.id;
                    const isSettingsOpen = openPlatformSettings === p.id;
                    return (
                      <div key={p.id} className={cn('flex items-center rounded-full transition-all', isSelected ? p.activeClass : '')}>
                        <button
                          onClick={() => { setLauncherPlatformFilter(isSelected ? 'all' : p.id); setOpenPlatformSettings(null); }}
                          className={cn('flex items-center gap-1.5 py-2 rounded-full transition-all', isSelected ? 'pl-3 pr-1.5' : 'px-3', !isSelected && p.inactiveClass)}
                        >
                          {p.icon}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.span key="label" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-bold uppercase tracking-widest overflow-hidden whitespace-nowrap">
                                {p.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </button>
                        {isSelected && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenPlatformSettings(isSettingsOpen ? null : p.id); }}
                            className="pr-2 py-2 opacity-60 hover:opacity-100 transition-opacity"
                            title={`${p.label} settings`}
                          >
                            <ChevronDown size={11} className={cn('transition-transform', isSettingsOpen && 'rotate-180')}/>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Col 3: Refresh button — outside the connect panel span */}
              <button onClick={handleRefreshLibrary} disabled={isSyncing} className="p-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 self-center" title="Refresh Library">
                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''}/>
              </button>
              {/* Row 2: Connect panel — spans cols 1–2 only, ends at pill's right edge */}
              <AnimatePresence>
                {openPlatformSettings === 'steam' && (
                  <motion.div key="steam" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ gridColumn: '1 / 3' }} className="flex items-center gap-2 bg-[#1b2838]/60 p-2 rounded-2xl border border-[#c7d5e0]/15">
                    {steamId.trim() && <span className="pl-2 text-xs text-[#c7d5e0]/60 flex items-center gap-1.5 shrink-0"><Check size={12} className="text-emerald-500"/>Linked</span>}
                    <input type="text" placeholder="Enter Steam ID" value={steamId} onChange={(e) => setSteamId(e.target.value)} className="bg-transparent border-none px-4 py-2 text-sm focus:outline-none flex-1 min-w-0 text-[#c7d5e0] placeholder-[#c7d5e0]/30"/>
                    <button onClick={handleSyncSteam} disabled={isSyncing} className="shrink-0 bg-[#1b2838] text-[#c7d5e0] border border-[#c7d5e0]/30 px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#2a3f5f] transition-all disabled:opacity-50">
                      {isSyncing ? <Loader2 className="animate-spin" size={16}/> : steamId.trim() ? 'Sync Steam' : 'Connect Steam'}
                    </button>
                  </motion.div>
                )}
                {openPlatformSettings === 'xbox' && (
                  <motion.div key="xbox" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ gridColumn: '1 / 3' }} className="flex items-center gap-3 bg-[#107c10]/20 p-2 pl-4 rounded-2xl border border-[#107c10]/30">
                    {user?.xbox_id && <span className="text-xs text-[#52b043] flex items-center gap-1.5 shrink-0"><Check size={12}/>Linked</span>}
                    <div className="flex-1"/>
                    <button onClick={handleSyncXbox} disabled={isSyncing} className="shrink-0 bg-[#107c10] text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#158a15] transition-all disabled:opacity-50">
                      {isSyncing ? <Loader2 className="animate-spin" size={16}/> : user?.xbox_id ? 'Sync Xbox' : 'Connect Xbox'}
                    </button>
                  </motion.div>
                )}
                {openPlatformSettings === 'ea' && (
                  <motion.div key="ea" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ gridColumn: '1 / 3' }} className="flex items-center justify-end bg-[#ff4500]/20 p-2 rounded-2xl border border-[#ff4500]/30">
                    <button onClick={handleSyncEa} disabled={isSyncing} className="shrink-0 bg-[#ff4500] text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#e03d00] transition-all disabled:opacity-50">
                      {isSyncing ? <Loader2 className="animate-spin" size={16}/> : 'Sync EA Games'}
                    </button>
                  </motion.div>
                )}
                {openPlatformSettings === 'epic' && (
                  <motion.div key="epic" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ gridColumn: '1 / 3' }} className="flex items-center gap-3 bg-[#0078f2]/20 p-2 pl-4 rounded-2xl border border-[#0078f2]/30">
                    {user?.epic_account_id && <span className="text-xs text-[#4da6ff] flex items-center gap-1.5 shrink-0"><Check size={12}/>Linked</span>}
                    <div className="flex-1"/>
                    <button onClick={handleSyncEpic} disabled={isSyncing} className="shrink-0 bg-[#0078f2] text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0060cc] transition-all disabled:opacity-50">
                      {isSyncing ? <Loader2 className="animate-spin" size={16}/> : user?.epic_account_id ? 'Sync Library' : 'Connect Epic'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* HLTB sync */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>⏱</div>
                <div>
                  <p className="text-sm font-bold text-white/90">HowLongToBeat</p>
                  <p className="text-[10px] text-white/40">Sync completion data for all games</p>
                </div>
              </div>
              <button onClick={handleSyncHltb} disabled={isSyncingHltb}
                className="shrink-0 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>
                {isSyncingHltb ? <Loader2 className="animate-spin" size={14}/> : 'Sync HLTB'}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
                {(['all','installed','not-installed'] as const).map((filter) => (
                  <button key={filter} onClick={() => setLauncherInstalledFilter(filter)}
                    className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all", launcherInstalledFilter === filter ? "bg-white text-[#141414]" : "text-white/50 hover:text-white")}
                  >
                    {filter === 'all' ? 'All Games' : filter === 'installed' ? 'Installed' : 'Owned'}
                  </button>
                ))}
              </div>
              {Array.from(new Set(launcherGames.flatMap(g => g.tags ? g.tags.split(',').map(t => t.trim()) : []))).length > 0 && (
                <TagDropdown
                  availableTags={Array.from(new Set(launcherGames.flatMap(g => g.tags ? g.tags.split(',').map(t => t.trim()) : []))).sort()}
                  selectedTags={launcherSelectedTags}
                  setSelectedTags={setLauncherSelectedTags}
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <button onClick={() => setIsAddingLocalGame(true)} className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 transition-all text-sm font-bold uppercase tracking-widest shadow-lg shadow-emerald-900/20">
            <Plus size={18}/> Add Game
          </button>
          {launcherGames.length > 0 && (
            <div className="relative flex items-center">
              {confirmClearLibrary ? (
                <div className="flex items-center gap-2 bg-red-100 p-1.5 rounded-full border border-red-900/50 animate-in fade-in slide-in-from-right-4 shadow-sm">
                  <AlertTriangle size={16} className="text-red-600 ml-2"/>
                  <span className="text-sm font-bold text-red-400 mr-1">Clear entire library?</span>
                  <button
                    onClick={() => setConfirmClearLibrary(false)}
                    className="px-4 py-2 bg-[#1a1a1a] text-red-400 rounded-full text-xs font-bold hover:bg-red-900/20 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={clearLauncherLibrary}
                    className="px-4 py-2 bg-red-600 text-white rounded-full text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Yes, Clear
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClearLibrary(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-900/20 text-red-600 hover:bg-red-900/40 hover:text-red-400 transition-colors font-bold text-sm cursor-pointer border border-red-900/30"
                >
                  <Trash2 size={18}/>
                  <span className="hidden sm:inline">
                    Clear Library
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {launcherGames.length === 0 ? (
        <div className="py-24 text-center space-y-6">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
            <Gamepad2 size={32} className="opacity-20"/>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">No games in library</h3>
            <p className="text-white/50 max-w-md mx-auto">Sync your Steam library or add local games to start using QuestLog as your primary game launcher.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2.5">
              <Library size={12} className="text-blue-500/60"/>
              {showHiddenGames ? 'Hidden Games' : 'Library'}
              <span className="font-normal normal-case tracking-normal text-white/30">{filteredLauncherGames.length} games</span>
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowHiddenGames(!showHiddenGames)}
                className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors border cursor-pointer",
                  showHiddenGames
                    ? "bg-violet-600 text-white border-violet-500"
                    : "bg-white/5 text-white/40 border-white/10 hover:border-violet-500/40 hover:text-white/60")}>
                {showHiddenGames ? <Eye size={12}/> : <EyeOff size={12}/>}
                {showHiddenGames ? 'Show Library' : 'Show Hidden'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredLauncherGames
              .map(game => (
                <motion.div
                  key={game.id}
                  layoutId={`launcher-game-${game.id}`}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onClick={() => { setSelectedGame(game as any); fetchLauncherGameDetails(game.id); }}
                  className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#1a1a1a] shadow-lg ring-1 ring-white/10 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors"/>
                  {!game.installed && (
                    <div className="absolute inset-0 bg-black/40 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-black/60 px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
                        <Download size={14} className="text-white/70"/>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Owned</span>
                      </div>
                    </div>
                  )}
                  <img src={game.artwork} alt={game.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" referrerPolicy="no-referrer" onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src.includes('library_capsule_2x.jpg')) {
                        target.src = target.src.replace('library_capsule_2x.jpg','library_capsule.jpg');
                      } else if (target.src.includes('library_capsule.jpg')) {
                        target.src = target.src.replace('library_capsule.jpg','library_600x900.jpg');
                      } else {
                        target.src = 'https://picsum.photos/seed/game/600/900';
                      }
                    }}
                  />
                  <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="font-bold text-sm leading-tight mb-2 drop-shadow-lg line-clamp-2">{game.title}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-white/60">
                          <Clock size={10} className="text-emerald-500"/>
                          {Math.round(game.playtime / 60)}h
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); game.hidden ? handleUnhideGame(game.id) : handleHideGame(game.id); }}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
                          title={game.hidden ? "Unhide Game" : "Hide Game"}
                        >
                          {game.hidden ? <Eye size={14}/> : <EyeOff size={14}/>}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    {game.platform === 'steam' ? <SteamIcon className="w-3 h-3 text-white"/> : game.platform === 'ea' ? <EAIcon className="w-4 h-4 text-white"/> : game.platform === 'epic' ? <EpicIcon className="w-3 h-3 text-white"/> : <XboxIcon className="w-3 h-3 text-white"/>}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
