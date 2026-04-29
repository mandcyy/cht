const { verify } = require('../utils/jwt');
const store = require('../services/store');

function authHTTP(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token missing' });
  try {
    const payload = verify(h.slice(7));
    const user = store.getUser(payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch { res.status(401).json({ error: 'Token invalid or expired' }); }
}

function authSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('TOKEN_MISSING'));
  try {
    const payload = verify(token);
    const user = store.getUser(payload.userId);
    if (!user) return next(new Error('USER_NOT_FOUND'));
    socket.user = user;
    next();
  } catch { next(new Error('TOKEN_INVALID')); }
}

module.exports = { authHTTP, authSocket };
