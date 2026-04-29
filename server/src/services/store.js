const fs   = require('fs');
const path = require('path');

const STORY_TTL       = 24 * 60 * 60 * 1000;
const MAX_MSG_PER_ROOM = 200;
const DB_PATH         = path.join(__dirname, '../../data/db.json');

// ── Helpers ────────────────────────────────────────────────────────────
function ensureDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadDB() {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function saveDB(data) {
  ensureDir();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB] Failed to save:', e.message);
  }
}

class Store {
  constructor() {
    this.sockets = new Map(); // socketId -> userId  (runtime only, not persisted)

    // Persisted data — loaded from file
    this.users    = new Map();
    this.rooms    = new Map();
    this.messages = new Map(); // roomId -> Message[]
    this.contacts = new Map(); // userId -> Set<userId>
    this.requests = new Map();
    this.readAt   = new Map(); // `${roomId}:${userId}` -> ISO
    this.stories  = new Map();

    this._load();
    this._scheduleAutoSave();
  }

  // ── Persistence ────────────────────────────────────────────────────
  _load() {
    const db = loadDB();
    if (!db) { console.log('[DB] No existing data, starting fresh'); return; }

    try {
      // Restore users
      (db.users || []).forEach(u => this.users.set(u.id, u));

      // Restore rooms
      (db.rooms || []).forEach(r => this.rooms.set(r.id, r));

      // Restore messages (Map roomId -> array)
      Object.entries(db.messages || {}).forEach(([roomId, msgs]) => {
        this.messages.set(roomId, msgs);
      });

      // Restore contacts (userId -> Set)
      Object.entries(db.contacts || {}).forEach(([uid, list]) => {
        this.contacts.set(uid, new Set(list));
      });

      // Restore requests
      (db.requests || []).forEach(r => this.requests.set(r.id, r));

      // Restore readAt
      Object.entries(db.readAt || {}).forEach(([k, v]) => this.readAt.set(k, v));

      // Restore stories (prune expired ones immediately)
      const now = Date.now();
      (db.stories || []).forEach(s => {
        if (now - new Date(s.createdAt).getTime() < STORY_TTL) {
          this.stories.set(s.id, s);
        }
      });

      // Reset all online status — everyone starts offline on restart
      for (const [id, u] of this.users) {
        this.users.set(id, { ...u, online: false, socketId: null });
      }

      console.log(`[DB] Loaded: ${this.users.size} users, ${this.rooms.size} rooms, ${this.stories.size} stories`);
    } catch (e) {
      console.error('[DB] Load error:', e.message);
    }
  }

  _save() {
    const db = {
      users:    [...this.users.values()],
      rooms:    [...this.rooms.values()],
      messages: Object.fromEntries(
        [...this.messages.entries()].map(([k, v]) => [k, v.slice(-MAX_MSG_PER_ROOM)])
      ),
      contacts: Object.fromEntries(
        [...this.contacts.entries()].map(([k, v]) => [k, [...v]])
      ),
      requests: [...this.requests.values()],
      readAt:   Object.fromEntries(this.readAt),
      stories:  [...this.stories.values()],
    };
    saveDB(db);
  }

