require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Prevent unhandled async rejections from crashing the process
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

const JWT_SECRET = process.env.JWT_SECRET || "questlog-super-secret-key-123";

// ── Database ──────────────────────────────────────────────────────────────────

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  family: 4, // Force IPv4 — Railway can't route to Supabase over IPv6
});

// Shorthand query helpers
const query = (sql, args) => pool.query(sql, args);
const row = async (sql, args) => { const r = await pool.query(sql, args); return r.rows[0] || null; };
const rows = async (sql, args) => { const r = await pool.query(sql, args); return r.rows; };

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      online_status TEXT DEFAULT 'offline',
      current_game TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS user_stats (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      library_count INTEGER DEFAULT 0,
      backlog_count INTEGER DEFAULT 0,
      total_playtime_hours INTEGER DEFAULT 0,
      top_genre TEXT,
      top_game TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS friendships (
      requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (requester_id, addressee_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS group_members (
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (group_id, user_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS shared_games (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      artwork TEXT,
      banner TEXT,
      horizontal_grid TEXT,
      logo TEXT,
      genre TEXT,
      tags TEXT,
      description TEXT,
      steam_url TEXT,
      game_pass BOOLEAN DEFAULT FALSE,
      allkeyshop_url TEXT,
      lowest_price TEXT,
      previous_price TEXT,
      price_dropped BOOLEAN DEFAULT FALSE,
      game_pass_new BOOLEAN DEFAULT FALSE,
      status TEXT DEFAULT 'to-play',
      release_date TEXT,
      metacritic INTEGER,
      steam_rating TEXT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS game_comments (
      id SERIAL PRIMARY KEY,
      game_id INTEGER NOT NULL REFERENCES shared_games(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      game_title TEXT,
      game_artwork TEXT,
      steam_app_id TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS library_cache (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      PRIMARY KEY (user_id, title)
    )
  `);

  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_private BOOLEAN DEFAULT false`);

  console.log("Database ready.");
}

// ── Auth middleware ───────────────────────────────────────────────────────────

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(header.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ── Auth routes ───────────────────────────────────────────────────────────────

app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password) return res.status(400).json({ error: "Username and password required" });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await row("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username", [username.trim(), hashed]);
    const token = jwt.sign({ id: result.id, username: result.username }, JWT_SECRET);
    res.json({ token, user: { id: result.id, username: result.username } });
  } catch (e) {
    if (e.code === "23505") {
      res.status(400).json({ error: "Username already taken" });
    } else {
      console.error(e);
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await row("SELECT * FROM users WHERE username = $1", [username]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar } });
  } catch (e) {
    console.error("Login error:", e.message);
    res.status(503).json({ error: "Service temporarily unavailable, please try again" });
  }
});

app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    const user = await row("SELECT id, username, avatar, online_status, current_game, activity_private FROM users WHERE id = $1", [req.user.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(503).json({ error: "Service temporarily unavailable, please try again" });
  }
});

// ── User routes ───────────────────────────────────────────────────────────────

app.patch("/api/user/avatar", authenticate, async (req, res) => {
  const { avatar } = req.body;
  const user = await row("UPDATE users SET avatar = $1 WHERE id = $2 RETURNING id, username, avatar", [avatar || null, req.user.id]);
  res.json(user);
});

app.patch("/api/user/settings", authenticate, async (req, res) => {
  const { username, current_password, new_password, activity_private } = req.body;
  try {
    const user = await row("SELECT * FROM users WHERE id = $1", [req.user.id]);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (new_password) {
      if (!current_password) return res.status(400).json({ error: "Current password required" });
      const valid = await bcrypt.compare(current_password, user.password);
      if (!valid) return res.status(400).json({ error: "Current password is incorrect" });
      const hashed = await bcrypt.hash(new_password, 10);
      await query("UPDATE users SET password = $1 WHERE id = $2", [hashed, req.user.id]);
    }

    if (username && username.trim() !== user.username) {
      await query("UPDATE users SET username = $1 WHERE id = $2", [username.trim(), req.user.id]);
    }

    if (typeof activity_private === 'boolean') {
      await query("UPDATE users SET activity_private = $1 WHERE id = $2", [activity_private, req.user.id]);
    }

    const updated = await row("SELECT id, username, avatar, activity_private FROM users WHERE id = $1", [req.user.id]);
    res.json(updated);
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: "Username already taken" });
    console.error(e);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

app.patch("/api/user/status", authenticate, async (req, res) => {
  const { online_status, current_game } = req.body;
  await query("UPDATE users SET online_status = $1, current_game = $2 WHERE id = $3", [online_status || "offline", current_game || null, req.user.id]);
  res.json({ ok: true });
});

app.put("/api/user/sync-stats", authenticate, async (req, res) => {
  const { library_count, backlog_count, total_playtime_hours, top_genre, top_game } = req.body;
  await query(
    `INSERT INTO user_stats (user_id, library_count, backlog_count, total_playtime_hours, top_genre, top_game, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       library_count = EXCLUDED.library_count,
       backlog_count = EXCLUDED.backlog_count,
       total_playtime_hours = EXCLUDED.total_playtime_hours,
       top_genre = EXCLUDED.top_genre,
       top_game = EXCLUDED.top_game,
       updated_at = NOW()`,
    [req.user.id, library_count || 0, backlog_count || 0, total_playtime_hours || 0, top_genre || null, top_game || null]
  );
  res.json({ ok: true });
});

app.put("/api/user/sync-library", authenticate, async (req, res) => {
  const { titles } = req.body;
  if (!Array.isArray(titles)) return res.status(400).json({ error: "titles must be an array" });
  await query("DELETE FROM library_cache WHERE user_id = $1", [req.user.id]);
  for (const title of titles) {
    await query("INSERT INTO library_cache (user_id, title) VALUES ($1, $2) ON CONFLICT DO NOTHING", [req.user.id, title.toLowerCase().trim()]);
  }
  res.json({ ok: true });
});

app.get("/api/users/search", authenticate, async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (q.length < 2) return res.json([]);
  const result = await rows("SELECT id, username, avatar FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 10", [`%${q}%`, req.user.id]);
  res.json(result);
});

// ── Friend routes ─────────────────────────────────────────────────────────────

app.get("/api/friends", authenticate, async (req, res) => {
  const result = await rows(
    `SELECT u.id, u.username, u.avatar, u.online_status, u.current_game
     FROM friendships f JOIN users u ON u.id = f.addressee_id
     WHERE f.requester_id = $1
     AND EXISTS (SELECT 1 FROM friendships WHERE requester_id = f.addressee_id AND addressee_id = f.requester_id)
     ORDER BY u.username`,
    [req.user.id]
  );
  res.json(result);
});

app.get("/api/friends/pending", authenticate, async (req, res) => {
  const result = await rows(
    `SELECT u.id, u.username, u.avatar FROM friendships f1
     JOIN users u ON u.id = f1.requester_id
     WHERE f1.addressee_id = $1
     AND NOT EXISTS (SELECT 1 FROM friendships f2 WHERE f2.requester_id = $1 AND f2.addressee_id = f1.requester_id)`,
    [req.user.id]
  );
  res.json(result);
});

app.post("/api/friends/add", authenticate, async (req, res) => {
  const { username } = req.body;
  const target = await row("SELECT id, username, avatar FROM users WHERE username = $1", [username]);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.id === req.user.id) return res.status(400).json({ error: "Cannot add yourself" });
  await query("INSERT INTO friendships (requester_id, addressee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [req.user.id, target.id]);
  const mutual = await row("SELECT 1 FROM friendships WHERE requester_id = $1 AND addressee_id = $2", [target.id, req.user.id]);
  res.json({ user: target, mutual: !!mutual });
});

app.delete("/api/friends/:userId", authenticate, async (req, res) => {
  const uid = parseInt(req.params.userId);
  await query("DELETE FROM friendships WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)", [req.user.id, uid]);
  res.json({ ok: true });
});

app.get("/api/friends/:userId/recent-games", authenticate, async (req, res) => {
  const uid = parseInt(req.params.userId);
  const isFriend = await row("SELECT 1 FROM friendships WHERE requester_id=$1 AND addressee_id=$2", [req.user.id, uid]);
  if (!isFriend) return res.status(403).json({ error: "Not friends" });
  const result = await rows("SELECT title, artwork, banner, steam_url, genre, tags, status, created_at FROM shared_games WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20", [uid]);
  res.json(result);
});

app.get("/api/friends/:userId/stats", authenticate, async (req, res) => {
  const uid = parseInt(req.params.userId);
  const isFriend = await row("SELECT 1 FROM friendships WHERE requester_id=$1 AND addressee_id=$2", [req.user.id, uid]);
  if (!isFriend) return res.status(403).json({ error: "Not friends" });
  const stats = await row("SELECT * FROM user_stats WHERE user_id=$1", [uid]);
  res.json(stats || {});
});

// ── Notification count ────────────────────────────────────────────────────────

app.get("/api/notifications/count", authenticate, async (req, res) => {
  const unread = await row("SELECT COUNT(*) as c FROM messages WHERE receiver_id=$1 AND is_read=false", [req.user.id]);
  const pending = await row(
    `SELECT COUNT(*) as c FROM friendships f1 WHERE f1.addressee_id=$1
     AND NOT EXISTS (SELECT 1 FROM friendships f2 WHERE f2.requester_id=$1 AND f2.addressee_id=f1.requester_id)`,
    [req.user.id]
  );
  const u = parseInt(unread?.c || 0);
  const p = parseInt(pending?.c || 0);
  res.json({ count: u + p, unread: u, pending: p });
});

// ── Group routes ──────────────────────────────────────────────────────────────

app.get("/api/groups", authenticate, async (req, res) => {
  const result = await rows(
    `SELECT g.* FROM groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id=$1 ORDER BY g.name`,
    [req.user.id]
  );
  res.json(result);
});

app.post("/api/groups", authenticate, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Group name required" });
  const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const group = await row("INSERT INTO groups (name, invite_code, created_by) VALUES ($1,$2,$3) RETURNING *", [name.trim(), invite_code, req.user.id]);
  await query("INSERT INTO group_members (group_id, user_id) VALUES ($1,$2)", [group.id, req.user.id]);
  res.json(group);
});

