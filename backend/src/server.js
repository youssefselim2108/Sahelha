const mongoose = require('mongoose');
const app = require('./app');
const C = require('./config');
const seed = require('./seed');

(async () => {
  let uri = C.MONGO_URI;
  if (!uri) {
    // No MongoDB configured: start a throwaway in-memory one with demo data
    const { MongoMemoryServer } = require('mongodb-memory-server');
    uri = (await MongoMemoryServer.create()).getUri();
    console.log('MONGO_URI not set: using an in-memory MongoDB (data is lost on exit)');
  }
  await mongoose.connect(uri);
  if (!(await mongoose.model('User').exists({}))) await seed();
  app.listen(C.PORT, () => console.log(`Sahelha API on http://localhost:${C.PORT}/api`));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
