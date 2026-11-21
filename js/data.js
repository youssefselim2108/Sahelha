/* Sample data and the two formulas from the proposal (reliability score, match score).
   Everything here is fake and lives in memory only. */
(function (SH) {
  var D = (SH.data = {});
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /* ---------- dates ---------- */
  SH.fmtDate = function (d) { return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
  SH.fmtDay = function (d) { return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; };
  SH.fmtTime = function (d) {
    var h = d.getHours(), m = ('0' + d.getMinutes()).slice(-2), ap = h >= 12 ? 'PM' : 'AM';
    return (h % 12 || 12) + ':' + m + ' ' + ap;
  };
  SH.addDays = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  SH.addMonths = function (d, n) { var x = new Date(d); x.setMonth(x.getMonth() + n); return x; };

  /* Three appointment slots, always in the future */
  D.slotsFor = function (now) {
    var early = now.getHours() < 15;
    var plan = early ? [[0, '6:00 PM'], [1, '10:00 AM'], [1, '2:00 PM']] : [[1, '10:00 AM'], [1, '2:00 PM'], [2, '10:00 AM']];
    return plan.map(function (p) {
      var date = SH.addDays(now, p[0]);
      var word = p[0] === 0 ? 'Today' : p[0] === 1 ? 'Tomorrow' : DAYS[date.getDay()];
      return { label: word + ', ' + p[1], sub: SH.fmtDay(date), date: SH.fmtDate(date), until: SH.fmtDate(SH.addDays(date, 30)) };
    });
  };

  /* ---------- lists ---------- */
  D.AVATARS = ['#35746E', '#7B3FE4', '#B5481F', '#2F5FA8', '#8C3F6E', '#4A7A2F'];
  D.TRADES = [
    { id: 'ac', label: 'Air conditioning', short: 'AC', icon: 'snow' },
    { id: 'plumbing', label: 'Plumbing', short: 'Plumbing', icon: 'drop' },
    { id: 'electrical', label: 'Electrical', short: 'Electrical', icon: 'bolt' },
    { id: 'appliances', label: 'Appliances', short: 'Appliances', icon: 'washer' },
    { id: 'carpentry', label: 'Carpentry', short: 'Carpentry', icon: 'hammer' },
    { id: 'painting', label: 'Painting', short: 'Painting', icon: 'roller' },
    { id: 'cleaning', label: 'Cleaning', short: 'Cleaning', icon: 'sparkle' },
    { id: 'pest', label: 'Pest control', short: 'Pest control', icon: 'bug' },
    { id: 'moving', label: 'Moving', short: 'Moving', icon: 'truck' },
    { id: 'general', label: 'General maintenance', short: 'General', icon: 'wrench' }
  ];
  D.tradeLabel = function (id) {
    for (var i = 0; i < D.TRADES.length; i++) if (D.TRADES[i].id === id) return D.TRADES[i].label;
    return id;
  };
  D.AREAS = ['Maadi', 'Nasr City', 'New Cairo', 'Sheikh Zayed', 'Heliopolis', 'Dokki'];

  /* ---------- AI stand-in: keyword classifier + sample pricing ---------- */
  D.PROBLEMS = [
    { key: 'cooling', label: 'Not cooling', text: "My AC is running but isn't cooling." },
    { key: 'leaking', label: 'Leaking water', text: 'Water is leaking from my AC indoor unit.' },
    { key: 'noise', label: 'Strange noise', text: 'My AC is making a loud rattling noise.' },
    { key: 'noturn', label: "Won't turn on", text: "My AC won't turn on." }
  ];
  D.ISSUES = {
    cooling: { issue: 'Cooling, refrigerant or airflow problem', range: '400–900 EGP', conf: 'High confidence' },
    leaking: { issue: 'Blocked condensate drain or cracked drain pan', range: '250–600 EGP', conf: 'High confidence' },
    noise: { issue: 'Loose fan blade, worn bearing or debris in the unit', range: '300–800 EGP', conf: 'Medium confidence' },
    noturn: { issue: 'Power supply, capacitor or control board fault', range: '350–1,000 EGP', conf: 'Medium confidence' },
    maint: { issue: 'Routine service: filters, coils and gas pressure check', range: '300–500 EGP', conf: 'High confidence' }
  };
  var SHORT = { cooling: 'cooling problem', leaking: 'water leak', noise: 'unusual noise', noturn: "won't turn on", maint: 'routine service' };
  Object.keys(SHORT).forEach(function (k) { D.ISSUES[k].short = SHORT[k]; });
  D.classify = function (text) {
    var t = String(text || '').toLowerCase();
    if (/leak|water|drip/.test(t)) return 'leaking';
    if (/noise|loud|rattl|sound|buzz/.test(t)) return 'noise';
    if (/turn on|start|power|dead/.test(t)) return 'noturn';
    if (/mainten|service|clean|due/.test(t)) return 'maint';
    return 'cooling';
  };

  D.PAYMENTS = [
    { id: 'card', title: 'Card', sub: 'Visa or Mastercard, on the gateway page' },
    { id: 'fawry', title: 'Fawry', sub: 'Pay with a code at a Fawry outlet or app' },
    { id: 'wallet', title: 'Mobile wallet', sub: 'Approve the payment in your wallet app' }
  ];

  /* ---------- people ---------- */
  D.techs = function () {
    return [
      { id: 'ahmed', accId: 'p1', name: 'Ahmed Salah', first: 'Ahmed', initials: 'AS', av: '#35746E', trade: 'ac', years: 9, jobs: 412, rating: 4.8, ontime: 96, cancel: 2, repeat: 41, dist: 2.1, diag: 180, avail: 1.0, verified: true, areas: ['Maadi', 'New Cairo', 'Nasr City'], work: ['Split AC: drain repair', 'Inverter AC: gas refill', 'Central AC: duct cleaning'] },
      { id: 'mostafa', accId: null, name: 'Mostafa Hassan', first: 'Mostafa', initials: 'MH', av: '#B5481F', trade: 'ac', years: 6, jobs: 238, rating: 4.6, ontime: 91, cancel: 4, repeat: 33, dist: 1.8, diag: 150, avail: 0.8, verified: true, areas: ['Maadi', 'Heliopolis', 'Nasr City'], work: ['Split AC: installation', 'Window AC: coil cleaning', 'Split AC: gas refill'] },
      { id: 'karim', accId: null, name: 'Karim Adel', first: 'Karim', initials: 'KA', av: '#7B3FE4', trade: 'ac', years: 12, jobs: 689, rating: 4.9, ontime: 97, cancel: 1, repeat: 52, dist: 4.6, diag: 250, avail: 0.7, verified: true, areas: ['Maadi', 'Dokki', 'Sheikh Zayed', 'New Cairo'], work: ['Central AC: full overhaul', 'Inverter AC: board repair', 'Split AC: leak repair'] },
      { id: 'youssef', accId: null, name: 'Youssef Nabil', first: 'Youssef', initials: 'YN', av: '#2F5FA8', trade: 'ac', years: 2, jobs: 3, rating: 5.0, ontime: 100, cancel: 0, repeat: 0, dist: 1.4, diag: 100, avail: 0.7, verified: true, areas: ['Maadi'], work: ['Split AC: filter service', 'Window AC: cleaning', 'Split AC: drain clearing'] }
    ];
  };

  D.accounts = function () {
    return [
      { id: 'c1', role: 'customer', name: 'Nour Hassan', phone: '01001234567', area: 'Maadi' },
      { id: 'p1', role: 'provider', name: 'Ahmed Salah', phone: '01112345678', trade: 'ac', years: 9, areas: ['Maadi', 'New Cairo', 'Nasr City'], status: 'verified', techId: 'ahmed' }
    ];
  };

  /* A technician record for a newly approved account */
  D.newTech = function (acc, n) {
    return {
      id: 't' + n, accId: acc.id, name: acc.name, first: SH.first(acc.name), initials: SH.initials(acc.name),
      av: D.AVATARS[n % D.AVATARS.length], trade: acc.trade, years: acc.years, jobs: 0, rating: null, ontime: null,
      cancel: 0, repeat: 0, dist: 1.2 + (n % 4) * 0.5, diag: 150, avail: 0.9, verified: true, areas: acc.areas.slice(), work: []
    };
  };

  /* ---------- the proposal's formulas ---------- */
  /* Reliability (0-100): 30% on-time, 25% rating, 20% kept bookings, 15% repeat customers, 10% jobs done.
     Technicians with fewer than 5 jobs have no score yet ("New"). */
  D.reliability = function (t) {
    if (t.jobs < 5 || t.rating == null || t.ontime == null) return null;
    return Math.round(100 * (0.30 * t.ontime / 100 + 0.25 * t.rating / 5 + 0.20 * (1 - t.cancel / 100) +
      0.15 * t.repeat / 100 + 0.10 * Math.min(t.jobs / 50, 1)));
  };
  /* Match score: 35% reliability, 25% proximity, 20% price fit, 20% availability.
     "New" technicians use a neutral reliability of 70 so they are not buried. */
  D.matchScore = function (t) {
    var rel = D.reliability(t);
    var r = (rel == null ? 70 : rel) / 100;
    var prox = Math.max(0, 1 - t.dist / 6);
    var price = Math.min(1, Math.max(0.3, 1 - (t.diag - 100) / 300));
    return Math.round(100 * (0.35 * r + 0.25 * prox + 0.20 * price + 0.20 * t.avail));
  };

  D.ranked = function (techs, sort) {
    var rows = techs.filter(function (t) { return t.trade === 'ac' && t.verified; }).map(function (t) {
      return { t: t, rel: D.reliability(t), match: D.matchScore(t) };
    });
    var by = {
      best: function (a, b) { return b.match - a.match; },
      close: function (a, b) { return a.t.dist - b.t.dist; },
      /* technicians without a reliability score yet (fewer than 5 jobs) are listed after rated ones */
      rated: function (a, b) { return (b.rel == null ? -1 : b.t.rating) - (a.rel == null ? -1 : a.t.rating); },
      price: function (a, b) { return a.t.diag - b.t.diag; }
    };
    return rows.sort(by[sort] || by.best);
  };

  /* ---------- quotations ---------- */
  D.qTotal = function (q) { return q.diag + q.parts + q.labor + q.extra; };

  /* ---------- history and earnings (dates relative to today) ---------- */
  D.history = function (now) {
    return [
      { id: 'h3', title: 'AC maintenance', ts: SH.addMonths(now, -6).getTime(), date: SH.fmtDate(SH.addMonths(now, -6)), tech: 'Tamer Fawzy', cost: '450 EGP', warranty: 'Warranty ended', active: false, photos: true, cat: 'ac' },
      { id: 'h2', title: 'Plumbing: kitchen sink leak', ts: SH.addMonths(now, -8).getTime(), date: SH.fmtDate(SH.addMonths(now, -8)), tech: 'Hossam Ragab', cost: '280 EGP', warranty: 'Warranty ended', active: false, photos: true, cat: 'plumbing' },
      { id: 'h1', title: 'Electrical: outlet replacement', ts: SH.addMonths(now, -11).getTime(), date: SH.fmtDate(SH.addMonths(now, -11)), tech: 'Adel Samy', cost: '220 EGP', warranty: 'Warranty ended', active: false, photos: false, cat: 'electrical' }
    ];
  };
  D.earnings = function (now) {
    return [
      { techId: 'ahmed', date: SH.fmtDate(SH.addDays(now, -2)), title: 'Split AC: gas refill', customer: 'Mona S.', amount: 420 },
      { techId: 'ahmed', date: SH.fmtDate(SH.addDays(now, -5)), title: 'Inverter AC: drain repair', customer: 'Karim A.', amount: 300 },
      { techId: 'ahmed', date: SH.fmtDate(SH.addDays(now, -9)), title: 'Window AC: coil cleaning', customer: 'Heba R.', amount: 250 }
    ];
  };
})((window.SH = window.SH || {}));
