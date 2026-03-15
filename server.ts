import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, "games.db") : "games.db";
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
const JWT_SECRET = process.env.JWT_SECRET || "questlog-super-secret-key-123";

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    steam_id TEXT,
    xbox_id TEXT,
    xbox_refresh_token TEXT,
    discord_id TEXT,
    avatar TEXT,
    online_status TEXT DEFAULT 'offline',
    current_game TEXT
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS group_members (
    group_id INTEGER,
    user_id INTEGER,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artwork TEXT,
    banner TEXT,
    horizontal_grid TEXT,
    genre TEXT,
    tags TEXT,
    description TEXT,
    steam_url TEXT,
    game_pass BOOLEAN,
    allkeyshop_url TEXT,
    lowest_price TEXT,
    status TEXT DEFAULT 'to-play',
    list_type TEXT DEFAULT 'private',
    release_date TEXT,
    metacritic INTEGER,
    steam_rating TEXT,
    user_id INTEGER,
    group_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS launcher_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artwork TEXT,
    banner TEXT,
    horizontal_grid TEXT,
    platform TEXT, -- 'steam', 'xbox', 'local'
    external_id TEXT, -- steam appid, etc.
    launch_path TEXT,
    logo TEXT,
    genre TEXT,
    playtime INTEGER DEFAULT 0,
    achievements TEXT,
    description TEXT,
    tags TEXT,
    release_date TEXT,
    installed BOOLEAN DEFAULT 1,
    user_id INTEGER,
    last_played DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_launcher_unique ON launcher_games(platform, external_id, user_id);

  CREATE TABLE IF NOT EXISTS playtime_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    game_id INTEGER,
    playtime_minutes INTEGER,
    date DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES launcher_games(id) ON DELETE CASCADE
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_playtime_daily ON playtime_logs(user_id, game_id, date);
`);

// Migration for existing databases to ensure FK constraints and ON DELETE CASCADE
db.pragma("foreign_keys = OFF");
try {
  db.transaction(() => {
    // 1. Fix group_members if missing constraints
    const gmSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='group_members'").get();
    if (gmSchema && !gmSchema.sql.includes("ON DELETE CASCADE")) {
      console.log("Migrating group_members table...");
      db.exec(`
        CREATE TABLE group_members_new (
          group_id INTEGER,
          user_id INTEGER,
          PRIMARY KEY (group_id, user_id),
          FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      db.exec("INSERT OR IGNORE INTO group_members_new SELECT * FROM group_members");
      db.exec("DROP TABLE group_members");
      db.exec("ALTER TABLE group_members_new RENAME TO group_members");
    }

    // 2. Add logo, playtime, achievements to launcher_games if missing
    const launcherSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='launcher_games'").get();
    if (launcherSchema && !launcherSchema.sql.includes("logo")) {
      console.log("Migrating launcher_games table...");
      db.exec("ALTER TABLE launcher_games ADD COLUMN logo TEXT");
      db.exec("ALTER TABLE launcher_games ADD COLUMN genre TEXT");
      db.exec("ALTER TABLE launcher_games ADD COLUMN playtime INTEGER DEFAULT 0");
      db.exec("ALTER TABLE launcher_games ADD COLUMN achievements TEXT");
    }
    if (launcherSchema && !launcherSchema.sql.includes("genre") && launcherSchema.sql.includes("logo")) {
      db.exec("ALTER TABLE launcher_games ADD COLUMN genre TEXT");
    }
    if (launcherSchema && !launcherSchema.sql.includes("description")) {
      db.exec("ALTER TABLE launcher_games ADD COLUMN description TEXT");
      db.exec("ALTER TABLE launcher_games ADD COLUMN tags TEXT");
    }
    if (launcherSchema && !launcherSchema.sql.includes("installed")) {
      db.exec("ALTER TABLE launcher_games ADD COLUMN installed BOOLEAN DEFAULT 1");
    }
    if (launcherSchema && !launcherSchema.sql.includes("hidden")) {
      db.exec("ALTER TABLE launcher_games ADD COLUMN hidden BOOLEAN DEFAULT 0");
    }
    if (launcherSchema && !launcherSchema.sql.includes("release_date")) {
      db.exec("ALTER TABLE launcher_games ADD COLUMN release_date TEXT");
    }
    if (launcherSchema && !launcherSchema.sql.includes("horizontal_grid")) {
      db.exec("ALTER TABLE launcher_games ADD COLUMN horizontal_grid TEXT");
    }
    const gamesSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='games'").get();
    if (gamesSchema && !gamesSchema.sql.includes("horizontal_grid")) {
      db.exec("ALTER TABLE games ADD COLUMN horizontal_grid TEXT");
    }
    
    // Clear bad horizontal_grid data from previous bug, but only once
    try {
      const migrationSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='migrations'").get();
      if (!migrationSchema) {
        db.exec("CREATE TABLE migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE)");
      }
      const hasCleared = db.prepare("SELECT * FROM migrations WHERE name = 'clear_horizontal_grid'").get();
      if (!hasCleared) {
        db.exec("UPDATE games SET horizontal_grid = NULL");
        db.exec("UPDATE launcher_games SET horizontal_grid = NULL");
        db.exec("INSERT INTO migrations (name) VALUES ('clear_horizontal_grid')");
      }

      // Fix Xbox games incorrectly inserted with hidden=1 by old sync code
      const hasFixedXboxHidden = db.prepare("SELECT * FROM migrations WHERE name = 'fix_xbox_hidden'").get();
      if (!hasFixedXboxHidden) {
        db.exec("UPDATE launcher_games SET hidden = 0 WHERE platform = 'xbox' AND hidden = 1");
        db.exec("INSERT INTO migrations (name) VALUES ('fix_xbox_hidden')");
        console.log("Migration: unhid all incorrectly hidden Xbox games");
      }
    } catch(e) {}

    // 3. Fix games if missing constraints or columns
    if (gamesSchema && (!gamesSchema.sql.includes("REFERENCES users(id)") || !gamesSchema.sql.includes("release_date") || !gamesSchema.sql.includes("metacritic") || !gamesSchema.sql.includes("tags") || !gamesSchema.sql.includes("banner") || !gamesSchema.sql.includes("logo"))) {
      console.log("Migrating games table...");
      // Ensure columns exist before copying
      try { db.exec("ALTER TABLE games ADD COLUMN release_date TEXT"); } catch(e) {}
      try { db.exec("ALTER TABLE games ADD COLUMN metacritic INTEGER"); } catch(e) {}
      try { db.exec("ALTER TABLE games ADD COLUMN steam_rating TEXT"); } catch(e) {}
      try { db.exec("ALTER TABLE games ADD COLUMN user_id INTEGER"); } catch(e) {}
      try { db.exec("ALTER TABLE games ADD COLUMN group_id INTEGER"); } catch(e) {}
      try { db.exec("ALTER TABLE games ADD COLUMN tags TEXT"); } catch(e) {}
      try { db.exec("ALTER TABLE games ADD COLUMN banner TEXT"); } catch(e) {}
      try { db.exec("ALTER TABLE games ADD COLUMN logo TEXT"); } catch(e) {}

      db.exec(`
        CREATE TABLE games_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          artwork TEXT,
          banner TEXT,
          logo TEXT,
          genre TEXT,
          tags TEXT,
          description TEXT,
          steam_url TEXT,
          game_pass BOOLEAN,
          allkeyshop_url TEXT,
          lowest_price TEXT,
          status TEXT DEFAULT 'to-play',
          list_type TEXT DEFAULT 'private',
          release_date TEXT,
          metacritic INTEGER,
          steam_rating TEXT,
          user_id INTEGER,
          group_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
        )
      `);
      
      // Get current columns to build dynamic insert
      const tableInfo = db.prepare("PRAGMA table_info(games)").all();
      const columns = tableInfo.map(c => c.name).filter(name => 
        ['id', 'title', 'artwork', 'banner', 'logo', 'genre', 'tags', 'description', 'steam_url', 'game_pass', 'allkeyshop_url', 'lowest_price', 'status', 'list_type', 'release_date', 'metacritic', 'steam_rating', 'user_id', 'group_id', 'created_at'].includes(name)
      );
      const colList = columns.join(', ');
      
      db.exec(`
        INSERT INTO games_new (${colList})
        SELECT ${colList} FROM games
      `);
      db.exec("DROP TABLE games");
      db.exec("ALTER TABLE games_new RENAME TO games");
    }

    // 4. Add missing columns to users table
    const usersInfo = db.prepare("PRAGMA table_info(users)").all();
    const userColumns = usersInfo.map(c => c.name);
    
    if (!userColumns.includes('steam_id')) {
      console.log("Adding steam_id to users...");
      db.exec("ALTER TABLE users ADD COLUMN steam_id TEXT");
    }
    if (!userColumns.includes('xbox_id')) {
      console.log("Adding xbox_id to users...");
      db.exec("ALTER TABLE users ADD COLUMN xbox_id TEXT");
    }
    if (!userColumns.includes('xbox_refresh_token')) {
      console.log("Adding xbox_refresh_token to users...");
      db.exec("ALTER TABLE users ADD COLUMN xbox_refresh_token TEXT");
    }
    if (!userColumns.includes('discord_id')) {
      console.log("Adding discord_id to users...");
      db.exec("ALTER TABLE users ADD COLUMN discord_id TEXT");
    }
    if (!userColumns.includes('avatar')) {
      console.log("Adding avatar to users...");
      db.exec("ALTER TABLE users ADD COLUMN avatar TEXT");
    }
    if (!userColumns.includes('online_status')) {
      console.log("Adding online_status to users...");
      db.exec("ALTER TABLE users ADD COLUMN online_status TEXT DEFAULT 'offline'");
    }
    if (!userColumns.includes('current_game')) {
      console.log("Adding current_game to users...");
      db.exec("ALTER TABLE users ADD COLUMN current_game TEXT");
    }
  })();
} catch (e) {
  console.error("Migration failed:", e);
}
db.pragma("foreign_keys = ON");

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    
    // Verify user still exists in DB and get full profile
    const dbUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
    if (!dbUser) return res.sendStatus(403);
    
    // Don't send password in req.user
    const { password, ...userWithoutPassword } = dbUser;
    req.user = userWithoutPassword;
    next();
  });
};

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, hashedPassword);
      const token = jwt.sign({ id: info.lastInsertRowid, username }, JWT_SECRET);
      res.json({ token, user: { id: info.lastInsertRowid, username } });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: "Username already exists" });
      } else {
        res.status(500).json({ error: "Registration failed" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req, res) => {
    res.json(req.user);
  });

  // Steam API Proxy
  app.get("/api/search-steam", async (req, res) => {
    try {
      const q = String(req.query.q);
      if (!q) return res.json({ items: [] });
      const response = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`);
      const data = await response.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to search Steam" });
    }
  });

  app.get("/api/steam/appdetails/:appid", async (req, res) => {
    try {
      const { appid } = req.params;
      const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&l=english`);
      const data = await response.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Steam app details" });
    }
  });

  app.get("/api/steam/appreviews/:appid", async (req, res) => {
    try {
      const { appid } = req.params;
      const response = await fetch(`https://store.steampowered.com/appreviews/${appid}?json=1&language=all&purchase_type=all&num_per_page=0`);
      const data = await response.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Steam app reviews" });
    }
  });

  app.get("/api/steamspy/:appid", async (req, res) => {
    try {
      const { appid } = req.params;
      const response = await fetch(`https://steamspy.com/api.php?request=appdetails&appid=${appid}`);
      const data = await response.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch SteamSpy data" });
    }
  });

let igdbToken = "";
let igdbTokenExpiry = 0;

