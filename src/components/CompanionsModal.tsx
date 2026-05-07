import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Search, Users, UserPlus, UserMinus, MessageCircle, Send,
  ChevronDown, Camera, Gamepad2, Calendar, Clock, Library, Plus, CheckCircle2, Link as LinkIcon, ExternalLink,
} from 'lucide-react';

const SteamIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 65 65" fill="currentColor" className={className}>
    <path d="M30.31 23.985l.003.158-7.83 11.375c-1.268-.058-2.54.165-3.748.662a8.14 8.14 0 0 0-1.498.8L.042 29.893s-.398 6.546 1.26 11.424l12.156 5.016c.6 2.728 2.48 5.12 5.242 6.27a8.88 8.88 0 0 0 11.603-4.782 8.89 8.89 0 0 0 .684-3.656L42.18 36.16l.275.005c6.705 0 12.155-5.466 12.155-12.18s-5.44-12.16-12.155-12.174c-6.702 0-12.155 5.46-12.155 12.174zm-1.88 23.05c-1.454 3.5-5.466 5.147-8.953 3.694a6.84 6.84 0 0 1-3.524-3.362l3.957 1.64a5.04 5.04 0 0 0 6.591-2.719 5.05 5.05 0 0 0-2.715-6.601l-4.1-1.695c1.578-.6 3.372-.62 5.05.077 1.7.703 3 2.027 3.696 3.72s.692 3.56-.01 5.246M42.466 32.1a8.12 8.12 0 0 1-8.098-8.113 8.12 8.12 0 0 1 8.098-8.111 8.12 8.12 0 0 1 8.1 8.111 8.12 8.12 0 0 1-8.1 8.113m-6.068-8.126a6.09 6.09 0 0 1 6.08-6.095c3.355 0 6.084 2.73 6.084 6.095a6.09 6.09 0 0 1-6.084 6.093 6.09 6.09 0 0 1-6.081-6.093z"/>
  </svg>
);
const XboxIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 372.36823 372.57281" fill="currentColor" className={className}>
    <g transform="translate(-1.5706619,12.357467)">
      <path d="M 169.18811,359.44924 C 140.50497,356.70211 111.4651,346.40125 86.518706,330.1252 65.614374,316.48637 60.893704,310.87967 60.893704,299.69061 c 0,-22.47524 24.711915,-61.84014 66.992496,-106.71584 24.01246,-25.48631 57.46022,-55.36001 61.0775,-54.55105 7.0309,1.57238 63.25048,56.41053 84.29655,82.2252 33.28077,40.82148 48.58095,74.24535 40.808,89.14682 -5.9087,11.32753 -42.57224,33.4669 -69.50775,41.97242 -22.19984,7.01011 -51.35538,9.9813 -75.37239,7.68108 z M 32.660004,276.3228 C 15.288964,249.67326 6.5125436,223.43712 2.2752336,185.49086 c -1.39917002,-12.53 -0.89778,-19.69701 3.17715,-45.41515 5.0788204,-32.05404 23.3330104,-69.136381 45.2671304,-91.957616 9.34191,-9.719732 10.17624,-9.956543 21.56341,-6.120482 13.828357,4.658436 28.595936,14.857457 51.498366,35.56661 l 13.36254,12.082873 -7.2969,8.96431 C 95.97448,140.22403 60.217254,199.2085 46.741444,235.70071 c -7.32599,19.83862 -10.28084,39.75281 -7.12868,48.04363 2.12818,5.59752 0.17339,3.51093 -6.95276,-7.42154 z m 304.915426,4.53255 c 1.71605,-8.37719 -0.4544,-23.76257 -5.5413,-39.28002 -11.01667,-33.60598 -47.83964,-96.12421 -81.65282,-138.63054 L 239.73699,89.563875 251.25285,78.989784 c 15.03631,-13.806637 25.47602,-22.073835 36.74025,-29.094513 8.88881,-5.540156 21.59109,-10.444558 27.05113,-10.444558 3.36626,0 15.21723,12.298726 24.78421,25.720611 14.81725,20.787711 25.71782,45.986976 31.24045,72.219686 3.56833,16.9498 3.8657,53.23126 0.57486,70.13935 -2.70068,13.87582 -8.40314,31.87484 -13.9661,44.08195 -4.16823,9.14657 -14.53521,26.91044 -19.0783,32.69074 -2.33569,2.97175 -2.33761,2.96527 -1.02393,-3.4477 z M 172.25917,33.104812 c -15.60147,-7.922671 -39.6696,-16.427164 -52.96493,-18.715209 -4.66097,-0.802124 -12.61193,-1.249474 -17.6688,-0.994114 -10.969613,.55394 -10.479662,-0.0197 7.11783,-8.3336652 14.63023,-6.912081 26.83386,-10.976696 43.40044,-14.455218 18.6362,-3.9130858 53.66559,-3.9590088 72.00507,-0.0944 19.80818,4.174105 43.13297,12.854085 56.27623,20.9423862 l 3.90633,2.403927 -8.96247,-0.452584 c -17.81002,-0.899366 -43.76575,6.295879 -71.63269,19.857459 -8.40538,4.090523 -15.71788,7.357511 -16.25,7.25997 -0.53211,-0.09754 -7.38426,-3.43589 -15.22701,-7.418555 z"/>
    </g>
  </svg>
);
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 127.14 96.36" fill="currentColor" className={className}>
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
  </svg>
);
const EpicIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M3 0v18l3.5 2V4h11V2H3zm4 4v18l3.5-2V6h7V4H7zm4 4v10l9.5-5-9.5-5z"/>
  </svg>
);
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// Reusable member avatar — shows initials on broken/missing image
const AVATAR_COLORS = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#db2777','#0891b2','#9333ea'];
function avatarColor(username: string) { return AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length]; }

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

