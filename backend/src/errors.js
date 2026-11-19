class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Express 4 does not catch rejected promises, so every async handler goes through this.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError' || err.name === 'CastError') err = new HttpError(400, err.message);
  if (err.code === 11000) err = new HttpError(409, 'Phone number or email already registered'); // FR-AUTH-03
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
}

module.exports = { HttpError, wrap, errorHandler };
