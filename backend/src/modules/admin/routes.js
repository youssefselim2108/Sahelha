const router = require('express').Router();
const { Technician, Settings } = require('../../models');
const { requireAuth, requireRole } = require('../../auth/middleware');
const { HttpError, wrap } = require('../../errors');
const { getSettings, recomputeReliability } = require('../matching/service');

router.use(requireAuth, requireRole('admin'));

// FR-VER: verification queue
router.get('/technicians', wrap(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  res.json(await Technician.find(filter).populate('user', 'name phone email').sort({ createdAt: 1 }));
}));

router.post('/technicians/:id/verify', wrap(async (req, res) => {
  const { decision } = req.body;
  if (!['Verified', 'Rejected', 'Suspended'].includes(decision)) throw new HttpError(400, 'decision must be Verified, Rejected or Suspended');
  const t = await Technician.findByIdAndUpdate(req.params.id, { status: decision }, { new: true });
  if (!t) throw new HttpError(404, 'Technician not found');
  res.json(t);
}));

router.get('/settings/weights', wrap(async (req, res) => res.json(await getSettings())));

// FR-REL-02 / FR-MAT-03: weights must sum to 1; every change is logged
router.put('/settings/weights', wrap(async (req, res) => {
  const current = await getSettings();
  const update = {};
  const history = [];
  for (const field of ['reliabilityWeights', 'matchWeights']) {
    const next = req.body[field];
    if (!next) continue;
    const keys = Object.keys(current[field]);
    if (Object.keys(next).sort().join() !== keys.sort().join()) throw new HttpError(400, `${field} must have keys: ${keys.join(', ')}`);
    const values = Object.values(next);
    if (values.some((v) => typeof v !== 'number' || v < 0)) throw new HttpError(400, `${field} must be non-negative numbers`);
    if (Math.abs(values.reduce((a, b) => a + b, 0) - 1) > 1e-6) throw new HttpError(400, `${field} must add up to 1`);
    update[field] = next;
    history.push({ field, from: current[field], to: next, by: req.user.id });
  }
  if (!history.length) throw new HttpError(400, 'Nothing to update');
  await Settings.findByIdAndUpdate('global', { $set: update, $push: { history: { $each: history } } }, { upsert: true });
  if (update.reliabilityWeights) {
    for (const t of await Technician.find({}, '_id')) await recomputeReliability(t._id);
  }
  res.json(await getSettings());
}));

module.exports = router;
