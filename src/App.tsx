import React, { useState, useEffect } from'react';
import { motion, AnimatePresence } from'motion/react';
import { 
  Plus, Search, Trash2, ExternalLink, Gamepad2, Monitor, Tag, Info,
  Loader2, X, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle,
  Edit2, Image, Type, Layout, Home, Clock, Trophy, Users, TrendingDown,
  Activity, ArrowUpRight, Settings, TrendingUp, BarChart3, Calendar,
  Star, Play, Download, Filter, Check, LogOut, Library, 
  History as HistoryIcon, Link as LinkIcon, CheckCircle2, Eye, EyeOff, ChevronDown, Lock
} from'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area
} from'recharts';
import { fetchGameInfo, GameInfo, getGameSuggestions, GameSuggestion, fetchSimilarSuggestions } from'./services/geminiService';
import { Game } from'./types';
import { clsx, type ClassValue } from'clsx';
import { twMerge } from'tailwind-merge';

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

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.862-1.297 1.201-1.99a.076.076 0 0 0-.041-.105 13.1 13.1 0 0 1-1.872-.89.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.291a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.89.076.076 0 0 0-.041.106c.34.693.74 1.362 1.201 1.991a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
  </svg>
);

const HorizontalScrollRow = ({ children, title, icon }: { children: React.ReactNode; title: string; icon: React.ReactNode }) => {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const scroll = (direction:'left' |'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction ==='left' ? -scrollAmount : scrollAmount,
        behavior:'smooth'
      });
    }
  };

  return (
    <section className="relative group/row">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          {icon}
          {title}
        </h2>
      </div>
      
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/60 border border-white/10 text-white opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-black/80"
>
          <ChevronLeft size={24}/>
        </button>
        
        <div ref={scrollRef} className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar scroll-smooth">
          {children}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/60 border border-white/10 text-white opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-black/80"
>
          <ChevronRight size={24}/>
        </button>
      </div>
    </section>
  );
};

interface User {
  id: number;
  username: string;
  steam_id?: string;
  xbox_id?: string;
  discord_id?: string;
  avatar?: string;
}

interface Group {
  id: number;
  name: string;
  invite_code: string;
}

interface LauncherGame {
  id: number;
  title: string;
  artwork: string;
  banner: string;
  horizontal_grid?: string;
  logo?: string;
  platform:'steam' |'xbox' |'local';
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
  hasAttemptedFix?: boolean;
}

interface FriendEntry { id: number | string; username: string; avatar?: string; online_status: string; current_game?: string; }

interface HomeData {
  recentlyPlayed: LauncherGame[];
  friendsActivity: any[];
  friendsOnline: { steam: FriendEntry[]; xbox: FriendEntry[]; discord: FriendEntry[]; app: FriendEntry[] };
  discordGuildId: string | null;
  discordLinked: boolean;
  recentAchievements: { name: string, description: string, icon: string, gameTitle: string, gameArtwork: string, username: string, userAvatar?: string }[];
  suggestedLog: Game[];
  suggestedLibrary: LauncherGame[];
  suggestions: Game[];
  history: { date: string, minutes: number }[];
  updates: {
    priceDrops: Game[];
    gamePass: Game[];
  };
  stats: {
    backlogCount: number;
    libraryCount: number;
    playtimeHours: number;
    weeklyPlaytimeHours: number;
    genreStats: { genre: string, count: number }[];
  };
}

function formatPrice(price: string | null | undefined) {
  if (!price || price ==='£0.00' || price ==='$0.00') return null;
  if (price.includes('£') || price.includes('$') || price.includes('€')) return price;
  const numericValue = parseFloat(price.replace(/[^\d.]/g,''));
  if (isNaN(numericValue) || numericValue === 0) return null;
  return `$${numericValue.toFixed(2)}`;
}

function getBannerUrl(game: Game | LauncherGame) {
  if (!game) return'';
  let steamId: string | null = null;
  if ('steam_url' in game && game.steam_url) {
    const match = game.steam_url.match(/\/app\/(\d+)/);
    if (match) steamId = match[1];
  } else if ('platform' in game && game.platform ==='steam') {
    steamId = game.external_id;
  }
  if (steamId) {
    return `/api/steamgriddb/hero/${steamId}`;
  }
  if (game.banner && !game.banner.includes('placeholder')) return game.banner;
  return `/api/steamgriddb/hero-by-name/${encodeURIComponent(game.title)}`;
}

function getSteamHorizontalArtwork(game: Game | LauncherGame, refreshKey?: number) {
  if (!game) return'';
  if (game.horizontal_grid && !refreshKey) return game.horizontal_grid;
  let steamId: string | null = null;
  if ('platform' in game && game.platform ==='steam') {
    steamId = game.external_id;
  } else if ('steam_url' in game && game.steam_url) {
    const match = game.steam_url.match(/\/app\/(\d+)/);
    if (match) steamId = match[1];
  }
  const cacheBust = refreshKey ? `?t=${refreshKey}` :'';
  if (steamId) {
    return `/api/steamgriddb/horizontal/${steamId}${cacheBust}`;
  }
  const safeTitle = encodeURIComponent(game.title);
  return `/api/steamgriddb/horizontal-by-name/${safeTitle}${cacheBust}`;
}

const friendStatusDot: Record<string, string> = {
  online:'bg-emerald-500',
  in_game:'bg-blue-400',
  away:'bg-yellow-400',
  busy:'bg-red-500',
  offline:'bg-white/20',
};
const friendStatusLabel: Record<string, string> = {
  online:'Online',
  in_game:'In Game',
  away:'Away',
  busy:'Busy',
  offline:'Offline',
};

