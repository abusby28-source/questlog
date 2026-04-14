import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { readdirSync, statSync } from "fs";
import { GoogleGenAI } from "@google/genai";

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

  CREATE TABLE IF NOT EXISTS friendships (
    requester_id INTEGER NOT NULL,
    addressee_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (requester_id, addressee_id),
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS game_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT,
    game_title TEXT,
    game_artwork TEXT,
    steam_app_id TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
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
    metacritic INTEGER,
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
    if (launcherSchema && !launcherSchema.sql.includes("session_start")) {
      db.exec("ALTER TABLE launcher_games ADD COLUMN session_start TEXT");
    }
    if (launcherSchema && !launcherSchema.sql.includes("metacritic")) {
      db.exec("ALTER TABLE launcher_games ADD COLUMN metacritic INTEGER");
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
      // Clear out fake Steam search-only URLs so games without a real App ID get the IGDB button
      const hasFixedSteamUrls = db.prepare("SELECT * FROM migrations WHERE name = 'clear_search_steam_urls'").get();
      if (!hasFixedSteamUrls) {
        db.exec("UPDATE games SET steam_url = NULL WHERE steam_url LIKE '%/search/%' AND steam_url NOT LIKE '%/app/%'");
        db.exec("INSERT INTO migrations (name) VALUES ('clear_search_steam_urls')");
        console.log("Migration: cleared fake Steam search URLs from games table");
      }
      // Clear the wrong Baby Goat Billy steam_url that was stored for Electrician Simulator
      const hasFixedElectrician = db.prepare("SELECT * FROM migrations WHERE name = 'fix_electrician_simulator_url'").get();
      if (!hasFixedElectrician) {
        db.exec("UPDATE games SET steam_url = NULL WHERE title LIKE '%Electrician Simulator%' AND steam_url LIKE '%/app/1628980%'");
        db.exec("INSERT INTO migrations (name) VALUES ('fix_electrician_simulator_url')");
        console.log("Migration: cleared wrong steam_url for Electrician Simulator");
      }
      // Add created_by to groups table
      const groupsSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='groups'").get();
      if (groupsSchema && !groupsSchema.sql.includes("created_by")) {
        try {
          db.exec("ALTER TABLE groups ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL");
          // Backfill: set created_by to the first member who joined each group (the creator)
          db.exec(`
            UPDATE groups SET created_by = (
              SELECT user_id FROM group_members WHERE group_id = groups.id ORDER BY rowid ASC LIMIT 1
            ) WHERE created_by IS NULL
          `);
        } catch(e) {}
      }
    } catch(e) {}

    try { db.prepare("ALTER TABLE games ADD COLUMN previous_price TEXT").run(); } catch {}
    try { db.prepare("ALTER TABLE games ADD COLUMN price_dropped INTEGER DEFAULT 0").run(); } catch {}
    try { db.prepare("ALTER TABLE games ADD COLUMN game_pass_new INTEGER DEFAULT 0").run(); } catch {}
    try { db.prepare("ALTER TABLE games ADD COLUMN game_pass_added_at TEXT").run(); } catch {}

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
    if (!userColumns.includes('ea_access_token')) {
      console.log("Adding ea_access_token to users...");
      db.exec("ALTER TABLE users ADD COLUMN ea_access_token TEXT");
    }
    if (!userColumns.includes('ea_persona_id')) {
      console.log("Adding ea_persona_id to users...");
      db.exec("ALTER TABLE users ADD COLUMN ea_persona_id TEXT");
    }
    if (!userColumns.includes('ea_display_name')) {
      console.log("Adding ea_display_name to users...");
      db.exec("ALTER TABLE users ADD COLUMN ea_display_name TEXT");
    }
    if (!userColumns.includes('epic_account_id')) {
      db.exec("ALTER TABLE users ADD COLUMN epic_account_id TEXT");
    }
    if (!userColumns.includes('epic_refresh_token')) {
      db.exec("ALTER TABLE users ADD COLUMN epic_refresh_token TEXT");
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

    // Look up user in local DB; auto-create a stub row if this is a remote-auth user
    let dbUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
    if (!dbUser) {
      try {
        // Insert a stub row so platform connections (Xbox, Steam etc.) can be stored locally
        db.prepare("INSERT OR IGNORE INTO users (id, username, password) VALUES (?, ?, ?)").run(user.id, user.username, '');
        dbUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
      } catch {}
    }
    if (!dbUser) return res.sendStatus(403);

    const { password, ...userWithoutPassword } = dbUser;
    req.user = userWithoutPassword;
    next();
  });
};

// ── STEAM INSTALL DETECTION ──────────────────────────────────────────────────
// Reads all Steam library folders from registry + libraryfolders.vdf, returns installed appId set.
async function getInstalledSteamAppIds(): Promise<Set<string>> {
  const localAppIds = new Set<string>();
  if (process.platform !== 'win32') return localAppIds;
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const fs = await import('fs');
    const os = await import('os');
    const execAsync = promisify(exec);
    // PS script reads Steam install path from registry, then all library folders from libraryfolders.vdf
    const psScript = `$steamRoot = (Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\WOW6432Node\\Valve\\Steam' -Name InstallPath -EA SilentlyContinue).InstallPath
if (-not $steamRoot) { $steamRoot = 'C:\\Program Files (x86)\\Steam' }
$paths = @("$steamRoot\\steamapps")
$vdf = "$steamRoot\\steamapps\\libraryfolders.vdf"
if (Test-Path $vdf) {
  $content = [IO.File]::ReadAllText($vdf)
  [regex]::Matches($content, '"path"\\s+"([^"]+)"') | ForEach-Object {
    $p = $_.Groups[1].Value.Replace('\\\\', '\\')
    $paths += "$p\\steamapps"
  }
}
($paths | Select-Object -Unique) | Where-Object { Test-Path $_ } | ForEach-Object {
  Get-ChildItem -Path $_ -Filter 'appmanifest_*.acf' -ErrorAction SilentlyContinue |
    ForEach-Object { $_.Name -replace '^appmanifest_','' -replace '\\.acf$','' } |
    Where-Object { $_ -match '^\\d+$' }
} | Select-Object -Unique`;
    const tmpFile = path.join(os.tmpdir(), `steam_scan_${Date.now()}.ps1`);
    await fs.promises.writeFile(tmpFile, psScript, 'utf8');
    try {
      const { stdout } = await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`, { timeout: 15000 });
      if (stdout?.trim()) {
        stdout.trim().split('\n').map(l => l.trim()).filter(id => id && /^\d+$/.test(id)).forEach(id => localAppIds.add(id));
      }
    } finally {
      fs.promises.unlink(tmpFile).catch(() => {});
    }
  } catch (e) {
    console.error('Failed to get Steam local installs:', e);
  }
  return localAppIds;
}

// ── TAGS PIPELINE ────────────────────────────────────────────────────────────
// Picks the best logo from a SteamGridDB logos array, preferring English then wide aspect ratio.
function pickBestLogo(logos: any[]): string | undefined {
  if (!logos?.length) return undefined;
  const enLogos = logos.filter((l: any) => !l.language || l.language === 'en');
  const pool = enLogos.length ? enLogos : logos;
  const whites = pool.filter((l: any) => l.style === 'white' || l.style === 'custom');
  const candidates = whites.length ? whites : pool;
  return [...candidates].sort((a: any, b: any) => (b.width / b.height) - (a.width / a.height))[0]?.url;
}

// Returns top SteamSpy community tags for a given Steam appid, or null if unavailable.
async function fetchSteamSpyTags(appid: string): Promise<string | null> {
  try {
    const res = await fetch(`https://steamspy.com/api.php?request=appdetails&appid=${appid}`);
    const data = await res.json().catch(() => ({}));
    if (data.tags && typeof data.tags === 'object') {
      const tagNames = Object.keys(data.tags).slice(0, 15);
      return tagNames.length ? tagNames.join(', ') : null;
    }
  } catch (e) { /* ignore */ }
  return null;
}

// Scrapes Steam community tags directly from the store page (fallback when SteamSpy has no data).
async function fetchSteamStoreTags(appid: string): Promise<string | null> {
  try {
    const res = await fetch(`https://store.steampowered.com/app/${appid}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': 'birthtime=0; mature_content=1; wants_mature_content=1'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Steam embeds tag data in InitAppTagModal JS call
    const m = html.match(/InitAppTagModal\s*\(\s*\d+\s*,\s*(\[[\s\S]*?\])\s*,/);
    if (m) {
      const tagData: any[] = JSON.parse(m[1]);
      const names = tagData.map((t: any) => t.name).filter(Boolean).slice(0, 10);
      if (names.length) return names.join(', ');
    }
    // Fallback: match <a class="app_tag"> elements
    const tagMatches = [...html.matchAll(/<a[^>]+class="[^"]*app_tag[^"]*"[^>]*>\s*([^<]+?)\s*<\/a>/g)];
    const names = tagMatches.map(m => m[1].trim()).filter(n => n.length > 0 && n.length < 40).slice(0, 10);
    return names.length ? names.join(', ') : null;
  } catch { return null; }
}

// Generates Steam-style tags via Gemini for games with no Steam presence.
async function generateTagsWithGemini(title: string, igdbContext?: string): Promise<{ tags: string } | { error: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const prompt = igdbContext
    ? `You are a game tagging expert. Using the factual game data below, generate 8-10 Steam-style community tags for "${title}". Tags should reflect the actual gameplay mechanics, perspective, setting, and features — in the style Steam community tags use (e.g. "Space Sim, Multiplayer, First-Person, Open World, Sci-fi, Sandbox"). Return only a comma-separated list of tags, nothing else.\n${igdbContext}`
    : `You are a game tagging expert. List 8-10 Steam-style community tags for the video game "${title}" based strictly on its actual genre, gameplay mechanics, and setting. Return only a comma-separated list of tags, nothing else.`;
  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0 } });
  const models = ['gemini-3.1-flash-lite-preview', 'gemini-3-flash-preview'];
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 3000));
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
        );
        const data = await res.json().catch(() => ({}));
        if (data.error?.code === 503) continue; // retry / try next model
        if (data.error) { console.warn(`[Gemini tags] ${model} error: ${data.error.message}`); break; } // try next model
        const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return { tags: text };
      } catch { /* ignore, retry */ }
    }
  }
  return { error: 'Gemini is currently unavailable. Please try again later.' };
}

// Full tag pipeline:
//   Steam game  → SteamSpy by appid
//   Other game  → Steam Store name search → SteamSpy if found → Gemini fallback
async function fetchTagsForGame(title: string, platform: string, externalId?: string, igdbContext?: string): Promise<string | null> {
  let resolvedAppId = platform === 'steam' ? externalId : undefined;

  if (resolvedAppId) {
    const tags = await fetchSteamSpyTags(resolvedAppId);
    if (tags) return tags;
    // SteamSpy had no data — scrape the Steam store page directly
    const storeTags = await fetchSteamStoreTags(resolvedAppId);
    if (storeTags) return storeTags;
    // Both appid-based lookups failed — fall through to title search below.
    // This handles Steam games whose external_id was changed to an Xbox title ID by the merge step.
  }

  // Title-based Steam store search: used for non-Steam platforms, or as fallback when appid lookup fails.
  try {
    const searchRes = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=US`
    );
    const searchData = await searchRes.json().catch(() => ({}));
    if (searchData.items?.length) {
      const queryClean = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const queryWords = queryClean.split(/\s+/).filter((w: string) => w.length > 1);
      const match = searchData.items.find((i: any) => {
        const nameClean = i.name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        if (nameClean === queryClean) return true;
        return queryWords.length > 0 && queryWords.every((w: string) => new RegExp(`\\b${w}\\b`).test(nameClean));
      });
      if (match) {
        const appid = String(match.id);
        const tags = await fetchSteamSpyTags(appid);
        if (tags) return tags;
        const storeTags = await fetchSteamStoreTags(appid);
        if (storeTags) return storeTags;
      }
    }
  } catch { /* ignore */ }

  const result = await generateTagsWithGemini(title, igdbContext);
  if (!result) return null;
  if ('error' in result) throw new Error(result.error);
  return result.tags;
}

// ── STEAMGRIDDB ARTWORK HELPER ───────────────────────────────────────────────
// Returns { artwork, banner, logo } from SteamGridDB by searching for a game title.
// Falls back to the provided defaults if SGDB has no results or the key is missing.
async function fetchSgdbArtwork(
  title: string,
  sgdbKey: string | undefined,
  defaults: { artwork: string; banner: string; logo: string }
): Promise<{ artwork: string; banner: string; logo: string }> {
  let { artwork, banner, logo } = defaults;
  if (!sgdbKey) return { artwork, banner, logo };
  try {
    const searchRes = await fetch(
      `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(title)}`,
      { headers: { Authorization: `Bearer ${sgdbKey}` } }
    );
    const searchData = await searchRes.json().catch(() => ({}));
    if (!searchData.success || !searchData.data?.length) return { artwork, banner, logo };
    const _nc = (n: string) => n.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const _qc = _nc(title);
    const _qw = _qc.split(/\s+/).filter((w: string) => w.length > 0);
    const _best = searchData.data.find((g: any) => _nc(g.name) === _qc)
      || searchData.data.find((g: any) => { const n = _nc(g.name); return _qw.every((w: string) => new RegExp(`\\b${w}\\b`).test(n)); })
      || searchData.data[0];
    const gameId = _best.id;

    const [gridRes, heroRes, logoRes] = await Promise.all([
      fetch(`https://www.steamgriddb.com/api/v2/grids/game/${gameId}?dimensions=600x900,342x482,660x930`, { headers: { Authorization: `Bearer ${sgdbKey}` } }),
      fetch(`https://www.steamgriddb.com/api/v2/heroes/game/${gameId}`, { headers: { Authorization: `Bearer ${sgdbKey}` } }),
      fetch(`https://www.steamgriddb.com/api/v2/logos/game/${gameId}`, { headers: { Authorization: `Bearer ${sgdbKey}` } }),
    ]);

    const [gridData, heroData, logoData] = await Promise.all([
      gridRes.json().catch(() => ({})),
      heroRes.json().catch(() => ({})),
      logoRes.json().catch(() => ({})),
    ]);

    if (gridData.success && gridData.data?.length) artwork = gridData.data[0].url;
    if (heroData.success && heroData.data?.length) banner = heroData.data[0].url;
    if (logoData.success && logoData.data?.length) {
      logo = pickBestLogo(logoData.data);
    }
  } catch (e) {
    console.error(`SGDB fetch error for "${title}":`, e);
  }
  return { artwork, banner, logo };
}

