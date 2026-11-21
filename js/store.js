/* App state. Everything lives in memory (SH.S) and is rebuilt by "Restart demo".
   Two phone sessions exist side by side (customer and technician); both read and write the same job. */
(function (SH) {
  var D = SH.data;

  SH.pad = function (n, w) { n = String(n); while (n.length < (w || 2)) n = '0' + n; return n; };

  /* Egyptian mobile numbers: 010, 011, 012, 015 + 8 digits. Accepts +20 / 0020 / 20 prefixes. */
  SH.normPhone = function (raw) {
    var s = String(raw || '').replace(/[\s\-()]/g, '');
    if (s.indexOf('+20') === 0) s = '0' + s.slice(3);
    else if (s.indexOf('0020') === 0) s = '0' + s.slice(4);
    else if (/^20\d{10}$/.test(s)) s = '0' + s.slice(2);
    return /^01[0125]\d{8}$/.test(s) ? s : null;
  };
  SH.fmtPhone = function (p) {
    p = String(p || '');
    return /^01\d{9}$/.test(p) ? '+20 ' + p.slice(1, 4) + ' ' + p.slice(4, 7) + ' ' + p.slice(7) : p;
  };

  SH.OTP = '4829';

  function newUi(role) {
    return {
      uid: null,            /* signed-in account id */
      screen: 'signin',
      tab: 'home',
      err: '',
      flash: null,          /* {kind, text} shown once on the next screen */
      pendingId: null,      /* technician account waiting for admin approval */
      f: {
        phone: role === 'customer' ? '01001234567' : '01112345678',
        code: SH.OTP,
        name: '', sPhone: '', otp: SH.OTP,
        area: 'Maadi', trade: 'ac', years: 3, areas: ['Maadi'], idFront: false, idBack: false
      },
      req: null,            /* customer: the request being built */
      q: null,              /* technician: quotation being composed */
      chatText: '',
      cc: false             /* customer: "really cancel?" prompt open */
    };
  }

  SH.newUi = newUi;

  SH.reset = function () {
    var now = new Date();
    var S = (SH.S = {
      view: 'customer',
      now: now,
      n: { tech: 1, acc: 1, inv: 0, job: 0, hist: 0 },
      accounts: D.accounts(),
      techs: D.techs(),
      job: null,
      hist: D.history(now),
      earnings: D.earnings(now),
      progress: {},
      ui: { customer: newUi('customer'), provider: newUi('provider') }
    });
    S.hist.forEach(function (h) { h.uid = 'c1'; });
    return S;
  };

  SH.U = function (role) { return SH.S.ui[role || SH.S.view]; };
  SH.find = function (arr, fn) { for (var i = 0; i < arr.length; i++) if (fn(arr[i])) return arr[i]; return null; };
  SH.acct = function (role) {
    var U = SH.U(role);
    return U.uid ? SH.find(SH.S.accounts, function (a) { return a.id === U.uid; }) : null;
  };
  SH.tech = function (id) { return SH.find(SH.S.techs, function (t) { return t.id === id; }); };
  SH.myTech = function () {
    var a = SH.acct('provider');
    return a ? SH.find(SH.S.techs, function (t) { return t.accId === a.id; }) : null;
  };

  SH.mark = function (k) { SH.S.progress[k] = true; };

  SH.go = function (screen, role) {
    var U = SH.U(role);
    U.screen = screen; U.err = ''; U.flash = null; U.cc = false;
  };
  SH.flash = function (kind, text, role) { SH.U(role).flash = { kind: kind, text: text }; };

  /* Most recent AC service for a customer (drives the maintenance reminder) */
  SH.lastAc = function (uid) {
    var best = null;
    SH.S.hist.forEach(function (h) { if (h.uid === uid && h.cat === 'ac' && (!best || h.ts > best.ts)) best = h; });
    return best;
  };

  /* Set a value on the current phone session from a data-in path like "req.descr" or "f.name" */
  SH.inHooks = {};
  SH.setIn = function (path, value) {
    var U = SH.U(), parts = path.split('.'), o = U;
    for (var i = 0; i < parts.length - 1; i++) { o = o[parts[i]]; if (!o) return; }
    o[parts[parts.length - 1]] = value;
    if (SH.inHooks[path]) SH.inHooks[path](value);
  };

  SH.act = {};
  SH.screens = { customer: {}, provider: {} };
})((window.SH = window.SH || {}));