app.post("/api/groups/join", authenticate, async (req, res) => {
  const { invite_code } = req.body;
  const group = await row("SELECT * FROM groups WHERE invite_code=$1", [invite_code?.toUpperCase()]);
  if (!group) return res.status(404).json({ error: "Group not found" });
  try {
    await query("INSERT INTO group_members (group_id, user_id) VALUES ($1,$2)", [group.id, req.user.id]);
    res.json(group);
  } catch (e) {
    if (e.code === "23505") {
      res.status(400).json({ error: "Already a member" });
    } else {
      res.status(500).json({ error: "Failed to join group" });
    }
  }
});

app.delete("/api/groups/:id", authenticate, async (req, res) => {
  const group = await row("SELECT * FROM groups WHERE id=$1", [req.params.id]);
  if (!group) return res.status(404).json({ error: "Group not found" });
  if (group.created_by !== req.user.id) return res.status(403).json({ error: "Only the creator can delete this group" });
  await query("DELETE FROM groups WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

// ── Shared game routes ────────────────────────────────────────────────────────

app.get("/api/games", authenticate, async (req, res) => {
  const result = await rows(
    `SELECT * FROM shared_games WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id=$1) ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(result.map(g => ({ ...g, list_type: "shared" })));
});

app.post("/api/games", authenticate, async (req, res) => {
  const { title, artwork, banner, horizontal_grid, logo, genre, tags, description, steam_url, game_pass, allkeyshop_url, lowest_price, group_id, release_date, metacritic, steam_rating } = req.body;
  if (!title || !group_id) return res.status(400).json({ error: "title and group_id required" });
  const isMember = await row("SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2", [group_id, req.user.id]);
  if (!isMember) return res.status(403).json({ error: "Not a member of this group" });
  const game = await row(
    `INSERT INTO shared_games (title,artwork,banner,horizontal_grid,logo,genre,tags,description,steam_url,game_pass,allkeyshop_url,lowest_price,group_id,user_id,release_date,metacritic,steam_rating)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
    [title, artwork||null, banner||null, horizontal_grid||null, logo||null, genre||null, tags||null, description||null, steam_url||null, !!game_pass, allkeyshop_url||null, lowest_price||null, group_id, req.user.id, release_date||null, metacritic||null, steam_rating||null]
  );
  res.json({ ...game, list_type: "shared" });
});

app.put("/api/games/:id", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await row("SELECT group_id FROM shared_games WHERE id=$1", [id]);
  if (!existing) return res.status(404).json({ error: "Not found" });
  const isMember = await row("SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2", [existing.group_id, req.user.id]);
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  const { title,artwork,banner,horizontal_grid,logo,genre,tags,description,steam_url,game_pass,allkeyshop_url,lowest_price,release_date,metacritic,steam_rating } = req.body;
  const game = await row(
    `UPDATE shared_games SET title=$1,artwork=$2,banner=$3,horizontal_grid=$4,logo=$5,genre=$6,tags=$7,description=$8,steam_url=$9,game_pass=$10,allkeyshop_url=$11,lowest_price=$12,release_date=$13,metacritic=$14,steam_rating=$15 WHERE id=$16 RETURNING *`,
    [title,artwork||null,banner||null,horizontal_grid||null,logo||null,genre||null,tags||null,description||null,steam_url||null,!!game_pass,allkeyshop_url||null,lowest_price||null,release_date||null,metacritic||null,steam_rating||null,id]
  );
  res.json({ ...game, list_type: "shared" });
});

app.patch("/api/games/:id/status", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await row("SELECT group_id FROM shared_games WHERE id=$1", [id]);
  if (!existing) return res.status(404).json({ error: "Not found" });
  const isMember = await row("SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2", [existing.group_id, req.user.id]);
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  await query("UPDATE shared_games SET status=$1 WHERE id=$2", [req.body.status, id]);
  res.json({ ok: true });
});

app.delete("/api/games/:id", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await row("SELECT group_id FROM shared_games WHERE id=$1", [id]);
  if (!existing) return res.status(404).json({ error: "Not found" });
  const isMember = await row("SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2", [existing.group_id, req.user.id]);
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  await query("DELETE FROM shared_games WHERE id=$1", [id]);
  res.json({ ok: true });
});

