import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: apiKey as string });
}

export interface GameInfo {
  title: string;
  artwork: string;
  banner?: string;
  horizontal_grid?: string;
  logo?: string;
  genre: string;
  description: string;
  steam_url: string;
  game_pass: boolean;
  allkeyshop_url: string;
  lowest_price: string | null;
  release_date: string;
  metacritic?: number;
  steam_rating?: string;
  tags?: string;
}

export interface GameSuggestion {
  title: string;
  year?: string;
  platform?: string;
  thumb?: string;
  steamAppID?: string;
}

export async function getGameSuggestions(query: string): Promise<GameSuggestion[]> {
  if (!query || query.length < 2) return [];
  try {
    const results = await fetch(`/api/game-suggestions?q=${encodeURIComponent(query)}`)
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

export async function fetchSteamgridDBArtwork(steamAppID: string): Promise<{ artwork?: string, banner?: string, logo?: string, horizontal_grid?: string }> {
  try {
    const [gridRes, horizontalRes, heroRes, logoRes] = await Promise.all([
      fetch(`/api/steamgriddb/grids/steam/${steamAppID}`),
      fetch(`/api/steamgriddb/grids/steam/${steamAppID}?orientation=horizontal`),
      fetch(`/api/steamgriddb/heroes/steam/${steamAppID}`),
      fetch(`/api/steamgriddb/logos/steam/${steamAppID}`)
    ]);

    let artwork, banner, logo, horizontal_grid;

    if (gridRes.ok) {
      const gridData = await gridRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (gridData.success && gridData.data && gridData.data.length > 0) {
        const nonAlt = gridData.data.filter((g: any) => g.style !== 'alternate');
        const pool = nonAlt.length ? nonAlt : gridData.data;
        const official = pool.find((g: any) => g.style === 'official');
        artwork = official ? official.url : pool[0].url;
      }
    }

    if (horizontalRes.ok) {
      const horizontalData = await horizontalRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (horizontalData.success && horizontalData.data && horizontalData.data.length > 0) {
        const official = horizontalData.data.find((g: any) => g.style === 'official');
        horizontal_grid = official ? official.url : horizontalData.data[0].url;
      }
    }

    if (heroRes.ok) {
      const heroData = await heroRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (heroData.success && heroData.data && heroData.data.length > 0) {
        const official = heroData.data.find((g: any) => g.style === 'official');
        banner = official ? official.url : heroData.data[0].url;
      }
    }

    if (!banner && horizontal_grid) {
      banner = horizontal_grid;
    }

    if (logoRes.ok) {
      const logoData = await logoRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (logoData.success && logoData.data && logoData.data.length > 0) {
        const enLogos = logoData.data.filter((l: any) => !l.language || l.language === 'en');
        const pool = enLogos.length ? enLogos : logoData.data;
        const whites = pool.filter((l: any) => l.style === 'white' || l.style === 'custom');
        const candidates = whites.length ? whites : pool;
        logo = [...candidates].sort((a: any, b: any) => (b.width / b.height) - (a.width / a.height))[0]?.url;
      }
    }

    return { artwork, banner, logo, horizontal_grid };
  } catch (e) {
    console.error("SteamgridDB fetch failed", e);
    return {};
  }
}

export async function fetchAlternativeArtworks(gameTitle: string, knownSteamAppID?: string): Promise<string[]> {
  try {
    let steamAppID = knownSteamAppID;
    if (!steamAppID) {
      const csResponse = await fetch(`/api/search-steam?q=${encodeURIComponent(gameTitle)}`);
      const csData = await csResponse.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (csData && csData.items && csData.items.length > 0) {
        steamAppID = csData.items[0].id.toString();
      }
    }

    if (steamAppID) {
      const gridRes = await fetch(`/api/steamgriddb/grids/steam/${steamAppID}`);
      if (gridRes.ok) {
        const gridData = await gridRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
        if (gridData.success && gridData.data && gridData.data.length > 0) {
          return gridData.data.slice(0, 5).map((g: any) => g.url);
        }
      }
    }
    return [];
  } catch (e) {
    console.error("Failed to fetch alternative artworks", e);
    return [];
  }
}

export async function fetchSimilarSuggestions(titles: string): Promise<any[]> {
  try {
    const ai = getAI();
    const prompt = `Based on these games I like: ${titles}, suggest 6 similar games I might enjoy that are NOT in this list.
    Return a JSON array of objects with:
    - title: Game title
    - genre: Main genre
    - description: 1 sentence summary
    - artwork: A high quality vertical cover art URL (prefer Steam shared assets if possible)
    - banner: A high quality horizontal banner URL (prefer Steam shared assets like header.jpg if possible)
    - steamAppID: Steam App ID if known`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              genre: { type: Type.STRING },
              description: { type: Type.STRING },
              artwork: { type: Type.STRING },
              banner: { type: Type.STRING },
              steamAppID: { type: Type.STRING }
            },
            required: ["title", "genre", "description", "artwork", "banner"]
          }
        }
      }
    });

    const text = response.text || "[]";
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to fetch similar suggestions", e);
    return [];
  }
}

