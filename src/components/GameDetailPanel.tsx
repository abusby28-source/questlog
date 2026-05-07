import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Gamepad2, Image, Monitor, Type, Layout, Loader2,
  Trophy, Users, Download, ArrowUpRight, Tag, Plus, Edit2,
  Pencil, Trash2, EyeOff, Lock, Send, Share2, ChevronDown,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// ── Inline icons ──────────────────────────────────────────────────────────────

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
  <svg viewBox="0 0 647.167 750.977" className={className} fill="currentColor">
    <path d="M 323.583,0 C 144.874,0 0,168.266 0,375.488 c 0,207.223 144.874,375.489 323.583,375.489 178.71,0 323.584,-168.266 323.584,-375.489 C 647.167,168.266 502.293,0 323.583,0 Z"/>
  </svg>
);

const MetacriticIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 202 202" className={className} xmlns="http://www.w3.org/2000/svg"><g strokeWidth=".04"><path d="M185.89 98.45a87.45 87.45 0 1 1 0-.105"/><path d="m87.045 165.685 17.05-17.05L71.26 115.8c-1.38-1.38-2.88-3.11-3.685-5.07-1.845-3.915-2.65-10.02 1.845-14.515 5.53-5.53 12.9-3.225 20.045 3.92L121.03 131.7l17.05-17.05-32.95-32.95c-1.38-1.38-2.995-3.455-3.8-5.185-2.19-4.49-2.075-10.135 1.96-14.17 5.645-5.645 13.015-3.57 21.2 4.61L155.13 97.6l17.05-17.05L139 47.37c-16.82-16.82-32.6-16.245-43.43-5.415-4.15 4.15-6.685 8.525-7.95 13.48a33.5 33.5 0 0 0-.46 14.05l-.23.235c-8.3-3.455-17.745-1.385-25 5.875-9.68 9.675-9.33 19.93-8.18 25.92l-.35.35-8.405-6.8-14.75 14.745c5.185 4.725 11.41 10.485 18.435 17.51z" fill="#f2f2f2"/><path d="M100.91 1A100 100 0 1 0 201 101v-.12A100 100 0 0 0 100.91 1m-.455 21.37a78.325 78.325 0 0 1 78.395 78.235v.09a78.325 78.325 0 1 1-78.4-78.325z" fill="#ffbd3f"/></g></svg>
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
  description?: string;
  banner?: string;
  logo?: string;
  metacritic?: number;
  steam_rating?: string;
}

interface FriendEntry { id: number | string; username: string; avatar?: string; online_status: string; current_game?: string; }

interface FriendsWhoOwnEntry { username: string; avatar: string; online_status: string; current_game?: string; last_played?: number; platform?: string; }

interface GroupMember { id: number; username: string; avatar?: string; }

interface Comment { id: number; content: string; created_at: string; username: string; avatar?: string; user_id: number; }

// ── Inline MemberAvatar (simplified for GameDetailPanel usage) ───────────────

