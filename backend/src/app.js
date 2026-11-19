const express = require('express');
const { errorHandler } = require('./errors');

const app = express();
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./auth/routes').router);
app.use('/api/requests', require('./modules/requests/routes'));
app.use('/api/bookings/:id/quotation', require('./modules/quotations/routes'));
app.use('/api/bookings', require('./modules/bookings/routes').router);
app.use('/api/admin', require('./modules/admin/routes'));
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

module.exports = app;
