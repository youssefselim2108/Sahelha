const { reliabilityScore, reliabilityInputs, matchScore, distanceKm } = require('../src/modules/matching/service');
const { NEXT } = require('../src/modules/bookings/service');
const C = require('../src/config');

const stats = (o = {}) => ({
  acceptedJobs: 100, completedJobs: 100, techCancellations: 0, arrivalsMeasured: 100, onTimeArrivals: 100,
  ratingSum: 500, ratingCount: 100, repeatCustomers: 100, ...o,
});

test('perfect technician scores 100, weights sum to 1', () => {
  expect(reliabilityScore(stats())).toBe(100);
  const sum = (w) => Object.values(w).reduce((a, b) => a + b, 0);
  expect(sum(C.DEFAULT_RELIABILITY_WEIGHTS)).toBeCloseTo(1);
  expect(sum(C.DEFAULT_MATCH_WEIGHTS)).toBeCloseTo(1);
});

test('fewer than 5 completed jobs → null ("New")', () => {
  expect(reliabilityScore(stats({ completedJobs: 4 }))).toBeNull();
});

test('each input is weighted as in the SRS (30/20/20/15/15)', () => {
  // Only on-time drops to 0 → lose exactly 30 points
  expect(reliabilityScore(stats({ onTimeArrivals: 0 }))).toBe(70);
  // Half the accepted jobs cancelled → lose 10 points
  expect(reliabilityScore(stats({ techCancellations: 50 }))).toBe(90);
  expect(reliabilityInputs(stats({ ratingSum: 400 })).rating).toBe(80);
});

test('match score prefers nearer and cheaper when all else is equal', () => {
  const base = { reliability: 80, stats: stats(), years: 5, diagnosticFee: 150, distanceKm: 2 };
  const ctx = { avgReliability: 70, avgRating: 4, minFee: 100, maxFee: 200 };
  const w = C.DEFAULT_MATCH_WEIGHTS;
  expect(matchScore(base, w, ctx)).toBeGreaterThan(matchScore({ ...base, distanceKm: 20 }, w, ctx));
  expect(matchScore({ ...base, diagnosticFee: 100 }, w, ctx)).toBeGreaterThan(matchScore(base, w, ctx));
});

test('haversine distance Maadi → Tahrir ≈ 9.6 km', () => {
  expect(distanceKm({ lat: 29.9602, lng: 31.2569 }, { lat: 30.0444, lng: 31.2357 })).toBeCloseTo(9.6, 0);
});

test('no cancel after ServiceStarted (BR-05)', () => {
  expect(NEXT.ServiceStarted).not.toContain('Cancelled');
  expect(NEXT.Completed).toEqual([]);
});