  // Debounced save — avoid hammering disk on every message
  _scheduleAutoSave() {
    this._saveTimer = null;
    this._dirtySave = () => {
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => this._save(), 1500);
    };
  }

  _persist() { this._dirtySave(); }

  // ── Users ──────────────────────────────────────────────────────────
  addUser(u) {
    this.users.set(u.id, u);
    this._persist();
  }
  getUser(id)           { return this.users.get(id) || null; }
  getUserByUsername(un) {
    for (const u of this.users.values()) if (u.username === un) return u;
    return null;
  }
  allPublicUsers() {
    return [...this.users.values()].map(({ passwordHash:_, ...u }) => u);
  }
  updateUser(id, patch) {
    const u = this.users.get(id);
    if (!u) return;
    this.users.set(id, { ...u, ...patch });
    this._persist();
  }
  safeUser(id) {
    const u = this.getUser(id);
    if (!u) return null;
    const { passwordHash:_, ...s } = u;
    return s;
  }

  // ── Presence (runtime only — not persisted) ────────────────────────
  setOnline(userId, socketId) {
    this.sockets.set(socketId, userId);
    this.updateUser(userId, { online: true, socketId, lastSeen: new Date() });
  }
  setOffline(socketId) {
    const userId = this.sockets.get(socketId);
    if (userId) {
      this.updateUser(userId, { online: false, socketId: null, lastSeen: new Date() });
      this.sockets.delete(socketId);
    }
    return userId || null;
  }
  getSocketId(userId) { return this.getUser(userId)?.socketId || null; }

  // ── Contacts ───────────────────────────────────────────────────────
  addContact(a, b) {
    [a, b].forEach(id => { if (!this.contacts.has(id)) this.contacts.set(id, new Set()); });
    this.contacts.get(a).add(b);
    this.contacts.get(b).add(a);
    this._persist();
  }
  getContacts(userId) {
    return [...(this.contacts.get(userId) || [])].map(id => this.safeUser(id)).filter(Boolean);
  }
  hasContact(a, b) { return this.contacts.get(a)?.has(b) || false; }

  // ── Requests ───────────────────────────────────────────────────────
  sendRequest(fromId, toId) {
    for (const r of this.requests.values()) {
      if ((r.fromId===fromId&&r.toId===toId)||(r.fromId===toId&&r.toId===fromId)) return null;
    }
    const id  = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const req = { id, fromId, toId, createdAt: new Date() };
    this.requests.set(id, req);
    this._persist();
    return req;
  }
  getRequestById(id)          { return this.requests.get(id) || null; }
  deleteRequest(id)           { this.requests.delete(id); this._persist(); }
  getIncomingRequests(userId) {
    return [...this.requests.values()]
      .filter(r => r.toId === userId)
      .map(r => ({ ...r, from: this.safeUser(r.fromId) }));
  }

  // ── Read receipts ──────────────────────────────────────────────────
  markRead(roomId, userId) {
    const k = `${roomId}:${userId}`;
    this.readAt.set(k, new Date().toISOString());
    this._persist();
    return this.readAt.get(k);
  }
  getReadAt(roomId, userId) {
    return this.readAt.get(`${roomId}:${userId}`) || null;
  }

  // ── Rooms ──────────────────────────────────────────────────────────
  getOrCreateRoom(a, b) {
    const roomId = [a, b].sort().join(':');
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, { id: roomId, participants: [a, b], createdAt: new Date() });
      this.messages.set(roomId, []);
      this._persist();
    }
    return this.rooms.get(roomId);
  }
  getRoomsForUser(userId) {
    return [...this.rooms.values()].filter(r => r.participants.includes(userId));
  }

  // ── Messages ───────────────────────────────────────────────────────
  saveMessage(msg) {
    const list = this.messages.get(msg.roomId) || [];
    list.push(msg);
    if (list.length > MAX_MSG_PER_ROOM) list.splice(0, list.length - MAX_MSG_PER_ROOM);
    this.messages.set(msg.roomId, list);
    this._persist();
    return msg;
  }
  getMessages(roomId)              { return this.messages.get(roomId) || []; }
  getMessagesAfter(roomId, afterTs) {
    const list = this.messages.get(roomId) || [];
    if (!afterTs) return list;
    const cutoff = new Date(afterTs).getTime();
    return list.filter(m => new Date(m.timestamp).getTime() > cutoff);
  }

  // ── Stories ────────────────────────────────────────────────────────
  addStory(story) { this.stories.set(story.id, story); this._persist(); return story; }
  getStoriesForUser(viewerId) {
    const now = Date.now();
    const ids = new Set([...(this.contacts.get(viewerId) || []), viewerId]);
    return [...this.stories.values()]
      .filter(s => ids.has(s.userId) && (now - new Date(s.createdAt).getTime()) < STORY_TTL)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  markStoryViewed(storyId, viewerId) {
    const s = this.stories.get(storyId);
    if (!s || s.userId === viewerId) return;
    if (!s.views.includes(viewerId)) { s.views.push(viewerId); this._persist(); }
  }
  pruneExpiredStories() {
    const now = Date.now();
    let changed = false;
    for (const [id, s] of this.stories) {
      if (now - new Date(s.createdAt).getTime() > STORY_TTL) { this.stories.delete(id); changed = true; }
    }
    if (changed) this._persist();
  }
}

module.exports = new Store();
