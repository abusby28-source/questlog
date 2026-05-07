import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Loader2, X, RefreshCw, Tag, Sparkles, TrendingUp,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DiscoverGame } from '../types';
import { CachedImg } from '../components/CachedImg';
import { HorizontalScrollRow } from '../components/HorizontalScrollRow';
import { ALL_STEAMSPY_TAGS } from '../constants';
import { getCountdown } from '../utils/gameUtils';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// ── Inline icon components ────────────────────────────────────────────────────

const EpicIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 647.167 750.977" className={className}>
    <defs>
      <mask id="discover-epic-icon-mask">
        <g transform="matrix(1.3333333,0,0,-1.3333333,-278.05173,902.58312)">
          <g transform="translate(649.8358,676.9377)">
            <path fill="white" fillRule="evenodd" d="m 0,0 -397.219,0 c -32.196,0 -44.078,-11.882 -44.078,-44.093 l 0,-388.676 c 0,-3.645 0.147,-7.031 0.469,-10.168 0.733,-7.031 0.871,-13.844 7.41,-21.601 0.639,-0.76 7.315,-5.728 7.315,-5.728 3.591,-1.761 6.043,-3.058 10.093,-4.688 l 195.596,-81.948 c 10.154,-4.655 14.4,-6.469 21.775,-6.323 l 0,-0.001 c 0.019,0 0.039,0 0.058,0 l 0,0.001 c 7.375,-0.146 11.621,1.668 21.776,6.323 l 195.595,81.948 c 4.051,1.63 6.502,2.927 10.094,4.688 0,0 6.676,4.968 7.314,5.728 6.539,7.757 6.677,14.57 7.41,21.601 0.322,3.137 0.47,6.523 0.47,10.168 l 0,388.676 C 44.078,-11.882 32.195,0 0,0" />
          </g>
          <g transform="translate(623.2303,286.175)">
            <path fill="black" d="m 0,0 -0.09,-0.897 -0.089,-0.985 -0.18,-0.897 -0.268,-0.896 -0.174,-0.807 -0.27,-0.897 -0.358,-0.807 -0.359,-0.718 -0.353,-0.806 -0.448,-0.717 -0.448,-0.718 -0.533,-0.717 -0.449,-0.717 -0.532,-0.627 -0.628,-0.628 -0.533,-0.538 -0.716,-0.628 -0.623,-0.538 -0.717,-0.538 -0.712,-0.442 -0.712,-0.538 -0.807,-0.448 -0.802,-0.359 -0.801,-0.448 -0.897,-0.359 -0.891,-0.359 -0.891,-0.268 -0.891,-0.27 -0.807,-0.268 -0.891,-0.18 -0.802,-0.179 -0.801,-0.179 -0.897,-0.18 -0.892,-0.089 -0.801,-0.09 -0.897,-0.09 -0.98,-0.09 -0.892,-0.089 -0.891,0 -0.981,0 -0.986,0 -0.891,0 -0.892,0.089 -0.98,0 -0.892,0.09 -0.896,0.09 -0.981,0.09 -0.891,0.179 -0.891,0.09 -0.897,0.179 -0.892,0.179 -0.891,0.18 -0.891,0.179 -0.896,0.268 -0.802,0.18 -0.891,0.269 -0.892,0.269 -0.806,0.359 -0.891,0.269 -0.802,0.268 -0.892,0.359 -0.806,0.359 -0.802,0.359 -0.802,0.442 -0.806,0.359 -0.802,0.449 -0.712,0.447 -0.807,0.449 -0.712,0.448 -0.717,0.448 -0.712,0.538 -0.712,0.538 -0.717,0.538 -0.713,0.538 -0.627,0.538 -0.712,0.627 0.538,0.717 0.622,0.628 0.538,0.718 0.623,0.717 0.538,0.627 0.532,0.717 0.628,0.718 0.532,0.627 0.628,0.717 0.533,0.628 0.627,0.717 0.533,0.718 0.538,0.627 0.622,0.717 0.538,0.718 0.622,0.627 0.538,0.717 0.712,-0.538 0.802,-0.538 0.717,-0.538 0.802,-0.538 0.717,-0.448 0.802,-0.537 0.711,-0.449 0.808,-0.358 0.711,-0.449 0.802,-0.359 0.807,-0.358 0.801,-0.359 0.803,-0.269 0.806,-0.358 0.891,-0.269 0.892,-0.269 0.801,-0.269 0.897,-0.18 0.891,-0.179 0.891,-0.179 0.981,-0.09 0.896,-0.179 0.892,0 0.98,-0.089 0.892,0 1.07,0 0.981,0.089 0.897,0.179 0.801,0.18 0.802,0.179 0.717,0.269 0.623,0.358 0.717,0.538 0.532,0.628 0.359,0.718 0.27,0.806 0.088,0.897 0,0.179 -0.088,1.076 -0.359,0.897 -0.449,0.627 -0.622,0.538 -0.718,0.538 -0.712,0.358 -0.801,0.359 -0.897,0.359 -1.07,0.447 -0.623,0.18 -0.711,0.179 -0.807,0.27 -0.802,0.179 -0.891,0.269 -0.897,0.179 -0.98,0.269 -0.892,0.179 -0.981,0.269 -0.891,0.179 -0.897,0.269 -0.89,0.18 -0.892,0.269 -0.807,0.268 -0.89,0.18 -0.803,0.269 -0.801,0.269 -0.807,0.269 -0.981,0.359 -0.891,0.359 -0.892,0.358 -0.896,0.359 -0.801,0.448 -0.892,0.448 -0.717,0.448 -0.802,0.448 -0.712,0.538 -0.717,0.448 -0.622,0.539 -0.627,0.627 -0.623,0.628 -0.538,0.628 -0.532,0.627 -0.449,0.627 -0.443,0.718 -0.448,0.806 -0.359,0.622 -0.269,0.718 -0.263,0.807 -0.269,0.717 -0.18,0.897 -0.179,0.807 -0.09,0.896 -0.089,0.897 -0.09,0.985 0,0.987 0,0.179 0,0.897 0.09,0.896 0.089,0.807 0.09,0.897 0.179,0.806 0.18,0.807 0.269,0.808 0.179,0.806 0.353,0.807 0.359,0.807 0.358,0.806 0.444,0.808 0.447,0.806 0.533,0.718 0.539,0.717 0.622,0.717 0.627,0.627 0.623,0.718 0.717,0.628 0.622,0.448 0.717,0.538 0.713,0.538 0.711,0.448 0.807,0.448 0.802,0.359 0.801,0.448 0.807,0.358 0.891,0.27 0.891,0.358 0.807,0.269 0.712,0.18 0.803,0.179 0.806,0.179 0.891,0.179 0.802,0.18 0.891,0.089 0.897,0.09 0.891,0.09 0.891,0.089 0.891,0 0.986,0 0.982,0 0.98,0 0.981,-0.089 0.981,-0.09 0.891,0 0.986,-0.09 0.891,-0.179 0.981,-0.09 0.892,-0.179 0.807,-0.179 0.891,-0.179 0.891,-0.18 0.802,-0.179 0.896,-0.269 0.802,-0.269 0.802,-0.18 0.896,-0.358 0.802,-0.269 0.801,-0.358 0.802,-0.359 0.896,-0.359 0.802,-0.448 0.712,-0.359 0.807,-0.448 0.802,-0.448 0.712,-0.449 0.806,-0.538 0.713,-0.447 0.717,-0.539 0.712,-0.538 0.711,-0.537 L -2.32,39.083 -2.768,38.366 -3.301,37.649 -3.839,36.931 -4.371,36.125 -4.82,35.408 -5.358,34.69 -5.891,33.973 -6.338,33.256 -6.872,32.538 -7.409,31.821 -7.858,31.104 -8.39,30.297 -8.929,29.58 l -0.532,-0.717 -0.448,-0.717 -0.533,-0.717 -0.717,0.537 -0.801,0.449 -0.713,0.448 -0.717,0.538 -0.801,0.358 -0.718,0.449 -0.801,0.359 -0.712,0.358 -0.807,0.359 -0.712,0.358 -0.801,0.269 -0.717,0.359 -0.982,0.268 -0.891,0.27 -0.891,0.268 -0.897,0.18 -0.891,0.179 -0.891,0.18 -0.891,0.09 -0.897,0.089 -0.801,0.09 -0.892,0 -1.07,0 -0.981,-0.179 -0.897,-0.18 -0.801,-0.179 -0.712,-0.359 -0.628,-0.358 -0.802,-0.718 -0.538,-0.807 -0.352,-0.807 -0.091,-0.896 0,-0.18 0.091,-1.165 0.442,-0.986 0.359,-0.538 0.622,-0.628 0.807,-0.448 0.712,-0.448 0.891,-0.359 0.986,-0.359 1.071,-0.358 0.712,-0.179 0.712,-0.269 0.807,-0.179 0.801,-0.269 0.891,-0.18 0.987,-0.269 0.981,-0.268 0.981,-0.27 0.98,-0.179 0.891,-0.269 0.981,-0.269 0.897,-0.179 0.892,-0.269 0.891,-0.269 0.801,-0.269 0.897,-0.269 0.802,-0.269 0.801,-0.269 0.986,-0.353 0.891,-0.449 0.891,-0.358 0.892,-0.448 0.807,-0.449 0.802,-0.448 0.711,-0.448 0.717,-0.538 0.713,-0.448 0.712,-0.628 0.717,-0.627 0.622,-0.718 L -3.481,13 -2.948,12.282 -2.41,11.476 -1.967,10.759 -1.518,9.951 -1.16,9.234 -0.891,8.428 -0.627,7.621 -0.448,6.814 -0.269,5.917 -0.09,5.02 0,4.124 0.09,3.138 l 0,-0.986 0,-0.179 0,-0.987 z" />
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
    <rect width="647.167" height="750.977" fill="currentColor" mask="url(#discover-epic-icon-mask)" />
  </svg>
);