const FriendRow = ({ friend, showStatus = true, lastPlayedAt }: { friend: FriendEntry; showStatus?: boolean; lastPlayedAt?: string }) => {
  const status = friend.online_status ||'offline';
  const dotClass = friendStatusDot[status] ??'bg-white/20';
  const statusLabel = friendStatusLabel[status] ?? status;
  return (
    <div className="flex items-center gap-4 group cursor-pointer">
      <div className="relative">
        <img src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
          className="w-10 h-10 rounded-2xl object-cover" alt={friend.username}/>
        {showStatus && (
          <div className={cn("absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0a]", dotClass)}/>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate group-hover:text-emerald-500 transition-colors">{friend.username}</p>
        {showStatus && (
          <p className="text-xs text-white/40 truncate">
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
};

const TagDropdown = ({
  availableTags,
  selectedTags,
  setSelectedTags,
}: {
  availableTags: string[];
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
>
        <Tag size={14}/>
        Tags {selectedTags.length> 0 && `(${selectedTags.length})`}
        <ChevronDown
          size={14}
          className={cn(
'transition-transform',
            isOpen &&'rotate-180',
          )}
/>
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-64 max-h-64 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 p-2 custom-scrollbar">
          {availableTags.length === 0 ? (
            <div className="p-4 text-center text-xs text-white/40 italic">No tags available</div>
          ) : (
            <>
              {selectedTags.length> 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-white/5 rounded-lg mb-2 transition-colors"
>
                  Clear Filters
                </button>
              )}
              {availableTags.map(tag => (
                <label
                  key={tag}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
>
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() =>
                      setSelectedTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag],
                      )
                    }
                    className="w-4 h-4 rounded border-white/20 bg-black/50 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0"
/>
                  <span className="text-xs font-mono uppercase tracking-widest text-white/80">{tag}</span>
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [authMode, setAuthMode] = useState<'login' |'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GameSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | LauncherGame | null>(null);
  const [friendsWhoOwn, setFriendsWhoOwn] = useState<{ username: string, avatar?: string, online_status: string, current_game?: string, last_played?: number }[]>([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);
  const [groupInput, setGroupInput] = useState('');
  
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showRecentAchievements, setShowRecentAchievements] = useState(false);
  const [isEditingArtwork, setIsEditingArtwork] = useState(false);
  const [editingArtworkType, setEditingArtworkType] = useState<'artwork' |'banner' |'logo'>('artwork');
  const [customArtworkUrl, setCustomArtworkUrl] = useState('');
  const [activeList, setActiveList] = useState<'private' |'shared'>('private');
  const [addToList, setAddToList] = useState<'private' |'shared'>('private');
  const [currentTab, setCurrentTab] = useState<'home' |'questlog' |'launcher'>('home');
  const [similarSuggestions, setSimilarSuggestions] = useState([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  
  const [launcherGames, setLauncherGames] = useState<LauncherGame[]>([]);
  const [selectedLauncherGame, setSelectedLauncherGame] = useState<LauncherGame | null>(null);
  const [launcherSearch, setLauncherSearch] = useState('');
  const [launcherInstalledFilter, setLauncherInstalledFilter] = useState<'all' | 'installed' | 'gamepass-played' | 'not-installed'>('all');
  const [launcherSelectedTags, setLauncherSelectedTags] = useState<string[]>([]);
  const [steamId, setSteamId] = useState(localStorage.getItem('steamId') ||'');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showSteamSync, setShowSteamSync] = useState(false);
  const [showXboxSync, setShowXboxSync] = useState(false);
  const [showSteamLinkModal, setShowSteamLinkModal] = useState(false);
  const [steamLinkInput, setSteamLinkInput] = useState('');
  const [showDiscordGuildPicker, setShowDiscordGuildPicker] = useState(false);
  const [discordGuilds, setDiscordGuilds] = useState<{id: string, name: string, icon: string | null}[]>([]);
  const [discordGuildsLoading, setDiscordGuildsLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{title: string, message: string, type:'error' |'success' |'info'} | null>(null);

  const handleSyncXbox = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/xbox/callback`;
      const res = await fetch(`/api/auth/xbox/url?redirectUri=${encodeURIComponent(redirectUri)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to get Xbox auth URL: ${res.status} ${errorText}`);
      }
      const { url } = await res.json();
      
      const authWindow = window.open(url,'xbox_auth','width=600,height=700');
      
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type ==='XBOX_AUTH_SUCCESS') {
          setIsSyncing(true);
          const { tokens } = event.data;
          
          try {
            // Store refresh token for friends API
            const linkRes = await fetch('/api/launcher/link-xbox-refresh', {
              method:'POST',
              headers: { 
'Content-Type':'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                refreshToken: tokens.refreshToken,
                xuid: tokens.xuid
              })
            });
            
            if (linkRes.ok) {
              // Now do the local sync
              const syncRes = await fetch('/api/launcher/sync-xbox-local', {
                method:'POST',
                headers: { 
'Content-Type':'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  xstsToken: tokens.xstsToken,
                  userHash: tokens.userHash,
                  xuid: tokens.xuid
                })
              });
              
              if (syncRes.ok) {
                const data = await syncRes.json();
                await fetchLauncherGames();
                await fetchHomeData();
                
                setSyncMessage({
                  title:'Xbox Sync Completed',
                  message: `${data.count} games were added to your library!`,
                  type:'success'
                });
              } else {
                const data = await syncRes.json();
                setSyncMessage({
                  title:'Xbox Sync Failed',
                  message: data.error || 'Failed to sync Xbox games. Please try again.',
                  type:'error'
                });
              }
            } else {
              setSyncMessage({
                title:'Xbox Auth Failed',
                message: 'Failed to store Xbox credentials.',
                type:'error'
              });
            }
          } catch (error) {
            console.error('Xbox sync error:', error);
            setSyncMessage({
              title:'Xbox Sync Failed',
              message: 'Failed to sync Xbox games. Please try again.',
              type:'error'
            });
          } finally {
            setIsSyncing(false);
          }
        } else if (event.data?.type ==='XBOX_AUTH_ERROR') {
          setSyncMessage({
            title:'Xbox Auth Failed',
            message: event.data.error || 'Authentication failed. Please try again.',
            type:'error'
          });
          setIsSyncing(false);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      const cleanup = () => {
        window.removeEventListener('message', handleMessage);
        if (authWindow && !authWindow.closed) {
          authWindow.close();
        }
      };
      
      // Track whether auth message was received so checkClosed doesn't
      // call setIsSyncing(false) while the async sync is still running.
      let authReceived = false;
      const markAuthReceived = () => { authReceived = true; };

      // Patch handleMessage to mark auth received before doing the sync
      const patchedHandleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'XBOX_AUTH_SUCCESS' || event.data?.type === 'XBOX_AUTH_ERROR') {
          markAuthReceived();
          clearInterval(checkClosed);
        }
        return handleMessage(event);
      };
      window.removeEventListener('message', handleMessage);
      window.addEventListener('message', patchedHandleMessage);

      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          cleanup();
          // Only reset syncing state if auth message never arrived (user cancelled)
          if (!authReceived) setIsSyncing(false);
        }
      }, 1000);

      setTimeout(() => {
        if (!authReceived) {
          cleanup();
          clearInterval(checkClosed);
          setIsSyncing(false);
        }
      }, 300000); // 5 minute timeout

    } catch (error: any) {
      console.error('Xbox auth error:', error);
      setSyncMessage({
        title:'Xbox Auth Failed',
        message: error.message || 'Failed to start Xbox authentication.',
        type:'error'
      });
      setIsSyncing(false);
    }
  };

  const handleScanLocal = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/launcher/scan-local', {
        method:'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage({
          title:'Local Scan Complete',
          message: data.message || `Found ${data.count} installed Xbox games.`,
          type:'success'
        });
        fetchLauncherGames();
      } else {
        setSyncMessage({
          title:'Local Scan Failed',
          message: data.error ||'Failed to scan for local games. This feature requires the app to be running as an EXE on Windows.',
          type:'error'
        });
      }
    } catch (error: any) {
      setSyncMessage({
        title:'Scan Error',
        message:'Could not connect to local scan service. Make sure the app is running locally.',
        type:'error'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const [artworkRefreshKey, setArtworkRefreshKey] = useState(0);
  const [isRefreshingArtwork, setIsRefreshingArtwork] = useState(false);

  const getSteamId = (game: Game | LauncherGame) => {
    if ('platform' in game && game.platform ==='steam') {
      return game.external_id;
    } else if ('steam_url' in game && game.steam_url) {
      const match = game.steam_url.match(/\/app\/(\d+)/);
      if (match) return match[1];
    }
    return null;
  };

  const refreshHomepageArtwork = async () => {
    if (!homeData || isRefreshingArtwork) return;
    
    setIsRefreshingArtwork(true);
    setArtworkRefreshKey(Date.now());
    
    const allGames = [
      ...homeData.recentlyPlayed,
      ...homeData.suggestedLibrary,
      ...homeData.suggestedLog
    ];
    
    const uniqueGames = Array.from(new Map(allGames.map(g => [g.id + (('platform' in g) ?'l' :'g'), g])).values());
    
    try {
      await Promise.all(uniqueGames.map(async (game) => {
        const steamId = getSteamId(game);
        const isLauncherGame ='platform' in game;
        
        let horizontalUrl ='';
        if (steamId) {
          const res = await fetch(`/api/steamgriddb/horizontal/${steamId}?json=1`);
          if (res.ok) {
            const data = await res.json();
            horizontalUrl = data.url;
          }
        } else {
          const res = await fetch(`/api/steamgriddb/horizontal-by-name/${encodeURIComponent(game.title)}?json=1`);
          if (res.ok) {
            const data = await res.json();
            horizontalUrl = data.url;
          }
        }
        
        if (horizontalUrl) {
          const endpoint = isLauncherGame 
            ? `/api/launcher/games/${game.id}/artwork`
            : `/api/games/${game.id}/artwork`;
            
          await fetch(endpoint, {
            method:'PATCH',
            headers: { 
'Content-Type':'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ horizontal_grid: horizontalUrl })
          });
        }
      }));
      
      fetchHomeData();
    } catch (error) {
      console.error('Failed to refresh homepage artwork:', error);
    } finally {
      setIsRefreshingArtwork(false);
    }
  };
  
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [isHomeLoading, setIsHomeLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmClearLibrary, setConfirmClearLibrary] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [questLogSearch, setQuestLogSearch] = useState('');
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showStatsDetail, setShowStatsDetail] = useState<'library' |'playtime' |'backlog' | null>(null);
  const [showHiddenGames, setShowHiddenGames] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchGroups();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      if (currentTab ==='home' && !homeData) fetchHomeData();
      if (currentTab ==='launcher') fetchLauncherGames();
      if (currentTab ==='questlog') {
        fetchGames();
      }
    }
  }, [currentTab, token]);

// Friends online polls every 30s; home tiles only load once per session (stable until app restart)
  useEffect(() => {
    if (!token || currentTab !=='home') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/home/data', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
// Only update friends-related fields, preserve tile data
          setHomeData(prev => prev ? {
            ...prev,
            friendsOnline: data.friendsOnline,
            friendsActivity: data.friendsActivity,
          } : data);
        }
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [token, currentTab]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) {
        return;
      }
      // Xbox auth messages are handled directly inside handleSyncXbox / handleSyncXboxFull
      // to avoid double-processing and stale alert() calls.
      if (event.data?.type ==='DISCORD_AUTH_SUCCESS') {
        setUser(prev => prev ? { ...prev, discord_id: event.data.discordId } : null);
        setSyncMessage({ title: 'Discord Connected', message: 'Your Discord account has been linked successfully.', type: 'success' });
        fetchHomeData();
      } else if (event.data?.type ==='DISCORD_AUTH_ERROR') {
        setSyncMessage({ title: 'Discord Connection Failed', message: event.data.error || 'Authentication failed. Please try again.', type: 'error' });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchHomeData = async () => {
    if (!token) return;
    setIsHomeLoading(true);
    try {
      const res = await fetch('/api/home/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setHomeData(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch home data", e);
    } finally {
      setIsHomeLoading(false);
    }
  };

  const fetchLauncherGames = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/launcher/games', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLauncherGames(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch launcher games", e);
    }
  };

  const fetchSimilarSuggestionsData = async () => {
    setIsLoadingSimilar(true);
    try {
      const res = await fetch('/api/launcher/favorite-titles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const { titles } = await res.json();
        if (titles) {
          const suggestions = await fetchSimilarSuggestions(titles);
          setSimilarSuggestions(suggestions);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSimilar(false);
    }
  };

  const handleToggleInstalled = async (gameId: number, installed: boolean) => {
    try {
      const res = await fetch(`/api/launcher/games/${gameId}/toggle-installed`, {
        method:'POST',
        headers: { 
'Content-Type':'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ installed })
      });
      if (res.ok) {
        setLauncherGames(prev => prev.map(g => g.id === gameId ? { ...g, installed } : g));
        if (selectedGame?.id === gameId) {
          setSelectedGame(prev => prev ? { ...prev, installed } as any : null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };
  const handleSyncSteam = async () => {
    if (!steamId.trim()) return;
    setIsSyncing(true);
    localStorage.setItem('steamId', steamId);
    try {
      const res = await fetch('/api/launcher/sync-steam', {
        method:'POST',
        headers: { 
'Content-Type':'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ steamid: steamId })
      });
      if (res.ok) {
        await fetch('/api/launcher/refresh-metadata', {
          method:'POST',
          headers: { 
'Content-Type':'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ forceAll: false })
        });
        fetchLauncherGames();
      } else {
        const data = await res.json();
        alert(data.error ||"Failed to sync Steam library");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleScanSteamLocal = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/launcher/scan-steam-local', {
        method:'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage({
          title:'Steam Local Scan Completed',
          message: data.message || `Found ${data.count} locally installed Steam games`,
          type:'success'
        });
        await fetchLauncherGames();
      } else {
        setSyncMessage({
          title:'Steam Local Scan Failed',
          message: data.error || 'Failed to scan Steam games',
          type:'error'
        });
      }
    } catch (error: any) {
      setSyncMessage({
        title:'Steam Local Scan Failed',
        message: error.message,
        type:'error'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSyncXboxFull = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/xbox/callback`;
      const res = await fetch(`/api/auth/xbox/url?redirectUri=${encodeURIComponent(redirectUri)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to get Xbox auth URL: ${res.status} ${errorText}`);
      }
      const { url } = await res.json();
      
      const authWindow = window.open(url,'xbox_auth','width=600,height=700');
      
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type ==='XBOX_AUTH_SUCCESS') {
          setIsSyncing(true);
          const { tokens } = event.data;
          
          try {
            const syncRes = await fetch('/api/launcher/sync-xbox', {
              method:'POST',
              headers: { 
'Content-Type':'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                xstsToken: tokens.xstsToken,
                userHash: tokens.userHash,
                xuid: tokens.xuid
              })
            });
            
            if (syncRes.ok) {
              const data = await syncRes.json();
              await fetchLauncherGames();
              await fetchHomeData();
              
              setSyncMessage({
                title:'Xbox Sync Completed',
                message: `${data.count} games were added to your library!`,
                type:'success'
              });
            } else {
              const data = await syncRes.json();
              setSyncMessage({
                title:'Xbox Sync Failed',
                message: data.error || 'Failed to sync Xbox games. Please try again.',
                type:'error'
              });
            }
          } catch (error) {
            console.error('Xbox sync error:', error);
            setSyncMessage({
              title:'Xbox Sync Failed',
              message: 'Failed to sync Xbox games. Please try again.',
              type:'error'
            });
          } finally {
            setIsSyncing(false);
          }
        } else if (event.data?.type ==='XBOX_AUTH_ERROR') {
          setSyncMessage({
            title:'Xbox Auth Failed',
            message: event.data.error || 'Authentication failed. Please try again.',
            type:'error'
          });
          setIsSyncing(false);
        }
      };
      
      let authReceived2 = false;
      const patchedHandleMessage2 = async (event: MessageEvent) => {
        if (event.data?.type === 'XBOX_AUTH_SUCCESS' || event.data?.type === 'XBOX_AUTH_ERROR') {
          authReceived2 = true;
          clearInterval(checkClosed2);
        }
        return handleMessage(event);
      };
      window.addEventListener('message', patchedHandleMessage2);

      const cleanup = () => {
        window.removeEventListener('message', patchedHandleMessage2);
        if (authWindow && !authWindow.closed) {
          authWindow.close();
        }
      };

      const checkClosed2 = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed2);
          cleanup();
          if (!authReceived2) setIsSyncing(false);
        }
      }, 1000);

      setTimeout(() => {
        if (!authReceived2) {
          cleanup();
          clearInterval(checkClosed2);
          setIsSyncing(false);
        }
      }, 300000); // 5 minute timeout

    } catch (error: any) {
      console.error('Xbox auth error:', error);
      setSyncMessage({
        title:'Xbox Auth Failed',
        message: error.message || 'Failed to start Xbox authentication.',
        type:'error'
      });
      setIsSyncing(false);
    }
  };

  const handleRefreshLibrary = async () => {
    setIsSyncing(true);
    try {
      if (steamId.trim()) {
        localStorage.setItem('steamId', steamId);
        await fetch('/api/launcher/sync-steam', {
          method:'POST',
          headers: { 
'Content-Type':'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ steamid: steamId })
        });
      }
      
      await fetch('/api/launcher/refresh-metadata', {
        method:'POST',
        headers: { 
'Content-Type':'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ forceAll: true })
      });
      
      await fetchLauncherGames();
      await fetchHomeData();
    } catch (e) {
      console.error("Failed to refresh library", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchLauncherGameDetails = async (gameId: number) => {
    try {
      const [detailsRes, friendsRes] = await Promise.all([
        fetch(`/api/launcher/games/${gameId}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/launcher/games/${gameId}/friends`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (detailsRes.ok) {
        const details = await detailsRes.json();
        setLauncherGames(current => current.map(g => g.id === gameId ? { ...g, ...details } : g));
        setSelectedGame(prev => (prev && prev.id === gameId) ? { ...prev, ...details } as any : prev);
      }

      if (friendsRes.ok) {
        setFriendsWhoOwn(await friendsRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLauncherFriends = async (game: LauncherGame) => {
    setFriendsWhoOwn([]);
    try {
      const friendsRes = await fetch(`/api/launcher/games/${game.id}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (friendsRes.ok) {
        setFriendsWhoOwn(await friendsRes.json());
      }
    } catch (e) {
      console.error('fetchLauncherFriends error:', e);
    }
  };

// Fetch friends for a questlog game (uses steam_url to derive appid)
  const fetchQuestlogFriends = async (game: Game) => {
    setFriendsWhoOwn([]);
    const match = game.steam_url?.match(/\/app\/(\d+)/);
    if (!match) return;
    const appId = match[1];
    try {
      const res = await fetch(`/api/questlog/games/friends?appId=${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setFriendsWhoOwn(await res.json());
    } catch (e) {
      console.error('fetchQuestlogFriends error:', e);
    }
  };

  const handleLaunch = async (game: LauncherGame) => {
    try {
      await fetch('/api/launcher/launch', {
        method:'POST',
        headers: { 
'Content-Type':'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: game.id })
      });
      
      if (game.platform ==='steam') {
        window.location.href = `steam://run/${game.external_id}`;
      } else if (game.platform ==='xbox') {
// Try to launch via xbox protocol if we have a titleId
// Or if we have a launch_path (PackageFullName), we could try shell:AppsFolder
        window.location.href = `xbox://launch?titleId=${game.external_id}`;
      }
      
      setSelectedGame(null);
      fetchLauncherGames();
      fetchHomeData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleHideGame = async (gameId: number) => {
    try {
      const res = await fetch(`/api/launcher/games/${gameId}/hide`, {
        method:'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchLauncherGames();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnhideGame = async (gameId: number) => {
    try {
      const res = await fetch(`/api/launcher/games/${gameId}/unhide`, {
        method:'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchLauncherGames();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        handleLogout();
      }
    } catch (e) {
      handleLogout();
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (data.length> 0 && !activeGroupId) {
          setActiveGroupId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`/api/auth/${authMode}`, {
        method:'POST',
        headers: {'Content-Type':'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setUser(data.user);
      } else {
        setAuthError(data.error ||'Authentication failed');
      }
    } catch (e) {
      setAuthError('Network error');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setGames([]);
    setGroups([]);
    localStorage.removeItem('token');
  };

  const handleLinkProfile = async (platform:'steam' |'xbox' |'discord') => {
    if (platform ==='xbox' || platform ==='discord') {
      try {
        const redirectUri = `${window.location.origin}/auth/${platform}/callback`;
        const response = await fetch(`/api/auth/${platform}/url?redirectUri=${encodeURIComponent(redirectUri)}`, {
          headers: {'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to get ${platform} auth URL`);
        }
        
        const { url } = await response.json();
        
        const authWindow = window.open(
          url,
          `${platform}_oauth`,
'width=600,height=700'
        );
        
        if (!authWindow) {
          alert(`Please allow popups for this site to connect your ${platform} account.`);
        }
      } catch (error: any) {
        console.error(`Failed to initiate ${platform} auth`, error);
        alert(`Failed to start ${platform} connection: ${error.message}`);
      }
      return;
    }

// Steam uses a modal instead of prompt()
    if (platform ==='steam') {
      setSteamLinkInput('');
      setShowSteamLinkModal(true);
      return;
    }

    const id = prompt(`Enter your ${platform} ID:`);
    if (!id) return;

    try {
      const response = await fetch('/api/user/profile', {
        method:'PATCH',
        headers: {
'Content-Type':'application/json',
'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ [`${platform}_id`]: id })
      });

      if (response.ok) {
        setUser(prev => prev ? { ...prev, [`${platform}_id`]: id } : null);
        alert(`${platform} profile linked!`);
        
        if (platform ==='steam') {
          setSteamId(id);
          localStorage.setItem('steamId', id);
          setIsSyncing(true);
          try {
            const res = await fetch('/api/launcher/sync-steam', {
              method:'POST',
              headers: { 
'Content-Type':'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ steamid: id })
            });
            if (res.ok) {
              await fetch('/api/launcher/refresh-metadata', {
                method:'POST',
                headers: { 
'Content-Type':'application/json',
                  Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ forceAll: false })
              });
              fetchLauncherGames();
              fetchHomeData();
            }
          } catch (e) {
            console.error("Steam sync failed", e);
          } finally {
            setIsSyncing(false);
          }
        } else {
          fetchHomeData();
        }
      }
    } catch (error) {
      console.error('Failed to link profile', error);
    }
  };

  const handleSteamLink = async () => {
    const id = steamLinkInput.trim();
    if (!id) return;
    setShowSteamLinkModal(false);
    try {
      const response = await fetch('/api/user/profile', {
        method:'PATCH',
        headers: {'Content-Type':'application/json','Authorization': `Bearer ${token}` },
        body: JSON.stringify({ steam_id: id })
      });
      if (response.ok) {
        setUser(prev => prev ? { ...prev, steam_id: id } : null);
        setSteamId(id);
        localStorage.setItem('steamId', id);
        setIsSyncing(true);
        setSyncMessage({ title:'Syncing Steam Library', message:'Fetching your Steam games...', type:'info' });
        try {
          const res = await fetch('/api/launcher/sync-steam', {
            method:'POST',
            headers: {'Content-Type':'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ steamid: id })
          });
          if (res.ok) {
            const data = await res.json();
            await fetch('/api/launcher/refresh-metadata', {
              method:'POST',
              headers: {'Content-Type':'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ forceAll: false })
            });
            fetchLauncherGames();
            fetchHomeData();
            setSyncMessage({ title:'Steam Linked!', message: `Successfully imported ${data.count ??'your'} Steam games.`, type:'success' });
          } else {
            const err = await res.json();
            setSyncMessage({ title:'Sync Failed', message: err.error ||'Could not sync Steam library. Check your Steam ID and API key.', type:'error' });
          }
        } catch (e) {
          console.error("Steam sync failed", e);
          setSyncMessage({ title:'Sync Error', message:'An unexpected error occurred during Steam sync.', type:'error' });
        } finally {
          setIsSyncing(false);
        }
      } else {
        const err = await response.json();
        setSyncMessage({ title:'Error', message: err.error ||'Failed to save Steam ID.', type:'error' });
      }
    } catch (error) {
      console.error('Failed to link Steam', error);
    }
  };

  const handleOpenDiscordGuildPicker = async () => {
    setShowDiscordGuildPicker(true);
    setDiscordGuildsLoading(true);
    try {
      const res = await fetch('/api/user/discord-guilds', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setDiscordGuilds(await res.json());
      else setDiscordGuilds([]);
    } catch { setDiscordGuilds([]); }
    setDiscordGuildsLoading(false);
  };

  const handleSelectDiscordGuild = async (guildId: string) => {
    await fetch('/api/user/discord-guild', {
      method:'PATCH',
      headers: {'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ guild_id: guildId })
    });
    setShowDiscordGuildPicker(false);
    fetchHomeData();
  };

  const openXboxApp = (title: string) => {
    window.open(`xbox://search/?query=${encodeURIComponent(title)}`);
    setTimeout(() => {
      window.open(`https://www.xbox.com/en-US/search?q=${encodeURIComponent(title)}`,'_blank');
    }, 500);
  };

// Open a URL in the system default browser (not inside the Electron window)
  const openInBrowser = (url: string) => {
    try {
// nodeIntegration is enabled so we can use Electron shell directly
      const { shell } = (window as any).require('electron');
      shell.openExternal(url);
    } catch {
// Fallback for non-Electron environments
      window.open(url,'_blank');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupInput.trim()) return;
    try {
      const res = await fetch('/api/groups', {
        method:'POST',
        headers: { 
'Content-Type':'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: groupInput })
      });
      if (res.ok) {
        setGroupInput('');
        setIsCreatingGroup(false);
        fetchGroups();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupInput.trim()) return;
    try {
      const res = await fetch('/api/groups/join', {
        method:'POST',
        headers: { 
'Content-Type':'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ invite_code: groupInput })
      });
      if (res.ok) {
        setGroupInput('');
        setIsJoiningGroup(false);
        fetchGroups();
      } else {
        const data = await res.json();
        alert(data.error ||'Failed to join group');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length>= 2 && isAdding) {
        setIsSearchingSuggestions(true);
        try {
          const results = await getGameSuggestions(searchQuery);
          setSuggestions(results);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setIsSearchingSuggestions(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, isAdding]);

  const fetchGames = async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/games', { 
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch: ${response.status}`);
      }
      const data = await response.json();
      setGames(data);
    } catch (error: any) {
      console.error('Error fetching games:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleAddGame = async (title: string, steamAppID?: string) => {
    setIsLoading(true);
    try {
      let gameInfo = await fetchGameInfo(title, steamAppID);
      
      if (!gameInfo.artwork || gameInfo.artwork.includes('placeholder') || gameInfo.artwork.includes('missing')) {
        const { fetchAlternativeArtworks } = await import('./services/geminiService');
        const alternatives = await fetchAlternativeArtworks(title);
        if (alternatives && alternatives.length> 0) {
          gameInfo.artwork = alternatives[0];
        }
      }

      const response = await fetch('/api/games', {
        method:'POST',
        headers: { 
'Content-Type':'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...gameInfo, list_type: addToList, group_id: activeGroupId }),
      });

      if (response.ok) {
        setSearchQuery('');
        setSuggestions([]);
        setIsAdding(false);
        await fetchGames();
      } else {
        throw new Error('Failed to save game');
      }
    } catch (error) {
      console.error('Error adding game:', error);
      alert('Failed to find game info. Please try a more specific title.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = async (gameId: number, tag: string) => {
    if (!tag.trim()) return;
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const currentTags = game.tags ? game.tags.split(',').map(t => t.trim()) : [];
    if (currentTags.includes(tag.trim())) {
      setNewTagInput('');
      return;
    }

    const newTags = [...currentTags, tag.trim()].join(',');
    await updateGameTags(gameId, newTags);
    setNewTagInput('');
  };

  const handleRemoveTag = async (gameId: number, tagToRemove: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const currentTags = game.tags ? game.tags.split(',').map(t => t.trim()) : [];
    const newTags = currentTags.filter(t => t !== tagToRemove).join(',');
    await updateGameTags(gameId, newTags);
  };

  const updateGameTags = async (gameId: number, tags: string) => {
    try {
      const response = await fetch(`/api/games/${gameId}/tags`, {
        method:'PATCH',
        headers: { 
'Content-Type':'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tags })
      });
      
      if (response.ok) {
        setGames(current => current.map(g => g.id === gameId ? { ...g, tags } : g));
        if (selectedGame?.id === gameId) {
          setSelectedGame(prev => prev ? { ...prev, tags } as any : null);
        }
      }
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  const handleSaveCustomArtwork = async (gameId: number, url: string) => {
    if (!url) return;
    
    const isLauncherGame ='playtime' in (selectedGame || {});
    const endpoint = isLauncherGame 
      ? `/api/launcher/games/${gameId}/artwork`
      : `/api/games/${gameId}/artwork`;

    if (isLauncherGame) {
      setLauncherGames(current => current.map(g => g.id === gameId ? { ...g, isFixingArtwork: true } : g));
    } else {
      setGames(current => current.map(g => g.id === gameId ? { ...g, isFixingArtwork: true } : g));
    }
    
    if (selectedGame?.id === gameId) {
      setSelectedGame(prev => prev ? { ...prev, isFixingArtwork: true } as any : null);
    }
    setIsEditingArtwork(false);
    
    try {
      const response = await fetch(endpoint, {
        method:'PATCH',
        headers: { 
'Content-Type':'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [editingArtworkType]: url })
      });
      
      if (response.ok) {
        if (isLauncherGame) {
          setLauncherGames(current => current.map(g => g.id === gameId ? { ...g, [editingArtworkType]: url, isFixingArtwork: false, artworkFailed: false, hasAttemptedFix: false } : g));
        } else {
          setGames(current => current.map(g => g.id === gameId ? { ...g, [editingArtworkType]: url, isFixingArtwork: false, artworkFailed: false, hasAttemptedFix: false } : g));
        }
        
        if (selectedGame?.id === gameId) {
          setSelectedGame(prev => prev ? { ...prev, [editingArtworkType]: url, isFixingArtwork: false, artworkFailed: false, hasAttemptedFix: false } as any : null);
        }
      } else {
        throw new Error('Failed to update artwork');
      }
    } catch (error) {
      if (isLauncherGame) {
        setLauncherGames(current => current.map(g => g.id === gameId ? { ...g, isFixingArtwork: false } : g));
      } else {
        setGames(current => current.map(g => g.id === gameId ? { ...g, isFixingArtwork: false } : g));
      }
      if (selectedGame?.id === gameId) {
        setSelectedGame(prev => prev ? { ...prev, isFixingArtwork: false } as any : null);
      }
    }
  };

  const fixArtwork = async (game: Game) => {
    if (game.isFixingArtwork || game.artworkFailed) return;
    
    if (game.hasAttemptedFix) {
      setGames(current => current.map(g => g.id === game.id ? { ...g, artworkFailed: true } : g));
      if (selectedGame?.id === game.id) {
        setSelectedGame(prev => prev ? { ...prev, artworkFailed: true } as any : null);
      }
      return;
    }
    
    setGames(current => current.map(g => g.id === game.id ? { ...g, isFixingArtwork: true, hasAttemptedFix: true } : g));
    if (selectedGame?.id === game.id) {
      setSelectedGame(prev => prev ? { ...prev, isFixingArtwork: true, hasAttemptedFix: true } as any : null);
    }
    
    try {
      const { fetchAlternativeArtworks, fetchSteamgridDBArtwork } = await import('./services/geminiService');
      
      let newArtwork ='';
      let newBanner ='';

      const steamMatch = game.steam_url?.match(/\/app\/(\d+)/);
      if (steamMatch) {
        const sgdb = await fetchSteamgridDBArtwork(steamMatch[1]);
        if (sgdb.artwork) newArtwork = sgdb.artwork;
        if (sgdb.banner) newBanner = sgdb.banner;
      }

      if (!newArtwork) {
        const alternatives = await fetchAlternativeArtworks(game.title);
        if (alternatives && alternatives.length> 0) {
          newArtwork = alternatives.find(url => url !== game.artwork) || alternatives[0];
        }
      }
      
      if (newArtwork) {
        const response = await fetch(`/api/games/${game.id}/artwork`, {
          method:'PATCH',
          headers: { 
'Content-Type':'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ artwork: newArtwork, banner: newBanner || undefined })
        });
        
        if (response.ok) {
          setGames(current => current.map(g => g.id === game.id ? { ...g, artwork: newArtwork, banner: newBanner || g.banner, isFixingArtwork: false } : g));
          if (selectedGame?.id === game.id) {
            setSelectedGame(prev => prev ? { ...prev, artwork: newArtwork, banner: newBanner || prev.banner, isFixingArtwork: false } as any : null);
          }
          return;
        }
      }
    } catch (error) {
      console.error('Failed to fix artwork:', error);
    }
    
    setGames(current => current.map(g => g.id === game.id ? { ...g, isFixingArtwork: false, artworkFailed: true } : g));
    if (selectedGame?.id === game.id) {
      setSelectedGame(prev => prev ? { ...prev, isFixingArtwork: false, artworkFailed: true } as any : null);
    }
  };

  const deleteGame = async (id: number) => {
    try {
      const response = await fetch(`/api/games/${id}`, { 
        method:'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSelectedGame(null);
        setConfirmDelete(null);
        await fetchGames();
      } else {
        alert('Failed to delete the game. Server returned an error.');
      }
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Network error while deleting game.');
    }
  };

  const clearAllGames = async () => {
    try {
      const response = await fetch('/api/games/clear', { 
        method:'POST',
        headers: { 
'Content-Type':'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ list_type: activeList, group_id: activeGroupId })
      });
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSelectedGame(null);
        setConfirmClear(false);
        await fetchGames();
      } else {
        alert('Failed to clear backlog. Server returned an error.');
      }
    } catch (error) {
      alert('Network error while clearing backlog.');
    }
  };

  const clearLauncherLibrary = async () => {
    try {
      const response = await fetch('/api/launcher/clear', {
        method:'POST',
        headers: {
'Content-Type':'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setConfirmClearLibrary(false);
        await fetchLauncherGames();
        await fetchHomeData();
      } else {
        alert(result.error ||'Failed to clear library. Server returned an error.');
      }
    } catch (error) {
      alert('Network error while clearing library.');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#E4E3E0] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#1a1a1a] p-8 rounded-3xl shadow-xl border border-white/10">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-[#141414] shadow-lg">
              <Gamepad2 size={28}/>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase italic font-serif text-white">
              QuestLog
            </h1>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Username</label>
              <input
                type="text"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                className="w-full bg-[#0a0a0a] text-white border-2 border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#E4E3E0] transition-colors"
                required
/>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] text-white border-2 border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#E4E3E0] transition-colors"
                required
/>
            </div>
            
            {authError && <p className="text-red-400 text-sm font-bold">{authError}</p>}
            
            <button
              type="submit"
              className="w-full bg-white text-[#141414] font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-white/90 transition-colors cursor-pointer"
>
              {authMode ==='login' ?'Login' :'Create Account'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setAuthMode(authMode ==='login' ?'register' :'login')}
              className="text-sm font-bold text-white/50 hover:text-white transition-colors"
>
              {authMode ==='login' ?'Need an account? Register' :'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableTags = Array.from(new Set(
    (activeList ==='private' 
      ? games.filter(g => g.list_type ==='private')
      : games.filter(g => g.list_type ==='shared' && g.group_id === activeGroupId))
      .flatMap(g => g.tags ? g.tags.split(',').map(t => t.trim()) : [])
  )).sort();

  const displayedGames = (activeList ==='private' 
    ? games.filter(g => g.list_type ==='private')
    : games.filter(g => g.list_type ==='shared' && g.group_id === activeGroupId))
    .filter(g => {
      if (selectedTags.length> 0) {
        const gameTags = g.tags ? g.tags.split(',').map(t => t.trim().toLowerCase()) : [];
        if (!selectedTags.every(tag => gameTags.includes(tag.toLowerCase()))) return false;
      }
      if (questLogSearch.trim()) {
        const query = questLogSearch.toLowerCase();
        if (!g.title.toLowerCase().includes(query)) return false;
      }
      return true;
    });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#E4E3E0] font-sans selection:bg-[#1a1a1a] selection:text-[#E4E3E0]">
      <header
        className="border-b border-[#E4E3E0] sticky top-0 bg-[#0a0a0a]/90 z-40"
        style={{ WebkitAppRegion:'drag' } as React.CSSProperties}
>
        <div className="max-w-7xl mx-auto px-6 pr-40 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-8"
            style={{ WebkitAppRegion:'no-drag' } as React.CSSProperties}
>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-[#141414] shadow-lg">
                <Gamepad2 size={24}/>
              </div>
              <h1 className="text-2xl font-bold tracking-tighter uppercase italic font-serif">QuestLog</h1>
            </div>

            <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full">
              <button
                onClick={() => setCurrentTab('home')}
                className={cn(
"px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer",
                  currentTab ==='home' ?"bg-white text-[#141414]" :"text-white/50 hover:text-white"
                )}
>
                Home
              </button>
              <button
                onClick={() => setCurrentTab('questlog')}
                className={cn(
"px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer",
                  currentTab ==='questlog' ?"bg-white text-[#141414]" :"text-white/50 hover:text-white"
                )}
>
                QuestLog
              </button>
              <button
                onClick={() => setCurrentTab('launcher')}
                className={cn(
"px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer",
                  currentTab ==='launcher' ?"bg-white text-[#141414]" :"text-white/50 hover:text-white"
                )}
>
                Launcher
              </button>
            </nav>
          </div>
          
          <div
            className="flex items-center gap-3"
            style={{ WebkitAppRegion:'no-drag' } as React.CSSProperties}
>
            {currentTab ==='questlog' && (
              <>
                <button
                  onClick={fetchGames}
                  disabled={isRefreshing}
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                  title="Refresh List"
>
                  <RefreshCw
                    size={20}
                    className={isRefreshing ?'animate-spin text-emerald-600' :'text-[#e4e3e0]'}
/>
                </button>
                
                {games.filter(g => g.list_type === activeList).length> 0 && (
                  <div className="relative flex items-center">
                    {confirmClear ? (
                      <div className="flex items-center gap-2 bg-red-100 p-1.5 rounded-full border border-red-900/50 animate-in fade-in slide-in-from-right-4 shadow-sm">
                        <AlertTriangle size={16} className="text-red-600 ml-2"/>
                        <span className="text-sm font-bold text-red-400 mr-1">Clear all?</span>
                        <button
                          onClick={() => setConfirmClear(false)}
                          className="px-4 py-2 bg-[#1a1a1a] text-red-400 rounded-full text-xs font-bold hover:bg-red-900/20 transition-colors cursor-pointer"
>
                          Cancel
                        </button>
                        <button
                          onClick={clearAllGames}
                          className="px-4 py-2 bg-red-600 text-white rounded-full text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
>
                          Yes, Clear
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmClear(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-900/20 text-red-600 hover:bg-red-900/40 hover:text-red-400 transition-colors font-bold text-sm cursor-pointer border border-red-900/30"
>
                        <Trash2 size={18}/>
                        <span className="hidden sm:inline">
                          Clear {activeList ==='shared' ?'Shared' :'Private'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setAddToList(activeList);
                    if (activeList ==='shared' && !activeGroupId) {
                      alert('Please create or join a group first');
                      return;
                    }
                    setIsAdding(true);
                  }}
                  className="flex items-center gap-2 bg-white text-[#141414] px-6 py-2.5 rounded-full hover:scale-105 transition-transform active:scale-95 cursor-pointer shadow-lg ml-1"
>
                  <Plus size={18}/>
                  <span className="font-bold text-sm uppercase tracking-widest">Add Game</span>
                </button>
              </>
            )}
            
            <button
              onClick={handleLogout}
              className="ml-4 text-xs font-bold uppercase hover:underline"
>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {currentTab ==='home' ? (
          <div className="space-y-12">
            <section className="relative h-[400px] rounded-[40px] overflow-hidden group">
              <img
                src={
                  homeData?.recentlyPlayed?.[0]
                    ? getBannerUrl(homeData.recentlyPlayed[0])
                    :'https://picsum.photos/seed/gaming/1920/1080'
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


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-16">
                <HorizontalScrollRow title="Jump Back In" icon={<Clock size={24} className="text-emerald-500"/>}>
                  {homeData?.recentlyPlayed?.map((game) => (
                    <motion.div key={game.id} whileHover={{ y: -5 }} onClick={() => { setSelectedGame(game as any); fetchLauncherGameDetails(game.id); }}
                      className="group relative w-[calc(50%-0.5rem)] aspect-[92/43] rounded-2xl overflow-hidden cursor-pointer border border-white/5 bg-white/5 snap-start shrink-0"
>
                      <img src={getSteamHorizontalArtwork(game, artworkRefreshKey)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={game.title} referrerPolicy="no-referrer" onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes(getBannerUrl(game))) {
                            target.src = getBannerUrl(game);
                          }
                        }}
/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{game.title}</h3>
                          <div className="flex items-center gap-3 text-white/60 text-[10px] font-medium">
                            <span className="flex items-center gap-1">
                              <Clock size={10}/>
                              {Math.round(game.playtime/ 60)}h
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </HorizontalScrollRow>

                <HorizontalScrollRow title="Suggested from Library" icon={<Library size={24} className="text-blue-500"/>}>
                  {homeData?.suggestedLibrary?.map((game) => (
                    <motion.div key={game.id} whileHover={{ y: -5 }} onClick={() => { setSelectedGame(game as any); fetchLauncherGameDetails(game.id); }}
                      className="group relative w-[calc(50%-0.5rem)] aspect-[92/43] rounded-2xl overflow-hidden cursor-pointer border border-white/5 bg-white/5 snap-start shrink-0"
>
                      <img src={getSteamHorizontalArtwork(game, artworkRefreshKey)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={game.title} referrerPolicy="no-referrer" onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes(getBannerUrl(game))) {
                            target.src = getBannerUrl(game);
                          }
                        }}
/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{game.title}</h3>
                          <div className="flex items-center gap-3 text-white/60 text-[10px] font-medium">
                            <span className="flex items-center gap-1">
                              <Clock size={10}/>
                              {Math.round(game.playtime/ 60)}h
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </HorizontalScrollRow>

                <HorizontalScrollRow title="Suggested from Log" icon={<Gamepad2 size={24} className="text-purple-500"/>}>
                  {homeData?.suggestedLog?.map((game) => (
                    <motion.div key={game.id} whileHover={{ y: -5 }} onClick={() => { setSelectedGame(game as any); fetchQuestlogFriends(game as any); }}
                      className="group relative w-[calc(50%-0.5rem)] aspect-[92/43] rounded-2xl overflow-hidden cursor-pointer border border-white/5 bg-white/5 snap-start shrink-0"
>
                      <img src={getSteamHorizontalArtwork(game, artworkRefreshKey)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={game.title} referrerPolicy="no-referrer" onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes(getBannerUrl(game))) {
                            target.src = getBannerUrl(game);
                          }
                        }}
/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{game.title}</h3>
                          <div className="flex items-center gap-3 text-white/60 text-[10px] font-medium">
                            <span className="flex items-center gap-1 text-emerald-500">
                              <Tag size={10}/>
                              {game.genre}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </HorizontalScrollRow>

                <section className="bg-white/5 rounded-[32px] p-8 border border-white/10">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-emerald-500"/>
                    Playtime History
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={homeData?.history}>
                        <defs>
                          <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false}/>
                        <XAxis dataKey="date" hide/>
                        <Tooltip contentStyle={{ backgroundColor:'#1a1a1a', border:'1px solid #ffffff10', borderRadius:'12px' }} itemStyle={{ color:'#10b981' }}/>
                        <Area type="monotone" dataKey="minutes" stroke="#10b981" fillOpacity={1} fill="url(#colorMinutes)" strokeWidth={3}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3 mb-8">
                    <HistoryIcon size={24} className="text-indigo-500"/>
                    Community Feed
                  </h2>
                  <div className="space-y-4">
                    {homeData?.friendsActivity?.map((activity, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                        <img src={activity.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.added_by}`} className="w-10 h-10 rounded-full" alt="User"/>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-bold text-emerald-500">{activity.added_by}</span> added <span className="font-bold">{activity.title}</span> to <span className="text-indigo-400 font-bold">{activity.group_name}</span>
                          </p>
                          <p className="text-[10px] opacity-40 uppercase font-mono mt-1">{new Date(activity.created_at).toLocaleDateString()}</p>
                        </div>
                        <img src={activity.artwork} className="w-12 h-16 rounded-lg object-cover" alt="Game"/>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="lg:col-span-4 space-y-10">
                <section className="bg-white/5 rounded-[32px] p-8 border border-white/10">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Users size={20} className="text-blue-500"/>
                    Friends Online
                  </h3>

                  {/* Steam */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <SteamIcon className="w-3 h-3 text-white/30"/>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Steam</span>
                    </div>
                    {user?.steam_id ? (
                      <div className="space-y-4">
                        {(homeData?.friendsOnline?.steam?.filter(f => f.online_status ==='online') ?? []).slice(0, 5).map(friend => (
                          <FriendRow key={friend.id} friend={friend}/>
                        ))}
                        {(homeData?.friendsOnline?.steam?.filter(f => f.online_status ==='online') ?? []).length === 0 && (
                          <p className="text-xs text-white/20 italic">No Steam friends online</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setShowSteamLinkModal(true)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#171a21] flex items-center justify-center">
                            <SteamIcon className="w-5 h-5 text-white/40"/>
                          </div>
                          <span className="text-xs font-bold text-white/40">Connect Steam</span>
                        </div>
                        <Plus size={16} className="text-white/20"/>
                      </div>
                    )}
                  </div>

                  {/* Xbox */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <XboxIcon className="w-3 h-3 text-white/30"/>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Xbox</span>
                    </div>
                    {user?.xbox_id ? (
                      <div className="space-y-4">
                        {(homeData?.friendsOnline?.xbox?.filter(f => f.online_status ==='online') ?? []).slice(0, 5).map(friend => (
                          <FriendRow key={friend.id} friend={friend}/>
                        ))}
                        {(homeData?.friendsOnline?.xbox?.filter(f => f.online_status ==='online') ?? []).length === 0 && (
                          <p className="text-xs text-white/20 italic">No Xbox friends online</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 cursor-pointer hover:bg-white/5 transition-colors" onClick={handleSyncXbox}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#107c10]/40 flex items-center justify-center">
                            <XboxIcon className="w-5 h-5 text-white/40"/>
                          </div>
                          <span className="text-xs font-bold text-white/40">Connect Xbox</span>
                        </div>
                        <Plus size={16} className="text-white/20"/>
                      </div>
                    )}
                  </div>

                  {/* Discord */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <DiscordIcon className="w-3 h-3 text-white/30"/>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Discord</span>
                      </div>
                      {user?.discord_id && (
                        <button onClick={handleOpenDiscordGuildPicker} className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors">
                          {homeData?.discordGuildId ?'Change Server' :'Pick Server'}
                        </button>
                      )}
                    </div>
                    {user?.discord_id ? (
                      !homeData?.discordGuildId ? (
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 cursor-pointer hover:bg-white/5 transition-colors" onClick={handleOpenDiscordGuildPicker}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center">
                              <DiscordIcon className="w-5 h-5 text-white/40"/>
                            </div>
                            <span className="text-xs font-bold text-white/40">Select a server</span>
                          </div>
                          <Plus size={16} className="text-white/20"/>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(homeData?.friendsOnline?.discord ?? []).slice(0, 6).map(friend => (
                            <FriendRow key={friend.id} friend={friend} showStatus={false}/>
                          ))}
                          {(homeData?.friendsOnline?.discord ?? []).length === 0 && (
                            <p className="text-xs text-white/20 italic">No members found</p>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleLinkProfile('discord')}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#5865F2] flex items-center justify-center">
                            <DiscordIcon className="w-5 h-5 text-white/40"/>
                          </div>
                          <span className="text-xs font-bold text-white/40">Connect Discord</span>
                        </div>
                        <Plus size={16} className="text-white/20"/>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-emerald-500"/>
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setShowStatsDetail('library')}
                      className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl text-left hover:bg-blue-500/20 transition-all group"
>
                      <Library className="text-blue-500 mb-4 group-hover:scale-110 transition-transform"/>
                      <div className="text-2xl font-black">{homeData?.stats?.libraryCount}</div>
                      <div className="text-xs font-bold text-blue-500/60 uppercase tracking-widest">Library</div>
                    </button>
                    <button onClick={() => setShowStatsDetail('playtime')}
                      className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-left hover:bg-emerald-500/20 transition-all group"
>
                      <Clock className="text-emerald-500 mb-3 group-hover:scale-110 transition-transform"/>
                      <div className="text-2xl font-black">{homeData?.stats?.weeklyPlaytimeHours ?? 0}h</div>
                      <div className="text-xs font-bold text-emerald-500/60 uppercase tracking-widest">This Week</div>
                      <div className="text-[10px] text-emerald-500/40 mt-1">{homeData?.stats?.playtimeHours}h total</div>
                    </button>
                    <button onClick={() => setShowStatsDetail('backlog')}
                      className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-3xl text-left hover:bg-purple-500/20 transition-all group"
>
                      <Gamepad2 className="text-purple-500 mb-4 group-hover:scale-110 transition-transform"/>
                      <div className="text-2xl font-black">{homeData?.stats?.backlogCount}</div>
                      <div className="text-xs font-bold text-purple-500/60 uppercase tracking-widest">Backlog</div>
                    </button>
                    <button onClick={() => setShowRecentAchievements(true)}
                      className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-3xl text-left hover:bg-orange-500/20 transition-all group"
>
                      <Trophy className="text-orange-500 mb-4 group-hover:scale-110 transition-transform"/>
                      <div className="text-2xl font-black">{homeData?.recentAchievements?.length}</div>
                      <div className="text-xs font-bold text-orange-500/60 uppercase tracking-widest">Achievements</div>
                    </button>
                  </div>
                </section>

                <section className="bg-white/5 rounded-[32px] p-8 border border-white/10">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <LinkIcon size={20} className="text-orange-500"/>
                    Connected Accounts
                  </h3>
                  <div className="space-y-4">
                    <div className={`flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 transition-colors ${!user?.steam_id ?'cursor-pointer hover:bg-white/5' :''}`} onClick={() => !user?.steam_id && handleLinkProfile('steam')}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#171a21] flex items-center justify-center">
                          <SteamIcon className="w-5 h-5 text-white"/>
                        </div>
                        <span className="text-xs font-bold">Steam</span>
                      </div>
                      {user?.steam_id ? <CheckCircle2 size={16} className="text-emerald-500"/> : <Plus size={16} className="text-white/20"/>}
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 transition-colors ${!user?.xbox_id ?'cursor-pointer hover:bg-white/5' :''}`} onClick={() => !user?.xbox_id && handleSyncXbox}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#107c10] flex items-center justify-center">
                          <XboxIcon className="w-5 h-5 text-white"/>
                        </div>
                        <span className="text-xs font-bold">Xbox</span>
                      </div>
                      {user?.xbox_id ? <CheckCircle2 size={16} className="text-emerald-500"/> : <Plus size={16} className="text-white/20"/>}
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 transition-colors ${!user?.discord_id ?'cursor-pointer hover:bg-white/5' :''}`} onClick={() => !user?.discord_id && handleLinkProfile('discord')}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#5865F2] flex items-center justify-center">
                          <DiscordIcon className="w-5 h-5 text-white"/>
                        </div>
                        <span className="text-xs font-bold">Discord</span>
                      </div>
                      {user?.discord_id ? <CheckCircle2 size={16} className="text-emerald-500"/> : <Plus size={16} className="text-white/20"/>}
                    </div>
                  </div>
                </section>

              </div>
            </div>

            <AnimatePresence>
              {showStatsDetail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStatsDetail(null)}
                    className="absolute inset-0 bg-black/85"
/>
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.15 }}
                    className="relative w-full max-w-4xl bg-[#1a1a1a] rounded-[40px] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
>
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                      <h2 className="text-3xl font-black uppercase tracking-tighter">
                        {showStatsDetail ==='library' ?'Library Insights' : showStatsDetail ==='playtime' ?'Playtime Analytics' :'Backlog Breakdown'}
                      </h2>
                      <button onClick={() => setShowStatsDetail(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24}/>
                      </button>
                    </div>
                    <div className="p-8 overflow-y-auto space-y-10">
                      {showStatsDetail ==='library' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Genre Distribution</h3>
                            <div className="space-y-4">
                              {homeData?.stats?.genreStats?.map((stat, idx) => (
                                <div key={idx} className="space-y-2">
                                  <div className="flex justify-between text-xs font-bold">
                                    <span>{stat.genre ||'Uncategorized'}</span>
                                    <span>{stat.count} games</span>
                                  </div>
                                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(stat.count/ (homeData?.stats?.libraryCount || 1)) * 100}%` }} className="h-full bg-blue-500"/>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Recent Additions</h3>
                            <div className="space-y-4">
                              {launcherGames.slice(0, 5).map(game => (
                                <div key={game.id} className="flex items-center gap-4">
                                  <img src={game.artwork} className="w-10 h-14 rounded-lg object-cover" alt=""/>
                                  <div>
                                    <p className="text-sm font-bold">{game.title}</p>
                                    <p className="text-[10px] text-white/40 uppercase font-mono">Added {new Date(game.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {showStatsDetail ==='playtime' && (() => {
                        const totalHours = homeData?.stats?.playtimeHours || 0;
                        const weeklyHours = homeData?.stats?.weeklyPlaytimeHours || 0;
                        const history7 = (homeData?.history || []).slice(-7);
                        const topGames = [...launcherGames].sort((a, b) => b.playtime - a.playtime).slice(0, 5);
                        return (
                          <div className="space-y-8">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-500/60 mb-1">This Week</p>
                                <p className="text-3xl font-black text-emerald-400">{weeklyHours}h</p>
                              </div>
                              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Total</p>
                                <p className="text-3xl font-black">{totalHours}h</p>
                              </div>
                              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Games Played</p>
                                <p className="text-3xl font-black">{launcherGames.filter(g => g.playtime> 0).length}</p>
                              </div>
                            </div>
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-5">Last 7 Days</h3>
                              <div className="h-36">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={history7} barSize={24}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false}/>
                                    <XAxis dataKey="date" tick={{ fontSize: 9, fill:'#ffffff40', fontFamily:'monospace' }}
                                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-GB', { weekday:'short' })}/>
                                    <Tooltip
                                      contentStyle={{ backgroundColor:'#1a1a1a', border:'1px solid #ffffff15', borderRadius:'10px', fontSize:'11px' }}
                                      formatter={(v: any) => [`${Math.round(v/ 60 * 10)/ 10}h`,'Playtime']}
                                      labelFormatter={(l) => new Date(l).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'short' })}
/>
                                    <Bar dataKey="minutes" fill="#10b981" radius={[6, 6, 0, 0]}/>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-5">Last 30 Days</h3>
                              <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={homeData?.history}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false}/>
                                    <XAxis dataKey="date" hide/>
                                    <Tooltip contentStyle={{ backgroundColor:'#1a1a1a', border:'1px solid #ffffff10', borderRadius:'12px', fontSize:'11px' }}
                                      formatter={(v: any) => [`${Math.round(v/ 60 * 10)/ 10}h`,'Playtime']}/>
                                    <Area type="monotone" dataKey="minutes" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2}/>
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Most Played</h3>
                              <div className="space-y-3">
                                {topGames.map((game, idx) => (
                                  <div key={game.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                                    <span className="text-xs font-black text-white/20 w-4">{idx + 1}</span>
                                    <img src={game.artwork} className="w-10 h-10 rounded-lg object-cover shrink-0" alt=""/>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold truncate">{game.title}</p>
                                    </div>
                                    <p className="text-sm font-black text-emerald-400 shrink-0">{Math.round(game.playtime/ 60)}h</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {showStatsDetail ==='backlog' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-8">
                            <div>
                              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Price Drops in Backlog</h3>
                              <div className="space-y-4">
                                {homeData?.updates?.priceDrops?.map(game => (
                                  <div key={game.id} className="flex items-center gap-4 p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                                    <TrendingDown className="text-orange-500" size={20}/>
                                    <div className="flex-1">
                                      <p className="text-sm font-bold">{game.title}</p>
                                      <p className="text-xs text-orange-500 font-bold">Now {game.lowest_price}</p>
                                    </div>
                                    <ArrowUpRight className="text-white/20" size={16}/>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Recently on Game Pass</h3>
                              <div className="space-y-4">
                                {homeData?.updates?.gamePass?.map(game => (
                                  <div key={game.id} className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                    <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center font-black text-[10px]">GP</div>
                                    <div className="flex-1">
                                      <p className="text-sm font-bold">{game.title}</p>
                                      <p className="text-xs text-emerald-500 font-bold">Added recently</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Backlog Composition</h3>
                            <div className="space-y-6">
                              {['Action','RPG','Indie','Strategy'].map((genre, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                  <div className="w-2 h-2 rounded-full bg-purple-500"/>
                                  <span className="text-sm font-medium flex-1">{genre}</span>
                                  <span className="text-sm font-bold">{Math.floor(Math.random() * 10) + 5}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : currentTab ==='questlog' ? (
          <>
            <div className="flex justify-center mb-12">
              <div className="bg-white/5 p-1.5 rounded-full flex gap-1 shadow-inner">
                <button onClick={() => { setActiveList('private'); setConfirmClear(false); }}
                  className={cn(
"px-8 py-3 rounded-full text-sm font-bold transition-all cursor-pointer",
                    activeList ==='private' ?"bg-white shadow-sm text-[#141414]" :"text-white/50 hover:text-white hover:bg-white/5"
                  )}
>
                  Private Backlog
                </button>
                <button onClick={() => { setActiveList('shared'); setConfirmClear(false); }}
                  className={cn(
"px-8 py-3 rounded-full text-sm font-bold transition-all cursor-pointer",
                    activeList ==='shared' ?"bg-white shadow-sm text-[#141414]" :"text-white/50 hover:text-white hover:bg-white/5"
                  )}
>
                  Shared with Friends
                </button>
              </div>
            </div>

            {activeList ==='shared' && (
              <div className="mb-8 flex flex-col sm:flex-row items-center justify-between bg-[#1a1a1a] p-4 rounded-2xl border border-white/10 shadow-sm gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <span className="text-sm font-bold uppercase tracking-widest">Group:</span>
                  {groups.length> 0 ? (
                    <select
                      value={activeGroupId ??''}
                      onChange={(e) => setActiveGroupId(e.target.value ? Number(e.target.value) : null)}
                      className="bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 font-bold focus:outline-none"
>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm text-white/50 italic">No groups yet</span>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {activeGroupId && (
                    <div className="bg-[#0a0a0a] px-4 py-2 rounded-lg flex items-center gap-2 border border-white/10">
                      <span className="text-xs uppercase font-bold opacity-50">Invite Code:</span>
                      <span className="font-mono font-bold">{groups.find(g => g.id === activeGroupId)?.invite_code}</span>
                    </div>
                  )}
                  <button onClick={() => { setGroupInput(''); setIsCreatingGroup(true); }} className="px-4 py-2 bg-white text-[#141414] rounded-lg text-sm font-bold hover:bg-white/90 transition-colors cursor-pointer">Create</button>
                  <button onClick={() => { setGroupInput(''); setIsJoiningGroup(true); }} className="px-4 py-2 bg-[#1a1a1a] border border-white/20 text-white rounded-lg text-sm font-bold hover:bg-white/5 transition-colors cursor-pointer">Join</button>
                </div>
              </div>
            )}

            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.2em] opacity-50 mb-2">
                  {activeList ==='shared' ?'Shared Status' :'Backlog Status'}
                </p>
                <h2 className="text-5xl font-light tracking-tight">
                  {displayedGames.length} <span className="text-2xl opacity-40">Games to Play</span>
                </h2>
              </div>
              <div className="flex gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase opacity-40">Platform</span>
                  <span className="font-medium flex items-center gap-1.5"><Monitor size={14}/> PC/ Steam</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase opacity-40">Last Updated</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="mb-8 flex flex-col gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full max-w-md flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16}/>
                  <input
                    type="text"
                    placeholder="Search backlog..."
                    value={questLogSearch}
                    onChange={(e) => setQuestLogSearch(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-full py-2 pl-12 pr-6 focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
/>
                </div>
                {availableTags.length> 0 && (
                  <TagDropdown availableTags={availableTags} selectedTags={selectedTags} setSelectedTags={setSelectedTags}/>
                )}
              </div>
            </div>

            {displayedGames.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl">
                <div className="opacity-20 mb-4"><Gamepad2 size={64}/></div>
                <p className="text-white/40 font-medium">
                  {activeList ==='shared' && !activeGroupId
                    ?"Create or join a group to start a shared backlog!"
                    : `Your ${activeList ==='shared' ?'shared' :'private'} backlog is empty. Start adding games!`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {displayedGames.map((game) => (
                  <motion.div layoutId={`game-container-${game.id}`} key={game.id} onClick={() => { setSelectedGame(game as any); fetchQuestlogFriends(game as any); }}
                    className="group cursor-pointer" whileHover={{ y: -8 }}
>
                    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-white/5 border border-white/10 shadow-sm group-hover:shadow-xl transition-shadow">
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
                        <img src={game.artwork} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.includes('library_capsule_2x.jpg')) {
                              target.src = target.src.replace('library_capsule_2x.jpg','library_capsule.jpg');
                            } else if (target.src.includes('library_capsule.jpg')) {
                              target.src = target.src.replace('library_capsule.jpg','library_600x900.jpg');
                            } else {
                              fixArtwork(game);
                            }
                          }}
/>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/95 via-[#0a0a0a]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <h3 className="font-bold text-base leading-tight mb-2 text-white">{game.title}</h3>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {game.tags ? Array.from(new Set(game.tags.split(',').map(t => t.trim()))).slice(0, 3).map(tag => (
                              <span key={tag} className="text-[9px] font-mono uppercase tracking-widest bg-white/10 px-1.5 py-0.5 rounded text-white/70">{tag}</span>
                            )) : (
                              <span className="text-xs font-mono uppercase tracking-widest text-white/80 block mb-2">{game.genre}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {game.steam_rating ? (
                              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest bg-[#171a21] px-2 py-1 rounded border border-[#66c0f4]/20">
                                <span className="text-[#66c0f4] font-bold">Steam</span>
                                <span className="opacity-90 truncate">{game.steam_rating}</span>
                              </div>
                            ) : game.metacritic ? (
                              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10">
                                <span className="opacity-50">Metascore</span>
                                <span className={cn("px-1.5 py-0.5 rounded font-bold text-white", game.metacritic>= 75 ?"bg-green-600" : game.metacritic>= 50 ?"bg-yellow-600" :"bg-red-600")}>
                                  {game.metacritic}
                                </span>
                              </div>
                            ) : null}
                            {game.game_pass === 1 && (
                              <button onClick={(e) => { e.stopPropagation(); openXboxApp(game.title); }}
                                className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest bg-[#107c10]/20 px-2 py-1 rounded border border-[#107c10]/30 hover:bg-[#107c10]/40 transition-colors"
>
                                <span className="text-[#107c10] font-bold">Game Pass</span>
                              </button>
                            )}
                          </div>
                          {formatPrice(game.lowest_price) && (
                            <div className="flex items-center gap-2">
                              <Tag size={14} className="text-emerald-500"/>
                              <span className="font-bold text-emerald-500">{formatPrice(game.lowest_price)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {similarSuggestions.length> 0 && (
              <div className="mt-24 pt-16 border-t border-white/5">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.2em] opacity-50 mb-2">Discovery</p>
                    <h2 className="text-4xl font-light tracking-tight">Suggested <span className="italic font-serif">Adventures</span></h2>
                    <p className="text-xs text-white/40 mt-2">Based on your current backlog and library</p>
                  </div>
                  <button onClick={fetchSimilarSuggestionsData} disabled={isLoadingSimilar} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all disabled:opacity-50 text-[10px] font-bold uppercase tracking-widest">
                    <RefreshCw size={14} className={isLoadingSimilar ?"animate-spin" :""}/>
                    Refresh Suggestions
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {similarSuggestions.map((suggestion, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                      className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/10 cursor-pointer shadow-xl"
                      onClick={() => { setSearchQuery(suggestion.title); setCurrentTab('home'); window.scrollTo({ top: 0, behavior:'smooth' }); }}
>
                      <img src={suggestion.artwork} alt={suggestion.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5">
                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <h3 className="text-sm font-bold leading-tight mb-2">{suggestion.title}</h3>
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
          </>
        ) : (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-12">
              <div className="space-y-4 flex-1">
                <p className="text-xs font-mono uppercase tracking-[0.2em] opacity-50">Game Launcher</p>
                <h2 className="text-6xl font-light tracking-tight">Your <span className="italic font-serif">Library</span></h2>
                <div className="flex flex-col gap-6 pt-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px] max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18}/>
                      <input
                        type="text"
                        placeholder="Search library..."
                        value={launcherSearch}
                        onChange={(e) => setLauncherSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 focus:outline-none focus:border-white/30 transition-all text-sm"
/>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowSteamSync(!showSteamSync)} className={cn("flex items-center gap-2 px-6 py-3 rounded-full border transition-all text-xs font-bold uppercase tracking-widest", showSteamSync ?"bg-white text-black border-white" :"bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10")}>
                        <SteamIcon className="w-4 h-4"/> Steam
                      </button>
                      <button onClick={() => setShowXboxSync(!showXboxSync)} className={cn("flex items-center gap-2 px-6 py-3 rounded-full border transition-all text-xs font-bold uppercase tracking-widest", showXboxSync ?"bg-white text-black border-white" :"bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10")}>
                        <XboxIcon className="w-4 h-4"/> Xbox
                      </button>
                      <button onClick={handleRefreshLibrary} disabled={isSyncing} className="p-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50" title="Refresh Library">
                        <RefreshCw size={18} className={isSyncing ?'animate-spin' :''}/>
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showSteamSync && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 max-w-md">
                        <input type="text" placeholder="Enter Steam ID" value={steamId} onChange={(e) => setSteamId(e.target.value)} className="bg-transparent border-none px-4 py-2 text-sm focus:outline-none flex-1"/>
                        <button onClick={handleSyncSteam} disabled={isSyncing} className="bg-white text-[#141414] px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50">
                          {isSyncing ? <Loader2 className="animate-spin" size={16}/> :'Sync'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showXboxSync && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 max-w-md">
                        <button onClick={handleSyncXbox} disabled={isSyncing} className="bg-[#107c10] text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#158a15] transition-all disabled:opacity-50">
                          {isSyncing ? <Loader2 className="animate-spin" size={16}/> :'Connect Xbox'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
                      {(['all','installed','gamepass-played','not-installed'] as const).map((filter) => (
                        <button key={filter} onClick={() => setLauncherInstalledFilter(filter as any)}
                          className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all", launcherInstalledFilter === filter ?"bg-white text-[#141414]" :"text-white/50 hover:text-white")}
>
                          {filter ==='all' ?'All Games' : filter ==='installed' ?'Installed' : filter ==='gamepass-played' ?'Game Pass Played' :'Not Installed'}
                        </button>
                      ))}
                    </div>
                    {Array.from(new Set(launcherGames.flatMap(g => g.tags ? g.tags.split(',').map(t => t.trim()) : []))).length> 0 && (
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
                <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 transition-all text-sm font-bold uppercase tracking-widest shadow-lg shadow-emerald-900/20">
                  <Plus size={18}/> Add Quest
                </button>
                {launcherGames.length> 0 && (
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
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Library size={24} className="text-blue-500"/>
                    {showHiddenGames ?'Hidden Games' :'Library'}
                  </h3>
                  <button onClick={() => setShowHiddenGames(!showHiddenGames)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                    {showHiddenGames ? <Eye size={16}/> : <EyeOff size={16}/>}
                    {showHiddenGames ?'Show Library' :'Show Hidden'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {launcherGames
                    .filter(g => {
                      if (showHiddenGames) { if (!g.hidden) return false; } else { if (g.hidden) return false; }
                      if (launcherSearch && !g.title.toLowerCase().includes(launcherSearch.toLowerCase())) return false;
                      if (launcherInstalledFilter ==='installed') { if (!g.installed) return false; }
                      else if (launcherInstalledFilter ==='gamepass-played') { if (g.platform !=='xbox' || g.installed) return false; }
                      else if (launcherInstalledFilter ==='not-installed') { if (g.installed) return false; }
                      if (launcherSelectedTags.length> 0) {
                        const gameTags = g.tags ? g.tags.split(',').map(t => t.trim().toLowerCase()) : [];
                        if (!launcherSelectedTags.every(tag => gameTags.includes(tag.toLowerCase()))) return false;
                      }
                      return true;
                    })
                    .map(game => (
                      <motion.div key={game.id} layoutId={`launcher-game-${game.id}`} whileHover={{ y: -8 }} onClick={() => { setSelectedGame(game as any); fetchLauncherGameDetails(game.id); }}
                        className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/10 shadow-lg cursor-pointer"
>
                        <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors"/>
                        {!game.installed && (
                          <div className="absolute inset-0 bg-black/40 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-black/60 px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
                              <Download size={14} className="text-white/70"/>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Not Installed</span>
                            </div>
                          </div>
                        )}
                        <img src={game.artwork} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.includes('library_capsule_2x.jpg')) {
                              target.src = target.src.replace('library_capsule_2x.jpg','library_capsule.jpg');
                            } else if (target.src.includes('library_capsule.jpg')) {
                              target.src = target.src.replace('library_capsule.jpg','library_600x900.jpg');
                            } else {
                              target.src ='https://picsum.photos/seed/game/600/900';
                            }
                          }}
/>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-4 flex flex-col justify-end">
                          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className="font-bold text-sm leading-tight mb-2 drop-shadow-lg line-clamp-2">{game.title}</h3>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-white/60">
                                <Clock size={10} className="text-emerald-500"/>
                                {Math.round(game.playtime/ 60)}h
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); game.hidden ? handleUnhideGame(game.id) : handleHideGame(game.id); }}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
                                title={game.hidden ?"Unhide Game" :"Hide Game"}
>
                                {game.hidden ? <Eye size={14}/> : <EyeOff size={14}/>}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                          {game.platform ==='steam' ? <SteamIcon className="w-3 h-3 text-white"/> : <XboxIcon className="w-3 h-3 text-white"/>}
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-white/10 flex justify-between items-center opacity-30 text-[10px] font-mono uppercase tracking-widest">
        <p>© {new Date().getFullYear()} QuestLog</p>
        <p>v1.2.0 • Powered by Gemini</p>
      </footer>

      <AnimatePresence>
        {(isCreatingGroup || isJoiningGroup) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsCreatingGroup(false); setIsJoiningGroup(false); }}
              className="absolute inset-0 bg-black/60"
/>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.13 }}
              className="relative z-10 w-full max-w-md bg-[#1a1a1a] rounded-3xl p-8 shadow-2xl border border-white/10"
>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tighter uppercase italic font-serif">
                  {isCreatingGroup ?'Create Group' :'Join Group'}
                </h2>
                <button onClick={() => { setIsCreatingGroup(false); setIsJoiningGroup(false); }} className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer">
                  <X size={24}/>
                </button>
              </div>
              <form onSubmit={isCreatingGroup ? handleCreateGroup : handleJoinGroup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                    {isCreatingGroup ?'Group Name' :'Invite Code'}
                  </label>
                  <input autoFocus type="text" value={groupInput} onChange={(e) => setGroupInput(e.target.value)}
                    placeholder={isCreatingGroup ?"e.g. Weekend Gamers" :"e.g. A1B2C3"}
                    className="w-full bg-[#1a1a1a] border-2 border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#E4E3E0] transition-colors"
                    required
/>
                </div>
                <button type="submit" className="w-full bg-white text-[#141414] font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-white/90 transition-colors cursor-pointer">
                  {isCreatingGroup ?'Create' :'Join'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { if (!isLoading) setIsAdding(false); }} className="absolute inset-0 bg-black/60"/>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.13 }} className="relative z-10 w-full max-w-xl bg-[#1a1a1a] rounded-3xl p-8 shadow-2xl border border-white/10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold tracking-tighter uppercase italic font-serif">Add New Quest</h2>
                <button onClick={() => setIsAdding(false)} disabled={isLoading} className="p-2 hover:bg-white/5 rounded-full transition-colors disabled:opacity-50 cursor-pointer">
                  <X size={24}/>
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4 mb-6 bg-[#1a1a1a] p-2 rounded-2xl border-2 border-white/10">
                  <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer">
                    <input type="radio" name="listType" checked={addToList ==='private'} onChange={() => setAddToList('private')} className="hidden"/>
                    <div className={cn('w-full py-3 text-center rounded-xl font-bold text-sm transition-all', addToList ==='private' ?'bg-white text-[#141414]' :'text-white/50 hover:bg-white/5')}>Private List</div>
                  </label>
                  {groups.length> 0 && (
                    <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer">
                      <input type="radio" name="listType" checked={addToList ==='shared'} onChange={() => setAddToList('shared')} className="hidden"/>
                      <div className={cn('w-full py-3 text-center rounded-xl font-bold text-sm transition-all', addToList ==='shared' ?'bg-white text-[#141414]' :'text-white/50 hover:bg-white/5')}>Shared List</div>
                    </label>
                  )}
                </div>
                <div className="relative">
                  <input autoFocus type="text" placeholder="Enter game title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} disabled={isLoading}
                    className="w-full bg-[#1a1a1a] border-2 border-[#E4E3E0] rounded-2xl px-6 py-4 text-lg focus:outline-none focus:ring-4 focus:ring-[#141414]/10 transition-all disabled:opacity-50"
/>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isLoading || isSearchingSuggestions ? <Loader2 className="animate-spin opacity-50" size={24}/> : <Search className="opacity-30" size={24}/>}
                  </div>
                  <AnimatePresence>
                    {suggestions.length> 0 && !isLoading && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border-2 border-[#E4E3E0] rounded-2xl overflow-hidden shadow-xl z-50">
                        {suggestions.map((suggestion, idx) => (
                          <button key={idx} onClick={() => handleAddGame(suggestion.title, suggestion.steamAppID)}
                            className="w-full px-6 py-4 text-left hover:bg-[#1a1a1a] hover:text-white transition-colors flex items-center justify-between group border-b border-white/5 last:border-0 cursor-pointer"
>
                            <div className="flex items-center gap-4">
                              {suggestion.thumb && <img src={suggestion.thumb} alt={suggestion.title} className="w-12 h-12 object-cover rounded shadow-sm bg-white/10" referrerPolicy="no-referrer"/>}
                              <div className="flex flex-col">
                                <span className="font-bold">{suggestion.title}</span>
                                <span className="text-xs opacity-50 group-hover:opacity-70">{suggestion.platform} {suggestion.year ? `(${suggestion.year})` :''}</span>
                              </div>
                            </div>
                            <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-sm opacity-50 italic">
                  {isLoading ?"Fetching game data..." :"Type to see suggestions. Select a game to add it."}
                </p>
                {!isLoading && searchQuery.trim().length> 0 && suggestions.length === 0 && !isSearchingSuggestions && (
                  <button onClick={() => handleAddGame(searchQuery)} className="w-full mt-4 bg-white text-[#141414] py-4 rounded-2xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer">
                    <Plus size={20}/>
                    Add"{searchQuery}" Directly
                  </button>
                )}
                {isLoading && (
                  <div className="w-full mt-4 bg-white/5 py-8 rounded-2xl flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={32}/>
                    <p className="font-mono text-xs uppercase tracking-widest animate-pulse">Fetching Metadata...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedGame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setSelectedGame(null); setFriendsWhoOwn([]); setIsEditingArtwork(false); setIsEditingTags(false); setShowFriendsModal(false); setShowAchievementsModal(false); setConfirmDelete(null); }}
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/10 to-transparent pointer-events-none"/>

                {/* Close button — always on top */}
                <button
                  onClick={() => { setSelectedGame(null); setFriendsWhoOwn([]); setIsEditingTags(false); setIsEditingArtwork(false); setShowFriendsModal(false); setShowAchievementsModal(false); setConfirmDelete(null); }}
                  className="absolute top-4 right-4 z-50 p-2.5 bg-black/50 border border-white/15 text-white rounded-full hover:bg-black/70 transition-all cursor-pointer"
                  style={{ pointerEvents:'all' }}
>
                  <X size={16}/>
                </button>

                {/* Edit artwork — only visible on hover */}
                <div className="absolute bottom-4 left-4 z-30 opacity-0 group-hover/artwork:opacity-100 transition-opacity duration-200">
                  <button onClick={() => { setEditingArtworkType('logo'); setIsEditingArtwork(true); setCustomArtworkUrl(selectedGame.logo ||''); }}
                    className="bg-black/60 border border-white/20 text-white px-3 py-1.5 rounded-full hover:bg-black/80 transition-all cursor-pointer shadow-lg flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                    <Image size={12}/> Edit Artwork
                  </button>
                </div>

              </div>

              {/* ── SCROLLABLE CONTENT ── */}
              <div className="w-full px-6 md:px-8 pb-8 pt-4 overflow-y-auto flex-1">
                <div className="max-w-3xl mx-auto space-y-5">

                  {/* Logo/ title — original placement, cropping fixed by overflow:clip on parent */}
                  <div className="mb-2 flex items-center justify-start">
                    {selectedGame.logo ? (
                      <img src={selectedGame.logo} alt={selectedGame.title} className="min-w-[30%] max-w-[75%] h-auto max-h-32 object-contain" referrerPolicy="no-referrer"/>
                    ) : (
                      <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{selectedGame.title}</h2>
                    )}
                  </div>

                  {/* Tags row */}
                  <div className="flex items-center justify-between mt-5">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedGame.tags
                        ? Array.from(new Set(selectedGame.tags.split(',').map(t => t.trim()))).slice(0, 5).map(tag => (
                            <span key={tag} className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 bg-white/5 text-white/70 rounded-full border border-white/5">{tag}</span>
                          ))
                        : <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 bg-white/5 text-white/70 rounded-full border border-white/5">{selectedGame.genre}</span>
                      }
                    </div>
                    <button onClick={() => { setIsEditingTags(!isEditingTags); setNewTagInput(''); }} className="text-[9px] font-mono uppercase text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer font-bold">
                      <Edit2 size={10}/>{isEditingTags ?'Done' :'Tags'}
                    </button>
                  </div>

                  {isEditingTags && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {selectedGame.tags
                          ? Array.from(new Set(selectedGame.tags.split(',').map(t => t.trim()))).map(tag => (
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
                        <span className="text-xs font-bold">{Math.round((selectedGame as LauncherGame).playtime/ 60)} Hours</span>
                      </div>
                    )}
                    {selectedGame.release_date && (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase opacity-40 tracking-widest">Released</span>
                        <span className="text-xs font-bold">{selectedGame.release_date}</span>
                      </div>
                    )}
                    {'last_played' in selectedGame && (selectedGame as LauncherGame).last_played && (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase opacity-40 tracking-widest">Last Played</span>
                        <span className="text-xs font-bold">{new Date((selectedGame as LauncherGame).last_played!).toLocaleDateString()}</span>
                      </div>
                    )}
                    {'steam_rating' in selectedGame && selectedGame.steam_rating && (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase opacity-40 tracking-widest">Rating</span>
                        <span className="text-xs font-bold text-[#66c0f4]">{selectedGame.steam_rating}</span>
                      </div>
                    )}
                  </div>

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
                              if (platform ==='steam') window.location.href = `steam://install/${(selectedGame as LauncherGame).external_id}`;
                              else if (platform ==='xbox') window.open(`https://www.xbox.com/en-GB/games/store/game/${(selectedGame as LauncherGame).external_id}`,'_blank');
                              handleToggleInstalled(selectedGame.id, true);
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
                                <img src={f.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`} alt={f.username} className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
                              </div>
                            ))}
                            {friendsWhoOwn.length> 3 && <div className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] bg-emerald-900/80 flex items-center justify-center text-[9px] font-bold text-emerald-200">+{friendsWhoOwn.length - 3}</div>}
                          </div>
                        </button>
                      </div>
                    );
                  })() : (
                    <div className="grid grid-cols-3 gap-2">
                      {/* Steam store */}
                      <button
                        onClick={() => openInBrowser((selectedGame as any).steam_url)}
                        className="flex items-center justify-between p-3 bg-[#1b2838] border border-[#66c0f4]/20 rounded-2xl hover:border-[#66c0f4]/50 transition-all cursor-pointer"
>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-[#66c0f4]/10 rounded-xl flex items-center justify-center shrink-0">
                            <SteamIcon className="w-5 h-5 text-[#66c0f4]"/>
                          </div>
                          <div className="text-left">
                            <p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Store</p>
                            <p className="font-bold text-sm text-[#66c0f4]">Steam</p>
                          </div>
                        </div>
                      </button>
                      {/* Best price */}
                      <button
                        onClick={() => openInBrowser((selectedGame as any).allkeyshop_url)}
                        className="flex items-center justify-between p-3 bg-emerald-900/10 border border-emerald-900/30 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer"
>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0"><Tag size={16}/></div>
                          <div className="text-left">
                            <p className="text-[8px] font-mono uppercase opacity-40 tracking-widest">Best Price</p>
                            <p className="font-bold text-emerald-400 text-sm">{formatPrice((selectedGame as any).lowest_price) ??'Check'}</p>
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
                            <p className="font-bold text-sm text-emerald-400">{friendsWhoOwn.length> 0 ? `${friendsWhoOwn.length} Own This` :'Who Owns?'}</p>
                          </div>
                        </div>
                        {friendsWhoOwn.length> 0 && (
                          <div className="flex -space-x-2 shrink-0">
                            {friendsWhoOwn.slice(0, 3).map((f, idx) => (
                              <div key={idx} className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] overflow-hidden bg-emerald-900/50">
                                <img src={f.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`} alt={f.username} className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
                              </div>
                            ))}
                            {friendsWhoOwn.length> 3 && <div className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] bg-emerald-900/80 flex items-center justify-center text-[9px] font-bold text-emerald-200">+{friendsWhoOwn.length - 3}</div>}
                          </div>
                        )}
                      </button>
                    </div>
                  )}

                  {/* ── FOOTER: Remove/ Uninstall ── */}
                  <div className="pt-5 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-20">Added {new Date(selectedGame.created_at).toLocaleDateString()}</p>
                    {(() => {
                      const isLauncher ='playtime' in selectedGame;
                      const isInstalled = isLauncher && (selectedGame as LauncherGame).installed;
                      const platform = isLauncher ? (selectedGame as LauncherGame).platform : null;
                      const handleUninstallClick = () => {
                        if (platform ==='steam') window.open(`steam://uninstall/${(selectedGame as LauncherGame).external_id}`,'_blank');
                        else if (platform ==='xbox') window.open('ms-settings:appsfeatures','_blank');
                      };
                      return confirmDelete === selectedGame.id ? (
                        <div className="flex items-center gap-2 bg-red-900/10 p-2 rounded-xl border border-red-900/30">
                          <span className="text-[10px] font-bold text-red-500 px-2">{isInstalled ?'Uninstall?' :'Remove?'}</span>
                          <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer">No</button>
                          <button onClick={() => isInstalled ? handleUninstallClick() : deleteGame(selectedGame.id)} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all cursor-pointer shadow-lg">Yes</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(selectedGame.id)} className="flex items-center gap-2 text-red-600/60 hover:text-red-500 transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-widest">
                          <Trash2 size={14}/>{isInstalled ?'Uninstall' :'Remove Game'}
                        </button>
                      );
                    })()}
                  </div>
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
              className="bg-[#141414] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl"
>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <Users className="text-emerald-500" size={20}/>
                  Friends &amp; {selectedGame.title}
                </h3>
                <button onClick={() => setShowFriendsModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"><X size={20}/></button>
              </div>
              <div className="overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                {friendsWhoOwn.length> 0 ? friendsWhoOwn.map((f, idx) => {
                  const lastPlayedStr = f.last_played
                    ? new Date(f.last_played * 1000).toLocaleDateString()
                    : undefined;
                  return (
                    <FriendRow
                      key={idx}
                      friend={{ id: idx, username: f.username, avatar: f.avatar, online_status: f.online_status, current_game: f.current_game }}
                      lastPlayedAt={lastPlayedStr}
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

      <AnimatePresence>
        {showAchievementsModal && selectedGame && (() => {
          const achs = (selectedGame as LauncherGame).achievements ? JSON.parse((selectedGame as LauncherGame).achievements!) : [];
          const unlockedAchs = achs.filter((a: any) => a.unlocked);
          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={() => setShowAchievementsModal(false)}>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={(e) => e.stopPropagation()}
                className="bg-[#141414] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-3">
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
                        <div className="text-[10px] font-mono opacity-40 shrink-0 text-right"><p>{new Date(ach.unlockTime * 1000).toLocaleDateString()}</p></div>
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

      <AnimatePresence>
        {showSteamLinkModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSteamLinkModal(false)} className="absolute inset-0 bg-black/60"/>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.13 }}
              className="relative z-10 w-full max-w-md bg-[#1a1a1a] rounded-3xl p-8 shadow-2xl border border-white/10"
>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tighter uppercase italic font-serif">Connect Steam</h2>
                <button onClick={() => setShowSteamLinkModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer">
                  <X size={24}/>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2">Steam ID64</label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. 76561198012345678"
                    value={steamLinkInput}
                    onChange={(e) => setSteamLinkInput(e.target.value)}
                    onKeyDown={(e) => e.key ==='Enter' && handleSteamLink()}
                    className="w-full bg-[#1a1a1a] border-2 border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#E4E3E0] transition-colors font-mono"
/>
                  <p className="mt-2 text-xs text-white/30">
                    Find yours at{''}
                    <button onClick={() => window.open('https://steamid.io','_blank')} className="text-white/50 underline hover:text-white/80 transition-colors">steamid.io</button>
                    {''}— paste your profile URL to get your 17-digit ID.
                  </p>
                </div>
                <button
                  onClick={handleSteamLink}
                  disabled={!steamLinkInput.trim()}
                  className="w-full bg-white text-[#141414] font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-40"
>
                  Link & Sync Library
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── RECENT ACHIEVEMENTS POPUP ── */}
      <AnimatePresence>
        {showRecentAchievements && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={() => setShowRecentAchievements(false)}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#141414] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-lg max-h-[75vh] flex flex-col shadow-2xl"
>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <Trophy className="text-orange-500" size={20}/>
                  Recent Achievements
                  {homeData?.recentAchievements && homeData.recentAchievements.length> 0 && (
                    <span className="text-sm font-normal text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full">{homeData.recentAchievements.length} unlocked</span>
                  )}
                </h3>
                <button onClick={() => setShowRecentAchievements(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"><X size={20}/></button>
              </div>
              <div className="overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                {homeData?.recentAchievements && homeData.recentAchievements.length> 0 ? homeData.recentAchievements.map((ach: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 shrink-0">
                      {ach.icon ? <img src={ach.icon} alt={ach.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center opacity-20"><Trophy size={20}/></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{ach.name}</p>
                      <p className="text-[10px] text-white/40 truncate">{ach.description ||'Achievement unlocked'}</p>
                      <p className="text-[10px] text-white/30 truncate mt-0.5">{ach.gameTitle}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {ach.platform ==='steam' ? (
                        <SteamIcon className="w-4 h-4 text-[#66c0f4]"/>
                      ) : ach.platform ==='xbox' ? (
                        <XboxIcon className="w-4 h-4 text-[#107c10]"/>
                      ) : null}
                      {ach.unlockTime ? (
                        <p className="text-[9px] font-mono text-white/30">{new Date(ach.unlockTime * 1000).toLocaleDateString()}</p>
                      ) : null}
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-16 opacity-30 text-center">
                    <Trophy size={40} className="mb-4"/>
                    <p className="text-sm font-mono uppercase tracking-widest">No achievements yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDiscordGuildPicker && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDiscordGuildPicker(false)} className="absolute inset-0 bg-black/60"/>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.13 }}
              className="relative z-10 w-full max-w-md bg-[#1a1a1a] rounded-3xl p-8 shadow-2xl border border-white/10"
>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tighter uppercase italic font-serif">Pick a Server</h2>
                <button onClick={() => setShowDiscordGuildPicker(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer">
                  <X size={24}/>
                </button>
              </div>

              <p className="text-xs text-white/30 mb-6 -mt-2">
                Members of this server will appear in Friends Online. Add <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono">DISCORD_BOT_TOKEN</code> to your <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono">.env</code> for live presence data.
              </p>

              {discordGuildsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin opacity-40" size={28}/>
                </div>
              ) : discordGuilds.length === 0 ? (
                <p className="text-xs text-white/30 italic text-center py-8">No servers found. Re-link Discord to grant the guilds permission.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto -mx-2 px-2">
                  {discordGuilds.map(guild => (
                    <button key={guild.id} onClick={() => handleSelectDiscordGuild(guild.id)}
                      className={cn(
"w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left cursor-pointer",
                        homeData?.discordGuildId === guild.id
                          ?"bg-white/5 border-white/20"
                          :"bg-black/20 border-white/5 hover:bg-white/5"
                      )}
>
                      {guild.icon
                        ? <img src={guild.icon} className="w-8 h-8 rounded-lg" alt={guild.name}/>
                        : <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-bold">{guild.name.slice(0, 2).toUpperCase()}</div>
                      }
                      <span className="text-xs font-bold flex-1">{guild.name}</span>
                      {homeData?.discordGuildId === guild.id && <CheckCircle2 size={16} className="text-emerald-500"/>}
                    </button>
                  ))}
                </div>
              )}

              {homeData?.discordGuildId && (
                <button onClick={() => handleSelectDiscordGuild('')} className="mt-6 w-full text-xs font-bold uppercase tracking-widest text-white/20 hover:text-red-500 transition-colors cursor-pointer">
                  Remove server
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {syncMessage && (
        // 'info' messages (e.g. "Syncing...") are shown as a non-blocking corner toast.
        // 'error' and 'success' messages use the full blocking overlay so the user must acknowledge them.
        <div className={cn(
          "fixed z-50 p-4",
          syncMessage.type === 'info'
            ? "bottom-6 right-6 pointer-events-none"
            : "inset-0 bg-black/80 flex items-center justify-center"
        )}>
          <div className={cn(
            "bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto",
            syncMessage.type === 'info' ? "max-w-sm w-full" : "max-w-md w-full"
          )}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={cn("text-base font-semibold flex items-center gap-2", syncMessage.type ==='error' ?'text-red-500' : syncMessage.type ==='success' ?'text-green-500' :'text-blue-400')}>
                {syncMessage.type === 'info' && <Loader2 size={14} className="animate-spin"/>}
                {syncMessage.title}
              </h2>
              <button onClick={() => setSyncMessage(null)} className="text-zinc-400 hover:text-white transition-colors cursor-pointer"><X size={18}/></button>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{syncMessage.message}</p>
            {syncMessage.type !== 'info' && (
              <div className="flex justify-end mt-6">
                <button onClick={() => setSyncMessage(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors cursor-pointer">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
