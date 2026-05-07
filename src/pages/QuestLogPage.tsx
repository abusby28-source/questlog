import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, RefreshCw, Plus, Trash2, AlertTriangle, BookOpen, Gamepad2,
  Calendar, Tag, ChevronRight, Loader2, X, ArrowUpRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TagDropdown } from '../components/TagDropdown';
import { MemberAvatar } from '../components/FriendBubble';
import { getCountdown } from '../utils/gameUtils';
import type { Game, User, Group, LauncherGame } from '../types';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

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
      <mask id="ql-epic-mask">
        <g transform="matrix(1.3333333,0,0,-1.3333333,-278.05173,902.58312)">
          <g transform="translate(649.8358,676.9377)">
            <path fill="white" fillRule="evenodd" d="m 0,0 -397.219,0 c -32.196,0 -44.078,-11.882 -44.078,-44.093 l 0,-388.676 c 0,-3.645 0.147,-7.031 0.469,-10.168 0.733,-7.031 0.871,-13.844 7.41,-21.601 0.639,-0.76 7.315,-5.728 7.315,-5.728 3.591,-1.761 6.043,-3.058 10.093,-4.688 l 195.596,-81.948 c 10.154,-4.655 14.4,-6.469 21.775,-6.323 l 0,-0.001 c 0.019,0 0.039,0 0.058,0 l 0,0.001 c 7.375,-0.146 11.621,1.668 21.776,6.323 l 195.595,81.948 c 4.051,1.63 6.502,2.927 10.094,4.688 0,0 6.676,4.968 7.314,5.728 6.539,7.757 6.677,14.57 7.41,21.601 0.322,3.137 0.47,6.523 0.47,10.168 l 0,388.676 C 44.078,-11.882 32.195,0 0,0" />
          </g>
        </g>
      </mask>
    </defs>
    <rect width="647.167" height="750.977" fill="currentColor" mask="url(#ql-epic-mask)" />
  </svg>
);

const MetacriticIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 202 202" className={className} xmlns="http://www.w3.org/2000/svg"><g strokeWidth=".04"><path d="M185.89 98.45a87.45 87.45 0 1 1 0-.105"/><path d="m87.045 165.685 17.05-17.05L71.26 115.8c-1.38-1.38-2.88-3.11-3.685-5.07-1.845-3.915-2.65-10.02 1.845-14.515 5.53-5.53 12.9-3.225 20.045 3.92L121.03 131.7l17.05-17.05-32.95-32.95c-1.38-1.38-2.995-3.455-3.8-5.185-2.19-4.49-2.075-10.135 1.96-14.17 5.645-5.645 13.015-3.57 21.2 4.61L155.13 97.6l17.05-17.05L139 47.37c-16.82-16.82-32.6-16.245-43.43-5.415-4.15 4.15-6.685 8.525-7.95 13.48a33.5 33.5 0 0 0-.46 14.05l-.23.235c-8.3-3.455-17.745-1.385-25 5.875-9.68 9.675-9.33 19.93-8.18 25.92l-.35.35-8.405-6.8-14.75 14.745c5.185 4.725 11.41 10.485 18.435 17.51z" fill="#f2f2f2"/><path d="M100.91 1A100 100 0 1 0 201 101v-.12A100 100 0 0 0 100.91 1m-.455 21.37a78.325 78.325 0 0 1 78.395 78.235v.09a78.325 78.325 0 1 1-78.4-78.325z" fill="#ffbd3f"/></g></svg>
);

