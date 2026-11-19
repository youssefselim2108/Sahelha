// Mounted at /api/bookings/:id/quotation (FR-QUO)
const router = require('express').Router({ mergeParams: true });
const { Quotation } = require('../../models');
const { requireAuth } = require('../../auth/middleware');
const { HttpError, wrap } = require('../../errors');
const { load } = require('../bookings/routes');
const { setStatus } = require('../bookings/service');

// FR-QUO-05/06: totals from approved items only, computed on the server
const view = (q) => {
  const o = q.toObject();
  const sum = (state) => o.items.filter((i) => i.state === state).reduce((s, i) => s + i.amount, 0);
  return { ...o, approvedTotal: sum('approved'), pendingTotal: sum('pending') };
};

async function getQuote(bookingId) {
  const q = await Quotation.findOne({ booking: bookingId });
  if (!q) throw new HttpError(404, 'No quotation for this booking yet');
  return q;
}

router.use(requireAuth);

router.get('/', wrap(async (req, res) => {
  const b = await load(req, 'customer', 'technician', 'admin');
  res.json(view(await getQuote(b._id)));
}));

// FR-QUO-01: technician sends an itemised quote after Arrived
router.post('/', wrap(async (req, res) => {
  const b = await load(req, 'technician');
  if (b.status !== 'Arrived') throw new HttpError(409, 'A quotation can only be sent after Arrived');
  if (await Quotation.exists({ booking: b._id })) throw new HttpError(409, 'Quotation already sent');
  const items = (req.body.items || []).map(({ kind, description, amount }) => ({ kind, description, amount }));
  if (!items.length || items.some((i) => i.kind === 'extra')) throw new HttpError(400, 'Items must be diagnostic, parts or labor');
  res.status(201).json(view(await Quotation.create({ booking: b._id, items })));
}));

// FR-QUO-02/03: customer approves or declines the whole quote
router.post('/decision', wrap(async (req, res) => {
  const b = await load(req, 'customer');
  const q = await getQuote(b._id);
  if (q.status !== 'sent') throw new HttpError(409, 'Quotation already decided');
  const approve = req.body.approve === true;
  const now = new Date();
  q.status = approve ? 'approved' : 'declined';
  q.decidedAt = now;
  q.items.forEach((i) => Object.assign(i, { state: approve ? 'approved' : 'declined', decidedAt: now }));
  await q.save();
  if (approve) {
    b.quoteApproved = true;
    await b.save();
  } else {
    // The diagnostic fee stays payable (FR-QUO-03, OI-3); payment happens offline (BR-11)
    Object.assign(b, { cancelReason: 'Quotation declined', cancelledBy: 'customer' });
    await setStatus(b, 'Cancelled', req.user.id, 'Quotation declined');
  }
  res.json(view(q));
}));

// FR-QUO-04: extra cost while ServiceStarted; stays pending until the customer decides (BR-03)
router.post('/extra', wrap(async (req, res) => {
  const b = await load(req, 'technician');
  if (b.status !== 'ServiceStarted') throw new HttpError(409, 'Extra costs can only be added during the service');
  const q = await getQuote(b._id);
  q.items.push({ kind: 'extra', description: req.body.description, amount: req.body.amount });
  await q.save();
  res.status(201).json(view(q));
}));

router.post('/extra/:itemId/decision', wrap(async (req, res) => {
  const b = await load(req, 'customer');
  const q = await getQuote(b._id);
  const item = q.items.id(req.params.itemId);
  if (!item || item.kind !== 'extra') throw new HttpError(404, 'Extra cost not found');
  if (item.state !== 'pending') throw new HttpError(409, 'Already decided'); // BR-04: decided items are locked
  Object.assign(item, { state: req.body.approve === true ? 'approved' : 'declined', decidedAt: new Date() });
  await q.save();
  res.json(view(q));
}));

module.exports = router;
