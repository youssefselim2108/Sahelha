// Reliability score (FR-REL) and match score (FR-MAT). Pure functions + one query, so they are easy to test.
const { Technician, Booking, Settings } = require('../../models');
const C = require('../../config');

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ACTIVE = ['Confirmed', 'Assigned', 'OnTheWay', 'Arrived', 'ServiceStarted'];

async function getSettings() {
  const s = await Settings.findById('global').lean();
  return {
    reliabilityWeights: s?.reliabilityWeights || C.DEFAULT_RELIABILITY_WEIGHTS,
    matchWeights: s?.matchWeights || C.DEFAULT_MATCH_WEIGHTS,
  };
}

// FR-REL-01: five inputs, each normalised to 0–100
function reliabilityInputs(s) {
  const done = s.completedJobs;
  return {
    onTime: s.arrivalsMeasured ? (100 * s.onTimeArrivals) / s.arrivalsMeasured : 100,
    fewCancellations: s.acceptedJobs ? 100 * (1 - s.techCancellations / s.acceptedJobs) : 100,
    rating: s.ratingCount ? (100 * s.ratingSum) / s.ratingCount / 5 : 0,
    completedJobs: 100 * clamp01(done / 50), // 50+ jobs = full marks
    repeatCustomers: done ? (100 * s.repeatCustomers) / done : 0,
  };
}

// R = Σ wᵢ·sᵢ (thesis eq. 4.1). Fewer than 5 completed jobs → null ("New", FR-REL-06)
function reliabilityScore(stats, weights = C.DEFAULT_RELIABILITY_WEIGHTS) {
  if (stats.completedJobs < C.MIN_JOBS_FOR_SCORE) return null;
  const inputs = reliabilityInputs(stats);
  return Math.round(Object.keys(weights).reduce((sum, k) => sum + weights[k] * inputs[k], 0));
}

// FR-REL-03: rerun after a completion, cancellation or review
async function recomputeReliability(technicianId) {
  const t = await Technician.findById(technicianId);
  const { reliabilityWeights } = await getSettings();
  t.reliability = reliabilityScore(t.stats, reliabilityWeights);
  return t.save();
}

function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// FR-MAT-02: weighted match score, 0–100. `ctx` carries the platform averages and the fee range of this list.
function matchScore(c, w, ctx) {
  const rel = (c.reliability ?? ctx.avgReliability) / 100;
  const rating = c.stats.ratingCount ? c.stats.ratingSum / c.stats.ratingCount / 5 : ctx.avgRating / 5;
  const distance = 1 - clamp01(c.distanceKm / C.MAX_RADIUS_KM);
  const price = ctx.maxFee === ctx.minFee ? 1 : 1 - (c.diagnosticFee - ctx.minFee) / (ctx.maxFee - ctx.minFee);
  const experience = clamp01(c.years / 15);
  return Math.round(100 * (w.reliability * rel + w.rating * rating + w.distance * distance + w.price * price + w.experience * experience));
}

const SORTS = {
  best: (a, b) => b.matchScore - a.matchScore,
  nearest: (a, b) => a.distanceKm - b.distanceKm,
  cheapest: (a, b) => a.diagnosticFee - b.diagnosticFee,
  rating: (a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0),
};

// FR-MAT-01: Verified + online + right trade + covers the location + free at the slot (BR-07, BR-08)
async function findCandidates(request, sort = 'best') {
  const slotEnd = new Date(request.slotStart.getTime() + C.SLOT_HOURS * 3600e3);
  const busy = await Booking.distinct('technician', {
    status: { $in: ACTIVE }, slotStart: { $lt: slotEnd }, slotEnd: { $gt: request.slotStart },
  });
  const pool = await Technician.find({ status: 'Verified', online: true, trades: request.category, _id: { $nin: busy } })
    .populate('user', 'name').lean();

  const near = pool
    .map((t) => ({ ...t, distanceKm: distanceKm(request.location, t.base) }))
    .filter((t) => t.distanceKm <= Math.min(t.radiusKm, C.MAX_RADIUS_KM));
  if (!near.length) return [];

  // shortcut: platform averages are computed over this candidate list, not the whole platform; fine at prototype scale.
  const scored = near.filter((t) => t.reliability != null);
  const rated = near.filter((t) => t.stats.ratingCount);
  const fees = near.map((t) => t.diagnosticFee);
  const ctx = {
    avgReliability: scored.length ? scored.reduce((s, t) => s + t.reliability, 0) / scored.length : 70,
    avgRating: rated.length ? rated.reduce((s, t) => s + t.stats.ratingSum / t.stats.ratingCount, 0) / rated.length : 4,
    minFee: Math.min(...fees),
    maxFee: Math.max(...fees),
  };
  const { matchWeights } = await getSettings();

  return near
    .map((t) => ({
      id: t._id,
      name: t.user?.name,
      trades: t.trades,
      years: t.years,
      diagnosticFee: t.diagnosticFee,
      distanceKm: Math.round(t.distanceKm * 10) / 10,
      completedJobs: t.stats.completedJobs,
      avgRating: t.stats.ratingCount ? Math.round((t.stats.ratingSum / t.stats.ratingCount) * 10) / 10 : null,
      ratingCount: t.stats.ratingCount,
      reliability: t.reliability, // null → shown as "New"
      reliabilityInputs: reliabilityInputs(t.stats), // FR-MAT-04: on-time, cancellation, repeat figures
      matchScore: matchScore(t, matchWeights, ctx),
    }))
    .sort(SORTS[sort] || SORTS.best)
    .slice(0, C.MAX_CANDIDATES);
}

module.exports = { reliabilityInputs, reliabilityScore, recomputeReliability, matchScore, distanceKm, findCandidates, getSettings, ACTIVE };
