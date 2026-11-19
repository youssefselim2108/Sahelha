// Demo data (C3 / A12: mock technicians, prices and scores). Same people as the clickable prototype.
const { Technician } = require('./models');
const { createUser } = require('./auth/routes');
const { reliabilityScore } = require('./modules/matching/service');

const PASSWORD = 'sahelha123';
const MAADI = { lat: 29.9602, lng: 31.2569 };

// jobs, rating, on-time %, cancel %, repeat % — as shown in the prototype
const TECHS = [
  { name: 'Ahmed Salah', phone: '01112345678', trades: ['ac'], years: 9, fee: 180, jobs: 412, rating: 4.8, ontime: 96, cancel: 2, repeat: 41, off: [0.012, 0.015] },
  { name: 'Mostafa Hassan', phone: '01112345679', trades: ['ac'], years: 6, fee: 150, jobs: 238, rating: 4.6, ontime: 91, cancel: 4, repeat: 33, off: [0.010, -0.012] },
  { name: 'Karim Adel', phone: '01112345680', trades: ['ac', 'appliances'], years: 12, fee: 250, jobs: 689, rating: 4.9, ontime: 97, cancel: 1, repeat: 52, off: [-0.030, 0.028] },
  { name: 'Youssef Nabil', phone: '01112345681', trades: ['ac'], years: 2, fee: 100, jobs: 3, rating: 5.0, ontime: 100, cancel: 0, repeat: 0, off: [0.008, 0.009] },
  { name: 'Hany Fawzy', phone: '01112345682', trades: ['plumbing'], years: 8, fee: 150, jobs: 301, rating: 4.7, ontime: 93, cancel: 3, repeat: 38, off: [0.005, 0.02] },
  { name: 'Sameh Ali', phone: '01112345683', trades: ['electrical'], years: 5, fee: 120, jobs: 140, rating: 4.4, ontime: 85, cancel: 6, repeat: 22, off: [-0.01, -0.01] },
];

function toStats(t) {
  const accepted = Math.round(t.jobs / (1 - t.cancel / 100));
  const ratingCount = Math.round(t.jobs * 0.8);
  return {
    acceptedJobs: accepted,
    completedJobs: t.jobs,
    techCancellations: accepted - t.jobs,
    arrivalsMeasured: t.jobs,
    onTimeArrivals: Math.round((t.jobs * t.ontime) / 100),
    ratingSum: Math.round(t.rating * ratingCount),
    ratingCount,
    repeatCustomers: Math.round((t.jobs * t.repeat) / 100),
  };
}

async function seed() {
  await createUser({ name: 'Sahelha Admin', phone: '01000000000', email: 'admin@sahelha.test', password: PASSWORD }, 'admin');
  await createUser({ name: 'Nour Hassan', phone: '01001234567', password: PASSWORD }, 'customer');
  for (const t of TECHS) {
    const u = await createUser({ name: t.name, phone: t.phone, password: PASSWORD }, 'technician');
    const stats = toStats(t);
    await Technician.create({
      user: u._id, trades: t.trades, years: t.years, diagnosticFee: t.fee, radiusKm: 15, status: 'Verified',
      base: { lat: MAADI.lat + t.off[0], lng: MAADI.lng + t.off[1] }, stats, reliability: reliabilityScore(stats),
    });
  }
  console.log(`Seeded admin, 1 customer and ${TECHS.length} technicians (password: ${PASSWORD})`);
}

module.exports = seed;
module.exports.PASSWORD = PASSWORD;
module.exports.MAADI = MAADI;
