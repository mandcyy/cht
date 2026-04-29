const jwt = require('jsonwebtoken');
const SECRET     = process.env.JWT_SECRET || 'dev-secret-min-64-chars-change-me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const sign   = (p) => jwt.sign(p, SECRET, { expiresIn: EXPIRES_IN });
const verify = (t) => jwt.verify(t, SECRET);
module.exports = { sign, verify };
