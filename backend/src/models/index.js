const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const { CATEGORIES } = require('../config');

const STATUSES = ['Confirmed', 'Assigned', 'OnTheWay', 'Arrived', 'ServiceStarted', 'Completed', 'Cancelled'];
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name, required: true });
const point = { lat: { type: Number, min: -90, max: 90, required: true }, lng: { type: Number, min: -180, max: 180, required: true } };

const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, match: /^01[0125]\d{8}$/ }, // Egyptian mobile
  email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
  passwordHash: { type: String, required: true, select: false }, // FR-AUTH-05
  role: { type: String, enum: ['customer', 'technician', 'admin'], required: true }, // FR-AUTH-06
}, { timestamps: true }));

const Technician = model('Technician', new Schema({
  user: { ...ref('User'), unique: true },
  trades: { type: [{ type: String, enum: CATEGORIES }], validate: (v) => v.length > 0 },
  years: { type: Number, min: 0, default: 0 },
  base: point,
  radiusKm: { type: Number, min: 1, max: 30, default: 10 },
  diagnosticFee: { type: Number, min: 0, default: 150 },
  status: { type: String, enum: ['Pending', 'Verified', 'Rejected', 'Suspended'], default: 'Pending' }, // FR-AUTH-02
  online: { type: Boolean, default: true },
  stats: {
    acceptedJobs: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    techCancellations: { type: Number, default: 0 },
    arrivalsMeasured: { type: Number, default: 0 },
    onTimeArrivals: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    repeatCustomers: { type: Number, default: 0 },
  },
  reliability: { type: Number, default: null }, // null = "New" (FR-REL-06)
}, { timestamps: true }));

const Request = model('Request', new Schema({
  customer: ref('User'),
  description: { type: String, required: true, trim: true, minlength: 5, maxlength: 1000 },
  photos: { type: [String], validate: (v) => v.length <= 5 }, // FR-REQ: ≤ 5 photos
  suggestedCategory: { type: String, enum: [...CATEGORIES, null], default: null }, // FR-AI-04: stored apart
  category: { type: String, enum: CATEGORIES, required: true }, // confirmed by the customer (BR-10)
  location: { ...point, address: String },
  slotStart: { type: Date, required: true },
}, { timestamps: true }));

const Booking = model('Booking', new Schema({
  request: ref('Request'),
  customer: ref('User'),
  technician: ref('Technician'),
  slotStart: { type: Date, required: true },
  slotEnd: { type: Date, required: true },
  status: { type: String, enum: STATUSES, default: 'Confirmed' },
  acceptBy: Date,
  quoteApproved: { type: Boolean, default: false },
  cancelReason: String,
  cancelledBy: { type: String, enum: ['customer', 'technician', 'system', null], default: null },
}, { timestamps: true }).index({ technician: 1, slotStart: 1 }));

// Append-only audit trail (NFR data integrity)
const StatusEvent = model('StatusEvent', new Schema({
  booking: ref('Booking'),
  from: { type: String, enum: [...STATUSES, null], default: null },
  to: { type: String, enum: STATUSES, required: true },
  by: { type: Schema.Types.ObjectId, ref: 'User' },
  note: String,
  at: { type: Date, default: Date.now },
}));

const itemSchema = new Schema({
  kind: { type: String, enum: ['diagnostic', 'parts', 'labor', 'extra'], required: true },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 }, // FR-QUO-12: positive EGP only
  state: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  decidedAt: Date,
});
const Quotation = model('Quotation', new Schema({
  booking: { ...ref('Booking'), unique: true },
  items: [itemSchema],
  status: { type: String, enum: ['sent', 'approved', 'declined'], default: 'sent' },
  decidedAt: Date,
}, { timestamps: true }));

// One document; weight changes are logged with old/new value, user and time (FR-REL-02)
const Settings = model('Settings', new Schema({
  _id: { type: String, default: 'global' },
  reliabilityWeights: Object,
  matchWeights: Object,
  history: [{ field: String, from: Object, to: Object, by: Schema.Types.ObjectId, at: { type: Date, default: Date.now } }],
}));

module.exports = { User, Technician, Request, Booking, StatusEvent, Quotation, Settings, STATUSES };