function avatarColor(username: string): string {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#3b82f6','#ef4444'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const MemberAvatar = React.memo(function MemberAvatar({ username, avatar, size = 'md', owns, onClick, className }: {
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

// Simplified FriendRow for the friends-who-own modal
const FriendRow = memo(({ friend, lastPlayedAt, platform }: { friend: FriendEntry; lastPlayedAt?: string; platform?: string }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
      {friend.avatar
        ? <img src={friend.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" referrerPolicy="no-referrer"/>
        : <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-black shrink-0">{friend.username[0]?.toUpperCase()}</div>
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{friend.username}</p>
        {friend.current_game && <p className="text-[10px] text-white/40 truncate">Playing: {friend.current_game}</p>}
        {lastPlayedAt && <p className="text-[10px] text-white/30">Last played: {lastPlayedAt}</p>}
      </div>
      {platform && (
        <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-white/40">{platform}</span>
      )}
    </div>
  );
});

// ── Props ─────────────────────────────────────────────────────────────────────

export interface GameDetailPanelProps {
  selectedGame: (Game | LauncherGame | any) | null;
  setSelectedGame: (g: any) => void;
  pendingEnrichIdRef: React.MutableRefObject<string | null>;
  token: string | null;
  user: any;
  games: Game[];
  appFriends: FriendEntry[];
  groups: any[];
  friendsWhoOwn: FriendsWhoOwnEntry[];
  setFriendsWhoOwn: (v: FriendsWhoOwnEntry[]) => void;
  groupOwnership: { members: GroupMember[]; ownership: Record<number, number[]> } | null;
  whoHasThisOpen: boolean;
  setWhoHasThisOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  gameComments: Comment[];
  setGameComments: (v: Comment[]) => void;
  commentInput: string;
  setCommentInput: (v: string) => void;
  showSharePanel: boolean;
  setShowSharePanel: (v: boolean | ((prev: boolean) => boolean)) => void;
  shareGameData: { title: string; steamAppID?: string; igdbSlug?: string; artwork?: string } | null;
  setShareGameData: (v: any) => void;
  shareTargetFriend: number | null;
  setShareTargetFriend: (v: number | null) => void;
  shareTargetGroup: number | null;
  setShareTargetGroup: (v: number | null) => void;
  shareMessageText: string;
  setShareMessageText: (v: string) => void;
  shareCopied: boolean;
  setShareCopied: (v: boolean) => void;
  isEditingArtwork: boolean;
  setIsEditingArtwork: (v: boolean) => void;
  editingArtworkType: 'artwork' | 'banner' | 'logo' | 'horizontal_grid';
  setEditingArtworkType: (v: 'artwork' | 'banner' | 'logo' | 'horizontal_grid') => void;
  customArtworkUrl: string;
  setCustomArtworkUrl: (v: string) => void;
  isEditingTags: boolean;
  setIsEditingTags: (v: boolean) => void;
  newTagInput: string;
  setNewTagInput: (v: string) => void;
  editingPlaytime: boolean;
  setEditingPlaytime: (v: boolean) => void;
  playtimeInput: string;
  setPlaytimeInput: (v: string) => void;
  confirmDelete: number | null;
  setConfirmDelete: (v: number | null) => void;
  showFriendsModal: boolean;
  setShowFriendsModal: (v: boolean) => void;
  showAchievementsModal: boolean;
  setShowAchievementsModal: (v: boolean) => void;
  priceLoading: boolean;
  isAddingToLog: boolean;
  epicFreeMap: Map<string, string>;
  libraryMatchMap: Map<number, LauncherGame>;
  getBannerUrl: (game: any) => string;
  formatPrice: (price: string | null | undefined) => string | null;
  openInBrowser: (url: string) => void;
  openXboxApp: (title: string) => void;
  handleLaunch: (game: LauncherGame) => void;
  handleToggleInstalled: (id: number, installed: boolean) => void;
  handleHideGame: (id: number) => void;
  handleSaveCustomArtwork: (id: number, url: string) => void;
  handleAddTag: (id: number, tag: string) => void;
  handleRemoveTag: (id: number, tag: string) => void;
  handleAddExternalToLog: (game: any) => void;
  deleteGame: (id: number) => void;
  deleteComment: (id: number) => void;
  postComment: (gameId: number) => void;
  openMemberProfile: (member: GroupMember) => void;
  sendGameToFriend: (friendId: number, gameData: any, message?: string) => void;
  sendGameToGroup: (groupId: number, gameData: any, message?: string) => void;
  fetchLauncherFriends: (game: LauncherGame) => void;
  fetchQuestlogFriends: (game: Game | any) => void;
  fetchLauncherGames: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GameDetailPanel(props: GameDetailPanelProps) {
  const {
    selectedGame, setSelectedGame, pendingEnrichIdRef, token, user,
    games, appFriends, groups, friendsWhoOwn, setFriendsWhoOwn,
    groupOwnership, whoHasThisOpen, setWhoHasThisOpen,
    gameComments, setGameComments, commentInput, setCommentInput,
    showSharePanel, setShowSharePanel, shareGameData, setShareGameData,
    shareTargetFriend, setShareTargetFriend, shareTargetGroup, setShareTargetGroup,
    shareMessageText, setShareMessageText, shareCopied, setShareCopied,
    isEditingArtwork, setIsEditingArtwork, editingArtworkType, setEditingArtworkType,
    customArtworkUrl, setCustomArtworkUrl, isEditingTags, setIsEditingTags,
    newTagInput, setNewTagInput, editingPlaytime, setEditingPlaytime,
    playtimeInput, setPlaytimeInput, confirmDelete, setConfirmDelete,
    showFriendsModal, setShowFriendsModal, showAchievementsModal, setShowAchievementsModal,
    priceLoading, isAddingToLog, epicFreeMap, libraryMatchMap,
    getBannerUrl, formatPrice, openInBrowser, openXboxApp,
    handleLaunch, handleToggleInstalled, handleHideGame, handleSaveCustomArtwork,
    handleAddTag, handleRemoveTag, handleAddExternalToLog, deleteGame,
    deleteComment, postComment, openMemberProfile, sendGameToFriend, sendGameToGroup,
    fetchLauncherFriends, fetchQuestlogFriends, fetchLauncherGames,
  } = props;

  const closePanel = () => {
    pendingEnrichIdRef.current = null;
    setSelectedGame(null);
    setFriendsWhoOwn([]);
    setIsEditingArtwork(false);
    setIsEditingTags(false);
    setShowFriendsModal(false);
    setShowAchievementsModal(false);
    setConfirmDelete(null);
    setGameComments([]);
    setCommentInput('');
    setWhoHasThisOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {selectedGame && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closePanel}
              className="absolute inset-0 bg-black/80"/>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15, ease:'easeOut' }}
              className="relative z-10 w-full max-w-3xl bg-[#1a1a1a] rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]"
              style={{ overflow:'clip', willChange:'transform' }}
>
              {/* ── EDIT ARTWORK — full overlay on the modal, not clipped by banner ── */}
              {isEditingArtwork && (
                <div className="absolute inset-0 z-50 bg-[#141414] flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
                    <h3 className="text-lg font-bold italic font-serif uppercase tracking-tighter">Edit Artwork</h3>
                    <button onClick={() => setIsEditingArtwork(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"><X size={18}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {[
                      { id:'logo', label:'Logo', icon: <Type size={14}/>, current: selectedGame.logo },
                      { id:'banner', label:'Banner (Hero)', icon: <Monitor size={14}/>, current: selectedGame.banner },
                      { id:'artwork', label:'Grid Art (Vertical)', icon: <Image size={14}/>, current: selectedGame.artwork },
                      { id:'horizontal_grid', label:'Homepage Grid (16:9)', icon: <Layout size={14}/>, current: selectedGame.horizontal_grid }
                    ].map(type => (
                      <div key={type.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-mono uppercase tracking-widest opacity-50 flex items-center gap-2">{type.icon}{type.label}</label>
                          {editingArtworkType === type.id && <span className="text-[10px] font-mono uppercase text-emerald-500 animate-pulse">Editing...</span>}
                        </div>
                        <div className="flex gap-2">
                          <input type="text"
                            value={editingArtworkType === type.id ? customArtworkUrl : (type.current ||'')}
                            onFocus={() => { setEditingArtworkType(type.id as any); setCustomArtworkUrl(type.current ||''); }}
                            onChange={e => { if (editingArtworkType === type.id) setCustomArtworkUrl(e.target.value); }}
                            className={cn("flex-1 bg-white/5 border rounded-xl px-4 py-2.5 text-xs transition-all focus:outline-none", editingArtworkType === type.id ?"border-emerald-500/50 bg-emerald-500/5" :"border-white/10")}
                            placeholder={`Paste ${type.label} URL…`}
/>
                          {editingArtworkType === type.id && (
                            <button onClick={() => handleSaveCustomArtwork(selectedGame.id, customArtworkUrl)} className="px-4 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 transition-colors cursor-pointer">Save</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-6 pb-6 pt-2 shrink-0">
                    <button onClick={() => setIsEditingArtwork(false)} className="w-full py-3 bg-white/5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors cursor-pointer">Close</button>
                  </div>
                </div>
              )}

              {/* ── BANNER (sticky, never scrolls) ── */}
              <div className="w-full relative h-44 md:h-56 shrink-0 group/artwork bg-[#111]">
                {selectedGame.isFixingArtwork ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a]">
                    <Loader2 className="animate-spin text-emerald-600 mb-2" size={32}/>
                    <span className="text-xs font-mono uppercase opacity-50">Fixing Artwork…</span>
                  </div>
                ) : selectedGame.artworkFailed ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a]">
                    <Gamepad2 className="opacity-20 mb-4" size={48}/>
                    <span className="text-sm font-mono uppercase opacity-50 text-center px-4 mb-4">{selectedGame.title}</span>
                    <button onClick={(e) => { e.stopPropagation(); setEditingArtworkType('banner'); setIsEditingArtwork(true); setCustomArtworkUrl(''); }} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer">
                      <Image size={16}/> Add Custom Banner
                    </button>
                  </div>
                ) : (
                  <img src={getBannerUrl(selectedGame)} alt={selectedGame.title} className="w-full h-full object-cover" referrerPolicy="no-referrer"
                    onError={(e) => { const t = e.target as HTMLImageElement; if (t.src !== selectedGame.artwork) t.src = selectedGame.artwork; }}
/>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bottom-[-2px] bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/10 to-transparent pointer-events-none"/>

                {/* Share + Close buttons */}
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2" style={{ pointerEvents:'all' }}>
                  {/* Share button + dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        const g = selectedGame as any;
                        const steamUrlMatch = g.steam_url?.match(/\/app\/(\d+)/);
                        const resolvedSteamId = g.steamAppID || g.external_id || steamUrlMatch?.[1] || null;
                        const igdbSlug = !resolvedSteamId ? g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : undefined;
                        setShareGameData({ title: g.title, steamAppID: resolvedSteamId || undefined, igdbSlug, artwork: g.verticalArt || g.artwork });
                        setShareTargetFriend(null); setShareTargetGroup(null); setShareMessageText(''); setShareCopied(false);
                        setShowSharePanel(p => !p);
                      }}
                      className="p-2.5 bg-black/50 border border-white/15 text-white rounded-full hover:bg-black/70 transition-all cursor-pointer"
                      title="Share"
                    ><Send size={16}/></button>
                    {showSharePanel && shareGameData && (
                      <div className="absolute top-full right-0 mt-2 w-72 bg-[#1a1a1a] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-10" onClick={e => e.stopPropagation()}>
                        <div className="p-3.5 border-b border-white/10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">Share</p>
                          <p className="text-sm font-bold truncate">{shareGameData.title}</p>
                        </div>
                        {/* Copy Steam / IGDB link */}
                        {shareGameData.steamAppID ? (
                          <button
                            onClick={() => { navigator.clipboard.writeText(`https://store.steampowered.com/app/${shareGameData.steamAppID}`); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left cursor-pointer border-b border-white/5"
                          >
                            <div className="w-7 h-7 rounded-full bg-[#1b2838] flex items-center justify-center shrink-0"><Share2 size={13} className="text-[#c7d5e0]"/></div>
                            <span className="text-sm text-white/80">{shareCopied ? '✓ Copied!' : 'Copy Steam link'}</span>
                          </button>
                        ) : shareGameData.igdbSlug ? (
                          <button
                            onClick={() => { navigator.clipboard.writeText(`https://www.igdb.com/games/${shareGameData.igdbSlug}`); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left cursor-pointer border-b border-white/5"
                          >
                            <div className="w-7 h-7 rounded-full bg-[#9147ff]/20 flex items-center justify-center shrink-0"><Share2 size={13} className="text-[#9147ff]"/></div>
                            <span className="text-sm text-white/80">{shareCopied ? '✓ Copied!' : 'Copy IGDB link'}</span>
                          </button>
                        ) : null}
                        {/* Send to friend or group */}
                        {(shareTargetFriend !== null || shareTargetGroup !== null) ? (
                          <div className="p-4">
                            {shareTargetFriend !== null ? (
                              <p className="text-xs text-white/50 mb-2.5">To: <span className="text-white font-bold">{appFriends.find(f => f.id === shareTargetFriend)?.username}</span></p>
                            ) : (
                              <p className="text-xs text-white/50 mb-2.5">To: <span className="text-white font-bold">{groups.find(g => g.id === shareTargetGroup)?.name}</span> <span className="text-white/30">(group)</span></p>
                            )}
                            <textarea value={shareMessageText} onChange={e => setShareMessageText(e.target.value)} placeholder="Add a message (optional)..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-white/30 transition-colors mb-2.5" rows={2}/>
                            <div className="flex gap-2">
                              <button onClick={() => { setShareTargetFriend(null); setShareTargetGroup(null); setShareMessageText(''); }}
                                className="flex-1 py-2 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:bg-white/10 transition-colors cursor-pointer">Back</button>
                              <button onClick={() => shareTargetFriend !== null
                                  ? sendGameToFriend(shareTargetFriend, shareGameData!, shareMessageText || undefined)
                                  : sendGameToGroup(shareTargetGroup!, shareGameData!, shareMessageText || undefined)}
                                className="flex-1 py-2 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 transition-colors cursor-pointer">Send</button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
                            {/* Friends */}
                            {appFriends.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Friends</p>
                                <div className="flex flex-wrap gap-2">
                                  {appFriends.map(f => (
                                    <button key={f.id} onClick={() => setShareTargetFriend(f.id as number)}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer text-xs"
                                    >
                                      <img src={f.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`} className="w-5 h-5 rounded-full object-cover"/>
                                      <span className="text-white/80">{f.username}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Group chats */}
                            {groups.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Group Chats</p>
                                <div className="flex flex-wrap gap-2">
                                  {groups.map(g => (
                                    <button key={g.id} onClick={() => setShareTargetGroup(g.id)}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer text-xs"
                                    >
                                      <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center shrink-0">
                                        <Users size={10} className="text-purple-300"/>
                                      </div>
                                      <span className="text-white/80">{g.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {appFriends.length === 0 && groups.length === 0 && (
                              <p className="text-xs text-white/30 italic">No friends or groups yet</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Close button */}
                  <button
                    onClick={() => { pendingEnrichIdRef.current = null; setSelectedGame(null); setFriendsWhoOwn([]); setIsEditingTags(false); setIsEditingArtwork(false); setShowFriendsModal(false); setShowAchievementsModal(false); setConfirmDelete(null); setShowSharePanel(false); }}
                    className="p-2.5 bg-black/50 border border-white/15 text-white rounded-full hover:bg-black/70 transition-all cursor-pointer"
                    style={{ pointerEvents:'all' }}
                  ><X size={16}/></button>
                </div>

                {/* Edit artwork — only visible on hover, not for external games */}
                {!(selectedGame as any)._external && (
                <div className="absolute bottom-4 left-4 z-30 opacity-0 group-hover/artwork:opacity-100 transition-opacity duration-200">
                  <button onClick={() => { setEditingArtworkType('logo'); setIsEditingArtwork(true); setCustomArtworkUrl(selectedGame.logo ||''); }}
                    className="bg-black/60 border border-white/20 text-white px-3 py-1.5 rounded-full hover:bg-black/80 transition-all cursor-pointer shadow-lg flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                    <Image size={12}/> Edit Artwork
                  </button>
                </div>
                )}

              </div>

              {/* ── SCROLLABLE CONTENT ── */}
              <div className="w-full px-6 md:px-8 pb-8 pt-4 overflow-y-auto flex-1">
                <div className="max-w-3xl mx-auto space-y-5">

                  {/* Logo / title */}
                  <div className="mb-2 flex items-center justify-start">
                    {(selectedGame.logo || (selectedGame as any)._external || selectedGame.steam_url) ? (
                      <img
                        src={selectedGame.logo || (() => {
                          const sid = (selectedGame as any).steamAppID || selectedGame.steam_url?.match(/\/app\/(\d+)/)?.[1];
                          return sid ? `/api/steamgriddb/logo/${sid}` : `/api/steamgriddb/logo-by-name/${encodeURIComponent(selectedGame.title)}`;
                        })()}
                        alt={selectedGame.title}
                        className="min-w-[30%] max-w-[75%] h-auto max-h-32 object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          const sid = (selectedGame as any).steamAppID || selectedGame.steam_url?.match(/\/app\/(\d+)/)?.[1];
                          const byIdUrl  = sid ? `/api/steamgriddb/logo/${sid}` : null;
                          const byNameUrl = `/api/steamgriddb/logo-by-name/${encodeURIComponent(selectedGame.title)}`;
                          if (byIdUrl && !img.src.includes('/api/steamgriddb/')) {
                            img.src = byIdUrl;
                          } else if (!img.src.includes('logo-by-name')) {
                            img.src = byNameUrl;
                          } else {
                            img.style.display = 'none';
                            img.nextElementSibling?.removeAttribute('hidden');
                          }
                        }}
                      />
                    ) : null}
                    <h2 hidden={!!(selectedGame.logo || (selectedGame as any)._external || selectedGame.steam_url)} className="text-3xl md:text-4xl font-bold tracking-tight">{selectedGame.title}</h2>
                  </div>

                  {/* Tags row */}
                  <div className="flex items-center justify-between mt-5">
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedGame as any)._enriching && !selectedGame.tags && !selectedGame.genre
                        ? [14, 18, 12].map(w => <div key={w} className={`h-5 w-${w} bg-white/10 rounded-full animate-pulse`}/>)
                        : selectedGame.tags
                        ? Array.from(new Set(selectedGame.tags.split(',').map((t: string) => t.trim()))).slice(0, 5).map((tag: any) => (
                            <span key={tag} className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 bg-white/5 text-white/70 rounded-full border border-white/5">{tag}</span>
                          ))
                        : <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 bg-white/5 text-white/70 rounded-full border border-white/5">{selectedGame.genre}</span>
                      }
                      {!('playtime' in selectedGame) && (selectedGame as any).game_pass === 1 && (
                        <button onClick={() => openXboxApp(selectedGame.title)} className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 bg-[#107c10]/20 text-[#107c10] rounded-full border border-[#107c10]/30 hover:bg-[#107c10]/40 transition-colors font-bold cursor-pointer">
                          <XboxIcon className="w-2.5 h-2.5"/>Game Pass
                        </button>
                      )}
                      {!('playtime' in selectedGame) && epicFreeMap.has(selectedGame.title.toLowerCase().trim()) && (
                        <button onClick={() => { const u = epicFreeMap.get(selectedGame.title.toLowerCase().trim())!; const slug = u.match(/\/p\/([^/?]+)/)?.[1]; openInBrowser(slug ? `com.epicgames.launcher://store/p/${slug}` : u); }} className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 bg-[#0078f2]/20 text-[#4da6ff] rounded-full border border-[#0078f2]/30 hover:bg-[#0078f2]/40 transition-colors font-bold cursor-pointer">
                          <EpicIcon className="w-2.5 h-2.5"/>Free on Epic
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!(selectedGame as any)._external && (
                        <button onClick={() => { setIsEditingTags(!isEditingTags); setNewTagInput(''); }} className="text-[9px] font-mono uppercase text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer font-bold">
                          <Edit2 size={10}/>{isEditingTags ?'Done' :'Tags'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingTags && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {selectedGame.tags
                          ? Array.from(new Set(selectedGame.tags.split(',').map((t: string) => t.trim()))).map((tag: any) => (
                              <div key={tag} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono uppercase tracking-widest text-white/70">
                                {tag}
                                <button onClick={() => handleRemoveTag(selectedGame.id, tag.trim())} className="text-red-500 hover:text-red-400 transition-colors cursor-pointer"><X size={10}/></button>
                              </div>
                            ))
                          : <span className="text-[10px] opacity-30 italic">No tags added</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="text" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} onKeyDown={e => e.key ==='Enter' && handleAddTag(selectedGame.id, newTagInput)} placeholder="Add tag…" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500/50"/>
                        <button onClick={() => handleAddTag(selectedGame.id, newTagInput)} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors cursor-pointer"><Plus size={14}/></button>
                      </div>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-5">
                    {'playtime' in selectedGame && (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase opacity-40 tracking-widest">Playtime</span>
                        {editingPlaytime ? (
                          <form className="flex items-center gap-1" onSubmit={async (e) => {
                            e.preventDefault();
                            const hrs = parseFloat(playtimeInput);
                            if (isNaN(hrs) || hrs < 0) { setEditingPlaytime(false); return; }
                            try {
                              await fetch(`/api/launcher/games/${(selectedGame as LauncherGame).id}/playtime`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ hours: hrs })
                              });
                              const mins = Math.round(hrs * 60);
                              setSelectedGame((prev: any) => prev ? { ...prev, playtime: mins } as any : prev);
                              fetchLauncherGames();
                            } finally {
                              setEditingPlaytime(false);
                            }
                          }}>
                            <input
                              autoFocus
                              type="number"
                              min="0"
                              step="0.1"
                              value={playtimeInput}
                              onChange={e => setPlaytimeInput(e.target.value)}
                              onKeyDown={e => e.key === 'Escape' && setEditingPlaytime(false)}
                              className="w-16 bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-xs font-bold outline-none focus:border-white/50"
                              placeholder="hrs"
                            />
                            <button type="submit" className="text-emerald-400 hover:text-emerald-300 text-xs">✓</button>
                            <button type="button" onClick={() => setEditingPlaytime(false)} className="text-white/30 hover:text-white/60 text-xs">✕</button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-1.5 group/pt">
                            <span className="text-xs font-bold">{Math.round((selectedGame as LauncherGame).playtime / 60)} Hours</span>
                            <button
                              onClick={() => { setPlaytimeInput(((selectedGame as LauncherGame).playtime / 60).toFixed(1)); setEditingPlaytime(true); }}
                              className="opacity-0 group-hover/pt:opacity-60 hover:!opacity-100 transition-opacity"
                              title="Edit playtime"
                            >
                              <Pencil size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedGame.release_date && (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase opacity-40 tracking-widest">Released</span>
                        <span className="text-xs font-bold">{selectedGame.release_date}</span>
                      </div>
                    )}
                    {'last_played' in selectedGame && (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase opacity-40 tracking-widest">Last Played</span>
                        <span className="text-xs font-bold">
                          {(selectedGame as LauncherGame).last_played
                            ? new Date((selectedGame as LauncherGame).last_played!).toLocaleDateString('en-GB')
                            : 'Never'}
                        </span>
                      </div>
                    )}
                    {!('playtime' in selectedGame) && ('steam_rating' in selectedGame && selectedGame.steam_rating ? (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase opacity-40 tracking-widest flex items-center gap-1"><SteamIcon className="w-2.5 h-2.5"/>Rating</span>
                        <span className="text-xs font-bold text-[#66c0f4]">{selectedGame.steam_rating}</span>
                      </div>
                    ) : ('metacritic' in selectedGame) && (selectedGame as any).metacritic ? (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase opacity-40 tracking-widest flex items-center gap-1"><MetacriticIcon className="w-2.5 h-2.5"/>User Score</span>
                        <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded w-fit", (selectedGame as any).metacritic >= 61 ? "bg-green-600 text-white" : (selectedGame as any).metacritic >= 40 ? "bg-yellow-600 text-white" : "bg-red-600 text-white")}>
                          {(selectedGame as any).steam_url ? (selectedGame as any).metacritic : ((selectedGame as any).metacritic / 10).toFixed(1)}
                        </span>
                      </div>
                    ) : null)}
                  </div>

                  {(selectedGame as any)._enriching && !selectedGame.description && (
                    <section>
                      <h3 className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-2">About</h3>
                      <div className="space-y-1.5">
                        <div className="h-3 bg-white/10 rounded animate-pulse w-full"/>
                        <div className="h-3 bg-white/10 rounded animate-pulse w-5/6"/>
                        <div className="h-3 bg-white/10 rounded animate-pulse w-4/6"/>
                      </div>
                    </section>
                  )}
                  {'description' in selectedGame && selectedGame.description && (
                    <section>
                      <h3 className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-2">About</h3>
                      <p className="text-xs leading-relaxed opacity-70 font-light line-clamp-4 hover:line-clamp-none transition-all duration-300">{selectedGame.description}</p>
                    </section>
                  )}

                  {/* ── ACTION BUTTONS ── 3-col for launcher, 2-col for questlog */}
                  {'playtime' in selectedGame ? (() => {
                    const achs = (selectedGame as LauncherGame).achievements ? JSON.parse((selectedGame as LauncherGame).achievements!) : [];
                    const unlockedAchs = achs.filter((a: any) => a.unlocked);
                    const isInstalled = (selectedGame as LauncherGame).installed;
                    const platform = (selectedGame as LauncherGame).platform;
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        {/* Launch/ Install */}
                        <button onClick={() => {
                            if (isInstalled) { handleLaunch(selectedGame as LauncherGame); }
                            else {
                              if (platform ==='steam') {
                                window.location.href = `steam://install/${(selectedGame as LauncherGame).external_id}`;
                              } else if (platform === 'epic') {
                                const installUrl = (selectedGame as LauncherGame).launch_path?.replace('action=launch', 'action=install');
                                if (installUrl) openInBrowser(installUrl);
                              } else if (platform ==='xbox') {
                                window.open(`https://www.xbox.com/en-GB/games/store/game/${(selectedGame as LauncherGame).external_id}`,'_blank');
                                handleToggleInstalled(selectedGame.id, true);
                              } else if (platform ==='ea') {
                                window.open('https://www.ea.com/ea-app', '_blank');
                                handleToggleInstalled(selectedGame.id, true);
                              } else {
                                handleToggleInstalled(selectedGame.id, true);
                              }
                            }
                          }}
                          className={cn("flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer", isInstalled ?"bg-white text-[#141414] hover:bg-white/90" :"bg-emerald-600 text-white hover:bg-emerald-500")}
>
                          <div className="flex items-center gap-2.5">
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", isInstalled ?"bg-[#141414]/10" :"bg-white/20")}>
                              {isInstalled ? <ArrowUpRight size={16}/> : <Download size={16}/>}
                            </div>
                            <div className="text-left">
                              <p className="text-[8px] font-mono uppercase opacity-50 tracking-widest">Action</p>
                              <p className="font-bold text-sm leading-tight">{isInstalled ?'Launch Game' :'Install Game'}</p>
                            </div>
                          </div>
                        </button>

                        {/* Achievements */}
                        <button onClick={() => setShowAchievementsModal(true)} className="flex items-center justify-between p-3 bg-indigo-900/10 border border-indigo-900/30 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0"><Trophy size={16}/></div>
                            <div className="text-left">
                              <p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Achievements</p>
                              <p className="font-bold text-sm text-indigo-400">{unlockedAchs.length> 0 ? `${unlockedAchs.length}/ ${achs.length}` :'View Details'}</p>
                            </div>
                          </div>
                          {unlockedAchs.length> 0 && (
                            <div className="flex -space-x-2 shrink-0">
                              {unlockedAchs.slice(0, 3).map((ach: any, idx: number) => (
                                <div key={idx} className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] bg-indigo-900/50 overflow-hidden">
                                  {ach.icon ? <img src={ach.icon} alt={ach.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-indigo-400"><Trophy size={8}/></div>}
                                </div>
                              ))}
                              {unlockedAchs.length> 3 && <div className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] bg-indigo-900/80 flex items-center justify-center text-[9px] font-bold text-indigo-200">+{unlockedAchs.length - 3}</div>}
                            </div>
                          )}
                        </button>

                        {/* Friends who own */}
                        <button onClick={() => {
                          if (selectedGame && 'platform' in selectedGame) {
                            fetchLauncherFriends(selectedGame as LauncherGame);
                          } else if (selectedGame) {
                            fetchQuestlogFriends(selectedGame as Game);
                          }
                          setShowFriendsModal(true);
                        }} className="flex items-center justify-between p-3 bg-emerald-900/10 border border-emerald-900/30 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0"><Users size={16}/></div>
                            <div className="text-left">
                              <p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Friends</p>
                            </div>
                          </div>
                          <div className="flex -space-x-2 shrink-0">
                            {friendsWhoOwn.slice(0, 3).map((f, idx) => (
                              <div key={idx} className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] overflow-hidden bg-emerald-900/50">
                                <img src={f.avatar || ''} alt={f.username} referrerPolicy="no-referrer"
                                  onError={(e) => { const t = e.target as HTMLImageElement; const c = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='16' fill='%2310b981'/><text x='16' y='21' text-anchor='middle' fill='white' font-size='14' font-family='system-ui' font-weight='600'>${(f.username[0]||'?').toUpperCase()}</text></svg>`); t.src=`data:image/svg+xml,${c}`; t.onerror=null; }}
                                  className="w-full h-full object-cover"/>
                              </div>
                            ))}
                            {friendsWhoOwn.length> 3 && <div className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] bg-emerald-900/80 flex items-center justify-center text-[9px] font-bold text-emerald-200">+{friendsWhoOwn.length - 3}</div>}
                          </div>
                        </button>
                      </div>
                    );
                  })() : (selectedGame as any)._external ? (() => {
                    const isInLog = games.some((g: Game) => g.title.toLowerCase() === (selectedGame as any).title.toLowerCase());
                    if (isInLog) {
                      const logGame = games.find((g: Game) => g.title.toLowerCase() === (selectedGame as any).title.toLowerCase())!;
                      return (
                        <div className="grid grid-cols-3 gap-2">
                          {/\/app\/\d+/.test(logGame.steam_url || '') ? (
                            <button onClick={() => { const m = (logGame.steam_url || '').match(/\/app\/(\d+)/); openInBrowser(m ? `steam://store/${m[1]}` : logGame.steam_url!); }} className="flex items-center justify-between p-3 bg-[#1b2838] border border-[#66c0f4]/20 rounded-2xl hover:border-[#66c0f4]/50 transition-all cursor-pointer">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-[#66c0f4]/10 rounded-xl flex items-center justify-center shrink-0"><SteamIcon className="w-5 h-5 text-[#66c0f4]"/></div>
                                <div className="text-left"><p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Store</p><p className="font-bold text-sm text-[#66c0f4]">Steam</p></div>
                              </div>
                            </button>
                          ) : (
                            <button onClick={() => openInBrowser(`https://www.igdb.com/search?type=1&q=${encodeURIComponent(logGame.title)}`)} className="flex items-center justify-between p-3 bg-[#9147ff]/10 border border-[#9147ff]/20 rounded-2xl hover:border-[#9147ff]/50 transition-all cursor-pointer">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-[#9147ff]/10 rounded-xl flex items-center justify-center shrink-0 text-[#9147ff] font-black text-sm">IG</div>
                                <div className="text-left"><p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Database</p><p className="font-bold text-sm text-[#9147ff]">IGDB</p></div>
                              </div>
                            </button>
                          )}
                          <button onClick={() => openInBrowser(logGame.allkeyshop_url!)} className="flex items-center justify-between p-3 bg-emerald-900/10 border border-emerald-900/30 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0"><Tag size={16}/></div>
                              <div className="text-left"><p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Best Price</p><p className="font-bold text-emerald-400 text-sm">{formatPrice(logGame.lowest_price) ?? 'Check'}</p></div>
                            </div>
                          </button>
                          <button onClick={() => { fetchQuestlogFriends(logGame); setShowFriendsModal(true); }} className="flex items-center justify-between p-3 bg-emerald-900/10 border border-emerald-900/30 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0"><Users size={16}/></div>
                              <div className="text-left"><p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Friends</p></div>
                            </div>
                          </button>
                        </div>
                      );
                    }
                    // Not in log
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        {(() => {
                          const sid = (selectedGame as any).steamAppID;
                          const hasSteam = !!(sid || /\/app\/\d+/.test((selectedGame as any).steam_url || ''));
                          const lookupDone = !!(selectedGame as any)._steamLookupDone;
                          const isExternal = !!(selectedGame as any)._external;
                          if (isExternal && !hasSteam && !lookupDone) return (
                            <button disabled className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl cursor-default opacity-60">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center shrink-0"><span className="animate-spin text-white/40 text-xs">⟳</span></div>
                                <div className="text-left"><p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Store</p><p className="font-bold text-sm text-white/40">Checking...</p></div>
                              </div>
                            </button>
                          );
                          if (hasSteam) return (
                            <button onClick={() => openInBrowser(sid ? `steam://store/${sid}` : (selectedGame as any).steam_url)} className="flex items-center justify-between p-3 bg-[#1b2838] border border-[#66c0f4]/20 rounded-2xl hover:border-[#66c0f4]/50 transition-all cursor-pointer">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-[#66c0f4]/10 rounded-xl flex items-center justify-center shrink-0"><SteamIcon className="w-5 h-5 text-[#66c0f4]"/></div>
                                <div className="text-left"><p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Store</p><p className="font-bold text-sm text-[#66c0f4]">Steam</p></div>
                              </div>
                            </button>
                          );
                          return (
                            <button onClick={() => openInBrowser(`https://www.igdb.com/search?type=1&q=${encodeURIComponent((selectedGame as any).title)}`)} className="flex items-center justify-between p-3 bg-[#9147ff]/10 border border-[#9147ff]/20 rounded-2xl hover:border-[#9147ff]/50 transition-all cursor-pointer">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-[#9147ff]/10 rounded-xl flex items-center justify-center shrink-0 text-[#9147ff] font-black text-sm">IG</div>
                                <div className="text-left"><p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Database</p><p className="font-bold text-sm text-[#9147ff]">IGDB</p></div>
                              </div>
                            </button>
                          );
                        })()}
                        <button onClick={() => handleAddExternalToLog((selectedGame as any))} disabled={isAddingToLog} className="flex items-center justify-between p-3 bg-emerald-900/10 border border-emerald-900/30 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0"><Plus size={16}/></div>
                            <div className="text-left"><p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Action</p><p className="font-bold text-emerald-400 text-sm">{isAddingToLog ? 'Adding...' : 'Add to Log'}</p></div>
                          </div>
                        </button>
                        <button onClick={() => { fetchQuestlogFriends(selectedGame as any); setShowFriendsModal(true); }} className="flex items-center justify-between p-3 bg-emerald-900/10 border border-emerald-900/30 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0"><Users size={16}/></div>
                            <div className="text-left"><p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Friends</p></div>
                          </div>
                          {friendsWhoOwn.length > 0 && (
                            <div className="flex -space-x-2 shrink-0">
                              {friendsWhoOwn.slice(0, 3).map((f, idx) => (
                                <div key={idx} className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] overflow-hidden bg-emerald-900/50">
                                  <img src={f.avatar || ''} alt={f.username} referrerPolicy="no-referrer"
                                  onError={(e) => { const t = e.target as HTMLImageElement; const c = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='16' fill='%2310b981'/><text x='16' y='21' text-anchor='middle' fill='white' font-size='14' font-family='system-ui' font-weight='600'>${(f.username[0]||'?').toUpperCase()}</text></svg>`); t.src=`data:image/svg+xml,${c}`; t.onerror=null; }}
                                  className="w-full h-full object-cover"/>
                                </div>
                              ))}
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })() : libraryMatchMap.has(selectedGame.id) ? (() => {
                    const libMatch = libraryMatchMap.get(selectedGame.id)!;
                    const achs = libMatch.achievements ? JSON.parse(libMatch.achievements!) : [];
                    const unlockedAchs = achs.filter((a: any) => a.unlocked);
                    const isInstalled = libMatch.installed;
                    const platform = libMatch.platform;
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => {
                            if (isInstalled) { handleLaunch(libMatch); }
                            else {
                              if (platform === 'steam') {
                                window.location.href = `steam://install/${libMatch.external_id}`;
                              } else if (platform === 'epic') {
                                const installUrl = libMatch.launch_path?.replace('action=launch', 'action=install');
                                if (installUrl) openInBrowser(installUrl);
                              } else if (platform === 'xbox') {
                                window.open(`https://www.xbox.com/en-GB/games/store/game/${libMatch.external_id}`, '_blank');
                                handleToggleInstalled(libMatch.id, true);
                              } else if (platform === 'ea') {
                                window.open('https://www.ea.com/ea-app', '_blank');
                                handleToggleInstalled(libMatch.id, true);
                              } else {
                                handleToggleInstalled(libMatch.id, true);
                              }
                            }
                          }}
                          className={cn("flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer", isInstalled ? "bg-white text-[#141414] hover:bg-white/90" : "bg-emerald-600 text-white hover:bg-emerald-500")}>
                          <div className="flex items-center gap-2.5">
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", isInstalled ? "bg-[#141414]/10" : "bg-white/20")}>
                              {isInstalled ? <ArrowUpRight size={16}/> : <Download size={16}/>}
                            </div>
                            <div className="text-left">
                              <p className="text-[8px] font-mono uppercase opacity-50 tracking-widest">Action</p>
                              <p className="font-bold text-sm leading-tight">{isInstalled ? 'Launch Game' : 'Install Game'}</p>
                            </div>
                          </div>
                        </button>
                        <button onClick={() => setShowAchievementsModal(true)} className="flex items-center justify-between p-3 bg-indigo-900/10 border border-indigo-900/30 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0"><Trophy size={16}/></div>
                            <div className="text-left">
                              <p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Achievements</p>
                              <p className="font-bold text-sm text-indigo-400">{unlockedAchs.length > 0 ? `${unlockedAchs.length}/${achs.length}` : 'View Details'}</p>
                            </div>
                          </div>
                          {unlockedAchs.length > 0 && (
                            <div className="flex -space-x-2 shrink-0">
                              {unlockedAchs.slice(0, 3).map((ach: any, idx: number) => (
                                <div key={idx} className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] bg-indigo-900/50 overflow-hidden">
                                  {ach.icon ? <img src={ach.icon} alt={ach.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-indigo-400"><Trophy size={8}/></div>}
                                </div>
                              ))}
                              {unlockedAchs.length > 3 && <div className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] bg-indigo-900/80 flex items-center justify-center text-[9px] font-bold text-indigo-200">+{unlockedAchs.length - 3}</div>}
                            </div>
                          )}
                        </button>
                        <button onClick={() => { fetchLauncherFriends(libMatch); setShowFriendsModal(true); }} className="flex items-center justify-between p-3 bg-emerald-900/10 border border-emerald-900/30 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0"><Users size={16}/></div>
                            <div className="text-left"><p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Friends</p></div>
                          </div>
                          <div className="flex -space-x-2 shrink-0">
                            {friendsWhoOwn.slice(0, 3).map((f, idx) => (
                              <div key={idx} className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] overflow-hidden bg-emerald-900/50">
                                <img src={f.avatar || ''} alt={f.username} referrerPolicy="no-referrer"
                                  onError={(e) => { const t = e.target as HTMLImageElement; const c = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='16' fill='%2310b981'/><text x='16' y='21' text-anchor='middle' fill='white' font-size='14' font-family='system-ui' font-weight='600'>${(f.username[0]||'?').toUpperCase()}</text></svg>`); t.src=`data:image/svg+xml,${c}`; t.onerror=null; }}
                                  className="w-full h-full object-cover"/>
                              </div>
                            ))}
                            {friendsWhoOwn.length > 3 && <div className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] bg-emerald-900/80 flex items-center justify-center text-[9px] font-bold text-emerald-200">+{friendsWhoOwn.length - 3}</div>}
                          </div>
                        </button>
                      </div>
                    );
                  })() : (
                    <div className="grid grid-cols-3 gap-2">
                      {(() => {
                        const hasSteamAppId = /\/app\/\d+/.test((selectedGame as any).steam_url || '');
                        const lookupDone = !!(selectedGame as any)._steamLookupDone;
                        if (hasSteamAppId) return (
                          <button onClick={() => { const m = ((selectedGame as any).steam_url || '').match(/\/app\/(\d+)/); openInBrowser(m ? `steam://store/${m[1]}` : (selectedGame as any).steam_url); }} className="flex items-center justify-between p-3 bg-[#1b2838] border border-[#66c0f4]/20 rounded-2xl hover:border-[#66c0f4]/50 transition-all cursor-pointer">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 bg-[#66c0f4]/10 rounded-xl flex items-center justify-center shrink-0"><SteamIcon className="w-5 h-5 text-[#66c0f4]"/></div>
                              <div className="text-left"><p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Store</p><p className="font-bold text-sm text-[#66c0f4]">Steam</p></div>
                            </div>
                          </button>
                        );
                        if (!lookupDone) return (
                          <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl opacity-50">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center shrink-0"><Loader2 size={16} className="animate-spin opacity-40"/></div>
                              <div className="text-left"><p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Store</p><p className="font-bold text-sm opacity-40">Checking…</p></div>
                            </div>
                          </div>
                        );
                        return (
                          <button onClick={() => openInBrowser(`https://www.igdb.com/search?type=1&q=${encodeURIComponent(selectedGame.title)}`)} className="flex items-center justify-between p-3 bg-[#9147ff]/10 border border-[#9147ff]/20 rounded-2xl hover:border-[#9147ff]/50 transition-all cursor-pointer">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 bg-[#9147ff]/10 rounded-xl flex items-center justify-center shrink-0 text-[#9147ff] font-black text-sm">IG</div>
                              <div className="text-left"><p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Database</p><p className="font-bold text-sm text-[#9147ff]">IGDB</p></div>
                            </div>
                          </button>
                        );
                      })()}
                      {/* Best price */}
                      <button
                        onClick={() => openInBrowser((selectedGame as any).allkeyshop_url)}
                        className="flex items-center justify-between p-3 bg-emerald-900/10 border border-emerald-900/30 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer"
>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0"><Tag size={16}/></div>
                          <div className="text-left">
                            <p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Best Price</p>
                            {priceLoading
                              ? <p className="font-bold text-emerald-400/50 text-sm animate-pulse">Finding...</p>
                              : <p className="font-bold text-emerald-400 text-sm">{formatPrice((selectedGame as any).lowest_price) ?? 'Check'}</p>
                            }
                          </div>
                        </div>
                      </button>
                      {/* Friends */}
                      <button
                        onClick={() => { fetchQuestlogFriends(selectedGame as any); setShowFriendsModal(true); }}
                        className="flex items-center justify-between p-3 bg-emerald-900/10 border border-emerald-900/30 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer"
>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0"><Users size={16}/></div>
                          <div className="text-left">
                            <p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Friends</p>
                          </div>
                        </div>
                        {friendsWhoOwn.length> 0 && (
                          <div className="flex -space-x-2 shrink-0">
                            {friendsWhoOwn.slice(0, 3).map((f, idx) => (
                              <div key={idx} className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] overflow-hidden bg-emerald-900/50">
                                <img src={f.avatar || ''} alt={f.username} referrerPolicy="no-referrer"
                                  onError={(e) => { const t = e.target as HTMLImageElement; const c = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='16' fill='%2310b981'/><text x='16' y='21' text-anchor='middle' fill='white' font-size='14' font-family='system-ui' font-weight='600'>${(f.username[0]||'?').toUpperCase()}</text></svg>`); t.src=`data:image/svg+xml,${c}`; t.onerror=null; }}
                                  className="w-full h-full object-cover"/>
                              </div>
                            ))}
                            {friendsWhoOwn.length> 3 && <div className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] bg-emerald-900/80 flex items-center justify-center text-[9px] font-bold text-emerald-200">+{friendsWhoOwn.length - 3}</div>}
                          </div>
                        )}
                      </button>
                    </div>
                  )}

                  {/* ── GROUP COMMENTS + WHO HAS THIS (shared games only) ── */}
                  {(selectedGame as any).list_type === 'shared' && !(selectedGame as any)._external && (
                    <div className="pt-5 border-t border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                          <Users size={12}/> Group Discussion
                        </p>
                        {groupOwnership && groupOwnership.members.length > 0 && (
                          <button
                            onClick={() => setWhoHasThisOpen(o => !o)}
                            className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                          >
                            <div className="flex -space-x-1.5">
                              {groupOwnership.members.slice(0, 4).map(m => (
                                <MemberAvatar key={m.id} username={m.username} avatar={m.avatar} size="xs"
                                  owns={(groupOwnership.ownership[selectedGame.id] ?? []).includes(m.id)}
                                />
                              ))}
                            </div>
                            Who has this
                            <ChevronDown size={10} className={cn("transition-transform duration-200", whoHasThisOpen && "rotate-180")} />
                          </button>
                        )}
                      </div>
                      {whoHasThisOpen && groupOwnership && (
                        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                          {groupOwnership.members.map(m => {
                            const owns = (groupOwnership.ownership[selectedGame.id] ?? []).includes(m.id);
                            return (
                              <button key={m.id} onClick={() => openMemberProfile(m)}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer"
                              >
                                <MemberAvatar username={m.username} avatar={m.avatar} size="xs" owns={owns} />
                                <div className="text-left">
                                  <p className="text-[10px] font-bold text-white/80 leading-none">{m.username}</p>
                                  <p className={cn("text-[8px] font-mono mt-0.5", owns ? "text-emerald-400" : "text-white/25")}>{owns ? 'Owned' : 'Not owned'}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                        {gameComments.length === 0 ? (
                          <p className="text-xs text-white/20 italic py-2">No comments yet — be the first!</p>
                        ) : gameComments.map(c => (
                          <div key={c.id} className="flex gap-2.5">
                            <img src={c.avatar || ''} alt={c.username}
                              onError={(e) => { const t = e.target as HTMLImageElement; const c2 = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='16' fill='%23374151'/><text x='16' y='21' text-anchor='middle' fill='white' font-size='14' font-family='system-ui' font-weight='600'>${(c.username[0]||'?').toUpperCase()}</text></svg>`); t.src=`data:image/svg+xml,${c2}`; t.onerror=null; }}
                              className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0 mt-0.5"/>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-[11px] font-bold text-white/80">{c.username}</span>
                                <span className="text-[9px] text-white/20 font-mono">{new Date(c.created_at).toLocaleDateString('en-GB')}</span>
                                {c.user_id === user?.id && (
                                  <button onClick={() => deleteComment(c.id)} className="text-[9px] text-white/20 hover:text-red-400 transition-colors ml-auto">delete</button>
                                )}
                              </div>
                              <p className="text-xs text-white/60 leading-relaxed break-words">{c.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={commentInput}
                          onChange={e => setCommentInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(selectedGame.id); } }}
                          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-white/30 transition-all"
                        />
                        <button onClick={() => postComment(selectedGame.id)} disabled={!commentInput.trim()} className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">Post</button>
                      </div>
                    </div>
                  )}

                  {!(selectedGame as any)._external && (
                  <div className="pt-5 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-20">Added {new Date(selectedGame.created_at).toLocaleDateString('en-GB')}</p>
                    {(() => {
                      const isLauncher ='playtime' in selectedGame;
                      const isInstalled = isLauncher && (selectedGame as LauncherGame).installed;
                      const platform = isLauncher ? (selectedGame as LauncherGame).platform : null;
                      const handleUninstallClick = () => {
                        const externalId = (selectedGame as LauncherGame).external_id;
                        if (platform === 'steam') window.open(`steam://uninstall/${externalId}`, '_blank');
                        else if (platform === 'xbox') window.open('ms-xboxapp://', '_blank');
                        else if (platform === 'ea') window.open('ea://', '_blank');
                      };
                      const isLocal = platform === 'local';
                      const isHideAction = isLauncher && !isInstalled && !isLocal;
                      const confirmLabel = isLocal ? 'Remove?' : isInstalled ? 'Uninstall?' : isLauncher ? 'Hide?' : 'Remove?';
                      const actionLabel = isLocal ? 'Remove Game' : isInstalled ? 'Uninstall' : isLauncher ? 'Hide Game' : 'Remove Game';
                      const handleConfirm = () => {
                        if (isLocal) { handleHideGame(selectedGame.id); setConfirmDelete(null); setSelectedGame(null); }
                        else if (isInstalled) { handleUninstallClick(); }
                        else if (isHideAction) { handleHideGame(selectedGame.id); setConfirmDelete(null); setSelectedGame(null); }
                        else { deleteGame(selectedGame.id); }
                      };
                      return confirmDelete === selectedGame.id ? (
                        <div className="flex items-center gap-2 bg-red-900/10 p-2 rounded-xl border border-red-900/30">
                          <span className="text-[10px] font-bold text-red-500 px-2">{confirmLabel}</span>
                          <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer">No</button>
                          <button onClick={handleConfirm} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all cursor-pointer shadow-lg">Yes</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(selectedGame.id)} className="flex items-center gap-2 text-red-600/60 hover:text-red-500 transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-widest">
                          {isHideAction ? <EyeOff size={14}/> : <Trash2 size={14}/>}{actionLabel}
                        </button>
                      );
                    })()}
                  </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FRIENDS WHO OWN MODAL ── */}
      <AnimatePresence>
        {showFriendsModal && selectedGame && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={() => setShowFriendsModal(false)}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-[#141414] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl"
>
              <div className="absolute inset-0 pointer-events-none z-10" style={{ boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)', borderRadius: 'inherit' }}/>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold tracking-tighter uppercase italic font-serif flex items-center gap-3">
                  <Users className="text-emerald-500" size={20}/>
                  Friends &amp; {selectedGame.title}
                </h3>
                <button onClick={() => setShowFriendsModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"><X size={20}/></button>
              </div>
              <div className="overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                {friendsWhoOwn.length> 0 ? friendsWhoOwn.map((f, idx) => {
                  const lastPlayedStr = f.last_played
                    ? new Date(f.last_played * 1000).toLocaleDateString('en-GB')
                    : undefined;
                  return (
                    <FriendRow
                      key={idx}
                      friend={{ id: idx, username: f.username, avatar: f.avatar, online_status: f.online_status, current_game: f.current_game }}
                      lastPlayedAt={lastPlayedStr}
                      platform={f.platform}
/>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center py-16 opacity-30 text-center">
                    <Users size={40} className="mb-4"/>
                    <p className="text-sm font-mono uppercase tracking-widest">No friends own this game</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ACHIEVEMENTS MODAL ── */}
      <AnimatePresence>
        {showAchievementsModal && selectedGame && (() => {
          const libMatch = !('playtime' in selectedGame) && !(selectedGame as any)._external ? libraryMatchMap.get(selectedGame.id) : null;
          const achSrc = libMatch ?? (selectedGame as LauncherGame);
          const achs = achSrc.achievements ? JSON.parse(achSrc.achievements!) : [];
          const unlockedAchs = achs.filter((a: any) => a.unlocked);
          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={() => setShowAchievementsModal(false)}>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={(e) => e.stopPropagation()}
                className="relative bg-[#141414] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
>
                <div className="absolute inset-0 pointer-events-none z-10" style={{ boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)', borderRadius: 'inherit' }}/>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold tracking-tighter uppercase italic font-serif flex items-center gap-3">
                    <Trophy className="text-indigo-500"/>
                    Achievements
                    {achs.length> 0 && <span className="text-sm font-normal text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">{unlockedAchs.length}/ {achs.length} Unlocked</span>}
                  </h3>
                  <button onClick={() => setShowAchievementsModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"><X size={20}/></button>
                </div>
                <div className="overflow-y-auto flex-1 pr-2 space-y-3 custom-scrollbar">
                  {achs.length> 0 ? achs.map((ach: any, idx: number) => (
                    <div key={idx} className={`flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors ${!ach.unlocked ?'opacity-40' :''}`}>
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 shrink-0">
                        {ach.icon ? <img src={ach.icon} alt={ach.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center opacity-20"><Trophy size={20}/></div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate">{ach.name}</p>
                      <p className="text-xs opacity-60 truncate">{ach.description || (ach.unlocked ?'Achievement unlocked!' :'Hidden achievement')}</p>
                      </div>
                      {ach.unlocked && ach.unlockTime ? (
                        <div className="text-[10px] font-mono opacity-40 shrink-0 text-right"><p>{new Date(ach.unlockTime * 1000).toLocaleDateString('en-GB')}</p></div>
                      ) : (
                        <div className="text-[10px] font-mono opacity-40 shrink-0 text-right"><Lock size={12}/></div>
                      )}
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
                      <Trophy size={48} className="mb-4"/>
                      <p className="text-sm font-mono uppercase tracking-widest">No achievements found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}
