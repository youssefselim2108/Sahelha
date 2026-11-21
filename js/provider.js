/* Technician app: jobs, request details, job steps, quotation composer, chat, earnings, profile. */
(function (SH) {
  var D = SH.data, J = SH.jobs, esc = SH.esc, A = SH.act, SP = SH.screens.provider;

  function U() { return SH.U('provider'); }
  function job() { return J.forProvider(); }

  function flashHtml() {
    var f = U().flash;
    return f ? SH.note(f.kind === 'ok' ? 'ok' : 'info', esc(f.text), f.kind === 'ok' ? 'check' : 'bell') : '';
  }
  function tabs(active) {
    return SH.tabbar([
      { id: 'home', label: 'Jobs', icon: 'briefcase', act: 'pTab', arg: 'home' },
      { id: 'earnings', label: 'Earnings', icon: 'wallet', act: 'pTab', arg: 'earnings' },
      { id: 'profile', label: 'Profile', icon: 'user', act: 'pTab', arg: 'profile' }
    ], active);
  }
  function custAvatar(j) { return SH.avatar({ av: '#7B3FE4', initials: SH.initials(j.customerName) }); }

  var PILL = {
    requested: ['New request', 'amber'], accepted: ['Accepted', 'ok'], enroute: ['On the way', 'ok'], arrived: ['Arrived', 'ok'],
    started: ['In progress', 'ok'], completed: ['Waiting for payment', 'amber'], paid: ['Paid', 'ok'], cancelled: ['Cancelled', 'bad']
  };

  /* ---------------------------------------------------------------- home */
  SP.home = function () {
    var t = SH.myTech(), j = job(), rel = D.reliability(t);
    var h = '<div class="body">' + flashHtml() +
      '<div class="greet"><div><p class="eyebrow">Technician</p><h2>Hi, ' + esc(t.first) + '</h2></div><span class="vbadge">' + SH.icon('shield', 16) + 'Verified</span></div>' +
      '<div class="stats"><div><b>' + t.jobs + '</b><small>Jobs done</small></div><div><b>' + (t.rating == null ? '–' : t.rating.toFixed(1)) + '</b><small>Rating</small></div>' +
      '<div><b>' + (rel == null ? 'New' : rel) + '</b><small>Reliability</small></div></div>' +
      '<h3 class="sec">Your jobs</h3>';
    if (j && j.status === 'cancelled') {
      h += SH.note('warn', '<b>' + esc(SH.first(j.customerName)) + ' cancelled the booking.</b> Nothing else is needed from you.', 'bell') +
        SH.btn('Dismiss', 'dismissNotice', { kind: 'ghost', sm: true });
    } else if (j) {
      var p = PILL[j.status] || ['', 'ok'];
      h += '<button class="pjob" data-act="' + (j.status === 'requested' ? 'openRequest' : 'pGo') + '"' + (j.status === 'requested' ? '' : ' data-arg="job"') + '>' +
        custAvatar(j) + '<span class="pj-tx"><span class="pillst ' + p[1] + '">' + p[0] + '</span><b>' + esc(J.title(j)) + '</b><em>' + esc(j.customerName) + ' · ' + esc(j.area) + '</em><em>' + esc(j.slot.label) + '</em></span>' + SH.icon('chevron', 20) + '</button>';
    } else {
      h += '<div class="card emptycard"><div class="bigicon sm">' + SH.icon('briefcase', 30) + '</div><b>No jobs right now</b><p>New requests show up here as soon as a customer books you.</p></div>' +
        SH.note('proto', '<b>Prototype tip.</b> Switch to Customer view, book ' + (t.id === 'ahmed' ? 'Ahmed Salah' : esc(t.name)) + ', then come back to see the request arrive.', 'sparkle');
    }
    return SH.scr('p-home', SH.hdr('Jobs') + h + '</div>' + tabs('home'));
  };

  /* ------------------------------------------------------------- request */
  SP.request = function () {
    var j = job();
    if (!j) return SP.home();
    if (j.status !== 'requested') return SP.job();
    var t = SH.myTech();
    var h = '<div class="body">' +
      '<div class="card techrow">' + custAvatar(j) + '<div><b>' + esc(j.customerName) + '</b><small>' + esc(j.area) + ' · ' + t.dist.toFixed(1) + ' km from you</small></div></div>' +
      '<dl class="facts"><dt>When</dt><dd>' + esc(j.slot.label) + ' <small>(' + esc(j.slot.sub) + ')</small></dd>' +
      '<dt>Problem, in their words</dt><dd class="quote">“' + esc(j.descr) + '”</dd>' +
      '<dt>Likely issue</dt><dd>' + esc(j.issue) + '</dd>' +
      '<dt>Typical price range</dt><dd>' + esc(j.range) + '</dd>' +
      '<dt>Attachments</dt><dd>' + (j.media.photo || j.media.video ? [j.media.photo ? 'Photo' : '', j.media.video ? 'Video' : ''].filter(Boolean).join(' and ') + ' added' : 'None') + '</dd>' +
      '<dt>Your diagnostic fee</dt><dd>' + esc(SH.egp(t.diag)) + '</dd></dl>' +
      SH.note('info', 'Accepting means you will arrive in the time window above.', 'clock') + '</div>';
    return SH.scr('p-request', SH.hdr('New request', 'pGo', 'home') + h +
      SH.foot('<div class="row2">' + SH.btn('Decline', 'declineJob', { kind: 'ghost' }) + SH.btn('Accept job', 'acceptJob') + '</div>'));
  };

  /* ----------------------------------------------------------------- job */
  SP.job = function () {
    var j = job();
    if (!j) return SP.home();
    if (j.status === 'requested') return SP.request();
    if (j.status === 'cancelled') return SP.home();
    var step = J.step(j), q = J.latest(j), t = SH.myTech();
    var h = '<div class="body">' + flashHtml() +
      '<div class="card techrow">' + custAvatar(j) + '<div><b>' + esc(j.customerName) + '</b><small>' + esc(j.area) + ' · ' + esc(j.slot.label) + '</small></div>' +
      (J.chatOpen(j) ? '<button class="iconbtn solid" data-act="pGo" data-arg="chat" aria-label="Chat">' + SH.icon('chat', 22) + '</button>' : '') + '</div>' +
      '<p class="plain"><b>' + esc(J.title(j)) + '.</b> “' + esc(j.descr) + '”</p>' +
      '<ol class="timeline">' + J.STEPS.map(function (s, i) {
        var cls = i < step || (i === step && j.status === 'paid') ? 'done' : i === step ? 'cur' : '';
        return '<li class="' + cls + '"><span class="dot">' + (cls === 'done' ? SH.icon('check', 14) : '') + '</span><span>' + esc(s) + '</span></li>';
      }).join('') + '</ol>';
    var foot = '';

    if (j.status === 'accepted') {
      h += SH.note('info', 'The customer expects you ' + esc(j.slot.label) + '. Start driving when you leave.', 'clock');
      foot = SH.btn('Start driving', 'startDriving');
    } else if (j.status === 'enroute') {
      h += SH.note('info', 'The customer can see you are on the way (ETA 12 min).', 'pin');
      foot = SH.btn('I have arrived', 'markArrived');
    } else if (j.status === 'arrived') {
      h += j.before
        ? '<figure class="photo">' + SH.art.before() + '<figcaption>Before photo saved to the job</figcaption></figure>'
        : '<button class="phototile" data-act="shootBefore">' + SH.icon('camera', 28) + '<b>Take before photos</b><small>Required before you can start. Protects you and the customer.</small></button>';
      foot = SH.btn('Start service', 'startService', { disabled: !j.before });
    } else if (j.status === 'started') {
      if (j.before) h += '<figure class="photo">' + SH.art.before() + '<figcaption>Before photo</figcaption></figure>';
      if (j.quotes.length) {
        h += '<ul class="qlist">' + j.quotes.map(function (x) {
          return '<li><span>v' + x.ver + '</span><b>' + esc(SH.egp(D.qTotal(x))) + '</b><span class="pillst ' + (x.status === 'approved' ? 'ok' : x.status === 'rejected' ? 'bad' : 'amber') + '">' + (x.status === 'pending' ? 'Waiting' : x.status === 'approved' ? 'Approved' : 'Rejected') + '</span></li>';
        }).join('') + '</ul>';
      }
      if (!q) {
        h += SH.note('info', 'Diagnose the problem, then send a quotation. The customer must approve it before you continue.', 'receipt');
        foot = SH.btn('Send quotation', 'openQuote');
      } else if (q.status === 'pending') {
        h += SH.note('info', 'Waiting for the customer to approve v' + q.ver + ' (' + esc(SH.egp(D.qTotal(q))) + ').', 'hourglass');
      } else if (q.status === 'rejected') {
        h += SH.note('warn', 'The customer rejected v' + q.ver + '. Adjust the price and send a revised quotation.', 'bell');
        foot = SH.btn('Send revised quotation', 'openQuote');
      } else {
        h += SH.note('ok', 'Quotation v' + q.ver + ' is approved (' + esc(SH.egp(D.qTotal(q))) + '). Finish the job, then take after photos.', 'check');
        h += j.after
          ? '<figure class="photo">' + SH.art.after() + '<figcaption>After photo saved to the job</figcaption></figure>'
          : '<button class="phototile" data-act="shootAfter">' + SH.icon('camera', 28) + '<b>Take after photos</b><small>Required to complete the job.</small></button>';
        h += SH.btn('Found extra work? Send a revised quotation', 'openQuote', { kind: 'ghost', sm: true });
        foot = SH.btn('Complete job', 'completeJob', { disabled: !j.after });
      }
    } else if (j.status === 'completed') {
      h += '<figure class="photo">' + SH.art.after() + '<figcaption>After photo</figcaption></figure>' +
        SH.note('info', 'Job complete. Waiting for the customer to approve ' + esc(SH.egp(j.total)) + ' and pay.', 'hourglass');
    } else if (j.status === 'paid') {
      h += SH.note('ok', '<b>Paid ' + esc(SH.egp(j.total)) + '.</b> It is now in your Earnings.', 'wallet') +
        SH.btn('View earnings', 'pTab', { kind: 'ghost', arg: 'earnings' });
      foot = SH.btn('Done', 'pDone');
    }
    h += '</div>';
    return SH.scr('p-job', SH.hdr('Job', 'pGo', 'home') + h + (foot ? SH.foot(foot) : ''));
  };

  /* --------------------------------------------------------------- quote */
  function qrow(label, key, step, val) {
    return '<div class="qrow"><span>' + label + '</span><div class="stepper sm">' +
      '<button class="sbtn" data-act="qStep" data-arg="' + key + ':-' + step + '" aria-label="Decrease ' + label + '">' + SH.icon('minus', 18) + '</button>' +
      '<output class="sval">' + esc(SH.egp(val)) + '</output>' +
      '<button class="sbtn" data-act="qStep" data-arg="' + key + ':' + step + '" aria-label="Increase ' + label + '">' + SH.icon('plus', 18) + '</button></div></div>';
  }
  SP.quote = function () {
    var j = job();
    if (!j || !J.canQuote(j)) return SP.job();
    var u = U(), t = SH.myTech();
    if (!u.q) u.q = J.defaults(j);
    var q = u.q, total = t.diag + q.parts + q.labor + q.extra, ver = j.quotes.length + 1;
    var h = '<div class="body"><p class="lede">The customer sees this exact breakdown and must approve it before you continue.</p>' +
      '<div class="card qcard"><div class="qrow fixed"><span>Diagnostic fee</span><b>' + esc(SH.egp(t.diag)) + '</b></div>' +
      qrow('Parts', 'parts', 20, q.parts) + qrow('Labor', 'labor', 20, q.labor) + qrow('Extra work', 'extra', 10, q.extra) +
      '<div class="qline total"><span>Total</span><b>' + esc(SH.egp(total)) + '</b></div></div>' +
      '<p class="hint left">Your diagnostic fee comes from your profile and cannot be changed per job.</p></div>';
    return SH.scr('p-quote', SH.hdr('Quotation v' + ver, 'pGo', 'job') + h + SH.foot(SH.btn('Send to customer', 'sendQuote')));
  };

  SP.chat = function () { return SH.chatScreen('provider'); };

  /* ------------------------------------------------------------ earnings */
  SP.earnings = function () {
    var t = SH.myTech();
    var list = SH.S.earnings.filter(function (e) { return e.techId === t.id; });
    var sum = list.reduce(function (s, e) { return s + e.amount; }, 0);
    var h = '<div class="body"><div class="balance"><small>Total earned</small><b>' + esc(SH.egp(sum)) + '</b><span>from ' + list.length + ' paid job' + (list.length === 1 ? '' : 's') + '</span></div>' +
      '<p class="hint left">Payouts are simulated in the prototype.</p>';
    if (!list.length) {
      h += '<div class="centerbody"><div class="bigicon">' + SH.icon('wallet', 40) + '</div><h2>No earnings yet</h2><p class="lede">When a customer pays for a job, it appears here.</p></div>';
    } else {
      h += '<ul class="hlist">' + list.map(function (e) {
        return '<li class="hitem"><div class="hrow"><b>' + esc(e.title) + '</b><span class="okt">+' + esc(SH.egp(e.amount)) + '</span></div><p>' + esc(e.date) + ' · ' + esc(e.customer) + '</p>' +
          (e.fresh ? '<div class="tags"><span class="tag okt">Just now</span></div>' : '') + '</li>';
      }).join('') + '</ul>';
    }
    return SH.scr('p-earnings', SH.hdr('Earnings') + h + '</div>' + tabs('earnings'));
  };

  /* ------------------------------------------------------------- profile */
  SP.profile = function () {
    var t = SH.myTech(), a = SH.acct('provider'), rel = D.reliability(t);
    var h = '<div class="body"><div class="pf-top">' + SH.avatar(t, 'lg') + '<div><h2>' + esc(t.name) + '</h2><p>' + esc(D.tradeLabel(t.trade)) + ' · ' + t.years + ' years</p>' +
      '<span class="vbadge">' + SH.icon('shield', 16) + 'Verified identity</span></div></div>' +
      '<div class="stats"><div><b>' + t.jobs + '</b><small>Jobs</small></div><div><b>' + (t.rating == null ? '–' : t.rating.toFixed(1)) + '</b><small>Rating</small></div>' +
      '<div><b>' + (rel == null ? 'New' : rel) + '</b><small>Reliability</small></div></div>' +
      (rel == null ? SH.note('info', 'Your reliability score appears after 5 completed jobs. Until then you are matched with a fair starting score.', 'star') : '') +
      '<ul class="rows"><li><span>Phone</span><b>' + esc(SH.fmtPhone(a.phone)) + '</b></li><li><span>Diagnostic fee</span><b>' + esc(SH.egp(t.diag)) + '</b></li></ul>' +
      '<h3 class="sec">Areas you cover</h3><div class="chips">' + t.areas.map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join('') + '</div>' +
      SH.btn('Sign out', 'signOut', { kind: 'ghost', icon: 'logout' }) + '</div>';
    return SH.scr('p-profile', SH.hdr('Profile') + h + tabs('profile'));
  };

  /* ------------------------------------------------------------- actions */
  A.pGo = function (screen) { SH.go(screen); };
  A.pTab = function (tab) {
    var t = SH.myTech();
    U().tab = tab;
    SH.go(tab);
    if (tab === 'earnings' && t && SH.S.earnings.some(function (e) { return e.fresh && e.techId === t.id; })) SH.mark('p_paid');
  };
  A.openRequest = function () { if (job()) { SH.mark('p_received'); SH.go('request'); } };
  A.acceptJob = function () {
    var j = job();
    if (j && J.accept(j)) { SH.mark('p_accept'); SH.go('job'); SH.flash('ok', 'Job accepted. ' + SH.first(j.customerName) + ' has been told.'); }
  };
  A.declineJob = function () {
    var j = job();
    if (j && J.decline(j)) { SH.go('home'); SH.flash('info', 'Request declined. The customer can pick another technician.'); }
  };
  A.startDriving = function () { var j = job(); if (j) J.drive(j); };
  A.markArrived = function () { var j = job(); if (j) J.arrive(j); };
  A.shootBefore = function () { var j = job(); if (j) J.shootBefore(j); };
  A.startService = function () { var j = job(); if (j && J.start(j)) SH.mark('p_start'); };
  A.openQuote = function () {
    var j = job();
    if (!j || !J.canQuote(j)) return;
    U().q = J.defaults(j);
    SH.go('quote');
  };
  A.qStep = function (arg) {
    var q = U().q, p = String(arg).split(':');
    if (!q || !(p[0] in q)) return;
    q[p[0]] = Math.min(20000, Math.max(0, q[p[0]] + Number(p[1])));
  };
  A.sendQuote = function () {
    var j = job(), u = U();
    if (!j || !u.q) return;
    if (J.sendQuote(j, u.q)) { SH.mark('p_quote'); u.q = null; SH.go('job'); SH.flash('ok', 'Quotation sent. The customer has to approve it.'); }
  };
  A.shootAfter = function () { var j = job(); if (j) J.shootAfter(j); };
  A.completeJob = function () { var j = job(); if (j && J.complete(j)) SH.mark('p_complete'); };
  A.pDone = function () {
    var j = job();
    if (j) j.hideP = true;
    U().tab = 'home'; SH.go('home');
  };
  A.dismissNotice = function () { var j = job(); if (j) j.hideP = true; };
})((window.SH = window.SH || {}));
