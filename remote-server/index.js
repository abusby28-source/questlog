require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createClient } = require("@libsql/client");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" })); // 2mb covers base64 avatars

const JWT_SECRET = process.env.JWT_SECRET || "questlog-super-secret-key-123";

// ── Database ──────────────────────────────────────────────────────────────────

const db = createClient({
  url: process.env.TURSO_URL || "file:questlog-remote.db",
  authToken: process.env.TURSO_TOKEN,
});

async function initDb() {
  await db.execute("PRAGMA foreign_keys = ON");

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      online_status TEXT DEFAULT 'offline',
      current_game TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      user_id INTEGER PRIMARY KEY,
      library_count INTEGER DEFAULT 0,
      backlog_count INTEGER DEFAULT 0,
      total_playtime_hours INTEGER DEFAULT 0,
      top_genre TEXT,
      top_game TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shared_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artwork TEXT,
      banner TEXT,
      horizontal_grid TEXT,
      logo TEXT,
      genre TEXT,
      tags TEXT,
      description TEXT,
      steam_url TEXT,
      game_pass INTEGER DEFAULT 0,
      allkeyshop_url TEXT,
      lowest_price TEXT,
      previous_price TEXT,
      price_dropped INTEGER DEFAULT 0,
      game_pass_new INTEGER DEFAULT 0,
      status TEXT DEFAULT 'to-play',
      release_date TEXT,
      metacritic INTEGER,
      steam_rating TEXT,
      user_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS game_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES shared_games(id) ON DELETE CASCADE,
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

    CREATE TABLE IF NOT EXISTS library_cache (
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      PRIMARY KEY (user_id, title),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  console.log("Database ready.");
}

// ── Auth middleware ───────────────────────────────────────────────────────────

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });
  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function row(result) {
  return result.rows[0] || null;
}

function rows(result) {
  return result.rows;
}

// ── Auth routes ───────────────────────────────────────────────────────────────

app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password) return res.status(400).json({ error: "Username and password required" });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: "INSERT INTO users (username, password) VALUES (?, ?)",
      args: [username.trim(), hashed],
    });
    const id = Number(result.lastInsertRowid);
    const token = jwt.sign({ id, username: username.trim() }, JWT_SECRET);
    res.json({ token, user: { id, username: username.trim() } });
  } catch (e) {
    if (e.message?.includes("UNIQUE")) {
      res.status(400).json({ error: "Username already taken" });
    } else {
      console.error(e);
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const user = row(await db.execute({ sql: "SELECT * FROM users WHERE username = ?", args: [username] }));
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: Number(user.id), username: user.username }, JWT_SECRET);
  res.json({ token, user: { id: Number(user.id), username: user.username, avatar: user.avatar } });
});

app.get("/api/auth/me", authenticate, async (req, res) => {
  const user = row(await db.execute({ sql: "SELECT id, username, avatar, online_status, current_game FROM users WHERE id = ?", args: [req.user.id] }));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ ...user, id: Number(user.id) });
});

// ── User routes ───────────────────────────────────────────────────────────────

app.patch("/api/user/avatar", authenticate, async (req, res) => {
  const { avatar } = req.body;
  await db.execute({ sql: "UPDATE users SET avatar = ? WHERE id = ?", args: [avatar || null, req.user.id] });
  const user = row(await db.execute({ sql: "SELECT id, username, avatar FROM users WHERE id = ?", args: [req.user.id] }));
  res.json({ ...user, id: Number(user.id) });
});

app.patch("/api/user/status", authenticate, async (req, res) => {
  const { online_status, current_game } = req.body;
  await db.execute({ sql: "UPDATE users SET online_status = ?, current_game = ? WHERE id = ?", args: [online_status || "offline", current_game || null, req.user.id] });
  res.json({ ok: true });
});

// Push local stats summary so friends can see them
app.put("/api/user/sync-stats", authenticate, async (req, res) => {
  const { library_count, backlog_count, total_playtime_hours, top_genre, top_game } = req.body;
  await db.execute({
    sql: `INSERT INTO user_stats (user_id, library_count, backlog_count, total_playtime_hours, top_genre, top_game, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id) DO UPDATE SET
            library_count = excluded.library_count,
            backlog_count = excluded.backlog_count,
            total_playtime_hours = excluded.total_playtime_hours,
            top_genre = excluded.top_genre,
            top_game = excluded.top_game,
            updated_at = CURRENT_TIMESTAMP`,
    args: [req.user.id, library_count || 0, backlog_count || 0, total_playtime_hours || 0, top_genre || null, top_game || null],
  });
  res.json({ ok: true });
});