app.patch("/api/games/:id/dismiss-price-alert", authenticate, async (req, res) => {
  await query("UPDATE shared_games SET price_dropped=false WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
  res.json({ ok: true });
});

app.patch("/api/games/:id/dismiss-game-pass-alert", authenticate, async (req, res) => {
  await query("UPDATE shared_games SET game_pass_new=false WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
  res.json({ ok: true });
});

// ── Group ownership ───────────────────────────────────────────────────────────

app.get("/api/groups/:groupId/ownership", authenticate, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const isMember = await row("SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2", [groupId, req.user.id]);
  if (!isMember) return res.status(403).json({ error: "Not a group member" });

  const members = await rows(
    `SELECT u.id, u.username, u.avatar FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id=$1`,
    [groupId]
  );
  const sharedGames = await rows("SELECT id, title FROM shared_games WHERE group_id=$1", [groupId]);

  const ownership = {};
  for (const game of sharedGames) {
    const titleLower = game.title.toLowerCase().trim();
    const owners = await rows(
      `SELECT user_id FROM library_cache WHERE title=$1 AND user_id = ANY($2::int[])`,
      [titleLower, members.map(m => m.id)]
    );
    ownership[game.id] = owners.map(o => o.user_id);
  }

  res.json({ members, ownership });
});

// ── Comment routes ────────────────────────────────────────────────────────────

app.get("/api/games/:id/comments", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const game = await row("SELECT group_id FROM shared_games WHERE id=$1", [id]);
  if (!game) return res.status(404).json({ error: "Not found" });
  const isMember = await row("SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2", [game.group_id, req.user.id]);
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  const result = await rows(
    `SELECT c.id,c.content,c.created_at,c.user_id,u.username,u.avatar FROM game_comments c JOIN users u ON u.id=c.user_id WHERE c.game_id=$1 ORDER BY c.created_at ASC`,
    [id]
  );
  res.json(result);
});