// ── Sub-components ─────────────────────────────────────────────────────────────

const ExternalGameCard = memo(function ExternalGameCard({ game, onClick, loading }: { game: DiscoverGame; onClick: () => void; loading?: boolean }) {
  const steamAppID = (game as any).steamAppID;
  const proxyUrl = steamAppID
    ? `/api/steamgriddb/horizontal/${steamAppID}`
    : `/api/steamgriddb/horizontal-by-name/${encodeURIComponent(game.title)}`;
  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="group relative w-[calc(50%-0.5rem)] aspect-[92/43] rounded-2xl overflow-hidden cursor-pointer ring-1 ring-white/5 bg-white/5 snap-start shrink-0"
    >
      <CachedImg
        proxyUrl={proxyUrl}
        alt={game.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      {loading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-white/70" />
        </div>
      )}
      {game.friendAvatar && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full border-2 border-black overflow-hidden">
          <img src={game.friendAvatar} alt={game.friendName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{game.title}</h3>
          <div className="flex items-center gap-3 text-white/60 text-[10px] font-medium">
            {game.friendName ? (
              <span className="text-blue-400">{game.friendName}</span>
            ) : game.genre ? (
              <span className="flex items-center gap-1 text-emerald-500"><Tag size={10}/>{game.genre}</span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

const EpicHeroBanner = memo(function EpicHeroBanner({ games, onDetails, onOpenInBrowser }: { games: any[]; onDetails: (g: any) => void; onOpenInBrowser: (url: string) => void }) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    if (games.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % games.length), 5000);
    return () => clearInterval(t);
  }, [games.length]);
  const eg = games[idx];
  const heroBg = eg.banner || eg.horizontalArt || eg.artwork;
  const logoSrc = eg.logo || (eg.steamAppID ? `/api/steamgriddb/logo/${eg.steamAppID}` : `/api/steamgriddb/logo-by-name/${encodeURIComponent(eg.title)}`);
  return (
    <div className="relative w-full h-60 rounded-3xl overflow-hidden border border-white/10 bg-white/5">
      <AnimatePresence mode="wait">
        <motion.img
          key={eg.id}
          src={heroBg}
          alt={eg.title}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-between p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2">Free Now</p>
          <img
            src={logoSrc}
            alt={eg.title}
            className="max-h-20 max-w-[280px] w-auto object-contain object-left"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              img.nextElementSibling?.removeAttribute('hidden');
            }}
          />
          <h2 hidden className="text-xl font-bold tracking-tight">{eg.title}</h2>
        </div>
        <div className="flex items-center gap-4">
          {eg.epicUrl && (
            <button onClick={() => onOpenInBrowser(eg.epicUrl)} className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-[#0078f2] hover:bg-[#0066d6] text-white transition-all cursor-pointer shadow-lg">
              <EpicIcon className="w-3.5 h-3.5"/> Claim on Epic Games
            </button>
          )}
          <button onClick={() => onDetails(eg)} className="px-5 py-2.5 rounded-full font-bold text-sm bg-white/10 border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
            Details
          </button>
        </div>
      </div>
      {games.length > 1 && (
        <div className="absolute bottom-4 right-5 flex gap-1.5">
          {games.map((_: any, i: number) => (
            <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all cursor-pointer ${i === idx ? 'bg-white w-4' : 'bg-white/30 w-1.5'}`} />
          ))}
        </div>
      )}
    </div>
  );
});

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

// ── Types ──────────────────────────────────────────────────────────────────────

interface DiscoverData {
  recentlyReleased: DiscoverGame[];
  trending: DiscoverGame[];
  gamePass: DiscoverGame[];
  epicFree: DiscoverGame[];
}

interface TitleSuggestion {
  title: string;
  steamAppID?: string;
  thumb?: string;
  platform?: string;
}

export interface DiscoverPageProps {
  discoverData: DiscoverData | null;
  suggestedForYou: DiscoverGame[] | null;
  selectedDiscoverTag: string | null;
  tagGames: DiscoverGame[];
  loadingTagGames: boolean;
  discoverSearchQuery: string;
  discoverSearchMode: 'title' | 'tag';
  discoverTitleSuggestions: TitleSuggestion[];
  discoverSuggestionsOpen: boolean;
  discoverSearchLoading: boolean;
  setDiscoverData: (v: DiscoverData | null) => void;
  setSuggestedForYou: (v: DiscoverGame[] | null) => void;
  setDiscoverSearchQuery: (v: string) => void;
  setDiscoverSearchMode: (v: 'title' | 'tag') => void;
  setDiscoverTitleSuggestions: (v: TitleSuggestion[]) => void;
  setDiscoverSuggestionsOpen: (v: boolean) => void;
  setSelectedDiscoverTag: (v: string | null) => void;
  setTagGames: (v: DiscoverGame[]) => void;
  handleDiscoverGameClick: (game: any) => void;
  fetchTagGames: (tag: string) => void;
  fetchDiscoverData: () => void;
  fetchSuggestedForYou: (force?: boolean) => void;
  openInBrowser: (url: string) => void;
}

// ── Page component ─────────────────────────────────────────────────────────────

export default function DiscoverPage({
  discoverData,
  suggestedForYou,
  selectedDiscoverTag,
  tagGames,
  loadingTagGames,
  discoverSearchQuery,
  discoverSearchMode,
  discoverTitleSuggestions,
  discoverSuggestionsOpen,
  discoverSearchLoading,
  setDiscoverData,
  setSuggestedForYou,
  setDiscoverSearchQuery,
  setDiscoverSearchMode,
  setDiscoverTitleSuggestions,
  setDiscoverSuggestionsOpen,
  setSelectedDiscoverTag,
  setTagGames,
  handleDiscoverGameClick,
  fetchTagGames,
  fetchDiscoverData,
  fetchSuggestedForYou,
  openInBrowser,
}: DiscoverPageProps) {
  return (
    <div className="space-y-8">
      {/* Discover header */}
      {(() => {
        const filteredTags = discoverSearchQuery.trim()
          ? ALL_STEAMSPY_TAGS.filter(t => t.toLowerCase().includes(discoverSearchQuery.toLowerCase()))
          : ALL_STEAMSPY_TAGS.slice(0, 20);
        return (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-8">
            <div className="space-y-4 flex-1">
              <p className="text-xs font-mono uppercase tracking-[0.2em] opacity-50">Browse</p>
              <h2 className="text-6xl font-light tracking-tight">Discover <span className="italic font-serif">Games</span></h2>
              <div className="flex flex-col gap-4 pt-4">
                {/* Row 1: search input + refresh */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative flex-1 min-w-[300px] max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18}/>
                    <input
                      type="text"
                      value={discoverSearchQuery}
                      onChange={e => { setDiscoverSearchQuery(e.target.value); setDiscoverSuggestionsOpen(true); }}
                      onFocus={() => setDiscoverSuggestionsOpen(true)}
                      onBlur={() => setTimeout(() => setDiscoverSuggestionsOpen(false), 150)}
                      placeholder={discoverSearchMode === 'title' ? 'Search by game title…' : 'Search by tag…'}
                      className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-10 focus:outline-none focus:border-white/30 transition-all text-sm"
                    />
                    {discoverSearchLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-white/30" size={14}/>}
                    {!discoverSearchLoading && discoverSearchQuery && (
                      <button onMouseDown={() => { setDiscoverSearchQuery(''); setDiscoverTitleSuggestions([]); setDiscoverSuggestionsOpen(false); setSelectedDiscoverTag(null); setTagGames([]); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors cursor-pointer">
                        <X size={14}/>
                      </button>
                    )}
                    {/* Dropdown */}
                    {discoverSuggestionsOpen && discoverSearchQuery.trim().length >= 1 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl max-h-72 overflow-y-auto">
                        {discoverSearchMode === 'title' ? (
                          discoverTitleSuggestions.length > 0 ? discoverTitleSuggestions.map(s => (
                            <button key={s.title + (s.steamAppID || '')}
                              onMouseDown={() => {
                                setDiscoverSuggestionsOpen(false);
                                setDiscoverSearchQuery(s.title);
                                const sid = s.steamAppID;
                                handleDiscoverGameClick({
                                  _external: true,
                                  id: sid || s.title,
                                  title: s.title,
                                  artwork: sid ? `https://cdn.akamai.steamstatic.com/steam/apps/${sid}/library_600x900.jpg` : (s.thumb || ''),
                                  verticalArt: sid ? `https://cdn.akamai.steamstatic.com/steam/apps/${sid}/library_600x900.jpg` : s.thumb,
                                  banner: sid ? `https://cdn.akamai.steamstatic.com/steam/apps/${sid}/library_hero.jpg` : undefined,
                                  steamAppID: sid,
                                  platform: s.platform,
                                } as any);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors cursor-pointer text-left"
                            >
                              <SuggestionThumb steamAppID={s.steamAppID} title={s.title} fallbackThumb={s.thumb} size="w-8 h-8"/>
                              <span className="flex-1 font-medium truncate">{s.title}</span>
                              {s.steamAppID
                                ? <span className="text-[10px] font-mono uppercase tracking-widest text-[#66c0f4] bg-[#1b2838] px-1.5 py-0.5 rounded shrink-0">Steam</span>
                                : s.platform
                                  ? <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 shrink-0">{s.platform}</span>
                                  : null
                              }
                            </button>
                          )) : discoverSearchLoading ? null : (
                            <p className="px-4 py-3 text-sm text-white/30 italic">No results</p>
                          )
                        ) : (
                          filteredTags.map(tag => (
                            <button key={tag}
                              onMouseDown={() => { fetchTagGames(tag); setDiscoverSearchQuery(tag); setDiscoverSuggestionsOpen(false); }}
                              className={cn("w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer", selectedDiscoverTag === tag ? "bg-white/10 text-white font-semibold" : "text-white/70 hover:bg-white/5 hover:text-white")}
                            >{tag}</button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setDiscoverData(null); setSuggestedForYou(null); fetchDiscoverData(); fetchSuggestedForYou(true); }} className="p-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all" title="Refresh">
                    <RefreshCw size={18}/>
                  </button>
                </div>
                {/* Row 2: Title / Tag toggle */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-white/5 p-1 rounded-full border border-white/10">
                    <button onClick={() => { setDiscoverSearchMode('title'); setDiscoverSearchQuery(''); setDiscoverTitleSuggestions([]); setSelectedDiscoverTag(null); setTagGames([]); }}
                      className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer", discoverSearchMode === 'title' ? "bg-white text-[#141414]" : "text-white/50 hover:text-white")}
                    >Title</button>
                    <button onClick={() => { setDiscoverSearchMode('tag'); setDiscoverSearchQuery(''); setDiscoverTitleSuggestions([]); setSelectedDiscoverTag(null); setTagGames([]); }}
                      className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer", discoverSearchMode === 'tag' ? "bg-white text-[#141414]" : "text-white/50 hover:text-white")}
                    >Tag</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tag results row — shown above Epic banner */}
      {selectedDiscoverTag && (
        <div>
          {loadingTagGames ? (
            <div className="flex gap-3 overflow-hidden">
              {Array.from({length: 8}).map((_, i) => (
                <div key={i} className="w-36 shrink-0 aspect-[2/3] rounded-2xl bg-white/5 animate-pulse border border-white/5"/>
              ))}
            </div>
          ) : tagGames.length > 0 ? (
            <HorizontalScrollRow title={`Trending ${selectedDiscoverTag} Games`} icon={<Tag size={12} className="text-blue-400/60"/>}>
              {tagGames.map(game => (
                <motion.div key={game.id} whileHover={{ y: -6, scale: 1.02 }}
                  onClick={() => handleDiscoverGameClick(game)}
                  className="group relative w-44 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer ring-1 ring-white/5 bg-white/5 snap-start"
                >
                  <img src={game.verticalArt || game.artwork} alt={game.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      const sid = game.steamAppID;
                      if (sid && !img.src.includes('/api/steamgriddb/portrait/')) img.src = `/api/steamgriddb/portrait/${sid}`;
                      else img.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xs font-bold text-white mb-1 line-clamp-2 leading-tight">{game.title}</h3>
                      {game.genre && <span className="text-[9px] font-mono uppercase tracking-widest text-white/50">{game.genre}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </HorizontalScrollRow>
          ) : (
            <p className="text-sm text-white/30 italic">No results for "{selectedDiscoverTag}"</p>
          )}
        </div>
      )}

      {!discoverData ? (
        <div className="py-24 flex flex-col items-center gap-4 text-white/30">
          <Loader2 className="animate-spin" size={32}/>
          <p className="text-xs font-mono uppercase tracking-widest animate-pulse">Loading Discover...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Free on Epic Games — hero banner (temporarily free only, not always-free) */}
          {(discoverData.epicFree ?? []).filter((g: any) => !g.alwaysFree).length > 0 && (
            <EpicHeroBanner
              games={(discoverData.epicFree ?? []).filter((g: any) => !g.alwaysFree)}
              onDetails={handleDiscoverGameClick}
              onOpenInBrowser={openInBrowser}
            />
          )}

          {[
            { list: discoverData.recentlyReleased, title: 'Trending on Steam', icon: <Sparkles size={12} className="text-yellow-400/60"/> },
            { list: discoverData.trending, title: 'Top Sellers', icon: <TrendingUp size={12} className="text-orange-400/60"/> },
            { list: discoverData.gamePass, title: 'Recently Added to Game Pass', icon: <span className="text-[#107c10]/60 font-black text-[10px]">✦</span> },
          ].map(({ list, title, icon }) => list.length > 0 && (
            <HorizontalScrollRow key={title} title={title} icon={icon}>
              {list.map((game) => (
                <motion.div key={game.id} whileHover={{ y: -6, scale: 1.02 }}
                  onClick={() => handleDiscoverGameClick(game)}
                  className="group relative w-44 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer ring-1 ring-white/5 bg-white/5 snap-start"
                >
                  <img src={game.verticalArt || game.artwork} alt={game.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      const sid = (game as any).steamAppID;
                      const msArt = (game as any).msArt;
                      const src = img.src;
                      if (sid) {
                        if (src.includes('library_600x900_2x')) {
                          img.src = `https://shared.steamstatic.com/store_item_assets/steam/apps/${sid}/library_600x900.jpg`;
                        } else if (src.includes('library_600x900.jpg') && !src.includes('_2x')) {
                          img.src = `https://shared.steamstatic.com/store_item_assets/steam/apps/${sid}/library_capsule_2x.jpg`;
                        } else if (src.includes('library_capsule_2x')) {
                          img.src = `https://shared.steamstatic.com/store_item_assets/steam/apps/${sid}/library_capsule.jpg`;
                        } else if (src.includes('library_capsule.jpg') && !src.includes('_2x')) {
                          img.src = `https://shared.steamstatic.com/store_item_assets/steam/apps/${sid}/header.jpg`;
                        } else if (msArt && src !== msArt) {
                          img.src = msArt;
                        } else {
                          img.style.display = 'none';
                        }
                      } else if (msArt && src !== msArt) {
                        img.src = msArt;
                      } else {
                        img.style.display = 'none';
                      }
                    }}
                  />
                  {false && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-white/70"/>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xs font-bold text-white mb-1 line-clamp-2 leading-tight">{game.title}</h3>
                      {game.genre && <span className="text-[9px] font-mono uppercase tracking-widest text-white/50">{game.genre}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </HorizontalScrollRow>
          ))}

          {/* Suggested for You */}
          <HorizontalScrollRow title="Suggested for You" icon={<Sparkles size={12} className="text-purple-400/60"/>}>
            {suggestedForYou === null ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-44 shrink-0 aspect-[2/3] rounded-2xl bg-white/5 animate-pulse border border-white/5"/>
              ))
            ) : suggestedForYou.map((game) => (
              <motion.div key={game.id} whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => handleDiscoverGameClick(game)}
                className="group relative w-44 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer ring-1 ring-white/5 bg-white/5 snap-start"
              >
                <img src={game.verticalArt || game.artwork} alt={game.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    const sid = (game as any).steamAppID;
                    const msArt = (game as any).msArt;
                    const src = img.src;
                    if (sid) {
                      if (src.includes('library_600x900_2x')) {
                        img.src = `https://shared.steamstatic.com/store_item_assets/steam/apps/${sid}/library_600x900.jpg`;
                      } else if (src.includes('library_600x900.jpg') && !src.includes('_2x')) {
                        img.src = `https://shared.steamstatic.com/store_item_assets/steam/apps/${sid}/library_capsule_2x.jpg`;
                      } else if (src.includes('library_capsule_2x')) {
                        img.src = `https://shared.steamstatic.com/store_item_assets/steam/apps/${sid}/library_capsule.jpg`;
                      } else if (src.includes('library_capsule.jpg') && !src.includes('_2x')) {
                        img.src = `https://shared.steamstatic.com/store_item_assets/steam/apps/${sid}/header.jpg`;
                      } else if (msArt && src !== msArt) {
                        img.src = msArt;
                      } else {
                        img.style.display = 'none';
                      }
                    } else if (msArt && src !== msArt) {
                      img.src = msArt;
                    } else {
                      img.style.display = 'none';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xs font-bold text-white mb-1 line-clamp-2 leading-tight">{game.title}</h3>
                    {game.genre && <span className="text-[9px] font-mono uppercase tracking-widest text-white/50">{game.genre}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </HorizontalScrollRow>
        </div>
      )}
    </div>
  );
}