interface CompanionsModalProps {
  showQuestlogFriends: boolean;
  setShowQuestlogFriends: (v: boolean) => void;
  user: any;
  token: string | null;
  friendsModalTab: string;
  setFriendsModalTab: (v: any) => void;
  notificationCount: number;
  pendingRequests: any[];
  setPendingRequests: (v: any) => void;
  friendSearch: string;
  setFriendSearch: (v: string) => void;
  friendSearchResults: any[];
  appFriends: any[];
  sentFriendRequests: Set<number>;
  friendActivity: Record<number, any[]>;
  commonGames: Record<number, any[]>;
  expandedFriend: number | null;
  convoMessages: any[];
  convoInput: string;
  setConvoInput: (v: string) => void;
  selectedConvoFriend: any;
  setSelectedConvoFriend: (v: any) => void;
  groups: any[];
  groupMessages: any[];
  groupConvoInput: string;
  setGroupConvoInput: (v: string) => void;
  selectedGroupConvo: any;
  groupOwnership: any;
  avatarInput: string;
  setAvatarInput: (v: string) => void;
  activityPrivate: boolean;
  setActivityPrivate: (v: boolean) => void;
  settingsUsername: string;
  setSettingsUsername: (v: string) => void;
  settingsCurrentPwd: string;
  setSettingsCurrentPwd: (v: string) => void;
  settingsNewPwd: string;
  setSettingsNewPwd: (v: string) => void;
  settingsConfirmPwd: string;
  setSettingsConfirmPwd: (v: string) => void;
  settingsSaveMsg: any;
  setSettingsSaveMsg: (v: any) => void;
  upcomingSessions: any[];
  addFriend: (username: string, id?: number) => void;
  removeFriend: (id: number) => void;
  searchUsers: (q: string) => void;
  fetchFriendActivity: (id: number) => void;
  fetchNotificationCount: () => void;
  openConversation: (friend: any) => void;
  openGroupConversation: (group: any) => void;
  openMemberProfile: (member: any) => void;
  handleDiscoverGameClick: (game: any) => void;
  handleLogout: () => void;
  saveAvatar: () => void;
  saveSettings: (data: any) => void;
  sendConvoMessage: () => void;
  sendGroupMessage: () => void;
  addToCalendar: (invite: any) => void;
  setSessionModal: (v: any) => void;
  setSessionDateTime: (v: string) => void;
  setSessionMessage: (v: string) => void;
  setExpandedFriend: (v: any) => void;
  markMessagesRead: (friendId: number) => void;
  handleLinkProfile: (platform: string) => void;
  handleSyncXbox: () => void;
  handleSyncEpic: () => void;
  setShowSteamLinkModal: (v: boolean) => void;
}

