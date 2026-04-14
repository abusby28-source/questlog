// All calls to the remote Railway server go through this file.
// Local server (localhost) handles: private games, library, platform integrations.
// Remote server handles: auth, friends, groups, shared games, messages, comments.

const BASE = (process.env.REMOTE_API_URL || '').replace(/\/$/, '');

function getToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

const get  = <T>(path: string)               => req<T>('GET',    path);
const post = <T>(path: string, body: unknown) => req<T>('POST',   path, body);
const put  = <T>(path: string, body: unknown) => req<T>('PUT',    path, body);
const patch = <T>(path: string, body?: unknown) => req<T>('PATCH', path, body);
const del  = <T>(path: string)               => req<T>('DELETE', path);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const remoteRegister = (username: string, password: string) =>
  post<{ token: string; user: any }>('/api/auth/register', { username, password });

export const remoteLogin = (username: string, password: string) =>
  post<{ token: string; user: any }>('/api/auth/login', { username, password });

export const remoteMe = () => get<any>('/api/auth/me');

// ── User ──────────────────────────────────────────────────────────────────────

export const remoteUpdateAvatar = (avatar: string) =>
  patch<any>('/api/user/avatar', { avatar });

export const remoteUpdateSettings = (settings: { username?: string; current_password?: string; new_password?: string; activity_private?: boolean }) =>
  patch<any>('/api/user/settings', settings);

export const remoteUpdateStatus = (online_status: string, current_game?: string) =>
  patch('/api/user/status', { online_status, current_game });

export const remoteSyncStats = (stats: { library_count: number; backlog_count: number; total_playtime_hours: number; top_genre?: string; top_game?: string }) =>
  put('/api/user/sync-stats', stats);

export const remoteSyncLibrary = (titles: string[]) =>
  put('/api/user/sync-library', { titles });

export const remoteBackupLibrary = (games: any[]) =>
  put<{ ok: boolean; count: number }>('/api/user/library/backup', { games });

export const remoteRestoreLibrary = () =>
  get<any[]>('/api/user/library/backup');

export const remoteSearchUsers = (q: string) =>
  get<any[]>(`/api/users/search?q=${encodeURIComponent(q)}`);

// ── Friends ───────────────────────────────────────────────────────────────────

export const remoteGetFriends = () => get<any[]>('/api/friends');
export const remoteGetPendingFriends = () => get<any[]>('/api/friends/pending');
export const remoteAddFriend = (username: string) => post<any>('/api/friends/add', { username });
export const remoteRemoveFriend = (userId: number) => del(`/api/friends/${userId}`);
export const remoteGetFriendRecentGames = (userId: number) => get<any[]>(`/api/friends/${userId}/recent-games`);
export const remoteGetFriendStats = (userId: number) => get<any>(`/api/friends/${userId}/stats`);

// ── Notifications ─────────────────────────────────────────────────────────────

export const remoteGetNotifications = () => get<{ count: number; unread: number; pending: number }>('/api/notifications/count');

// ── Groups ────────────────────────────────────────────────────────────────────

export const remoteGetGroups = () => get<any[]>('/api/groups');
export const remoteCreateGroup = (name: string) => post<any>('/api/groups', { name });
export const remoteJoinGroup = (invite_code: string) => post<any>('/api/groups/join', { invite_code });
export const remoteDeleteGroup = (id: number) => del(`/api/groups/${id}`);

// ── Shared games ──────────────────────────────────────────────────────────────

export const remoteGetSharedGames = () => get<any[]>('/api/games');
export const remoteAddSharedGame = (game: any) => post<any>('/api/games', game);
export const remoteUpdateSharedGame = (id: number, game: any) => put<any>(`/api/games/${id}`, game);
export const remoteUpdateSharedGameStatus = (id: number, status: string) => patch(`/api/games/${id}/status`, { status });
export const remoteDeleteSharedGame = (id: number) => del(`/api/games/${id}`);
export const remoteDismissPriceAlert = (id: number) => patch(`/api/games/${id}/dismiss-price-alert`);
export const remoteDismissGamePassAlert = (id: number) => patch(`/api/games/${id}/dismiss-game-pass-alert`);

// ── Group ownership ───────────────────────────────────────────────────────────

export const remoteGetGroupOwnership = (groupId: number) =>
  get<{ members: any[]; ownership: Record<number, number[]> }>(`/api/groups/${groupId}/ownership`);

// ── Comments ──────────────────────────────────────────────────────────────────

export const remoteGetComments = (gameId: number) => get<any[]>(`/api/games/${gameId}/comments`);
export const remoteAddComment = (gameId: number, content: string) => post<any>(`/api/games/${gameId}/comments`, { content });
export const remoteDeleteComment = (commentId: number) => del(`/api/games/comments/${commentId}`);

// ── Messages ──────────────────────────────────────────────────────────────────

export const remoteGetMessages = (friendId: number) => get<any[]>(`/api/messages/${friendId}`);
export const remoteSendMessage = (receiver_id: number, content?: string, game?: { game_title: string; game_artwork: string; steam_app_id?: string }) =>
  post<any>('/api/messages', { receiver_id, content, ...game });
export const remoteMarkMessagesRead = (friendId: number) => patch(`/api/messages/${friendId}/read`);

// ── Group messages ────────────────────────────────────────────────────────────

export const remoteGetGroupMessages = (groupId: number) =>
  get<any[]>(`/api/groups/${groupId}/messages`);

export const remoteSendGroupMessage = (groupId: number, content: string) =>
  post<any>(`/api/groups/${groupId}/messages`, { content });

// ── Common games ──────────────────────────────────────────────────────────────

export const remoteGetCommonGames = (friendId: number) =>
  get<{ title: string; artwork?: string; status?: string }[]>(`/api/friends/${friendId}/common-games`);