// Push titles that are in local library so group ownership checks work across users
app.put("/api/user/sync-library", authenticate, async (req, res) => {
  const { titles } = req.body; // array of strings
  if (!Array.isArray(titles)) return res.status(400).json({ error: "titles must be an array" });
  // Replace entire cache for this user
  await db.execute({ sql: "DELETE FROM library_cache WHERE user_id = ?", args: [req.user.id] });
  if (titles.length > 0) {
    for (const title of titles) {
      await db.execute({ sql: "INSERT OR IGNORE INTO library_cache (user_id, title) VALUES (?, ?)", args: [req.user.id, title.toLowerCase().trim()] });
    }
  }
  res.json({ ok: true });
});

app.get("/api/users/search", authenticate, async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (q.length < 2) return res.json([]);
  const results = rows(await db.execute({ sql: "SELECT id, username, avatar FROM users WHERE username LIKE ? AND id != ? LIMIT 10", args: [`%${q}%`, req.user.id] }));
  res.json(results.map(u => ({ ...u, id: Number(u.id) })));
});

// ── Friend routes ─────────────────────────────────────────────────────────────

app.get("/api/friends", authenticate, async (req, res) => {
  const friends = rows(await db.execute({
    sql: `SELECT u.id, u.username, u.avatar, u.online_status, u.current_game
          FROM friendships f JOIN users u ON u.id = f.addressee_id
          WHERE f.requester_id = ?
          AND EXISTS (SELECT 1 FROM friendships WHERE requester_id = f.addressee_id AND addressee_id = f.requester_id)
          ORDER BY u.username`,
    args: [req.user.id],
  }));
  res.json(friends.map(f => ({ ...f, id: Number(f.id) })));
});

app.get("/api/friends/pending", authenticate, async (req, res) => {
  const pending = rows(await db.execute({
    sql: `SELECT u.id, u.username, u.avatar FROM friendships f1
          JOIN users u ON u.id = f1.requester_id
          WHERE f1.addressee_id = ?
          AND NOT EXISTS (SELECT 1 FROM friendships f2 WHERE f2.requester_id = ? AND f2.addressee_id = f1.requester_id)`,
    args: [req.user.id, req.user.id],
  }));
  res.json(pending.map(u => ({ ...u, id: Number(u.id) })));
});

app.post("/api/friends/add", authenticate, async (req, res) => {
  const { username } = req.body;
  const target = row(await db.execute({ sql: "SELECT id, username, avatar FROM users WHERE username = ?", args: [username] }));
  if (!target) return res.status(404).json({ error: "User not found" });
  if (Number(target.id) === req.user.id) return res.status(400).json({ error: "Cannot add yourself" });
  await db.execute({ sql: "INSERT OR IGNORE INTO friendships (requester_id, addressee_id) VALUES (?, ?)", args: [req.user.id, Number(target.id)] });
  const mutual = row(await db.execute({ sql: "SELECT 1 FROM friendships WHERE requester_id = ? AND addressee_id = ?", args: [Number(target.id), req.user.id] }));
  res.json({ user: { ...target, id: Number(target.id) }, mutual: !!mutual });
});

app.delete("/api/friends/:userId", authenticate, async (req, res) => {
  const uid = parseInt(req.params.userId);
  await db.execute({ sql: "DELETE FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)", args: [req.user.id, uid, uid, req.user.id] });
  res.json({ ok: true });
});

app.get("/api/friends/:userId/recent-games", authenticate, async (req, res) => {
  const uid = parseInt(req.params.userId);
  const isFriend = row(await db.execute({ sql: "SELECT 1 FROM friendships WHERE requester_id = ? AND addressee_id = ?", args: [req.user.id, uid] }));
  if (!isFriend) return res.status(403).json({ error: "Not friends" });
  // Returns their recent shared-log additions visible on the remote server
  const games = rows(await db.execute({ sql: "SELECT title, artwork, banner, steam_url, genre, tags, status, created_at FROM shared_games WHERE user_id = ? ORDER BY created_at DESC LIMIT 20", args: [uid] }));
  res.json(games);
});