async function getIgdbToken() {
  if (igdbToken && Date.now() < igdbTokenExpiry) return igdbToken;
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  
  try {
    const res = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, { method: 'POST' });
    const data = await res.json();
    if (data.access_token) {
      igdbToken = data.access_token;
      igdbTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
      return igdbToken;
    }
  } catch (e) {
    console.error("Failed to get IGDB token", e);
  }
  return null;
}

  app.get("/api/igdb/search", async (req, res) => {
    try {
      const title = String(req.query.title);
      const clientId = process.env.IGDB_CLIENT_ID;
      const token = await getIgdbToken();
      if (!clientId || !token) return res.json({ tags: null, description: null, genre: null });
      
      const response = await fetch(`https://api.igdb.com/v4/games`, {
        method: 'POST',
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: `search "${title.replace(/"/g, '\\"')}"; fields name,genres.name,themes.name,summary; limit 1;`
      });
      const data = await response.json();
      
      if (data && data.length > 0) {
        const game = data[0];
        const tags = [];
        if (game.genres) tags.push(...game.genres.map((g) => g.name));
        if (game.themes) tags.push(...game.themes.map((t) => t.name));
        res.json({ 
          tags: tags.length > 0 ? tags.join(', ') : null,
          description: game.summary || null,
          genre: game.genres && game.genres.length > 0 ? game.genres[0].name : null
        });
      } else {
        res.json({ tags: null, description: null, genre: null });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch IGDB data" });
    }
  });

  app.get("/api/cheapshark/search", async (req, res) => {
    try {
      const title = String(req.query.title);
      const response = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(title)}&limit=1`);
      const data = await response.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CheapShark data" });
    }
  });

  // Proxy CheapShark deals endpoint to avoid CORS and fetch accurate lowest prices
  app.get("/api/cheapshark/deals", async (req, res) => {
    try {
      const gameID = String(req.query.gameID);
      const response = await fetch(
        `https://www.cheapshark.com/api/1.0/deals?gameID=${encodeURIComponent(gameID)}&sortBy=Price&pageSize=1`
      );
      const data = await response.text().then(t => t ? JSON.parse(t) : []).catch(() => []);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CheapShark deals" });
    }
  });

  // IsThereAnyDeal — lowest GBP price for a game title
  app.get("/api/itad/price", async (req, res) => {
    const title = String(req.query.title);
    if (!title) return res.status(400).json({ error: "title required" });
    const ITAD_KEY = process.env.ITAD_API_KEY || "30ab4c2d5ad59759af9a12f15dd970c2630ebe06";
    try {
      // Step 1: search for game to get ITAD id
      const searchRes = await fetch(
        `https://api.isthereanydeal.com/games/search/v1?title=${encodeURIComponent(title)}&limit=1`,
        { headers: { Authorization: `Bearer ${ITAD_KEY}` } }
      );
      if (!searchRes.ok) return res.json({ price: null });
      const searchData = await searchRes.json();
      if (!searchData || searchData.length === 0) return res.json({ price: null });

      const gameId = searchData[0].id;
      const steamAppID = searchData[0].urls?.buy?.match(/app\/(\d+)/)?.[1] || null;

      // Step 2: fetch current lowest price in GBP
      const priceRes = await fetch(
        `https://api.isthereanydeal.com/games/prices/v3?country=GB`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${ITAD_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify([gameId])
        }
      );
      if (!priceRes.ok) return res.json({ price: null, steamAppID });
      const priceData = await priceRes.json();
      if (!priceData || priceData.length === 0) return res.json({ price: null, steamAppID });

      // Find the lowest current price across all deals
      const deals = priceData[0]?.deals || [];
      if (deals.length === 0) return res.json({ price: null, steamAppID });
      const lowest = deals.reduce((min, d) => d.price.amount < min.price.amount ? d : min, deals[0]);
      res.json({ price: lowest.price.amount.toFixed(2), steamAppID });
    } catch (e) {
      console.error("ITAD price error:", e);
      res.json({ price: null });
    }
  });

  app.get("/api/steam/library/:steamid", async (req, res) => {
    try {
      const { steamid } = req.params;
      const apiKey = process.env.STEAM_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Steam API Key not configured" });
      
      const response = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamid}&include_appinfo=1&format=json`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Steam API Error:", response.status, errorText);
        throw new Error(`Steam API failed with status ${response.status}`);
      }
      const data = await response.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Steam library" });
    }
  });

  app.get("/api/steamgriddb/search/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const apiKey = process.env.STEAMGRIDDB_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "SteamgridDB API Key not configured" });
      
      const response = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(name)}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to search SteamgridDB" });
    }
  });

  app.get("/api/steamgriddb/grids/steam/:appid", async (req, res) => {
    try {
      const { appid } = req.params;
      const orientation = req.query.orientation || 'vertical';
      const apiKey = process.env.STEAMGRIDDB_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "SteamgridDB API Key not configured" });
      
      let url = `https://www.steamgriddb.com/api/v2/grids/steam/${appid}`;
      if (orientation === 'horizontal') {
        url += `?dimensions=920x430,460x215`;
      } else {
        url += `?dimensions=600x900,342x482,660x930`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch grids from SteamgridDB" });
    }
  });

  app.get("/api/steamgriddb/heroes/steam/:appid", async (req, res) => {
    try {
      const { appid } = req.params;
      const apiKey = process.env.STEAMGRIDDB_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "SteamgridDB API Key not configured" });
      
      const response = await fetch(`https://www.steamgriddb.com/api/v2/heroes/steam/${appid}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch heroes from SteamgridDB" });
    }
  });

  app.get("/api/steamgriddb/logos/steam/:appid", async (req, res) => {
    try {
      const { appid } = req.params;
      const apiKey = process.env.STEAMGRIDDB_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "SteamgridDB API Key not configured" });
      
      const response = await fetch(`https://www.steamgriddb.com/api/v2/logos/steam/${appid}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logos from SteamgridDB" });
    }
  });

  // SteamgridDB Horizontal Grid (920x430) - Used for Homepage Scrollers
  app.get("/api/steamgriddb/horizontal/:appid", async (req, res) => {
    const { appid } = req.params;
    const { t, json } = req.query;
    try {
      const apiKey = process.env.STEAMGRIDDB_API_KEY;
      const cacheBust = t ? (t.toString().includes('?') ? `&t=${t}` : `?t=${t}`) : '';
      
      // Fallback to Steam's standard horizontal header
      const fallbackUrl = `https://shared.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;
      if (!apiKey) {
        if (json) return res.json({ url: fallbackUrl });
        return res.redirect(`${fallbackUrl}${cacheBust}`);
      }
      
      const response = await fetch(`https://www.steamgriddb.com/api/v2/grids/steam/${appid}?dimensions=920x430,460x215`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (data.success && data.data && data.data.length > 0) {
        const official = data.data.find((g) => g.style === 'official');
        const custom = data.data.find((g) => g.style === 'custom');
        const withLogo = data.data.find((g) => !g.notes?.toLowerCase().includes('no logo'));
        const selected = official || custom || withLogo || data.data[0];
        
        if (json) return res.json({ url: selected.url });
        
        const finalUrl = selected.url.includes('?') ? `${selected.url}&t=${t || Date.now()}` : `${selected.url}?t=${t || Date.now()}`;
        return res.redirect(finalUrl);
      }
      
      if (json) return res.json({ url: fallbackUrl });
      res.redirect(`${fallbackUrl}${cacheBust}`);
    } catch (error) {
      const fallbackUrl = `https://shared.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;
      if (json) return res.json({ url: fallbackUrl });
      res.redirect(fallbackUrl);
    }
  });

  // SteamgridDB Hero (1920x620) - Used for Detail View Banners
  app.get("/api/steamgriddb/hero/:appid", async (req, res) => {
    const { appid } = req.params;
    try {
      const apiKey = process.env.STEAMGRIDDB_API_KEY;
      // Fallback to Steam's library hero
      if (!apiKey) return res.redirect(`https://shared.steamstatic.com/store_item_assets/steam/apps/${appid}/library_hero.jpg`);
      
      const response = await fetch(`https://www.steamgriddb.com/api/v2/heroes/steam/${appid}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (data.success && data.data && data.data.length > 0) {
        const official = data.data.find((g) => g.style === 'official');
        return res.redirect(official ? official.url : data.data[0].url);
      }
      res.redirect(`https://shared.steamstatic.com/store_item_assets/steam/apps/${appid}/library_hero.jpg`);
    } catch (error) {
      res.redirect(`https://shared.steamstatic.com/store_item_assets/steam/apps/${appid}/library_hero.jpg`);
    }
  });

  app.get("/api/steamgriddb/hero-by-name/:name", async (req, res) => {
    const { name } = req.params;
    try {
      const apiKey = process.env.STEAMGRIDDB_API_KEY;
      if (!apiKey) return res.status(404).send('No API key');
      
      const searchRes = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(name)}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const searchData = await searchRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      
      if (searchData.success && searchData.data && searchData.data.length > 0) {
        const gameId = searchData.data[0].id;
        const heroRes = await fetch(`https://www.steamgriddb.com/api/v2/heroes/game/${gameId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const heroData = await heroRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
        if (heroData.success && heroData.data && heroData.data.length > 0) {
          const official = heroData.data.find((g) => g.style === 'official');
          return res.redirect(official ? official.url : heroData.data[0].url);
        }
      }
      res.status(404).send('Not found');
    } catch (error) {
      res.status(500).send('Error');
    }
  });

  // SteamgridDB Horizontal Grid by Name
  app.get("/api/steamgriddb/horizontal-by-name/:name", async (req, res) => {
    const { name } = req.params;
    const { t, json } = req.query;
    try {
      const apiKey = process.env.STEAMGRIDDB_API_KEY;
      const cacheBust = t ? (t.toString().includes('?') ? `&t=${t}` : `?t=${t}`) : '';
      if (!apiKey) return res.status(404).send('No API key');
      
      const searchRes = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(name)}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const searchData = await searchRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      
      if (searchData.success && searchData.data && searchData.data.length > 0) {
        const gameId = searchData.data[0].id;
        const gridRes = await fetch(`https://www.steamgriddb.com/api/v2/grids/game/${gameId}?dimensions=920x430,460x215`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const gridData = await gridRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
        if (gridData.success && gridData.data && gridData.data.length > 0) {
          const official = gridData.data.find((g) => g.style === 'official');
          const custom = gridData.data.find((g) => g.style === 'custom');
          const withLogo = gridData.data.find((g) => !g.notes?.toLowerCase().includes('no logo'));
          
          const selected = official || custom || withLogo || gridData.data[0];
          if (json) return res.json({ url: selected.url });
          
          const finalUrl = selected.url.includes('?') ? `${selected.url}&t=${t || Date.now()}` : `${selected.url}?t=${t || Date.now()}`;
          return res.redirect(finalUrl);
        }
      }
      res.status(404).send('Not found');
    } catch (error) {
      res.status(500).send('Error');
    }
  });

  // Launcher Routes
  app.get("/api/launcher/games", authenticateToken, (req, res) => {
    try {
      const games = db.prepare("SELECT * FROM launcher_games WHERE user_id = ? AND hidden = 0 ORDER BY last_played DESC, created_at DESC").all(req.user.id);
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch launcher games" });
    }
  });

  app.get("/api/launcher/games/hidden", authenticateToken, (req, res) => {
    try {
      const games = db.prepare("SELECT * FROM launcher_games WHERE user_id = ? AND hidden = 1 ORDER BY title ASC").all(req.user.id);
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hidden games" });
    }
  });

  app.post("/api/launcher/games/:id/hide", authenticateToken, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("UPDATE launcher_games SET hidden = 1 WHERE id = ? AND user_id = ?").run(id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to hide game" });
    }
  });

  app.post("/api/launcher/games/:id/unhide", authenticateToken, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("UPDATE launcher_games SET hidden = 0 WHERE id = ? AND user_id = ?").run(id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unhide game" });
    }
  });

  // Xbox OAuth Routes
  app.get("/api/auth/xbox/url", authenticateToken, (req, res) => {
    const clientId = process.env.XBOX_CLIENT_ID;
    const clientRedirectUri = String(req.query.redirectUri);
    
    // Determine the redirect URI: priority to frontend-provided, then APP_URL, then request-based
    let redirectUri = clientRedirectUri;
    if (!redirectUri) {
      if (process.env.APP_URL) {
        const baseUrl = process.env.APP_URL.endsWith('/') ? process.env.APP_URL.slice(0, -1) : process.env.APP_URL;
        redirectUri = `${baseUrl}/auth/xbox/callback`;
      } else {
        redirectUri = `${req.protocol}://${req.get('host')}/auth/xbox/callback`;
      }
    }
    
    console.log(`Xbox Auth URL Request: clientId=${clientId}, redirectUri=${redirectUri}`);
    
    if (!clientId) return res.status(500).json({ error: "Xbox Client ID not configured" });
    
    const stateObj = {
      userId: req.user.id,
      redirectUri: redirectUri
    };
    
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      prompt: 'select_account',
      scope: 'XboxLive.signin offline_access',
      redirect_uri: redirectUri,
      state: Buffer.from(JSON.stringify(stateObj)).toString('base64')
    });
    
    const authUrl = `https://login.live.com/oauth20_authorize.srf?${params.toString()}`;
    console.log(`Generated Xbox Auth URL: ${authUrl}`);
    res.json({ url: authUrl });
  });

  app.get("/auth/xbox/callback", async (req, res) => {
    const { code, state, error, error_description } = req.query;
    const clientId = process.env.XBOX_CLIENT_ID;
    
    if (error) {
      console.error("Xbox Callback Error from Microsoft:", error, error_description);
      return res.send(`<html><body><script type='text/javascript' nonce='gFqCqYoR+22LWEeRQHpOJA==' src='https://aistudio.google.com/Wz9yjaMT5t4oILyboZJEilSU4W2-V5yoQ_QuFxp1nRaxuiRhVFsPXnCeyfRu8LXHsWcv1i3che9xC0I00cXyjJN2T4o7b7gc-srU60HsIhBQi7ZKPjxoMKh3AZGuQdZKcW62GtJV9ffrRa5pF7ZwXd73gwzFgFFcV_P3oTGnpE6ohOwW_XbZkACiyJL7o0Z24BmwYEEKX0zVdOUDHEyVFnbOJBJHjYNymeHcnlmtlGiwCkW-1C0hE6NHMSwKaQu7J94ZqJMZn50Irb__HLqnFkpPk5KJrVj8GoEcbArRK_duMOKWh9S7Rd7LTCP-B1YH0lzbSzFJLc2xmFTvsqrzuZXEPeIKP-epJoXrNvb8BHZD-_saZoeekAJI26k2f73bbHa1XC65-sTNBpkr9YIquEtCHS1PLE-HFFdorm4iHegkHdydjigTYdfh8GR3MKir3IRlaFp1sJHV8yYIC2R4HrRYCemptfPE31OV4D8egXkdcaXYHtudFM49XxpDI_QTFeHxIGRptX09mpQThN_n9fBIBD6ch3oHHjIhpc8gWsAOcySpKsysKxY8DQJYs5jazD_Yqtq3pXYbG8HB2r8jXRdV8F7Nh_cYAcK2LJpKaDBciO2MSw'></script><script type="text/javascript" nonce="Fsd7MUR0FfgVN17Ma5tn2g==" src="https://aistudio.google.com/OlLoubZkq-Jgr4GVmxRUtc-Rv9Sq7P-9mWl5u0z4HTRZ9wCzmZmdreAkj3FUvx8hqKr82JD0KsMZYjAhIiTy99kzQhtORiqqs33uLwpAktzvJaVkjAMnDJPAydFtv2I5s_lkmImJLP2Sv8k85lSrAUaDo_XjJhgY6R1oQBEiyJDtx3furrvQSgupkyVJ1LbiRvoaPJEOK3ZKt6rALma19xSbfPSTQZ9H71A5qryLqHjRd8bU-_rlB2VD1q_FOzBJdKcU9QSYQloS6NZEWuwDR1wyiGKmYnY3_n78GBkU_524sCT2mLYvFOXU5mKwtN0up6N5baYIJPfBii8JQ0T6SMDAz9ohdMN-3efT0vUiN-GkSsA_yoziMXPxnAFNlAwM3EQppcCrQ5dk9mICjPBxx5sIQYu57ZFt-osmhErFbGQQNLarFL0-nJnvjmzcU_viE0ea8hNhwG_XqbyLQllZWFd0z3QGSU-DgO8xKGDfe0Jjc20KAwxzJ-s6cykfloZSdtS2MVy-Y2QoPuM3NItrNttchrSccRdIXvLV0hTcv8zchZFd-3oePNMppX7QabMAm75BpovXNlPopuECayVC3FBWR-aFQz37rCe67p3XfVCLllrSsA"></script><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'XBOX_AUTH_ERROR', error: ${JSON.stringify(error_description || error)} }, '*');
          window.close();
        } else {
          document.body.innerHTML = 'Authentication failed: ' + ${JSON.stringify(error_description || error)};
        }
      </script></body></html>`);
    }
    
    if (!code || !clientId || !state) {
      console.error("Xbox Callback Error: Missing parameters", { code: !!code, clientId: !!clientId, state: !!state });
      return res.send(`<html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'XBOX_AUTH_ERROR', error: 'Missing code, config or state' }, '*');
          window.close();
        } else {
          document.body.innerHTML = 'Authentication failed: Missing parameters';
        }
      </script></body></html>`);
    }

    let stateObj = {};
    try {
      stateObj = JSON.parse(Buffer.from(String(state), 'base64').toString('utf-8'));
    } catch (e) {
      console.error("Failed to parse state", e);
      return res.send(`<html><body><script>window.opener.postMessage({ type: 'XBOX_AUTH_ERROR', error: 'Invalid state parameter' }, '*'); window.close();</script></body></html>`);
    }

    const redirectUri = stateObj.redirectUri;
    console.log(`Xbox Callback: code received, using redirectUri from state: ${redirectUri}`);
    
    try {
      // 1. Exchange code for access token
      const tokenParams: Record<string, string> = {
        client_id: clientId,
        client_secret: process.env.XBOX_CLIENT_SECRET || '', // ADD THIS LINE
        code: String(code),
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      };

      let tokenRes = await fetch('https://login.live.com/oauth20_token.srf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(tokenParams)
      });
      
      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        console.error("Xbox Token Exchange Error:", tokenRes.status, errorText);
        
        throw new Error(`Xbox Token Exchange failed with status ${tokenRes.status}`);
      }
      
      const tokenData = await tokenRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (!tokenData.access_token) throw new Error("Failed to get access token");
      
      // 2. Authenticate with Xbox Live (User Token)
      const xblRes = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          Properties: {
            AuthMethod: 'RPS',
            SiteName: 'user.auth.xboxlive.com',
            RpsTicket: `d=${tokenData.access_token}`
          },
          RelyingParty: 'http://auth.xboxlive.com',
          TokenType: 'JWT'
        })
      });
      
      if (!xblRes.ok) {
        const errorText = await xblRes.text();
        console.error("Xbox User Auth Error:", xblRes.status, errorText);
        throw new Error(`Xbox User Auth failed with status ${xblRes.status}`);
      }
      
      const xblData = await xblRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (!xblData.Token) throw new Error("Failed to get XBL token");

      // 3. Get XSTS Token
      const xstsRes = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          Properties: {
            SandboxId: 'RETAIL',
            UserTokens: [xblData.Token]
          },
          RelyingParty: 'http://xboxlive.com',
          TokenType: 'JWT'
        })
      });
      
      if (!xstsRes.ok) {
        const errorText = await xstsRes.text();
        console.error("Xbox XSTS Auth Error:", xstsRes.status, errorText);
        
        let xerr = '';
        try {
          const errObj = JSON.parse(errorText);
          xerr = String(errObj.XErr || '');
        } catch(e) {}
        
        if (xerr === '2148916233') {
           throw new Error("This Microsoft account does not have an Xbox profile. Please create one at xbox.com.");
        } else if (xerr === '2148916238') {
           throw new Error("Child accounts are not supported. Please use an adult account.");
        }
        
        throw new Error(`Xbox XSTS Auth failed with status ${xstsRes.status} (XErr: ${xerr})`);
      }
      
      const xstsData = await xstsRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      if (!xstsData.Token) throw new Error("Failed to get XSTS token");
      
      const xstsToken = xstsData.Token;
      const xuid = xstsData.DisplayClaims?.xui?.[0]?.xid;
      const userHash = xstsData.DisplayClaims?.xui?.[0]?.uhs;
      const gamertag = xstsData.DisplayClaims?.xui?.[0]?.gtg;
      
      if (!xuid || !userHash) {
        throw new Error("Missing XUID or UserHash in XSTS response. The Xbox account might not be fully set up.");
      }
      
      console.log(`Xbox Auth Success: Logged in as ${gamertag || 'Unknown'} (XUID: ${xuid})`);

      // Update user with Xbox ID and Refresh Token
      db.prepare("UPDATE users SET xbox_id = ?, xbox_refresh_token = ? WHERE id = ?").run(xuid, tokenData.refresh_token, Number(stateObj.userId));
      
      // Send success message with tokens to parent window
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'XBOX_AUTH_SUCCESS', 
                  tokens: ${JSON.stringify({
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    xstsToken,
                    userHash,
                    xuid
                  })}
                }, '*');
                window.close();
              } else {
                document.body.innerHTML = "<h3>Authentication Successful</h3><p>However, the popup couldn't communicate with the main window. Please close this popup and try again, or check your browser's popup blocker settings.</p>";
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Xbox OAuth Error:", error);
      res.send(`<html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'XBOX_AUTH_ERROR', error: ${JSON.stringify(error.message)} }, '*');
          window.close();
        } else {
          document.body.innerHTML = 'Authentication failed: ' + ${JSON.stringify(error.message)};
        }
      </script></body></html>`);
    }
  });

  // Discord OAuth Routes
  app.get("/api/auth/discord/url", authenticateToken, (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientRedirectUri = String(req.query.redirectUri);
    
    let redirectUri = clientRedirectUri;
    if (!redirectUri) {
      if (process.env.APP_URL) {
        const baseUrl = process.env.APP_URL.endsWith('/') ? process.env.APP_URL.slice(0, -1) : process.env.APP_URL;
        redirectUri = `${baseUrl}/auth/discord/callback`;
      } else {
        redirectUri = `${req.protocol}://${req.get('host')}/auth/discord/callback`;
      }
    }
    
    if (!clientId) return res.status(500).json({ error: "Discord Client ID not configured" });
    
    const stateObj = {
      userId: req.user.id,
      redirectUri: redirectUri
    };
    
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: 'identify connections',
      redirect_uri: redirectUri,
      state: Buffer.from(JSON.stringify(stateObj)).toString('base64')
    });
    
    const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  app.get("/auth/discord/callback", async (req, res) => {
    const { code, state, error, error_description } = req.query;
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    
    if (error) {
      console.error("Discord Callback Error:", error, error_description);
      return res.send(`<html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'DISCORD_AUTH_ERROR', error: '${error_description || error}' }, '*');
          window.close();
        }
      </script></body></html>`);
    }
    
    if (!code || !state || !clientId || !clientSecret) {
      return res.status(400).send("Missing parameters or configuration");
    }
    
    try {
      const stateObj = JSON.parse(Buffer.from(String(state), 'base64').toString('utf8'));
      
      const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code: String(code),
          redirect_uri: stateObj.redirectUri
        })
      });
      
      if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
      const tokenData = await tokenRes.json();
      
      const userRes = await fetch('https://discord.com/api/users/@me', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });
      
      if (!userRes.ok) throw new Error(`User fetch failed: ${await userRes.text()}`);
      const userData = await userRes.json();
      
      db.prepare("UPDATE users SET discord_id = ? WHERE id = ?").run(userData.id, Number(stateObj.userId));
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'DISCORD_AUTH_SUCCESS', discordId: '${userData.id}' }, '*');
                window.close();
              } else {
                document.body.innerHTML = "<h3>Authentication Successful</h3><p>Please close this popup.</p>";
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Discord OAuth Error:", error);
      res.send(`<html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'DISCORD_AUTH_ERROR', error: ${JSON.stringify(error.message)} }, '*');
          window.close();
        }
      </script></body></html>`);
    }
  });

  app.post("/api/launcher/link-xbox", authenticateToken, async (req, res) => {
    const { xstsToken, userHash, xuid } = req.body;
    if (!xstsToken || !userHash || !xuid) return res.status(400).json({ error: "Missing XSTS token, user hash or XUID" });

    try {
      // Store Xbox credentials without syncing games - only use existing columns
      db.prepare(`
        UPDATE users 
        SET xbox_id = ?, xbox_refresh_token = ?
        WHERE id = ?
      `).run(xuid, xstsToken, req.user.id);

      res.json({ success: true });
    } catch (error) {
      console.error('Xbox link error:', error);
      res.status(500).json({ error: 'Failed to link Xbox account' });
    }
  });

  app.post("/api/launcher/link-xbox-refresh", authenticateToken, async (req, res) => {
    const { refreshToken, xuid } = req.body;
    if (!refreshToken || !xuid) return res.status(400).json({ error: "Missing refresh token or XUID" });

    try {
      // Store Xbox refresh token properly
      db.prepare(`
        UPDATE users 
        SET xbox_id = ?, xbox_refresh_token = ?
        WHERE id = ?
      `).run(xuid, refreshToken, req.user.id);

      res.json({ success: true });
    } catch (error) {
      console.error('Xbox refresh token link error:', error);
      res.status(500).json({ error: 'Failed to link Xbox account' });
    }
  });

  app.post("/api/launcher/sync-xbox-local", authenticateToken, async (req, res) => {
    const { xstsToken, userHash, xuid } = req.body;
    if (!xstsToken || !userHash || !xuid) return res.status(400).json({ error: "Missing XSTS token, user hash or XUID" });

    const makeHeaders = (contractVersion = '2') => ({
      'x-xbl-contract-version': contractVersion,
      'Authorization': `XBL3.0 x=${userHash};${xstsToken}`,
      'Accept-Language': 'en-US',
      'Accept': 'application/json'
    });

    // Helper: fetch all pages — correctly handles URLs with/without existing query params
    const fetchAllPages = async (baseUrl, listKey, contractVersion = '2'): Promise<any[]> => {
      const results = [];
      let cursor: string | null = null;
      let page = 0;
      while (page < 20) {
        try {
          const sep = baseUrl.includes('?') ? '&' : '?';
          const url = cursor ? `${baseUrl}${sep}continuationToken=${encodeURIComponent(cursor)}` : baseUrl;
          const r = await fetch(url, { headers: makeHeaders(contractVersion) });
          if (!r.ok) {
            console.warn(`Xbox API ${url} → ${r.status}: ${await r.text().catch(() => '')}`);
            break;
          }
          const data = await r.json();
          const items = data[listKey] || [];
          results.push(...items);
          cursor = data.pagingInfo?.continuationToken || data.continuationToken || null;
          page++;
          if (items.length === 0 || !cursor) break;
        } catch (e) { console.error(`Xbox paginated fetch error:`, e); break; }
      }
      return results;
    };

    try {
      // First, get locally installed Xbox games
      const localGames = [];
      if (process.platform === 'win32') {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
          const xboxCmd = 'powershell -NoProfile -Command "Get-ChildItem -Path \\"C:\\\\XboxGames\\" -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name"';
          const { stdout: xboxOut } = await execAsync(xboxCmd, { timeout: 10000 });
          
          if (xboxOut?.trim()) {
            const gameLines = xboxOut.trim().split('\n')
              .map(line => line.trim())
              .filter(name => name && name !== 'GameSave');
            localGames.push(...gameLines);
          }
        } catch (e) {
          console.error("Failed to get local Xbox games:", e);
        }
      }

      // Get Xbox achievement data for all titles
      let allAchievements = [];
      try {
        allAchievements = await fetchAllPages(
          `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements`,
          'achievements', '4'
        );
        console.log(`Xbox Sync: ${allAchievements.length} total achievements`);
      } catch (e) {
        console.error("Xbox achievements error:", e);
      }

      // Build titleId → achievements map
      const achievementsByTitle = new Map<string, any[]>();
      for (const a of allAchievements) {
        const titleIds: string[] = [];
        if (a.titleId) {
          titleIds.push(String(a.titleId));
        }
        if (a.titleAssociations?.length) {
          a.titleAssociations.forEach((ta) => {
            const tid = String(ta.id || ta.titleId || '');
            if (tid && !titleIds.includes(tid)) titleIds.push(tid);
          });
        }
        for (const tid of titleIds) {
          if (!tid || tid === 'undefined' || tid === '0') continue;
          if (!achievementsByTitle.has(tid)) achievementsByTitle.set(tid, []);
          achievementsByTitle.get(tid)!.push(a);
        }
      }

      // Get title history for playtime and metadata
      let titles = [];
      try {
        titles = await fetchAllPages(
          `https://titlehub.xboxlive.com/users/xuid(${xuid})/titles/titlehistory/decoration/detail`,
          'titles', '2'
        );
        console.log(`Xbox Sync: ${titles.length} titles from titlehub`);
      } catch (e) { console.error("Xbox titlehub error:", e); }

      // Create a map of titleId → title info
      const titlesMap = new Map();
      for (const title of titles) {
        titlesMap.set(String(title.titleId), title);
      }

      // Process only locally installed games
      let addedCount = 0;
      for (const localGameName of localGames) {
        // Find matching title from Xbox data
        let matchedTitle = null;
        let titleId = null;
        
        // Try exact match first
        for (const [tid, title] of titlesMap.entries()) {
          if (title.name && title.name.toLowerCase() === localGameName.toLowerCase()) {
            matchedTitle = title;
            titleId = tid;
            break;
          }
        }
        
        // If no exact match, try partial match
        if (!matchedTitle) {
          for (const [tid, title] of titlesMap.entries()) {
            if (title.name && (
              title.name.toLowerCase().includes(localGameName.toLowerCase()) ||
              localGameName.toLowerCase().includes(title.name.toLowerCase())
            )) {
              matchedTitle = title;
              titleId = tid;
              break;
            }
          }
        }
        
        if (matchedTitle && titleId) {
          // Check if game already exists
          const existing = db.prepare(
            "SELECT id FROM launcher_games WHERE user_id = ? AND platform = 'xbox' AND external_id = ?"
          ).get(req.user.id, titleId);
          
          if (!existing) {
            // Get achievements for this title
            const achs = achievementsByTitle.get(titleId) || [];
            const achievementsJson = JSON.stringify(achs.map(a => ({
              name: a.name || a.title || 'Unknown Achievement',
              description: a.description || '',
              icon: a.mediaAssets?.find(m => m.type === 'Icon')?.url || '',
              unlocked: a.progressState === 'Achieved' || a.progression?.state === 'Achieved' || (!!a.progression?.timeUnlocked && new Date(a.progression.timeUnlocked).getTime() > 0) || a.isUnlocked || false,
              unlockTime: (() => { const t = a.progression?.timeUnlocked || a.timeUnlocked; if (!t) return null; const ms = new Date(t).getTime(); return (isNaN(ms) || ms <= 0) ? null : Math.floor(ms / 1000); })()
            })));
            
            // Add the game with full Xbox data
            db.prepare(`
              INSERT INTO launcher_games
                (title, platform, external_id, user_id, playtime, installed, hidden, achievements, artwork, banner, logo, description, tags, genre, release_date)
              VALUES (?, 'xbox', ?, ?, ?, 1, 0, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              matchedTitle.name,
              titleId,
              req.user.id,
              matchedTitle.secondsPlayed || matchedTitle.minutesPlayed || 0,
              achievementsJson,
              matchedTitle.image || '',
              matchedTitle.heroImage || '',
              matchedTitle.icon || '',
              matchedTitle.description || '',
              matchedTitle.genres?.join(',') || '',
              matchedTitle.genres?.[0] || '',
              matchedTitle.releaseDate || ''
            );
            
            addedCount++;
            console.log(`✅ Added Xbox game: ${matchedTitle.name} (local: ${localGameName})`);
          } else {
            // Mark existing game as installed and update with latest data
            const achs = achievementsByTitle.get(titleId) || [];
            const achievementsJson = JSON.stringify(achs.map(a => ({
              name: a.name || a.title || 'Unknown Achievement',
              description: a.description || '',
              icon: a.mediaAssets?.find(m => m.type === 'Icon')?.url || '',
              unlocked: a.progressState === 'Achieved' || a.progression?.state === 'Achieved' || (!!a.progression?.timeUnlocked && new Date(a.progression.timeUnlocked).getTime() > 0) || a.isUnlocked || false,
              unlockTime: (() => { const t = a.progression?.timeUnlocked || a.timeUnlocked; if (!t) return null; const ms = new Date(t).getTime(); return (isNaN(ms) || ms <= 0) ? null : Math.floor(ms / 1000); })()
            })));
            
            db.prepare(`
              UPDATE launcher_games 
              SET installed = 1, playtime = ?, achievements = ?, artwork = ?, banner = ?, logo = ?, description = ?, tags = ?, genre = ?, release_date = ?
              WHERE id = ?
            `).run(
              matchedTitle.secondsPlayed || 0,
              achievementsJson,
              matchedTitle.image || '',
              matchedTitle.heroImage || '',
              matchedTitle.icon || '',
              matchedTitle.description || '',
              matchedTitle.genres?.join(',') || '',
              matchedTitle.genres?.[0] || '',
              matchedTitle.releaseDate || '',
              existing.id
            );
            
            console.log(`📝 Updated Xbox game: ${matchedTitle.name}`);
          }
        } else {
          console.log(`⚠️ No Xbox data found for local game: ${localGameName} — adding as local-only entry`);
          // Game is installed but not in title history (e.g. never launched via Xbox).
          // Fall back to inserting a bare entry using the folder name so it shows in the library.
          const existingByName = db.prepare(
            "SELECT id FROM launcher_games WHERE user_id = ? AND platform = 'xbox' AND LOWER(title) = LOWER(?)"
          ).get(req.user.id, localGameName);
          if (!existingByName) {
            db.prepare(`
              INSERT INTO launcher_games
                (title, platform, external_id, user_id, playtime, installed, hidden)
              VALUES (?, 'xbox', ?, ?, 0, 1, 0)
            `).run(localGameName, localGameName, req.user.id);
            addedCount++;
            console.log(`✅ Added Xbox game (no API match): ${localGameName}`);
          } else {
            db.prepare("UPDATE launcher_games SET installed = 1 WHERE id = ?").run(existingByName.id);
            console.log(`📝 Marked existing game as installed: ${localGameName}`);
          }
        }
      }

      // Only update xbox_id — the refresh token was already correctly saved by link-xbox-refresh.
      // Do NOT store xstsToken here; it is short-lived and would overwrite the real refresh token.
      db.prepare("UPDATE users SET xbox_id = ? WHERE id = ?").run(xuid, req.user.id);

      res.json({ 
        success: true, 
        count: addedCount, 
        message: `Added ${addedCount} Xbox games from your local installation` 
      });
      
    } catch (error) {
      console.error('Xbox local sync error:', error);
      res.status(500).json({ error: 'Failed to sync Xbox games' });
    }
  });

  app.post("/api/launcher/sync-xbox", authenticateToken, async (req, res) => {
    const { xstsToken, userHash, xuid } = req.body;
    if (!xstsToken || !userHash || !xuid) return res.status(400).json({ error: "Missing XSTS token, user hash or XUID" });

    const makeHeaders = (contractVersion = '2') => ({
      'x-xbl-contract-version': contractVersion,
      'Authorization': `XBL3.0 x=${userHash};${xstsToken}`,
      'Accept-Language': 'en-US',
      'Accept': 'application/json'
    });

    // Helper: fetch all pages — correctly handles URLs with/without existing query params
    const fetchAllPages = async (baseUrl, listKey, contractVersion = '2'): Promise<any[]> => {
      const results = [];
      let cursor: string | null = null;
      let page = 0;
      while (page < 20) {
        try {
          const sep = baseUrl.includes('?') ? '&' : '?';
          const url = cursor ? `${baseUrl}${sep}continuationToken=${encodeURIComponent(cursor)}` : baseUrl;
          const r = await fetch(url, { headers: makeHeaders(contractVersion) });
          if (!r.ok) {
            console.warn(`Xbox API ${url} → ${r.status}: ${await r.text().catch(() => '')}`);
            break;
          }
          const data = await r.json();
          const items = data[listKey] || [];
          results.push(...items);
          cursor = data.pagingInfo?.continuationToken || data.continuationToken || null;
          page++;
          if (items.length === 0 || !cursor) break;
        } catch (e) { console.error(`Xbox paginated fetch error:`, e); break; }
      }
      return results;
    };

    try {
      // ── Source 1: Title history (contract v2, decoration=detail gives richer data)
      let titles = [];
      try {
        titles = await fetchAllPages(
          `https://titlehub.xboxlive.com/users/xuid(${xuid})/titles/titlehistory/decoration/detail`,
          'titles', '2'
        );
        console.log(`Xbox Sync: ${titles.length} titles from titlehub`);
      } catch (e) { console.error("Xbox titlehub error:", e); }

      // ── Source 2: Achievement title history — contract v1 returns titleId/titleType/name at top level
      // This catches games with no playtime (e.g. Game Pass trials, quick plays)
      let achTitles = [];
      try {
        achTitles = await fetchAllPages(
          `https://achievements.xboxlive.com/users/xuid(${xuid})/history/titles`,
          'titles', '1'
        );
        console.log(`Xbox Sync: ${achTitles.length} titles from achievement history`);
      } catch (e) { console.error("Xbox achievement titles error:", e); }

      // ── Source 3: Individual achievements — contract v4 for modern shape
      // titleId is a top-level field on each achievement in v4
      let allAchievements = [];
      try {
        allAchievements = await fetchAllPages(
          `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements`,
          'achievements', '4'
        );
        console.log(`Xbox Sync: ${allAchievements.length} total achievements (v4)`);
      } catch (e) {
        // Fallback to v2 if v4 not supported
        try {
          allAchievements = await fetchAllPages(
            `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements`,
            'achievements', '2'
          );
          console.log(`Xbox Sync: ${allAchievements.length} total achievements (v2 fallback)`);
        } catch (e2) { console.error("Xbox achievements error:", e2); }
      }

      // Build titleId → achievements map, handling both v2 (titleAssociations) and v4 (titleId)
      const achievementsByTitle = new Map<string, any[]>();
      for (const a of allAchievements) {
        const titleIds: string[] = [];
        if (a.titleId) {
          titleIds.push(String(a.titleId));
        }
        if (a.titleAssociations?.length) {
          a.titleAssociations.forEach((ta) => {
            const tid = String(ta.id || ta.titleId || '');
            if (tid && !titleIds.includes(tid)) titleIds.push(tid);
          });
        }
        for (const tid of titleIds) {
          if (!tid || tid === 'undefined' || tid === '0') continue;
          if (!achievementsByTitle.has(tid)) achievementsByTitle.set(tid, []);
          achievementsByTitle.get(tid)!.push(a);
        }
      }

      // Merge all title sources into one map keyed by titleId
      const titlesMap = new Map<string, any>();

      const ingestTitle = (t) => {
        const id = String(t.titleId || t.id || '');
        if (!id || id === 'undefined' || id === '0') return;

        // Best artwork — titlehub v2 uses mediaAssets array; older APIs use displayImage
        let artwork = t.displayImage || t.image || '';
        if (t.mediaAssets?.length) {
          const preferred = t.mediaAssets.find((m) =>
            ['BoxArt', 'Poster', 'SquareBoxArt', 'BrandedKeyArt', 'SuperHeroArt'].includes(m.type)
          ) || t.mediaAssets[0];
          if (preferred?.url) artwork = preferred.url;
        }

        // Playtime — titlehub v2 nests under titleHistory; older APIs have it at root
        let playtime = 0;
        const th = t.titleHistory || t.history;
        if (th) {
          if (typeof th.minutesPlayed === 'number') {
            playtime = th.minutesPlayed;
          } else if (typeof th.totalTimePlayed === 'string') {
            const m = th.totalTimePlayed.match(/P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (m) playtime = (parseInt(m[1]||'0')*1440) + (parseInt(m[2]||'0')*60) + parseInt(m[3]||'0');
          }
        } else if (typeof t.minutesPlayed === 'number') {
          playtime = t.minutesPlayed;
        }

        // Type field names differ by API version
        const type = (t.type || t.titleType || t.contentType || '').toLowerCase();
        const name = (t.name || t.title || t.titleName || '').trim();
        if (!name) return;

        if (titlesMap.has(id)) {
          const ex = titlesMap.get(id)!;
          if (playtime > ex.playtime) ex.playtime = playtime;
          if (!ex.artwork && artwork) ex.artwork = artwork;
          // Prefer the more specific type
          if (!ex.type && type) ex.type = type;
        } else {
          titlesMap.set(id, { id, name, type, artwork, playtime });
        }
      };

      titles.forEach(ingestTitle);
      achTitles.forEach(ingestTitle);

      // Add titles discovered only via achievement data
      for (const [tid, achs] of achievementsByTitle) {
        if (!titlesMap.has(tid)) {
          const a = achs[0];
          // v4 has titleName; v2 uses titleAssociations[0].name
          const name = (a.titleName || a.titleAssociations?.[0]?.name || '').trim();
          if (!name) continue;
          titlesMap.set(tid, {
            id: tid,
            name,
            type: 'game',
            artwork: a.mediaAssets?.find((m) => m.type === 'BoxArt')?.url
                  || a.mediaAssets?.[0]?.url || '',
            playtime: 0
          });
        }
      }

      console.log(`Xbox Sync: ${titlesMap.size} unique titles total`);

      // ── DISABLED: Xbox Game Pass catalog (causing issues with non-Game Pass games)
      // The catalog was adding too many games that shouldn't be in the library
      // We'll rely only on title history and achievements for now
      console.log(`Xbox Sync: Skipping Game Pass catalog to avoid adding unplayed games`);

      const NON_GAME = ['netflix','youtube','spotify','twitch','hulu','disney','prime video',
        'microsoft store','settings','edge','cortana','onedrive','skype','teams',
        'movies & tv','groove music','mixed reality','xbox accessories','media player',
        'ea app','origin','epic games launcher','gog galaxy','uplay','battle.net'];

      // Additional EA Play specific filtering - EA games often have different naming patterns
      const EA_PATTERNS = [
        /^ea\s+/i,           // EA prefix
        /ea\s+sports/i,      // EA Sports
        /fifa\s+\d+/i,       // FIFA games
        /fc\s+\d+/i,         // FC games (new FIFA naming)
        /fc\s+(25|24|23)/i,  // Specific FC years
        /madden\s+\d+/i,     // Madden
        /nba\s+live/i,       // NBA Live
        /nfl\s+/i,           // NFL games
        /ufc\s+\d+/i,        // UFC games
        /apex\s+legends/i,   // Apex Legends
        /battlefield\s+\d+/i // Battlefield series
      ];

      // Special handling for FC 25 and other EA games that might not show playtime
      const isEASportsGame = (gameName) => {
        const name = gameName.toLowerCase();
        return EA_PATTERNS.some(pattern => pattern.test(gameName)) || 
               name.includes('fc 25') || 
               name.includes('fifa 25') ||
               name.includes('ea sports fc');
      };
      // ── DEBUG DUMP ──
      try {
        require('fs').writeFileSync('xbox_sync_debug.json', JSON.stringify({
          rawTitlesMap: Array.from(titlesMap.values()),
          achievementsByTitle: Array.from(achievementsByTitle.entries())
        }, null, 2));
      } catch (e) {
        console.error('Failed to write debug file', e);
      }

      const games = Array.from(titlesMap.values()).filter(t => {
        const name = t.name.toLowerCase();
        if (NON_GAME.some(n => name.includes(n))) return false;
        
        // Check if this is an EA game - be more lenient for EA Sports FC games
        const isEAGame = isEASportsGame(t.name);
        if (isEAGame && t.playtime === 0) {
          // For EA Sports FC games, allow them if they have achievements or are from title history
          const hasAchievements = achievementsByTitle.has(String(t.id)) && achievementsByTitle.get(String(t.id))!.length > 0;
          const fromTitleHistory = titles.some(title => String(title.titleId || title.id) === String(t.id));
          
          if (!hasAchievements && !fromTitleHistory) {
            console.log(`Xbox Sync: Filtering out unplayed EA game with no evidence: ${t.name}`);
            return false;
          }
        }
        
        const type = t.type;
        // No type = include (Game Pass titles often have no type from achievement history)
        if (!type) return true;

        // Exclude PC titles (Game Bar tracking for Steam/Epic games), unless they actually have achievements
        // Game Bar aggressively tracks games like Outer Wilds, Elite Dangerous, and Abzu.
        // If a game is a win32 app and has 0 achievements associated with it, it MUST be dropped,
        // even if it has playtime (because Game Bar tracks playtime for Steam/Epic games too).
        if (type === 'win32') {
          const hasAchievements = achievementsByTitle.has(String(t.id)) && achievementsByTitle.get(String(t.id))!.length > 0;
          if (!hasAchievements) {
            console.log(`Xbox Sync: Filtering out win32 pc game with no achievements (Likely Epic/Steam): ${t.name}`);
            return false;
          }
        }
        
        // Exclude pure apps that aren't game-related
        if (type === 'application' || (type.includes('app') && !type.includes('game') && !type.includes('xbox'))) return false;
        return true;
      });

      console.log(`Xbox Sync: ${games.length} games after filtering`);
      if (titlesMap.size > 0 && games.length === 0) {
        console.log("Xbox Sync DEBUG - sample titles:", [...titlesMap.values()].slice(0, 5).map(t => ({ name: t.name, type: t.type, id: t.id })));
      }

      // Clean up stale Xbox games: unplayed + uninstalled + not in current sync results
      const validGameIds = new Set(games.map(g => g.id));
      if (validGameIds.size > 0) {
        const placeholders = Array.from(validGameIds).map(() => '?').join(',');
        const cleanup = (db.prepare(`
          DELETE FROM launcher_games
          WHERE platform = 'xbox' AND user_id = ? AND playtime = 0 AND installed = 0
          AND external_id NOT IN (${placeholders})
        `)).run(req.user.id, ...Array.from(validGameIds));
        if (cleanup.changes > 0) console.log(`Xbox Sync: removed ${cleanup.changes} stale unplayed Xbox games`);
      }

      const stmt = db.prepare(`
        INSERT INTO launcher_games (title, artwork, banner, platform, external_id, user_id, playtime, achievements, installed, hidden)
        VALUES (?, ?, ?, 'xbox', ?, ?, ?, ?, 0, 0)
        ON CONFLICT(platform, external_id, user_id) DO UPDATE SET
          title = excluded.title,
          playtime = MAX(playtime, excluded.playtime),
          artwork = CASE WHEN excluded.artwork != '' THEN excluded.artwork ELSE artwork END,
          achievements = excluded.achievements,
          hidden = 0
      `);

      const insertMany = db.transaction((gamesToInsert) => {
        // Fetch existing steam/local games to cross-reference and prevent duplicates
        const existingPCGames = db.prepare(`
          SELECT id, title, platform, playtime FROM launcher_games 
          WHERE user_id = ? AND platform IN ('steam', 'local')
        `).all(req.user.id);

        for (const game of gamesToInsert) {
          // Map achievements for this title
          const achs = (achievementsByTitle.get(game.id) || []).map((a) => {
            const unlocked = a.progressState === 'Achieved' || a.achieved === true;
            const unlockTime = a.progression?.timeUnlocked
              ? new Date(a.progression.timeUnlocked).getTime() / 1000
              : (a.unlockTime || 0);
            // Best icon: use the first mediaAsset, prefer the unlocked one
            const icon = a.mediaAssets?.find((m) => m.type === 'Icon')?.url
              || a.mediaAssets?.[0]?.url || '';
            return {
              name: a.name || a.lockedDescription || 'Achievement',
              description: a.lockedDescription || a.description || '',
              unlocked,
              icon,
              unlockTime
            };
          }).sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            if (a.unlocked && b.unlocked) return b.unlockTime - a.unlockTime;
            return 0;
          });

          const achsJson = JSON.stringify(achs);
          const artwork = game.artwork || `https://picsum.photos/seed/xbox-${game.id}/600/900`;
          const banner = `https://picsum.photos/seed/xbox-banner-${game.id}/1920/1080`;

          // Deduplication: If this game exists on Steam/Local, we merge it rather than create a duplicate Xbox entry
          // Only merge if the Xbox version doesn't already exist
          const existingXbox = db.prepare(
            "SELECT id FROM launcher_games WHERE user_id = ? AND platform = 'xbox' AND external_id = ?"
          ).get(req.user.id, String(game.id));

          if (!existingXbox) {
            const cleanT = game.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const duplicate = existingPCGames.find(p => {
              const cp = p.title.toLowerCase().replace(/[^a-z0-9]/g, '');
              return cleanT === cp || (cp.length > 5 && cleanT.includes(cp)) || (cleanT.length > 5 && cp.includes(cleanT));
            });

            if (duplicate) {
              console.log(`Xbox Sync: Merging Xbox game "${game.name}" into existing ${duplicate.platform} game ID ${duplicate.id}`);
              db.prepare(`
                UPDATE launcher_games 
                SET external_id = ?, achievements = ?, artwork = CASE WHEN artwork = '' THEN ? ELSE artwork END
                WHERE id = ?
              `).run(String(game.id), achsJson, artwork, duplicate.id);
              continue; // Skip the standard INSERT for this game
            }
          }

          stmt.run(
            game.name,
            artwork,
            banner,
            String(game.id),
            req.user.id,
            game.playtime || 0,
            achsJson
          );
        }
      });

      insertMany(games);

      res.json({
        success: true,
        count: games.length,
        debug: {
          totalTitles: titlesMap.size,
          totalAchievements: allAchievements.length,
          firstTitle: games[0] ? { name: games[0].name, type: games[0].type } : null
        }
      });
    } catch (error) {
      console.error("Xbox Sync Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/launcher/sync-steam", authenticateToken, async (req, res) => {
    const { steamid } = req.body;
    if (!steamid) return res.status(400).json({ error: "Steam ID required" });

    try {
      const apiKey = process.env.STEAM_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Steam API Key not configured" });
      
      const response = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamid}&include_appinfo=1&format=json`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Steam API Error:", response.status, errorText);
        throw new Error(`Steam API failed with status ${response.status}`);
      }
      const data = await response.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
      
      if (!data.response || !data.response.games) {
        return res.status(400).json({ error: "No games found or profile is private" });
      }

      // Get locally installed Steam games
      const localAppIds = new Set();
      if (process.platform === 'win32') {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
          const steamCmd = 'powershell -NoProfile -Command "Get-ChildItem -Path \"C:\\Program Files (x86)\\Steam\\steamapps\" -Filter \"*.acf\" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name | ForEach-Object { $_ -replace \"\\.acf$\", \"\" } | Where-Object { $_ -notmatch \"^common_\" -and $_ -notmatch \"^workshop_\" }"';
          const { stdout: steamOut } = await execAsync(steamCmd, { timeout: 10000 });
          
          if (steamOut?.trim()) {
            const appIds = steamOut.trim().split('\n')
              .map(line => line.trim())
              .filter(appId => appId && appId.match(/^\d+$/));
            appIds.forEach(id => localAppIds.add(id));
          }
        } catch (e) {
          console.error("Failed to get local Steam games:", e);
        }
      }

      const stmt = db.prepare(`
        INSERT INTO launcher_games (title, artwork, banner, platform, external_id, user_id, playtime, installed, hidden)
        VALUES (?, ?, ?, 'steam', ?, ?, ?, ?, 0)
        ON CONFLICT(platform, external_id, user_id) DO UPDATE SET
          title = excluded.title,
          playtime = MAX(playtime, excluded.playtime),
          installed = excluded.installed
      `);

      const insertMany = db.transaction((games) => {
        for (const game of games) {
          const artwork = `https://shared.steamstatic.com/store_item_assets/steam/apps/${game.appid}/library_capsule_2x.jpg`;
          const banner = `https://shared.steamstatic.com/store_item_assets/steam/apps/${game.appid}/library_hero.jpg`;
          const isInstalled = localAppIds.has(String(game.appid)) ? 1 : 0;
          stmt.run(game.name, artwork, banner, String(game.appid), req.user.id, game.playtime_forever || 0, isInstalled);
        }
      });

      insertMany(data.response.games);
      
      const installedCount = Array.from(localAppIds).filter(appId => 
        data.response.games.some(game => String(game.appid) === appId)
      ).length;
      
      res.json({ 
        success: true, 
        count: data.response.games.length,
        installed: installedCount,
        message: `Synced ${data.response.games.length} games (${installedCount} locally installed)` 
      });
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).json({ error: "Failed to sync Steam library" });
    }
  });

  app.post("/api/launcher/refresh-metadata", authenticateToken, async (req, res) => {
    const { forceAll } = req.body;
    try {
      const query = forceAll 
        ? "SELECT * FROM launcher_games WHERE user_id = ?" 
        : "SELECT * FROM launcher_games WHERE user_id = ? AND (logo IS NULL OR tags IS NULL OR description IS NULL)";
      const games = db.prepare(query).all(req.user.id);
      
      const sgdbKey = process.env.STEAMGRIDDB_API_KEY;
      const steamKey = process.env.STEAM_API_KEY;

      for (const game of games) {
        let artwork = game.artwork;
        let banner = game.banner;
        let logo = game.logo;
        let description = game.description;
        let tags = game.tags;
        let genre = game.genre;
        let release_date = game.release_date;

        if (game.platform === 'steam') {
          // Fetch Grid from SteamgridDB
          if (sgdbKey) {
            try {
              // Vertical Grid
              const gridRes = await fetch(`https://www.steamgriddb.com/api/v2/grids/steam/${game.external_id}?dimensions=600x900,342x482,660x930`, {
                headers: { Authorization: `Bearer ${sgdbKey}` }
              });
              const gridData = await gridRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
              if (gridData.success && gridData.data && gridData.data.length > 0) {
                artwork = gridData.data[0].url;
              }

              // Hero Artwork (for Banner)
              const heroRes = await fetch(`https://www.steamgriddb.com/api/v2/heroes/steam/${game.external_id}`, {
                headers: { Authorization: `Bearer ${sgdbKey}` }
              });
              const heroData = await heroRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
              if (heroData.success && heroData.data && heroData.data.length > 0) {
                banner = heroData.data[0].url;
              }

              const logoRes = await fetch(`https://www.steamgriddb.com/api/v2/logos/steam/${game.external_id}`, {
                headers: { Authorization: `Bearer ${sgdbKey}` }
              });
              const logoData = await logoRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
              if (logoData.success && logoData.data && logoData.data.length > 0) {
                const whiteLogos = logoData.data.filter((l) => l.style === 'white' || l.style === 'custom');
                const targetList = whiteLogos.length > 0 ? whiteLogos : logoData.data;
                const horizontal = [...targetList].sort((a, b) => (b.width / b.height) - (a.width / a.height))[0];
                logo = horizontal.url;
              }
            } catch (e) {
              console.error(`SGDB fetch error for ${game.title}:`, e);
            }
          }

          // Fetch details from Steam
          try {
            const steamRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${game.external_id}`);
            if (steamRes.ok) {
              const steamData = await steamRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
              const details = steamData[game.external_id]?.data;
              if (details) {
                description = details.short_description?.replace(/<[^>]*>?/gm, '') || description;
                const genres = details.genres?.map((g) => g.description) || [];
                genre = genres[0] || genre;
                const steamReleaseDate = details.release_date?.date || null;
                release_date = steamReleaseDate || release_date;
              }
            }
          } catch (e) {
            console.error(`Steam details fetch error for ${game.title}:`, e);
          }
        } else if (game.platform === 'xbox') {
          // For Xbox, search SteamGridDB by name
          if (sgdbKey) {
            try {
              const searchRes = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(game.title)}`, {
                headers: { Authorization: `Bearer ${sgdbKey}` }
              });
              const searchData = await searchRes.json();
              if (searchData.success && searchData.data && searchData.data.length > 0) {
                const gameId = searchData.data[0].id;
                
                // Vertical Grid
                const gridRes = await fetch(`https://www.steamgriddb.com/api/v2/grids/game/${gameId}?dimensions=600x900,342x482,660x930`, {
                  headers: { Authorization: `Bearer ${sgdbKey}` }
                });
                const gridData = await gridRes.json();
                if (gridData.success && gridData.data && gridData.data.length > 0) {
                  artwork = gridData.data[0].url;
                }

                // Hero
                const heroRes = await fetch(`https://www.steamgriddb.com/api/v2/heroes/game/${gameId}`, {
                  headers: { Authorization: `Bearer ${sgdbKey}` }
                });
                const heroData = await heroRes.json();
                if (heroData.success && heroData.data && heroData.data.length > 0) {
                  banner = heroData.data[0].url;
                }

                // Logo
                const logoRes = await fetch(`https://www.steamgriddb.com/api/v2/logos/game/${gameId}`, {
                  headers: { Authorization: `Bearer ${sgdbKey}` }
                });
                const logoData = await logoRes.json();
                if (logoData.success && logoData.data && logoData.data.length > 0) {
                  const whiteLogos = logoData.data.filter((l) => l.style === 'white' || l.style === 'custom');
                  const targetList = whiteLogos.length > 0 ? whiteLogos : logoData.data;
                  const horizontal = [...targetList].sort((a, b) => (b.width / b.height) - (a.width / a.height))[0];
                  logo = horizontal.url;
                }
              }
            } catch (e) {
              console.error(`SGDB Xbox fetch error for ${game.title}:`, e);
            }
          }
        }

        // Use IGDB to get proper user tags for all platforms
        try {
          const igdbRes = await fetch(`http://localhost:3000/api/igdb/search?title=${encodeURIComponent(game.title)}`);
          if (igdbRes.ok) {
            const igdbData = await igdbRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
            if (igdbData && igdbData.tags) {
              tags = igdbData.tags;
              if (!description && igdbData.description) description = igdbData.description;
              if (!genre && igdbData.genre) genre = igdbData.genre;
            }
          }
        } catch (igdbError) {
          console.error(`IGDB error for ${game.title}:`, igdbError);
        }

        db.prepare(`
          UPDATE launcher_games 
          SET artwork = ?, banner = ?, logo = ?, description = ?, tags = ?, genre = ?, release_date = ? 
          WHERE id = ?
        `).run(artwork, banner, logo, description, tags, genre, release_date, game.id);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Refresh metadata error:", error);
      res.status(500).json({ error: "Failed to refresh metadata" });
    }
  });

  app.patch("/api/user/profile", authenticateToken, (req, res) => {
    const { steam_id, xbox_id, discord_id, avatar } = req.body;
    try {
      const result = db.prepare(`
        UPDATE users SET 
          steam_id = COALESCE(?, steam_id),
          xbox_id = COALESCE(?, xbox_id),
          discord_id = COALESCE(?, discord_id),
          avatar = COALESCE(?, avatar)
        WHERE id = ?
      `).run(steam_id, xbox_id, discord_id, avatar, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/launcher/games/:id/friends", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      const userId = req.user.id;
      const game = db.prepare("SELECT external_id, platform FROM launcher_games WHERE id = ?").get(id);
      if (!game) return res.json([]);

      const user = db.prepare("SELECT steam_id, xbox_id, xbox_refresh_token FROM users WHERE id = ?").get(userId);
      const results = [];

      // ── STEAM ──────────────────────────────────────────────────────────────
      if (game.platform === 'steam' && user?.steam_id && process.env.STEAM_API_KEY) {
        const appId = game.external_id;
        try {
          const friendListRes = await fetch(
            `https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${user.steam_id}&relationship=friend`
          );
          if (friendListRes.ok) {
            const friendListData = await friendListRes.json();
            const friendIds: string[] = (friendListData.friendslist?.friends || []).map((f) => f.steamid);

            if (friendIds.length > 0) {
              const summariesRes = await fetch(
                `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${friendIds.slice(0, 100).join(',')}`
              );
              const summaryMap: Record<string, any> = {};
              for (const p of ((summariesRes.ok ? await summariesRes.json() : null)?.response?.players || [])) {
                summaryMap[p.steamid] = p;
              }

              const ownershipChecks = friendIds.slice(0, 50).map(async (steamid) => {
                try {
                  const ownedRes = await fetch(
                    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steamid}&include_appinfo=0&format=json`
                  );
                  if (!ownedRes.ok) return null;
                  const ownedData = await ownedRes.json();
                  const found = (ownedData.response?.games || []).find((g) => String(g.appid) === String(appId));
                  if (!found) return null;
                  const s = summaryMap[steamid];
                  const stateMap: Record<number, string> = { 0: 'offline', 1: 'online', 2: 'busy', 3: 'away', 4: 'away', 5: 'away', 6: 'in_game' };
                  return {
                    username: s?.personaname || steamid,
                    avatar: s?.avatarfull || null,
                    online_status: s?.gameid ? 'in_game' : (stateMap[s?.personastate ?? 0] ?? 'offline'),
                    current_game: s?.gameextrainfo || null,
                    last_played: found.rtime_last_played || null,
                    platform: 'steam'
                  };
                } catch { return null; }
              });

              results.push(...(await Promise.all(ownershipChecks)).filter(Boolean));
            }
          }
        } catch (e) { console.error("Friends-who-own Steam error:", e); }
      }

      // ── XBOX ──────────────────────────────────────────────────────────────
      if (game.platform === 'xbox' && user?.xbox_refresh_token && process.env.XBOX_CLIENT_ID && process.env.XBOX_CLIENT_SECRET) {
        try {
          const tokenRes = await fetch('https://login.live.com/oauth20_token.srf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.XBOX_CLIENT_ID,
              client_secret: process.env.XBOX_CLIENT_SECRET,
              grant_type: 'refresh_token',
              refresh_token: user.xbox_refresh_token
            })
          });
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            // Update refresh token
            db.prepare("UPDATE users SET xbox_refresh_token = ? WHERE id = ?").run(tokenData.refresh_token, userId);

            const userTokenRes = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-xbl-contract-version': '1' },
              body: JSON.stringify({
                RelyingParty: 'http://auth.xboxlive.com',
                TokenType: 'JWT',
                Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${tokenData.access_token}` }
              })
            });
            if (userTokenRes.ok) {
              const userTokenData = await userTokenRes.json();
              const xstsRes = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-xbl-contract-version': '1' },
                body: JSON.stringify({
                  RelyingParty: 'http://xboxlive.com',
                  TokenType: 'JWT',
                  Properties: { UserTokens: [userTokenData.Token], SandboxId: 'RETAIL' }
                })
              });
              if (xstsRes.ok) {
                const xstsData = await xstsRes.json();
                const xstsToken = xstsData.Token;
                const userHash = xstsData.DisplayClaims.xui[0].uhs;

                const peopleRes = await fetch(
                  'https://peoplehub.xboxlive.com/users/me/people/social/decoration/detail,presenceDetail',
                  {
                    headers: {
                      'x-xbl-contract-version': '2',
                      'Authorization': `XBL3.0 x=${userHash};${xstsToken}`,
                      'Accept-Language': 'en-US',
                      'Accept': 'application/json'
                    }
                  }
                );
                if (peopleRes.ok) {
                  const peopleData = await peopleRes.json();
                  // titleId for this game (numeric string from Xbox API, or null if folder-name fallback)
                  const titleId = game.external_id && game.external_id !== game.title ? String(game.external_id) : null;

                  for (const person of peopleData.people || []) {
                    const isOnline = person.presenceState === 'Online';
                    const activeTitle = (person.presenceDetails || []).find((d) => d.IsGame);
                    const presenceTitleId = activeTitle?.TitleId ? String(activeTitle.TitleId) : null;
                    const isPlayingThis = !!(titleId && presenceTitleId && presenceTitleId === titleId);

                    // Only include online friends or those who are playing this exact game
                    if (isOnline || isPlayingThis) {
                      results.push({
                        username: person.gamertag,
                        avatar: person.displayPicRaw || null,
                        online_status: isPlayingThis ? 'in_game' : (isOnline ? 'online' : 'offline'),
                        current_game: activeTitle?.PresenceText || null,
                        platform: 'xbox'
                      });
                    }
                  }
                }
              }
            }
          }
        } catch (e) { console.error("Friends-who-own Xbox error:", e); }
      }

      res.json(results.sort((a, b) => {
        const rank = (s) => s === 'in_game' ? 0 : s === 'online' ? 1 : s === 'away' ? 2 : 3;
        return rank(a.online_status) - rank(b.online_status) || a.username.localeCompare(b.username);
      }));
    } catch (error) {
      console.error("Friends-who-own error:", error);
      res.status(500).json({ error: "Failed to fetch friends who own this game" });
    }
  });

  app.post("/api/launcher/launch", authenticateToken, (req, res) => {
    const { id } = req.body;
    try {
      // Update last played and add some mock playtime for demo purposes
      const playtimeIncrement = Math.floor(Math.random() * 60) + 30; // 30-90 mins
      db.prepare("UPDATE launcher_games SET last_played = CURRENT_TIMESTAMP, playtime = playtime + ? WHERE id = ? AND user_id = ?").run(playtimeIncrement, id, req.user.id);
      
      // Log playtime for history
      db.prepare(`
        INSERT INTO playtime_logs (user_id, game_id, playtime_minutes) 
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, game_id, date) DO UPDATE SET playtime_minutes = playtime_minutes + ?
      `).run(req.user.id, id, playtimeIncrement, playtimeIncrement);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to launch game" });
    }
  });

  app.get("/api/launcher/games/:id/details", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      const game = db.prepare("SELECT * FROM launcher_games WHERE id = ? AND user_id = ?").get(id, req.user.id);
      if (!game) return res.status(404).json({ error: "Game not found" });

      let logo = game.logo;
      let achievements = game.achievements ? JSON.parse(game.achievements) : [];
      let description = game.description;
      let tags = game.tags;
      let release_date = game.release_date;
      let genre = game.genre;

      // Fetch missing metadata from Steam
      if (game.platform === 'steam' && (!release_date || !description)) {
        try {
          const steamRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${game.external_id}`);
          if (steamRes.ok) {
            const steamData = await steamRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
            const details = steamData[game.external_id]?.data;
            if (details) {
              description = description || details.short_description?.replace(/<[^>]*>?/gm, '');
              genre = genre || details.genres?.[0]?.description;
              release_date = release_date || details.release_date?.date;
            }
          }
        } catch (e) {
          console.error("Metadata fetch error in details:", e);
        }
      }

      // Fetch ALL tags from IGDB for all platforms if missing
      if (!tags) {
        try {
          const igdbRes = await fetch(`http://localhost:3000/api/igdb/search?title=${encodeURIComponent(game.title)}`);
          if (igdbRes.ok) {
            const igdbData = await igdbRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
            if (igdbData && igdbData.tags) {
              tags = igdbData.tags;
            }
          }
        } catch (e) {
          console.error("IGDB fetch error in details:", e);
        }
      }

      // Fetch achievements from Steam
      if (game.platform === 'steam') {
        const steamKey = process.env.STEAM_API_KEY;
        const steamId = req.user.steam_id;
        if (steamKey && steamId) {
          try {
            const achRes = await fetch(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${steamKey}&steamid=${steamId}&appid=${game.external_id}`);
            if (achRes.ok) {
              const achData = await achRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
              if (achData.playerstats?.success && achData.playerstats.achievements) {
                // Get global achievement names/icons
                const schemaRes = await fetch(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${steamKey}&appid=${game.external_id}`);
                if (schemaRes.ok) {
                  const schemaData = await schemaRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
                  const schemaAchs = schemaData.game?.availableGameStats?.achievements || [];
                  
                  achievements = achData.playerstats.achievements.map((a) => {
                    const schema = schemaAchs.find((s) => s.name === a.apiname);
                    return {
                      name: schema?.displayName || a.apiname,
                      description: schema?.description || '',
                      icon: schema?.icon || '',
                      unlocked: a.achieved === 1,
                      unlockTime: a.unlocktime
                    };
                  }).sort((a, b) => {
                    if (a.unlocked && !b.unlocked) return -1;
                    if (!a.unlocked && b.unlocked) return 1;
                    if (a.unlocked && b.unlocked) return b.unlockTime - a.unlockTime;
                    return 0;
                  });
                }
              }
            }
          } catch (e) {
            console.error("Steam achievements fetch error:", e);
          }
        }
      }

      // Fetch achievements for Xbox if missing
      // Re-fetch if empty OR if all stored achievements lack icons/descriptions (stale data from a failed prior sync)
      const xboxAchievementsNeedRefresh = !achievements || achievements.length === 0 ||
        achievements.every((a: any) => !a.icon && !a.description) ||
        achievements.some((a: any) => a.unlockTime && isNaN(Number(a.unlockTime))) || // old ISO string format
        achievements.some((a: any) => typeof a.unlockTime === 'number' && a.unlockTime < 0); // negative = null date from old broken mapping
      if (game.platform === 'xbox' && xboxAchievementsNeedRefresh) {
        try {
          const user = db.prepare("SELECT xbox_id, xbox_refresh_token FROM users WHERE id = ?").get(req.user.id);
          if (user?.xbox_refresh_token) {
            // Try to get achievements even without titleId by searching through user's achievement history
            const tokenRes = await fetch('https://login.live.com/oauth20_token.srf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: process.env.XBOX_CLIENT_ID,
                client_secret: process.env.XBOX_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: user.xbox_refresh_token
              })
            });
            
            if (tokenRes.ok) {
              const tokenData = await tokenRes.json();
              // Rotate the stored refresh token
              if (tokenData.refresh_token) {
                db.prepare("UPDATE users SET xbox_refresh_token = ? WHERE id = ?").run(tokenData.refresh_token, req.user.id);
              }
              const userTokenRes = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-xbl-contract-version': '1' },
                body: JSON.stringify({
                  RelyingParty: 'http://auth.xboxlive.com',
                  TokenType: 'JWT',
                  Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${tokenData.access_token}` }
                })
              });

              if (userTokenRes.ok) {
                const userTokenData = await userTokenRes.json();
                const userTokenValue = userTokenData.Token;

                // Exchange user token for XSTS token
                const xstsRes = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-xbl-contract-version': '1' },
                  body: JSON.stringify({
                    RelyingParty: 'http://xboxlive.com',
                    TokenType: 'JWT',
                    Properties: { UserTokens: [userTokenValue], SandboxId: 'RETAIL' }
                  })
                });

                const xstsData = xstsRes.ok ? await xstsRes.json() : null;
                const userToken = xstsData?.DisplayClaims?.xui?.[0]?.uhs;
                const xstsToken = xstsData?.Token;
                
                if (userToken && xstsToken) {
                  let achievementsData = [];
                  
                  // If we have a titleId, use it directly
                  if (game.external_id && game.external_id !== game.title) {
                    const achRes = await fetch(`https://achievements.xboxlive.com/users/xuid(${user.xbox_id})/achievements?titleId=${game.external_id}`, {
                      headers: {
                        'x-xbl-contract-version': '4',
                        'Authorization': `XBL3.0 x=${userToken};${xstsToken}`,
                        'Accept-Language': 'en-US',
                        'Accept': 'application/json'
                      }
                    });
                    
                    if (achRes.ok) {
                      const achData = await achRes.json();
                      achievementsData = achData.achievements || [];
                    }
                  } else {
                    // Search through all achievements for games matching the title
                    const allAchRes = await fetch(`https://achievements.xboxlive.com/users/xuid(${user.xbox_id})/achievements`, {
                      headers: {
                        'x-xbl-contract-version': '4',
                        'Authorization': `XBL3.0 x=${userToken};${xstsToken}`,
                        'Accept-Language': 'en-US',
                        'Accept': 'application/json'
                      }
                    });
                    
                    if (allAchRes.ok) {
                      const allAchData = await allAchRes.json();
                      // Group achievements by titleId and find the one matching our game title
                      const achievementsByTitle = {};
                      for (const ach of allAchData.achievements || []) {
                        const titleId = ach.titleAssociations?.[0]?.id || ach.titleId;
                        if (titleId) {
                          if (!achievementsByTitle[titleId]) {
                            achievementsByTitle[titleId] = {
                              titleAssociations: ach.titleAssociations,
                              achievements: []
                            };
                          }
                          achievementsByTitle[titleId].achievements.push(ach);
                        }
                      }
                      
                      // Find the title that matches our game name
                      for (const [titleId, data] of Object.entries(achievementsByTitle)) {
                        const titleName = data.titleAssociations?.[0]?.name;
                        if (titleName && titleName.toLowerCase() === game.title.toLowerCase()) {
                          achievementsData = data.achievements;
                          // Update the game with the correct titleId
                          db.prepare("UPDATE launcher_games SET external_id = ? WHERE id = ?").run(titleId, id);
                          break;
                        }
                      }
                    }
                  }
                  
                  if (achievementsData.length > 0) {
                    achievements = achievementsData.map(a => ({
                      name: a.name || a.title || 'Unknown Achievement',
                      description: a.description || '',
                      icon: a.mediaAssets?.find(m => m.type === 'Icon')?.url || '',
                      unlocked: a.progressState === 'Achieved' || a.progression?.state === 'Achieved' || (!!a.progression?.timeUnlocked && new Date(a.progression.timeUnlocked).getTime() > 0) || a.isUnlocked || false,
                      unlockTime: (() => { const t = a.progression?.timeUnlocked || a.timeUnlocked; if (!t) return null; const ms = new Date(t).getTime(); return (isNaN(ms) || ms <= 0) ? null : Math.floor(ms / 1000); })()
                    }));
                    
                    // Update the database with achievements
                    db.prepare("UPDATE launcher_games SET achievements = ? WHERE id = ?").run(JSON.stringify(achievements), id);
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("Xbox achievements fetch error:", e);
        }
      }

      // Fetch logo from SteamgridDB if missing
      if (!logo && game.platform === 'steam') {
        const sgdbKey = process.env.STEAMGRIDDB_API_KEY;
        if (sgdbKey) {
          const logoRes = await fetch(`https://www.steamgriddb.com/api/v2/logos/steam/${game.external_id}`, {
            headers: { Authorization: `Bearer ${sgdbKey}` }
          });
          const logoData = await logoRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
          if (logoData.success && logoData.data && logoData.data.length > 0) {
            const whiteLogos = logoData.data.filter((l) => l.style === 'white' || l.style === 'custom');
            const targetList = whiteLogos.length > 0 ? whiteLogos : logoData.data;
            const horizontal = [...targetList].sort((a, b) => (b.width / b.height) - (a.width / a.height))[0];
            logo = horizontal.url;
          }
        }
      }

      // Normalize unlockTime: null out negative timestamps (0001-01-01 null date from Xbox API)
      achievements = achievements.map((a: any) => ({
        ...a,
        unlockTime: (typeof a.unlockTime === 'number' && a.unlockTime > 0) ? a.unlockTime : null
      }));

      // Update database
      db.prepare("UPDATE launcher_games SET logo = ?, achievements = ?, description = ?, tags = ?, release_date = ? WHERE id = ?").run(logo, JSON.stringify(achievements), description, tags, release_date, id);

      res.json({ logo, achievements: JSON.stringify(achievements), description, tags, release_date });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch game details" });
    }
  });

  app.get("/api/launcher/favorite-titles", authenticateToken, async (req, res) => {
    try {
      const logGames = db.prepare("SELECT title FROM games WHERE user_id = ? LIMIT 10").all(req.user.id);
      const libGames = db.prepare("SELECT title FROM launcher_games WHERE user_id = ? LIMIT 10").all(req.user.id);
      
      const titles = [...new Set([...logGames.map(g => g.title), ...libGames.map(g => g.title)])].join(", ");
      res.json({ titles });
    } catch (error) {
      res.status(500).json({ error: "Failed to get favorite titles" });
    }
  });

  app.post("/api/launcher/games/:id/toggle-installed", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { installed } = req.body;
    try {
      db.prepare("UPDATE launcher_games SET installed = ? WHERE id = ? AND user_id = ?").run(installed ? 1 : 0, id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update installation status" });
    }
  });

  app.post("/api/launcher/clear", authenticateToken, (req, res) => {
    try {
      const result = db.prepare("DELETE FROM launcher_games WHERE user_id = ?").run(req.user.id);
      res.json({ success: true, changes: result.changes });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear launcher library" });
    }
  });

  app.post("/api/launcher/scan-local", authenticateToken, async (req: any, res) => {
    if (process.platform !== 'win32') {
      return res.status(400).json({ error: "Local scan is only supported on Windows" });
    }

    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      console.log('🔍 Scanning Xbox games...');
      
      // Simple PowerShell command to get Xbox games as plain text
      const xboxCmd = 'powershell -NoProfile -Command "Get-ChildItem -Path \\"C:\\\\XboxGames\\" -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name"';
      
      const { stdout: xboxOut, stderr: xboxErr } = await execAsync(xboxCmd, { timeout: 10000 });
      
      console.log('PowerShell stdout:', JSON.stringify(xboxOut));
      console.log('PowerShell stderr:', JSON.stringify(xboxErr));
      
      if (xboxErr && !xboxOut) {
        console.error('Xbox scan error:', xboxErr);
        return res.status(500).json({ error: 'Xbox scan failed: ' + xboxErr });
      }
      
      let addedCount = 0;
      
      if (xboxOut?.trim()) {
        try {
          // Parse plain text output (one game per line)
          const gameLines = xboxOut.trim().split('\n');
          const games = gameLines
            .map(line => line.trim())
            .filter(name => name && name !== 'GameSave')
            .map(name => ({ Name: name }));
          
          console.log('Found Xbox games:', games);
          console.log('Game count:', games.length);
          
          for (const game of games) {
            const gameName = game.Name;
            if (gameName && gameName !== 'GameSave') {
              // Check if game already exists
              const existing = db.prepare(
                "SELECT id FROM launcher_games WHERE user_id = ? AND platform = 'xbox' AND LOWER(title) = LOWER(?)"
              ).get(req.user.id, gameName);
              
              if (!existing) {
                // Try to find a matching synced Xbox game to get its titleId
                const syncedGame = db.prepare(
                  "SELECT external_id FROM launcher_games WHERE user_id = ? AND platform = 'xbox' AND LOWER(title) = LOWER(?) AND external_id IS NOT NULL AND external_id != title"
                ).get(req.user.id, gameName);
                
                const titleId = syncedGame?.external_id || gameName;
                
                // Add the game
                db.prepare(`
                  INSERT INTO launcher_games
                    (title, platform, external_id, user_id, playtime, installed, hidden)
                  VALUES (?, 'xbox', ?, ?, 0, 1, 0)
                `).run(gameName, titleId, req.user.id);
                
                addedCount++;
                console.log(`✅ Added Xbox game: ${gameName} (titleId: ${titleId})`);
              } else {
                // Mark existing game as installed
                db.prepare("UPDATE launcher_games SET installed = 1 WHERE id = ?").run(existing.id);
                console.log(`📝 Marked existing game as installed: ${gameName}`);
              }
            }
          }
        } catch (parseError) {
          console.error('Parse error:', parseError);
          console.error('Raw output:', JSON.stringify(xboxOut));
          return res.status(500).json({ error: 'Failed to parse Xbox games list: ' + parseError.message });
        }
      } else {
        console.log('No Xbox games found in C:\\XboxGames');
      }
      
      res.json({ 
        success: true, 
        count: addedCount, 
        message: `Added ${addedCount} new Xbox games` 
      });
      
    } catch (error) {
      console.error('Local scan error:', error);
      res.status(500).json({ error: 'Failed to perform local scan' });
    }
  });

  app.post("/api/launcher/scan-steam-local", authenticateToken, async (req: any, res) => {
    if (process.platform !== 'win32') {
      return res.status(400).json({ error: "Steam local scan is only supported on Windows" });
    }

    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      console.log('🔍 Scanning Steam games...');
      
      // PowerShell command to get Steam games from library folders
      const steamCmd = 'powershell -NoProfile -Command "Get-ChildItem -Path \"C:\\Program Files (x86)\\Steam\\steamapps\" -Filter \"*.acf\" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name | ForEach-Object { $_ -replace \"\\.acf$\", \"\" } | Where-Object { $_ -notmatch \"^common_\" -and $_ -notmatch \"^workshop_\" }"';
      
      const { stdout: steamOut, stderr: steamErr } = await execAsync(steamCmd, { timeout: 10000 });
      
      console.log('Steam PowerShell stdout:', JSON.stringify(steamOut));
      console.log('Steam PowerShell stderr:', JSON.stringify(steamErr));
      
      if (steamErr && !steamOut) {
        console.error('Steam scan error:', steamErr);
        return res.status(500).json({ error: 'Steam scan failed: ' + steamErr });
      }
      
      let addedCount = 0;
      
      if (steamOut?.trim()) {
        try {
          // Parse plain text output (one appid per line)
          const appIds = steamOut.trim().split('\n')
            .map(line => line.trim())
            .filter(appId => appId && appId.match(/^\d+$/));
          
          console.log('Found Steam appIds:', appIds);
          console.log('AppId count:', appIds.length);
          
          for (const appId of appIds) {
            // Check if game already exists
            const existing = db.prepare(
              "SELECT id FROM launcher_games WHERE user_id = ? AND platform = 'steam' AND external_id = ?"
            ).get(req.user.id, appId);
            
            if (!existing) {
              // Add the game with placeholder title
              db.prepare(`
                INSERT INTO launcher_games
                  (title, platform, external_id, user_id, playtime, installed, hidden)
                VALUES (?, 'steam', ?, ?, 0, 1, 0)
              `).run(`Steam Game ${appId}`, appId, req.user.id);
              
              addedCount++;
              console.log(`✅ Added Steam game: ${appId}`);
            } else {
              // Mark existing game as installed
              db.prepare("UPDATE launcher_games SET installed = 1 WHERE id = ?").run(existing.id);
              console.log(`📝 Marked existing Steam game as installed: ${appId}`);
            }
          }
        } catch (parseError) {
          console.error('Parse error:', parseError);
          console.error('Raw output:', JSON.stringify(steamOut));
          return res.status(500).json({ error: 'Failed to parse Steam games list: ' + parseError.message });
        }
      } else {
        console.log('No Steam games found');
      }
      
      res.json({ 
        success: true, 
        count: addedCount, 
        message: `Added ${addedCount} new Steam games` 
      });
      
    } catch (error) {
      console.error('Steam local scan error:', error);
      res.status(500).json({ error: 'Failed to perform Steam local scan' });
    }
  });

    app.get("/api/home/data", authenticateToken, async (req: any, res) => {
      try {
        const userId = req.user.id;

        // 1. Recently played
        const recentlyPlayed = db.prepare(`
          SELECT * FROM launcher_games 
          WHERE user_id = ? AND last_played IS NOT NULL 
          GROUP BY id
          ORDER BY last_played DESC LIMIT 5
        `).all(userId);

        // 2. Friends' activity (latest additions to shared groups)
        const friendsActivity = db.prepare(`
          SELECT g.*, u.username as added_by, u.avatar as user_avatar, gr.name as group_name
          FROM games g
          JOIN users u ON g.user_id = u.id
          JOIN groups gr ON g.group_id = gr.id
          JOIN group_members gm ON gr.id = gm.group_id
          WHERE gm.user_id = ? AND g.list_type = 'shared' AND g.user_id != ?
          ORDER BY g.created_at DESC LIMIT 5
        `).all(userId, userId);

      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      let friendsOnline = db.prepare(`
        SELECT DISTINCT u.id, u.username, u.avatar, u.online_status, u.current_game, 'app' as platform
        FROM users u
        JOIN group_members gm ON u.id = gm.user_id
        WHERE gm.group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)
        AND u.id != ?
      `).all(userId, userId);

      // Fetch Steam Friends
      if (user.steam_id && process.env.STEAM_API_KEY) {
        try {
          const steamFriendsRes = await fetch(`https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${user.steam_id}&relationship=friend`);
          if (steamFriendsRes.ok) {
            const steamFriendsData = await steamFriendsRes.json();
            const friendIds = steamFriendsData.friendslist?.friends?.map((f) => f.steamid).slice(0, 100).join(',');
            if (friendIds) {
              const summariesRes = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${friendIds}`);
              if (summariesRes.ok) {
                const summariesData = await summariesRes.json();
                const steamFriends = summariesData.response?.players?.map((p) => ({
                  id: p.steamid,
                  username: p.personaname,
                  avatar: p.avatarfull,
                  online_status: p.personastate === 0 ? 'offline' : 'online',
                  current_game: p.gameextrainfo || null,
                  platform: 'steam'
                })) || [];
                friendsOnline = [...friendsOnline, ...steamFriends];
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch Steam friends:", e);
        }
      }

      // Fetch Xbox Friends
      if (user.xbox_refresh_token && process.env.XBOX_CLIENT_ID && process.env.XBOX_CLIENT_SECRET) {
        try {
          // 1. Refresh Token
          const tokenRes = await fetch('https://login.live.com/oauth20_token.srf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.XBOX_CLIENT_ID,
              client_secret: process.env.XBOX_CLIENT_SECRET,
              grant_type: 'refresh_token',
              refresh_token: user.xbox_refresh_token
            })
          });
          
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            // Update refresh token in DB
            db.prepare("UPDATE users SET xbox_refresh_token = ? WHERE id = ?").run(tokenData.refresh_token, userId);
            
            // 2. User Token
            const userTokenRes = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-xbl-contract-version': '1' },
              body: JSON.stringify({
                RelyingParty: "http://auth.xboxlive.com",
                TokenType: "JWT",
                Properties: { AuthMethod: "RPS", SiteName: "user.auth.xboxlive.com", RpsTicket: `d=${tokenData.access_token}` }
              })
            });
            
            if (userTokenRes.ok) {
              const userTokenData = await userTokenRes.json();
              const userToken = userTokenData.Token;
              
              // 3. XSTS Token
              const xstsRes = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-xbl-contract-version': '1' },
                body: JSON.stringify({
                  RelyingParty: "http://xboxlive.com",
                  TokenType: "JWT",
                  Properties: { UserTokens: [userToken], SandboxId: "RETAIL" }
                })
              });
              
              if (xstsRes.ok) {
                const xstsData = await xstsRes.json();
                const xstsToken = xstsData.Token;
                const userHash = xstsData.DisplayClaims.xui[0].uhs;
                
                // 4. Get Friends
                const peopleRes = await fetch('https://peoplehub.xboxlive.com/users/me/people/social/decoration/detail,preferredColor,presenceDetail', {
                  headers: {
                    'x-xbl-contract-version': '2',
                    'Authorization': `XBL3.0 x=${userHash};${xstsToken}`,
                    'Accept-Language': 'en-US'
                  }
                });
                
                if (peopleRes.ok) {
                  const peopleData = await peopleRes.json();
                  const xboxFriends = peopleData.people?.map((p) => {
                    const isOnline = p.presenceState === 'Online';
                    let currentGame = null;
                    if (isOnline && p.presenceDetails && p.presenceDetails.length > 0) {
                      const title = p.presenceDetails.find((d) => d.IsGame);
                      if (title) currentGame = title.PresenceText || null;
                    }
                    return {
                      id: p.xuid,
                      username: p.gamertag,
                      avatar: p.displayPicRaw,
                      online_status: isOnline ? 'online' : 'offline',
                      current_game: currentGame,
                      platform: 'xbox'
                    };
                  }) || [];
                  friendsOnline = [...friendsOnline, ...xboxFriends];
                }
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch Xbox friends:", e);
        }
      }

      // Sort friends: online first, then by username
      friendsOnline.sort((a, b) => {
        if (a.online_status === 'online' && b.online_status !== 'online') return -1;
        if (a.online_status !== 'online' && b.online_status === 'online') return 1;
        return (a.username || '').localeCompare(b.username || '');
      });

      // Split into platform buckets expected by frontend
      const friendsOnlineSplit = {
        steam: (friendsOnline).filter(f => f.platform === 'steam'),
        xbox: (friendsOnline).filter(f => f.platform === 'xbox'),
        discord: (friendsOnline).filter(f => f.platform === 'discord'),
        app: (friendsOnline).filter(f => f.platform === 'app'),
      };

      // 2.2 Recent Achievements (User + Friends)
      // We'll mock some achievements based on launcher_games for now
      const recentAchievements = db.prepare(`
        SELECT lg.title as game_title, lg.artwork as game_artwork, u.username, u.avatar as user_avatar, lg.achievements
        FROM launcher_games lg
        JOIN users u ON lg.user_id = u.id
        WHERE (u.id = ? OR u.id IN (
          SELECT user_id FROM group_members WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)
        ))
        AND lg.achievements IS NOT NULL
        ORDER BY lg.last_played DESC LIMIT 6
      `).all(userId, userId);

      // Parse achievements JSON
      const formattedAchievements = recentAchievements.flatMap((item) => {
        try {
          const achs = JSON.parse(item.achievements);
          return achs.slice(0, 2).map((a) => ({
            ...a,
            gameTitle: item.game_title,
            gameArtwork: item.game_artwork,
            username: item.username,
            userAvatar: item.user_avatar
          }));
        } catch (e) {
          return [];
        }
      });

      // 3. Suggested from Log (QuestLog)
      const suggestedLog = db.prepare(`
        SELECT * FROM games 
        WHERE user_id = ? AND status = 'to-play'
        ORDER BY RANDOM() LIMIT 5
      `).all(userId);

      // 3.1 Suggested from Library
      const suggestedLibrary = db.prepare(`
        SELECT * FROM launcher_games
        WHERE user_id = ?
        ORDER BY RANDOM() LIMIT 5
      `).all(userId);

      // 4. Stats & History
      const stats = {
        totalBacklog: db.prepare("SELECT COUNT(*) as count FROM games WHERE user_id = ?").get(userId),
        totalLibrary: db.prepare("SELECT COUNT(*) as count FROM launcher_games WHERE user_id = ?").get(userId),
        totalPlaytime: db.prepare("SELECT SUM(playtime) as total FROM launcher_games WHERE user_id = ?").get(userId),
        genreStats: db.prepare(`
          SELECT genre, COUNT(*) as count 
          FROM launcher_games 
          WHERE user_id = ? AND genre IS NOT NULL
          GROUP BY genre
        `).all(userId),
      };

      // Playtime history (last 7 days)
      const history = db.prepare(`
        SELECT date, SUM(playtime_minutes) as minutes 
        FROM playtime_logs 
        WHERE user_id = ? AND date >= date('now', '-30 days')
        GROUP BY date
        ORDER BY date ASC
      `).all(userId);

      // 5. Suggestions (Similar to library/most played)
      const suggestions = db.prepare(`
        SELECT * FROM games 
        WHERE user_id != ? AND list_type = 'shared'
        AND title NOT IN (SELECT title FROM launcher_games WHERE user_id = ?)
        ORDER BY RANDOM() LIMIT 6
      `).all(userId, userId);

      // 6. Price Drops & Game Pass Updates
      const updates = {
        priceDrops: db.prepare(`
          SELECT * FROM games 
          WHERE user_id = ? AND lowest_price IS NOT NULL
          ORDER BY RANDOM() LIMIT 3
        `).all(userId),
        gamePass: db.prepare(`
          SELECT * FROM games 
          WHERE game_pass = 1
          ORDER BY created_at DESC LIMIT 3
        `).all(),
      };

      res.json({
        recentlyPlayed,
        friendsActivity,
        friendsOnline: friendsOnlineSplit,
        recentAchievements: formattedAchievements,
        suggestedLog,
        suggestedLibrary,
        suggestions,
        history,
        updates,
        discordGuildId: (user)?.discord_guild_id || null,
        discordLinked: !!(user)?.discord_id,
        stats: {
          backlogCount: stats.totalBacklog?.count || 0,
          libraryCount: stats.totalLibrary?.count || 0,
          playtimeHours: Math.round((stats.totalPlaytime?.total || 0) / 60),
          weeklyPlaytimeHours: Math.round(((db.prepare(`
            SELECT SUM(playtime_minutes) as total FROM playtime_logs
            WHERE user_id = ? AND date >= date('now', '-7 days')
          `).get(userId))?.total || 0) / 60),
          genreStats: stats.genreStats
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch home data" });
    }
  });

  // Group Routes
  app.post("/api/groups", authenticateToken, (req, res) => {
    const { name } = req.body;
    const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const info = db.prepare("INSERT INTO groups (name, invite_code) VALUES (?, ?)").run(name, invite_code);
    db.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)").run(info.lastInsertRowid, req.user.id);
    
    res.json({ id: info.lastInsertRowid, name, invite_code });
  });

  app.post("/api/groups/join", authenticateToken, (req, res) => {
    const { invite_code } = req.body;
    const group = db.prepare("SELECT * FROM groups WHERE invite_code = ?").get(invite_code);
    
    if (!group) return res.status(404).json({ error: "Group not found" });
    
    try {
      db.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)").run(group.id, req.user.id);
      res.json(group);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        res.status(400).json({ error: "Already a member" });
      } else {
        res.status(500).json({ error: "Failed to join group" });
      }
    }
  });

  app.get("/api/groups", authenticateToken, (req, res) => {
    const groups = db.prepare(`
      SELECT g.* FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
    `).all(req.user.id);
    res.json(groups);
  });

  // Game Routes
  app.get("/api/games", authenticateToken, (req, res) => {
    const games = db.prepare(`
      SELECT * FROM games 
      WHERE user_id = ? OR group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)
      ORDER BY created_at DESC
    `).all(req.user.id, req.user.id);
    res.json(games);
  });

  app.post("/api/games", authenticateToken, (req, res) => {
    const { title, artwork, banner, logo, genre, tags, description, steam_url, game_pass, allkeyshop_url, lowest_price, list_type, group_id, release_date, metacritic, steam_rating } = req.body;
    const type = list_type === 'shared' ? 'shared' : 'private';
    
    let userId = null;
    let groupId = null;

    if (type === 'private') {
      userId = Number(req.user.id);
    } else {
      if (!group_id) return res.status(400).json({ error: "Group ID required for shared list" });
      
      const gId = Number(group_id);
      const uId = Number(req.user.id);
      
      // Check if user is member of the group
      const membership = db.prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(gId, uId);
      if (!membership) {
        return res.status(403).json({ error: "Not a member of this group" });
      }
      groupId = gId;
    }
    
    try {
      const info = db.prepare(`
        INSERT INTO games (title, artwork, banner, logo, genre, tags, description, steam_url, game_pass, allkeyshop_url, lowest_price, list_type, release_date, metacritic, steam_rating, user_id, group_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(title, artwork, banner, logo, genre, tags, description, steam_url, game_pass ? 1 : 0, allkeyshop_url, lowest_price, type, release_date, metacritic || null, steam_rating || null, userId, groupId);
      
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      console.error("Failed to add game:", error);
      if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        res.status(400).json({ error: "Foreign key constraint failed. Ensure the group exists." });
      } else {
        res.status(500).json({ error: "Failed to add game" });
      }
    }
  });

  app.patch("/api/games/:id/artwork", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { artwork, banner, horizontal_grid, logo } = req.body;
    try {
      const updates: string[] = [];
      const params = [];
      
      if (artwork !== undefined) { updates.push("artwork = ?"); params.push(artwork); }
      if (banner !== undefined) { updates.push("banner = ?"); params.push(banner); }
      if (horizontal_grid !== undefined) { updates.push("horizontal_grid = ?"); params.push(horizontal_grid); }
      if (logo !== undefined) { updates.push("logo = ?"); params.push(logo); }
      
      if (updates.length === 0) return res.status(400).json({ error: "No artwork, banner, horizontal_grid, or logo provided" });
      
      params.push(Number(id), req.user.id, req.user.id);
      
      const result = db.prepare(`
        UPDATE games SET ${updates.join(", ")} 
        WHERE id = ? AND (
          user_id = ? OR 
          group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)
        )
      `).run(...params);
      
      res.json({ success: true, changes: result.changes });
    } catch (error) {
      res.status(500).json({ error: "Failed to update artwork" });
    }
  });

  app.patch("/api/launcher/games/:id/artwork", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { artwork, banner, horizontal_grid, logo } = req.body;
    try {
      const updates: string[] = [];
      const params = [];
      
      if (artwork !== undefined) { updates.push("artwork = ?"); params.push(artwork); }
      if (banner !== undefined) { updates.push("banner = ?"); params.push(banner); }
      if (horizontal_grid !== undefined) { updates.push("horizontal_grid = ?"); params.push(horizontal_grid); }
      if (logo !== undefined) { updates.push("logo = ?"); params.push(logo); }
      
      if (updates.length === 0) return res.status(400).json({ error: "No artwork, banner, horizontal_grid, or logo provided" });
      
      params.push(Number(id), req.user.id);
      
      const result = db.prepare(`
        UPDATE launcher_games SET ${updates.join(", ")} 
        WHERE id = ? AND user_id = ?
      `).run(...params);
      
      res.json({ success: true, changes: result.changes });
    } catch (error) {
      res.status(500).json({ error: "Failed to update launcher artwork" });
    }
  });

  app.patch("/api/games/:id/tags", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { tags } = req.body;
    try {
      const result = db.prepare(`
        UPDATE games SET tags = ? 
        WHERE id = ? AND (
          user_id = ? OR 
          group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)
        )
      `).run(tags, Number(id), req.user.id, req.user.id);
      res.json({ success: true, changes: result.changes });
    } catch (error) {
      res.status(500).json({ error: "Failed to update tags" });
    }
  });

  app.delete("/api/games/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    try {
      const result = db.prepare(`
        DELETE FROM games 
        WHERE id = ? AND (
          user_id = ? OR 
          group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)
        )
      `).run(Number(id), req.user.id, req.user.id);
      res.json({ success: true, changes: result.changes });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete game" });
    }
  });

  // Friends who own a questlog game, looked up by Steam appId
  app.get("/api/questlog/games/friends", authenticateToken, async (req, res) => {
    const { appId } = req.query;
    if (!appId) return res.json([]);
    try {
      const userId = req.user.id;
      const user = db.prepare("SELECT steam_id FROM users WHERE id = ?").get(userId);
      const results = [];

      if (user?.steam_id && process.env.STEAM_API_KEY) {
        try {
          const friendListRes = await fetch(
            `https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${user.steam_id}&relationship=friend`
          );
          if (friendListRes.ok) {
            const friendIds: string[] = ((await friendListRes.json()).friendslist?.friends || []).map((f) => f.steamid);
            if (friendIds.length > 0) {
              const summaryMap: Record<string, any> = {};
              const summariesRes = await fetch(
                `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${friendIds.slice(0, 100).join(',')}`
              );
              if (summariesRes.ok) {
                for (const p of ((await summariesRes.json()).response?.players || [])) summaryMap[p.steamid] = p;
              }
              const checks = friendIds.slice(0, 50).map(async (steamid) => {
                try {
                  const ownedRes = await fetch(
                    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steamid}&include_appinfo=0&format=json`
                  );
                  if (!ownedRes.ok) return null;
                  const found = ((await ownedRes.json()).response?.games || []).find((g) => String(g.appid) === String(appId));
                  if (!found) return null;
                  const s = summaryMap[steamid];
                  const stateMap: Record<number, string> = { 0: 'offline', 1: 'online', 2: 'busy', 3: 'away', 4: 'away', 5: 'away', 6: 'in_game' };
                  return {
                    username: s?.personaname || steamid,
                    avatar: s?.avatarfull || null,
                    online_status: s?.gameid ? 'in_game' : (stateMap[s?.personastate ?? 0] ?? 'offline'),
                    current_game: s?.gameextrainfo || null,
                    last_played: found.rtime_last_played || null,
                    platform: 'steam'
                  };
                } catch { return null; }
              });
              results.push(...(await Promise.all(checks)).filter(Boolean));
            }
          }
        } catch (e) { console.error('Questlog Steam friends error:', e); }
      }

      results.sort((a, b) => {
        const rank = (s) => s === 'in_game' ? 0 : s === 'online' ? 1 : s === 'away' ? 2 : 3;
        return rank(a.online_status) - rank(b.online_status) || a.username.localeCompare(b.username);
      });
      res.json(results);
    } catch (e) {
      console.error('Questlog friends error:', e);
      res.status(500).json({ error: 'Failed to fetch friends' });
    }
  });

  app.post("/api/games/clear", authenticateToken, (req, res) => {
    const { list_type, group_id } = req.body;
    try {
      let result;
      if (list_type === 'private') {
        result = db.prepare("DELETE FROM games WHERE list_type = 'private' AND user_id = ?").run(req.user.id);
      } else if (list_type === 'shared' && group_id) {
        result = db.prepare(`
          DELETE FROM games 
          WHERE list_type = 'shared' AND group_id = ? AND 
          group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)
        `).run(group_id, req.user.id);
      } else {
        return res.status(400).json({ error: "Invalid clear request" });
      }
      res.json({ success: true, changes: result.changes });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear games" });
    }
  });

  // Force development mode unless explicitly production
  const isProd = process.env.NODE_ENV === "production";
  console.log(`Starting QuestLog in ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

  // Vite middleware for development
  if (!isProd) {
    console.log("Initializing Vite middleware...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files from dist...");
    const staticPath = __dirname.endsWith('dist') ? __dirname : path.join(__dirname, "dist");
    app.use(express.static(staticPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`QuestLog Server active on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();