app.post("/api/games/:id/comments", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Comment cannot be empty" });
  const game = await row("SELECT group_id FROM shared_games WHERE id=$1", [id]);
  if (!game) return res.status(404).json({ error: "Not found" });
  const isMember = await row("SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2", [game.group_id, req.user.id]);
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  const inserted = await row("INSERT INTO game_comments (game_id,user_id,content) VALUES ($1,$2,$3) RETURNING id", [id, req.user.id, content.trim()]);
  const comment = await row(
    `SELECT c.id,c.content,c.created_at,c.user_id,u.username,u.avatar FROM game_comments c JOIN users u ON u.id=c.user_id WHERE c.id=$1`,
    [inserted.id]
  );
  res.json(comment);
});

app.delete("/api/games/comments/:commentId", authenticate, async (req, res) => {
  const id = parseInt(req.params.commentId);
  const comment = await row("SELECT user_id FROM game_comments WHERE id=$1", [id]);
  if (!comment) return res.status(404).json({ error: "Not found" });
  if (comment.user_id !== req.user.id) return res.status(403).json({ error: "Not your comment" });
  await query("DELETE FROM game_comments WHERE id=$1", [id]);
  res.json({ ok: true });
});

// ── Message routes ────────────────────────────────────────────────────────────

app.get("/api/messages/:friendId", authenticate, async (req, res) => {
  const fid = parseInt(req.params.friendId);
  const result = await rows(
    `SELECT m.*,u.username as sender_username,u.avatar as sender_avatar FROM messages m JOIN users u ON u.id=m.sender_id
     WHERE (m.sender_id=$1 AND m.receiver_id=$2) OR (m.sender_id=$2 AND m.receiver_id=$1) ORDER BY m.created_at ASC`,
    [req.user.id, fid]
  );
  res.json(result);
});

