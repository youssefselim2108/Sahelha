const router = require('express').Router();
const { Request } = require('../../models');
const { requireAuth, requireRole } = require('../../auth/middleware');
const { HttpError, wrap } = require('../../errors');
const { findCandidates } = require('../matching/service');
const C = require('../../config');

const NOTE = 'Suggestion only, not a diagnosis. Please confirm or change the category.';

// FR-AI-01/03: ask the Python classifier; on timeout, error or no answer the form just carries on manually
async function suggestCategory(description) {
  try {
    const r = await fetch(C.CLASSIFIER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: description }),
      signal: AbortSignal.timeout(C.CLASSIFIER_TIMEOUT_MS),
    });
    if (!r.ok) return null;
    const { category, confidence } = await r.json();
    return C.CATEGORIES.includes(category) ? { category, confidence: confidence ?? null } : null;
  } catch {
    return null;
  }
}

router.use(requireAuth);

router.post('/suggest', requireRole('customer'), wrap(async (req, res) => {
  const text = String(req.body.description || '').trim();
  if (text.length < 5) throw new HttpError(400, 'Describe the problem in at least 5 characters');
  const s = await suggestCategory(text);
  res.json(s ? { ...s, note: NOTE } : { category: null, note: 'No suggestion available. Please pick a category.' });
}));

// FR-REQ + FR-AI-02/04: the customer-confirmed category is the one used; the suggestion is stored apart
router.post('/', requireRole('customer'), wrap(async (req, res) => {
  const { description, category, suggestedCategory, location, slotStart, photos = [] } = req.body;
  const start = new Date(slotStart);
  if (isNaN(start) || start <= new Date()) throw new HttpError(400, 'slotStart must be a future date-time');
  const r = await Request.create({ customer: req.user.id, description, category, suggestedCategory, location, slotStart: start, photos });
  res.status(201).json(r);
}));

async function ownRequest(req) {
  const r = await Request.findById(req.params.id);
  if (!r || (String(r.customer) !== req.user.id && req.user.role !== 'admin')) throw new HttpError(404, 'Request not found');
  return r;
}

router.get('/:id', wrap(async (req, res) => res.json(await ownRequest(req))));

// FR-MAT-01..07: ranked candidates, optional ?sort=nearest|cheapest|rating
router.get('/:id/matches', requireRole('customer'), wrap(async (req, res) => {
  const r = await ownRequest(req);
  const candidates = await findCandidates(r, req.query.sort);
  res.json({ candidates, message: candidates.length ? undefined : 'No technician is free for this slot. Try another time.' });
}));

module.exports = router;
