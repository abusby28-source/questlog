export interface User {
  id: number;
  username: string;
  steam_id?: string;
  xbox_id?: string;
  epic_account_id?: string;
  ea_display_name?: string;
  discord_id?: string;
  avatar?: string;
}

export interface Group {
  id: number;
  name: string;
  invite_code: string;
  created_by?: number;
}

export interface LauncherGame {
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
  hasAttemptedFix?: boolean;
  price_dropped?: number;
  previous_price?: string;
  game_pass_new?: number;
  game_pass_added_at?: string;
  hltb_main?: number | null;
  matchedTags?: string[];
}

export interface FriendEntry {
  id: number | string;
  username: string;
  avatar?: string;
  online_status: string;
  current_game?: string;
}

export interface DiscoverGame {
  _external: true;
  id: string;
  title: string;
  verticalArt?: string;
  horizontalArt?: string;
  platform?: string;
  artwork: string;
  banner?: string;
  genre?: string;
  tags?: string;
  description?: string;
  release_date?: string;
  steam_rating?: string;
  metacritic?: number;
  logo?: string;
  steamAppID?: string;
  friendName?: string;
  friendAvatar?: string;
  lastPlayed?: string;
  matchedLibraryId?: number | null;
  matchedQuestlogId?: number | null;
}

export interface HomeData {
  recentlyPlayed: LauncherGame[];
  friendsOnline: { steam: FriendEntry[]; xbox: FriendEntry[]; epic: FriendEntry[]; discord: FriendEntry[]; app: FriendEntry[] };
  discordGuildId: string | null;
  discordGuildName: string | null;
  discordGuildIcon: string | null;
  discordLinked: boolean;
  discordClientId: string | null;
  discordGuildCached: boolean;
  recentAchievements: { name: string; description: string; icon: string; gameTitle: string; gameArtwork: string; username: string; userAvatar?: string }[];
  pickedForYou: (LauncherGame & { _source: 'library' | 'log'; matchedTags: string[] })[];
  suggestions: Game[];
  history: { date: string; minutes: number }[];
  updates: {
    priceDrops: Game[];
    gamePass: Game[];
  };
  stats: {
    backlogCount: number;
    libraryCount: number;
    playtimeHours: number;
    weeklyPlaytimeHours: number;
    genreStats: { genre: string; count: number }[];
    tagStats: { tag: string; count: number }[];
  };
  friendsActivity?: DiscoverGame[];
  sharedLogActivity?: { id: number; title: string; artwork?: string; genre?: string; added_by: string; user_avatar?: string; group_name: string; created_at: string }[];
}

export interface Game {
  id: number;
  title: string;
  artwork: string;
  banner?: string;
  horizontal_grid?: string;
  logo?: string;
  genre: string;
  tags: string; // Comma-separated tags
  description: string;
  steam_url: string;
  game_pass: number; // SQLite stores boolean as 0/1
  allkeyshop_url: string;
  lowest_price: string;
  status: string;
  list_type: 'private' | 'shared';
  group_id?: number;
  release_date?: string;
  metacritic?: number;
  steam_rating?: string;
  achievements?: string;
  created_at: string;
  isFixingArtwork?: boolean;
  artworkFailed?: boolean;
  hasAttemptedFix?: boolean;
  matchedTags?: string[];
}
