# Sahelha

Smart home services & maintenance platform for Egypt. Graduation Project, ESLSCA University.

| Folder | What | Status |
| --- | --- | --- |
| `/` (root) | Clickable prototype of the customer, technician and admin apps (mock data) | UI mocked |
| `backend/` | Node.js + Express REST API on MongoDB | Foundation working (see below) |
| `classifier/` | Python AI-assisted request classifier (D12) | Trained & evaluated |

## Clickable prototype

Open `index.html` in a browser.

| Role | Mobile number | Code |
| --- | --- | --- |
| Customer (Nour Hassan) | `01001234567` | `4829` |
| Technician (Ahmed Salah) | `01112345678` | `4829` |

## Backend

```bash
cd backend
npm install
npm test        # 14 tests: auth, matching, booking state machine, quotations, admin
npm start       # http://localhost:4000/api
```

Without `MONGO_URI` set, `npm start` runs an in-memory MongoDB seeded with demo data
(password for all demo accounts: `sahelha123`; admin phone `01000000000`).
Set `MONGO_URI` and `JWT_SECRET` for a real deployment.

What works now:

| Deliverable | Endpoints | Rules enforced |
| --- | --- | --- |
| D04 Authentication | `POST /api/auth/register/customer`, `/register/technician`, `/login`, `GET /me` | JWT (24 h), bcrypt hashes, one role per account, no public admin sign-up |
| D05 Booking | `POST /api/bookings`, `/:id/accept`, `/decline`, `/status`, `/cancel` | BR-01 legal moves only, BR-05 no cancel after start, BR-07 no double booking, BR-08 verified only, 30-min accept window, append-only status events |
| D07 Matching + reliability score | `GET /api/requests/:id/matches?sort=best\|nearest\|cheapest\|rating` | Weighted reliability (30/20/20/15/15) and match score (30/20/20/15/15), "New" below 5 jobs, ≤ 10 results |
| D09 Quotations | `POST /api/bookings/:id/quotation`, `/decision`, `/extra`, `/extra/:item/decision` | BR-02 no start without approved quote, BR-03 extras count only once approved, BR-04 decided items locked, server-side totals |
| D12 AI suggestion | `POST /api/requests/suggest`, `POST /api/requests` | Suggestion stored apart from the confirmed category; 3 s timeout falls back to manual |
| D03 Admin (API) | `GET /api/admin/technicians`, `POST /:id/verify`, `GET/PUT /api/admin/settings/weights` | Weights must sum to 1, every change logged |

Not built yet: notifications, reviews, service history/invoices, chat, complaints, Google Maps
(distance is straight-line haversine for now), and wiring the prototype UI to the API.

## Classifier

```bash
cd classifier
pip install scikit-learn pandas joblib matplotlib
python train.py   # compares 4 models, writes results/metrics.json + confusion_matrix.png, saves model.joblib
python serve.py   # http://127.0.0.1:5001/classify  (the backend calls this)
```

Data: 200 team-written requests (20 per category, half Egyptian Arabic, half English) in
`data/requests.csv`. This is a small seed set, not real user data, so the scores below are a baseline.

| Model (TF-IDF char 2–5 n-grams) | Accuracy | Macro P | Macro R | Macro F1 | 5-fold CV F1 |
| --- | --- | --- | --- | --- | --- |
| Majority baseline | 0.10 | 0.01 | 0.10 | 0.02 | 0.02 |
| Multinomial Naive Bayes | 0.42 | 0.39 | 0.42 | 0.40 | 0.42 ± 0.11 |
| Logistic Regression | 0.48 | 0.47 | 0.48 | 0.46 | 0.52 ± 0.09 |
| **Linear SVM (selected)** | 0.48 | 0.46 | 0.48 | 0.46 | **0.53 ± 0.08** |

Hold-out test set: 50 requests (5 per class). Model chosen by cross-validated macro F1.
