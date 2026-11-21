/* The page around the phone: top bar, intro, demo checklist, the phone frame, and the render loop. */
(function (SH) {
  var esc = SH.esc;

  var COPY = {
    customer: {
      h1: 'Fix it at home, with a price you approve first.',
      lead: 'Describe what is broken, compare verified technicians, then follow the visit from booking to payment. Nothing is charged until you have seen the quotation and the finished work.',
      more: 'Every tap here changes the same booking that the technician sees. When the app asks you to wait for the technician, switch to Technician view at the top of the page and play that side.',
      done: 'Customer journey finished. Try the Technician view, or restart the demo.'
    },
    provider: {
      h1: 'Take the job, quote it honestly, get paid.',
      lead: 'Receive a request, accept it, drive over and document the work with photos. Send a quotation the customer has to approve, finish the job and watch the payment land in Earnings.',
      more: 'Requests come from the Customer view. Book a technician there first and the request will be waiting here. New technician accounts start as pending until an admin approves them.',
      done: 'Technician journey finished. Check the Customer view to see the same job from the other side.'
    }
  };
  var CHECK = {
    customer: [
      ['c_auth', 'Sign in, or create a customer account'],
      ['c_request', 'Describe an air-conditioning problem'],
      ['c_ai', 'Read the AI recommendation'],
      ['c_compare', 'Compare technicians and open a profile'],
      ['c_book', 'Pick a time and confirm the booking'],
      ['c_accept', 'Switch to Technician view and accept the request'],
      ['c_quote', 'Back here, approve the technician\'s quotation'],
      ['c_pay', 'Review the finished work, approve the cost and pay'],
      ['c_rate', 'Rate the technician and open your history']
    ],
    provider: [
      ['p_auth', 'Sign in, or create a technician account'],
      ['p_verified', 'Get verified (new accounts wait for admin approval)'],
      ['p_received', 'Open an incoming request'],
      ['p_accept', 'Accept the job'],
      ['p_start', 'Drive over, arrive, take before photos and start'],
      ['p_quote', 'Send a quotation for the customer to approve'],
      ['p_complete', 'Take after photos and complete the job'],
      ['p_paid', 'See the payment in Earnings']
    ]
  };
  var ROLE = { customer: 'Customer', provider: 'Technician' };
  var AUTH = { signin: 1, signup: 1, otp: 1, pending: 1 };

  function clock(d) { return ((d.getHours() % 12) || 12) + ':' + SH.pad(d.getMinutes()); }

  /* ---- the phone's current screen ---- */
  function screenHtml() {
    var S = SH.S, v = S.view, U = SH.U(), table = SH.screens[v], name = U.screen;
    if (!U.uid && !AUTH[name]) { name = 'signin'; U.screen = name; }
    if (U.uid && AUTH[name]) { name = 'home'; U.screen = name; }
    var fn = table[name];
    if (!fn) { name = U.uid ? 'home' : 'signin'; U.screen = name; fn = table[name]; }
    try {
      return fn();
    } catch (err) {
      if (window.console) console.error(err);
      return '<section class="scr"><div class="body centerbody"><h2>Something went wrong</h2>' +
        '<p class="lede">The prototype hit an unexpected state.</p>' + SH.btn('Restart demo', 'restart') + '</div></section>';
    }
  }

  function pageHtml() {
    var S = SH.S, v = S.view, c = COPY[v], list = CHECK[v], U = SH.U(), acct = SH.acct(v);
    var n = list.filter(function (k) { return S.progress[k[0]]; }).length;

    var top = '<header class="topbar"><div class="brand"><span class="logo" aria-hidden="true">سهّلها</span>' +
      '<div class="brandtx"><b>Sahelha</b><small>Home services, made simple</small></div></div>' +
      '<div class="toggle" role="group" aria-label="Prototype view">' +
      ['customer', 'provider'].map(function (r) {
        return '<button class="seg" data-act="setView" data-arg="' + r + '" aria-pressed="' + (v === r) + '">' + ROLE[r] + ' view</button>';
      }).join('') + '</div>' +
      '<button class="restart" data-act="restart">Restart demo</button></header>';

    var intro = '<section class="intro"><span class="tagchip">Sahelha · Frontend prototype</span>' +
      '<h1>' + esc(c.h1) + '</h1><p class="lead">' + esc(c.lead) + '</p><p class="more">' + esc(c.more) + '</p>' +
      '<p class="fine">This page is a frontend prototype. The data is made up, nothing leaves your browser, and sign-in uses a simulated one-time code.</p></section>';

    var check = '<section class="check" aria-labelledby="ckh"><div class="check-h"><h2 id="ckh">Demo checklist</h2><span class="count" aria-live="polite">' + n + ' of ' + list.length + '</span></div>' +
      '<p class="sub">Ticks itself as you use the phone. There is nothing to fill in.</p><ol>' +
      list.map(function (k) {
        var on = !!S.progress[k[0]];
        return '<li class="ck' + (on ? ' done' : '') + '"><span class="tick">' + (on ? SH.icon('check', 14) : '') + '</span><span>' + esc(k[1]) + (on ? '<span class="sr"> (done)</span>' : '') + '</span></li>';
      }).join('') + '</ol>' + (n === list.length ? '<p class="alldone">' + esc(c.done) + '</p>' : '') + '</section>';

    var who = acct
      ? 'Signed in as <b>' + esc(acct.name) + '</b> · ' + ROLE[v]
      : (U.screen === 'pending' ? 'Waiting for approval · <b>' + ROLE[v] + '</b>' : 'Not signed in · <b>' + ROLE[v] + ' view</b>');
    var phone = '<section class="phonecol" aria-label="Phone preview"><div class="who"><span>' + who + '</span></div>' +
      '<div class="phone"><div class="phone-in"><div class="sb"><span class="sb-time">' + clock(new Date()) + '</span><span class="sb-role">' + ROLE[v] + ' app</span></div>' +
      '<div class="app">' + screenHtml() + '</div></div></div></section>';

    return '<div class="page">' + top + '<main class="stage">' + intro + check + phone + '</main>' +
      '<footer class="pagefoot">Prototype for the Sahelha graduation project. Sample data only.</footer></div>';
  }

  /* ---- render with DOM diffing so typing, focus and scroll survive ---- */
  var lastSig = null, lastChat = null;
  SH.render = function () {
    var root = document.getElementById('root');
    var next = document.createElement('div');
    next.innerHTML = pageHtml();
    morphdom(root, next, { childrenOnly: true });

    var U = SH.U(), sig = SH.S.view + '|' + U.screen + '|' + (U.uid || '');
    var changed = sig !== lastSig;
    lastSig = sig;
    if (changed) {
      var b = root.querySelector('.phone .body');
      if (b) b.scrollTop = 0;
    }
    var cb = root.querySelector('.chatbody');
    if (cb) {
      var count = cb.getAttribute('data-chat');
      if (changed || count !== lastChat) cb.scrollTop = cb.scrollHeight;
      lastChat = count;
    } else {
      lastChat = null;
    }
  };

  SH.tickClock = function () {
    var el = document.querySelector('.sb-time');
    if (el) el.textContent = clock(new Date());
  };

  /* ---- page-level actions ---- */
  SH.act.setView = function (role) { if (role === 'customer' || role === 'provider') SH.S.view = role; };
  SH.act.restart = function () { SH.reset(); lastSig = null; };
})((window.SH = window.SH || {}));