app.get("/api/friends/:userId/stats", authenticate, async (req, res) => {
  const uid = parseInt(req.params.userId);
  const isFriend = row(await db.execute({ sql: "SELECT 1 FROM friendships WHERE requester_id = ? AND addressee_id = ?", args: [req.user.id, uid] }));
  if (!isFriend) return res.status(403).json({ error: "Not friends" });
  const stats = row(await db.execute({ sql: "SELECT * FROM user_stats WHERE user_id = ?", args: [uid] }));
  res.json(stats || {});
});

// ── Notification count ────────────────────────────────────────────────────────

app.get("/api/notifications/count", authenticate, async (req, res) => {
  const unread = row(await db.execute({ sql: "SELECT COUNT(*) as c FROM messages WHERE receiver_id = ? AND is_read = 0", args: [req.user.id] }));
  const pending = row(await db.execute({
    sql: `SELECT COUNT(*) as c FROM friendships f1 WHERE f1.addressee_id = ?
          AND NOT EXISTS (SELECT 1 FROM friendships f2 WHERE f2.requester_id = ? AND f2.addressee_id = f1.requester_id)`,
    args: [req.user.id, req.user.id],
  }));
  const u = Number(unread?.c || 0);
  const p = Number(pending?.c || 0);
  res.json({ count: u + p, unread: u, pending: p });
});

// ── Group routes ──────────────────────────────────────────────────────────────

app.get("/api/groups", authenticate, async (req, res) => {
  const groups = rows(await db.execute({
    sql: `SELECT g.* FROM groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = ? ORDER BY g.name`,
    args: [req.user.id],
  }));
  res.json(groups.map(g => ({ ...g, id: Number(g.id) })));
});

app.post("/api/groups", authenticate, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Group name required" });
  const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const result = await db.execute({ sql: "INSERT INTO groups (name, invite_code, created_by) VALUES (?, ?, ?)", args: [name.trim(), invite_code, req.user.id] });
  const id = Number(result.lastInsertRowid);
  await db.execute({ sql: "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)", args: [id, req.user.id] });
  res.json({ id, name: name.trim(), invite_code, created_by: req.user.id });
});

app.post("/api/groups/join", authenticate, async (req, res) => {
  const { invite_code } = req.body;
  const group = row(await db.execute({ sql: "SELECT * FROM groups WHERE invite_code = ?", args: [invite_code?.toUpperCase()] }));
  if (!group) return res.status(404).json({ error: "Group not found" });
  try {
    await db.execute({ sql: "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)", args: [Number(group.id), req.user.id] });
    res.json({ ...group, id: Number(group.id) });
  } catch (e) {
    if (e.message?.includes("UNIQUE") || e.message?.includes("PRIMARY KEY")) {
      res.status(400).json({ error: "Already a member" });
    } else {
      res.status(500).json({ error: "Failed to join group" });
    }
  }
});

app.delete("/api/groups/:id", authenticate, async (req, res) => {
  const group = row(await db.execute({ sql: "SELECT * FROM groups WHERE id = ?", args: [req.params.id] }));
  if (!group) return res.status(404).json({ error: "Group not found" });
  if (Number(group.created_by) !== req.user.id) return res.status(403).json({ error: "Only the creator can delete this group" });
  await db.execute({ sql: "DELETE FROM groups WHERE id = ?", args: [req.params.id] });
  res.json({ ok: true });
});

// ── Shared game routes ────────────────────────────────────────────────────────

app.get("/api/games", authenticate, async (req, res) => {
  const games = rows(await db.execute({
    sql: `SELECT * FROM shared_games
          WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)
          ORDER BY created_at DESC`,
    args: [req.user.id],
  }));
  res.json(games.map(g => ({ ...g, id: Number(g.id), list_type: "shared" })));
});

