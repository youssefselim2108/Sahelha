const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Technician } = require('../models');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
const { HttpError, wrap } = require('../errors');
const { requireAuth } = require('./middleware');

const sign = (u) => jwt.sign({ sub: String(u._id), role: u.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
const publicUser = (u) => ({ id: u._id, name: u.name, phone: u.phone, email: u.email, role: u.role });

function checkPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
}

// Shared by the seed script; admins are only ever created here, never via the public routes (FR-AUTH-07)
async function createUser({ name, phone, email, password }, role) {
  checkPassword(password);
  return User.create({ name, phone, email: email || undefined, role, passwordHash: await bcrypt.hash(password, 10) });
}

// FR-AUTH-01
router.post('/register/customer', wrap(async (req, res) => {
  const u = await createUser(req.body, 'customer');
  res.status(201).json({ token: sign(u), user: publicUser(u) });
}));

// FR-AUTH-02: technician starts as Pending until an admin verifies
router.post('/register/technician', wrap(async (req, res) => {
  const { trades, years, base, radiusKm, diagnosticFee } = req.body;
  // Validate the profile first so a bad profile does not leave an orphan user behind
  await new Technician({ user: '000000000000000000000000', trades, years, base, radiusKm, diagnosticFee }).validate();
  const u = await createUser(req.body, 'technician');
  try {
    const t = await Technician.create({ user: u._id, trades, years, base, radiusKm, diagnosticFee });
    res.status(201).json({ token: sign(u), user: publicUser(u), technician: { id: t._id, status: t.status } });
  } catch (e) {
    await User.deleteOne({ _id: u._id });
    throw e;
  }
}));

// FR-AUTH-04: phone or email + password
router.post('/login', wrap(async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) throw new HttpError(400, 'login and password are required');
  const u = await User.findOne({ $or: [{ phone: login }, { email: String(login).toLowerCase() }] }).select('+passwordHash');
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) throw new HttpError(401, 'Wrong phone/email or password');
  res.json({ token: sign(u), user: publicUser(u) });
}));

router.get('/me', requireAuth, wrap(async (req, res) => {
  const u = await User.findById(req.user.id);
  if (!u) throw new HttpError(404, 'Account not found');
  res.json(publicUser(u));
}));

module.exports = { router, createUser };
