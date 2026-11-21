/* Customer app: home, request, technician match, profile, booking, tracking, chat,
   quotation approval, payment, invoice, review and history. */
(function (SH) {
  var D = SH.data, J = SH.jobs, esc = SH.esc, A = SH.act, SC = SH.screens.customer;
  var MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function U() { return SH.U('customer'); }
  function me() { return SH.acct('customer'); }

  function flashHtml() {
    var f = U().flash;
    return f ? SH.note(f.kind === 'ok' ? 'ok' : 'info', esc(f.text), f.kind === 'ok' ? 'check' : 'bell') : '';
  }

  function tabs(active) {
    return SH.tabbar([
      { id: 'home', label: 'Home', icon: 'home', act: 'cTab', arg: 'home' },
      { id: 'bookings', label: 'Bookings', icon: 'calendar', act: 'cTab', arg: 'bookings' },
      { id: 'history', label: 'History', icon: 'history', act: 'cTab', arg: 'history' },
      { id: 'account', label: 'Account', icon: 'user', act: 'cTab', arg: 'account' }
    ], active);
  }

  function shortStatus(j, t) {
    var f = t.first;
    return ({
      requested: 'Waiting for ' + f + ' to accept', accepted: f + ' accepted your job', enroute: f + ' is on the way',
      arrived: f + ' has arrived', started: 'Service in progress', completed: 'Job completed. Review and pay',
      paid: 'Completed and paid', declined: f + " can't take this job"
    })[j.status] || '';
  }

  /* ---------------------------------------------------------------- home */
  SC.home = function () {
    var a = me(), j = J.forCustomer(), last = SH.lastAc(a.id), S = SH.S;
    var due = last && (S.now.getTime() - last.ts) > 150 * 86400000;
    var h = '<div class="body">' + flashHtml() +
      '<div class="greet"><div><p class="eyebrow">Welcome back</p><h2>Hi, ' + esc(SH.first(a.name)) + '</h2></div>' +
      '<span class="areapill">' + SH.icon('pin', 16) + esc(a.area) + '</span></div>';
    if (j) {
      var t = J.tech(j);
      h += '<button class="jobcard" data-act="cTab" data-arg="bookings"><span class="jc-ic">' + SH.icon('calendar', 24) + '</span>' +
        '<span class="jc-tx"><small>Active booking</small><b>' + esc(shortStatus(j, t)) + '</b><em>' + esc(t.name) + ' · ' + esc(j.slot.label) + '</em></span>' +
        SH.icon('chevron', 20) + '</button>' +
        '<p class="hint left">One active booking at a time in this prototype.</p>';
    } else {
      h += '<button class="ask" data-act="startCat" data-arg="ac"><span class="ask-ic">' + SH.icon('sparkle', 24) + '</span>' +
        '<span class="ask-tx"><b>What needs fixing?</b><small>Describe the problem or pick a service</small></span>' + SH.icon('chevron', 20) + '</button>';
    }
    if (due && !j) {
      h += '<div class="remind">' + SH.icon('bell', 20) + '<div><b>Your AC may be due for maintenance</b><small>Last serviced ' + esc(last.date) + '.</small></div>' +
        SH.btn('Book a service', 'bookService', { kind: 'soft', sm: true }) + '</div>';
    }
    if (!j) {
      h += '<h3 class="sec">Services</h3><div class="cats">' + D.TRADES.map(function (t) {
        return '<button class="cat' + (t.id === 'ac' ? ' hot' : '') + '" data-act="startCat" data-arg="' + t.id + '"><span class="cat-ic">' + SH.icon(t.icon, 24) + '</span><span>' + esc(t.short) + '</span></button>';
      }).join('') + '</div>';
    }
    h += '<ul class="trust"><li>' + SH.icon('shield', 20) + '<span>Every technician is ID-checked</span></li>' +
      '<li>' + SH.icon('receipt', 20) + '<span>You approve every price before work</span></li>' +
      '<li>' + SH.icon('card', 20) + '<span>You pay only after the job is done</span></li></ul></div>';
    return SH.scr('home', h + tabs('home'));
  };

  /* ------------------------------------------------------------- request */
  SC.request = function () {
    var r = U().req;
    if (r.cat !== 'ac') {
      return SH.scr('request', SH.hdr('New request', 'cTab', 'home') + '<div class="body">' +
        SH.note('info', '<b>' + esc(D.tradeLabel(r.cat)) + '</b> follows the same steps, but the prototype\'s sample data covers air conditioning only.', 'wrench') +
        SH.btn('Switch to air conditioning', 'startCat', { arg: 'ac' }) + '</div>');
    }
    var h = '<div class="body">' +
      '<div class="field"><label for="descr">What is wrong with your AC?</label>' +
      '<textarea id="descr" class="input area" rows="4" data-in="req.descr" data-live="1" placeholder="Describe the problem in your own words">' + esc(r.descr) + '</textarea></div>' +
      '<div class="chips">' + D.PROBLEMS.map(function (p) { return SH.chip(p.label, 'setProb', p.key, r.prob === p.key && r.descr === p.text); }).join('') + '</div>' +
      '<div class="media">' +
      '<button class="mtile' + (r.media.photo ? ' on' : '') + '" data-act="toggleMedia" data-arg="photo" aria-pressed="' + r.media.photo + '">' + SH.icon(r.media.photo ? 'check' : 'camera', 22) + '<span>' + (r.media.photo ? 'Photo added' : 'Add photo') + '</span></button>' +
      '<button class="mtile' + (r.media.video ? ' on' : '') + '" data-act="toggleMedia" data-arg="video" aria-pressed="' + r.media.video + '">' + SH.icon(r.media.video ? 'check' : 'camera', 22) + '<span>' + (r.media.video ? 'Video added' : 'Add video') + '</span></button></div>';
    if (r.ai === 'shown') {
      var iss = D.ISSUES[D.classify(r.descr)];
      h += '<div class="ai"><div class="ai-h">' + SH.icon('sparkle', 20) + '<b>Initial recommendation</b><span class="tag">AI estimate</span></div>' +
        '<dl><dt>Likely issue</dt><dd>' + esc(iss.issue) + '</dd><dt>Typical price range</dt><dd>' + esc(iss.range) + '</dd><dt>Confidence</dt><dd>' + esc(iss.conf) + '</dd></dl>' +
        '<p class="hint left">An estimate from your description. The technician confirms the real price in a quotation that you approve.</p>' +
        SH.btn('Dismiss and choose myself', 'dismissAI', { kind: 'ghost', sm: true }) + '</div>';
    } else if (r.ai === 'dismissed') {
      h += SH.note('info', 'Recommendation dismissed. You decide which technician to book.', 'check') +
        SH.btn('Show again', 'restoreAI', { kind: 'ghost', sm: true });
    } else {
      h += SH.btn('Get a recommendation', 'runAI', { kind: 'soft', icon: 'sparkle' });
    }
    h += (r.err ? '<p class="err" role="alert">' + esc(r.err) + '</p>' : '') + '</div>';
    return SH.scr('request', SH.hdr('New request', 'cTab', 'home') + h + SH.foot(SH.btn('Find technicians', 'findTechs')));
  };

  /* --------------------------------------------------------------- match */
  var SORTS = [['best', 'Best match'], ['close', 'Closest'], ['rated', 'Top rated'], ['price', 'Lowest price']];
  SC.match = function () {
    var u = U(), rows = D.ranked(SH.S.techs, u.req.sort || 'best');
    var h = '<div class="body"><p class="lede">' + rows.length + ' verified AC technicians near ' + esc(me().area) + '</p>' +
      '<div class="chips grid4">' + SORTS.map(function (s) { return SH.chip(s[1], 'setSort', s[0], (u.req.sort || 'best') === s[0]); }).join('') + '</div>' +
      '<div class="tlist">';
    rows.forEach(function (r, i) {
      var t = r.t, isNew = r.rel == null;
      h += '<article class="tcard' + (i === 0 && (u.req.sort || 'best') === 'best' ? ' top' : '') + '">' +
        '<div class="tc-top">' + SH.avatar(t) + '<div class="tc-id"><h3>' + esc(t.name) + ' <span class="vb" title="Verified">' + SH.icon('shield', 16) + '</span></h3>' +
        '<p>' + (t.rating == null ? '<span class="tag new">New</span> ' : SH.icon('star', 14, 'staric') + ' <b>' + t.rating.toFixed(1) + '</b> (' + t.jobs + ' jobs) · ') + t.dist.toFixed(1) + ' km away</p></div>' +
        '<div class="mpct"><strong>' + r.match + '%</strong> match</div></div>' +
        '<div class="tc-meta">' + (i === 0 && (u.req.sort || 'best') === 'best' ? '<span class="tag best">Best match</span>' : '') +
        (isNew ? '<span class="tag new">New</span>' : '<span class="tag">Reliability ' + r.rel + '</span>') +
        '<span class="tag">Diagnostic ' + esc(SH.egp(t.diag)) + '</span></div>' +
        SH.btn('View profile', 'viewTech', { kind: 'soft', sm: true, arg: t.id }) + '</article>';
    });
    return SH.scr('match', SH.hdr('Technicians nearby', 'cGo', 'request') + h + '</div></div>');
  };

  /* ------------------------------------------------------------- profile */
  var WEIGHTS = [['On-time arrival', 30], ['Customer rating', 25], ['Bookings kept', 20], ['Repeat customers', 15], ['Jobs completed', 10]];
  SC.profile = function () {
    var t = SH.tech(U().req.techId), rel = D.reliability(t), circ = 213.6;
    var dash = rel == null ? '0 ' + circ : (rel / 100 * circ).toFixed(1) + ' ' + circ;
    var h = '<div class="body">' +
      '<div class="pf-top">' + SH.avatar(t, 'lg') + '<div><h2>' + esc(t.name) + '</h2><p>' + esc(D.tradeLabel(t.trade)) + ' · ' + t.years + ' years</p>' +
      '<span class="vbadge">' + SH.icon('shield', 16) + 'Verified identity</span></div></div>' +
      '<div class="relcard"><div class="ring"><svg viewBox="0 0 80 80" width="86" height="86" aria-hidden="true"><circle cx="40" cy="40" r="34" fill="none" stroke="#E1E7EE" stroke-width="7"/>' +
      '<circle cx="40" cy="40" r="34" fill="none" stroke="#35746E" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + dash + '" transform="rotate(-90 40 40)"/></svg>' +
      '<div class="rnum">' + (rel == null ? '<b>New</b>' : '<b>' + rel + '</b><small>/100</small>') + '</div></div>' +
      '<div class="rtx"><h3>Reliability score</h3><p>' + (rel == null ? 'Shown after 5 completed jobs. New technicians get a fair starting position in matching.' : 'Built from real jobs: punctual, well rated, rarely cancels, and customers come back.') + '</p></div></div>' +
      '<div class="stats"><div><b>' + t.jobs + '</b><small>Jobs</small></div><div><b>' + (t.rating == null ? '–' : t.rating.toFixed(1)) + '</b><small>Rating</small></div>' +
      '<div><b>' + (t.ontime == null ? '–' : t.ontime + '%') + '</b><small>On time</small></div><div><b>' + (t.jobs < 5 ? '–' : t.repeat + '%') + '</b><small>Repeat</small></div></div>' +
      '<h3 class="sec">Diagnostic fee</h3><p class="plain">' + esc(SH.egp(t.diag)) + ' for the visit and diagnosis. Repairs are quoted separately and need your approval.</p>' +
      '<h3 class="sec">Areas</h3><div class="chips">' + t.areas.map(function (a) { return '<span class="tag">' + esc(a) + '</span>'; }).join('') + '</div>' +
      '<h3 class="sec">Recent work</h3>' + (t.work.length ? '<ul class="plainlist">' + t.work.map(function (w) { return '<li>' + SH.icon('check', 16) + esc(w) + '</li>'; }).join('') + '</ul>' : '<p class="plain">No completed jobs yet.</p>') +
      '<details class="how"><summary>How the score is calculated</summary><ul class="plainlist">' + WEIGHTS.map(function (w) { return '<li><span>' + w[0] + '</span><b>' + w[1] + '%</b></li>'; }).join('') + '</ul></details>' +
      '</div>';
    return SH.scr('profile', SH.hdr('Technician profile', 'cGo', 'match') + h + SH.foot(SH.btn('Book ' + t.first, 'cGo', { arg: 'book' })));
  };

  /* ---------------------------------------------------------------- book */
  SC.book = function () {
    var r = U().req, t = SH.tech(r.techId), slots = D.slotsFor(SH.S.now);
    var h = '<div class="body">' +
      '<div class="card techrow">' + SH.avatar(t) + '<div><b>' + esc(t.name) + '</b><small>AC repair · ' + esc(me().area) + '</small></div></div>' +
      '<h3 class="sec">Choose a time</h3><div class="slots" role="radiogroup" aria-label="Appointment time">' + slots.map(function (s, i) {
        var on = r.slot === i;
        return '<button class="slot' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-act="setSlot" data-arg="' + i + '"><b>' + esc(s.label) + '</b><small>' + esc(s.sub) + '</small></button>';
      }).join('') + '</div>' +
      '<h3 class="sec">No surprise charges</h3><ul class="plainlist ticks">' +
      '<li>' + SH.icon('check', 16) + 'The diagnostic fee is ' + esc(SH.egp(t.diag)) + ', shown before you book.</li>' +
      '<li>' + SH.icon('check', 16) + 'Extra work needs your approval in a quotation first.</li>' +
      '<li>' + SH.icon('check', 16) + 'You pay only after you approve the finished work.</li>' +
      '<li>' + SH.icon('check', 16) + 'Completed repairs come with a 30-day warranty.</li></ul></div>';
    return SH.scr('book', SH.hdr('Book appointment', 'cGo', 'profile') + h + SH.foot(SH.btn('Confirm booking', 'confirmBooking')));
  };

  /* --------------------------------------------------------------- track */
  function mapSvg(j) {
    var s = J.step(j), pos = s <= 1 ? [36, 84] : s === 2 ? [120, 65] : [280, 46];
    return '<svg class="map" viewBox="0 0 320 120" role="img" aria-label="Route from the technician to your home">' +
      '<rect width="320" height="120" rx="14" fill="#DBE5E1"/>' +
      '<path d="M0 30H320M0 90H320M70 0V120M200 0V120" stroke="#CAD7D2" stroke-width="1"/><rect x="8" y="38" width="54" height="44" rx="6" fill="#E7EEEB"/><rect x="208" y="62" width="58" height="48" rx="6" fill="#E7EEEB"/><rect x="80" y="8" width="112" height="14" rx="5" fill="#E7EEEB"/>' +
      '<polyline points="36,84 120,84 120,46 280,46" fill="none" stroke="#8FB6B1" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<g transform="translate(280 46)"><circle r="15" fill="#35746E"/><path d="M-7 2l7-6 7 6v7h-14z" fill="#fff"/></g>' +
      '<g class="tdot" style="transform:translate(' + pos[0] + 'px,' + pos[1] + 'px)"><circle r="10" fill="#fff" stroke="#35746E" stroke-width="2.5"/><circle r="4" fill="#35746E"/></g></svg>';
  }

  function simLabel(j) {
    var q = J.latest(j);
    if (j.status === 'requested') return ['Technician accepts the job'];
    if (j.status === 'accepted') return ['Technician starts driving'];
    if (j.status === 'enroute') return ['Technician arrives at your door'];
    if (j.status === 'arrived') return ['Technician uploads before photos and starts'];
    if (j.status === 'started') {
      if (!q) return ['Technician sends quotation v1'];
      if (q.status === 'rejected') return ['Technician sends a revised quotation'];
      if (q.status === 'approved') return q.ver < 2 ? ['Technician finds extra work and sends v2', 'Technician uploads after photos and completes'] : ['Technician uploads after photos and completes'];
    }
    return [];
  }

  SC.track = function () {
    var u = U(), j = J.forCustomer();
    if (!j) return SC.empty();
    var t = J.tech(j), step = J.step(j), q = J.latest(j);
    var title, sub;
    switch (j.status) {
      case 'requested': title = 'Waiting for ' + t.first + ' to accept'; sub = 'Booked for ' + j.slot.label + ' (' + j.slot.sub + '). ' + t.first + ' has been notified.'; break;
      case 'accepted': title = t.first + ' accepted your job'; sub = 'Expected ' + j.slot.label + '. You can chat about access or parking.'; break;
      case 'enroute': title = t.first + ' is on the way'; sub = 'ETA 12 min'; break;
      case 'arrived': title = t.first + ' has arrived'; sub = 'First a before photo and a diagnosis, then a quotation for you to approve.'; break;
      case 'started': title = 'Service in progress'; sub = !q ? 'The technician is diagnosing the issue.' : q.status === 'pending' ? 'Waiting for your decision on quotation v' + q.ver + '.' : q.status === 'approved' ? 'Quotation v' + q.ver + ' is approved. Work continues.' : 'You rejected v' + q.ver + '. Waiting for a revised quotation.'; break;
      case 'completed': title = 'Job completed'; sub = 'Check the work, then approve the final cost to pay.'; break;
      case 'paid': title = 'Completed and paid'; sub = 'Your receipt and warranty are saved in History.'; break;
      default: title = t.first + " can't take this job"; sub = 'You were not charged. Your request details are kept.';
    }
    var h = '<div class="body">' + flashHtml();
    if (j.status !== 'declined') h += mapSvg(j);
    h += '<div class="statushead"><h2>' + esc(title) + '</h2><p>' + esc(sub) + '</p></div>';

    if (q && q.status === 'pending') {
      h += '<div class="banner"><div><b>' + (q.ver > 1 ? 'New quotation' : 'Quotation') + ' (v' + q.ver + ') needs your approval</b><small>Total ' + esc(SH.egp(D.qTotal(q))) + '. Nothing is charged until you approve.</small></div>' +
        SH.btn('Review quotation', 'cGo', { sm: true, arg: 'quote' }) + '</div>';
    }
    h += '<div class="card techrow">' + SH.avatar(t) + '<div><b>' + esc(t.name) + '</b><small>' + (t.rating == null ? 'New technician' : '★ ' + t.rating.toFixed(1) + ' · Reliability ' + (D.reliability(t) == null ? 'New' : D.reliability(t))) + '</small></div>' +
      (J.chatOpen(j) ? '<button class="iconbtn solid" data-act="cGo" data-arg="chat" aria-label="Chat">' + SH.icon('chat', 22) + '</button>' : '') + '</div>';

    if (j.status !== 'declined') {
      h += '<ol class="timeline">' + J.STEPS.map(function (s, i) {
        var cls = i < step || (i === step && j.status === 'paid') ? 'done' : i === step ? 'cur' : '';
        return '<li class="' + cls + '"><span class="dot">' + (cls === 'done' ? SH.icon('check', 14) : '') + '</span><span>' + esc(s) + '</span></li>';
      }).join('') + '</ol>';
    }
    if (j.before) h += '<figure class="photo">' + SH.art.before() + '<figcaption>Before photo from ' + esc(t.first) + '</figcaption></figure>';
    if (j.after) h += '<figure class="photo">' + SH.art.after() + '<figcaption>After photo from ' + esc(t.first) + '</figcaption></figure>';

    if (j.status === 'completed') h += SH.btn('Review and approve', 'goWork');
    if (j.status === 'paid') {
      if (!j.reviewed) h += SH.btn('Rate ' + t.first, 'goRate');
      h += SH.btn('View receipt', 'cGo', { kind: 'ghost', arg: 'invoice' });
    }
    if (j.status === 'declined') h += SH.btn('Choose another technician', 'chooseAnother');

    var sims = simLabel(j);
    if (sims.length && !(q && q.status === 'pending')) {
      h += '<div class="ctl"><b>Prototype control</b><p>' + (t.accId ? 'Switch to Technician view to do this yourself, or play ' + esc(t.first) + "'s phone from here." : esc(t.first) + ' has no demo login, so play their phone from here.') + '</p>' +
        sims.map(function (s, i) { return SH.btn(s, 'simNext', { kind: i === sims.length - 1 && sims.length > 1 ? 'amber' : 'ghost', sm: true, arg: s.indexOf('completes') >= 0 ? 'finish' : 'next' }); }).join('') + '</div>';
    }
    if (J.canCancel(j)) {
      h += u.cc
        ? '<div class="card confirm"><b>Cancel this booking?</b><p>' + esc(t.first) + ' will be told right away.</p><div class="row2">' + SH.btn('Keep booking', 'cCancel', { kind: 'ghost', sm: true }) + SH.btn('Yes, cancel', 'cCancelYes', { kind: 'danger', sm: true }) + '</div></div>'
        : SH.btn('Cancel booking', 'cCancel', { kind: 'danger-text' });
    }
    return SH.scr('track', SH.hdr('Your booking') + h + '</div>' + tabs('bookings'));
  };

  SC.empty = function () {
    return SH.scr('empty', SH.hdr('Bookings') + '<div class="body centerbody">' + flashHtml() +
      '<div class="bigicon">' + SH.icon('calendar', 40) + '</div><h2>No active bookings</h2>' +
      '<p class="lede">When you book a technician, you can follow every step of the visit here.</p>' +
      SH.btn('Book a service', 'startCat', { arg: 'ac' }) + '</div>' + tabs('bookings'));
  };

  /* ---------------------------------------------------------------- chat */
  SH.chatScreen = function (role) {
    var cust = role === 'customer', j = cust ? J.forCustomer() : J.forProvider();
    var back = cust ? ['cGo', 'track'] : ['pGo', 'job'];
    if (!j) return SH.scr('chat', SH.hdr('Chat', back[0], back[1]) + '<div class="body"><p class="lede">No active booking.</p></div>');
    var other = cust ? J.tech(j).first : SH.first(j.customerName), mine = cust ? 'c' : 'p';
    var quick = cust ? ["I'm home now", 'Please call me when you arrive', 'Can you bring the parts?'] : ['On my way', 'I will arrive in 10 minutes', 'Please share the building entrance'];
    var h = '<div class="body chatbody" data-chat="' + j.msgs.length + '">' +
      '<p class="chatnote">' + SH.icon('shield', 14) + 'Chat for this booking only. Phone numbers stay private.</p>' +
      j.msgs.map(function (m) { return '<div class="bub ' + (m.from === mine ? 'me' : 'them') + '">' + esc(m.text) + '</div>'; }).join('') + '</div>';
    var foot = '<div class="quick">' + quick.map(function (q) { return '<button class="chip" data-act="quick" data-arg="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>' +
      '<div class="sendrow"><input class="input" id="chatIn" data-in="chatText" data-enter="sendChat" autocomplete="off" placeholder="Message ' + esc(other) + '" value="' + esc(SH.U(role).chatText) + '">' +
      '<button class="btn btn-primary btn-sm" data-act="sendChat"><span>Send</span></button></div>';
    return SH.scr('chat', SH.hdr('Chat with ' + other, back[0], back[1]) + h + SH.foot(foot));
  };
  SC.chat = function () { return SH.chatScreen('customer'); };

  /* --------------------------------------------------------------- quote */
  var QSTATE = { pending: ['Awaiting your approval', 'amber'], approved: ['Approved', 'ok'], rejected: ['Rejected', 'bad'] };
  SC.quote = function () {
    var j = J.forCustomer(), q = j && J.latest(j);
    if (!q) return SC.track();
    var prev = j.quotes[q.ver - 2], st = QSTATE[q.status];
    function line(label, key) {
      var changed = prev && prev[key] !== q[key];
      return '<div class="qline"><span>' + label + (changed ? ' <span class="tag upd">UPDATED</span>' : '') + '</span><b>' + esc(SH.egp(q[key])) + '</b></div>';
    }
    var total = D.qTotal(q);
    var h = '<div class="body"><div class="qhead"><span class="pillst ' + st[1] + '">' + st[0] + '</span><p>From ' + esc(J.tech(j).name) + '</p></div>' +
      '<div class="card qcard">' + line('Diagnostic fee', 'diag') + line('Parts', 'parts') + line('Labor', 'labor') + line('Extra work', 'extra') +
      '<div class="qline total"><span>Total</span><b>' + esc(SH.egp(total)) + '</b></div></div>';
    if (prev) {
      var d = total - D.qTotal(prev);
      h += '<p class="plain">Change from v' + prev.ver + ': <b>' + (d >= 0 ? '+' : '–') + esc(SH.egp(Math.abs(d))) + '</b></p>';
    }
    if (q.status === 'pending') h += SH.note('info', 'You are never charged for work you have not approved.', 'shield');
    if (q.status === 'rejected') h += SH.note('warn', 'You rejected this quotation. The technician can send a revised one.', 'bell');
    if (q.status === 'approved') h += SH.note('ok', 'You approved this quotation.', 'check');
    h += '</div>';
    var foot = q.status === 'pending' ? SH.foot('<div class="row2">' + SH.btn('Reject', 'rejectQuote', { kind: 'ghost' }) + SH.btn('Approve quotation', 'approveQuote') + '</div>') : '';
    return SH.scr('quote', SH.hdr('Quotation v' + q.ver, 'cGo', 'track') + h + foot);
  };

  /* ---------------------------------------------------------- work + pay */
  SC.work = function () {
    var j = J.forCustomer(), q = j && J.latest(j);
    if (!j || !q) return SC.track();
    var t = J.tech(j);
    var h = '<div class="body"><div class="pair"><figure class="photo">' + SH.art.before() + '<figcaption>Before the visit</figcaption></figure>' +
      '<figure class="photo">' + SH.art.after() + '<figcaption>After: ' + esc(D.ISSUES[j.issueKey].short) + ' repaired</figcaption></figure></div>' +
      SH.note('ok', 'Matches approved quotation v' + q.ver + '. No extra charges.', 'check') +
      '<div class="card qcard"><div class="qline"><span>Diagnostic fee</span><b>' + esc(SH.egp(q.diag)) + '</b></div><div class="qline"><span>Parts</span><b>' + esc(SH.egp(q.parts)) + '</b></div>' +
      '<div class="qline"><span>Labor</span><b>' + esc(SH.egp(q.labor)) + '</b></div><div class="qline"><span>Extra work</span><b>' + esc(SH.egp(q.extra)) + '</b></div>' +
      '<div class="qline total"><span>Final cost</span><b>' + esc(SH.egp(j.total)) + '</b></div></div>' +
      '<p class="plain">If something does not look right, chat with ' + esc(t.first) + ' before you pay.</p></div>';
    return SH.scr('work', SH.hdr('Review the work', 'cGo', 'track') + h + SH.foot(SH.btn('Approve final cost and pay', 'goPay')));
  };

  SC.pay = function () {
    var j = J.forCustomer(), r = U().req;
    if (!j) return SC.empty();
    var h = '<div class="body"><div class="paytotal"><small>Total to pay</small><b>' + esc(SH.egp(j.total)) + '</b></div>' +
      SH.note('proto', '<b>Prototype:</b> sandbox payment. No real money moves.', 'card') +
      '<div class="methods" role="radiogroup" aria-label="Payment method">' + D.PAYMENTS.map(function (m) {
        var on = r.pay === m.id;
        return '<button class="method' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-act="setPay" data-arg="' + m.id + '"><span class="radio"></span><span><b>' + esc(m.title) + '</b><small>' + esc(m.sub) + '</small></span></button>';
      }).join('') + '</div></div>';
    return SH.scr('pay', SH.hdr('Payment', 'cGo', 'work') + h + SH.foot(SH.btn('Pay ' + SH.egp(j.total), 'doPay')));
  };

  SC.invoice = function () {
    var j = J.forCustomer();
    if (!j || j.status !== 'paid') return SC.track();
    var t = J.tech(j), q = J.latest(j);
    var method = SH.find(D.PAYMENTS, function (m) { return m.id === j.payMethod; });
    var h = '<div class="body"><div class="okhead"><span class="okic">' + SH.icon('check', 30) + '</span><h2>Payment received</h2><p>' + esc(SH.egp(j.total)) + ' paid with ' + esc(method ? method.title : '') + '</p></div>' +
      '<div class="card qcard"><div class="qline"><span>Invoice</span><b>' + esc(j.invNo) + '</b></div><div class="qline"><span>Date</span><b>' + esc(j.paidDate) + '</b></div>' +
      '<div class="qline"><span>Technician</span><b>' + esc(t.name) + '</b></div><div class="qline"><span>Service</span><b>' + esc(J.title(j)) + '</b></div>' +
      '<div class="qline"><span>Quotation</span><b>v' + q.ver + ' approved</b></div><div class="qline total"><span>Total</span><b>' + esc(SH.egp(j.total)) + '</b></div></div>' +
      SH.note('ok', '<b>30-day warranty</b> until ' + esc(j.until) + '. Saved in your service history.', 'shield') + '</div>';
    var foot = SH.foot((j.reviewed ? '' : SH.btn('Rate ' + t.first, 'goRate')) + SH.btn('Back to home', 'cTab', { kind: 'ghost', arg: 'home' }));
    return SH.scr('invoice', SH.hdr('Receipt', 'cGo', 'track') + h + foot);
  };

  var TAGS = ['On time', 'Clean work', 'Fair price', 'Polite', 'Explained clearly'];
  SC.rate = function () {
    var j = J.forCustomer(), r = U().req;
    if (!j) return SC.empty();
    var t = J.tech(j);
    var h = '<div class="body centerish"><div class="rateav">' + SH.avatar(t, 'lg') + '</div><h2>Rate your service</h2><p class="lede">How was your visit with ' + esc(t.name) + '?</p>' +
      '<div class="stars" role="group" aria-label="Star rating">' + [1, 2, 3, 4, 5].map(function (n) {
        return '<button class="starbtn" data-act="setStar" data-arg="' + n + '" aria-label="' + n + (n === 1 ? ' star' : ' stars') + '" aria-pressed="' + (r.stars >= n) + '">' + SH.starSvg(r.stars >= n, 38) + '</button>';
      }).join('') + '</div>' +
      '<div class="chips center">' + TAGS.map(function (g) { return SH.chip(g, 'toggleTag', g, r.tags.indexOf(g) >= 0); }).join('') + '</div>' +
      '<div class="field left"><label for="comment">Add a comment (optional)</label><textarea id="comment" class="input area" rows="3" data-in="req.comment" placeholder="Anything other customers should know?">' + esc(r.comment) + '</textarea></div>' +
      (U().err ? '<p class="err" role="alert">' + esc(U().err) + '</p>' : '') + '</div>';
    return SH.scr('rate', SH.hdr('Rate your service', 'cGo', 'invoice') + h + SH.foot(SH.btn('Submit review', 'submitReview') + SH.btn('Skip for now', 'skipRate', { kind: 'ghost', sm: true })));
  };

  /* ------------------------------------------------------------- history */
  SC.history = function () {
    var a = me(), list = SH.S.hist.filter(function (x) { return x.uid === a.id; }), last = SH.lastAc(a.id);
    var h = '<div class="body">' + flashHtml();
    if (last) {
      var next = new Date(last.ts); next.setMonth(next.getMonth() + 6);
      var overdue = next.getTime() <= SH.S.now.getTime();
      h += '<div class="remind">' + SH.icon('bell', 20) + '<div><b>' + (overdue ? 'AC service is due now' : 'Next AC service due') + '</b><small>' + (overdue ? 'Last serviced ' + esc(last.date) + '.' : 'Due ' + MN[next.getMonth()] + ' ' + next.getFullYear() + '. We will remind you.') + '</small></div></div>';
    }
    if (!list.length) {
      h += '<div class="centerbody"><div class="bigicon">' + SH.icon('history', 40) + '</div><h2>No history yet</h2><p class="lede">After your first completed job, the receipt, photos and warranty are kept here.</p></div>';
    } else {
      h += '<ul class="hlist">' + list.map(function (x) {
        return '<li class="hitem"><div class="hrow"><b>' + esc(x.title) + '</b><span>' + esc(x.cost) + '</span></div>' +
          '<p>' + esc(x.date) + ' · ' + esc(x.tech) + '</p><div class="tags">' + (x.photos ? '<span class="tag">Before and after photos</span>' : '') +
          '<span class="tag' + (x.active ? ' okt' : '') + '">' + esc(x.warranty) + '</span>' +
          (x.review ? '<span class="tag">You rated ' + x.review + '/5</span>' : '') + '</div></li>';
      }).join('') + '</ul>';
    }
    return SH.scr('history', SH.hdr('Service history') + h + '</div>' + tabs('history'));
  };

  SC.account = function () {
    var a = me();
    var h = '<div class="body"><div class="acc-top"><span class="avatar lg" style="background:#35746E">' + esc(SH.initials(a.name)) + '</span><div><h2>' + esc(a.name) + '</h2><p>' + esc(SH.fmtPhone(a.phone)) + '</p></div></div>' +
      '<ul class="rows"><li><span>Area</span><b>' + esc(a.area) + '</b></li><li><span>Phone</span><b class="okt">' + SH.icon('check', 14) + ' Verified</b></li>' +
      '<li><span>Account type</span><b>Customer</b></li></ul>' +
      SH.btn('Sign out', 'signOut', { kind: 'ghost', icon: 'logout' }) +
      '<p class="hint">Prototype: your data exists only in this browser tab and is cleared by Restart demo.</p></div>';
    return SH.scr('account', SH.hdr('Account') + h + tabs('account'));
  };

  /* ------------------------------------------------------------- actions */
  function job() { return J.forCustomer(); }

  A.cGo = function (screen) { SH.go(screen); };
  A.cTab = function (tab) {
    var u = U(); u.tab = tab;
    if (tab === 'bookings') SH.go(job() ? 'track' : 'empty');
    else SH.go(tab);
  };

  function newReq(cat, descr) {
    return { cat: cat, descr: descr, prob: 'cooling', ai: null, media: { photo: false, video: false }, techId: null, slot: 0, sort: 'best', pay: 'card', stars: 0, tags: [], comment: '', err: '' };
  }
  A.startCat = function (cat) {
    if (job()) { SH.go('track'); return; }
    U().req = newReq(cat, cat === 'ac' ? D.PROBLEMS[0].text : '');
    SH.go('request');
  };
  A.bookService = function () {
    if (job()) { SH.go('track'); return; }
    U().req = newReq('ac', 'My AC is due for routine maintenance.');
    SH.go('request');
  };
  A.setProb = function (key) {
    var r = U().req, p = SH.find(D.PROBLEMS, function (x) { return x.key === key; });
    if (p) { r.descr = p.text; r.prob = key; r.ai = null; r.err = ''; }
  };
  SH.inHooks['req.descr'] = function () { var r = U().req; r.err = ''; if (r.ai === 'shown') r.ai = null; };
  A.toggleMedia = function (k) { var m = U().req.media; m[k] = !m[k]; };
  A.runAI = function () {
    var r = U().req;
    if (!r.descr.trim()) { r.err = 'Describe the problem first, or tap one of the suggestions.'; return; }
    r.ai = 'shown'; r.err = ''; SH.mark('c_request'); SH.mark('c_ai');
  };
  A.dismissAI = function () { U().req.ai = 'dismissed'; };
  A.restoreAI = function () { U().req.ai = 'shown'; };
  A.findTechs = function () {
    var r = U().req;
    if (!r.descr.trim()) { r.err = 'Describe the problem first, or tap one of the suggestions.'; return; }
    SH.mark('c_request');
    SH.go('match');
  };
  A.setSort = function (k) { U().req.sort = k; SH.mark('c_compare'); };
  A.viewTech = function (id) { U().req.techId = id; SH.mark('c_compare'); SH.go('profile'); };
  A.setSlot = function (i) { U().req.slot = Number(i); };
  A.confirmBooking = function () {
    var u = U(), r = u.req;
    if (!r || !r.techId) return;
    J.create();
    SH.mark('c_book');
    u.tab = 'bookings';
    SH.go('track');
  };

  A.cCancel = function () { var u = U(); u.cc = !u.cc; };
  A.cCancelYes = function () {
    var j = job();
    if (j && J.cancel(j, 'customer')) { SH.U('customer').tab = 'home'; SH.go('home'); SH.flash('info', 'Booking cancelled. You were not charged.'); }
  };

  A.chooseAnother = function () {
    SH.S.job = null;
    if (!U().req) { SH.go('home'); return; }
    SH.go('match');
  };

  A.simNext = function (what) {
    var j = job();
    if (!j) return;
    if (what === 'finish') J.sim(j, 'finish'); else J.sim(j);
  };

  /* chat (shared by both roles) */
  A.quick = function (text) {
    var cust = SH.S.view === 'customer', j = cust ? job() : J.forProvider();
    if (!j) return;
    J.say(j, cust ? 'c' : 'p', text);
    if (cust && !J.tech(j).accId) J.say(j, 'p', 'Noted, thank you.');
  };
  A.sendChat = function () {
    var cust = SH.S.view === 'customer', u = SH.U(), j = cust ? job() : J.forProvider();
    if (!j || !u.chatText.trim()) return;
    J.say(j, cust ? 'c' : 'p', u.chatText);
    u.chatText = '';
    if (cust && !J.tech(j).accId) J.say(j, 'p', 'Noted, thank you.');
  };

  A.approveQuote = function () {
    var j = job(), q = j && J.latest(j);
    if (q && J.decide(j, true)) { SH.go('track'); SH.flash('ok', 'Quotation v' + q.ver + ' approved. The technician can continue.'); }
  };
  A.rejectQuote = function () { var j = job(); if (j) J.decide(j, false); };

  A.goWork = function () { SH.go('work'); };
  A.goPay = function () { SH.go('pay'); };
  A.setPay = function (id) { U().req.pay = id; };
  A.doPay = function () {
    var j = job();
    if (j && J.pay(j, U().req.pay)) SH.go('invoice');
  };
  A.goRate = function () { var r = U().req; r.stars = 0; r.tags = []; r.comment = ''; SH.go('rate'); };
  A.setStar = function (n) { U().req.stars = Number(n); U().err = ''; };
  A.toggleTag = function (g) {
    var tags = U().req.tags, i = tags.indexOf(g);
    if (i >= 0) tags.splice(i, 1); else tags.push(g);
  };
  A.submitReview = function () {
    var u = U(), r = u.req, j = job();
    if (!j) return;
    if (!r.stars) { u.err = 'Choose a star rating first.'; return; }
    J.review(j, r.stars, r.tags.slice(), r.comment);
    u.tab = 'history'; SH.go('history'); SH.flash('ok', 'Review sent. Thank you!');
  };
  A.skipRate = function () {
    var j = job();
    if (j) j.hideC = true;
    U().tab = 'history'; SH.go('history');
  };
})((window.SH = window.SH || {}));
