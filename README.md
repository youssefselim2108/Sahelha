# Sahelha frontend prototype

A clickable prototype of the Sahelha home-services marketplace (graduation project). One page, two phones:
a **customer app** and a **technician app** that share the same booking, so whatever you do in one view
shows up in the other.

No build step, no npm, no backend. All data is made up and lives in the browser tab.

## Run it in VS Code

1. Open this folder in VS Code (File > Open Folder).
2. Install the **Live Server** extension, right-click `index.html`, choose **Open with Live Server**.
   Double-clicking `index.html` in your file explorer works too.

The fonts load from Google Fonts. Offline, the page falls back to system fonts.

## Demo accounts

| Role | Mobile number | Code |
| --- | --- | --- |
| Customer (Nour Hassan) | `01001234567` | `4829` |
| Technician (Ahmed Salah) | `01112345678` | `4829` |

Both are already filled in on the sign-in screens. Any new account uses the same code, `4829`.

## Try this

1. **Customer view:** sign in, describe the AC problem, read the AI recommendation, compare technicians,
   open Ahmed's profile, pick a time and confirm.
2. Switch to **Technician view** (top of the page), sign in, open the request and accept it.
   Drive over, arrive, take before photos, start the service and send a quotation.
3. Back in **Customer view**, review the quotation. Reject it once and see the technician revise it.
   Approve it. The technician can then send extra work as a new version, which you approve again.
4. Technician: take after photos and complete the job. Customer: review the work, approve the cost, pay,
   rate, then open History. Technician: open Earnings.
5. **Create account** in either view. Technician sign-up asks for a trade, areas and two ID photos, then
   waits for approval. Use **Simulate admin approval** to play the admin. The new technician then appears
   in the customer's list as "New".

The checklist on the left ticks itself as you go. **Restart demo** resets everything.

## What is real and what is simulated

| Real (logic runs) | Simulated |
| --- | --- |
| Reliability score and match score, using the formulas from the proposal | One-time code (always `4829`) |
| Booking states, cancellation rules, versioned quotations with an approval gate | AI recommendation (keyword matching) |
| Before/after photos required to start and finish a job | Photos (illustrations), payment, map, admin approval |
| New technicians are labelled "New" until 5 jobs; ratings update the average | The other technicians' replies in chat |

The **Prototype control** boxes (dashed, amber) play the technician from the customer phone, so the customer
side can be demoed alone, and a technician without a demo login (everyone except Ahmed and accounts you create)
can still be booked.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page shell and script order |
| `css/page.css` | Color tokens (white page, grey screens, deep teal `#35746E`, navy ink, cream warnings), fonts, the page around the phone |
| `css/app.css` | Everything inside the phone |
| `js/data.js` | Sample data, slots, the AI stand-in, reliability and match formulas |
| `js/store.js` | App state, per-role sessions, helpers |
| `js/jobs.js` | The shared booking: every state change in one place |
| `js/auth.js` | Sign in, sign up, one-time code, technician approval |
| `js/customer.js` | Customer screens and actions |
| `js/provider.js` | Technician screens and actions |
| `js/page.js` | Top bar, checklist, phone frame, render loop |
| `js/main.js` | Click, input and Enter-key handling |
| `js/ui.js`, `js/icons.js` | Small HTML helpers and icons |
| `js/morphdom.min.js` | DOM diffing library (MIT) so typing and scroll positions survive re-renders |

## How it works

Each screen is a function that returns an HTML string. Buttons carry `data-act="actionName"` (and an optional
`data-arg`). `main.js` finds the function with that name in `SH.act`, runs it to change state, and re-renders
the page. To add a screen, add a function to `SH.screens.customer` (or `.provider`) and an action that
calls `SH.go('screenName')`.
