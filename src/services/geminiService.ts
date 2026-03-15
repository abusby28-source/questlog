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

  // 1. Try Steam Search
  try {
    const steamRes = await fetch(`/api/search-steam?q=${encodeURIComponent(query)}`);
    if (steamRes.ok) {
      const steamData = await steamRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (steamData.items && steamData.items.length > 0) {
        return steamData.items.map((item: any) => ({
          title: item.name,
          platform: 'Steam',
          thumb: item.tiny_image,
          steamAppID: item.id.toString()
        }));
      }
    }
  } catch (e) {
    console.error("Steam search failed", e);
  }

  // 2. Fallback to CheapShark Search
  try {
    const csRes = await fetch(`/api/cheapshark/search?title=${encodeURIComponent(query)}`);
    if (csRes.ok) {
      const csData = await csRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (csData && csData.length > 0) {
        return csData.slice(0, 5).map((item: any) => ({
          title: item.external,
          platform: 'PC',
          thumb: item.thumb,
          steamAppID: item.steamAppID
        }));
      }
    }
  } catch (e) {
    console.error("CheapShark search failed", e);
  }

  return [];
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
        const official = gridData.data.find((g: any) => g.style === 'official');
        artwork = official ? official.url : gridData.data[0].url;
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
        const horizontal = logoData.data.find((l: any) => l.style === 'official' || l.width > l.height);
        logo = horizontal ? horizontal.url : logoData.data[0].url;
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
      model: "gemini-3.1-flash-lite-preview",
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
  let priceAlreadyGBP = false; // true when price came from ITAD (already in GBP)

  // Fetch lowest price from IsThereAnyDeal
  try {
    const itadRes = await fetch(`/api/itad/price?title=${encodeURIComponent(gameTitle)}`);
    if (itadRes.ok) {
      const itadData = await itadRes.json();
      if (itadData.price) { cheapSharkPrice = itadData.price; priceAlreadyGBP = true; } // already in GBP
      if (itadData.steamAppID && !steamAppID) steamAppID = itadData.steamAppID;
    }
  } catch (e) {
    console.error('ITAD price fetch failed', e);
  }

  // Fallback: CheapShark if ITAD returned nothing
  if (!cheapSharkPrice) try {
    const csResponse2 = await fetch(`/api/cheapshark/search?title=${encodeURIComponent(gameTitle)}`);
    const csData2 = await csResponse2.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
    if (csData2 && csData2.length > 0) {
      const csGame = csData2[0];
      cheapSharkTitle = csGame.external;
      if (!steamAppID && csGame.steamAppID) steamAppID = csGame.steamAppID;

      // Use the deals endpoint (via backend proxy) to get the real current lowest price
      if (csGame.gameID) {
        try {
          const dealsRes = await fetch(`/api/cheapshark/deals?gameID=${csGame.gameID}`);
          if (dealsRes.ok) {
            const deals = await dealsRes.json();
            if (deals && deals.length > 0) {
              cheapSharkPrice = deals[0].salePrice; // USD string e.g. "5.99"
            }
          }
        } catch {}
      }
      // Fallback to cheapest field if deals endpoint failed
      if (!cheapSharkPrice) cheapSharkPrice = csGame.cheapest;
    }
  } catch (e) {
    console.error("Failed to fetch from CheapShark", e);
  }

  // Fetch live USD→GBP exchange rate, fall back to 0.79 if unavailable
  let usdToGbp = 0.79;
  try {
    const fxRes = await fetch('https://open.er-api.com/v6/latest/USD');
    if (fxRes.ok) {
      const fxData = await fxRes.json();
      if (fxData?.rates?.GBP) usdToGbp = fxData.rates.GBP;
    }
  } catch {}

  // Try to get Steam App ID if still not known
  if (!steamAppID) {
    try {
      const csResponse = await fetch(`/api/search-steam?q=${encodeURIComponent(gameTitle)}`);
      const csData = await csResponse.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (csData && csData.items && csData.items.length > 0) {
        const match = csData.items.find((i: any) => i.name.toLowerCase() === gameTitle.toLowerCase()) || csData.items[0];
        steamAppID = match.id.toString();
        if (!cheapSharkTitle) cheapSharkTitle = match.name;
      }
    } catch (e) {
      console.error("Failed to fetch from Steam Search", e);
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
    const igdbRes = await fetch(`/api/igdb/search?title=${encodeURIComponent(gameTitle)}`);
    if (igdbRes.ok) {
      const igdbData = await igdbRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (igdbData && igdbData.tags) {
        igdbTags = igdbData.tags;
      }
    }
  } catch (e) {
    console.error("Failed to fetch IGDB tags", e);
  }

  // Fetch high-quality artwork from SteamgridDB
  let sgdbArtwork: { artwork?: string, banner?: string, logo?: string, horizontal_grid?: string } = {};
  if (steamAppID) {
    sgdbArtwork = await fetchSteamgridDBArtwork(steamAppID);
  }

  // Construct GameInfo without Gemini
  const title = steamDetails?.name || cheapSharkTitle || gameTitle;
  const description = steamDetails?.short_description?.replace(/<[^>]*>?/gm, '') || "No description available.";
  const genre = steamDetails?.genres?.[0]?.description || "Unknown";
  const release_date = steamDetails?.release_date?.date || "Unknown";
  const metacritic = steamDetails?.metacritic?.score || null;
  
  let steam_rating = null;
  if (steamReviews && steamReviews.review_score_desc) {
    let ratingStr = steamReviews.review_score_desc;
    if (steamReviews.total_reviews > 0) {
      const percent = Math.round((steamReviews.total_positive / steamReviews.total_reviews) * 100);
      ratingStr += ` (${percent}%)`;
    }
    steam_rating = ratingStr;
  }

  const tags = igdbTags || "Action, Adventure";
  const game_pass = false; // Default to false without Gemini
  
  const formattedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const allkeyshop_url = `https://www.allkeyshop.com/blog/buy-${formattedTitle}-cd-key-compare-prices/`;
  
  const lowest_price = cheapSharkPrice && parseFloat(cheapSharkPrice) > 0
    ? (priceAlreadyGBP ? `£${parseFloat(cheapSharkPrice).toFixed(2)}` : `£${(parseFloat(cheapSharkPrice) * usdToGbp).toFixed(2)}`)
    : null;
  const steam_url = steamAppID ? `https://store.steampowered.com/app/${steamAppID}/` : `https://store.steampowered.com/search/?term=${encodeURIComponent(title)}`;
  
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
