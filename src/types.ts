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
}
