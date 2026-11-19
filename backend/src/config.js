module.exports = {
  PORT: Number(process.env.PORT) || 4000,
  MONGO_URI: process.env.MONGO_URI, // unset → an in-memory MongoDB is started (dev/demo only)
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  JWT_EXPIRES_IN: '24h', // FR-AUTH-04
  CLASSIFIER_URL: process.env.CLASSIFIER_URL || 'http://127.0.0.1:5001/classify',
  CLASSIFIER_TIMEOUT_MS: 3000, // FR-AI-03
  CATEGORIES: ['ac', 'plumbing', 'electrical', 'appliances', 'carpentry', 'painting', 'cleaning', 'pest', 'moving', 'general'],
  SLOT_HOURS: 2, // FR-BOK-05
  ACCEPT_WINDOW_MIN: 30, // FR-BOK-02
  ON_TIME_GRACE_MIN: 15, // FR-REL-05
  MAX_RADIUS_KM: 30, // FR-LOC
  MAX_CANDIDATES: 10, // FR-MAT-06
  MIN_JOBS_FOR_SCORE: 5, // FR-REL-06
  DEFAULT_RELIABILITY_WEIGHTS: { onTime: 0.3, fewCancellations: 0.2, rating: 0.2, completedJobs: 0.15, repeatCustomers: 0.15 }, // FR-REL-02
  DEFAULT_MATCH_WEIGHTS: { reliability: 0.3, rating: 0.2, distance: 0.2, price: 0.15, experience: 0.15 }, // FR-MAT-03
};
