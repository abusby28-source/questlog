import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Search, Users, UserPlus, UserMinus, MessageCircle, Send,
  ChevronDown, Camera, Gamepad2, Calendar, Clock, Library, Plus,
} from 'lucide-react';
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