app.post("/api/messages", authenticate, async (req, res) => {
  const { receiver_id, content, game_title, game_artwork, steam_app_id } = req.body;
  if (!receiver_id || (!content && !game_title)) return res.status(400).json({ error: "receiver_id and content or game required" });
  const inserted = await row(
    "INSERT INTO messages (sender_id,receiver_id,content,game_title,game_artwork,steam_app_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
    [req.user.id, receiver_id, content||null, game_title||null, game_artwork||null, steam_app_id||null]
  );
  const msg = await row(
    `SELECT m.*,u.username as sender_username,u.avatar as sender_avatar FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=$1`,
    [inserted.id]
  );
  res.json(msg);
});

app.patch("/api/messages/:friendId/read", authenticate, async (req, res) => {
  await query("UPDATE messages SET is_read=true WHERE sender_id=$1 AND receiver_id=$2", [parseInt(req.params.friendId), req.user.id]);
  res.json({ ok: true });
});

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/health", (_, res) => res.json({ ok: true, version: "1.0.0" }));

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;

async function initDbWithRetry(attempt = 1) {
  try {
    await initDb();
    console.log("DB ready.");
  } catch (e) {
    const delay = Math.min(5000 * attempt, 60000);
    console.error(`DB init failed (attempt ${attempt}), retrying in ${delay / 1000}s:`, e.message);
    setTimeout(() => initDbWithRetry(attempt + 1), delay);
  }
}

// Global error handler — catches errors passed via next(err) and unhandled
// async throws in routes that use express 5 or explicit next(err) calls
app.use((err, req, res, _next) => {
  console.error("Route error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// Start immediately so Railway health checks pass, retry DB in background
app.listen(PORT, () => {
  console.log(`QuestLog remote server listening on port ${PORT}`);
  initDbWithRetry();
});