app.post("/api/games", authenticate, async (req, res) => {
  const { title, artwork, banner, horizontal_grid, logo, genre, tags, description, steam_url, game_pass, allkeyshop_url, lowest_price, group_id, release_date, metacritic, steam_rating } = req.body;
  if (!title || !group_id) return res.status(400).json({ error: "title and group_id required" });
  const gid = Number(group_id);
  const isMember = row(await db.execute({ sql: "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?", args: [gid, req.user.id] }));
  if (!isMember) return res.status(403).json({ error: "Not a member of this group" });
  const result = await db.execute({
    sql: `INSERT INTO shared_games (title, artwork, banner, horizontal_grid, logo, genre, tags, description, steam_url, game_pass, allkeyshop_url, lowest_price, group_id, user_id, release_date, metacritic, steam_rating)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [title, artwork || null, banner || null, horizontal_grid || null, logo || null, genre || null, tags || null, description || null, steam_url || null, game_pass ? 1 : 0, allkeyshop_url || null, lowest_price || null, gid, req.user.id, release_date || null, metacritic || null, steam_rating || null],
  });
  const id = Number(result.lastInsertRowid);
  const game = row(await db.execute({ sql: "SELECT * FROM shared_games WHERE id = ?", args: [id] }));
  res.json({ ...game, id, list_type: "shared" });
});

app.put("/api/games/:id", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const game = row(await db.execute({ sql: "SELECT * FROM shared_games WHERE id = ?", args: [id] }));
  if (!game) return res.status(404).json({ error: "Not found" });
  // Must be group member to edit
  const isMember = row(await db.execute({ sql: "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?", args: [Number(game.group_id), req.user.id] }));
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  const { title, artwork, banner, horizontal_grid, logo, genre, tags, description, steam_url, game_pass, allkeyshop_url, lowest_price, release_date, metacritic, steam_rating } = req.body;
  await db.execute({
    sql: `UPDATE shared_games SET title=?, artwork=?, banner=?, horizontal_grid=?, logo=?, genre=?, tags=?, description=?, steam_url=?, game_pass=?, allkeyshop_url=?, lowest_price=?, release_date=?, metacritic=?, steam_rating=? WHERE id=?`,
    args: [title, artwork || null, banner || null, horizontal_grid || null, logo || null, genre || null, tags || null, description || null, steam_url || null, game_pass ? 1 : 0, allkeyshop_url || null, lowest_price || null, release_date || null, metacritic || null, steam_rating || null, id],
  });
  const updated = row(await db.execute({ sql: "SELECT * FROM shared_games WHERE id = ?", args: [id] }));
  res.json({ ...updated, id, list_type: "shared" });
});

app.patch("/api/games/:id/status", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const game = row(await db.execute({ sql: "SELECT group_id FROM shared_games WHERE id = ?", args: [id] }));
  if (!game) return res.status(404).json({ error: "Not found" });
  const isMember = row(await db.execute({ sql: "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?", args: [Number(game.group_id), req.user.id] }));
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  await db.execute({ sql: "UPDATE shared_games SET status = ? WHERE id = ?", args: [status, id] });
  res.json({ ok: true });
});

app.delete("/api/games/:id", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const game = row(await db.execute({ sql: "SELECT * FROM shared_games WHERE id = ?", args: [id] }));
  if (!game) return res.status(404).json({ error: "Not found" });
  const isMember = row(await db.execute({ sql: "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?", args: [Number(game.group_id), req.user.id] }));
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  await db.execute({ sql: "DELETE FROM shared_games WHERE id = ?", args: [id] });
  res.json({ ok: true });
});

app.patch("/api/games/:id/dismiss-price-alert", authenticate, async (req, res) => {
  await db.execute({ sql: "UPDATE shared_games SET price_dropped = 0 WHERE id = ? AND user_id = ?", args: [req.params.id, req.user.id] });
  res.json({ ok: true });
});

app.patch("/api/games/:id/dismiss-game-pass-alert", authenticate, async (req, res) => {
  await db.execute({ sql: "UPDATE shared_games SET game_pass_new = 0 WHERE id = ? AND user_id = ?", args: [req.params.id, req.user.id] });
  res.json({ ok: true });
});

// ── Group ownership (uses library_cache synced from local app) ────────────────

app.get("/api/groups/:groupId/ownership", authenticate, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const isMember = row(await db.execute({ sql: "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?", args: [groupId, req.user.id] }));
  if (!isMember) return res.status(403).json({ error: "Not a group member" });

  const members = rows(await db.execute({
    sql: `SELECT u.id, u.username, u.avatar FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id = ?`,
    args: [groupId],
  })).map(m => ({ ...m, id: Number(m.id) }));

  const sharedGames = rows(await db.execute({
    sql: "SELECT id, title FROM shared_games WHERE group_id = ?",
    args: [groupId],
  }));

  const ownership = {};
  for (const game of sharedGames) {
    const gameId = Number(game.id);
    ownership[gameId] = [];
    const titleLower = game.title.toLowerCase().trim();
    for (const member of members) {
      const has = row(await db.execute({ sql: "SELECT 1 FROM library_cache WHERE user_id = ? AND title = ?", args: [member.id, titleLower] }));
      if (has) ownership[gameId].push(member.id);
    }
  }

  res.json({ members, ownership });
});

// ── Comment routes ────────────────────────────────────────────────────────────

app.get("/api/games/:id/comments", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const game = row(await db.execute({ sql: "SELECT group_id FROM shared_games WHERE id = ?", args: [id] }));
  if (!game) return res.status(404).json({ error: "Not found" });
  const isMember = row(await db.execute({ sql: "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?", args: [Number(game.group_id), req.user.id] }));
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  const comments = rows(await db.execute({
    sql: `SELECT c.id, c.content, c.created_at, c.user_id, u.username, u.avatar
          FROM game_comments c JOIN users u ON u.id = c.user_id
          WHERE c.game_id = ? ORDER BY c.created_at ASC`,
    args: [id],
  }));
  res.json(comments.map(c => ({ ...c, id: Number(c.id), user_id: Number(c.user_id) })));
});

app.post("/api/games/:id/comments", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Comment cannot be empty" });
  const game = row(await db.execute({ sql: "SELECT group_id FROM shared_games WHERE id = ?", args: [id] }));
  if (!game) return res.status(404).json({ error: "Not found" });
  const isMember = row(await db.execute({ sql: "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?", args: [Number(game.group_id), req.user.id] }));
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  const result = await db.execute({ sql: "INSERT INTO game_comments (game_id, user_id, content) VALUES (?, ?, ?)", args: [id, req.user.id, content.trim()] });
  const comment = row(await db.execute({
    sql: `SELECT c.id, c.content, c.created_at, c.user_id, u.username, u.avatar FROM game_comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
    args: [Number(result.lastInsertRowid)],
  }));
  res.json({ ...comment, id: Number(comment.id), user_id: Number(comment.user_id) });
});

