const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { HttpError } = require('../errors');

function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(new HttpError(401, 'Sign in required'));
  try {
    const p = jwt.verify(token, JWT_SECRET);
    req.user = { id: p.sub, role: p.role };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

// FR-AUTH-06: refuse any call the caller's role does not allow
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new HttpError(403, 'Not allowed for your role'));

module.exports = { requireAuth, requireRole };