export default function CompanionsModal(props: CompanionsModalProps) {
  const {
    showQuestlogFriends, setShowQuestlogFriends, user, token, friendsModalTab, setFriendsModalTab,
    notificationCount, pendingRequests, setPendingRequests, friendSearch, setFriendSearch,
    friendSearchResults, appFriends, sentFriendRequests, friendActivity, commonGames,
    expandedFriend, convoMessages, convoInput, setConvoInput, selectedConvoFriend,
    setSelectedConvoFriend, groups, groupMessages, groupConvoInput, setGroupConvoInput,
    selectedGroupConvo, groupOwnership, avatarInput, setAvatarInput, activityPrivate,
    setActivityPrivate, settingsUsername, setSettingsUsername, settingsCurrentPwd,
    setSettingsCurrentPwd, settingsNewPwd, setSettingsNewPwd, settingsConfirmPwd,
    setSettingsConfirmPwd, settingsSaveMsg, setSettingsSaveMsg, upcomingSessions,
    addFriend, removeFriend, searchUsers, fetchFriendActivity, fetchNotificationCount,
    openConversation, openGroupConversation, openMemberProfile, handleDiscoverGameClick,
    handleLogout, saveAvatar, saveSettings, sendConvoMessage, sendGroupMessage,
    addToCalendar, setSessionModal, setSessionDateTime, setSessionMessage,
    setExpandedFriend, markMessagesRead,
    handleLinkProfile, handleSyncXbox, handleSyncEpic, setShowSteamLinkModal,
  } = props;

  return (
    <AnimatePresence>
      {showQuestlogFriends && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setShowQuestlogFriends(false); setSelectedConvoFriend(null); setSelectedGroupConvo(null); setSettingsSaveMsg(null); }}
            className="absolute inset-0 bg-black/85"/>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.15 }}
            className="relative w-full max-w-2xl bg-[#1a1a1a] rounded-[40px] border border-white/10 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="absolute inset-0 pointer-events-none z-10" style={{ boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)', borderRadius: 'inherit' }}/>

            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-white/5 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => { setAvatarInput(user?.avatar || ''); setFriendsModalTab('settings'); }}
                  className="relative group w-11 h-11 rounded-full overflow-hidden border border-white/15 hover:border-white/40 transition-all shrink-0 focus:outline-none" title="Edit profile">
                  <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Camera size={11} className="text-white"/></div>
                </button>
                <div>
                  <h2 className="text-2xl font-bold tracking-tighter uppercase italic font-serif">{user?.username}</h2>
                </div>
              </div>
              <button onClick={() => { setShowQuestlogFriends(false); setSelectedConvoFriend(null); setSelectedGroupConvo(null); setSettingsSaveMsg(null); }} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"><X size={20}/></button>
            </div>

            {/* Tab bar */}
            <div className="px-8 py-4 border-b border-white/5 shrink-0">
              <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/[0.08] w-fit gap-0.5">
                <button onClick={() => setFriendsModalTab('friends')}
                  className={cn("px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer", friendsModalTab === 'friends' ? "bg-white text-[#141414] shadow-sm" : "text-white/50 hover:text-white")}>
                  Companions
                </button>
                <button onClick={() => { setFriendsModalTab('messages'); fetchNotificationCount(); }}
                  className={cn("relative px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer", friendsModalTab === 'messages' ? "bg-white text-[#141414] shadow-sm" : "text-white/50 hover:text-white")}>
                  Chats
                  {notificationCount > 0 && <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-emerald-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5">{notificationCount > 9 ? '9+' : notificationCount}</span>}
                </button>
                <button onClick={() => setFriendsModalTab('settings')}
                  className={cn("px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer", friendsModalTab === 'settings' ? "bg-white text-[#141414] shadow-sm" : "text-white/50 hover:text-white")}>
                  Settings
                </button>
              </div>
            </div>

            {/* ── Companions tab ── */}
            {friendsModalTab === 'friends' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Pending requests */}
                {pendingRequests.length > 0 && (
                  <div className="px-8 pt-5 pb-4 border-b border-white/5 shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-3">Companion Requests ({pendingRequests.length})</p>
                    <div className="space-y-2">
                      {pendingRequests.map(u => (
                        <div key={u.id} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-amber-500/5 border border-amber-500/15">
                          <div className="flex items-center gap-3">
                            <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-8 h-8 rounded-full object-cover"/>
                            <span className="text-sm font-bold">{u.username}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { addFriend(u.username); setPendingRequests((p: any[]) => p.filter(r => r.id !== u.id)); }} className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer">Accept</button>
                            <button onClick={() => { removeFriend(u.id); setPendingRequests((p: any[]) => p.filter(r => r.id !== u.id)); }} className="px-3 py-1.5 rounded-xl bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer">Decline</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Search */}
                <div className="px-8 py-5 border-b border-white/5 shrink-0">
                  <div className="relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"/>
                    <input type="text" placeholder="Search by username to add companions..." value={friendSearch}
                      onChange={e => { setFriendSearch(e.target.value); searchUsers(e.target.value); }}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-white/30 transition-all"
                    />
                  </div>
                  {friendSearchResults.length > 0 && (
                    <div className="mt-3 bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                      {friendSearchResults.map(u => {
                        const alreadyFriend = appFriends.some(f => f.id === u.id);
                        const requestSent = sentFriendRequests.has(u.id);
                        return (
                          <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-3">
                              <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-8 h-8 rounded-full object-cover"/>
                              <span className="text-sm font-medium">{u.username}</span>
                            </div>
                            {alreadyFriend
                              ? <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Companions</span>
                              : requestSent
                                ? <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">Pending</span>
                                : <button onClick={() => addFriend(u.username, u.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 transition-colors text-[10px] font-bold uppercase tracking-widest cursor-pointer"><UserPlus size={12}/> Add</button>
                            }
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Companions list */}
                <div className="overflow-y-auto flex-1 px-8 py-6 space-y-3">
                  {appFriends.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-4"><Users size={28} className="opacity-20"/></div>
                      <p className="text-sm font-bold text-white/30">No companions yet</p>
                      <p className="text-xs text-white/20 mt-1">Search by username above to connect</p>
                    </div>
                  ) : appFriends.map(friend => (
                    <div key={friend.id} className="rounded-3xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4">
                        <button className="flex items-center gap-3.5 flex-1 text-left cursor-pointer" onClick={() => fetchFriendActivity(friend.id)}>
                          <div className="relative shrink-0">
                            <img src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} className="w-10 h-10 rounded-full object-cover border border-white/10"/>
                            <span className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1a1a1a]", friend.online_status === 'online' || friend.current_game ? "bg-emerald-500" : "bg-white/20")}/>
                          </div>
                          <div>
                            <p className="text-sm font-bold">{friend.username}</p>
                            {friend.current_game
                              ? <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Playing {friend.current_game}</p>
                              : <p className="text-[10px] text-white/30 font-mono mt-0.5 capitalize">{friend.online_status || 'offline'}</p>
                            }
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openConversation(friend)} title="Message" className="p-2 rounded-xl text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"><MessageCircle size={15}/></button>
                          <button onClick={() => removeFriend(friend.id)} className="p-2 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"><UserMinus size={15}/></button>
                          <button onClick={() => fetchFriendActivity(friend.id)} className="p-2 rounded-xl text-white/20 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer">
                            <ChevronDown size={15} className={cn("transition-transform", expandedFriend === friend.id && "rotate-180")}/>
                          </button>
                        </div>
                      </div>
                      {expandedFriend === friend.id && (
                        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-5">
                          {/* Recently Added */}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Recently Added</p>
                            {!friendActivity[friend.id] || friendActivity[friend.id].length === 0 ? (
                              <p className="text-xs text-white/20 italic">Nothing yet</p>
                            ) : (
                              <div className="grid grid-cols-5 gap-2">
                                {friendActivity[friend.id].slice(0, 10).map((g, i) => {
                                  const steamAppId = g.steam_url?.match(/\/app\/(\d+)/)?.[1];
                                  return (
                                    <div key={i} onClick={() => handleDiscoverGameClick({ _external: true, id: steamAppId || g.title, title: g.title, artwork: g.artwork || '', verticalArt: g.artwork, banner: g.banner || (steamAppId ? `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/library_hero.jpg` : undefined), steamAppID: steamAppId || undefined, steam_url: steamAppId ? `https://store.steampowered.com/app/${steamAppId}/` : undefined } as any)}
                                      className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:opacity-80 transition-opacity" title={g.title}>
                                      {g.artwork ? <img src={g.artwork} alt={g.title} className="w-full h-full object-cover" referrerPolicy="no-referrer"/> : <div className="w-full h-full flex items-center justify-center"><Gamepad2 size={14} className="opacity-20"/></div>}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-1.5"><span className="text-[8px] font-bold leading-tight line-clamp-2 text-white/90">{g.title}</span></div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {/* Games in Common */}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60 mb-3">In Common</p>
                            {!commonGames[friend.id] || commonGames[friend.id].length === 0 ? (
                              <p className="text-xs text-white/20 italic">No games in common yet</p>
                            ) : (
                              <div className="grid grid-cols-5 gap-2">
                                {commonGames[friend.id].slice(0, 10).map((g, i) => (
                                  <div key={i} className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-emerald-500/20 cursor-default" title={g.title}>
                                    {g.artwork ? <img src={g.artwork} alt={g.title} className="w-full h-full object-cover" referrerPolicy="no-referrer"/> : <div className="w-full h-full flex items-center justify-center"><Gamepad2 size={14} className="opacity-20"/></div>}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-1.5"><span className="text-[8px] font-bold leading-tight line-clamp-2 text-white/90">{g.title}</span></div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Chats tab ── */}
            {friendsModalTab === 'messages' && (
              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-52 border-r border-white/[0.08] flex flex-col shrink-0 overflow-y-auto py-5 px-3">
                  {/* Group chats */}
                  {groups.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2 px-2">Group Chats</p>
                      {groups.map(g => (
                        <button key={g.id} onClick={() => openGroupConversation(g)}
                          className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl transition-colors cursor-pointer text-left mb-0.5",
                            selectedGroupConvo?.id === g.id && !selectedConvoFriend ? "bg-purple-500/15 border border-purple-500/20" : "hover:bg-white/5")}>
                          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                            <Users size={14} className="text-purple-400"/>
                          </div>
                          <span className="text-sm font-semibold truncate">{g.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Direct messages */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2 px-2">Direct</p>
                    {appFriends.length === 0 ? (
                      <p className="text-xs text-white/20 italic px-2">Add companions to message</p>
                    ) : appFriends.map(f => (
                      <button key={f.id} onClick={() => openConversation(f)}
                        className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl transition-colors cursor-pointer text-left mb-0.5",
                          selectedConvoFriend?.id === f.id ? "bg-white/10" : "hover:bg-white/5")}>
                        <img src={f.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`} className="w-8 h-8 rounded-full object-cover shrink-0"/>
                        <span className="text-sm font-medium truncate">{f.username}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conversation pane */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {!selectedConvoFriend && !selectedGroupConvo ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-3"><MessageCircle size={24} className="opacity-20"/></div>
                        <p className="text-sm font-bold text-white/30">Select a chat to start messaging</p>
                      </div>
                    </div>
                  ) : selectedConvoFriend ? (
                    <>
                      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.08] shrink-0">
                        <img src={selectedConvoFriend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConvoFriend.username}`} className="w-9 h-9 rounded-full object-cover"/>
                        <p className="text-sm font-bold">{selectedConvoFriend.username}</p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        {convoMessages.length === 0 ? (
                          <div className="flex items-center justify-center h-full"><p className="text-sm text-white/20 italic">No messages yet — say hi!</p></div>
                        ) : convoMessages.map((msg: any) => {
                          const isMe = msg.sender_id === user?.id;
                          return (
                            <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "items-start")}>
                              {msg.game_title && (
                                <div onClick={() => handleDiscoverGameClick({ _external: true, id: msg.steam_app_id || msg.game_title, title: msg.game_title, artwork: msg.game_artwork || '', verticalArt: msg.game_artwork, banner: msg.steam_app_id ? `https://cdn.akamai.steamstatic.com/steam/apps/${msg.steam_app_id}/library_hero.jpg` : undefined, steamAppID: msg.steam_app_id || undefined } as any)}
                                  className={cn("flex items-center gap-3 p-3 rounded-2xl border mb-1.5 w-fit cursor-pointer transition-opacity hover:opacity-80", isMe ? "bg-emerald-600/20 border-emerald-500/30" : "bg-white/5 border-white/10")}>
                                  {msg.game_artwork && <img src={msg.game_artwork} className="w-9 h-12 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer"/>}
                                  <div>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-0.5">Game Recommendation</p>
                                    <p className="text-sm font-bold leading-tight">{msg.game_title}</p>
                                    <p className="text-[10px] text-white/30 mt-0.5">Click to view details</p>
                                  </div>
                                </div>
                              )}
                              {msg.content && <div className={cn("px-4 py-2.5 rounded-2xl text-sm", isMe ? "bg-emerald-600 text-white rounded-br-sm" : "bg-white/10 text-white rounded-bl-sm")}>{msg.content}</div>}
                              <span className="text-[9px] text-white/20 mt-1 px-1">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="p-4 border-t border-white/[0.08] shrink-0">
                        <div className="flex items-center gap-2">
                          <input type="text" value={convoInput} onChange={e => setConvoInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendConvoMessage()}
                            placeholder={`Message ${selectedConvoFriend.username}...`}
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-white/30 transition-all"
                          />
                          <button onClick={sendConvoMessage} disabled={!convoInput.trim()} className="p-2.5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-30 cursor-pointer"><Send size={15}/></button>
                        </div>
                      </div>
                    </>
                  ) : selectedGroupConvo ? (
                    <>
                      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.08] shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center shrink-0"><Users size={15} className="text-purple-400"/></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold">{selectedGroupConvo.name}</p>
                          <p className="text-[10px] text-white/30 font-mono">#{selectedGroupConvo.invite_code}</p>
                        </div>
                        {groupOwnership && groupOwnership.members.length > 0 && (
                          <div className="flex -space-x-2 shrink-0">
                            {groupOwnership.members.map((m: any) => (
                              <MemberAvatar key={m.id} username={m.username} avatar={m.avatar} size="sm"
                                onClick={(e) => { e.stopPropagation(); openMemberProfile(m); }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        {groupMessages.length === 0 ? (
                          <div className="flex items-center justify-center h-full"><p className="text-sm text-white/20 italic">No messages yet — start the conversation!</p></div>
                        ) : groupMessages.map((msg: any) => {
                          const isMe = msg.sender_id === user?.id;
                          const sessionInviteMatch = msg.content?.startsWith('[SESSION_INVITE]');
                          const gameAddedMatch = msg.content?.startsWith('[GAME_ADDED]');
                          const libraryAddMatch = msg.content?.startsWith('[LIBRARY_ADD]');
                          if (gameAddedMatch) {
                            let info: any = {};
                            try { info = JSON.parse(msg.content.slice('[GAME_ADDED]'.length)); } catch {}
                            const isAboutMe = info.username === user?.username;
                            return (
                              <div key={msg.id} className="flex flex-col items-center my-1">
                                <div className="flex items-center gap-1.5 bg-purple-950/50 border border-purple-500/20 rounded-full px-3 py-1.5">
                                  <Plus size={10} className="text-purple-400 shrink-0"/>
                                  <span className="text-[10px] text-white/60">
                                    <span className="font-bold text-purple-300">{isAboutMe ? 'You' : info.username}</span>
                                    {' added '}
                                    <span className="font-bold text-white/80 italic">{info.game_title}</span>
                                    {' to the group log'}
                                  </span>
                                </div>
                                <span className="text-[9px] text-white/20 mt-1">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                              </div>
                            );
                          }
                          if (libraryAddMatch) {
                            let info: any = {};
                            try { info = JSON.parse(msg.content.slice('[LIBRARY_ADD]'.length)); } catch {}
                            const isAboutMe = info.username === user?.username;
                            return (
                              <div key={msg.id} className="flex flex-col items-center my-1">
                                <div className="flex items-center gap-1.5 bg-indigo-950/50 border border-indigo-500/20 rounded-full px-3 py-1.5">
                                  <Library size={10} className="text-indigo-400 shrink-0"/>
                                  <span className="text-[10px] text-white/60">
                                    <span className="font-bold text-indigo-300">{isAboutMe ? 'You' : info.username}</span>
                                    {' added '}
                                    <span className="font-bold text-white/80 italic">{info.game_title}</span>
                                    {' to their library'}
                                  </span>
                                </div>
                                <span className="text-[9px] text-white/20 mt-1">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                              </div>
                            );
                          }
                          const gameShareMatch = msg.content?.startsWith('[GAME_SHARE]');
                          if (gameShareMatch) {
                            let share: any = {};
                            try { share = JSON.parse(msg.content.slice('[GAME_SHARE]'.length)); } catch {}
                            return (
                              <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'items-end self-end' : 'items-start'}`}>
                                {!isMe && <span className="text-[10px] font-bold text-white/40 mb-1 px-1">{msg.sender_username}</span>}
                                <div
                                  className="bg-indigo-950/60 border border-indigo-500/25 rounded-2xl rounded-bl-sm overflow-hidden cursor-pointer hover:border-indigo-400/40 transition-colors w-52"
                                  onClick={() => share.title && handleDiscoverGameClick({ _external: true, id: share.steamAppId || share.title, title: share.title, artwork: share.artwork || '', verticalArt: share.artwork, banner: share.steamAppId ? `https://cdn.akamai.steamstatic.com/steam/apps/${share.steamAppId}/library_hero.jpg` : undefined, steamAppID: share.steamAppId || undefined } as any)}
                                >
                                  {share.artwork && (
                                    <img src={share.artwork} alt={share.title} className="w-full h-24 object-cover" referrerPolicy="no-referrer"/>
                                  )}
                                  <div className="p-2.5 space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <ExternalLink size={10} className="text-indigo-400 shrink-0"/>
                                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Check this out</span>
                                    </div>
                                    <p className="font-bold italic font-serif tracking-tighter uppercase text-white text-sm leading-tight">{share.title}</p>
                                    {share.message && <p className="text-[10px] text-white/40 italic">"{share.message}"</p>}
                                  </div>
                                </div>
                                <span className="text-[9px] text-white/20 mt-1 px-1">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                              </div>
                            );
                          }
                          if (sessionInviteMatch) {
                            let invite: any = {};
                            try { invite = JSON.parse(msg.content.slice('[SESSION_INVITE]'.length)); } catch {}
                            return (
                              <div key={msg.id} className="flex flex-col max-w-[80%] items-start">
                                {!isMe && <span className="text-[10px] font-bold text-white/40 mb-1 px-1">{msg.sender_username}</span>}
                                <div className="bg-emerald-950/60 border border-emerald-500/25 rounded-2xl rounded-bl-sm p-3 space-y-2 w-full">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar size={11} className="text-emerald-400 shrink-0"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Play Together</span>
                                  </div>
                                  <p className="font-bold italic font-serif tracking-tighter uppercase text-white text-sm leading-tight">{invite.game_title}</p>
                                  <div className="flex items-center gap-1">
                                    <Clock size={9} className="text-white/30 shrink-0"/>
                                    <span className="text-[10px] text-white/50">
                                      {invite.scheduled_at ? new Date(invite.scheduled_at).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                  </div>
                                  {invite.message && <p className="text-[10px] text-white/40 italic">"{invite.message}"</p>}
                                  <button
                                    onClick={() => addToCalendar({ ...invite, id: msg.id })}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest text-emerald-400 transition-colors"
                                  >
                                    <Calendar size={10}/>
                                    Add to Calendar
                                  </button>
                                </div>
                                <span className="text-[9px] text-white/20 mt-1 px-1">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                              </div>
                            );
                          }
                          return (
                            <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "items-start")}>
                              {!isMe && <span className="text-[10px] font-bold text-white/40 mb-1 px-1">{msg.sender_username}</span>}
                              <div className={cn("px-4 py-2.5 rounded-2xl text-sm", isMe ? "bg-purple-600 text-white rounded-br-sm" : "bg-white/10 text-white rounded-bl-sm")}>{msg.content}</div>
                              <span className="text-[9px] text-white/20 mt-1 px-1">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="p-4 border-t border-white/[0.08] shrink-0">
                        <div className="flex items-center gap-2">
                          <input type="text" value={groupConvoInput} onChange={e => setGroupConvoInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendGroupMessage()}
                            placeholder={`Message ${selectedGroupConvo.name}...`}
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-white/30 transition-all"
                          />
                          <button onClick={sendGroupMessage} disabled={!groupConvoInput.trim()} className="p-2.5 rounded-2xl bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-30 cursor-pointer"><Send size={15}/></button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            {/* ── Settings tab ── */}
            {friendsModalTab === 'settings' && (
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
                {settingsSaveMsg && (
                  <div className={cn("px-5 py-3 rounded-2xl text-sm font-medium text-center", settingsSaveMsg.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-red-500/10 text-red-400 border border-red-500/15")}>
                    {settingsSaveMsg.text}
                  </div>
                )}

                {/* Avatar */}
                <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Avatar</p>
                  <div className="flex items-center gap-4">
                    <img src={avatarInput || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="w-14 h-14 rounded-full object-cover border border-white/15 shrink-0"/>
                    <div className="flex-1 space-y-2">
                      <input type="text" placeholder="Paste image URL..." value={avatarInput} onChange={e => setAvatarInput(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-white/30 transition-all"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => { setAvatarInput(''); saveAvatar(); }} className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:bg-white/10 transition-colors cursor-pointer">Remove</button>
                        <button onClick={saveAvatar} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 transition-colors cursor-pointer">Save Avatar</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy */}
                <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Privacy</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Hide activity from companions</p>
                      <p className="text-[10px] text-white/30 mt-0.5">Companions won't see your log activity or recent games</p>
                    </div>
                    <button
                      onClick={() => { const next = !activityPrivate; setActivityPrivate(next); saveSettings({ activity_private: next }); }}
                      className={cn("shrink-0 ml-4 rounded-full transition-colors cursor-pointer flex items-center", activityPrivate ? "bg-emerald-500" : "bg-white/15")}
                      style={{ width: 40, height: 22, minWidth: 40, padding: '3px' }}
                    >
                      <span className={cn("w-4 h-4 rounded-full bg-white shadow transition-transform block", activityPrivate ? "translate-x-[18px]" : "translate-x-0")}/>
                    </button>
                  </div>
                </div>

                {/* Username */}
                <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Username</p>
                  <div className="flex gap-2">
                    <input type="text" placeholder={user?.username || 'New username'} value={settingsUsername} onChange={e => setSettingsUsername(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-white/30 transition-all"
                    />
                    <button onClick={() => { if (settingsUsername.trim()) { saveSettings({ username: settingsUsername.trim() }); setSettingsUsername(''); } }}
                      disabled={!settingsUsername.trim()}
                      className="px-4 py-2 rounded-2xl bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 transition-colors disabled:opacity-30 cursor-pointer shrink-0">
                      Save
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Password</p>
                  <div className="space-y-2">
                    <input type="password" placeholder="Current password" value={settingsCurrentPwd} onChange={e => setSettingsCurrentPwd(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-white/30 transition-all"
                    />
                    <input type="password" placeholder="New password" value={settingsNewPwd} onChange={e => setSettingsNewPwd(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-white/30 transition-all"
                    />
                    <input type="password" placeholder="Confirm new password" value={settingsConfirmPwd} onChange={e => setSettingsConfirmPwd(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-white/30 transition-all"
                    />
                    <button
                      onClick={() => {
                        if (!settingsCurrentPwd || !settingsNewPwd) return;
                        if (settingsNewPwd !== settingsConfirmPwd) { setSettingsSaveMsg({ type: 'error', text: "Passwords don't match" }); setTimeout(() => setSettingsSaveMsg(null), 4000); return; }
                        saveSettings({ current_password: settingsCurrentPwd, new_password: settingsNewPwd });
                      }}
                      disabled={!settingsCurrentPwd || !settingsNewPwd || !settingsConfirmPwd}
                      className="w-full py-2.5 rounded-2xl bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 transition-colors disabled:opacity-30 cursor-pointer mt-1">
                      Change Password
                    </button>
                  </div>
                </div>

                {/* Connected Accounts */}
                <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                    <LinkIcon size={10}/> Connected Accounts
                  </p>
                  <div className="space-y-1">
                    {[
                      { label: 'Steam', icon: <SteamIcon className="w-4 h-4 text-[#1b9fe0]"/>, connected: !!user?.steam_id, onConnect: () => setShowSteamLinkModal(true) },
                      { label: 'Xbox', icon: <XboxIcon className="w-4 h-4 text-[#107c10]"/>, connected: !!user?.xbox_id, onConnect: handleSyncXbox },
                      { label: 'Discord', icon: <DiscordIcon className="w-4 h-4 text-[#5865F2]"/>, connected: !!user?.discord_id, onConnect: () => handleLinkProfile('discord') },
                      { label: 'Epic Games', icon: <EpicIcon className="w-4 h-4 text-white/70"/>, connected: !!user?.epic_account_id, onConnect: handleSyncEpic },
                    ].map(({ label, icon, connected, onConnect }) => (
                      <div key={label} className={cn("flex items-center justify-between py-2.5 px-1 rounded-xl transition-colors", !connected && "cursor-pointer hover:bg-white/5")} onClick={() => !connected && onConnect()}>
                        <div className="flex items-center gap-3">
                          {icon}
                          <span className="text-sm font-semibold">{label}</span>
                        </div>
                        {connected
                          ? <CheckCircle2 size={15} className="text-emerald-400"/>
                          : <span className="text-[10px] font-bold uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors">Connect</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sign out */}
                <button onClick={handleLogout} className="w-full py-3 rounded-2xl bg-red-500/8 border border-red-500/15 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/15 transition-colors cursor-pointer">
                  Sign Out
                </button>
              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
