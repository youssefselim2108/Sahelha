/* The shared booking. The customer app and the technician app both call these functions,
   so a change made in one phone is what the other phone shows next. */
(function (SH) {
  var D = SH.data;
  var J = (SH.jobs = {});

  var STEP = { requested: 0, accepted: 1, enroute: 2, arrived: 3, started: 4, completed: 5, paid: 5 };
  J.STEPS = ['Booking confirmed', 'Technician assigned', 'On the way', 'Arrived', 'Service started', 'Completed'];
  J.step = function (j) { return STEP[j.status] || 0; };
  J.latest = function (j) { return j.quotes.length ? j.quotes[j.quotes.length - 1] : null; };
  J.tech = function (j) { return SH.tech(j.techId); };
  J.canCancel = function (j) { return j.status === 'requested' || j.status === 'accepted' || j.status === 'enroute'; };
  J.chatOpen = function (j) { return ['accepted', 'enroute', 'arrived', 'started'].indexOf(j.status) >= 0; };
  J.title = function (j) { return 'AC repair: ' + D.ISSUES[j.issueKey].short; };

  J.forCustomer = function () {
    var a = SH.acct('customer'), j = SH.S.job;
    return a && j && j.uid === a.id && !j.hideC ? j : null;
  };
  J.forProvider = function () {
    var t = SH.myTech(), j = SH.S.job;
    return t && j && j.techId === t.id && !j.hideP ? j : null;
  };

  J.say = function (j, from, text) {
    text = String(text || '').trim();
    if (text) j.msgs.push({ from: from, text: text });
  };

  /* ---- customer creates the booking ---- */
  J.create = function () {
    var S = SH.S, U = SH.U('customer'), r = U.req, a = SH.acct('customer');
    var slot = D.slotsFor(S.now)[r.slot];
    var key = D.classify(r.descr), iss = D.ISSUES[key];
    S.n.job += 1;
    S.job = {
      id: 'J' + S.n.job, uid: a.id, customerName: a.name, area: a.area, techId: r.techId,
      descr: r.descr.trim(), issueKey: key, issue: iss.issue, range: iss.range,
      media: { photo: r.media.photo, video: r.media.video }, slot: slot,
      status: 'requested', quotes: [], msgs: [], before: false, after: false,
      hideC: false, hideP: false, total: 0, cancelledBy: null, reviewed: false
    };
    return S.job;
  };

  /* ---- technician side ---- */
  J.accept = function (j) {
    if (j.status !== 'requested') return false;
    j.status = 'accepted';
    J.say(j, 'p', 'Salam! I accepted your job. I will message you before I leave.');
    SH.mark('c_accept');
    return true;
  };
  J.decline = function (j) {
    if (j.status !== 'requested') return false;
    j.status = 'declined'; j.hideP = true;
    return true;
  };
  J.drive = function (j) { if (j.status !== 'accepted') return false; j.status = 'enroute'; return true; };
  J.arrive = function (j) { if (j.status !== 'enroute') return false; j.status = 'arrived'; return true; };
  J.shootBefore = function (j) { if (j.status !== 'arrived') return false; j.before = true; return true; };
  J.start = function (j) { if (j.status !== 'arrived' || !j.before) return false; j.status = 'started'; return true; };

  /* Starting values for the quotation composer */
  J.defaults = function (j) {
    var q = J.latest(j);
    if (!q) return { parts: 60, labor: 60, extra: 0 };
    if (q.status === 'rejected') return { parts: Math.max(0, q.parts - 20), labor: q.labor, extra: q.extra };
    return { parts: q.parts + 160, labor: q.labor, extra: q.extra + 40 };
  };
  J.canQuote = function (j) {
    var q = J.latest(j);
    return j.status === 'started' && (!q || q.status !== 'pending');
  };
  J.sendQuote = function (j, v) {
    if (!J.canQuote(j)) return null;
    var q = { ver: j.quotes.length + 1, diag: J.tech(j).diag, parts: v.parts, labor: v.labor, extra: v.extra, status: 'pending' };
    j.quotes.push(q);
    return q;
  };
  J.decide = function (j, approve) {
    var q = J.latest(j);
    if (!q || q.status !== 'pending') return false;
    q.status = approve ? 'approved' : 'rejected';
    if (approve) SH.mark('c_quote');
    return true;
  };
  J.canFinish = function (j) {
    var q = J.latest(j);
    return j.status === 'started' && !!q && q.status === 'approved';
  };
  J.shootAfter = function (j) { if (!J.canFinish(j)) return false; j.after = true; return true; };
  J.complete = function (j) {
    if (!J.canFinish(j) || !j.after) return false;
    j.status = 'completed'; j.total = D.qTotal(J.latest(j));
    return true;
  };

  /* ---- customer side ---- */
  J.cancel = function (j, by) {
    if (!J.canCancel(j)) return false;
    j.status = 'cancelled'; j.cancelledBy = by; j.hideC = true;
    return true;
  };

  J.pay = function (j, method) {
    if (j.status !== 'completed') return false;
    var S = SH.S, t = J.tech(j), now = S.now;
    S.n.inv += 1; S.n.hist += 1;
    j.status = 'paid'; j.payMethod = method;
    j.invNo = 'SH-' + SH.pad(now.getFullYear() % 100) + SH.pad(now.getMonth() + 1) + '-' + SH.pad(417 + S.n.inv, 4);
    j.paidDate = SH.fmtDate(now); j.until = SH.fmtDate(SH.addDays(now, 30));
    t.jobs += 1;
    S.earnings.unshift({ techId: t.id, date: j.paidDate, title: J.title(j), customer: SH.shortName(j.customerName), amount: j.total, fresh: true });
    S.hist.unshift({
      id: 'hn' + S.n.hist, uid: j.uid, ts: now.getTime(), title: J.title(j), date: j.paidDate, tech: t.name,
      cost: SH.egp(j.total), warranty: '30-day warranty until ' + j.until, active: true, photos: true, cat: 'ac', jobId: j.id
    });
    SH.mark('c_pay');
    return true;
  };

  J.review = function (j, stars, tags, comment) {
    if (j.status !== 'paid' || j.reviewed) return false;
    var t = J.tech(j);
    j.reviewed = true; j.stars = stars; j.tags = tags; j.comment = comment; j.hideC = true;
    t.rating = t.rating == null ? stars : Math.round(((t.rating * (t.jobs - 1) + stars) / t.jobs) * 10) / 10;
    var h = SH.find(SH.S.hist, function (x) { return x.jobId === j.id; });
    if (h) h.review = stars;
    SH.mark('c_rate');
    return true;
  };

  /* ---- "Prototype control": play the technician's next step from the customer phone ---- */
  J.sim = function (j, what) {
    switch (j.status) {
      case 'requested': return J.accept(j);
      case 'accepted': return J.drive(j);
      case 'enroute': return J.arrive(j);
      case 'arrived': J.shootBefore(j); return J.start(j);
      case 'started':
        if (what === 'finish') { if (!J.canFinish(j)) return false; J.shootAfter(j); return J.complete(j); }
        return !!J.sendQuote(j, J.defaults(j));
    }
    return false;
  };
})((window.SH = window.SH || {}));
