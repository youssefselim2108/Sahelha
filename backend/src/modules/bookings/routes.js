const router = require('express').Router();
const { Booking, StatusEvent, Technician } = require('../../models');
const { requireAuth, requireRole } = require('../../auth/middleware');
const { HttpError, wrap } = require('../../errors');
const svc = require('./service');

router.use(requireAuth);

// Loads the booking and checks the caller is its customer or its technician (admins may read all)
async function load(req, ...roles) {
  if (!roles.includes(req.user.role)) throw new HttpError(403, 'Not allowed for your role');
  const b = await Booking.findById(req.params.id);
  if (!b) throw new HttpError(404, 'Booking not found');
  if (req.user.role === 'customer' && String(b.customer) === req.user.id) return b;
  if (req.user.role === 'technician') {
    const t = await Technician.findOne({ user: req.user.id }, '_id');
    if (t && String(b.technician) === String(t._id)) return b;
  }
  if (req.user.role === 'admin') return b;
  throw new HttpError(404, 'Booking not found');
}

router.post('/', requireRole('customer'), wrap(async (req, res) => {
  const b = await svc.createBooking({ requestId: req.body.requestId, technicianId: req.body.technicianId, customerId: req.user.id });
  res.status(201).json(b);
}));

router.get('/', wrap(async (req, res) => {
  let filter = { customer: req.user.id };
  if (req.user.role === 'technician') filter = { technician: (await Technician.findOne({ user: req.user.id }, '_id'))?._id };
  if (req.user.role === 'admin') filter = req.query.status ? { status: req.query.status } : {};
  res.json(await Booking.find(filter).sort({ slotStart: -1 }).limit(100));
}));

router.get('/:id', wrap(async (req, res) => {
  const b = await load(req, 'customer', 'technician', 'admin');
  const events = await StatusEvent.find({ booking: b._id }).sort({ at: 1 });
  res.json({ ...b.toObject(), events });
}));

router.post('/:id/accept', wrap(async (req, res) => res.json(await svc.respond(await load(req, 'technician'), true, req.user.id))));
router.post('/:id/decline', wrap(async (req, res) => res.json(await svc.respond(await load(req, 'technician'), false, req.user.id))));
router.post('/:id/status', wrap(async (req, res) => res.json(await svc.advance(await load(req, 'technician'), req.body.to, req.user.id))));
router.post('/:id/cancel', wrap(async (req, res) => {
  const b = await load(req, 'customer', 'technician');
  res.json(await svc.cancel(b, req.user.role, req.user.id, req.body.reason));
}));

module.exports = { router, load };