export async function fetchGameInfo(gameTitle: string, knownSteamAppID?: string): Promise<GameInfo> {
  let steamAppID: string | null = knownSteamAppID || null;
  let cheapSharkPrice: string | null = null;
  let cheapSharkTitle: string | null = null;
  let priceAlreadyGBP = true; // price from server endpoint is always GBP

  // Fetch lowest price from Allkeyshop via Gemini (server handles page fetch + extraction)
  let allkeyshopUrlOverride: string | null = null;
  try {
    const priceRes = await fetch(`/api/itad/price?title=${encodeURIComponent(gameTitle)}`);
    if (priceRes.ok) {
      const priceData = await priceRes.json();
      if (priceData.price) { cheapSharkPrice = priceData.price; priceAlreadyGBP = true; }
      if (priceData.allkeyshop_url) allkeyshopUrlOverride = priceData.allkeyshop_url;
    }
  } catch (e) {
    console.error('Price fetch failed', e);
  }

  // Try to get Steam App ID via the server-side resolver (known map → Steam → IGDB)
  if (!steamAppID) {
    try {
      const resolveRes = await fetch(`/api/resolve-steam?title=${encodeURIComponent(gameTitle)}`);
      if (resolveRes.ok) {
        const resolveData = await resolveRes.json().catch(() => ({}));
        if (resolveData?.steamAppId) steamAppID = String(resolveData.steamAppId);
      }
    } catch (e) {
      console.error("Failed to resolve Steam App ID", e);
    }
  }

  let steamDetails: any = null;
  let steamReviews: any = null;
  let igdbTags: string | null = null;
  
  if (steamAppID) {
    try {
      const [detailsRes, reviewsRes] = await Promise.all([
        fetch(`/api/steam/appdetails/${steamAppID}`),
        fetch(`/api/steam/appreviews/${steamAppID}`)
      ]);
      
      const detailsData = await detailsRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (detailsData && detailsData[steamAppID] && detailsData[steamAppID].success) {
        steamDetails = detailsData[steamAppID].data;
      }

      const reviewsData = await reviewsRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (reviewsData && reviewsData.success && reviewsData.query_summary) {
        steamReviews = reviewsData.query_summary;
      }
    } catch (e) {
      console.error("Failed to fetch Steam data", e);
    }
  }

  try {
    const tagsRes = await fetch(
      `/api/tags?title=${encodeURIComponent(gameTitle)}&platform=${steamAppID ? 'steam' : 'other'}&external_id=${steamAppID || ''}`
    );
    if (tagsRes.ok) {
      const tagsData = await tagsRes.json().catch(() => ({}));
      if (tagsData?.tags) igdbTags = tagsData.tags;
    }
  } catch (e) {
    console.error("Failed to fetch tags", e);
  }

  // Fetch high-quality artwork from SteamgridDB (by Steam ID if available, otherwise by title)
  let sgdbArtwork: { artwork?: string, banner?: string, logo?: string, horizontal_grid?: string } = {};
  if (steamAppID) {
    sgdbArtwork = await fetchSteamgridDBArtwork(steamAppID);
  }
  // If Steam ID lookup yielded no artwork (or there's no Steam ID), search SGDB by title
  if (!sgdbArtwork.artwork && !sgdbArtwork.banner) {
    try {
      const r = await fetch(`/api/steamgriddb/artwork-by-name/${encodeURIComponent(gameTitle)}`);
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        if (d.artwork || d.banner) sgdbArtwork = { ...d, ...sgdbArtwork }; // steam ID results take priority
      }
    } catch { /* ignore */ }
  }

  // IGDB fallback for description/genre/release_date when Steam has no data
  let igdbMeta: { description?: string, genre?: string, release_date?: string, metacritic?: number } = {};
  if (!steamDetails) {
    try {
      const igdbRes = await fetch(`/api/igdb/search?title=${encodeURIComponent(gameTitle)}`);
      if (igdbRes.ok) {
        const d = await igdbRes.json().catch(() => ({}));
        if (d.description) igdbMeta.description = d.description;
        if (d.genre) igdbMeta.genre = d.genre;
        if (d.release_date) igdbMeta.release_date = d.release_date;
        if (d.metacritic) igdbMeta.metacritic = d.metacritic;
        // Also use IGDB tags if the SteamSpy pipeline returned nothing
        if (d.tags && !igdbTags) igdbTags = d.tags;
      }
    } catch { /* ignore */ }
  }

  // Construct GameInfo without Gemini
  const title = steamDetails?.name || cheapSharkTitle || gameTitle;
  const description = steamDetails?.short_description?.replace(/<[^>]*>?/gm, '') || igdbMeta.description || "No description available.";
  const genre = steamDetails?.genres?.[0]?.description || igdbMeta.genre || "Unknown";
  const release_date = steamDetails?.release_date?.date || igdbMeta.release_date || "Unknown";
  const metacritic = steamDetails?.metacritic?.score || (igdbMeta as any).metacritic || null;
  
  let steam_rating = null;
  if (steamReviews && steamReviews.review_score_desc) {
    let ratingStr = steamReviews.review_score_desc;
    if (steamReviews.total_reviews > 0) {
      const percent = Math.round((steamReviews.total_positive / steamReviews.total_reviews) * 100);
      ratingStr += ` (${percent}%)`;
    }
    steam_rating = ratingStr;
  }

  const tags = igdbTags || null;

  // Check if game is on Game Pass
  let game_pass = false;
  try {
    const gpRes = await fetch(`/api/gamepass/check?title=${encodeURIComponent(title)}`);
    if (gpRes.ok) {
      const gpData = await gpRes.json();
      game_pass = gpData.game_pass === true;
    }
  } catch (e) {
    console.error('Game Pass check failed', e);
  }

  const formattedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const allkeyshop_url = allkeyshopUrlOverride || `https://www.allkeyshop.com/blog/buy-${formattedTitle}-cd-key-compare-prices/`;

  const lowest_price = cheapSharkPrice && parseFloat(cheapSharkPrice) > 0
    ? `£${parseFloat(cheapSharkPrice).toFixed(2)}`
    : null;
  const steam_url = steamAppID ? `https://store.steampowered.com/app/${steamAppID}/` : '';
  
  const artwork = sgdbArtwork.artwork || (steamAppID ? `https://shared.steamstatic.com/store_item_assets/steam/apps/${steamAppID}/library_capsule_2x.jpg` : `https://picsum.photos/seed/${formattedTitle}/600/900`);
  const banner = sgdbArtwork.banner || (steamAppID ? `https://shared.steamstatic.com/store_item_assets/steam/apps/${steamAppID}/library_hero.jpg` : `https://picsum.photos/seed/${formattedTitle}-banner/1920/1080`);
  const horizontal_grid = sgdbArtwork.horizontal_grid || (steamAppID ? `https://shared.steamstatic.com/store_item_assets/steam/apps/${steamAppID}/header.jpg` : `https://picsum.photos/seed/${formattedTitle}-grid/920/430`);
  const logo = sgdbArtwork.logo || undefined;

  return {
    title,
    artwork,
    banner,
    horizontal_grid,
    logo,
    genre,
    description,
    steam_url,
    game_pass,
    allkeyshop_url,
    lowest_price,
    release_date,
    metacritic,
    steam_rating,
    tags
  };
}