function getVagueUpcoming(releaseDateStr: string | undefined | null): string | null {
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

function formatPrice(price: string | null | undefined) {
  if (!price || price === '£0.00' || price === '$0.00') return null;
  if (price.includes('£') || price.includes('$') || price.includes('€')) return price;
  const numericValue = parseFloat(price.replace(/[^\d.]/g, ''));
  if (isNaN(numericValue) || numericValue === 0) return null;
  return `$${numericValue.toFixed(2)}`;
}

interface QuestLogPageProps {
  games: Game[];
  displayedGames: Game[];
  user: User | null;
  groups: Group[];
  activeGroupId: number | null;
  setActiveGroupId: (id: number | null) => void;
  activeList: 'private' | 'shared';
  setActiveList: (v: 'private' | 'shared') => void;
  availableTags: string[];
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  questLogSearch: string;
  setQuestLogSearch: (v: string) => void;
  isRefreshing: boolean;
  isRefreshingPrices: boolean;
  confirmClear: boolean;
  setConfirmClear: (v: boolean) => void;
  groupActionsOpen: boolean;
  setGroupActionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  groupOwnership: { members: { id: number; username: string; avatar?: string }[]; ownership: Record<number, number[]> } | null;
  libraryMatchMap: Map<number, LauncherGame>;
  launcherGames: LauncherGame[];
  hideLibraryGames: boolean;
  setHideLibraryGames: React.Dispatch<React.SetStateAction<boolean>>;
  hideUnreleasedPrivate: boolean;
  setHideUnreleasedPrivate: React.Dispatch<React.SetStateAction<boolean>>;
  hideUnreleasedShared: boolean;
  setHideUnreleasedShared: React.Dispatch<React.SetStateAction<boolean>>;
  addToList: 'private' | 'shared';
  setAddToList: (v: 'private' | 'shared') => void;
  similarSuggestions: any[];
  isLoadingSimilar: boolean;
  epicFreeMap: Map<string, string>;
  setIsAdding: (v: boolean) => void;
  setSelectedGame: (g: any) => void;
  setSessionModal: (v: { game: Game; groupId: number } | null) => void;
  setSessionDateTime: (v: string) => void;
  setSessionMessage: (v: string) => void;
  setGameComments: (v: any[]) => void;
  setGames: React.Dispatch<React.SetStateAction<Game[]>>;
  setIsCreatingGroup: (v: boolean) => void;
  setIsJoiningGroup: (v: boolean) => void;
  setGroupInput: (v: string) => void;
  fetchGames: () => Promise<void>;
  fetchGameComments: (gameId: number) => Promise<void>;
  fetchQuestlogFriends: (game: Game) => void;
  fetchSimilarSuggestionsData: () => void;
  handleRefreshPrices: () => void;
  clearAllGames: () => Promise<void>;
  handleDeleteGroup: (id: number) => void;
  handleLeaveGroup: (id: number, name: string) => void;
  openMemberProfile: (member: { id: number; username: string; avatar?: string | null }) => void;
  openInBrowser: (url: string) => void;
  openXboxApp: (title: string) => void;
  remoteDismissPriceAlert: (id: number) => Promise<void>;
  remoteDismissGamePassAlert: (id: number) => Promise<void>;
  fixArtwork: (game: Game) => Promise<void>;
  token: string | null;
  setCurrentTab: (tab: 'home' | 'questlog' | 'launcher' | 'discover') => void;
}

const QuestLogPage: React.FC<QuestLogPageProps> = ({
  games,
  displayedGames,
  user,
  groups,
  activeGroupId,
  setActiveGroupId,
  activeList,
  setActiveList,
  availableTags,
  selectedTags,
  setSelectedTags,
  questLogSearch,
  setQuestLogSearch,
  isRefreshing,
  isRefreshingPrices,
  confirmClear,
  setConfirmClear,
  groupActionsOpen,
  setGroupActionsOpen,
  groupOwnership,
  libraryMatchMap,
  launcherGames,
  hideLibraryGames,
  setHideLibraryGames,
  hideUnreleasedPrivate,
  setHideUnreleasedPrivate,
  hideUnreleasedShared,
  setHideUnreleasedShared,
  addToList,
  setAddToList,
  similarSuggestions,
  isLoadingSimilar,
  epicFreeMap,
  setIsAdding,
  setSelectedGame,
  setSessionModal,
  setSessionDateTime,
  setSessionMessage,
  setGameComments,
  setGames,
  setIsCreatingGroup,
  setIsJoiningGroup,
  setGroupInput,
  fetchGames,
  fetchGameComments,
  fetchQuestlogFriends,
  fetchSimilarSuggestionsData,
  handleRefreshPrices,
  clearAllGames,
  handleDeleteGroup,
  handleLeaveGroup,
  openMemberProfile,
  openInBrowser,
  openXboxApp,
  remoteDismissPriceAlert,
  remoteDismissGamePassAlert,
  fixArtwork,
  token,
  setCurrentTab,
}) => {
  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-8">
        <div className="space-y-4 flex-1">
          <p className="text-xs font-mono uppercase tracking-[0.2em] opacity-50">Game Backlog</p>
          <h2 className="text-6xl font-light tracking-tight">Your <span className="italic font-serif">Questlog</span></h2>
          <div className="flex flex-col gap-4 pt-4">
            {/* Row 1: search + refresh */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px] max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18}/>
                <input
                  type="text"
                  placeholder="Search backlog..."
                  value={questLogSearch}
                  onChange={(e) => setQuestLogSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 focus:outline-none focus:border-white/30 transition-all text-sm"
                />
              </div>
              <button onClick={async () => { await fetchGames(); handleRefreshPrices(); }} disabled={isRefreshing || isRefreshingPrices} className="p-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50" title="Refresh List">
                <RefreshCw size={18} className={isRefreshing || isRefreshingPrices ? 'animate-spin text-emerald-500' : ''}/>
              </button>
            </div>
            {/* Row 2: Private/Shared pill + tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
                <button onClick={() => { setActiveList('private'); setConfirmClear(false); setGroupActionsOpen(false); }}
                  className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer", activeList === 'private' ? "bg-white text-[#141414]" : "text-white/50 hover:text-white")}
                >Private</button>
                <button onClick={() => { setActiveList('shared'); setConfirmClear(false); }}
                  className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer", activeList === 'shared' ? "bg-white text-[#141414]" : "text-white/50 hover:text-white")}
                >Shared</button>
                {activeList === 'shared' && (
                  <>
                    <div className="w-px h-4 bg-white/15 mx-0.5"/>
                    {groups.length > 0 ? (
                      <select value={activeGroupId ?? ''} onChange={(e) => setActiveGroupId(e.target.value ? Number(e.target.value) : null)}
                        className="bg-transparent text-white text-[10px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer px-2 py-1.5 max-w-[180px]">
                        {groups.map(g => (<option key={g.id} value={g.id} className="bg-[#1a1a1a]">{g.name}</option>))}
                      </select>
                    ) : (
                      <span className="text-[10px] text-white/30 italic px-2">No groups</span>
                    )}
                    <button
                      onClick={() => setGroupActionsOpen(o => !o)}
                      className="p-1.5 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all"
                      title="Group actions"
                    >
                      <ChevronRight size={12} className={cn("transition-transform duration-200", groupActionsOpen && "rotate-180")}/>
                    </button>
                    {groupActionsOpen && (() => {
                      const activeGroup = groups.find(g => g.id === activeGroupId);
                      return (
                        <>
                          <div className="w-px h-4 bg-white/15 mx-0.5"/>
                          {activeGroup && (
                            <>
                              <span className="text-[9px] uppercase font-bold opacity-30 tracking-widest pl-1">Code</span>
                              <span className="font-mono font-bold text-[10px] text-white/70 pr-1">{activeGroup.invite_code}</span>
                              <div className="w-px h-4 bg-white/15 mx-0.5"/>
                            </>
                          )}
                          <button onClick={() => { setGroupInput(''); setIsCreatingGroup(true); }} className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer text-white/50 hover:text-white hover:bg-white/10">Create</button>
                          <button onClick={() => { setGroupInput(''); setIsJoiningGroup(true); }} className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer text-white/50 hover:text-white hover:bg-white/10">Join</button>
                          {activeGroup && user?.id != null && (
                            <>
                              <div className="w-px h-4 bg-white/15 mx-0.5"/>
                              {Number(activeGroup.created_by) === Number(user.id) ? (
                                <button
                                  onClick={() => { if (window.confirm(`Delete group "${activeGroup.name}"? This cannot be undone.`)) handleDeleteGroup(activeGroup.id); }}
                                  className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer text-red-500/60 hover:text-red-400 hover:bg-red-500/10"
                                >Delete</button>
                              ) : (
                                <button
                                  onClick={() => handleLeaveGroup(activeGroup.id, activeGroup.name)}
                                  className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer text-orange-500/60 hover:text-orange-400 hover:bg-orange-500/10"
                                >Leave</button>
                              )}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
              {availableTags.length > 0 && (
                <TagDropdown availableTags={availableTags} selectedTags={selectedTags} setSelectedTags={setSelectedTags}/>
              )}
            </div>
          </div>
        </div>
        {/* Right column */}
        <div className="flex flex-col items-end gap-3">
          {activeList === 'shared' && groupOwnership && groupOwnership.members.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Members</span>
              <div className="flex -space-x-2">
                {groupOwnership.members.map(m => (
                  <MemberAvatar key={m.id} username={m.username} avatar={m.avatar} size="sm"
                    onClick={(e) => { e.stopPropagation(); openMemberProfile(m); }}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={() => {
                setAddToList(activeList);
                if (activeList === 'shared' && !activeGroupId) { alert('Please create or join a group first'); return; }
                setIsAdding(true);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 transition-all text-sm font-bold uppercase tracking-widest shadow-lg shadow-emerald-900/20"
            >
              <Plus size={18}/> Add Game
            </button>
            {games.filter(g => g.list_type === activeList).length > 0 && (
              <div className="relative flex items-center">
                {confirmClear ? (
                  <div className="flex items-center gap-2 bg-red-100 p-1.5 rounded-full border border-red-900/50 animate-in fade-in slide-in-from-right-4 shadow-sm">
                    <AlertTriangle size={16} className="text-red-600 ml-2"/>
                    <span className="text-sm font-bold text-red-400 mr-1">Clear all?</span>
                    <button onClick={() => setConfirmClear(false)} className="px-4 py-2 bg-[#1a1a1a] text-red-400 rounded-full text-xs font-bold hover:bg-red-900/20 transition-colors cursor-pointer">Cancel</button>
                    <button onClick={clearAllGames} className="px-4 py-2 bg-red-600 text-white rounded-full text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer">Yes, Clear</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmClear(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-900/20 text-red-600 hover:bg-red-900/40 hover:text-red-400 transition-colors font-bold text-sm cursor-pointer border border-red-900/30">
                    <Trash2 size={18}/>
                    <span className="hidden sm:inline">Clear {activeList === 'shared' ? 'Shared' : 'Private'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section title row */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2.5">
          <BookOpen size={12} className="text-emerald-500/60"/>
          {activeList === 'private' ? 'My Backlog' : 'Shared Backlog'}
          <span className="font-normal normal-case tracking-normal text-white/30">{displayedGames.length} games</span>
        </h3>
        <div className="flex items-center gap-2">
          {(() => {
            const hideUnreleased = activeList === 'private' ? hideUnreleasedPrivate : hideUnreleasedShared;
            const setHideUnreleased = activeList === 'private' ? setHideUnreleasedPrivate : setHideUnreleasedShared;
            return (
              <button
                onClick={() => setHideUnreleased(h => !h)}
                className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors border cursor-pointer",
                  hideUnreleased
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-white/5 text-white/40 border-white/10 hover:border-indigo-500/40 hover:text-white/60")}
              >
                <Calendar size={12}/>
                Hide Unreleased
              </button>
            );
          })()}
          {launcherGames.length > 0 && (
            <button
              onClick={() => setHideLibraryGames(h => !h)}
              className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors border cursor-pointer",
                hideLibraryGames
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-white/5 text-white/40 border-white/10 hover:border-emerald-500/40 hover:text-white/60")}
            >
              <BookOpen size={12}/>
              Hide in Library
            </button>
          )}
        </div>
      </div>

      {displayedGames.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl">
          <div className="opacity-20 mb-4"><Gamepad2 size={64}/></div>
          <p className="text-white/40 font-medium">
            {activeList === 'shared' && !activeGroupId
              ? "Create or join a group to start a shared backlog!"
              : `Your ${activeList === 'shared' ? 'shared' : 'private'} backlog is empty. Start adding games!`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {displayedGames.map((game) => (
            <motion.div layoutId={`game-container-${game.id}`} key={game.id}
              onClick={() => {
                setSelectedGame(game as any);
                fetchQuestlogFriends(game as any);
                if (game.list_type === 'shared') { setGameComments([]); fetchGameComments(game.id); }
                if (game.price_dropped) {
                  if (game.list_type === 'shared') { remoteDismissPriceAlert(game.id); }
                  else { fetch(`/api/games/${game.id}/dismiss-price-alert`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }); }
                  setGames(prev => prev.map(g => g.id === game.id ? { ...g, price_dropped: 0 } : g));
                }
                if ((game as any).game_pass_new) {
                  if (game.list_type === 'shared') { remoteDismissGamePassAlert(game.id); }
                  else { fetch(`/api/games/${game.id}/dismiss-game-pass-alert`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }); }
                  setGames(prev => prev.map(g => g.id === game.id ? { ...g, game_pass_new: 0 } : g));
                }
              }}
              className="group cursor-pointer" whileHover={{ y: -8, scale: 1.02 }}
            >
              {(() => {
                const owners = groupOwnership?.ownership?.[game.id] ?? [];
                const members = groupOwnership?.members ?? [];
                const allOwn = members.length > 0 && owners.length === members.length;
                const inLibrary = activeList === 'private' && libraryMatchMap.has(game.id);
                const hidePrice = libraryMatchMap.has(game.id) || (activeList === 'shared' && user != null && owners.includes(user.id));
                return (
                  <div className={cn("relative aspect-[2/3] overflow-hidden rounded-2xl bg-white/5 transition-all",
                    allOwn || inLibrary ? "border-2 border-emerald-400" : "ring-1 ring-white/10")}
                    style={allOwn || inLibrary ? { boxShadow: '0 0 0 2px rgba(52,211,153,0.6), 0 0 20px 6px rgba(16,185,129,0.45), 0 0 40px 12px rgba(16,185,129,0.2)' } : undefined}
                  >
                    {game.isFixingArtwork ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a]">
                        <Loader2 className="animate-spin text-emerald-600 mb-2" size={32}/>
                        <span className="text-xs font-mono uppercase opacity-50">Fixing Artwork...</span>
                      </div>
                    ) : game.artworkFailed ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a] group-hover:bg-[#222] transition-colors">
                        <Gamepad2 className="opacity-20 mb-2" size={48}/>
                        <span className="text-xs font-mono uppercase opacity-50 text-center px-4 mb-2">{game.title}</span>
                        <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/70 font-bold">Click to add artwork</span>
                      </div>
                    ) : (
                      <img src={game.artwork} alt={game.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" referrerPolicy="no-referrer" onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src.includes('library_capsule_2x.jpg')) {
                            target.src = target.src.replace('library_capsule_2x.jpg', 'library_capsule.jpg');
                          } else if (target.src.includes('library_capsule.jpg')) {
                            target.src = target.src.replace('library_capsule.jpg', 'library_600x900.jpg');
                          } else {
                            fixArtwork(game);
                          }
                        }}
                      />
                    )}
                    {/* Price drop badge */}
                    {game.price_dropped === 1 && (
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-amber-500/90 text-black text-[9px] font-black px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none">
                        Price Drop
                      </div>
                    )}
                    {/* Game Pass new badge */}
                    {(game as any).game_pass_new === 1 && (
                      <div className={cn("absolute z-10 flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none", game.price_dropped === 1 ? "top-8 left-2" : "top-2 left-2")} style={{ background: 'rgba(16,185,129,0.9)', color: '#fff' }}>
                        <XboxIcon className="w-3 h-3"/>
                        Now on Game Pass
                      </div>
                    )}
                    {/* Member ownership avatars / Schedule session button */}
                    {members.length > 0 && (
                      allOwn ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSessionModal({ game, groupId: activeGroupId! }); setSessionDateTime(''); setSessionMessage(''); }}
                          className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-emerald-500/90 hover:bg-emerald-400 active:scale-95 text-white text-[9px] font-black px-2 py-1 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                          title="Everyone has this game — schedule a session!"
                        >
                          <Calendar size={10}/>
                          Play Together
                        </button>
                      ) : (
                        <div className="absolute top-2 left-2 flex -space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {members.map(m => (
                            <MemberAvatar key={m.id} username={m.username} avatar={m.avatar} size="sm"
                              owns={owners.includes(m.id)}
                              onClick={(e) => { e.stopPropagation(); openMemberProfile(m); }}
                            />
                          ))}
                        </div>
                      )
                    )}
                    {/* Countdown / Coming Soon overlay */}
                    {(() => {
                      const cd = getCountdown(game.release_date);
                      const vague = !cd ? getVagueUpcoming(game.release_date) : null;
                      if (!cd && !vague) return null;
                      if (vague) {
                        return (
                          <>
                            <div className="absolute inset-0 z-[5] pointer-events-none bg-black/40"/>
                            <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-sm border border-white/10 px-1.5 py-0.5 rounded-full pointer-events-none group-hover:opacity-0 transition-opacity duration-200">
                              <Calendar size={8} className="text-indigo-400 shrink-0"/>
                              <span className="text-[8px] font-mono text-white/50 uppercase tracking-wide">Unreleased</span>
                            </div>
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)' }}>
                              <Calendar size={18} className="text-indigo-400 mb-1"/>
                              <p className="text-[8px] font-mono uppercase tracking-widest text-white/50 mb-1.5">Coming Soon</p>
                              <p className="text-sm font-black text-white/70 px-4 text-center">{vague}</p>
                              <p className="text-[9px] text-white/30 font-medium mt-2 px-3 text-center">{game.release_date}</p>
                            </div>
                          </>
                        );
                      }
                      return (
                        <>
                          <div className="absolute inset-0 z-[5] pointer-events-none bg-black/40"/>
                          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
                            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)' }}>
                            <Calendar size={18} className={cd!.isImminent ? "text-amber-400 mb-1" : "text-indigo-400 mb-1"}/>
                            <p className="text-[8px] font-mono uppercase tracking-widest text-white/50 mb-1.5">Coming Soon</p>
                            {cd!.days > 0 ? (
                              <div className="flex items-end gap-2">
                                <div className="text-center">
                                  <p className={cn("text-2xl font-black leading-none", cd!.isImminent ? "text-amber-400" : "text-white")}>{cd!.days}</p>
                                  <p className="text-[8px] font-mono uppercase text-white/40 mt-0.5">days</p>
                                </div>
                                {cd!.days < 100 && (
                                  <>
                                    <div className="text-center">
                                      <p className="text-lg font-black leading-none text-white/60">{String(cd!.hours).padStart(2, '0')}</p>
                                      <p className="text-[8px] font-mono uppercase text-white/30 mt-0.5">hrs</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-lg font-black leading-none text-white/40">{String(cd!.minutes).padStart(2, '0')}</p>
                                      <p className="text-[8px] font-mono uppercase text-white/20 mt-0.5">min</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-end gap-2">
                                <div className="text-center">
                                  <p className="text-2xl font-black leading-none text-amber-400">{String(cd!.hours).padStart(2, '0')}</p>
                                  <p className="text-[8px] font-mono uppercase text-white/40 mt-0.5">hrs</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xl font-black leading-none text-amber-300/70">{String(cd!.minutes).padStart(2, '0')}</p>
                                  <p className="text-[8px] font-mono uppercase text-white/30 mt-0.5">min</p>
                                </div>
                              </div>
                            )}
                            <p className="text-[9px] text-white/30 font-medium mt-2 px-3 text-center">{game.release_date}</p>
                          </div>
                        </>
                      );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/95 via-[#0a0a0a]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="font-bold text-sm leading-tight mb-1.5 text-white">{game.title}</h3>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {(game.tags ? Array.from(new Set(game.tags.split(',').map((t: string) => t.trim()))).slice(0, 3) : [game.genre]).filter(Boolean).map((tag: string) => (
                            <span key={tag} className="text-[9px] font-mono uppercase tracking-widest bg-white/10 px-1.5 py-0.5 rounded text-white/70">{tag}</span>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          {!getCountdown(game.release_date) && !getVagueUpcoming(game.release_date) && game.steam_rating ? (
                            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest bg-[#171a21] px-2 py-1 rounded border border-[#66c0f4]/20">
                              <SteamIcon className="w-2.5 h-2.5 text-[#66c0f4] shrink-0"/>
                              <span className="opacity-90 truncate">{game.steam_rating}</span>
                            </div>
                          ) : !getCountdown(game.release_date) && !getVagueUpcoming(game.release_date) && game.metacritic ? (
                            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10">
                              <MetacriticIcon className="w-3 h-3 shrink-0"/>
                              <span className={cn("px-1.5 py-0.5 rounded font-bold text-white text-[9px]", game.metacritic >= 61 ? "bg-green-600" : game.metacritic >= 40 ? "bg-yellow-600" : "bg-red-600")}>
                                {game.steam_url ? game.metacritic : (game.metacritic / 10).toFixed(1)}
                              </span>
                            </div>
                          ) : null}
                          {game.game_pass === 1 && (
                            <button onClick={(e) => { e.stopPropagation(); openXboxApp(game.title); }}
                              className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest bg-[#107c10]/20 px-2 py-1 rounded border border-[#107c10]/30 hover:bg-[#107c10]/40 transition-colors"
                            >
                              <XboxIcon className="w-2.5 h-2.5 text-[#107c10]"/>
                              <span className="text-[#107c10] font-bold">Game Pass</span>
                            </button>
                          )}
                          {epicFreeMap.has(game.title.toLowerCase().trim()) && (
                            <button onClick={(e) => { e.stopPropagation(); { const u = epicFreeMap.get(game.title.toLowerCase().trim())!; const slug = u.match(/\/p\/([^/?]+)/)?.[1]; openInBrowser(slug ? `com.epicgames.launcher://store/p/${slug}` : u); }; }}
                              className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest bg-[#0078f2]/20 px-2 py-1 rounded border border-[#0078f2]/30 hover:bg-[#0078f2]/40 transition-colors"
                            >
                              <EpicIcon className="w-2.5 h-2.5 text-[#4da6ff]"/>
                              <span className="text-[#4da6ff] font-bold">Free on Epic</span>
                            </button>
                          )}
                        </div>
                        {!hidePrice && formatPrice(game.lowest_price) && (
                          <div className="flex items-center gap-2">
                            <Tag size={14} className="text-emerald-500"/>
                            <span className="font-bold text-emerald-500">{formatPrice(game.lowest_price)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );

                // Capture hidePrice for use in JSX above — define it inline via IIFE
                function hidePrice() {
                  const owners2 = groupOwnership?.ownership?.[game.id] ?? [];
                  return libraryMatchMap.has(game.id) || (activeList === 'shared' && user != null && owners2.includes(user.id!));
                }
              })()}
            </motion.div>
          ))}
        </div>
      )}

      {similarSuggestions.length > 0 && (
        <div className="mt-14 pt-10 border-t border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] opacity-50 mb-2">Discovery</p>
              <h2 className="text-4xl font-light tracking-tight">Suggested <span className="italic font-serif">Adventures</span></h2>
              <p className="text-xs text-white/40 mt-2">Based on your current backlog and library</p>
            </div>
            <button onClick={fetchSimilarSuggestionsData} disabled={isLoadingSimilar} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all disabled:opacity-50 text-[10px] font-bold uppercase tracking-widest">
              <RefreshCw size={14} className={isLoadingSimilar ? "animate-spin" : ""}/>
              Refresh Suggestions
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {similarSuggestions.map((suggestion, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/10 cursor-pointer shadow-xl"
                onClick={() => { setCurrentTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <img src={suggestion.artwork} alt={suggestion.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" referrerPolicy="no-referrer"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-sm font-bold leading-tight mb-1.5">{suggestion.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase tracking-widest opacity-60 px-2 py-0.5 bg-white/10 rounded-full">{suggestion.genre}</span>
                      <ArrowUpRight size={14} className="opacity-40 group-hover:opacity-100 transition-opacity"/>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestLogPage;
