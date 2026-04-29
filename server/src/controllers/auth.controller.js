const bcrypt  = require('bcryptjs');
const { v4 }  = require('uuid');
const { sign } = require('../utils/jwt');
const store   = require('../services/store');

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444','#3b82f6','#14b8a6'];

function makeAvatar(username) {
  const color = AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length];
  return { initials: username.slice(0, 2).toUpperCase(), color };
}

async function register(req, res, next) {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username dan password wajib diisi' });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: 'Username 3-20 karakter, hanya huruf/angka/_' });
    if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
    if (store.getUserByUsername(username)) return res.status(409).json({ error: 'Username sudah dipakai' });

    const user = {
      id: v4(), username,
      displayName: (displayName?.trim()) || username,
      passwordHash: await bcrypt.hash(password, 12),
      avatar: makeAvatar(username),
      online: false, socketId: null, lastSeen: null,
      createdAt: new Date(),
    };
    store.addUser(user);
    const { passwordHash: _, ...safe } = user;
    res.status(201).json({ token: sign({ userId: user.id }), user: safe });
  } catch (e) { next(e); }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username dan password wajib diisi' });
    const user = store.getUserByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: 'Username atau password salah' });
    const { passwordHash: _, ...safe } = user;
    res.json({ token: sign({ userId: user.id }), user: safe });
  } catch (e) { next(e); }
}

function me(req, res) {
  const { passwordHash: _, ...safe } = req.user;
  res.json({ user: safe });
}

module.exports = { register, login, me };
