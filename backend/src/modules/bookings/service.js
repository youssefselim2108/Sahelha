const { Booking, StatusEvent, Technician, Request } = require('../../models');
const { HttpError } = require('../../errors');
const { recomputeReliability, ACTIVE } = require('../matching/service');
const C = require('../../config');

// BR-01: the only legal moves. No cancel after ServiceStarted (BR-05).
const NEXT = {
  Confirmed: ['Assigned', 'Cancelled'],
  Assigned: ['OnTheWay', 'Cancelled'],
  OnTheWay: ['Arrived', 'Cancelled'],
  Arrived: ['ServiceStarted', 'Cancelled'],
  ServiceStarted: ['Completed'],
  Completed: [],
  Cancelled: [],
};

async function setStatus(booking, to, userId, note) {
  const from = booking.status;
  if (!NEXT[from]?.includes(to)) throw new HttpError(409, `Illegal move ${from} → ${to}`); // BR-01
  if (to === 'ServiceStarted' && !booking.quoteApproved) throw new HttpError(409, 'Quotation not approved yet'); // BR-02
  booking.status = to;
  await booking.save();
  await StatusEvent.create({ booking: booking._id, from, to, by: userId, note });
  return booking;
}

// FR-BOK-01/05 + BR-07/08
async function createBooking({ requestId, technicianId, customerId }) {
  const request = await Request.findById(requestId);
  if (!request || String(request.customer) !== customerId) throw new HttpError(404, 'Request not found');
  const tech = await Technician.findById(technicianId);
  if (!tech || tech.status !== 'Verified' || !tech.online) throw new HttpError(409, 'Technician is not available'); // BR-08
  if (!tech.trades.includes(request.category)) throw new HttpError(409, 'Technician does not work in this category');

  const slotStart = request.slotStart;
  const slotEnd = new Date(slotStart.getTime() + C.SLOT_HOURS * 3600e3);
  // shortcut: check-then-insert can race under concurrent bookings; add a transaction or slot lock before real traffic.
  const clash = await Booking.exists({ technician: tech._id, status: { $in: ACTIVE }, slotStart: { $lt: slotEnd }, slotEnd: { $gt: slotStart } });
  if (clash) throw new HttpError(409, 'Technician already has a booking at this time'); // BR-07
  if (await Booking.exists({ request: request._id, status: { $in: ACTIVE } })) throw new HttpError(409, 'This request already has an active booking');

  const b = await Booking.create({
    request: request._id, customer: customerId, technician: tech._id, slotStart, slotEnd,
    acceptBy: new Date(Date.now() + C.ACCEPT_WINDOW_MIN * 60e3),
  });
  await StatusEvent.create({ booking: b._id, from: null, to: 'Confirmed', by: customerId });
  return b;
}

// FR-BOK-03/04: accept inside the window, otherwise the booking lapses
async function respond(booking, accept, userId) {
  if (booking.status !== 'Confirmed') throw new HttpError(409, 'Booking is not waiting for a response');
  if (!accept || booking.acceptBy < new Date()) {
    booking.cancelReason = accept ? 'No response in time' : 'Technician declined';
    booking.cancelledBy = accept ? 'system' : 'technician';
    await setStatus(booking, 'Cancelled', userId, booking.cancelReason);
    if (accept) throw new HttpError(409, 'Response window has passed');
    return booking;
  }
  await setStatus(booking, 'Assigned', userId);
  await Technician.updateOne({ _id: booking.technician }, { $inc: { 'stats.acceptedJobs': 1 } });
  return booking;
}

// Technician moves the job forward: OnTheWay → Arrived → ServiceStarted → Completed
async function advance(booking, to, userId) {
  if (!['OnTheWay', 'Arrived', 'ServiceStarted', 'Completed'].includes(to)) throw new HttpError(400, 'Unknown status');
  await setStatus(booking, to, userId);

  if (to === 'Arrived') {
    // FR-REL-05: on time = arrived no later than slot start + grace
    const onTime = Date.now() <= booking.slotStart.getTime() + C.ON_TIME_GRACE_MIN * 60e3;
    await Technician.updateOne({ _id: booking.technician }, { $inc: { 'stats.arrivalsMeasured': 1, 'stats.onTimeArrivals': onTime ? 1 : 0 } });
  }
  if (to === 'Completed') {
    const repeat = await Booking.exists({ _id: { $ne: booking._id }, technician: booking.technician, customer: booking.customer, status: 'Completed' });
    await Technician.updateOne({ _id: booking.technician }, { $inc: { 'stats.completedJobs': 1, 'stats.repeatCustomers': repeat ? 1 : 0 } });
    await recomputeReliability(booking.technician); // FR-REL-03
  }
  return booking;
}

// FR-BOK-06/07, BR-05/06: only technician cancellations after accepting count against the score
async function cancel(booking, role, userId, reason) {
  if (!reason || !String(reason).trim()) throw new HttpError(400, 'A reason is required to cancel');
  const accepted = booking.status !== 'Confirmed';
  booking.cancelReason = String(reason).trim();
  booking.cancelledBy = role;
  await setStatus(booking, 'Cancelled', userId, booking.cancelReason);
  if (role === 'technician' && accepted) {
    await Technician.updateOne({ _id: booking.technician }, { $inc: { 'stats.techCancellations': 1 } });
    await recomputeReliability(booking.technician);
  }
  return booking;
}

module.exports = { NEXT, setStatus, createBooking, respond, advance, cancel };