// ── STEAM FRIENDS HELPER ─────────────────────────────────────────────────────
async function getSteamFriendsForGame(steamAppId: string, steamUserId: string, apiKey: string): Promise<any[]> {
  try {
    const friendListRes = await fetch(
      `https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${apiKey}&steamid=${steamUserId}&relationship=friend`
    );
    if (!friendListRes.ok) return [];
    const friendIds: string[] = ((await friendListRes.json()).friendslist?.friends || []).map((f: any) => f.steamid);
    if (!friendIds.length) return [];

    const summaryMap: Record<string, any> = {};
    const summariesRes = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${friendIds.slice(0, 100).join(',')}`
    );
    if (summariesRes.ok) {
      for (const p of ((await summariesRes.json()).response?.players || [])) summaryMap[p.steamid] = p;
    }

    const stateMap: Record<number, string> = { 0: 'offline', 1: 'online', 2: 'busy', 3: 'away', 4: 'away', 5: 'away', 6: 'in_game' };

    const checks = friendIds.slice(0, 50).map(async (steamid: string) => {
      try {
        // appids_filter limits response to only this game — faster and more targeted than full library fetch
        const ownedRes = await fetch(
          `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamid}&include_appinfo=0&include_played_free_games=1&appids_filter%5B0%5D=${steamAppId}&format=json`
        );
        if (!ownedRes.ok) return null;
        const ownedData = await ownedRes.json();
        const games = ownedData.response?.games || [];
        const found = games.find((g: any) => String(g.appid) === String(steamAppId));
        if (!found) return null;

        const s = summaryMap[steamid];
        const isCurrentlyPlaying = s?.gameid && String(s.gameid) === String(steamAppId);

        let lastPlayed: number | null = null;
        if (isCurrentlyPlaying) {
          lastPlayed = Math.floor(Date.now() / 1000);
        } else if (found.rtime_last_played > 0) {
          lastPlayed = found.rtime_last_played;
        } else {
          // rtime_last_played is 0 — fall back to recently played (covers last 2 weeks)
          try {
            const recentRes = await fetch(
              `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${apiKey}&steamid=${steamid}&format=json`
            );
            if (recentRes.ok) {
              const recentGames = (await recentRes.json()).response?.games || [];
              const recentMatch = recentGames.find((g: any) => String(g.appid) === String(steamAppId));
              if (recentMatch) {
                // Played within 2 weeks but no exact timestamp — use mid-point estimate (7 days ago)
                lastPlayed = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
              }
            }
          } catch { /* ignore */ }
        }

        console.log(`[Steam friends] ${s?.personaname || steamid}: rtime=${found.rtime_last_played}, lastPlayed=${lastPlayed}`);

        return {
          username: s?.personaname || steamid,
          avatar: s?.avatarfull || null,
          online_status: isCurrentlyPlaying ? 'in_game' : (stateMap[s?.personastate ?? 0] ?? 'offline'),
          current_game: s?.gameextrainfo || null,
          last_played: lastPlayed,
          platform: 'steam'
        };
      } catch { return null; }
    });
    return (await Promise.all(checks)).filter(Boolean);
  } catch (e) {
    console.error('getSteamFriendsForGame error:', e);
    return [];
  }
}

// ── XBOX FRIENDS HELPER ──────────────────────────────────────────────────────
// xboxTitleId: numeric string to match exactly, or null to fall back to name matching
// fallbackTitle: game title to use for name matching when xboxTitleId is not available
async function getXboxFriendsForTitle(xboxTitleId: string | null, userId: number, fallbackTitle?: string): Promise<any[]> {
  if (!xboxTitleId && !fallbackTitle) return [];
  const user = db.prepare("SELECT xbox_refresh_token FROM users WHERE id = ?").get(userId) as any;
  if (!user?.xbox_refresh_token || !process.env.XBOX_CLIENT_ID || !process.env.XBOX_CLIENT_SECRET) return [];
  try {
    const tokenRes = await fetch('https://login.live.com/oauth20_token.srf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.XBOX_CLIENT_ID!,
        client_secret: process.env.XBOX_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: user.xbox_refresh_token
      })
    });
    if (!tokenRes.ok) return [];
    const tokenData = await tokenRes.json();
    db.prepare("UPDATE users SET xbox_refresh_token = ? WHERE id = ?").run(tokenData.refresh_token, userId);
    const userTokenRes = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-xbl-contract-version': '1' },
      body: JSON.stringify({ RelyingParty: 'http://auth.xboxlive.com', TokenType: 'JWT', Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${tokenData.access_token}` } })
    });
    if (!userTokenRes.ok) return [];
    const userTokenData = await userTokenRes.json();
    const xstsRes = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-xbl-contract-version': '1' },
      body: JSON.stringify({ RelyingParty: 'http://xboxlive.com', TokenType: 'JWT', Properties: { UserTokens: [userTokenData.Token], SandboxId: 'RETAIL' } })
    });
    if (!xstsRes.ok) return [];
    const xstsData = await xstsRes.json();
    const xstsToken = xstsData.Token;
    const userHash = xstsData.DisplayClaims.xui[0].uhs;
    const xblHeaders: Record<string, string> = {
      'x-xbl-contract-version': '2',
      'Authorization': `XBL3.0 x=${userHash};${xstsToken}`,
      'Accept-Language': 'en-US',
      'Accept': 'application/json'
    };
    const peopleRes = await fetch(
      'https://peoplehub.xboxlive.com/users/me/people/social/decoration/detail,presenceDetail',
      { headers: xblHeaders }
    );
    if (!peopleRes.ok) return [];
    const people = (await peopleRes.json()).people || [];
    const friendChecks = people.map(async (person: any) => {
      const isOnline = person.presenceState === 'Online';
      const activeTitle = (person.presenceDetails || []).find((d: any) => d.IsGame);
      const presenceTitleId = activeTitle?.TitleId ? String(activeTitle.TitleId) : null;
      // Check if currently playing this game (by titleId if we have it, else by name)
      const inGameByTitle = xboxTitleId && presenceTitleId === xboxTitleId;
      const inGameByName = !xboxTitleId && fallbackTitle && activeTitle &&
        (activeTitle.TitleName || activeTitle.PresenceText || '').toLowerCase().includes(fallbackTitle.toLowerCase());
      if (inGameByTitle || inGameByName) {
        return { username: person.gamertag, avatar: person.displayPicRaw || null, online_status: 'in_game', current_game: activeTitle?.PresenceText || null, platform: 'xbox' };
      }
      if (!person.xuid) return null;
      try {
        const friendThRes = await fetch(
          `https://titlehub.xboxlive.com/users/xuid(${person.xuid})/titles/titlehistory/decoration/detail`,
          { headers: xblHeaders }
        );
        if (!friendThRes.ok) return null;
        const titles = (await friendThRes.json()).titles || [];
        if (!xboxTitleId && fallbackTitle) {
          console.log(`[Xbox friends name-match] "${person.gamertag}" has titles:`, titles.slice(0, 10).map((t: any) => t.name || t.title || '(no name)'));
        }
        const matchingTitle = titles.find((t: any) => {
          if (xboxTitleId) return String(t.titleId) === xboxTitleId;
          if (!fallbackTitle) return false;
          const tname = (t.name || t.title || '').toLowerCase();
          const fname = fallbackTitle.toLowerCase();
          return tname === fname || tname.includes(fname) || fname.includes(tname);
        });
        if (!matchingTitle) return null;
        const lastPlayedIso = matchingTitle.titleHistory?.lastTimePlayed;
        const lastPlayedTs = lastPlayedIso ? Math.floor(new Date(lastPlayedIso).getTime() / 1000) : null;
        return {
          username: person.gamertag,
          avatar: person.displayPicRaw || null,
          online_status: isOnline ? 'online' : 'offline',
          current_game: isOnline ? (activeTitle?.PresenceText || null) : null,
          last_played: lastPlayedTs,
          platform: 'xbox'
        };
      } catch { return null; }
    });
    return (await Promise.all(friendChecks)).filter(Boolean);
  } catch (e) {
    console.error('getXboxFriendsForTitle error:', e);
    return [];
  }
}

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
      const response = await fetch(`https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(q)}`);
      const items = await response.json().catch(() => []);
      const data = { items: (Array.isArray(items) ? items : []).map((i: any) => ({ name: i.name, id: i.appid, tiny_image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${i.appid}/capsule_sm_120.jpg` })) };
      // Filter out non-game items (tools, soundtracks, wallpaper apps, etc.)
      const NON_GAME_RE = /\bsoundtrack\b|\bost\b|\bdlc\b|\bdemo\b|\bplaytest\b|\bbundle\b|\bwallpaper\b|creation kit|\bartbook\b|art book|game engine|dedicated server|modding tool/i;
      if (Array.isArray(data?.items)) {
        data.items = data.items.filter((item: any) => {
          if (!item.name) return false;
          if (NON_GAME_RE.test(item.name)) return false;
          // Steam type field: 'game' is valid; 'dlc', 'software', 'video', 'hardware' are not
          if (item.type && item.type !== 'game') return false;
          return true;
        });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to search Steam" });
    }
  });

  // Combined game search: Steam first, IGDB fallback for non-Steam PC titles
  app.get("/api/game-suggestions", async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json([]);
    const NON_GAME_RE = /\bsoundtrack\b|\bost\b|\bdlc\b|\bdemo\b|\bplaytest\b|\bbundle\b|\bwallpaper\b|creation kit|\bartbook\b|art book|game engine|dedicated server|modding tool/i;

    try {
      // Use steamcommunity SearchApps — not blocked server-side unlike storesearch
      const steamRes = await fetch(`https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(q)}`);
      const steamItems: any[] = await steamRes.json().catch(() => []);
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
      const queryWords = norm(q).split(/\s+/).filter(w => w.length > 1);
      // A Steam result is relevant only if every query word appears as a whole word in the title
      const isRelevant = (name: string) => {
        const n = norm(name);
        return queryWords.every(w => new RegExp(`\\b${w}\\b`).test(n));
      };

      const filtered = (Array.isArray(steamItems) ? steamItems : []).filter((item: any) => {
        if (!item.name) return false;
        if (NON_GAME_RE.test(item.name)) return false;
        return true;
      });

      // Only use Steam results if at least one is actually relevant to the query
      const relevant = filtered.filter((item: any) => isRelevant(item.name));
      if (relevant.length > 0) {
        return res.json(relevant.slice(0, 8).map((item: any) => ({
          title: item.name,
          platform: 'Steam',
          thumb: `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/capsule_sm_120.jpg`,
          steamAppID: String(item.appid),
        })));
      }
    } catch (e) {
      console.error(`[game-suggestions] Steam fetch failed:`, e);
    }

    // IGDB fallback — PC-only, non-Steam games
    try {
      const clientId = process.env.IGDB_CLIENT_ID;
      const token = await getIgdbToken();
      if (!clientId || !token) return res.json([]);

      const igdbRes = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: { 'Client-ID': clientId, 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: `search "${q.replace(/"/g, '\\"')}"; fields name,first_release_date,platforms.abbreviation,platforms.id,cover.url,category,websites.url,websites.category; limit 12;`,
      });
      const igdbData = await igdbRes.json().catch(() => []);
      if (!Array.isArray(igdbData)) return res.json([]);

      const results = igdbData
        .filter((g: any) => g.category === undefined || g.category === null || ![1, 3, 5, 7].includes(g.category))
        .filter((g: any) => !g.platforms?.length || g.platforms.some((p: any) => [6, 14, 3].includes(p.id)))
        .filter((g: any) => !g.websites?.some((w: any) => w.category === 13 && w.url?.includes('store.steampowered.com')))
        .slice(0, 8)
        .map((g: any) => ({
          title: g.name,
          year: g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear().toString() : undefined,
          platform: g.platforms?.map((p: any) => p.abbreviation).filter(Boolean).slice(0, 3).join(', ') || undefined,
          thumb: g.cover?.url ? g.cover.url.replace('t_thumb', 't_cover_small').replace(/^\/\//, 'https://') : undefined,
        }));

      return res.json(results);
    } catch (e) {
      console.error('game-suggestions error:', e);
      return res.json([]);
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

  // Tags pipeline endpoint — SteamSpy → Steam Store search → Gemini
  app.get("/api/tags", async (req, res) => {
    const { title, platform, external_id } = req.query;
    if (!title) return res.status(400).json({ error: "title required" });
    const tags = await fetchTagsForGame(String(title), String(platform || ''), String(external_id || '') || undefined);
    res.json({ tags });
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

// Recursively find a key's value in a nested object
function findValueByKey(obj: any, key: string, depth = 0): any {
  if (depth > 12 || obj === null || typeof obj !== "object") return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
  for (const v of (Array.isArray(obj) ? obj : Object.values(obj))) {
    const found = findValueByKey(v, key, depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
}

async function fetchMetacriticUserScore(title: string): Promise<number | null> {
  const slug = title.toLowerCase()
    .replace(/[''`']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const url = `https://www.metacritic.com/game/${slug}/`;
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });
    console.log(`[Metacritic] ${title} → ${url} → HTTP ${r.status}`);
    if (!r.ok) return null;
    const html = await r.text();

    // Metacritic now uses Nuxt.js with a devalue-compressed state.
    // In that format "userScore" is the review COUNT (integer), NOT the score.
    // The actual user score float (e.g. 8.3) appears as a bare literal immediately
    // after a standalone {"score":<ref>} object in the Nuxt payload array.
    // Strategy: locate the game's own slug in the HTML to anchor to the right section,
    // then search nearby for the {"score":<ref>},<float> pattern.

    // Metacritic now uses Nuxt with devalue-compressed state.
    // The user score float (e.g. 8.3) appears as a bare literal immediately after
    // a standalone {"score":<ref>} object in the Nuxt payload array.
    // Anchor search to the game's own slug to avoid picking up related-games scores.
    const slugLiteral = `"${slug}"`;
    // Check every occurrence of the slug (it may appear in meta tags, breadcrumbs,
    // and Nuxt state — we want the one adjacent to score data)
    let searchFrom = 0;
    while (true) {
      const slugIdx = html.indexOf(slugLiteral, searchFrom);
      if (slugIdx < 0) break;
      // Devalue stores primitive values before the objects that reference them,
      // so search both before (-3000) and after (+5000) the slug occurrence
      const chunk = html.slice(Math.max(0, slugIdx - 3000), slugIdx + 5000);
      const scoreMatch = chunk.match(/\{"score":\d+\},([\d]+\.[\d]+)/);
      if (scoreMatch) {
        const n = parseFloat(scoreMatch[1]);
        console.log(`[Metacritic] ${title} → score near slug at ${slugIdx}: ${n}`);
        if (n >= 0.1 && n <= 10.0) return n;
      }
      searchFrom = slugIdx + slugLiteral.length;
    }

    console.log(`[Metacritic] ${title} → no score found`);
    return null;
  } catch (e) {
    console.log(`[Metacritic] ${title} → fetch error: ${e}`);
    return null;
  }
}

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
        body: `search "${title.replace(/"/g, '\\"')}"; fields name,genres.name,themes.name,summary,first_release_date,websites.url,websites.category,aggregated_rating,aggregated_rating_count; limit 10;`
      });
      const data = await response.json();

      if (data && data.length > 0) {
        const nameClean = (n: string) => n.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        const queryClean = nameClean(title);
        const queryWords = queryClean.split(/\s+/).filter((w: string) => w.length > 0);
        // Exact match first, then word-boundary match (prevents "star" matching "starward")
        const game = data.find((g: any) => nameClean(g.name) === queryClean)
          || data.find((g: any) => {
            const n = nameClean(g.name);
            return queryWords.every((w: string) => new RegExp(`\\b${w}\\b`).test(n));
          });
        if (!game) {
          return res.json({ tags: null, description: null, genre: null, release_date: null });
        }
        const tags = [];
        if (game.genres) tags.push(...game.genres.map((g) => g.name));
        if (game.themes) tags.push(...game.themes.map((t) => t.name));
        let release_date: string | null = null;
        if (game.first_release_date) {
          try {
            release_date = new Date(game.first_release_date * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
          } catch { /* ignore */ }
        }
        // Extract Steam App ID from IGDB websites (category 13 = Steam)
        let steamAppID: string | null = null;
        if (game.websites?.length) {
          const steamSite = game.websites.find((w: any) => w.category === 13 && w.url?.includes('store.steampowered.com'));
          if (steamSite) {
            const m = steamSite.url.match(/store\.steampowered\.com\/app\/(\d+)/);
            if (m) steamAppID = m[1];
          }
        }
        // Only scrape Metacritic for non-Steam games — Steam games use Steam reviews instead
        let metacritic: number | null = null;
        if (!steamAppID) {
          const userScore = await fetchMetacriticUserScore(title);
          if (userScore !== null) metacritic = Math.round(userScore * 10);
        }
        res.json({
          tags: tags.length > 0 ? tags.join(', ') : null,
          description: game.summary || null,
          genre: game.genres && game.genres.length > 0 ? game.genres[0].name : null,
          release_date,
          steamAppID,
          metacritic,
        });
      } else {
        res.json({ tags: null, description: null, genre: null, release_date: null });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch IGDB data" });
    }
  });

  // Debug endpoint — tests IGDB queries step by step
  app.get("/api/debug/igdb", async (req, res) => {
    const clientId = process.env.IGDB_CLIENT_ID;
    const token = await getIgdbToken();
    if (!clientId || !token) return res.json({ error: 'no credentials' });

    const twoMonthsAgo = Math.floor((Date.now() - 60 * 24 * 60 * 60 * 1000) / 1000);
    const now = Math.floor(Date.now() / 1000);

    const igdb = async (endpoint: string, body: string) => {
      const r = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
        method: 'POST',
        headers: { 'Client-ID': clientId, Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body
      });
      return { status: r.status, data: await r.json().catch(() => 'parse error') };
    };

    const results: Record<string, any> = { twoMonthsAgo, now };

    // 1. Bare minimum — any games at all
    results.test1_any_games = await igdb('games', 'fields name,first_release_date; limit 3;');
    // 2. Games released recently (no platform filter)
    results.test2_recent_no_platform = await igdb('games', `fields name,first_release_date; where first_release_date >= ${twoMonthsAgo} & first_release_date <= ${now}; sort first_release_date desc; limit 5;`);
    // 3. Add category=0 filter
    results.test3_recent_category0 = await igdb('games', `fields name,first_release_date,category; where first_release_date >= ${twoMonthsAgo} & first_release_date <= ${now} & category = 0; sort first_release_date desc; limit 5;`);
    // 4. Add platform 6 (Windows)
    results.test4_recent_pc = await igdb('games', `fields name,first_release_date,platforms; where first_release_date >= ${twoMonthsAgo} & first_release_date <= ${now} & category = 0 & platforms = (6); sort first_release_date desc; limit 5;`);
    // 5. release_dates endpoint, platform 6
    results.test5_release_dates_pc = await igdb('release_dates', `fields date,game.name,platform; where platform = 6 & date >= ${twoMonthsAgo} & date <= ${now}; sort date desc; limit 5;`);

    res.json(results);
  });

  // Debug endpoint — inspects Metacritic HTML structure to identify score key/format
  app.get("/api/debug/metacritic", async (req, res) => {
    const title = String(req.query.title || 'Hogwarts Legacy');
    const slug = title.toLowerCase()
      .replace(/[''`']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const url = `https://www.metacritic.com/game/${slug}/`;
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(12000),
      });
      const html = r.ok ? await r.text() : '';

      // 1. Which embedded data formats are present
      const hasNextData = /<script id="__NEXT_DATA__"/.test(html);
      const hasNuxtState = /window\.__NUXT__/.test(html);
      const hasApolloState = /window\.__APOLLO_STATE__/.test(html);
      const hasReduxState = /window\.__REDUX/.test(html);

      // 2. All JSON-LD blocks (schema.org)
      const ldJsonBlocks: any[] = [];
      for (const m of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
        try { ldJsonBlocks.push(JSON.parse(m[1])); } catch { ldJsonBlocks.push('parse_error'); }
      }

      // 3. Context around every "Score" / "score" / "rating" key mention (first 8)
      const scoreContexts: string[] = [];
      const scoreRe = /"(?:userScore|criticScore|metaScore|score|ratingValue|userRating|aggregateRating)":/gi;
      let sm: RegExpExecArray | null;
      while ((sm = scoreRe.exec(html)) !== null && scoreContexts.length < 8) {
        scoreContexts.push(html.slice(Math.max(0, sm.index - 20), sm.index + 150));
      }

      // 4. All float values (X.X) near "score" / "rating" word
      const floatScoreMatches = [...html.matchAll(/"(?:score|rating|userRating|ratingValue)"\s*:\s*"?([\d]+\.[\d]+)"?/gi)]
        .slice(0, 10).map(m => ({ key: m[0].split('"')[1], value: m[1] }));

      res.json({
        title, slug, url,
        httpStatus: r.status,
        htmlLength: html.length,
        embeddedDataFormats: { hasNextData, hasNuxtState, hasApolloState, hasReduxState },
        ldJsonBlocks,
        scoreContexts,
        floatScoreMatches,
        currentFunctionResult: await fetchMetacriticUserScore(title),
      });
    } catch (e: any) {
      res.json({ title, slug, url, error: e.message });
    }
  });

  // Debug endpoint — shows Gemini title list + Steam AppID resolution for a tag
  app.get("/api/debug/gemini-tag", async (req, res) => {
    const tag = String(req.query.tag || 'World War I');
    const model = String(req.query.model || 'gemini-3-flash-preview');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.json({ error: 'no GEMINI_API_KEY' });
    const prompt = `Show me a list of the current top 30 games on Steam with the tag ${tag}. Show just the game titles, one per line, numbered.`;
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: AbortSignal.timeout(30000) }
      );
      const data = await r.json();
      const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      // Parse titles
      const titles: string[] = [];
      for (const raw of rawText.split('\n')) {
        const line = raw.replace(/\*\*/g, '').replace(/^\s*\d+[\.\)]\s*/, '').replace(/^\s*[-*]\s*/, '').replace(/\s*[-–—].*$/, '').trim();
        if (line && line.length > 1) titles.push(line);
      }
      // Resolve AppIDs
      const resolved: { title: string; steamAppID: string | null; steamName: string | null }[] = [];
      for (let i = 0; i < titles.length; i += 5) {
        const batch = titles.slice(i, i + 5);
        const batchResults = await Promise.all(batch.map(async (title) => {
          try {
            const sr = await fetch(`https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(title)}`, { signal: AbortSignal.timeout(5000) });
            const items: any[] = await sr.json().catch(() => []);
            if (!Array.isArray(items) || items.length === 0) return { title, steamAppID: null, steamName: null };
            const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
            const exact = items.find(i => norm(i.name) === norm(title));
            const pick = exact ?? items[0];
            return { title, steamAppID: String(pick.appid), steamName: pick.name };
          } catch { return { title, steamAppID: null, steamName: null }; }
        }));
        resolved.push(...batchResults);
      }
      const seenIds = new Set<string>();
      const duplicates = resolved.filter(r => { if (!r.steamAppID) return false; if (seenIds.has(r.steamAppID)) return true; seenIds.add(r.steamAppID); return false; });
      res.json({
        model, prompt, httpStatus: r.status,
        apiError: data.error ?? null,
        finishReason: data.candidates?.[0]?.finishReason ?? null,
        rawText, titlesFound: titles.length, resolved,
        duplicates: duplicates.map(d => `${d.title} → ${d.steamAppID} (${d.steamName})`),
      });
    } catch (e: any) {
      res.json({ model, prompt, error: e.message });
    }
  });

  // IGDB multi-result suggestions for the Add Game search box
  app.get("/api/igdb/suggestions", async (req, res) => {
    const query = String(req.query.q || '').trim();
    if (!query) return res.json([]);
    try {
      const clientId = process.env.IGDB_CLIENT_ID;
      const token = await getIgdbToken();
      if (!clientId || !token) {
        console.error('IGDB suggestions: no client ID or token');
        return res.json([]);
      }

      // No `where` filter — IGDB search + where category can silently drop games
      // whose category field is null/unset. Filter client-side instead.
      const response = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: { 'Client-ID': clientId, 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: `search "${query.replace(/"/g, '\\"')}"; fields name,first_release_date,platforms.abbreviation,cover.url,category,websites.url,websites.category; limit 12;`
      });

      const data = await response.json();
      if (!Array.isArray(data) || (data[0] && data[0].status)) {
        console.error('IGDB suggestions error:', data);
        return res.json([]);
      }

      const suggestions = data
        // Filter out DLC (1), bundles (3), seasons (7), mods (5) — keep main games, expansions, remakes etc.
        .filter((g: any) => g.category === undefined || g.category === null || ![1, 3, 5, 7].includes(g.category))
        // PC-only: include games that have PC (id 6), Mac (14), or Linux (3), or no platform data
        .filter((g: any) => {
          if (!g.platforms || g.platforms.length === 0) return true;
          return g.platforms.some((p: any) => [6, 14, 3].includes(p.id));
        })
        // Exclude games that are on Steam — those should come from Steam search, not IGDB fallback
        .filter((g: any) => !g.websites?.some((w: any) => w.category === 13 && w.url?.includes('store.steampowered.com')))
        .slice(0, 8)
        .map((g: any) => ({
          title: g.name,
          year: g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear().toString() : undefined,
          platform: g.platforms?.map((p: any) => p.abbreviation).filter(Boolean).slice(0, 3).join(', ') || undefined,
          thumb: g.cover?.url
            ? g.cover.url.replace('t_thumb', 't_cover_small').replace(/^\/\//, 'https://')
            : undefined,
        }));

      res.json(suggestions);
    } catch (e) {
      console.error('IGDB suggestions error:', e);
      res.json([]);
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

  // Price cache: title → { price, deal_url, timestamp }
  const priceCache = new Map<string, { price: string; deal_url: string; timestamp: number }>();
  const PRICE_CACHE_MS = 12 * 60 * 60 * 1000; // 12 hours

  async function fetchItadPrice(title: string, steamAppId: string): Promise<{ price: string; deal_url: string } | null> {
    const itadKey = process.env.ITAD_API_KEY;
    if (!itadKey) return null;

    try {
      let gameId: string | null = null;
      let itadSlug: string | null = null;

      // 1. Lookup by Steam App ID
      if (steamAppId) {
        const r = await fetch(`https://api.isthereanydeal.com/games/lookup/v1?key=${itadKey}&appid=${steamAppId}`,
          { signal: AbortSignal.timeout(8000) });
        if (r.ok) {
          const d = await r.json();
          if (d.found && d.game?.id) { gameId = d.game.id; itadSlug = d.game.slug; }
        }
      }

      // 2. Fallback: search by title — validate match to avoid false positives (e.g. "Star Citizen" → "Star Wars")
      if (!gameId) {
        const r = await fetch(`https://api.isthereanydeal.com/games/search/v1?key=${itadKey}&title=${encodeURIComponent(title)}&results=5`,
          { signal: AbortSignal.timeout(8000) });
        if (r.ok) {
          const d = await r.json();
          const normWords = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 1);
          const searchWords = normWords(title);
          const match = (Array.isArray(d) ? d : []).find((g: any) => {
            if (!g?.title) return false;
            const resultWords = new Set(normWords(g.title));
            const overlap = searchWords.filter(w => resultWords.has(w)).length;
            return overlap / searchWords.length >= 0.7;
          });
          if (match?.id) { gameId = match.id; itadSlug = match.slug; }
        }
      }

      if (!gameId) return null;

      // 3. Get prices in GBP
      const r = await fetch(`https://api.isthereanydeal.com/games/prices/v3?key=${itadKey}&country=GB`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify([gameId]), signal: AbortSignal.timeout(8000) });
      if (!r.ok) return null;

      const data = await r.json();
      const deals: any[] = data[0]?.deals || [];
      if (!deals.length) return null;

      const cheapest = deals
        .filter((d: any) => d.price?.amount > 0)
        .sort((a: any, b: any) => a.price.amount - b.price.amount)[0];
      if (!cheapest) return null;

      const price = cheapest.price.amount.toFixed(2);
      const deal_url = itadSlug
        ? `https://isthereanydeal.com/game/${itadSlug}/info/`
        : (cheapest.url || `https://isthereanydeal.com/`);

      return { price, deal_url };
    } catch (e: any) {
      console.error(`[Price] ITAD failed for "${title}":`, e?.message?.slice(0, 120) ?? e);
      return null;
    }
  }

  app.get("/api/itad/price", async (req, res) => {
    const title = String(req.query.title || "");
    const steamAppId = String(req.query.steamAppId || "");
    if (!title) return res.status(400).json({ error: "title required" });

    // 1. In-memory cache
    const cached = priceCache.get(title);
    if (cached && Date.now() - cached.timestamp < PRICE_CACHE_MS) {
      return res.json({ price: cached.price, allkeyshop_url: cached.deal_url });
    }

    // 2. DB cache (strip currency symbol so frontend parseFloat works correctly)
    if (steamAppId) {
      const existing = db.prepare("SELECT lowest_price, allkeyshop_url FROM games WHERE steam_url LIKE ? AND lowest_price IS NOT NULL LIMIT 1")
        .get(`%/app/${steamAppId}%`) as any;
      if (existing?.lowest_price) {
        const rawNum = parseFloat(String(existing.lowest_price).replace(/[£$€]/g, ""));
        if (!isNaN(rawNum) && rawNum > 0) {
          const price = rawNum.toFixed(2);
          priceCache.set(title, { price, deal_url: existing.allkeyshop_url || "", timestamp: Date.now() });
          return res.json({ price, allkeyshop_url: existing.allkeyshop_url || null });
        }
      }
    }

    // 3. ITAD API — fallback to game website if no price found
    const result = await fetchItadPrice(title, steamAppId);
    if (result) {
      priceCache.set(title, { price: result.price, deal_url: result.deal_url, timestamp: Date.now() });
      console.log(`[Price] ITAD "${title}": £${result.price}`);
      return res.json({ price: result.price, allkeyshop_url: result.deal_url });
    }

    const fallbackUrl = await fetchItadFallbackUrl(title, String((req as any).query.steamUrl || ""));
    return res.json({ price: null, allkeyshop_url: fallbackUrl });
  });

  async function fetchItadFallbackUrl(title: string, steamUrl: string): Promise<string | null> {
    // Use Steam store page if available
    if (steamUrl && steamUrl.includes("store.steampowered.com")) return steamUrl;

    // Try IGDB for the game's official website
    try {
      const clientId = process.env.IGDB_CLIENT_ID;
      const token = await getIgdbToken();
      if (!clientId || !token) return null;
      const r = await fetch("https://api.igdb.com/v4/games", {
        method: "POST",
        headers: { "Client-ID": clientId, "Authorization": `Bearer ${token}` },
        body: `search "${title.replace(/"/g, '\\"')}"; fields name,websites.url,websites.category; limit 3;`,
        signal: AbortSignal.timeout(6000),
      });
      if (!r.ok) return null;
      const data = await r.json().catch(() => []);
      if (!Array.isArray(data) || !data[0]?.websites?.length) return null;
      // Category 1 = official site, 13 = Steam, 15 = itch.io
      const official = data[0].websites.find((w: any) => w.category === 1);
      const steam = data[0].websites.find((w: any) => w.category === 13);
      return (official || steam)?.url || null;
    } catch {
      return null;
    }
  }

  async function refreshPricesForUser(userId: number): Promise<{ updated: number; linked: number; skipped: number; total: number }> {
    const userGames = db.prepare("SELECT id, title, steam_url, lowest_price FROM games WHERE user_id = ? AND status != 'completed'")
      .all(userId) as any[];

    let updated = 0, linked = 0, skipped = 0;

    for (const game of userGames) {
      const steamMatch = game.steam_url?.match(/\/app\/(\d+)/);
      const steamAppId = steamMatch?.[1] || "";

      const result = await fetchItadPrice(game.title, steamAppId);
      if (result) {
        const newPriceStr = `£${result.price}`;
        const previousPrice: string | null = game.lowest_price || null;

        // Determine if price dropped noticeably
        let priceDrop = false;
        if (previousPrice && newPriceStr) {
          const prevNum = parseFloat(previousPrice.replace(/^[£$]/, ''));
          const newNum = parseFloat(newPriceStr.replace(/^[£$]/, ''));
          if (!isNaN(prevNum) && !isNaN(newNum) && prevNum > 0) {
            const isMoreThan10PctCheaper = newNum < prevNum * 0.9;
            const isMoreThan1Cheaper = (prevNum - newNum) > 1;
            if (isMoreThan10PctCheaper || isMoreThan1Cheaper) {
              priceDrop = true;
            }
          }
        }

        if (priceDrop) {
          db.prepare("UPDATE games SET lowest_price = ?, allkeyshop_url = ?, price_dropped = 1, previous_price = ? WHERE id = ?")
            .run(newPriceStr, result.deal_url, previousPrice, game.id);
        } else {
          db.prepare("UPDATE games SET lowest_price = ?, allkeyshop_url = ? WHERE id = ?")
            .run(newPriceStr, result.deal_url, game.id);
        }
        priceCache.set(game.title, { price: result.price, deal_url: result.deal_url, timestamp: Date.now() });
        updated++;
      } else {
        // No ITAD price — always overwrite with fallback link (clears stale Allkeyshop URLs)
        const fallback = await fetchItadFallbackUrl(game.title, game.steam_url || "");
        priceCache.delete(game.title);
        if (fallback) {
          db.prepare("UPDATE games SET lowest_price = NULL, allkeyshop_url = ?, price_dropped = 0, previous_price = NULL WHERE id = ?").run(fallback, game.id);
          linked++;
        } else {
          db.prepare("UPDATE games SET lowest_price = NULL, allkeyshop_url = NULL, price_dropped = 0, previous_price = NULL WHERE id = ?").run(game.id);
          skipped++;
        }
      }

      await new Promise(r => setTimeout(r, 200)); // gentle rate limiting
    }

    console.log(`[Price] Bulk refresh: ${updated} priced, ${linked} linked, ${skipped} skipped`);
    return { updated, linked, skipped, total: userGames.length };
  }

  app.post("/api/games/refresh-prices", authenticateToken, async (req, res) => {
    const result = await refreshPricesForUser((req as any).user.id);
    res.json(result);
  });

  async function checkGamePassForUser(userId: number): Promise<void> {
    const catalog = await getGamePassTitles();
    if (!catalog.size) return;
    const userGames = db.prepare("SELECT id, title, game_pass FROM games WHERE user_id = ?").all(userId) as any[];
    const nc = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    for (const game of userGames) {
      const normalized = nc(game.title);
      const words = normalized.split(/\s+/).filter((w: string) => w.length > 1);
      const onPass = catalog.has(normalized) || (words.length > 0 && [...catalog.keys()].some(t => words.every((w: string) => t.includes(w))));
      if (onPass && !game.game_pass) {
        // Newly added to Game Pass — flag it
        db.prepare("UPDATE games SET game_pass = 1, game_pass_new = 1, game_pass_added_at = ? WHERE id = ? AND user_id = ?").run(new Date().toISOString(), game.id, userId);
      } else if (onPass && game.game_pass) {
        // Already marked on Game Pass — just ensure game_pass stays 1, don't touch game_pass_new
        db.prepare("UPDATE games SET game_pass = 1 WHERE id = ? AND user_id = ?").run(game.id, userId);
      } else if (!onPass && game.game_pass) {
        // Removed from Game Pass
        db.prepare("UPDATE games SET game_pass = 0, game_pass_new = 0 WHERE id = ? AND user_id = ?").run(game.id, userId);
      }
    }
  }

  app.patch("/api/games/:id/dismiss-game-pass-alert", authenticateToken, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("UPDATE games SET game_pass_new = 0 WHERE id = ? AND user_id = ?").run(Number(id), req.user.id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to dismiss game pass alert" });
    }
  });

  // Game Pass catalog cache: normalized title → product ID
  let gpTitleMap: Map<string, string> | null = null;
  let gpTitleMapExpiry = 0;

  async function buildGamePassCatalog(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    try {
      // Step 1: Get all PC Game Pass product IDs from the official sigls endpoint
      const siglsRes = await fetch(
        'https://catalog.gamepass.com/sigls/v2?id=fdd9e2a7-0fee-49f6-ad69-4354098401ff&language=en-gb&market=GB',
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      if (!siglsRes.ok) return map;
      const items: any[] = await siglsRes.json();
      const ids = items.map((i: any) => i.id).filter(Boolean);

      // Step 2: Batch-fetch product titles from the MS display catalog (20 IDs per request)
      const batchSize = 20;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        try {
          const catRes = await fetch(
            `https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=${batch.join(',')}&market=GB&languages=en-gb&MS-CV=0`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          if (catRes.ok) {
            const catData = await catRes.json();
            for (const product of (catData.Products || [])) {
              const t = product.LocalizedProperties?.[0]?.ProductTitle;
              const pid = product.ProductId;
              if (t && pid) {
                map.set(t.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim(), pid);
              }
            }
          }
        } catch { /* skip failed batch */ }
      }
      console.log(`Game Pass catalog built: ${map.size} titles`);
    } catch (e) {
      console.error('Failed to build Game Pass catalog:', e);
    }
    return map;
  }

  async function getGamePassTitles(): Promise<Map<string, string>> {
    const now = Date.now();
    if (gpTitleMap && now < gpTitleMapExpiry) return gpTitleMap;
    gpTitleMap = await buildGamePassCatalog();
    gpTitleMapExpiry = Date.now() + 6 * 60 * 60 * 1000; // 6 hour cache
    return gpTitleMap;
  }

  // Pre-warm the Game Pass catalog in the background on server start
  setTimeout(() => getGamePassTitles().catch(() => {}), 5000);

  // Discover rows cache (globally shared, refreshes every 12 hours)
  let discoverCache: { recentlyReleased: any[], trending: any[], gamePass: any[], epicFree: any[], timestamp: number } | null = null;
  const DISCOVER_CACHE_TTL = 12 * 60 * 60 * 1000;

  // Per-user suggested-for-you cache — auto-refreshes weekly
  const suggestedCache = new Map<number, { data: any[]; timestamp: number }>();
  const SUGGESTED_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

  // Per-user friends activity cache — raw items only (no artwork, no DB match IDs), refreshes once per day
  const friendsActivityCache = new Map<number, { items: any[]; timestamp: number }>();
  const FRIENDS_ACTIVITY_TTL = 24 * 60 * 60 * 1000;

  // Short-lived artwork cache so repeated home page loads don't hammer SGDB
  const horizontalArtworkCache = new Map<string, { url: string; timestamp: number }>();
  const ARTWORK_CACHE_TTL = 60 * 60 * 1000; // 1 hour

  async function getHorizontalArtworkCached(title: string, steamAppID?: string): Promise<string> {
    const key = `${steamAppID || ''}:${title.toLowerCase()}`;
    const cached = horizontalArtworkCache.get(key);
    if (cached && Date.now() - cached.timestamp < ARTWORK_CACHE_TTL) return cached.url;
    const url = await getHorizontalArtwork(title, steamAppID);
    horizontalArtworkCache.set(key, { url, timestamp: Date.now() });
    return url;
  }

  app.get('/api/gamepass/check', async (req, res) => {
    const title = String(req.query.title || '');
    if (!title) return res.status(400).json({ error: 'title required' });
    try {
      const catalog = await getGamePassTitles();
      if (!catalog.size) return res.json({ game_pass: false });

      const normalized = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

      // Exact match
      if (catalog.has(normalized)) return res.json({ game_pass: true });

      // Word match: all query words appear in a catalog title (handles subtitle variations)
      const words = normalized.split(/\s+/).filter((w: string) => w.length > 1);
      if (words.length > 0) {
        for (const [catalogTitle] of catalog) {
          if (words.every((w: string) => catalogTitle.includes(w))) {
            return res.json({ game_pass: true });
          }
        }
      }
      return res.json({ game_pass: false });
    } catch (e) {
      console.error('Game Pass check error:', e);
      return res.json({ game_pass: false });
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

  // SteamgridDB Portrait Grid by Steam App ID — redirect to best portrait or Steam CDN fallback
  app.get("/api/steamgriddb/portrait/:appid", async (req, res) => {
    const { appid } = req.params;
    try {
      const apiKey = process.env.STEAMGRIDDB_API_KEY;
      if (!apiKey) return res.redirect(`https://shared.steamstatic.com/store_item_assets/steam/apps/${appid}/library_600x900_2x.jpg`);
      const response = await fetch(`https://www.steamgriddb.com/api/v2/grids/steam/${appid}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const data = await response.json().catch(() => ({}));
      if (data.success && data.data?.length) {
        const nonAlt = data.data.filter((d: any) => d.style !== 'alternate');
        const pool = nonAlt.length ? nonAlt : [];
        const official = pool.find((d: any) => d.style === 'official');
        const pick = official || pool[0];
        if (pick?.url) { res.set('Cache-Control', 'public, max-age=86400'); return res.redirect(pick.url); }
      }
      res.set('Cache-Control', 'public, max-age=86400');
      res.redirect(`https://shared.steamstatic.com/store_item_assets/steam/apps/${appid}/library_600x900_2x.jpg`);
    } catch { res.redirect(`https://shared.steamstatic.com/store_item_assets/steam/apps/${appid}/library_600x900_2x.jpg`); }
  });

  // SteamgridDB Logo by Steam App ID — redirect to logo URL or 404
  app.get("/api/steamgriddb/logo/:appid", async (req, res) => {
    const { appid } = req.params;
    try {
      const apiKey = process.env.STEAMGRIDDB_API_KEY;
      if (!apiKey) return res.status(404).send('No API key');
      const response = await fetch(`https://www.steamgriddb.com/api/v2/logos/steam/${appid}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const data = await response.json().catch(() => ({}));
      if (data.success && data.data?.length) {
        const enLogos = data.data.filter((l: any) => !l.language || l.language === 'en');
        const pool = enLogos.length ? enLogos : data.data;
        const whites = pool.filter((l: any) => l.style === 'white' || l.style === 'custom');
        const candidates = whites.length ? whites : pool;
        const pick = [...candidates].sort((a: any, b: any) => (b.width / b.height) - (a.width / a.height))[0];
        if (pick?.url) { res.set('Cache-Control', 'public, max-age=86400'); return res.redirect(pick.url); }
      }
      // SGDB has no logo — scrape Steam store page for hash-based logo_2x.png
      const steamLogoUrl = await fetchSteamLogoUrl(appid);
      if (steamLogoUrl) { res.set('Cache-Control', 'public, max-age=86400'); return res.redirect(steamLogoUrl); }
      res.status(404).send('Not found');
    } catch { res.status(500).send('Error'); }
  });

  // SteamgridDB Logo by game name — autocomplete search then redirect to logo URL or 404
  app.get("/api/steamgriddb/logo-by-name/:name", async (req, res) => {
    const { name } = req.params;
    try {
      const apiKey = process.env.STEAMGRIDDB_API_KEY;
      if (!apiKey) return res.status(404).send('No API key');
      const nc = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const searchRes = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const searchData = await searchRes.json().catch(() => ({}));
      if (!searchData.success || !searchData.data?.length) return res.status(404).send('Not found');
      const best = searchData.data.find((s: any) => nc(s.name) === nc(name)) || searchData.data[0];
      if (!best) return res.status(404).send('Not found');
      const logoRes = await fetch(`https://www.steamgriddb.com/api/v2/logos/game/${best.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const logoData = await logoRes.json().catch(() => ({}));
      if (logoData.success && logoData.data?.length) {
        const enLogos = logoData.data.filter((l: any) => !l.language || l.language === 'en');
        const pool = enLogos.length ? enLogos : logoData.data;
        const whites = pool.filter((l: any) => l.style === 'white' || l.style === 'custom');
        const candidates = whites.length ? whites : pool;
        const pick = [...candidates].sort((a: any, b: any) => (b.width / b.height) - (a.width / a.height))[0];
        if (pick?.url) { res.set('Cache-Control', 'public, max-age=86400'); return res.redirect(pick.url); }
      }
      res.status(404).send('Not found');
    } catch { res.status(500).send('Error'); }
  });

  // SteamgridDB Horizontal Grid (920x430) - Used for Homepage Scrollers
  app.get("/api/steamgriddb/horizontal/:appid", async (req, res) => {
    const { appid } = req.params;
    const { t, json } = req.query;
    try {
      const apiKey = process.env.STEAMGRIDDB_API_KEY;
      // Only append cache-buster when caller explicitly requests one
      const cacheBust = t ? (t.toString().includes('?') ? `&t=${t}` : `?t=${t}`) : '';

      // Fallback to Steam's standard horizontal header
      const fallbackUrl = `https://shared.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;
      if (!apiKey) {
        if (json) return res.json({ url: fallbackUrl });
        if (!t) res.set('Cache-Control', 'public, max-age=86400');
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

        // Use clean URL when no cache-bust requested; append t only when caller provides it
        const finalUrl = t ? (selected.url.includes('?') ? `${selected.url}&t=${t}` : `${selected.url}?t=${t}`) : selected.url;
        if (!t) res.set('Cache-Control', 'public, max-age=86400');
        return res.redirect(finalUrl);
      }

      if (json) return res.json({ url: fallbackUrl });
      if (!t) res.set('Cache-Control', 'public, max-age=86400');
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
        res.set('Cache-Control', 'public, max-age=86400');
        return res.redirect(official ? official.url : data.data[0].url);
      }
      res.set('Cache-Control', 'public, max-age=86400');
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
          res.set('Cache-Control', 'public, max-age=86400');
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

          const finalUrl = t ? (selected.url.includes('?') ? `${selected.url}&t=${t}` : `${selected.url}?t=${t}`) : selected.url;
          if (!t) res.set('Cache-Control', 'public, max-age=86400');
          return res.redirect(finalUrl);
        }
      }
      res.status(404).send('Not found');
    } catch (error) {
      res.status(500).send('Error');
    }
  });

  // SteamGridDB: all artwork types by game title (for non-Steam games)
  app.get("/api/steamgriddb/artwork-by-name/:name", async (req, res) => {
    const { name } = req.params;
    try {
      const apiKey = process.env.STEAMGRIDDB_API_KEY;
      if (!apiKey) return res.json({});

      const searchRes = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const searchData = await searchRes.json().catch(() => ({}));
      if (!searchData.success || !searchData.data?.length) return res.json({});

      const sgdbNameClean = (n: string) => n.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const sgdbQueryClean = sgdbNameClean(name);
      const sgdbQueryWords = sgdbQueryClean.split(/\s+/).filter((w: string) => w.length > 0);
      const sgdbBest = searchData.data.find((g: any) => sgdbNameClean(g.name) === sgdbQueryClean)
        || searchData.data.find((g: any) => {
          const n = sgdbNameClean(g.name);
          return sgdbQueryWords.every((w: string) => new RegExp(`\\b${w}\\b`).test(n));
        });
      if (!sgdbBest) return res.json({});
      const gameId = sgdbBest.id;
      const [gridRes, heroRes, logoRes, hgridRes] = await Promise.all([
        fetch(`https://www.steamgriddb.com/api/v2/grids/game/${gameId}?dimensions=600x900,342x482,660x930`, { headers: { Authorization: `Bearer ${apiKey}` } }),
        fetch(`https://www.steamgriddb.com/api/v2/heroes/game/${gameId}`, { headers: { Authorization: `Bearer ${apiKey}` } }),
        fetch(`https://www.steamgriddb.com/api/v2/logos/game/${gameId}`, { headers: { Authorization: `Bearer ${apiKey}` } }),
        fetch(`https://www.steamgriddb.com/api/v2/grids/game/${gameId}?dimensions=920x430,460x215`, { headers: { Authorization: `Bearer ${apiKey}` } }),
      ]);

      const [gridData, heroData, logoData, hgridData] = await Promise.all([
        gridRes.json().catch(() => ({})),
        heroRes.json().catch(() => ({})),
        logoRes.json().catch(() => ({})),
        hgridRes.json().catch(() => ({})),
      ]);

      let artwork, banner, logo, horizontal_grid;
      if (gridData.success && gridData.data?.length) {
        const official = gridData.data.find((g: any) => g.style === 'official');
        artwork = official ? official.url : gridData.data[0].url;
      }
      if (heroData.success && heroData.data?.length) {
        const official = heroData.data.find((g: any) => g.style === 'official');
        banner = official ? official.url : heroData.data[0].url;
      }
      if (logoData.success && logoData.data?.length) {
        logo = pickBestLogo(logoData.data);
      }
      if (hgridData.success && hgridData.data?.length) {
        const official = hgridData.data.find((g: any) => g.style === 'official');
        horizontal_grid = official ? official.url : hgridData.data[0].url;
      }
      if (!banner && horizontal_grid) banner = horizontal_grid;

      res.json({ artwork, banner, logo, horizontal_grid });
    } catch (e) {
      res.json({});
    }
  });

  // SteamGridDB: icon by Steam App ID (for search dropdown thumbnails)
  app.get("/api/steamgriddb/icon/steam/:appid", async (req, res) => {
    const { appid } = req.params;
    const apiKey = process.env.STEAMGRIDDB_API_KEY;
    if (!apiKey) return res.json({ url: null });
    try {
      const r = await fetch(`https://www.steamgriddb.com/api/v2/icons/steam/${appid}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const data = await r.json().catch(() => ({}));
      const url = data.success && data.data?.length ? data.data[0].url : null;
      res.json({ url });
    } catch {
      res.json({ url: null });
    }
  });

  // SteamGridDB: icon by game title (for IGDB search dropdown thumbnails)
  app.get("/api/steamgriddb/icon/name/:name", async (req, res) => {
    const { name } = req.params;
    const apiKey = process.env.STEAMGRIDDB_API_KEY;
    if (!apiKey) return res.json({ url: null });
    try {
      const searchRes = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const searchData = await searchRes.json().catch(() => ({}));
      if (!searchData.success || !searchData.data?.length) return res.json({ url: null });
      const gameId = searchData.data[0].id;
      const iconRes = await fetch(`https://www.steamgriddb.com/api/v2/icons/game/${gameId}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const iconData = await iconRes.json().catch(() => ({}));
      const url = iconData.success && iconData.data?.length ? iconData.data[0].url : null;
      res.json({ url });
    } catch {
      res.json({ url: null });
    }
  });

  // Launcher Routes
  app.get("/api/launcher/games", authenticateToken, (req, res) => {
    try {
      const games = db.prepare("SELECT * FROM launcher_games WHERE user_id = ? ORDER BY last_played DESC, created_at DESC").all(req.user.id);
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch launcher games" });
    }
  });

  app.get("/api/launcher/games/:id", authenticateToken, (req, res) => {
    try {
      const game = db.prepare("SELECT * FROM launcher_games WHERE id = ? AND user_id = ?").get(Number(req.params.id), req.user.id);
      if (!game) return res.status(404).json({ error: 'Not found' });
      res.json(game);
    } catch { res.status(500).json({ error: 'Failed' }); }
  });

  app.get("/api/launcher/games/hidden", authenticateToken, (req, res) => {
    try {
      const games = db.prepare("SELECT * FROM launcher_games WHERE user_id = ? AND hidden = 1 ORDER BY title ASC").all(req.user.id);
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hidden games" });
    }
  });

  app.post("/api/launcher/games/add-local", authenticateToken, (req, res) => {
    const { title, launch_path, artwork, banner, logo, genre, tags, description, release_date } = req.body;
    if (!title?.trim() || !launch_path?.trim()) return res.status(400).json({ error: 'title and launch_path required' });
    try {
      const info = db.prepare(`
        INSERT INTO launcher_games (title, artwork, banner, logo, genre, tags, description, release_date, platform, external_id, launch_path, installed, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'local', ?, ?, 1, ?)
      `).run(
        title.trim(), artwork || '', banner || '', logo || null, genre || '', tags || '', description || '', release_date || '',
        launch_path.trim(), launch_path.trim(), req.user.id
      );
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Game already in library' });
      res.status(500).json({ error: 'Failed to add game' });
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

  // Epic Games OAuth Routes
  // Uses the well-known Epic Games Launcher client credentials (same as Heroic/Legendary)
  const EPIC_CLIENT_ID = '34a02cf8f4414e29b15921876da36f9a';
  const EPIC_CLIENT_SECRET = 'daafbccc737745039dffe53d94fc76cf';
  const EPIC_TOKEN_URL = 'https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token';
  const EPIC_ASSETS_URL = 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/Windows?label=Live';
  const EPIC_CATALOG_URL = 'https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared/bulk/items';

  async function refreshEpicAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const res = await fetch(EPIC_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${EPIC_CLIENT_ID}:${EPIC_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, token_type: 'eg1' }),
      });
      if (!res.ok) {
        console.error('Epic refresh token failed:', await res.text());
        return null;
      }
      const data = await res.json();
      return data.access_token || null;
    } catch (e: any) { console.error('Epic refresh exception:', e.message); return null; }
  }

  // Electron IPC-based Epic OAuth: renderer calls ipcRenderer.invoke('epic-oauth') → gets auth code → posts here
  app.post("/api/auth/epic/exchange", authenticateToken, async (req: any, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing code' });
    console.log('Epic exchange: code length =', String(code).length, '| preview =', String(code).substring(0, 40));

    try {
      const tokenRes = await fetch(EPIC_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${EPIC_CLIENT_ID}:${EPIC_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: String(code),
          token_type: 'eg1',
        }),
      });

      if (!tokenRes.ok) {
        const txt = await tokenRes.text();
        console.error('Epic token exchange failed:', txt);
        return res.status(400).json({ error: `Token exchange failed: ${txt}` });
      }

      const tokenData = await tokenRes.json();

      // The authorization_code grant gives a session token with a broken refresh token.
      // Use the access token to generate a real exchange code, then do a second exchange
      // with exchange_code grant to get a proper token pair with a valid refresh token.
      const exchangeRes = await fetch(
        'https://account-public-service-prod.ol.epicgames.com/account/api/oauth/exchange',
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );
      if (!exchangeRes.ok) {
        // Fall back to the initial tokens if exchange code generation fails
        console.warn('Epic exchange code generation failed, using initial tokens');
        return res.json({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          accountId: tokenData.account_id,
        });
      }
      const { code: exchangeCode } = await exchangeRes.json();

      const finalRes = await fetch(EPIC_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${EPIC_CLIENT_ID}:${EPIC_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({ grant_type: 'exchange_code', exchange_code: exchangeCode, token_type: 'eg1' }),
      });
      if (!finalRes.ok) {
        const txt = await finalRes.text();
        console.warn('Epic second exchange failed, using initial tokens:', txt);
        return res.json({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          accountId: tokenData.account_id,
        });
      }
      const finalData = await finalRes.json();
      res.json({
        accessToken: finalData.access_token,
        refreshToken: finalData.refresh_token,
        accountId: finalData.account_id,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/launcher/link-epic", authenticateToken, async (req: any, res) => {
    const { accessToken, refreshToken, accountId } = req.body;
    if (!refreshToken || !accountId) return res.status(400).json({ error: 'Missing tokens' });
    db.prepare("UPDATE users SET epic_account_id = ?, epic_refresh_token = ? WHERE id = ?")
      .run(accountId, refreshToken, req.user.id);
    res.json({ success: true });
  });

  // EA OAuth Routes
  app.get("/api/auth/ea/url", authenticateToken, (req, res) => {
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/ea/callback`;
    const params = new URLSearchParams({
      client_id: 'ORIGIN_JS_SDK',
      response_type: 'token',
      redirect_uri: redirectUri,
      release_type: 'pc'
    });
    res.json({ url: `https://accounts.ea.com/connect/auth?${params.toString()}` });
  });

  app.get("/api/auth/ea/callback", (req, res) => {
    res.send([
      '<!DOCTYPE html><html><body><script>',
      '  const hash = window.location.hash.substring(1);',
      '  const params = new URLSearchParams(hash);',
      '  const access_token = params.get("access_token");',
      '  if (access_token) {',
      '    window.opener && window.opener.postMessage({ type: "EA_AUTH_SUCCESS", access_token: access_token }, "*");',
      '  } else {',
      '    const err = params.get("error_description") || params.get("error") || "No token returned";',
      '    window.opener && window.opener.postMessage({ type: "EA_AUTH_ERROR", error: err }, "*");',
      '  }',
      '  window.close();',
      '<\/script></body></html>'
    ].join('\n'));
  });

  app.post("/api/auth/ea/link", authenticateToken, async (req, res) => {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'access_token required' });
    try {
      const gqlRes = await fetch('https://service-aggregation-layer.juno.ea.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` },
        body: JSON.stringify({ query: `query { me { player { psd displayName } } }` })
      });
      const gqlData = await gqlRes.json();
      const player = gqlData?.data?.me?.player;
      if (!player?.psd) {
        console.error('EA identity response:', JSON.stringify(gqlData));
        return res.status(400).json({ error: 'Could not get EA identity. Token may be invalid.' });
      }
      db.prepare("UPDATE users SET ea_access_token = ?, ea_persona_id = ?, ea_display_name = ? WHERE id = ?")
        .run(access_token, player.psd, player.displayName || null, req.user.id);
      res.json({ success: true, displayName: player.displayName });
    } catch (e) {
      console.error('EA link error:', e);
      res.status(500).json({ error: 'Failed to link EA account' });
    }
  });

  app.post("/api/launcher/sync-ea-achievements", authenticateToken, async (req, res) => {
    const user = db.prepare("SELECT ea_access_token, ea_persona_id FROM users WHERE id = ?").get(req.user.id) as any;
    if (!user?.ea_access_token || !user?.ea_persona_id) {
      return res.status(400).json({ error: 'EA account not linked' });
    }

    const token = user.ea_access_token;
    const psd = user.ea_persona_id;

    // Helper for GraphQL calls
    const gql = async (query: string, variables: Record<string, any> = {}) => {
      const r = await fetch('https://service-aggregation-layer.juno.ea.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ query, variables })
      });
      return r.json();
    };

    // 1. Get owned game products to map title → offerId
    let offersMap: Record<string, string> = {}; // title (lowercase) → offerId
    try {
      const ownedData = await gql(`
        query GetOwnedGames {
          me {
            player {
              ownedGameProducts {
                products {
                  id
                  name
                  originOfferId
                  gameSlug
                }
              }
            }
          }
        }
      `);
      const products: any[] = ownedData?.data?.me?.player?.ownedGameProducts?.products || [];
      for (const p of products) {
        if (p.originOfferId) {
          offersMap[p.name?.toLowerCase()] = p.originOfferId;
          if (p.gameSlug) offersMap[p.gameSlug?.toLowerCase()] = p.originOfferId;
        }
      }
      console.log(`EA Sync: found ${products.length} owned products`);
    } catch (e) {
      console.error('EA owned games fetch failed:', e);
      return res.status(500).json({ error: 'Failed to fetch EA owned games' });
    }

    // 2. For each EA launcher game, find its offerId and fetch achievements
    const eaGames = db.prepare("SELECT id, title FROM launcher_games WHERE user_id = ? AND platform = 'ea'").all(req.user.id) as any[];
    let updated = 0;

    for (const game of eaGames) {
      const titleKey = game.title.toLowerCase();
      // Try exact match, then partial match
      let offerId = offersMap[titleKey];
      if (!offerId) {
        offerId = Object.entries(offersMap).find(([k]) => k.includes(titleKey) || titleKey.includes(k))?.[1];
      }
      if (!offerId) {
        console.log(`EA Sync: no offerId found for "${game.title}"`);
        continue;
      }

      try {
        const achData = await gql(`
          query GetAchievements($offerId: String!, $playerPsd: String!, $locale: String!) {
            achievements(offerId: $offerId, playerPsd: $playerPsd, showHidden: true, locale: $locale) {
              id
              achievements {
                id
                name
                description
                awardCount
                date
              }
            }
          }
        `, { offerId, playerPsd: psd, locale: 'US' });

        const rawAchs: any[] = achData?.data?.achievements?.achievements || [];
        if (rawAchs.length === 0) {
          console.log(`EA Sync: no achievements returned for "${game.title}" (offerId: ${offerId})`);
          continue;
        }

        const formatted = rawAchs.map(a => ({
          name: a.name || 'Unknown',
          description: a.description || '',
          icon: '',
          unlocked: !!a.date,
          unlockTime: a.date ? Math.floor(new Date(a.date).getTime() / 1000) : null
        }));

        db.prepare("UPDATE launcher_games SET achievements = ? WHERE id = ?")
          .run(JSON.stringify(formatted), game.id);
        updated++;
        console.log(`EA Sync: stored ${formatted.length} achievements for "${game.title}"`);
      } catch (e) {
        console.error(`EA achievements fetch failed for "${game.title}":`, e);
      }
    }

    res.json({ success: true, updated, total: eaGames.length });
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
          // Extract fields from TitleHub API structure (decoration/detail nests things differently)
          const th = matchedTitle.titleHistory || matchedTitle.history;
          const playtime = th && typeof th.minutesPlayed === 'number' ? th.minutesPlayed
            : typeof matchedTitle.minutesPlayed === 'number' ? matchedTitle.minutesPlayed : 0;
          let lastPlayedLocal: string | null = null;
          if (th?.lastTimePlayed) {
            try {
              const d = new Date(th.lastTimePlayed);
              if (d.getTime() > 0) lastPlayedLocal = d.toISOString();
            } catch { /* ignore invalid date */ }
          }
          let xbArtwork = matchedTitle.displayImage || matchedTitle.image || '';
          let xbBanner = '';
          if (matchedTitle.mediaAssets?.length) {
            const posterAsset = matchedTitle.mediaAssets.find((m: any) =>
              ['BoxArt','Poster','SquareBoxArt','BrandedKeyArt'].includes(m.type)
            );
            const heroAsset = matchedTitle.mediaAssets.find((m: any) =>
              ['SuperHeroArt','WideHeroArt','HeroArt'].includes(m.type)
            );
            if (posterAsset?.url) xbArtwork = posterAsset.url;
            else if (matchedTitle.mediaAssets[0]?.url) xbArtwork = matchedTitle.mediaAssets[0].url;
            if (heroAsset?.url) xbBanner = heroAsset.url;
          }

          // Fetch SteamGridDB artwork (grid cover, hero banner, logo) by title
          const sgdb = await fetchSgdbArtwork(
            matchedTitle.name,
            process.env.STEAMGRIDDB_API_KEY,
            { artwork: xbArtwork, banner: xbBanner, logo: xbArtwork }
          );

          const detailGenres: string[] = matchedTitle.detail?.genres || matchedTitle.genres || [];
          const description = matchedTitle.detail?.shortDescription || matchedTitle.description || '';
          const rawReleaseDate = matchedTitle.detail?.releaseDate || matchedTitle.releaseDate || '';
          // Format ISO date to human-readable (e.g. "Feb 10, 2023") like Steam does
          const releaseDate = rawReleaseDate && /^\d{4}-\d{2}-\d{2}T/.test(rawReleaseDate)
            ? (() => { try { return new Date(rawReleaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return rawReleaseDate; } })()
            : rawReleaseDate;

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

            const xboxTags = await fetchTagsForGame(matchedTitle.name, 'xbox') || '';

            // Add the game with full Xbox data + SteamGridDB artwork
            db.prepare(`
              INSERT INTO launcher_games
                (title, platform, external_id, user_id, playtime, installed, hidden, achievements, artwork, banner, logo, description, tags, genre, release_date, last_played)
              VALUES (?, 'xbox', ?, ?, ?, 1, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              matchedTitle.name,
              titleId,
              req.user.id,
              playtime,
              achievementsJson,
              sgdb.artwork,
              sgdb.banner,
              sgdb.logo,
              description,
              xboxTags,
              detailGenres[0] || '',
              releaseDate,
              lastPlayedLocal
            );

            addedCount++;
            console.log(`✅ Added Xbox game: ${matchedTitle.name} (local: ${localGameName}, playtime: ${playtime}m)`);
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
              SET installed = 1, playtime = ?, achievements = ?, artwork = ?, banner = ?, logo = ?, description = ?, tags = ?, genre = ?, release_date = ?,
                last_played = CASE WHEN ? IS NOT NULL AND (last_played IS NULL OR ? > last_played) THEN ? ELSE last_played END
              WHERE id = ?
            `).run(
              playtime,
              achievementsJson,
              sgdb.artwork,
              sgdb.banner,
              sgdb.logo,
              description,
              detailGenres.join(','),
              detailGenres[0] || '',
              releaseDate,
              lastPlayedLocal, lastPlayedLocal, lastPlayedLocal,
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

  // Updates playtime only for Xbox games already in the library — never adds new games.
  // Uses the stored refresh token so no OAuth popup is needed.
  app.post("/api/launcher/sync-xbox-playtime", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const storedUser = db.prepare("SELECT xbox_refresh_token, xbox_id FROM users WHERE id = ?").get(userId) as any;
    if (!storedUser?.xbox_refresh_token || !storedUser?.xbox_id) {
      return res.status(400).json({ error: "Xbox account not connected." });
    }
    if (!process.env.XBOX_CLIENT_ID || !process.env.XBOX_CLIENT_SECRET) {
      return res.status(500).json({ error: "Xbox credentials not configured." });
    }

    try {
      // Auth chain using stored refresh token
      const tokenRes = await fetch('https://login.live.com/oauth20_token.srf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.XBOX_CLIENT_ID!,
          client_secret: process.env.XBOX_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: storedUser.xbox_refresh_token
        })
      });
      if (!tokenRes.ok) return res.status(401).json({ error: "Failed to refresh Xbox token. Please reconnect Xbox." });
      const tokenData = await tokenRes.json();
      db.prepare("UPDATE users SET xbox_refresh_token = ? WHERE id = ?").run(tokenData.refresh_token, userId);

      const userTokenRes = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'x-xbl-contract-version': '1' },
        body: JSON.stringify({ RelyingParty: 'http://auth.xboxlive.com', TokenType: 'JWT', Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${tokenData.access_token}` } })
      });
      if (!userTokenRes.ok) return res.status(401).json({ error: "Failed to get Xbox user token." });
      const userTokenData = await userTokenRes.json();

      const xstsRes = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'x-xbl-contract-version': '1' },
        body: JSON.stringify({ RelyingParty: 'http://xboxlive.com', TokenType: 'JWT', Properties: { UserTokens: [userTokenData.Token], SandboxId: 'RETAIL' } })
      });
      if (!xstsRes.ok) return res.status(401).json({ error: "Failed to get XSTS token." });
      const xstsData = await xstsRes.json();
      const xstsToken = xstsData.Token;
      const userHash = xstsData.DisplayClaims.xui[0].uhs;
      const xuid = storedUser.xbox_id;

      const xblHeaders = {
        'x-xbl-contract-version': '2',
        Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
        'Accept-Language': 'en-US',
        Accept: 'application/json'
      };

      // Get existing Xbox games from the library — only these will be updated
      const existingGames = db.prepare(
        "SELECT id, title, external_id FROM launcher_games WHERE user_id = ? AND platform = 'xbox' AND external_id IS NOT NULL"
      ).all(userId) as any[];

      const numericGames = existingGames.filter(g => !isNaN(Number(g.external_id)));
      if (numericGames.length === 0) return res.json({ updated: 0 });

      const PLAYTIME_STAT_RE = /minute|playtime|time.?played|play.?time|hour|second/i;
      let updated = 0;

      // For each game: fetch TitleHub detail to get SCID, then query userstats
      await Promise.all(numericGames.map(async (game) => {
        try {
          const thRes = await fetch(
            `https://titlehub.xboxlive.com/users/xuid(${xuid})/titles/titleid(${game.external_id})/decoration/detail`,
            { headers: xblHeaders }
          );
          if (!thRes.ok) return;
          const thData = await thRes.json();
          const title = (thData.titles || [])[0];
          const scid = title?.detail?.serviceConfigId || title?.serviceConfigId;
          if (!scid) return;

          const statsRes = await fetch(
            `https://userstats.xboxlive.com/users/xuid(${xuid})/scids/${scid}/stats`,
            { headers: { ...xblHeaders, 'x-xbl-contract-version': '3' } }
          );
          if (!statsRes.ok) return;
          const statsData = await statsRes.json();
          const statsList: any[] =
            statsData.stats?.statlistscollection?.[0]?.stats ||
            statsData.stats?.stats ||
            statsData.statlistscollection?.[0]?.stats ||
            statsData.stats || [];

          console.log(`Xbox playtime sync [${game.title}]:`, statsList.map(s => `${s.name}=${s.value}`).join(', ') || '(no stats)');

          for (const stat of statsList) {
            if (!PLAYTIME_STAT_RE.test(stat.name || '')) continue;
            const val = parseFloat(String(stat.value || '0'));
            if (isNaN(val) || val <= 0) continue;
            const nameLower = (stat.name || '').toLowerCase();
            const minutes = nameLower.includes('second') ? val / 60
              : nameLower.includes('hour') ? val * 60
              : val;
            const mins = Math.round(minutes);
            db.prepare("UPDATE launcher_games SET playtime = MAX(playtime, ?) WHERE id = ?").run(mins, game.id);
            updated++;
            console.log(`Xbox playtime sync [${game.title}]: "${stat.name}"=${val} → ${mins} min`);
            break;
          }
        } catch (e) { /* game doesn't have userstats */ }
      }));

      res.json({ updated });
    } catch (e) {
      console.error("Xbox playtime sync error:", e);
      res.status(500).json({ error: "Failed to sync Xbox playtime." });
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

        // Poster/cover artwork (portrait) — prefer BoxArt/Poster over wide hero images
        let artwork = t.displayImage || t.image || '';
        let banner = '';
        if (t.mediaAssets?.length) {
          const posterAsset = t.mediaAssets.find((m) =>
            ['BoxArt', 'Poster', 'SquareBoxArt', 'BrandedKeyArt'].includes(m.type)
          );
          const heroAsset = t.mediaAssets.find((m) =>
            ['SuperHeroArt', 'WideHeroArt', 'HeroArt'].includes(m.type)
          );
          if (posterAsset?.url) artwork = posterAsset.url;
          else if (t.mediaAssets[0]?.url) artwork = t.mediaAssets[0].url;
          if (heroAsset?.url) banner = heroAsset.url;
        }

        // Playtime + last played — titlehub v2 nests under titleHistory; older APIs have it at root
        let playtime = 0;
        let lastPlayed: string | null = null;
        const th = t.titleHistory || t.history;
        if (th) {
          if (typeof th.minutesPlayed === 'number') {
            playtime = th.minutesPlayed;
          } else if (typeof th.totalTimePlayed === 'string') {
            const m = th.totalTimePlayed.match(/P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (m) playtime = (parseInt(m[1]||'0')*1440) + (parseInt(m[2]||'0')*60) + parseInt(m[3]||'0');
          }
          if (th.lastTimePlayed) {
            try {
              const d = new Date(th.lastTimePlayed);
              if (d.getTime() > 0) lastPlayed = d.toISOString();
            } catch { /* ignore invalid date */ }
          }
        } else if (typeof t.minutesPlayed === 'number') {
          playtime = t.minutesPlayed;
        }

        // Type field names differ by API version
        const type = (t.type || t.titleType || t.contentType || '').toLowerCase();
        const name = (t.name || t.title || t.titleName || '').trim();
        if (!name) return;

        // SCID — needed to query Xbox Live User Stats service
        const scid = t.detail?.serviceConfigId || t.serviceConfigId || null;

        // Rich metadata from TitleHub detail decoration
        const detailGenres: string[] = t.detail?.genres || t.genres || [];
        const description: string = t.detail?.shortDescription || t.description || '';
        const rawReleaseDate: string = t.detail?.releaseDate || t.releaseDate || '';
        const releaseDate = rawReleaseDate && /^\d{4}-\d{2}-\d{2}T/.test(rawReleaseDate)
          ? (() => { try { return new Date(rawReleaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return rawReleaseDate; } })()
          : rawReleaseDate;

        if (titlesMap.has(id)) {
          const ex = titlesMap.get(id)!;
          if (playtime > ex.playtime) ex.playtime = playtime;
          if (!ex.artwork && artwork) ex.artwork = artwork;
          if (!ex.banner && banner) ex.banner = banner;
          if (!ex.type && type) ex.type = type;
          if (!ex.scid && scid) ex.scid = scid;
          if (!ex.description && description) ex.description = description;
          if (!ex.genres?.length && detailGenres.length) ex.genres = detailGenres;
          if (!ex.releaseDate && releaseDate) ex.releaseDate = releaseDate;
          if (lastPlayed && (!ex.lastPlayed || lastPlayed > ex.lastPlayed)) ex.lastPlayed = lastPlayed;
        } else {
          titlesMap.set(id, { id, name, type, artwork, banner, playtime, scid, description, genres: detailGenres, releaseDate, lastPlayed });
        }
      };

      titles.forEach(ingestTitle);
      achTitles.forEach(ingestTitle);

      // ── Xbox Live User Stats: fetch MinutesPlayed for games that expose it ──────
      // userstats.xboxlive.com requires a per-game SCID extracted from the TitleHub detail decoration.
      // Not all games configure a playtime stat, but many first-party and major third-party titles do.
      const PLAYTIME_STAT_RE = /minute|playtime|time.?played|play.?time|hour|second/i;
      const gamesWithScid = [...titlesMap.values()].filter(g => g.scid && g.playtime === 0);
      if (gamesWithScid.length > 0) {
        console.log(`Xbox Sync: querying userstats for ${gamesWithScid.length} games with SCID`);
        await Promise.all(gamesWithScid.map(async (g) => {
          try {
            const statsRes = await fetch(
              `https://userstats.xboxlive.com/users/xuid(${xuid})/scids/${g.scid}/stats`,
              { headers: { ...xblHeaders, 'x-xbl-contract-version': '3' } }
            );
            if (!statsRes.ok) return;
            const statsData = await statsRes.json();
            // Response shape varies by contract version; handle both flat and grouped formats
            const statsList: any[] =
              statsData.stats?.statlistscollection?.[0]?.stats ||
              statsData.stats?.stats ||
              statsData.statlistscollection?.[0]?.stats ||
              statsData.stats || [];
            console.log(`Xbox userstats [${g.name}]:`, statsList.map(s => `${s.name}=${s.value}`).join(', ') || '(no stats)');
            for (const stat of statsList) {
              if (!PLAYTIME_STAT_RE.test(stat.name || '')) continue;
              const val = parseFloat(String(stat.value || '0'));
              if (isNaN(val) || val <= 0) continue;
              const nameLower = (stat.name || '').toLowerCase();
              const minutes = nameLower.includes('second') ? val / 60
                : nameLower.includes('hour') ? val * 60
                : val; // assume minutes by default
              g.playtime = Math.round(minutes);
              console.log(`Xbox userstats [${g.name}]: found playtime stat "${stat.name}"=${val} → ${g.playtime} min`);
              break;
            }
          } catch (e) { /* userstats not available for this game */ }
        }));
      }

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

      // Pre-fetch tags for all games (async, must happen before the synchronous transaction)
      const tagsMap = new Map<string, string>();
      await Promise.all(games.map(async (g) => {
        const t = await fetchTagsForGame(g.name, 'xbox');
        if (t) tagsMap.set(g.id, t);
      }));

      const stmt = db.prepare(`
        INSERT INTO launcher_games (title, artwork, banner, platform, external_id, user_id, playtime, achievements, description, genre, release_date, tags, installed, hidden, last_played)
        VALUES (?, ?, ?, 'xbox', ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
        ON CONFLICT(platform, external_id, user_id) DO UPDATE SET
          playtime = MAX(playtime, excluded.playtime),
          achievements = excluded.achievements,
          artwork = CASE WHEN (artwork IS NULL OR artwork = '') AND excluded.artwork != '' THEN excluded.artwork ELSE artwork END,
          banner = CASE WHEN (banner IS NULL OR banner = '') AND excluded.banner != '' THEN excluded.banner ELSE banner END,
          description = CASE WHEN (description IS NULL OR description = '') AND excluded.description != '' THEN excluded.description ELSE description END,
          genre = CASE WHEN (genre IS NULL OR genre = '') AND excluded.genre != '' THEN excluded.genre ELSE genre END,
          release_date = CASE WHEN (release_date IS NULL OR release_date = '') AND excluded.release_date != '' THEN excluded.release_date ELSE release_date END,
          tags = CASE WHEN (tags IS NULL OR tags = '') AND excluded.tags != '' THEN excluded.tags ELSE tags END,
          last_played = CASE
            WHEN excluded.last_played IS NOT NULL AND (last_played IS NULL OR excluded.last_played > last_played)
            THEN excluded.last_played
            ELSE last_played
          END
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
          const artwork = game.artwork || '';
          const banner = game.banner || '';
          const description = game.description || '';
          const genre = game.genres?.[0] || '';
          const releaseDate = game.releaseDate || '';
          const tags = tagsMap.get(game.id) || '';

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
            achsJson,
            description,
            genre,
            releaseDate,
            tags,
            game.lastPlayed || null
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
  function findEaGameExe(gameFolder: string): string | null {
    try {
      const SKIP = /^(unins|vcredist|vc_redist|dxsetup|directx|dotnet|setup|crash|report|easyanticheat)/i;
      const exes = readdirSync(gameFolder)
        .filter((f: string) => f.toLowerCase().endsWith('.exe') && !SKIP.test(f))
        .map((f: string) => ({ f, size: statSync(path.join(gameFolder, f)).size }))
        .sort((a: any, b: any) => b.size - a.size);
      if (exes.length > 0) return path.join(gameFolder, exes[0].f);
      // Try one level deep
      const subdirs = readdirSync(gameFolder, { withFileTypes: true })
        .filter((e: any) => e.isDirectory())
        .map((e: any) => e.name);
      for (const sub of subdirs) {
        const subExes = readdirSync(path.join(gameFolder, sub))
          .filter((f: string) => f.toLowerCase().endsWith('.exe') && !SKIP.test(f))
          .map((f: string) => ({ f, size: statSync(path.join(gameFolder, sub, f)).size }))
          .sort((a: any, b: any) => b.size - a.size);
        if (subExes.length > 0) return path.join(gameFolder, sub, subExes[0].f);
      }
    } catch (e) {
      console.error('findEaGameExe error:', e);
    }
    return null;
  }

  app.post("/api/launcher/sync-ea", authenticateToken, async (req, res) => {
    try {
      const eaGamesPath = 'C:\\Program Files\\EA Games';
      const fs = await import('fs');
      let gameNames: string[] = [];

      try {
        const entries = fs.readdirSync(eaGamesPath, { withFileTypes: true });
        gameNames = entries.filter(e => e.isDirectory()).map(e => e.name);
      } catch (e) {
        console.error('Failed to read EA Games folder:', e);
        return res.status(404).json({ error: 'EA Games folder not found at C:\\Program Files\\EA Games. Make sure EA Desktop is installed.' });
      }

      if (gameNames.length === 0) return res.json({ success: true, count: 0, message: 'No EA games found.' });

      let addedCount = 0;
      for (const gameName of gameNames) {
        const existing = db.prepare(
          "SELECT id FROM launcher_games WHERE user_id = ? AND platform = 'ea' AND external_id = ?"
        ).get(req.user.id, gameName) as any;

        const gameFolder = path.join(eaGamesPath, gameName);
        const exePath = findEaGameExe(gameFolder);

        if (existing) {
          db.prepare("UPDATE launcher_games SET installed = 1, launch_path = ? WHERE id = ?")
            .run(exePath, existing.id);
          continue;
        }

        // Artwork from SteamGridDB
        const sgdb = await fetchSgdbArtwork(gameName, process.env.STEAMGRIDDB_API_KEY, { artwork: '', banner: '', logo: '' });

        // Tags via SteamSpy pipeline
        const tags = await fetchTagsForGame(gameName, 'ea') || '';

        // Description / genre / release_date from IGDB
        let description = '', genre = '', releaseDate = '';
        try {
          const igdbRes = await fetch(`http://localhost:3000/api/igdb/search?title=${encodeURIComponent(gameName)}`);
          if (igdbRes.ok) {
            const d = await igdbRes.json().catch(() => ({}));
            description = d.description || '';
            genre = d.genre || '';
            releaseDate = d.release_date || '';
          }
        } catch (e) { /* ignore */ }

        db.prepare(`
          INSERT INTO launcher_games
            (title, platform, external_id, user_id, playtime, installed, hidden, artwork, banner, logo, description, tags, genre, release_date, launch_path)
          VALUES (?, 'ea', ?, ?, 0, 1, 0, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(platform, external_id, user_id) DO UPDATE SET
            installed = 1,
            launch_path  = excluded.launch_path,
            artwork  = CASE WHEN excluded.artwork  != '' THEN excluded.artwork  ELSE artwork  END,
            banner   = CASE WHEN excluded.banner   != '' THEN excluded.banner   ELSE banner   END,
            logo     = CASE WHEN excluded.logo     != '' THEN excluded.logo     ELSE logo     END,
            tags     = CASE WHEN excluded.tags     != '' THEN excluded.tags     ELSE tags     END,
            description  = CASE WHEN excluded.description  != '' THEN excluded.description  ELSE description  END,
            genre        = CASE WHEN excluded.genre        != '' THEN excluded.genre        ELSE genre        END,
            release_date = CASE WHEN excluded.release_date != '' THEN excluded.release_date ELSE release_date END
        `).run(gameName, gameName, req.user.id, sgdb.artwork, sgdb.banner, sgdb.logo, description, tags, genre, releaseDate, exePath || '');

        addedCount++;
        console.log(`EA Sync: added "${gameName}"`);
      }

      res.json({ success: true, count: addedCount, message: `Added ${addedCount} EA game${addedCount !== 1 ? 's' : ''} to your library.` });
    } catch (error) {
      console.error('EA sync error:', error);
      res.status(500).json({ error: 'Failed to sync EA games.' });
    }
  });

  app.post("/api/launcher/sync-epic", authenticateToken, async (req: any, res) => {
    try {
      const fs = await import('fs');

      // ── 1. Read local manifests (installed games) ──────────────────────────
      const epicDataDir = path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'Epic', 'EpicGamesLauncher', 'Data');
      const manifestDir = (() => {
        for (const sub of ['Manifests', 'ManifestTemp']) {
          const p = path.join(epicDataDir, sub);
          try { fs.readdirSync(p); return p; } catch {}
        }
        return path.join(epicDataDir, 'Manifests'); // fallback (will fail gracefully)
      })();
      // Map catalogItemId → { title, appName, isInstalled }
      const installedMap = new Map<string, { title: string; appName: string }>();

      try {
        const manifestFiles = fs.readdirSync(manifestDir).filter((f: string) => f.endsWith('.item'));
        for (const f of manifestFiles) {
          try {
            const m = JSON.parse(fs.readFileSync(path.join(manifestDir, f), 'utf-8'));
            if (m.bIsIncompleteInstall) continue;
            if (m.MainGameAppName && m.AppName !== m.MainGameAppName) continue;
            const categories: string[] = m.AppCategories || [];
            if (categories.some((c: string) => /software|engine|tool|plugin/i.test(c)) &&
                !categories.some((c: string) => /game/i.test(c))) continue;
            installedMap.set(m.CatalogItemId || m.AppName, {
              title: m.DisplayName || m.AppName,
              appName: m.AppName,
            });
          } catch { /* skip bad manifest */ }
        }
      } catch (e: any) {
        console.log('Epic manifest dir not found or unreadable:', e.message);
      }
      console.log('Epic installed games from manifests:', installedMap.size);

      // ── 2. Get access token ────────────────────────────────────────────────
      let accessToken: string | null = req.body.accessToken || null;
      const user = db.prepare("SELECT epic_refresh_token, epic_account_id FROM users WHERE id = ?").get(req.user.id) as any;
      console.log('Epic sync: has accessToken from body:', !!accessToken, '| has refresh_token in DB:', !!user?.epic_refresh_token);

      if (!accessToken && user?.epic_refresh_token) {
        accessToken = await refreshEpicAccessToken(user.epic_refresh_token);
        console.log('Epic sync: refresh token result:', accessToken ? 'OK' : 'FAILED');
        if (!accessToken) {
          // Refresh token is invalid — clear stored credentials so user can re-auth
          db.prepare("UPDATE users SET epic_account_id = NULL, epic_refresh_token = NULL WHERE id = ?").run(req.user.id);
          return res.status(401).json({ error: 'Epic session expired. Please reconnect your Epic account.', reauth: true });
        }
      }

      // ── 3. Fetch owned library from Epic API ───────────────────────────────
      // Map catalogItemId → { title, namespace, appName, epicArtwork, epicBanner }
      const ownedMap = new Map<string, { title: string; namespace: string; appName: string; epicArtwork?: string; epicBanner?: string }>();

      if (accessToken) {
        try {
          const assetsRes = await fetch(EPIC_ASSETS_URL, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          console.log('Epic assets API status:', assetsRes.status);
          if (!assetsRes.ok) console.error('Epic assets API error:', await assetsRes.text());
          if (assetsRes.ok) {
            const assets: any[] = await assetsRes.json();
            console.log('Epic assets total:', assets.length);
            console.log('Epic assets sample:', JSON.stringify(assets.slice(0, 2), null, 2));
            // Filter to real games: skip Unreal Engine (namespace 'ue') and items missing key fields
            const gameAssets = assets.filter((a: any) =>
              a.namespace !== 'ue' &&
              a.appName && a.catalogItemId
            );
            console.log('Epic gameAssets after filter:', gameAssets.length);

            // Fetch catalog details in batches of 25
            const BATCH = 25;
            for (let i = 0; i < gameAssets.length; i += BATCH) {
              const batch = gameAssets.slice(i, i + BATCH);
              try {
                const params = new URLSearchParams({ country: 'US', locale: 'en-US', includeMainGameDetails: 'true' });
                batch.forEach((a: any) => params.append('id', a.catalogItemId));
                const catalogRes = await fetch(`${EPIC_CATALOG_URL}?${params}`, {
                  headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (!catalogRes.ok) { console.error('Epic catalog fetch failed:', catalogRes.status, await catalogRes.text()); continue; }
                const catalogData: Record<string, any> = await catalogRes.json();

                for (const asset of batch) {
                  const item = catalogData[asset.catalogItemId];
                  if (!item) continue;

                  // Skip DLC (has a mainGameItem reference different from itself)
                  if (item.mainGameItem && item.mainGameItem.id !== item.id) continue;
                  // Skip non-game categories
                  const cats: string[] = (item.categories || []).map((c: any) => c.path || '');
                  if (cats.some((c: string) => /software|plugin|addon|dlc/i.test(c)) && !cats.some((c: string) => /game/i.test(c))) continue;

                  const title = item.title || asset.appName;
                  // Extract Epic CDN images
                  const images: any[] = item.keyImages || [];
                  const tall = images.find((img: any) => img.type === 'DieselGameBoxTall') || images.find((img: any) => img.type === 'OfferImageTall');
                  const wide = images.find((img: any) => img.type === 'DieselGameBox') || images.find((img: any) => img.type === 'OfferImageWide') || images.find((img: any) => img.type === 'featuredMedia');

                  ownedMap.set(asset.catalogItemId, {
                    title,
                    namespace: asset.namespace,
                    appName: asset.appName,
                    epicArtwork: tall?.url,
                    epicBanner: wide?.url,
                  });
                }
              } catch (e) {
                console.error('Epic catalog batch error:', e);
              }
            }
          }
        } catch (e) {
          console.error('Epic assets fetch error:', e);
        }
      }

      if (installedMap.size === 0 && ownedMap.size === 0) {
        return res.json({ success: true, count: 0, message: 'No Epic games found. Make sure Epic Games Launcher is installed and you are signed in.' });
      }

      // ── 4. Merge and upsert ────────────────────────────────────────────────
      // Build unified set: installed + owned
      const allIds = new Set([...installedMap.keys(), ...ownedMap.keys()]);
      let addedCount = 0;

      for (const catalogItemId of allIds) {
        try {
          const installed = installedMap.get(catalogItemId);
          const owned = ownedMap.get(catalogItemId);
          const info = installed || owned!;
          const title = info.title;
          const appName = info.appName;
          const isInstalled = !!installed;
          const launchPath = `com.epicgames.launcher://apps/${appName}?action=launch`;

          const existing = db.prepare(
            "SELECT id FROM launcher_games WHERE user_id = ? AND platform = 'epic' AND external_id = ?"
          ).get(req.user.id, catalogItemId) as any;

          if (existing) {
            db.prepare("UPDATE launcher_games SET installed = ?, launch_path = ? WHERE id = ?")
              .run(isInstalled ? 1 : 0, launchPath, existing.id);
            continue;
          }

          // New game — fetch artwork + metadata
          const epicArtwork = owned?.epicArtwork || '';
          const epicBanner = owned?.epicBanner || '';
          const sgdb = await fetchSgdbArtwork(title, process.env.STEAMGRIDDB_API_KEY, { artwork: epicArtwork, banner: epicBanner, logo: '' });
          const tags = await fetchTagsForGame(title, 'epic') || '';

          let description = '', genre = '', releaseDate = '';
          try {
            const igdbRes = await fetch(`http://localhost:3000/api/igdb/search?title=${encodeURIComponent(title)}`);
            if (igdbRes.ok) {
              const d = await igdbRes.json().catch(() => ({}));
              description = d.description || '';
              genre = d.genre || '';
              releaseDate = d.release_date || '';
            }
          } catch { /* ignore */ }

          db.prepare(`
            INSERT INTO launcher_games
              (title, platform, external_id, user_id, playtime, installed, hidden, artwork, banner, logo, description, tags, genre, release_date, launch_path)
            VALUES (?, 'epic', ?, ?, 0, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(platform, external_id, user_id) DO UPDATE SET
              installed    = excluded.installed,
              launch_path  = excluded.launch_path,
              artwork      = CASE WHEN excluded.artwork      != '' THEN excluded.artwork      ELSE artwork      END,
              banner       = CASE WHEN excluded.banner       != '' THEN excluded.banner       ELSE banner       END,
              logo         = CASE WHEN excluded.logo         != '' THEN excluded.logo         ELSE logo         END,
              tags         = CASE WHEN excluded.tags         != '' THEN excluded.tags         ELSE tags         END,
              description  = CASE WHEN excluded.description  != '' THEN excluded.description  ELSE description  END,
              genre        = CASE WHEN excluded.genre        != '' THEN excluded.genre        ELSE genre        END,
              release_date = CASE WHEN excluded.release_date != '' THEN excluded.release_date ELSE release_date END
          `).run(title, catalogItemId, req.user.id, isInstalled ? 1 : 0, sgdb.artwork, sgdb.banner, sgdb.logo, description, tags, genre, releaseDate, launchPath);

          addedCount++;
          console.log(`Epic Sync: added "${title}" (${isInstalled ? 'installed' : 'owned/uninstalled'})`);
        } catch (e) {
          console.error(`Epic sync error for ${catalogItemId}:`, e);
        }
      }

      const installedCount = installedMap.size;
      const ownedCount = ownedMap.size;
      res.json({
        success: true,
        count: addedCount,
        message: `Synced ${installedCount} installed + ${ownedCount} owned game${ownedCount !== 1 ? 's' : ''}. Added ${addedCount} new.`,
      });
    } catch (error) {
      console.error('Epic sync error:', error);
      res.status(500).json({ error: 'Failed to sync Epic games.' });
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

      // Get locally installed Steam games (scans all library folders)
      const localAppIds = await getInstalledSteamAppIds();

      const stmt = db.prepare(`
        INSERT INTO launcher_games (title, artwork, banner, platform, external_id, user_id, playtime, installed, hidden, last_played)
        VALUES (?, ?, ?, 'steam', ?, ?, ?, ?, 0, ?)
        ON CONFLICT(platform, external_id, user_id) DO UPDATE SET
          title = excluded.title,
          playtime = MAX(playtime, excluded.playtime),
          installed = excluded.installed,
          last_played = CASE
            WHEN excluded.last_played IS NOT NULL AND (last_played IS NULL OR excluded.last_played > last_played)
            THEN excluded.last_played
            ELSE last_played
          END
      `);

      const insertMany = db.transaction((games) => {
        for (const game of games) {
          const artwork = `https://shared.steamstatic.com/store_item_assets/steam/apps/${game.appid}/library_capsule_2x.jpg`;
          const banner = `https://shared.steamstatic.com/store_item_assets/steam/apps/${game.appid}/library_hero.jpg`;
          const isInstalled = localAppIds.has(String(game.appid)) ? 1 : 0;
          const lastPlayed = game.rtime_last_played ? new Date(game.rtime_last_played * 1000).toISOString() : null;
          stmt.run(game.name, artwork, banner, String(game.appid), req.user.id, game.playtime_forever || 0, isInstalled, lastPlayed);
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
        let metacritic: number | null = game.metacritic || null;

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
              if (logoData.success && logoData.data?.length > 0) {
                logo = pickBestLogo(logoData.data);
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
          const sgdb = await fetchSgdbArtwork(game.title, sgdbKey, { artwork, banner, logo });
          artwork = sgdb.artwork;
          banner = sgdb.banner;
          logo = sgdb.logo;
        }

        // Tags: only fetch if missing — never overwrite existing tags (preserves SteamSpy tags on merged games)
        if (!tags) {
          const newTags = await fetchTagsForGame(game.title, game.platform, game.external_id || undefined);
          if (newTags) tags = newTags;
        }

        // IGDB: description, genre, release_date, metacritic
        try {
          const igdbRes = await fetch(`http://localhost:3000/api/igdb/search?title=${encodeURIComponent(game.title)}`);
          if (igdbRes.ok) {
            const igdbData = await igdbRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
            if (igdbData) {
              if (!description && igdbData.description) description = igdbData.description;
              if (!genre && igdbData.genre) genre = igdbData.genre;
              if (!release_date && igdbData.release_date) release_date = igdbData.release_date;
            }
          }
        } catch (igdbError) {
          console.error(`IGDB error for ${game.title}:`, igdbError);
        }

        db.prepare(`
          UPDATE launcher_games
          SET artwork = ?, banner = ?, logo = ?, description = ?, tags = ?, genre = ?, release_date = ?, metacritic = ?
          WHERE id = ?
        `).run(artwork, banner, logo, description, tags, genre, release_date, metacritic, game.id);
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

  // Cache: keyed by `${userId}:${gameId}`, TTL 1 hour
  const friendsCache = new Map<string, { data: any[]; fetchedAt: number }>();
  const FRIENDS_CACHE_TTL = 60 * 60 * 1000;

  app.get("/api/launcher/games/:id/friends", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      const userId = req.user.id;
      const cacheKey = `${userId}:${id}`;
      const cached = friendsCache.get(cacheKey);
      if (cached && Date.now() - cached.fetchedAt < FRIENDS_CACHE_TTL) {
        return res.json(cached.data);
      }

      const game = db.prepare("SELECT id, external_id, platform, title FROM launcher_games WHERE id = ?").get(id) as any;
      if (!game) return res.json([]);
      const user = db.prepare("SELECT steam_id, xbox_refresh_token FROM users WHERE id = ?").get(userId) as any;
      const results: any[] = [];

      // Find Steam appId — use game's own if Steam platform, else cross-platform title match
      let steamAppId: string | null = game.platform === 'steam' ? game.external_id : null;
      if (!steamAppId) {
        const m = db.prepare("SELECT external_id FROM launcher_games WHERE user_id = ? AND platform = 'steam' AND LOWER(title) = LOWER(?)").get(userId, game.title) as any;
        if (m) steamAppId = m.external_id;
      }

      // Find Xbox titleId — use game's own if Xbox (numeric), else cross-platform title match
      let xboxTitleId: string | null = (game.platform === 'xbox' && !isNaN(Number(game.external_id))) ? game.external_id : null;
      if (!xboxTitleId) {
        const m = db.prepare("SELECT external_id FROM launcher_games WHERE user_id = ? AND platform = 'xbox' AND LOWER(title) = LOWER(?)").get(userId, game.title) as any;
        if (m && !isNaN(Number(m.external_id))) xboxTitleId = m.external_id;
      }

      // Check Steam friends
      if (steamAppId && user?.steam_id && process.env.STEAM_API_KEY) {
        results.push(...await getSteamFriendsForGame(steamAppId, user.steam_id, process.env.STEAM_API_KEY));
      }

      // Check Xbox friends — use titleId if found, else fall back to name-based search
      if (user?.xbox_refresh_token && process.env.XBOX_CLIENT_ID && process.env.XBOX_CLIENT_SECRET) {
        results.push(...await getXboxFriendsForTitle(xboxTitleId, userId, xboxTitleId ? undefined : game.title));
      }

      // Deduplicate: if a friend appears on both platforms, keep the one with more info
      const seen = new Map<string, any>();
      for (const f of results) {
        const key = f.username.toLowerCase();
        const existing = seen.get(key);
        if (!existing || (!existing.last_played && f.last_played)) seen.set(key, f);
      }

      const deduped = [...seen.values()].sort((a, b) => {
        const rank = (s) => s === 'in_game' ? 0 : s === 'online' ? 1 : s === 'away' ? 2 : 3;
        return rank(a.online_status) - rank(b.online_status) || a.username.localeCompare(b.username);
      });

      friendsCache.set(cacheKey, { data: deduped, fetchedAt: Date.now() });
      res.json(deduped);
    } catch (error) {
      console.error("Friends-who-own error:", error);
      res.status(500).json({ error: "Failed to fetch friends who own this game" });
    }
  });

  // ── Session helpers ──────────────────────────────────────────────────────────

  function endGameSession(gameId: number, userId: number): number {
    const game = db.prepare("SELECT id, session_start FROM launcher_games WHERE id = ? AND user_id = ?").get(gameId, userId) as any;
    if (!game?.session_start) return 0;
    const minutes = Math.round((Date.now() - new Date(game.session_start).getTime()) / 60000);
    if (minutes > 0) {
      db.prepare("UPDATE launcher_games SET playtime = playtime + ?, session_start = NULL WHERE id = ?").run(minutes, gameId);
      db.prepare(`INSERT INTO playtime_logs (user_id, game_id, playtime_minutes) VALUES (?, ?, ?)
        ON CONFLICT(user_id, game_id, date) DO UPDATE SET playtime_minutes = playtime_minutes + ?`
      ).run(userId, gameId, minutes, minutes);
    } else {
      db.prepare("UPDATE launcher_games SET session_start = NULL WHERE id = ?").run(gameId);
    }
    console.log(`[session] Auto-ended game ${gameId} — ${minutes} min`);
    return minutes;
  }

  // Map of gameId → interval handle for process watchers
  const sessionWatchers = new Map<number, ReturnType<typeof setInterval>>();

  // exeName: exact exe filename (no path, no extension) for EA games; undefined for Xbox (falls back to title fuzzy match)
  async function startProcessWatcher(gameId: number, userId: number, gameTitle: string, exeName?: string) {
    if (sessionWatchers.has(gameId)) {
      clearInterval(sessionWatchers.get(gameId)!);
      sessionWatchers.delete(gameId);
    }
    const launchTime = Date.now();
    let misses = 0;
    // For Xbox: normalise title into key words (≥2 chars) for fuzzy process matching
    const titleWords = gameTitle.toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length >= 2);

    const isRunningCheck = (procs: string[]): boolean => {
      if (exeName) {
        // Exact match on exe name — reliable for EA games
        return procs.includes(exeName.toLowerCase());
      }
      // Fuzzy match on title words — used for Xbox
      return titleWords.length > 0 && procs.some(p => titleWords.some(w => p.includes(w)));
    };

    const interval = setInterval(async () => {
      // Grace period: ignore first 60 s so the game has time to start
      if (Date.now() - launchTime < 60000) return;
      // Session may have been manually ended
      const row = db.prepare("SELECT session_start FROM launcher_games WHERE id = ?").get(gameId) as any;
      if (!row?.session_start) { clearInterval(interval); sessionWatchers.delete(gameId); return; }
      try {
        const { execSync } = await import('child_process');
        const output = execSync('tasklist /FO CSV /NH', { encoding: 'utf8', timeout: 5000 });
        const procs = output.split('\n')
          .map(line => line.trim().split(',')[0]?.replace(/"/g, '').toLowerCase().replace(/\.exe$/, ''));
        const running = isRunningCheck(procs);
        if (!running) {
          misses++;
          if (misses >= 2) {
            clearInterval(interval);
            sessionWatchers.delete(gameId);
            endGameSession(gameId, userId);
          }
        } else {
          misses = 0;
        }
      } catch (e) {
        console.error('[session watcher] tasklist error:', e);
      }
    }, 30000);

    sessionWatchers.set(gameId, interval);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  app.post("/api/launcher/launch", authenticateToken, async (req, res) => {
    const { id } = req.body;
    try {
      const game = db.prepare("SELECT platform, launch_path, title FROM launcher_games WHERE id = ? AND user_id = ?").get(id, req.user.id) as any;
      if (!game) return res.status(404).json({ error: "Game not found" });

      if (game.platform === 'ea') {
        console.log('[launch] EA game launch_path:', game.launch_path);
        if (game.launch_path) {
          const { spawn } = await import('child_process');
          const proc = spawn(game.launch_path, [], { detached: true, stdio: 'ignore' });
          proc.on('error', (err) => console.error('[launch] spawn error:', err));
          // Watch process exit as primary trigger; watcher below as fallback
          proc.once('close', () => endGameSession(id, req.user.id));
          proc.unref();
        } else {
          console.warn('[launch] EA game has no launch_path — re-sync needed');
          return res.status(400).json({ error: 'No launch path found. Please re-run Sync Games.' });
        }
      }

      if (game.platform === 'xbox' || game.platform === 'ea') {
        // End any currently active session first
        const active = db.prepare(
          "SELECT id FROM launcher_games WHERE user_id = ? AND session_start IS NOT NULL AND id != ?"
        ).get(req.user.id, id) as any;
        if (active) {
          endGameSession(active.id, req.user.id);
          if (sessionWatchers.has(active.id)) {
            clearInterval(sessionWatchers.get(active.id)!);
            sessionWatchers.delete(active.id);
          }
        }
        // Start new session
        db.prepare("UPDATE launcher_games SET last_played = CURRENT_TIMESTAMP, session_start = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?").run(id, req.user.id);
        // For EA: pass exact exe name for reliable process matching; Xbox uses fuzzy title match
        const exeName = game.launch_path ? path.basename(game.launch_path, '.exe') : undefined;
        startProcessWatcher(id, req.user.id, game.title, exeName);
      } else {
        // For Steam/local: just update last_played — playtime is synced from Steam API
        db.prepare("UPDATE launcher_games SET last_played = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?").run(id, req.user.id);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to launch game" });
    }
  });

  // Get active session (if any) for the current user
  app.get("/api/launcher/active-session", authenticateToken, (req, res) => {
    try {
      const session = db.prepare(
        "SELECT id, title, platform, session_start FROM launcher_games WHERE user_id = ? AND session_start IS NOT NULL ORDER BY session_start DESC LIMIT 1"
      ).get(req.user.id) as any;
      if (!session) return res.json(null);
      res.json({ gameId: session.id, gameName: session.title, platform: session.platform, sessionStart: session.session_start });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active session" });
    }
  });

  // Manually end a session and save playtime
  app.post("/api/launcher/session/end", authenticateToken, (req, res) => {
    const { id } = req.body;
    try {
      // Cancel process watcher if running
      if (sessionWatchers.has(id)) {
        clearInterval(sessionWatchers.get(id)!);
        sessionWatchers.delete(id);
      }
      const minutes = endGameSession(id, req.user.id);
      res.json({ success: true, minutes });
    } catch (error) {
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  // Manually set playtime for a launcher game (accepts hours, stores as minutes)
  app.put("/api/launcher/games/:id/playtime", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { hours } = req.body;
    if (hours == null || isNaN(Number(hours)) || Number(hours) < 0) {
      return res.status(400).json({ error: "Invalid hours value" });
    }
    const minutes = Math.round(Number(hours) * 60);
    try {
      const result = db.prepare(
        "UPDATE launcher_games SET playtime = ? WHERE id = ? AND user_id = ?"
      ).run(minutes, id, req.user.id);
      if (result.changes === 0) return res.status(404).json({ error: "Game not found" });
      res.json({ success: true, minutes });
    } catch (error) {
      res.status(500).json({ error: "Failed to update playtime" });
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

      // Fetch tags/description/genre from IGDB for all platforms if any are missing
      if (!tags || !description || !genre) {
        try {
          const igdbRes = await fetch(`http://localhost:3000/api/igdb/search?title=${encodeURIComponent(game.title)}`);
          if (igdbRes.ok) {
            const igdbData = await igdbRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
            if (igdbData) {
              if (!tags && igdbData.tags) tags = igdbData.tags;
              if (!description && igdbData.description) description = igdbData.description;
              if (!genre && igdbData.genre) genre = igdbData.genre;
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

      // Fetch artwork/logo from SteamgridDB if missing
      const sgdbKeyDetails = process.env.STEAMGRIDDB_API_KEY;
      if (sgdbKeyDetails && (game.platform === 'steam' || game.platform === 'xbox')) {
        let artwork = game.artwork;
        let banner = game.banner;
        try {
          let sgdbGameId: string | null = null;

          if (game.platform === 'steam') {
            // Steam: use appid endpoints directly
            if (!logo) {
              const logoRes = await fetch(`https://www.steamgriddb.com/api/v2/logos/steam/${game.external_id}`, {
                headers: { Authorization: `Bearer ${sgdbKeyDetails}` }
              });
              const logoData = await logoRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
              if (logoData.success && logoData.data?.length > 0) {
                const whiteLogos = logoData.data.filter((l) => l.style === 'white' || l.style === 'custom');
                const targetList = whiteLogos.length > 0 ? whiteLogos : logoData.data;
                logo = [...targetList].sort((a, b) => (b.width / b.height) - (a.width / a.height))[0]?.url;
              }
            }
          } else if (game.platform === 'xbox' && (!logo || !artwork || !banner)) {
            // Xbox: search by title name first
            const searchRes = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(game.title)}`, {
              headers: { Authorization: `Bearer ${sgdbKeyDetails}` }
            });
            const searchData = await searchRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
            if (searchData.success && searchData.data?.length > 0) {
              sgdbGameId = String(searchData.data[0].id);
            }

            if (sgdbGameId) {
              if (!logo) {
                const logoRes = await fetch(`https://www.steamgriddb.com/api/v2/logos/game/${sgdbGameId}`, {
                  headers: { Authorization: `Bearer ${sgdbKeyDetails}` }
                });
                const logoData = await logoRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
                if (logoData.success && logoData.data?.length > 0) {
                  logo = pickBestLogo(logoData.data);
                }
              }
              if (!artwork) {
                const gridRes = await fetch(`https://www.steamgriddb.com/api/v2/grids/game/${sgdbGameId}?dimensions=600x900,342x482,660x930`, {
                  headers: { Authorization: `Bearer ${sgdbKeyDetails}` }
                });
                const gridData = await gridRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
                if (gridData.success && gridData.data?.length > 0) artwork = gridData.data[0].url;
              }
              if (!banner) {
                const heroRes = await fetch(`https://www.steamgriddb.com/api/v2/heroes/game/${sgdbGameId}`, {
                  headers: { Authorization: `Bearer ${sgdbKeyDetails}` }
                });
                const heroData = await heroRes.text().then(t => t ? JSON.parse(t) : {}).catch(() => ({}));
                if (heroData.success && heroData.data?.length > 0) banner = heroData.data[0].url;
              }
              // Update artwork/banner in DB if they were fetched
              if (artwork !== game.artwork || banner !== game.banner) {
                db.prepare("UPDATE launcher_games SET artwork = ?, banner = ? WHERE id = ?").run(artwork || game.artwork, banner || game.banner, id);
              }
            }
          }
        } catch (e) {
          console.error(`SteamgridDB fetch error for ${game.title}:`, e);
        }
      }

      // Format Xbox release dates from ISO string to human-readable (e.g. "Feb 10, 2023")
      if (game.platform === 'xbox' && release_date && /^\d{4}-\d{2}-\d{2}T/.test(release_date)) {
        try {
          release_date = new Date(release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch { /* keep original */ }
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

    try {
      console.log('🔍 Scanning Steam games...');
      const appIds = await getInstalledSteamAppIds();
      console.log('Found Steam appIds:', Array.from(appIds));

      let addedCount = 0;
      for (const appId of appIds) {
        const existing = db.prepare(
          "SELECT id FROM launcher_games WHERE user_id = ? AND platform = 'steam' AND external_id = ?"
        ).get(req.user.id, appId) as any;
        if (!existing) {
          db.prepare(`INSERT INTO launcher_games (title, platform, external_id, user_id, playtime, installed, hidden) VALUES (?, 'steam', ?, ?, 0, 1, 0)`).run(`Steam Game ${appId}`, appId, req.user.id);
          addedCount++;
        } else {
          db.prepare("UPDATE launcher_games SET installed = 1 WHERE id = ?").run(existing.id);
        }
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

  // Lightweight install-state check — no metadata fetching, just scans disk (Steam, Epic, Xbox, EA)
  app.post("/api/launcher/check-installs", authenticateToken, async (req: any, res) => {
    if (process.platform !== 'win32') return res.status(400).json({ error: "Windows only" });
    try {
      const fs = await import('fs');
      const changed: { id: number; title: string; installed: boolean }[] = [];

      // ── Steam: read appmanifest files ──────────────────────────────────────
      const steamAppIds = await getInstalledSteamAppIds();
      const steamGames = db.prepare(
        "SELECT id, title, external_id, installed FROM launcher_games WHERE user_id = ? AND platform = 'steam'"
      ).all(req.user.id) as any[];

      for (const g of steamGames) {
        const nowInstalled = steamAppIds.has(String(g.external_id));
        if (!!g.installed !== nowInstalled) {
          db.prepare("UPDATE launcher_games SET installed = ? WHERE id = ?").run(nowInstalled ? 1 : 0, g.id);
          changed.push({ id: g.id, title: g.title, installed: nowInstalled });
        }
      }

      // ── Epic: read LauncherInstalled.dat ──────────────────────────────────
      const epicManifestPath = 'C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests';
      const epicGames = db.prepare(
        "SELECT id, title, external_id, launch_path, installed FROM launcher_games WHERE user_id = ? AND platform = 'epic'"
      ).all(req.user.id) as any[];

      if (epicGames.length > 0) {
        const installedAppNames = new Set<string>();
        try {
          if (fs.existsSync(epicManifestPath)) {
            const files = fs.readdirSync(epicManifestPath).filter(f => f.endsWith('.item'));
            for (const file of files) {
              try {
                const content = JSON.parse(fs.readFileSync(path.join(epicManifestPath, file), 'utf8'));
                if (content.AppName) installedAppNames.add(content.AppName);
              } catch { /* skip malformed manifest */ }
            }
          }
        } catch { /* Epic not installed or no access */ }

        for (const g of epicGames) {
          // Derive appName from launch_path: com.epicgames.launcher://apps/{appName}?action=launch
          const match = g.launch_path?.match(/\/apps\/([^?]+)/);
          const appName = match?.[1];
          if (!appName) continue;
          const nowInstalled = installedAppNames.has(appName);
          if (!!g.installed !== nowInstalled) {
            db.prepare("UPDATE launcher_games SET installed = ? WHERE id = ?").run(nowInstalled ? 1 : 0, g.id);
            changed.push({ id: g.id, title: g.title, installed: nowInstalled });
          }
        }
      }

      // ── EA: check C:\Program Files\EA Games folders ────────────────────────
      const eaGames = db.prepare(
        "SELECT id, title, external_id, installed FROM launcher_games WHERE user_id = ? AND platform = 'ea'"
      ).all(req.user.id) as any[];

      if (eaGames.length > 0) {
        const eaFolders = new Set<string>();
        try {
          const eaPath = 'C:\\Program Files\\EA Games';
          if (fs.existsSync(eaPath)) {
            for (const entry of fs.readdirSync(eaPath, { withFileTypes: true })) {
              if (entry.isDirectory()) eaFolders.add(entry.name);
            }
          }
        } catch { /* EA not installed */ }

        for (const g of eaGames) {
          const nowInstalled = eaFolders.has(g.external_id);
          if (!!g.installed !== nowInstalled) {
            db.prepare("UPDATE launcher_games SET installed = ? WHERE id = ?").run(nowInstalled ? 1 : 0, g.id);
            changed.push({ id: g.id, title: g.title, installed: nowInstalled });
          }
        }
      }

      // ── Xbox: check C:\XboxGames folders ───────────────────────────────────
      const xboxGames = db.prepare(
        "SELECT id, title, installed FROM launcher_games WHERE user_id = ? AND platform = 'xbox'"
      ).all(req.user.id) as any[];

      if (xboxGames.length > 0) {
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const xboxFolders = new Set<string>();
        try {
          const xboxPath = 'C:\\XboxGames';
          if (fs.existsSync(xboxPath)) {
            for (const entry of fs.readdirSync(xboxPath, { withFileTypes: true })) {
              if (entry.isDirectory()) xboxFolders.add(normalize(entry.name));
            }
          }
        } catch { /* XboxGames folder missing or no access */ }

        for (const g of xboxGames) {
          const normTitle = normalize(g.title);
          const nowInstalled = xboxFolders.has(normTitle)
            || [...xboxFolders].some(f => f.includes(normTitle) || normTitle.includes(f));
          if (!!g.installed !== nowInstalled) {
            db.prepare("UPDATE launcher_games SET installed = ? WHERE id = ?").run(nowInstalled ? 1 : 0, g.id);
            changed.push({ id: g.id, title: g.title, installed: nowInstalled });
          }
        }
      }

      res.json({ ok: true, changed });
    } catch (e) {
      console.error('check-installs error:', e);
      res.status(500).json({ error: 'Failed to check install state' });
    }
  });

  // Keywords that indicate non-game Steam items to exclude from Discover rows
  const NON_GAME_KEYWORDS = [
    'soundtrack', ' ost', 'dlc', 'demo', 'playtest', 'bundle', 'steam deck',
    'controller', 'software', 'dedicated server', 'wallpaper', 'creation kit',
    'artbook', 'art book', 'game engine', 'modding tool', 'level editor',
    'asset pack', 'texture pack', 'voice pack', 'language pack',
  ];
  function isLikelySteamGame(name: string, type?: number): boolean {
    if (type !== undefined && type !== 0) return false;
    const lower = name.toLowerCase();
    return !NON_GAME_KEYWORDS.some(kw => lower.includes(kw));
  }

  // Fetch SGDB portrait/vertical grid art. Returns URL or '' if not found.
  async function getSgdbPortraitArt(title: string, steamAppID?: string): Promise<string> {
    const sid = steamAppID?.toString().trim();
    const sgdbKey = process.env.STEAMGRIDDB_API_KEY;
    if (!sgdbKey) return '';
    if (sid && /^\d+$/.test(sid)) {
      try {
        // No dimension filter — accept any portrait grid SGDB has
        const gr = await fetch(
          `https://www.steamgriddb.com/api/v2/grids/steam/${sid}`,
          { headers: { Authorization: `Bearer ${sgdbKey}` } }
        );
        const gd = await gr.json().catch(() => ({}));
        if (gd.success && gd.data?.length) {
          // Exclude 'alternate' style — box/physical game case art that breaks visual consistency
          const nonAlt = gd.data.filter((d: any) => d.style !== 'alternate');
          const pool = nonAlt.length ? nonAlt : [];
          const official = pool.find((d: any) => d.style === 'official');
          const pick = official || pool[0];
          if (pick) return pick.url;
        }
      } catch { /* ignore */ }
      // Steam ID lookup found no usable art — fall through to name search below
    }
    // Autocomplete search (non-Steam games + Steam games SGDB doesn't index by ID yet)
    try {
      const nc = (n: string) => n.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const qc = nc(title);
      const qw = qc.split(/\s+/).filter((w: string) => w.length > 0);
      const sr = await fetch(
        `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(title)}`,
        { headers: { Authorization: `Bearer ${sgdbKey}` } }
      );
      const sd = await sr.json().catch(() => ({}));
      if (!sd.success || !sd.data?.length) return '';
      const best = sd.data.find((s: any) => nc(s.name) === qc)
        || sd.data.find((s: any) => qw.every((w: string) => new RegExp(`\\b${w}\\b`).test(nc(s.name))))
        || null;
      if (!best) return '';
      const gr = await fetch(
        `https://www.steamgriddb.com/api/v2/grids/game/${best.id}`,
        { headers: { Authorization: `Bearer ${sgdbKey}` } }
      );
      const gd = await gr.json().catch(() => ({}));
      if (gd.success && gd.data?.length) {
        const nonAlt = gd.data.filter((d: any) => d.style !== 'alternate');
        const pool = nonAlt.length ? nonAlt : [];
        const official = pool.find((d: any) => d.style === 'official');
        const pick = official || pool[0];
        if (pick) return pick.url;
      }
    } catch { /* ignore */ }
    return '';
  }

  // Parse Steam's date strings like "21 Aug, 2024" or "Feb 22, 2025" into a Date
  function parseSteamDate(s: string): Date | null {
    if (!s) return null;
    // ISO-like
    let d = new Date(s);
    if (!isNaN(d.getTime())) return d;
    // "21 Aug, 2024" → "Aug 21, 2024"
    d = new Date(s.replace(/^(\d{1,2})\s+(\w+),?\s+(\d{4})$/, '$2 $1, $3'));
    if (!isNaN(d.getTime())) return d;
    return null;
  }


  // Scrape the SteamSpy homepage trending games table (#trendinggames).
  async function fetchSteamSpyTrending(): Promise<{ title: string; steamAppID: string }[]> {
    try {
      const res = await fetch('https://steamspy.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });
      if (!res.ok) throw new Error(`SteamSpy HTTP ${res.status}`);
      const html = await res.text();

      // Find the #trendinggames table and parse rows
      const tableMatch = html.match(/<table[^>]+id="trendinggames"[\s\S]*?<\/table>/);
      if (!tableMatch) throw new Error('trendinggames table not found');

      const results: { title: string; steamAppID: string }[] = [];
      const rowRx = /<a href=\/app\/(\d+)>\s*<img[^>]*>\s*([^<]+)<\/a>/g;
      let m: RegExpExecArray | null;
      while ((m = rowRx.exec(tableMatch[0])) !== null && results.length < 40) {
        const steamAppID = m[1];
        const title = m[2].trim();
        if (title && steamAppID && isLikelySteamGame(title)) {
          results.push({ title, steamAppID });
        }
      }

      if (!results.length) throw new Error('no rows parsed from trendinggames table');
      console.log(`SteamSpy trending: ${results.length} items`);
      return results;
    } catch (e) {
      console.warn('fetchSteamSpyTrending failed:', (e as Error).message);
      return [];
    }
  }

  // Fetch appdetails in small sequential batches to avoid Steam rate-limiting
  async function batchAppDetails(appids: number[], batchSize = 10, delayMs = 300): Promise<any[]> {
    const results: any[] = [];
    for (let i = 0; i < appids.length; i += batchSize) {
      const batch = appids.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((id: any) =>
          fetch(`https://store.steampowered.com/api/appdetails?appids=${id}&l=english`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          }).then(r => r.ok ? r.json().catch(() => ({})) : {}).catch(() => ({}))
        )
      );
      results.push(...batchResults);
      if (i + batchSize < appids.length) await new Promise(r => setTimeout(r, delayMs));
    }
    return results;
  }

  // Fetches top 50 most-played games in batches.
  // Returns top sellers + a charts-derived popular-new list as fallback for fetchSteamNewReleases.
  async function fetchSteamChartsBoth(): Promise<{
    topSellers: { title: string; steamAppID: string }[];
    popularNew: { title: string; steamAppID: string }[];
  }> {
    const steamKey = process.env.STEAM_API_KEY;
    const empty = { topSellers: [], popularNew: [] };
    if (!steamKey) { console.warn('No STEAM_API_KEY — skipping Steam rows'); return empty; }

    let appids: number[] = [];
    try {
      const chartRes = await fetch(
        `https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/?key=${steamKey}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!chartRes.ok) throw new Error(`GetMostPlayedGames HTTP ${chartRes.status}`);
      const chartData = await chartRes.json();
      const ranks: any[] = chartData?.response?.ranks || [];
      console.log(`ISteamChartsService GetMostPlayedGames: ${ranks.length} entries`);
      if (!ranks.length) throw new Error('empty ranks');
      appids = ranks.slice(0, 50).map((r: any) => r.appid).filter(Boolean);
    } catch (e) {
      console.error('GetMostPlayedGames failed:', e);
      return empty;
    }

    // Fetch in batches of 10 with 300ms delay to stay under Steam rate limits
    const detailsArr = await batchAppDetails(appids);

    const currentYear = new Date().getFullYear();
    const eighteenMonthsAgo = new Date();
    eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);

    const topSellers: { title: string; steamAppID: string }[] = [];
    const popularNew: { title: string; steamAppID: string }[] = [];

    for (let i = 0; i < detailsArr.length; i++) {
      const id = appids[i];
      const d = detailsArr[i]?.[String(id)]?.data;
      if (!d?.name || d.type !== 'game' || !isLikelySteamGame(d.name)) continue;

      const entry = { title: d.name, steamAppID: String(id) };

      // Top sellers: exclude old free-to-play (CS2, Dota2 dominate player counts)
      const isOldFTP = d.is_free === true &&
        parseInt((d.release_date?.date || '').split(/[\s,]/).pop() || '0') < currentYear - 1;
      if (!isOldFTP && topSellers.length < 30) topSellers.push(entry);

      // Popular new: released within last 18 months, ordered by player rank
      const relDate = parseSteamDate(d.release_date?.date || '');
      if (relDate && relDate >= eighteenMonthsAgo && popularNew.length < 30) popularNew.push(entry);
    }

    console.log(`Steam top sellers: ${topSellers.length}, popular new: ${popularNew.length}`);

    // Fallback for top sellers if we got too few
    if (topSellers.length < 5) {
      try {
        const r = await fetch('https://steamspy.com/api.php?request=top100in2weeks', { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const spy = await r.json();
        const fallback = (Object.values(spy as Record<string, any>) as any[])
          .filter((g: any) => g.name && isLikelySteamGame(g.name))
          .slice(0, 30)
          .map((g: any) => ({ title: g.name, steamAppID: String(g.appid) }));
        return { topSellers: fallback, popularNew };
      } catch { /* ignore */ }
    }

    return { topSellers, popularNew };
  }

  // Pre-fetch metadata (description, genre, tags, ratings) for a single discover game.
  // Called inside enrichDiscoverGames so everything is ready in the 12h cache.
  async function fetchDiscoverGameMeta(title: string, steamAppID?: string): Promise<Record<string, any>> {
    const meta: Record<string, any> = {};
    if (steamAppID && /^\d+$/.test(steamAppID)) {
      const [detailsData, reviewsData, spyTags] = await Promise.all([
        fetch(`https://store.steampowered.com/api/appdetails?appids=${steamAppID}&filters=basic,short_description,genres,release_date&l=english`)
          .then(r => r.ok ? r.json() : {}).catch(() => ({})),
        fetch(`https://store.steampowered.com/appreviews/${steamAppID}?json=1&language=all&num_per_page=0`)
          .then(r => r.ok ? r.json() : {}).catch(() => ({})),
        fetchSteamSpyTags(steamAppID),
      ]);
      const data = detailsData?.[steamAppID]?.data;
      if (data) {
        if (data.type) meta.appType = data.type;
        if (data.short_description) meta.description = data.short_description.replace(/<[^>]*>/g, '');
        if (data.genres?.[0]?.description) meta.genre = data.genres[0].description;
        if (data.release_date?.date) meta.release_date = data.release_date.date;
      }
      if (reviewsData?.success && reviewsData.query_summary?.review_score_desc) {
        const qs = reviewsData.query_summary;
        let rating = qs.review_score_desc;
        if (qs.total_reviews > 0) rating += ` (${Math.round(qs.total_positive / qs.total_reviews * 100)}%)`;
        meta.steam_rating = rating;
      }
      if (spyTags) meta.tags = spyTags;
      // SteamSpy had no tags — scrape the Steam store page directly
      if (!meta.tags) {
        const storeTags = await fetchSteamStoreTags(steamAppID);
        if (storeTags) meta.tags = storeTags;
      }
    }
    // IGDB fallback — fills in any fields still missing (covers non-Steam games entirely)
    if (!meta.description || !meta.genre || !meta.release_date || !meta.tags) {
      try {
        const igdbRes = await fetch(`http://localhost:3000/api/igdb/search?title=${encodeURIComponent(title)}`);
        if (igdbRes.ok) {
          const d = await igdbRes.json().catch(() => ({}));
          if (d.description && !meta.description) meta.description = d.description;
          if (d.genre && !meta.genre) meta.genre = d.genre;
          if (d.release_date && !meta.release_date) meta.release_date = d.release_date;
          if (d.tags && !meta.tags) meta.tags = d.tags;
          // Capture IGDB-provided Steam App ID — used as fallback when storesearch fails
          if (d.steamAppID && !meta.igdbSteamAppID) meta.igdbSteamAppID = d.steamAppID;
        }
      } catch { /* ignore */ }
    }
    return meta;
  }

  // Collect all available images from a Microsoft Store product (product-level + SKU-level)
  function getMsStoreImages(p: any): any[] {
    const productImgs: any[] = p.LocalizedProperties?.[0]?.Images || [];
    const skuImgs: any[] = p.DisplaySkuAvailabilities?.[0]?.Sku?.LocalizedProperties?.[0]?.Images || [];
    // Merge, deduplicating by URI
    const seen = new Set<string>();
    const all: any[] = [];
    for (const img of [...productImgs, ...skuImgs]) {
      if (img?.Uri && !seen.has(img.Uri)) { seen.add(img.Uri); all.push(img); }
    }
    return all;
  }

  function toAbsoluteUri(uri: string, width?: number, height?: number): string {
    let url = uri.startsWith('//') ? `https:${uri}` : uri;
    // Xbox Live image CDN requires explicit dimensions — without them it returns 400
    if ((url.includes('xboxlive.com/image') || url.includes('xbox.com/image')) && width && height) {
      if (!url.includes('&w=') && !url.includes('&h=')) {
        url += `&w=${width}&h=${height}`;
      }
    }
    return url;
  }

  // Known hash-based Steam logo URLs for games where auto-discovery fails
  const KNOWN_STEAM_LOGOS: Record<string, string> = {
    '3255890': 'https://shared.steamstatic.com/store_item_assets/steam/apps/3255890/5ad6d89cfb3cd2e3e8c7957cbb82959299dbba88/logo_2x.png',
    '3291010': 'https://shared.steamstatic.com/store_item_assets/steam/apps/3291010/9941131524c3708f04214541fbbe2250241007f9/logo_2x.png',
    '3222830': 'https://shared.steamstatic.com/store_item_assets/steam/apps/3222830/c351f98217ab1cd709656c8adbc40f14b9abb313/logo_2x.png',
  };

  // Find the Steam logo URL for a game — tries simple CDN path then store page scraping.
  async function fetchSteamLogoUrl(appid: string): Promise<string> {
    if (KNOWN_STEAM_LOGOS[appid]) return KNOWN_STEAM_LOGOS[appid];
    // Try the old simple CDN path first (works for many games)
    const simplePath = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/logo.png`;
    try {
      const r = await fetch(simplePath, { method: 'HEAD' });
      if (r.ok) return simplePath;
    } catch { /* ignore */ }

    // Scrape the Steam store page for the hash-based logo_2x.png URL
    try {
      const res = await fetch(`https://store.steampowered.com/app/${appid}/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Cookie': 'birthtime=0; lastagecheckage=1-0-1900; mature_content=1; wants_mature_content=1',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });
      if (!res.ok) return '';
      const html = await res.text();
      // Match in img src, JSON strings (escaped slashes), or any URL occurrence
      const patterns = [
        new RegExp(`store_item_assets/steam/apps/${appid}/([a-f0-9]{20,})/logo`, 'i'),
        new RegExp(`store_item_assets\\\\/steam\\\\/apps\\\\/${appid}\\\\/([a-f0-9]{20,})\\\\/logo`, 'i'),
        new RegExp(`apps[/\\\\]+${appid}[/\\\\]+([a-f0-9]{40})[/\\\\]+logo`, 'i'),
      ];
      for (const pattern of patterns) {
        const m = html.match(pattern);
        if (m) return `https://shared.steamstatic.com/store_item_assets/steam/apps/${appid}/${m[1]}/logo_2x.png`;
      }
    } catch { /* ignore */ }
    return '';
  }

  // Pick the best portrait image URL from a Microsoft Store product's image list
  function getMsStorePortraitArt(p: any): string {
    const images = getMsStoreImages(p);
    const byPurpose = (purpose: string) => images.find((img: any) => img.ImagePurpose === purpose);
    const pick = byPurpose('Poster') || byPurpose('BoxArt') || byPurpose('BrandedKeyArt')
      || images.find((img: any) => img.Height > img.Width)
      || images.find((img: any) => img.Width >= 200) // any reasonably-sized image
      || images[0];
    return pick?.Uri ? toAbsoluteUri(pick.Uri, 600, 900) : '';
  }

  // Pick the best wide/hero image URL from a Microsoft Store product's image list
  function getMsStoreBannerArt(p: any): string {
    const images = getMsStoreImages(p);
    const byPurpose = (purpose: string) => images.find((img: any) => img.ImagePurpose === purpose);
    const pick = byPurpose('SuperHeroArt') || byPurpose('TitledHeroArt')
      || byPurpose('FeaturePromotionalSquareArt')
      || images.find((img: any) => img.Width > img.Height && img.Width >= 800);
    return pick?.Uri ? toAbsoluteUri(pick.Uri, 1920, 620) : '';
  }

  // Extract the MS Store category as a genre string — e.g. "Games.FamilyKids" → "Family Kids"
  function getMsStoreGenre(p: any): string {
    const raw: string = p.Properties?.Category || '';
    if (!raw) return '';
    return raw.replace(/^Games\.?/i, '').replace(/([A-Z])/g, (m, c, o) => o > 0 ? ` ${c}` : c).trim();
  }

  // Resolve a list of Microsoft Store IDs to game titles + MS Store artwork via displaycatalog
  async function resolveGamePassStoreIds(storeIds: string[]): Promise<{ title: string; msArt: string; msBanner: string; msDescription: string; msGenre: string }[]> {
    const CHUNK = 20;
    const titles: { title: string; msArt: string; msBanner: string; msDescription: string; msGenre: string }[] = [];
    for (let i = 0; i < storeIds.length; i += CHUNK) {
      const chunk = storeIds.slice(i, i + CHUNK);
      try {
        const res = await fetch(
          `https://displaycatalog.mp.microsoft.com/v7.0/products?market=US&languages=en-us&bigIds=${chunk.join(',')}`,
          { headers: { Accept: 'application/json' } }
        );
        if (!res.ok) { console.warn(`displaycatalog chunk HTTP ${res.status}`); continue; }
        const data = await res.json();
        const products = data.Products || [];
        console.log(`displaycatalog chunk ${i / CHUNK + 1}: ${chunk.length} IDs → ${products.length} products`);
        for (const p of products) {
          const title = p.LocalizedProperties?.[0]?.ProductTitle || '';
          const msDescription = p.LocalizedProperties?.[0]?.ShortDescription
            || p.LocalizedProperties?.[0]?.ProductDescription?.split('\n')[0]
            || '';
          if (title) titles.push({
            title,
            msArt: getMsStorePortraitArt(p),
            msBanner: getMsStoreBannerArt(p),
            msDescription,
            msGenre: getMsStoreGenre(p),
          });
        }
      } catch (e) {
        console.warn(`displaycatalog chunk failed:`, (e as Error).message);
      }
    }
    return titles;
  }

  // Fetch recently added Game Pass titles. Uses "New to Game Pass" siglist (up to ~32 titles),
  // supplemented from the full PC Game Pass list if fewer than 40 are returned.
  async function fetchGamePassNewTitles(): Promise<{ title: string; steamAppID: string; artworkFallback?: string; bannerFallback?: string; msDescription?: string; msGenre?: string }[]> {
    const extractIds = (data: any[]) =>
      data.filter((i: any) => i.id && typeof i.id === 'string' && !i.language).map((i: any) => i.id);

    try {
      // Fetch "New to Game Pass" and full PC Game Pass lists in parallel
      const [newRes, allRes] = await Promise.all([
        fetch('https://catalog.gamepass.com/sigls/v2?id=f13cf6b4-57e6-4459-89df-6aec18cf0538&language=en-us&market=US', { headers: { Accept: 'application/json' } }),
        fetch('https://catalog.gamepass.com/sigls/v2?id=fdd9e2a7-0fee-49f6-ad69-4354098401ff&language=en-us&market=US', { headers: { Accept: 'application/json' } }),
      ]);

      const newIds = newRes.ok ? extractIds(await newRes.json()) : [];
      const allIds = allRes.ok ? extractIds(await allRes.json()) : [];
      console.log(`Game Pass sigls: ${newIds.length} new, ${allIds.length} total PC`);

      // Cross-reference "New to Game Pass" against PC catalog — filters out console/mobile-only titles
      const allIdSet = new Set(allIds);
      const pcNewIds = newIds.filter(id => allIdSet.has(id));
      console.log(`Game Pass PC-only new titles: ${pcNewIds.length}`);

      // Resolve "new" PC titles first
      const titles = await resolveGamePassStoreIds(pcNewIds);

      // Supplement from full list if we have fewer than 40
      if (titles.length < 40 && allIds.length) {
        const newIdSet = new Set(newIds);
        const supplementIds = allIds.filter(id => !newIdSet.has(id)).slice(0, 40 - titles.length + 10);
        const extra = await resolveGamePassStoreIds(supplementIds);
        const existing = new Set(titles.map(t => t.title.toLowerCase()));
        for (const t of extra) {
          if (!existing.has(t.title.toLowerCase())) {
            titles.push(t);
            existing.add(t.title.toLowerCase());
          }
          if (titles.length >= 40) break;
        }
      }

      // Strip suffixes and symbols that break Steam ID matching
      const stripPreviewSuffix = (t: string) =>
        t.replace(/\s*\(Game Preview\)\s*$/i, '')
         .replace(/\s*\(Early Access\)\s*$/i, '')
         .replace(/\s*\(Beta\)\s*$/i, '')
         .replace(/[\u00AE\u2122\u00A9]/g, '') // strip ®, ™, ©
         .trim();

      // Look up Steam App IDs for all titles so enrichDiscoverGames has a CDN art fallback
      const withIds: { title: string; steamAppID: string; artworkFallback?: string; bannerFallback?: string; msDescription?: string; msGenre?: string }[] = [];
      const lookups = await Promise.all(
        titles.slice(0, 40).map(t => {
          const searchTitle = stripPreviewSuffix(t.title);
          return fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(searchTitle)}&l=english&cc=US`)
            .then(r => r.ok ? r.json().catch(() => ({})) : {})
            .catch(() => ({}));
        })
      );
      for (let i = 0; i < titles.length && i < 40; i++) {
        const cleanTitle = stripPreviewSuffix(titles[i].title);
        const items: any[] = lookups[i]?.items || [];
        const titleClean = cleanTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        const titleWords = titleClean.split(/\s+/).filter((w: string) => w.length > 1);
        // Require exact match OR all words present — never blindly take items[0] (wrong Steam ID worse than none)
        const match = items.find((it: any) => it.name?.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() === titleClean)
          || items.find((it: any) => {
            const n = it.name?.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() || '';
            return titleWords.length >= 2 && titleWords.every((w: string) => n.includes(w));
          })
          || null;
        withIds.push({
          title: cleanTitle,   // store the clean title — no "(Game Preview)" in display or searches
          steamAppID: match?.id ? String(match.id) : '',
          artworkFallback: titles[i].msArt || undefined,
          bannerFallback: titles[i].msBanner || undefined,
          msDescription: titles[i].msDescription || undefined,
          msGenre: titles[i].msGenre || undefined,
        });
      }

      console.log(`Game Pass titles resolved: ${withIds.length} (${withIds.filter(t => t.steamAppID).length} with Steam ID)`);
      return withIds;
    } catch (e) {
      console.error('fetchGamePassNewTitles failed:', e);
      return [];
    }
  }

  function buildEpicSearchUrl(title: string): string {
    return `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(title)}&sortBy=relevancy&sortDir=DESC&count=40`;
  }

  // Games permanently free on Epic Games Store (steamAppId = null means not on Steam)
  const EPIC_ALWAYS_FREE: { title: string; epicUrl: string; steamAppId?: string }[] = [
    { title: 'Fortnite', epicUrl: 'https://store.epicgames.com/en-US/p/fortnite' },
    { title: 'Rocket League', epicUrl: 'https://store.epicgames.com/en-US/p/rocket-league' },
    { title: 'Fall Guys', epicUrl: 'https://store.epicgames.com/en-US/p/fall-guys' },
    { title: 'Genshin Impact', epicUrl: 'https://store.epicgames.com/en-US/p/genshin-impact' },
    { title: 'Destiny 2', epicUrl: 'https://store.epicgames.com/en-US/p/destiny-2', steamAppId: '1085660' },
    { title: 'Warframe', epicUrl: 'https://store.epicgames.com/en-US/p/warframe', steamAppId: '230410' },
    { title: 'Path of Exile', epicUrl: 'https://store.epicgames.com/en-US/p/path-of-exile', steamAppId: '238960' },
    { title: 'Dauntless', epicUrl: 'https://store.epicgames.com/en-US/p/dauntless' },
    { title: 'Paladins', epicUrl: 'https://store.epicgames.com/en-US/p/paladins', steamAppId: '444090' },
    { title: 'Smite', epicUrl: 'https://store.epicgames.com/en-US/p/smite', steamAppId: '386360' },
    { title: 'Smite 2', epicUrl: 'https://store.epicgames.com/en-US/p/smite-2', steamAppId: '2425580' },
    { title: 'Splitgate', epicUrl: 'https://store.epicgames.com/en-US/p/splitgate', steamAppId: '677620' },
    { title: 'Kena: Bridge of Spirits', epicUrl: 'https://store.epicgames.com/en-US/p/kena-bridge-of-spirits', steamAppId: '1598530' },
  ];

  // Known Steam App IDs for games that are commonly added without proper lookup
  const KNOWN_STEAM_IDS: Record<string, string> = {

    'destiny 2': '1085660',
    'warframe': '230410',
    'path of exile': '238960',
    'kena bridge of spirits': '1598530',
    'kena: bridge of spirits': '1598530',
    'paladins': '444090',
    'smite': '386360',
    'smite 2': '2425580',
    'splitgate': '677620',
    'star citizen': '', // NOT on Steam
  };

  // Fetch current free Epic Games titles (efg.cipta.dev with official Epic API fallback)
  async function fetchEpicFreeGames(): Promise<{ title: string; epicUrl?: string }[]> {
    try {
      const res = await fetch('https://efg.cipta.dev', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('efg.cipta.dev unavailable');
      const data = await res.json();
      const results = (data.data || [])
        .filter((g: any) => g.status === 'Free Now' && g.name)
        .map((g: any) => ({
          title: g.name,
          // game_url from efg.cipta.dev can have incorrect slugs — use search URL as reliable fallback
          epicUrl: (g.game_url && g.game_url.startsWith('https://store.epicgames.com/en-US/p/'))
            ? g.game_url
            : buildEpicSearchUrl(g.name),
        }));
      return results;
    } catch {
      // Fallback: official Epic promotions API
      try {
        const res = await fetch(
          'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US',
          { headers: { Accept: 'application/json' } }
        );
        const data = await res.json();
        const now = new Date();
        return (data?.data?.Catalog?.searchStore?.elements || [])
          .filter((g: any) => {
            const offers = g.promotions?.promotionalOffers?.[0]?.promotionalOffers || [];
            return offers.some((o: any) => {
              const start = new Date(o.startDate);
              const end = new Date(o.endDate);
              return now >= start && now <= end && o.discountSetting?.discountPercentage === 0;
            });
          })
          .filter((g: any) => g.title && !g.title.includes('Mystery Game') && g.offerType === 'BASE_GAME')
          .map((g: any) => {
            // Prefer pageSlug (from catalogNs.mappings) — most reliable for product page URLs
            // Skip productSlug with /home suffix noise; skip UUID-style urlSlugs
            const pageSlug = g.catalogNs?.mappings?.[0]?.pageSlug;
            const productSlug = g.productSlug?.replace(/\/home$/, '');
            const urlSlug = g.urlSlug && !/^[0-9a-f]{8}-?[0-9a-f]{4}|^[0-9a-f]{32}/i.test(g.urlSlug) ? g.urlSlug : null;
            const slug = pageSlug || productSlug || urlSlug;
            return { title: g.title, epicUrl: slug ? `https://store.epicgames.com/en-US/p/${slug}` : buildEpicSearchUrl(g.title) };
          });
      } catch (e2) {
        console.error('Epic free games fetch failed:', e2);
        return [];
      }
    }
  }

  // Enrich a list of games with SGDB art + full metadata (pre-cached in the 12h discover cache).
  // Batches of 5 to avoid hammering SGDB/Steam rate limits.
  async function enrichDiscoverGames(
    games: { title: string; steamAppID?: string; artworkFallback?: string; bannerFallback?: string; msDescription?: string; msGenre?: string; epicUrl?: string }[],
    prefix: string
  ): Promise<any[]> {
    const BATCH = 5;
    const results: any[] = [];
    for (let start = 0; start < games.length; start += BATCH) {
      const batch = games.slice(start, start + BATCH);
      const batchResults = await Promise.all(batch.map(async (g, bi) => {
        try {
        const i = start + bi;
        const sid = (g.steamAppID || '').toString().trim();
        let validSid = sid && /^\d+$/.test(sid) ? sid : undefined;

        // Fetch metadata first — IGDB may return a Steam App ID when storesearch failed
        const meta = await fetchDiscoverGameMeta(g.title, validSid);

        // Drop non-game Steam items (tools, software, applications like Vtube Studio)
        if (meta.appType && meta.appType !== 'game') return null;

        // Use IGDB-provided Steam ID as fallback if storesearch didn't find one
        if (!validSid && meta.igdbSteamAppID) {
          validSid = meta.igdbSteamAppID;
          console.log(`[enrichDiscoverGames] IGDB supplied Steam ID ${validSid} for "${g.title}"`);
        }

        // Final fallback: SearchApps (same endpoint as game-suggestions, less likely to be rate-limited)
        if (!validSid) {
          try {
            const sr = await fetch(`https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(g.title)}`);
            const saItems: any[] = await sr.json().catch(() => []);
            const normT = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
            const exact = saItems.find((i: any) => normT(i.name) === normT(g.title));
            if (exact) {
              validSid = String(exact.appid);
              console.log(`[enrichDiscoverGames] SearchApps found ID ${validSid} for "${g.title}"`);
            }
          } catch { /* ignore */ }
        }

        // Steam CDN URLs — valid for any published Steam game
        const steamCdnPortrait = validSid ? `https://shared.steamstatic.com/store_item_assets/steam/apps/${validSid}/library_600x900_2x.jpg` : null;
        const steamCdnHero    = validSid ? `https://shared.steamstatic.com/store_item_assets/steam/apps/${validSid}/library_hero.jpg` : null;
        const steamCdnHeader  = validSid ? `https://shared.steamstatic.com/store_item_assets/steam/apps/${validSid}/header.jpg` : null;

        // Fetch SGDB art — SGDB is primary, Steam CDN is fallback
        const [sgdbPortrait, sgdbHero, sgdbLogo] = await Promise.all([
          getSgdbPortraitArt(g.title, validSid),
          getSgdbHeroArt(g.title, validSid),
          getSgdbLogoArt(g.title, validSid),
        ]);

        // MS Store fallbacks — applied when Steam + IGDB return nothing
        if (!meta.description && g.msDescription) meta.description = g.msDescription;
        if (!meta.genre && g.msGenre) meta.genre = g.msGenre;
        if (!meta.tags && g.msGenre) meta.tags = g.msGenre;

        // Logo: SGDB only — Steam CDN logo.png omitted (returns 200 blank image, breaks onError chain)
        const logo = sgdbLogo || undefined;

        // Portrait: SGDB → Steam CDN → MS Store → drop
        const finalArt = sgdbPortrait || steamCdnPortrait || g.artworkFallback || null;
        if (!finalArt) return null;
        return {
          _external: true,
          id: `${prefix}-${i}`,
          title: g.title,
          artwork: finalArt,
          verticalArt: finalArt,
          horizontalArt: steamCdnHeader || g.bannerFallback || sgdbHero || finalArt,
          banner: sgdbHero || steamCdnHero || g.bannerFallback || undefined,
          logo: logo || undefined,
          steamAppID: validSid,
          steam_url: validSid ? `https://store.steampowered.com/app/${validSid}/` : undefined,
          epicUrl: (g as any).epicUrl || undefined,
          alwaysFree: (g as any).alwaysFree || false,
          // Expose MS Store art so frontend onError can use it when CDN URLs 404
          msArt: g.artworkFallback || undefined,
          msBanner: g.bannerFallback || undefined,
          ...meta,
        };
        } catch (e) {
          console.warn(`[enrichDiscoverGames] skipping "${g.title}":`, (e as any).message);
          return null;
        }
      }));
      results.push(...batchResults.filter(Boolean));
    }
    return results;
  }

  // Fetch horizontal artwork for a game via SGDB, with Steam CDN as fallback
  async function getHorizontalArtwork(title: string, steamAppID?: string): Promise<string> {
    const sid = steamAppID?.toString().trim();
    const sgdbKey = process.env.STEAMGRIDDB_API_KEY;
    if (sid && /^\d+$/.test(sid)) {
      // Try SGDB by Steam App ID first — orientation=horizontal ensures 460x215/920x430 only
      if (sgdbKey) {
        try {
          const gr = await fetch(
            `https://www.steamgriddb.com/api/v2/grids/steam/${sid}?orientation=horizontal`,
            { headers: { Authorization: `Bearer ${sgdbKey}` } }
          );
          const gd = await gr.json().catch(() => ({}));
          if (gd.success && gd.data?.length) {
            const official = gd.data.find((d: any) => d.style === 'official');
            return official?.url || gd.data[0].url;
          }
        } catch { /* ignore */ }
      }
      // Fallback to Steam CDN
      return `https://shared.steamstatic.com/store_item_assets/steam/apps/${sid}/header.jpg`;
    }
    if (!sgdbKey) return '';
    try {
      const nc = (n: string) => n.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const qc = nc(title);
      const qw = qc.split(/\s+/).filter((w: string) => w.length > 0);
      const sr = await fetch(
        `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(title)}`,
        { headers: { Authorization: `Bearer ${sgdbKey}` } }
      );
      const sd = await sr.json().catch(() => ({}));
      if (!sd.success || !sd.data?.length) return '';
      const best = sd.data.find((s: any) => nc(s.name) === qc)
        || sd.data.find((s: any) => qw.every((w: string) => new RegExp(`\\b${w}\\b`).test(nc(s.name))))
        || null;
      if (!best) return '';
      const gr = await fetch(
        `https://www.steamgriddb.com/api/v2/grids/game/${best.id}?dimensions=920x430,460x215`,
        { headers: { Authorization: `Bearer ${sgdbKey}` } }
      );
      const gd = await gr.json().catch(() => ({}));
      if (gd.success && gd.data?.length) {
        const official = gd.data.find((d: any) => d.style === 'official');
        return official?.url || gd.data[0].url;
      }
    } catch { /* ignore */ }
    return '';
  }

  // Fetch SGDB hero (banner) art for a game. Falls back to Steam CDN hero for Steam games.
  async function getSgdbHeroArt(title: string, steamAppID?: string): Promise<string> {
    const sgdbKey = process.env.STEAMGRIDDB_API_KEY;
    if (!sgdbKey) return '';
    const sid = steamAppID?.toString().trim();
    if (sid && /^\d+$/.test(sid)) {
      try {
        const gr = await fetch(`https://www.steamgriddb.com/api/v2/heroes/steam/${sid}`, { headers: { Authorization: `Bearer ${sgdbKey}` } });
        const gd = await gr.json().catch(() => ({}));
        if (gd.success && gd.data?.length) return gd.data[0].url;
      } catch { /* ignore */ }
      // Steam ID lookup found no hero — fall through to name search below
    }
    // Autocomplete search (non-Steam games + Steam games SGDB doesn't index by ID yet)
    try {
      const nc = (n: string) => n.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const sr = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(title)}`, { headers: { Authorization: `Bearer ${sgdbKey}` } });
      const sd = await sr.json().catch(() => ({}));
      if (!sd.success || !sd.data?.length) return '';
      const best = sd.data.find((s: any) => nc(s.name) === nc(title)) || sd.data[0];
      if (!best) return '';
      const gr = await fetch(`https://www.steamgriddb.com/api/v2/heroes/game/${best.id}`, { headers: { Authorization: `Bearer ${sgdbKey}` } });
      const gd = await gr.json().catch(() => ({}));
      if (gd.success && gd.data?.length) return gd.data[0].url;
    } catch { /* ignore */ }
    return '';
  }

  // Fetch SGDB logo art for a game. Prefers wide white/custom logos.
  async function getSgdbLogoArt(title: string, steamAppID?: string): Promise<string> {
    const sgdbKey = process.env.STEAMGRIDDB_API_KEY;
    if (!sgdbKey) return '';
    const sid = steamAppID?.toString().trim();
    const pickLogo = (data: any[]) => {
      const enLogos = data.filter((l: any) => !l.language || l.language === 'en');
      const pool = enLogos.length ? enLogos : data;
      const whites = pool.filter((l: any) => l.style === 'white' || l.style === 'custom');
      const candidates = whites.length ? whites : pool;
      return [...candidates].sort((a: any, b: any) => (b.width / b.height) - (a.width / a.height))[0]?.url || '';
    };
    if (sid && /^\d+$/.test(sid)) {
      try {
        const gr = await fetch(`https://www.steamgriddb.com/api/v2/logos/steam/${sid}`, { headers: { Authorization: `Bearer ${sgdbKey}` } });
        const gd = await gr.json().catch(() => ({}));
        if (gd.success && gd.data?.length) return pickLogo(gd.data);
      } catch { /* ignore */ }
      // Steam ID lookup failed — fall through to name search
    }
    // Name-based autocomplete search (covers non-Steam games and Steam games SGDB doesn't index by ID)
    try {
      const nc = (n: string) => n.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const sr = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(title)}`, { headers: { Authorization: `Bearer ${sgdbKey}` } });
      const sd = await sr.json().catch(() => ({}));
      if (!sd.success || !sd.data?.length) return '';
      const best = sd.data.find((s: any) => nc(s.name) === nc(title)) || sd.data[0];
      if (!best) return '';
      const gr = await fetch(`https://www.steamgriddb.com/api/v2/logos/game/${best.id}`, { headers: { Authorization: `Bearer ${sgdbKey}` } });
      const gd = await gr.json().catch(() => ({}));
      if (gd.success && gd.data?.length) return pickLogo(gd.data);
    } catch { /* ignore */ }
    // SGDB has no logo — scrape Steam store page for hash-based logo_2x.png
    if (sid && /^\d+$/.test(sid)) {
      const steamLogo = await fetchSteamLogoUrl(sid);
      if (steamLogo) return steamLogo;
    }
    return '';
  }

  async function fetchDiscoverAll(): Promise<{ recentlyReleased: any[]; trending: any[]; gamePass: any[]; epicFree: any[] }> {
    if (discoverCache && Date.now() - discoverCache.timestamp < DISCOVER_CACHE_TTL) {
      return discoverCache as any;
    }

    // Fetch all data sources in parallel — Steam charts supplies top sellers + fallback for new releases
    const [steamRows, rawGamePass, weeklyEpicFree] = await Promise.all([
      fetchSteamChartsBoth(),
      fetchGamePassNewTitles(),
      fetchEpicFreeGames(),
    ]);
    // Weekly (temporarily) free games — used for the hero banner
    const rawEpicWeekly = weeklyEpicFree;
    // Always-free titles merged in separately (tagged so the banner can exclude them)
    // steamAppId → steamAppID rename so enrichDiscoverGames picks it up
    const epicFreeTitles = new Set(weeklyEpicFree.map((g: any) => g.title.toLowerCase()));
    const rawEpicAlways = EPIC_ALWAYS_FREE.filter(g => !epicFreeTitles.has(g.title.toLowerCase()))
      .map(g => ({ title: g.title, epicUrl: g.epicUrl, steamAppID: g.steamAppId || '', alwaysFree: true }));
    const rawEpicFree = [...rawEpicWeekly, ...rawEpicAlways];

    const rawTopSellers = steamRows.topSellers;
    const rawNewReleases = await fetchSteamSpyTrending();

    // Enrich with SGDB art — games without SGDB portrait art are filtered out
    const [recentlyReleased, trending, gamePass, epicFree] = await Promise.all([
      enrichDiscoverGames(rawNewReleases, 'new'),
      enrichDiscoverGames(rawTopSellers, 'trending'),
      enrichDiscoverGames(rawGamePass, 'gp'),
      enrichDiscoverGames(rawEpicFree, 'epic'),
    ]);

    discoverCache = { recentlyReleased, trending, gamePass, epicFree, timestamp: Date.now() } as any;
    return { recentlyReleased, trending, gamePass, epicFree };
  }

  async function fetchSuggestedForUser(userId: number, bust = false): Promise<any[]> {
    if (!bust) {
      const cached = suggestedCache.get(userId);
      if (cached && Date.now() - cached.timestamp < SUGGESTED_CACHE_TTL) return cached.data;
    } else {
      suggestedCache.delete(userId);
    }

    // Collect all tags from user's games and launcher_games
    const userGames = db.prepare(`
      SELECT tags FROM games WHERE user_id = ? AND tags IS NOT NULL AND tags != ''
      UNION ALL
      SELECT tags FROM launcher_games WHERE user_id = ? AND tags IS NOT NULL AND tags != ''
    `).all(userId, userId) as { tags: string }[];

    // Build set of owned steam app IDs and normalised titles
    const ownedSteamIds = new Set<string>();
    const ownedTitles = new Set<string>();
    const allOwned = db.prepare(`
      SELECT title, steam_url, '' AS external_id FROM games WHERE user_id = ?
      UNION ALL
      SELECT title, '' AS steam_url, external_id FROM launcher_games WHERE user_id = ?
    `).all(userId, userId) as { title: string; steam_url: string; external_id: string }[];
    for (const g of allOwned) {
      ownedTitles.add(g.title.toLowerCase().trim());
      const m = g.steam_url?.match(/app\/(\d+)/);
      if (m) ownedSteamIds.add(m[1]);
      if (g.external_id && /^\d+$/.test(g.external_id)) ownedSteamIds.add(g.external_id);
    }

    // Count tag frequency across all user games, compute per-tag weight
    const tagCount = new Map<string, number>();
    const totalGameCount = userGames.length;
    for (const row of userGames) {
      for (const tag of row.tags.split(',').map((t: string) => t.trim()).filter(Boolean)) {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      }
    }
    if (tagCount.size === 0) return [];

    // Top 10 tags, each with a normalised weight (frequency / total games)
    const topTagEntries = Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const tagWeight = new Map<string, number>(
      topTagEntries.map(([tag, count]) => [tag, count / totalGameCount])
    );
    const topTags = topTagEntries.map(([tag]) => tag);

    console.log(`[suggested] user ${userId} top tags:`, topTags);

    // Query SteamSpy per tag; track which tags each candidate matched
    const candidateMap = new Map<string, { appid: string; title: string; matchedTags: Set<string>; positive: number }>();
    for (const tag of topTags) {
      try {
        const res = await fetch(`https://steamspy.com/api.php?request=tag&tag=${encodeURIComponent(tag)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        if (!res.ok) continue;
        const data = await res.json() as Record<string, any>;
        for (const [appid, game] of Object.entries(data)) {
          if (!game.name || ownedSteamIds.has(appid) || ownedTitles.has(game.name.toLowerCase().trim())) continue;
          if (!isLikelySteamGame(game.name)) continue;
          const c = candidateMap.get(appid);
          if (c) { c.matchedTags.add(tag); }
          else { candidateMap.set(appid, { appid, title: game.name, matchedTags: new Set([tag]), positive: game.positive || 0 }); }
        }
      } catch (e) { console.warn(`[suggested] tag "${tag}" failed:`, (e as any).message); }
    }

    // Score each candidate:
    //   weightedSum = sum of each matched tag's weight
    //   comboScore  = weightedSum * matchCount^1.5  (exponentially rewards matching more tags together)
    // Require at least 2 matched tags so single-tag flukes are excluded
    const pool = Array.from(candidateMap.values())
      .filter(c => c.matchedTags.size >= 2)
      .map(c => {
        const weightedSum = Array.from(c.matchedTags).reduce((acc, tag) => acc + (tagWeight.get(tag) ?? 0), 0);
        const comboScore = weightedSum * Math.pow(c.matchedTags.size, 1.5);
        return { ...c, comboScore };
      })
      .sort((a, b) => b.comboScore - a.comboScore || b.positive - a.positive);

    // Weighted random sampling from the top 80 — high-scoring games are likely to appear
    // but not guaranteed, so each weekly refresh produces a fresh mix
    const topPool = pool.slice(0, 80);
    const totalWeight = topPool.reduce((s, c) => s + c.comboScore, 0);
    const scored: typeof topPool = [];
    const remaining = [...topPool];
    const TARGET = 30;
    while (scored.length < TARGET && remaining.length > 0) {
      let r = Math.random() * remaining.reduce((s, c) => s + c.comboScore, 0);
      let idx = 0;
      for (let i = 0; i < remaining.length; i++) {
        r -= remaining[i].comboScore;
        if (r <= 0) { idx = i; break; }
      }
      scored.push(remaining.splice(idx, 1)[0]);
    }

    console.log(`[suggested] user ${userId}: ${candidateMap.size} candidates, ${pool.length} after combo filter, sampled ${scored.length}`);

    const enriched = await enrichDiscoverGames(scored.map(g => ({ title: g.title, steamAppID: g.appid })), 'sfy');
    suggestedCache.set(userId, { data: enriched, timestamp: Date.now() });
    return enriched;
  }

    app.get("/api/home/suggested-for-you", authenticateToken, async (req: any, res) => {
      try {
        const bust = req.query.bust === 'true';
        const data = await fetchSuggestedForUser(req.user.id, bust);
        res.json(data);
      } catch (error) {
        console.error('suggested-for-you error:', error);
        res.status(500).json({ error: "Failed to fetch suggestions" });
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

      // Friends activity: check 24h cache before making expensive per-friend API calls
      const activityCached = friendsActivityCache.get(userId);
      const activityCacheFresh = !!activityCached && (Date.now() - activityCached.timestamp < FRIENDS_ACTIVITY_TTL);
      let allFriendActivities: any[] = [];

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

                // Only fetch per-friend recently-played data when cache is stale
                if (!activityCacheFresh) {
                  const steamActivityItems = await Promise.all(
                    steamFriends.slice(0, 5).map(async (friend: any) => {
                      try {
                        const recentRes = await fetch(
                          `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${friend.id}&count=1`
                        );
                        if (!recentRes.ok) return null;
                        const recentData = await recentRes.json();
                        const recentGame = recentData.response?.games?.[0];
                        if (!recentGame) return null;
                        const appid = String(recentGame.appid);
                        const sgdbArtwork = await getHorizontalArtwork(recentGame.name, appid);
                        const artwork = sgdbArtwork || `https://shared.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;
                        return {
                          _external: true,
                          id: `steam-friend-${friend.id}-${appid}`,
                          title: recentGame.name,
                          artwork,
                          genre: '',
                          steamAppID: appid,
                          platform: 'steam',
                          friendName: friend.username,
                          friendAvatar: friend.avatar,
                        };
                      } catch { return null; }
                    })
                  );
                  allFriendActivities.push(...steamActivityItems.filter(Boolean));
                }
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

                  // Friends Activity: per-friend TitleHub — only when cache is stale
                  if (!activityCacheFresh) {
                    const xblHeadersFA: Record<string, string> = {
                      'x-xbl-contract-version': '2',
                      'Authorization': `XBL3.0 x=${userHash};${xstsToken}`,
                      'Accept-Language': 'en-US',
                      'Accept': 'application/json'
                    };
                    const activityItems = await Promise.all(
                      (peopleData.people || []).slice(0, 5).map(async (person: any) => {
                        if (!person.xuid) return null;
                        try {
                          const thRes = await fetch(
                            `https://titlehub.xboxlive.com/users/xuid(${person.xuid})/titles/titlehistory/decoration/detail`,
                            { headers: xblHeadersFA }
                          );
                          if (!thRes.ok) return null;
                          const titles = (await thRes.json()).titles || [];
                          const recent = titles.find((t: any) => t.titleHistory?.lastTimePlayed && t.displayImage);
                          if (!recent) return null;
                          const gameName = recent.name || '';
                          if (!gameName) return null;
                          const sgdbArtwork = await getHorizontalArtwork(gameName);
                          const artwork = sgdbArtwork || '';
                          return {
                            _external: true,
                            id: `friend-${person.xuid}`,
                            title: gameName,
                            artwork,
                            genre: recent.detail?.genres?.[0] || '',
                            platform: 'xbox',
                            friendName: person.gamertag,
                            friendAvatar: person.displayPicRaw || '',
                            lastPlayed: recent.titleHistory?.lastTimePlayed || '',
                          };
                        } catch { return null; }
                      })
                    );
                    allFriendActivities.push(...activityItems.filter(Boolean));
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch Xbox friends:", e);
        }
      }

      // Update cache with fresh raw items; otherwise use cached items
      if (!activityCacheFresh && allFriendActivities.length > 0) {
        friendsActivityCache.set(userId, { items: allFriendActivities, timestamp: Date.now() });
      }
      const rawActivityItems: any[] = activityCacheFresh ? activityCached!.items : allFriendActivities;

      // Cross-platform DB matching — runs on every request so library/log changes are reflected immediately.
      // Artwork is always fetched fresh (1h cache) so SGDB art is always correct horizontal grids.
      const ncA = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const launcherRows = db.prepare('SELECT id, title, external_id, platform FROM launcher_games WHERE user_id = ?').all(userId) as any[];
      const questlogRows = db.prepare('SELECT id, title, steam_url FROM games WHERE user_id = ?').all(userId) as any[];
      (req as any)._friendsActivity = await Promise.all(rawActivityItems.map(async (item: any) => {
        const titleNc = ncA(item.title);
        const libMatch = launcherRows.find((g: any) =>
          (item.steamAppID && g.external_id === item.steamAppID) ||
          ncA(g.title) === titleNc
        );
        const logMatch = !libMatch && questlogRows.find((g: any) => ncA(g.title) === titleNc);
        // Best steamAppID: from item itself, or from a matched Steam library entry
        const resolvedSteamId = item.steamAppID ||
          (libMatch?.platform === 'steam' && libMatch.external_id ? libMatch.external_id : null) ||
          (logMatch?.steam_url ? (logMatch.steam_url.match(/\/app\/(\d+)/)?.[1] ?? null) : null);
        // Always fetch fresh horizontal artwork (1h cache); Steam games always get header.jpg fallback
        const artwork = await getHorizontalArtworkCached(item.title, resolvedSteamId || undefined) || item.artwork;
        return {
          ...item,
          artwork,
          matchedLibraryId: libMatch?.id ?? null,
          matchedQuestlogId: logMatch ? logMatch.id : null
        };
      }));

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

      // 2.2 Recent Achievements — parse all games' achievement JSON, filter unlocked, sort by unlockTime desc
      const allAchievementRows = db.prepare(`
        SELECT lg.title as game_title, lg.artwork as game_artwork, lg.external_id,
               u.username, u.avatar as user_avatar, lg.achievements
        FROM launcher_games lg
        JOIN users u ON lg.user_id = u.id
        WHERE u.id = ?
        AND lg.achievements IS NOT NULL AND lg.achievements != '[]'
      `).all(userId) as any[];

      const formattedAchievements = allAchievementRows
        .flatMap((item) => {
          try {
            const achs = JSON.parse(item.achievements);
            return achs
              .filter((a: any) => a.unlocked === true && a.unlockTime && Number(a.unlockTime) > 0)
              .map((a: any) => ({
                id: a.id,
                name: a.name,
                description: a.description,
                icon: a.icon,
                unlocked: true,
                unlockTime: Number(a.unlockTime),
                gameTitle: item.game_title,
                gameArtwork: item.game_artwork,
                username: item.username,
                userAvatar: item.user_avatar,
              }));
          } catch (e) {
            return [];
          }
        })
        .sort((a: any, b: any) => b.unlockTime - a.unlockTime)
        .slice(0, 10);

      // 3. Suggested from Log (QuestLog)
      const suggestedLog = db.prepare(`
        SELECT * FROM games 
        WHERE user_id = ? AND status = 'to-play'
        ORDER BY RANDOM() LIMIT 5
      `).all(userId);

      // 3.1 Suggested from Library (exclude hidden)
      const suggestedLibrary = db.prepare(`
        SELECT * FROM launcher_games
        WHERE user_id = ? AND (hidden IS NULL OR hidden != 1)
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

      // Aggregate SteamSpy tags from launcher_games
      const tagRows = db.prepare("SELECT tags FROM launcher_games WHERE user_id = ? AND tags IS NOT NULL AND tags != ''").all(userId) as { tags: string }[];
      const tagCount = new Map<string, number>();
      for (const row of tagRows) {
        for (const tag of row.tags.split(',').map((t: string) => t.trim()).filter(Boolean)) {
          tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
        }
      }
      const tagStats = Array.from(tagCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([tag, count]) => ({ tag, count }));

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
          WHERE user_id = ? AND price_dropped = 1
          ORDER BY created_at DESC LIMIT 5
        `).all(userId),
        gamePass: db.prepare(`
          SELECT * FROM games
          WHERE user_id = ? AND game_pass_new = 1
          ORDER BY created_at DESC LIMIT 5
        `).all(userId),
      };

      res.json({
        recentlyPlayed,
        friendsOnline: friendsOnlineSplit,
        friendsActivity: (req as any)._friendsActivity || [],
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
          genreStats: stats.genreStats,
          tagStats
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch home data" });
    }
  });

    // Clear discover cache — forces next request to rebuild (useful after code changes)
    app.post("/api/home/discover/clear-cache", authenticateToken, (_req, res) => {
      discoverCache = null;
      res.json({ ok: true, message: 'Discover cache cleared. Next /api/home/discover request will rebuild.' });
    });

    // Debug: show raw Epic free games API responses
    app.get("/api/home/discover/debug-epic", authenticateToken, async (_req, res) => {
      const out: any = {};
      try {
        const r1 = await fetch('https://efg.cipta.dev', { headers: { Accept: 'application/json' } });
        if (r1.ok) {
          const d1 = await r1.json();
          out.efg_raw = (d1.data || []).map((g: any) => ({
            name: g.name, status: g.status, game_url: g.game_url,
          }));
          out.efg_free_now = (d1.data || [])
            .filter((g: any) => g.status === 'Free Now')
            .map((g: any) => ({ name: g.name, game_url: g.game_url }));
        } else {
          out.efg_error = `HTTP ${r1.status}`;
        }
      } catch (e: any) {
        out.efg_error = e.message;
      }
      try {
        const r2 = await fetch(
          'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=GB&allowCountries=GB',
          { headers: { Accept: 'application/json' } }
        );
        if (r2.ok) {
          const d2 = await r2.json();
          const now = new Date();
          const elements = d2?.data?.Catalog?.searchStore?.elements || [];
          out.epic_official_all = elements.map((g: any) => ({
            title: g.title,
            productSlug: g.productSlug,
            urlSlug: g.urlSlug,
            pageSlug: g.catalogNs?.mappings?.[0]?.pageSlug,
            isFreeNow: g.promotions?.promotionalOffers?.[0]?.promotionalOffers?.some((o: any) => {
              return new Date(o.startDate) <= now && new Date(o.endDate) >= now && o.discountSetting?.discountPercentage === 0;
            }) || false,
            price: g.price?.totalPrice?.fmtPrice?.discountPrice,
            offerType: g.offerType,
          }));
        } else {
          out.epic_official_error = `HTTP ${r2.status}`;
        }
      } catch (e: any) {
        out.epic_official_error = e.message;
      }
      res.json(out);
    });

    // Debug: enrich a specific game with known Steam ID + MS Store art
    app.get("/api/home/discover/debug-game", authenticateToken, async (req: any, res) => {
      const { title, steamAppID, msArt } = req.query as { title?: string; steamAppID?: string; msArt?: string };
      if (!title) return res.status(400).json({ error: 'title required' });
      try {
        const result = await enrichDiscoverGames([{ title, steamAppID: steamAppID || '', artworkFallback: msArt || undefined }], 'dbg');
        res.json(result[0] || { dropped: true, title, steamAppID, msArt });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    app.get("/api/home/discover", authenticateToken, async (req: any, res) => {
      try {
        const userId = req.user.id;
        const data = await fetchDiscoverAll();
        res.json(data);
      } catch (error) {
        console.error('home/discover error:', error);
        res.status(500).json({ error: "Failed to fetch discover data" });
      }
    });

    // Per-tag cache: tag → { data, timestamp }
    const tagGamesCache = new Map<string, { data: any[]; timestamp: number }>();
    const TAG_CACHE_MS = 30 * 60 * 1000; // 30 min

    // Steam tag list cache — maps tag name → Steam tagid (refreshed daily)
    let steamTagListCache: { tags: { tagid: number; name: string }[]; timestamp: number } | null = null;

    async function getSteamTagId(tagName: string): Promise<number | null> {
      try {
        if (!steamTagListCache || Date.now() - steamTagListCache.timestamp > 24 * 60 * 60 * 1000) {
          const res = await fetch('https://store.steampowered.com/tagdata/populartags/english', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            signal: AbortSignal.timeout(8000),
          } as any);
          if (!res.ok) return null;
          steamTagListCache = { tags: await res.json(), timestamp: Date.now() };
        }
        const lower = tagName.toLowerCase();
        const match = steamTagListCache.tags.find((t: any) => t.name.toLowerCase() === lower);
        return match?.tagid ?? null;
      } catch { return null; }
    }

    // Fetch games from Steam's own tag search — authoritative and sorted by review count
    async function fetchSteamTagSearch(tagName: string): Promise<{ title: string; steamAppID: string }[]> {
      const tagId = await getSteamTagId(tagName);
      if (!tagId) { console.log(`[SteamTagSearch] no tag ID found for "${tagName}"`); return []; }
      try {
        const res = await fetch(
          `https://store.steampowered.com/search/results/?tags=${tagId}&json=1&count=50&filter=topsellers&infinite=1`,
          { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, signal: AbortSignal.timeout(10000) } as any
        );
        if (!res.ok) return [];
        const data = await res.json();
        const html: string = data.results_html || '';
        // Parse appid + title pairs from search result rows
        const appids: string[] = [];
        const titles: string[] = [];
        let m: RegExpExecArray | null;
        const appidRx = /data-ds-appid="(\d+)"/g;
        const titleRx = /<span class="title">([^<]+)<\/span>/g;
        while ((m = appidRx.exec(html)) !== null) appids.push(m[1]);
        while ((m = titleRx.exec(html)) !== null) titles.push(m[1].trim());
        const count = Math.min(appids.length, titles.length);
        const results: { title: string; steamAppID: string }[] = [];
        for (let i = 0; i < count; i++) {
          if (appids[i] && titles[i] && isLikelySteamGame(titles[i])) results.push({ steamAppID: appids[i], title: titles[i] });
        }
        console.log(`[SteamTagSearch] "${tagName}" (tagId ${tagId}): ${results.length} games`);
        return results;
      } catch (e) {
        console.warn(`[SteamTagSearch] error for "${tagName}":`, (e as any).message);
        return [];
      }
    }


    // top100in2weeks cache — refreshed hourly, shared across tag requests
    let top100Cache: { players: Map<string, number>; timestamp: number } | null = null;
    async function getTop100Players(): Promise<Map<string, number>> {
      if (top100Cache && Date.now() - top100Cache.timestamp < 60 * 60 * 1000) return top100Cache.players;
      try {
        const r = await fetch('https://steamspy.com/api.php?request=top100in2weeks', {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(10000),
        } as any);
        if (!r.ok) return top100Cache?.players ?? new Map();
        const data = await r.json() as Record<string, any>;
        const players = new Map<string, number>();
        for (const [appid, g] of Object.entries(data)) {
          players.set(String(appid), (g as any).players_2weeks || 0);
        }
        top100Cache = { players, timestamp: Date.now() };
        return players;
      } catch {
        return top100Cache?.players ?? new Map();
      }
    }

    app.get("/api/home/discover/tag-games", authenticateToken, async (req: any, res) => {
      const tag = String(req.query.tag || '').trim();
      if (!tag) return res.status(400).json({ error: 'tag required' });
      try {
        const cached = tagGamesCache.get(tag);
        if (cached && Date.now() - cached.timestamp < TAG_CACHE_MS) return res.json(cached.data);

        // Fetch games from Steam's store tag search (tag-filtered, sorted by reviews)
        let games: { title: string; steamAppID?: string }[] = await fetchSteamTagSearch(tag);

        // Deduplicate by steamAppID — Steam SearchApps can resolve two different Gemini
        // titles to the same game (e.g. "Battlefield 1" and "Battlefield™ 1")
        const seenAppIds = new Set<string>();
        games = games.filter(g => {
          if (!g.steamAppID) return true;
          if (seenAppIds.has(g.steamAppID)) return false;
          seenAppIds.add(g.steamAppID);
          return true;
        });

        console.log(`[tag-games] "${tag}": enriching ${games.length} games (after dedup)`)
        const enriched = await enrichDiscoverGames(games.slice(0, 30), `tag-${tag}`);

        tagGamesCache.set(tag, { data: enriched, timestamp: Date.now() });
        res.json(enriched);
      } catch (e) {
        console.error(`[tag-games] tag "${tag}" error:`, (e as any).message);
        res.json([]);
      }
    });

  // Group Routes
  app.post("/api/groups", authenticateToken, (req, res) => {
    const { name } = req.body;
    const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const info = db.prepare("INSERT INTO groups (name, invite_code, created_by) VALUES (?, ?, ?)").run(name, invite_code, req.user.id);
    db.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)").run(info.lastInsertRowid, req.user.id);

    res.json({ id: info.lastInsertRowid, name, invite_code, created_by: req.user.id });
  });

  app.delete("/api/groups/:id", authenticateToken, (req, res) => {
    const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.created_by !== req.user.id) return res.status(403).json({ error: "Only the group creator can delete it" });
    db.prepare("DELETE FROM groups WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
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
    res.json(groups); // created_by is now included via g.*
  });

  // ── Friends Routes ──
  // Search users by username (for adding friends)
  app.get("/api/users/search", authenticateToken, (req, res) => {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    const results = db.prepare(
      "SELECT id, username, avatar FROM users WHERE username LIKE ? AND id != ? LIMIT 10"
    ).all(`%${q}%`, req.user.id);
    res.json(results);
  });

  // Get all friends
  app.get("/api/friends", authenticateToken, (req, res) => {
    const friends = db.prepare(`
      SELECT u.id, u.username, u.avatar, u.online_status, u.current_game
      FROM friendships f
      JOIN users u ON u.id = f.addressee_id
      WHERE f.requester_id = ?
      AND EXISTS (SELECT 1 FROM friendships WHERE requester_id = f.addressee_id AND addressee_id = f.requester_id)
      ORDER BY u.username
    `).all(req.user.id);
    res.json(friends);
  });

  // Add friend (mutual — insert both directions if both add each other, or just one direction as "request")
  app.post("/api/friends/add", authenticateToken, (req, res) => {
    const { username } = req.body;
    const target = db.prepare("SELECT id, username, avatar FROM users WHERE username = ?").get(username);
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.id === req.user.id) return res.status(400).json({ error: "Cannot add yourself" });
    try {
      db.prepare("INSERT OR IGNORE INTO friendships (requester_id, addressee_id) VALUES (?, ?)").run(req.user.id, target.id);
      // Check if mutual
      const mutual = db.prepare("SELECT 1 FROM friendships WHERE requester_id = ? AND addressee_id = ?").get(target.id, req.user.id);
      res.json({ user: target, mutual: !!mutual });
    } catch (e) {
      res.status(500).json({ error: "Failed to add friend" });
    }
  });

  // Remove friend
  app.delete("/api/friends/:userId", authenticateToken, (req, res) => {
    db.prepare("DELETE FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)").run(req.user.id, req.params.userId, req.params.userId, req.user.id);
    res.json({ ok: true });
  });

  // Get a friend's recent game additions (backlog)
  app.get("/api/friends/:userId/recent-games", authenticateToken, (req, res) => {
    // Only allow fetching friends' data
    const isFriend = db.prepare("SELECT 1 FROM friendships WHERE requester_id = ? AND addressee_id = ?").get(req.user.id, req.params.userId);
    if (!isFriend) return res.status(403).json({ error: "Not friends" });
    const games = db.prepare(`
      SELECT title, artwork, banner, steam_url, genre, tags, status, created_at, list_type
      FROM games
      WHERE user_id = ? AND list_type = 'private'
      ORDER BY created_at DESC LIMIT 20
    `).all(req.params.userId);
    res.json(games);
  });

  // Get a friend's library stats for comparison
  app.get("/api/friends/:userId/stats", authenticateToken, (req: any, res: any) => {
    const isFriend = db.prepare("SELECT 1 FROM friendships WHERE requester_id = ? AND addressee_id = ?").get(req.user.id, req.params.userId);
    if (!isFriend) return res.status(403).json({ error: "Not friends" });
    const userId = parseInt(req.params.userId);
    const libraryCount = (db.prepare("SELECT COUNT(*) as count FROM launcher_games WHERE user_id = ?").get(userId) as any).count || 0;
    const genreStats = db.prepare(`
      SELECT genre, COUNT(*) as count FROM launcher_games
      WHERE user_id = ? AND genre IS NOT NULL
      GROUP BY genre ORDER BY count DESC LIMIT 3
    `).all(userId);
    const platformStats = db.prepare(`
      SELECT platform, COUNT(*) as count FROM launcher_games
      WHERE user_id = ? AND platform IS NOT NULL
      GROUP BY platform ORDER BY count DESC
    `).all(userId);
    // Aggregate tags
    const tagRows = db.prepare("SELECT tags FROM launcher_games WHERE user_id = ? AND tags IS NOT NULL AND tags != ''").all(userId) as { tags: string }[];
    const tagCount = new Map<string, number>();
    for (const row of tagRows) {
      for (const tag of row.tags.split(',').map((t: string) => t.trim()).filter(Boolean)) {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      }
    }
    const tagStats = Array.from(tagCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));
    // Most played game
    const topGame = db.prepare("SELECT title, playtime FROM launcher_games WHERE user_id = ? ORDER BY playtime DESC LIMIT 1").get(userId) as { title: string; playtime: number } | undefined;
    // Most recently played game
    const recentGame = db.prepare("SELECT title FROM launcher_games WHERE user_id = ? AND last_played IS NOT NULL ORDER BY last_played DESC LIMIT 1").get(userId) as { title: string } | undefined;
    res.json({ libraryCount, genreStats, platformStats, tagStats, topGame, recentGame });
  });

  // Get pending incoming friend requests (one-directional only)
  app.get("/api/friends/pending", authenticateToken, (req, res) => {
    const pending = db.prepare(`
      SELECT u.id, u.username, u.avatar FROM friendships f1
      JOIN users u ON u.id = f1.requester_id
      WHERE f1.addressee_id = ?
      AND NOT EXISTS (SELECT 1 FROM friendships f2 WHERE f2.requester_id = ? AND f2.addressee_id = f1.requester_id)
    `).all(req.user.id, req.user.id);
    res.json(pending);
  });

  // Notification count: unread messages + pending friend requests
  app.get("/api/notifications/count", authenticateToken, (req, res) => {
    const unread = (db.prepare("SELECT COUNT(*) as c FROM messages WHERE receiver_id = ? AND is_read = 0").get(req.user.id) as any).c || 0;
    const pending = (db.prepare(`
      SELECT COUNT(*) as c FROM friendships f1 WHERE f1.addressee_id = ?
      AND NOT EXISTS (SELECT 1 FROM friendships f2 WHERE f2.requester_id = ? AND f2.addressee_id = f1.requester_id)
    `).get(req.user.id, req.user.id) as any).c || 0;
    res.json({ count: unread + pending, unread, pending });
  });

  // Get conversation with a specific friend
  app.get("/api/messages/:friendId", authenticateToken, (req, res) => {
    const fid = parseInt(req.params.friendId);
    const msgs = db.prepare(`
      SELECT m.*, u.username as sender_username, u.avatar as sender_avatar
      FROM messages m JOIN users u ON u.id = m.sender_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `).all(req.user.id, fid, fid, req.user.id);
    res.json(msgs);
  });

  // Send a message (optionally with game attachment)
  app.post("/api/messages", authenticateToken, (req, res) => {
    const { receiver_id, content, game_title, game_artwork, steam_app_id } = req.body;
    if (!receiver_id || (!content && !game_title)) return res.status(400).json({ error: 'receiver_id and content or game required' });
    const result = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content, game_title, game_artwork, steam_app_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, receiver_id, content || null, game_title || null, game_artwork || null, steam_app_id || null);
    const inserted = db.prepare(`
      SELECT m.*, u.username as sender_username, u.avatar as sender_avatar
      FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?
    `).get(result.lastInsertRowid);
    res.json(inserted);
  });

  // Mark all messages from a friend as read
  app.patch("/api/messages/:friendId/read", authenticateToken, (req, res) => {
    db.prepare("UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?").run(req.params.friendId, req.user.id);
    res.json({ ok: true });
  });

  // Update avatar (URL or data URL)
  app.patch("/api/user/avatar", authenticateToken, (req, res) => {
    const { avatar } = req.body;
    db.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(avatar || null, req.user.id);
    const updated = db.prepare("SELECT id, username, avatar, steam_id, xbox_id, discord_id FROM users WHERE id = ?").get(req.user.id);
    res.json(updated);
  });

  // ── Game Comments ──
  app.get("/api/games/:id/comments", authenticateToken, (req, res) => {
    const comments = db.prepare(`
      SELECT c.id, c.content, c.created_at, u.username, u.avatar, c.user_id
      FROM game_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.game_id = ?
      ORDER BY c.created_at ASC
    `).all(req.params.id);
    res.json(comments);
  });

  app.post("/api/games/:id/comments", authenticateToken, (req, res) => {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Comment cannot be empty" });
    const game = db.prepare("SELECT group_id, list_type FROM games WHERE id = ?").get(req.params.id) as any;
    if (!game || game.list_type !== 'shared') return res.status(403).json({ error: "Not a shared game" });
    const isMember = db.prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(game.group_id, req.user.id);
    if (!isMember) return res.status(403).json({ error: "Not a group member" });
    const info = db.prepare("INSERT INTO game_comments (game_id, user_id, content) VALUES (?, ?, ?)").run(req.params.id, req.user.id, content.trim());
    const comment = db.prepare(`
      SELECT c.id, c.content, c.created_at, u.username, u.avatar, c.user_id
      FROM game_comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?
    `).get(info.lastInsertRowid);
    res.json(comment);
  });

  app.delete("/api/games/comments/:commentId", authenticateToken, (req, res) => {
    const comment = db.prepare("SELECT user_id FROM game_comments WHERE id = ?").get(req.params.commentId) as any;
    if (!comment) return res.status(404).json({ error: "Not found" });
    if (comment.user_id !== req.user.id) return res.status(403).json({ error: "Not your comment" });
    db.prepare("DELETE FROM game_comments WHERE id = ?").run(req.params.commentId);
    res.json({ ok: true });
  });

  // ── Group Ownership ── which members have each shared game in their private library
  app.get("/api/groups/:groupId/ownership", authenticateToken, (req, res) => {
    const { groupId } = req.params;
    const isMember = db.prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(groupId, req.user.id);
    if (!isMember) return res.status(403).json({ error: "Not a group member" });
    const members = db.prepare(`
      SELECT u.id, u.username, u.avatar
      FROM group_members gm JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ?
    `).all(groupId) as any[];
    const sharedGames = db.prepare("SELECT id, title FROM games WHERE group_id = ? AND list_type = 'shared'").all(groupId) as any[];
    const ownership: Record<number, number[]> = {};
    for (const game of sharedGames) {
      ownership[game.id] = [];
      for (const member of members) {
        const has = db.prepare(`
          SELECT 1 FROM games
          WHERE user_id = ? AND list_type = 'private' AND LOWER(title) = LOWER(?)
          UNION
          SELECT 1 FROM launcher_games
          WHERE user_id = ? AND LOWER(title) = LOWER(?)
          LIMIT 1
        `).get(member.id, game.title, member.id, game.title);
        if (has) ownership[game.id].push(member.id);
      }
    }
    res.json({ members, ownership });
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

  // Bulk restore from remote backup — only inserts, never overwrites existing data
  app.post("/api/games/restore", authenticateToken, (req, res) => {
    const { games } = req.body;
    if (!Array.isArray(games) || games.length === 0) return res.json({ restored: 0 });
    const existing = db.prepare("SELECT COUNT(*) as count FROM games WHERE user_id = ?").get(req.user.id) as { count: number };
    if (existing.count > 0) return res.json({ restored: 0, skipped: true });
    let restored = 0;
    const insert = db.prepare(`
      INSERT OR IGNORE INTO games
        (title, artwork, banner, horizontal_grid, genre, tags, description, steam_url,
         game_pass, status, list_type, release_date, metacritic, steam_rating, user_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    const insertMany = db.transaction((rows: any[]) => {
      for (const g of rows) {
        insert.run(
          g.title, g.artwork || null, g.banner || null, g.horizontal_grid || null,
          g.genre || null, g.tags || null, g.description || null, g.steam_url || null,
          g.game_pass ? 1 : 0, g.status || 'to-play', g.list_type || 'private',
          g.release_date || null, g.metacritic || null, g.steam_rating || null,
          req.user.id
        );
        restored++;
      }
    });
    insertMany(games);
    res.json({ restored });
  });

  app.get("/api/games/:id", authenticateToken, (req, res) => {
    try {
      const game = db.prepare("SELECT * FROM games WHERE id = ? AND (user_id = ? OR group_id IN (SELECT group_id FROM group_members WHERE user_id = ?))").get(Number(req.params.id), req.user.id, req.user.id);
      if (!game) return res.status(404).json({ error: 'Not found' });
      res.json(game);
    } catch { res.status(500).json({ error: 'Failed' }); }
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

  // Resolve Steam App ID for a game title — checks known map, then Steam storesearch, then IGDB
  app.get("/api/resolve-steam", async (req, res) => {
    const title = String(req.query.title || '').trim();
    if (!title) return res.json({ steamAppId: null });
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const key = norm(title);

    // 1. Known map (instant, no API call needed)
    if (key in KNOWN_STEAM_IDS) {
      return res.json({ steamAppId: KNOWN_STEAM_IDS[key] || null });
    }

    // 2. SearchApps (same endpoint as game suggestions — not blocked server-side)
    try {
      const saRes = await fetch(`https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(title)}`);
      const saItems: any[] = await saRes.json().catch(() => []);
      const saExact = saItems.find((i: any) => norm(i.name) === key);
      if (saExact) return res.json({ steamAppId: String(saExact.appid) });
    } catch { /* fall through */ }

    // 2b. Steam storesearch — fallback if SearchApps misses it
    try {
      const steamRes = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=US`);
      const steamData = await steamRes.json().catch(() => ({}));
      const items: any[] = (steamData?.items || []).filter((i: any) => i.name && (!i.type || i.type === 'game'));
      const exact = items.find((i: any) => norm(i.name) === key);
      if (exact) return res.json({ steamAppId: String(exact.id) });
    } catch { /* fall through */ }

    // 3. IGDB — has explicit Steam website links
    try {
      const igdbToken = await getIgdbToken();
      const clientId = process.env.IGDB_CLIENT_ID;
      if (igdbToken && clientId) {
        const igdbRes = await fetch('https://api.igdb.com/v4/games', {
          method: 'POST',
          headers: { 'Client-ID': clientId, 'Authorization': `Bearer ${igdbToken}`, 'Accept': 'application/json' },
          body: `search "${title.replace(/"/g, '\\"')}"; fields name,websites.url,websites.category; limit 5;`,
        });
        const igdbData = await igdbRes.json().catch(() => []);
        const game = (igdbData as any[]).find((g: any) => norm(g.name) === key) || (igdbData as any[])[0];
        if (game?.websites?.length) {
          const steamSite = game.websites.find((w: any) => w.category === 13 && w.url?.includes('store.steampowered.com'));
          if (steamSite) {
            const m = steamSite.url.match(/\/app\/(\d+)/);
            if (m) return res.json({ steamAppId: m[1] });
          }
        }
      }
    } catch { /* fall through */ }

    res.json({ steamAppId: null });
  });

  app.patch("/api/games/:id/steam-url", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { steam_url } = req.body;
    try {
      db.prepare("UPDATE games SET steam_url = ? WHERE id = ? AND user_id = ?").run(steam_url, Number(id), req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update steam_url" });
    }
  });

  app.patch("/api/games/:id/dismiss-price-alert", authenticateToken, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("UPDATE games SET price_dropped = 0 WHERE id = ? AND user_id = ?").run(Number(id), req.user.id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to dismiss price alert" });
    }
  });

  app.patch("/api/games/:id/price", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { lowest_price, allkeyshop_url } = req.body;
    try {
      if (lowest_price !== null && lowest_price !== undefined) {
        db.prepare("UPDATE games SET lowest_price = ?, allkeyshop_url = COALESCE(?, allkeyshop_url) WHERE id = ? AND user_id = ?")
          .run(lowest_price, allkeyshop_url || null, Number(id), req.user.id);
      } else if (allkeyshop_url) {
        db.prepare("UPDATE games SET allkeyshop_url = ? WHERE id = ? AND user_id = ?")
          .run(allkeyshop_url, Number(id), req.user.id);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update price" });
    }
  });

  app.post("/api/games/:id/refresh-tags", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { table } = req.query; // 'launcher' to target launcher_games
    try {
      let game: any = null;
      let isLauncher = false;
      if (table === 'launcher') {
        game = db.prepare("SELECT id, title, steam_url FROM launcher_games WHERE id = ? AND user_id = ?").get(Number(id), req.user.id);
        isLauncher = true;
      } else {
        game = db.prepare("SELECT id, title, steam_url FROM games WHERE id = ? AND user_id = ?").get(Number(id), req.user.id);
        if (!game) {
          game = db.prepare("SELECT id, title, steam_url FROM launcher_games WHERE id = ? AND user_id = ?").get(Number(id), req.user.id);
          isLauncher = !!game;
        }
      }
      if (!game) return res.status(404).json({ error: "Game not found" });
      const appidMatch = (game.steam_url || '').match(/\/app\/(\d+)/);
      const appid = appidMatch?.[1] || null;

      // For non-Steam games fetch IGDB context to ground Gemini tag generation
      let igdbContext: string | undefined;
      if (!appid) {
        try {
          const igdbClientId = process.env.IGDB_CLIENT_ID;
          const igdbTok = await getIgdbToken();
          if (igdbClientId && igdbTok) {
            const igdbRes = await fetch('https://api.igdb.com/v4/games', {
              method: 'POST',
              headers: { 'Client-ID': igdbClientId, 'Authorization': `Bearer ${igdbTok}`, 'Accept': 'application/json' },
              body: `search "${game.title.replace(/"/g, '\\"')}"; fields name,genres.name,themes.name,summary; limit 5;`
            });
            const igdbData = await igdbRes.json().catch(() => []);
            if (Array.isArray(igdbData) && igdbData.length > 0) {
              const nc = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
              const qc = nc(game.title);
              const qw = qc.split(/\s+/).filter((w: string) => w.length > 0);
              const igdbGame = igdbData.find((g: any) => nc(g.name) === qc)
                || igdbData.find((g: any) => { const n = nc(g.name); return qw.every((w: string) => new RegExp(`\\b${w}\\b`).test(n)); });
              if (igdbGame) {
                const genres = igdbGame.genres?.map((g: any) => g.name).join(', ') || '';
                const themes = igdbGame.themes?.map((t: any) => t.name).join(', ') || '';
                const summary = igdbGame.summary ? igdbGame.summary.slice(0, 300) : '';
                igdbContext = `Game data from IGDB — Genres: ${genres}. Themes: ${themes}. Description: ${summary}`;
              }
            }
          }
        } catch { /* ignore */ }
      }

      const tags = await fetchTagsForGame(game.title, appid ? 'steam' : 'other', appid || undefined, igdbContext);
      if (!tags) return res.json({ success: false, error: "Could not generate tags" });
      if (isLauncher) {
        db.prepare("UPDATE launcher_games SET tags = ? WHERE id = ? AND user_id = ?").run(tags, Number(id), req.user.id);
      } else {
        db.prepare("UPDATE games SET tags = ? WHERE id = ? AND user_id = ?").run(tags, Number(id), req.user.id);
      }
      res.json({ success: true, tags });
    } catch (e) {
      res.status(500).json({ error: "Failed to refresh tags" });
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
      const cacheKey = `ql:${userId}:${appId}`;
      const cached = friendsCache.get(cacheKey);
      if (cached && Date.now() - cached.fetchedAt < FRIENDS_CACHE_TTL) {
        return res.json(cached.data);
      }
      const user = db.prepare("SELECT steam_id, xbox_refresh_token FROM users WHERE id = ?").get(userId) as any;
      const results: any[] = [];

      // Steam friends
      if (user?.steam_id && process.env.STEAM_API_KEY) {
        results.push(...await getSteamFriendsForGame(String(appId), user.steam_id, process.env.STEAM_API_KEY));
      }

      // Xbox friends — try to find Xbox titleId, fall back to name-based search
      if (user?.xbox_refresh_token && process.env.XBOX_CLIENT_ID && process.env.XBOX_CLIENT_SECRET) {
        let xboxTitleId: string | null = null;
        let xboxFallbackTitle: string | null = null;

        // 1. Try exact Xbox titleId via user's launcher_games (Steam → Xbox title match)
        const steamGame = db.prepare("SELECT title FROM launcher_games WHERE user_id = ? AND platform = 'steam' AND external_id = ?").get(userId, String(appId)) as any;
        if (steamGame) {
          const xboxMatch = db.prepare("SELECT external_id FROM launcher_games WHERE user_id = ? AND platform = 'xbox' AND LOWER(title) = LOWER(?)").get(userId, steamGame.title) as any;
          if (xboxMatch && !isNaN(Number(xboxMatch.external_id))) {
            xboxTitleId = xboxMatch.external_id;
          } else {
            xboxFallbackTitle = steamGame.title;
          }
        }

        // 2. If no match in launcher_games, try the questlog games table for the title
        if (!xboxTitleId && !xboxFallbackTitle) {
          const questlogGame = db.prepare("SELECT title FROM games WHERE user_id = ? AND steam_url LIKE ?").get(userId, `%/app/${String(appId)}%`) as any;
          if (questlogGame) xboxFallbackTitle = questlogGame.title;
        }

        results.push(...await getXboxFriendsForTitle(xboxTitleId, userId, xboxFallbackTitle || undefined));
      }

      // Deduplicate: if a friend appears on both platforms, keep the one with more info
      const seen = new Map<string, any>();
      for (const f of results) {
        const key = f.username.toLowerCase();
        const existing = seen.get(key);
        if (!existing || (!existing.last_played && f.last_played)) seen.set(key, f);
      }

      const deduped = [...seen.values()].sort((a, b) => {
        const rank = (s) => s === 'in_game' ? 0 : s === 'online' ? 1 : s === 'away' ? 2 : 3;
        return rank(a.online_status) - rank(b.online_status) || a.username.localeCompare(b.username);
      });
      friendsCache.set(cacheKey, { data: deduped, fetchedAt: Date.now() });
      res.json(deduped);
    } catch (e) {
      console.error('Questlog friends error:', e);
      res.status(500).json({ error: 'Failed to fetch friends' });
    }
  });

  // Refresh tags for all QuestLog games using the SteamSpy → Gemini pipeline
  app.post("/api/games/refresh-tags", authenticateToken, async (req, res) => {
    try {
      const games = db.prepare("SELECT id, title, steam_url FROM games WHERE user_id = ?").all(req.user.id) as any[];
      let updated = 0;
      for (const game of games) {
        // Extract Steam appid from steam_url if present (e.g. .../app/123456/)
        const appidMatch = (game.steam_url || '').match(/\/app\/(\d+)/);
        const appid = appidMatch?.[1] || null;
        const platform = appid ? 'steam' : 'other';
        const tags = await fetchTagsForGame(game.title, platform, appid || undefined);
        if (tags) {
          db.prepare("UPDATE games SET tags = ? WHERE id = ? AND user_id = ?").run(tags, game.id, req.user.id);
          updated++;
        }
      }
      res.json({ success: true, updated });
    } catch (error) {
      console.error("Failed to refresh game tags:", error);
      res.status(500).json({ error: "Failed to refresh tags" });
    }
  });

  // Refresh Game Pass status for all existing QuestLog games
  app.post("/api/games/refresh-gamepass", authenticateToken, async (req, res) => {
    try {
      const catalog = await getGamePassTitles();
      if (!catalog.size) return res.json({ success: true, updated: 0, note: 'catalog unavailable' });

      const games = db.prepare("SELECT id, title FROM games WHERE user_id = ?").all(req.user.id) as any[];
      let updated = 0;
      for (const game of games) {
        const normalized = game.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        let onGamePass = catalog.has(normalized);
        if (!onGamePass) {
          const words = normalized.split(/\s+/).filter((w: string) => w.length > 1);
          if (words.length > 0) {
            for (const [catalogTitle] of catalog) {
              if (words.every((w: string) => catalogTitle.includes(w))) { onGamePass = true; break; }
            }
          }
        }
        db.prepare("UPDATE games SET game_pass = ? WHERE id = ? AND user_id = ?").run(onGamePass ? 1 : 0, game.id, req.user.id);
        if (onGamePass) updated++;
      }
      res.json({ success: true, updated });
    } catch (error) {
      console.error("Failed to refresh game pass status:", error);
      res.status(500).json({ error: "Failed to refresh game pass status" });
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

    // Daily price + Game Pass refresh for all users
    const DAILY_REFRESH_INTERVAL = 24 * 60 * 60 * 1000;
    setInterval(async () => {
      try {
        const users = db.prepare("SELECT DISTINCT user_id FROM games").all() as { user_id: number }[];
        for (const { user_id } of users) {
          await refreshPricesForUser(user_id);
          await checkGamePassForUser(user_id);
          console.log(`[DailyScheduler] Refreshed prices + Game Pass for user ${user_id}`);
        }
      } catch (e) {
        console.error('[DailyScheduler] Error:', e);
      }
    }, DAILY_REFRESH_INTERVAL);
  });
}

startServer();