app.delete("/api/games/comments/:commentId", authenticate, async (req, res) => {
  const id = parseInt(req.params.commentId);
  const comment = row(await db.execute({ sql: "SELECT user_id FROM game_comments WHERE id = ?", args: [id] }));
  if (!comment) return res.status(404).json({ error: "Not found" });
  if (Number(comment.user_id) !== req.user.id) return res.status(403).json({ error: "Not your comment" });
  await db.execute({ sql: "DELETE FROM game_comments WHERE id = ?", args: [id] });
  res.json({ ok: true });
});

// ── Message routes ────────────────────────────────────────────────────────────

app.get("/api/messages/:friendId", authenticate, async (req, res) => {
  const fid = parseInt(req.params.friendId);
  const msgs = rows(await db.execute({
    sql: `SELECT m.*, u.username as sender_username, u.avatar as sender_avatar
          FROM messages m JOIN users u ON u.id = m.sender_id
          WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
          ORDER BY m.created_at ASC`,
    args: [req.user.id, fid, fid, req.user.id],
  }));
  res.json(msgs.map(m => ({ ...m, id: Number(m.id) })));
});

app.post("/api/messages", authenticate, async (req, res) => {
  const { receiver_id, content, game_title, game_artwork, steam_app_id } = req.body;
  if (!receiver_id || (!content && !game_title)) return res.status(400).json({ error: "receiver_id and content or game required" });
  const result = await db.execute({
    sql: "INSERT INTO messages (sender_id, receiver_id, content, game_title, game_artwork, steam_app_id) VALUES (?, ?, ?, ?, ?, ?)",
    args: [req.user.id, Number(receiver_id), content || null, game_title || null, game_artwork || null, steam_app_id || null],
  });
  const msg = row(await db.execute({
    sql: `SELECT m.*, u.username as sender_username, u.avatar as sender_avatar FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?`,
    args: [Number(result.lastInsertRowid)],
  }));
  res.json({ ...msg, id: Number(msg.id) });
});

app.patch("/api/messages/:friendId/read", authenticate, async (req, res) => {
  await db.execute({ sql: "UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?", args: [parseInt(req.params.friendId), req.user.id] });
  res.json({ ok: true });
});

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/health", (_, res) => res.json({ ok: true, version: "1.0.0" }));

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`QuestLog remote server running on port ${PORT}`));
  })
  .catch((e) => {
    console.error("Failed to initialise database:", e);
    process.exit(1);
  });
