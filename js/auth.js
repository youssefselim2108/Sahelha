/* Sign in, create account, one-time code, and technician approval.
   The same screens serve both roles; SH.S.view says which phone session is showing. */
(function (SH) {
  var D = SH.data, esc = SH.esc;

  function role() { return SH.S.view; }
  function isCust() { return role() === 'customer'; }
  function logo() { return '<div class="mark" aria-hidden="true">سهّلها</div>'; }

  /* ---------------- screens ---------------- */
  function signin() {
    var U = SH.U(), c = isCust();
    return SH.scr('signin',
      '<div class="body authbody">' +
        '<div class="brandblock">' + logo() + '<h1 class="wordmark">Sahelha</h1>' +
        '<p class="tagline">' + (c ? 'Home services, made simple' : 'Sahelha for service providers') + '</p>' +
        '<span class="rolechip">' + (c ? 'Customer sign-in' : 'Technician sign-in') + '</span></div>' +
        SH.input('fPhone', 'Mobile number', 'f.phone', U.f.phone, { type: 'tel', mode: 'tel', max: 16, enter: 'signIn' }) +
        SH.input('fCode', 'Verification code', 'f.code', U.f.code, { mode: 'numeric', max: 4, enter: 'signIn' }) +
        (U.err ? '<p class="err" role="alert">' + esc(U.err) + '</p>' : '') +
        SH.btn('Sign in', 'signIn') +
        SH.btn('Create account', 'aGo', { kind: 'ghost', arg: 'signup' }) +
        '<button class="linkbtn" data-act="setView"' + SH.arg(c ? 'provider' : 'customer') + '>' + (c ? "I'm a service provider" : "I'm a customer") + '</button>' +
        '<p class="hint">Sign-in is simulated for the prototype. The ' + (c ? 'demo customer' : 'demo technician') +
        ' number and the code are already filled in.</p>' +
      '</div>');
  }

  function areaChips(multi) {
    var U = SH.U();
    return '<div class="chips">' + D.AREAS.map(function (a) {
      var on = multi ? U.f.areas.indexOf(a) >= 0 : U.f.area === a;
      return SH.chip(a, multi ? 'toggleArea' : 'setArea', a, on);
    }).join('') + '</div>';
  }

  function idTile(key, title) {
    var on = SH.U().f[key];
    return '<button class="idtile' + (on ? ' on' : '') + '" data-act="toggleId" data-arg="' + key + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
      '<span class="idic">' + SH.icon(on ? 'check' : 'upload', 22) + '</span>' +
      '<span class="idtx"><b>' + esc(title) + '</b><small>' + (on ? (key === 'idFront' ? 'id-front.jpg added' : 'id-back.jpg added') : 'Tap to add a sample photo') + '</small></span></button>';
  }

  function signup() {
    var U = SH.U(), c = isCust(), f = U.f;
    var h = '<div class="body">' +
      '<p class="lede">' + (c ? 'Book trusted technicians and keep a record of every visit.' : 'Tell us about your work. We verify every technician before they can take jobs.') + '</p>' +
      SH.input('fName', 'Full name', 'f.name', f.name, { max: 40, ph: c ? 'Nour Hassan' : 'Ahmed Salah' }) +
      SH.input('fSPhone', 'Mobile number', 'f.sPhone', f.sPhone, { type: 'tel', mode: 'tel', max: 16, ph: '010 0123 4567' });
    if (c) {
      h += '<div class="field"><span class="lbl">Your area</span>' + areaChips(false) + '</div>';
    } else {
      h += '<div class="field"><span class="lbl">Your trade</span><div class="chips">' + D.TRADES.map(function (t) {
        return SH.chip(t.label, 'setTrade', t.id, f.trade === t.id);
      }).join('') + '</div><p class="hint left">The prototype\'s customer app lists air-conditioning technicians, so choose that one to receive the demo request.</p></div>' +
      '<div class="field"><span class="lbl">Years of experience</span><div class="stepper">' +
        '<button class="sbtn" data-act="yearsStep" data-arg="-1" aria-label="Fewer years">' + SH.icon('minus', 20) + '</button>' +
        '<output class="sval">' + f.years + (f.years === 1 ? ' year' : ' years') + '</output>' +
        '<button class="sbtn" data-act="yearsStep" data-arg="1" aria-label="More years">' + SH.icon('plus', 20) + '</button></div></div>' +
      '<div class="field"><span class="lbl">Areas you cover</span>' + areaChips(true) + '</div>' +
      '<div class="field"><span class="lbl">Identity check</span>' + idTile('idFront', 'National ID, front') + idTile('idBack', 'National ID, back') +
        '<p class="hint left">Real photos are not collected in the prototype.</p></div>';
    }
    h += (U.err ? '<p class="err" role="alert">' + esc(U.err) + '</p>' : '') + '</div>' +
      SH.foot(SH.btn('Continue', 'startSignup'));
    return SH.scr('signup', SH.hdr('Create account', 'aGo', 'signin') + h);
  }

  function otp() {
    var U = SH.U(), phone = SH.normPhone(U.f.sPhone);
    return SH.scr('otp', SH.hdr('Verify your number', 'aGo', 'signup') +
      '<div class="body">' +
      '<p class="lede">We sent a 4-digit code to <b>' + esc(SH.fmtPhone(phone)) + '</b>.</p>' +
      SH.input('fOtp', 'Verification code', 'f.otp', U.f.otp, { mode: 'numeric', max: 4, enter: 'verifyOtp' }) +
      (U.err ? '<p class="err" role="alert">' + esc(U.err) + '</p>' : '') +
      '<p class="hint left">Simulated: no text message is sent. The code ' + SH.OTP + ' is already filled in.</p></div>' +
      SH.foot(SH.btn(isCust() ? 'Verify and create account' : 'Verify and submit', 'verifyOtp')));
  }

  function pending() {
    var U = SH.U(), a = SH.find(SH.S.accounts, function (x) { return x.id === U.pendingId; });
    if (!a) { return signin(); }
    function row(done, text) {
      return '<li class="' + (done ? 'done' : 'wait') + '"><span class="dot">' + SH.icon(done ? 'check' : 'hourglass', 16) + '</span><span>' + esc(text) + '</span></li>';
    }
    return SH.scr('pending',
      '<div class="body centerbody">' +
        '<div class="bigicon">' + SH.icon('hourglass', 40) + '</div>' +
        '<h2>We are reviewing your documents</h2>' +
        '<p class="lede">Thanks, ' + esc(SH.first(a.name)) + '. Your account becomes active once an admin has checked your identity. This usually takes a short while.</p>' +
        '<ul class="steps">' + row(true, 'Mobile number verified') + row(true, 'National ID added') + row(false, 'Admin review in progress') + '</ul>' +
        SH.note('proto', '<b>Prototype control.</b> In the real product an admin approves you from the web dashboard. Tap below to play the admin.', 'shield') +
        SH.btn('Simulate admin approval', 'approveTech', { kind: 'amber' }) +
        SH.btn('Sign out', 'signOut', { kind: 'ghost' }) +
      '</div>');
  }

  SH.screens.customer.signin = SH.screens.provider.signin = signin;
  SH.screens.customer.signup = SH.screens.provider.signup = signup;
  SH.screens.customer.otp = SH.screens.provider.otp = otp;
  SH.screens.provider.pending = pending;

  /* ---------------- actions ---------------- */
  var A = SH.act;

  A.aGo = function (screen) { SH.go(screen); };

  A.signIn = function () {
    var U = SH.U(), r = role(), c = r === 'customer';
    var phone = SH.normPhone(U.f.phone);
    if (!phone) { U.err = 'Enter a valid Egyptian mobile number, like 0100 123 4567.'; return; }
    var acc = SH.find(SH.S.accounts, function (a) { return a.role === r && a.phone === phone; });
    if (!acc) { U.err = 'No ' + (c ? 'customer' : 'technician') + ' account uses this number. Create one, or use the demo number.'; return; }
    if (String(U.f.code).trim() !== SH.OTP) { U.err = 'That code is not right. The demo code is ' + SH.OTP + '.'; return; }
    SH.mark(c ? 'c_auth' : 'p_auth');
    if (!c && acc.status === 'pending') { U.pendingId = acc.id; SH.go('pending'); return; }
    U.uid = acc.id; U.tab = 'home'; SH.go('home');
    if (!c) SH.mark('p_verified');
  };

  A.startSignup = function () {
    var U = SH.U(), r = role(), f = U.f;
    var name = f.name.trim(), phone = SH.normPhone(f.sPhone);
    if (name.length < 2) { U.err = 'Enter your full name.'; return; }
    if (!phone) { U.err = 'Enter a valid Egyptian mobile number, like 0100 123 4567.'; return; }
    if (SH.S.accounts.some(function (a) { return a.role === r && a.phone === phone; })) { U.err = 'This number already has an account. Go back and sign in instead.'; return; }
    if (r === 'provider') {
      if (!f.areas.length) { U.err = 'Choose at least one area you cover.'; return; }
      if (!f.idFront || !f.idBack) { U.err = 'Add both sides of your national ID to continue.'; return; }
    }
    f.otp = SH.OTP;
    SH.go('otp');
  };

  A.verifyOtp = function () {
    var U = SH.U(), r = role(), f = U.f, S = SH.S;
    if (String(f.otp).trim() !== SH.OTP) { U.err = 'That code is not right. The demo code is ' + SH.OTP + '.'; return; }
    var phone = SH.normPhone(f.sPhone);
    S.n.acc += 1;
    var acc = { id: (r === 'customer' ? 'c' : 'p') + (S.n.acc + 1), role: r, name: f.name.trim(), phone: phone };
    if (r === 'customer') {
      acc.area = f.area;
      S.accounts.push(acc);
      U.uid = acc.id; U.tab = 'home';
      SH.mark('c_auth');
      SH.go('home');
      SH.flash('ok', 'Welcome to Sahelha, ' + SH.first(acc.name) + '.');
    } else {
      acc.trade = f.trade; acc.years = f.years; acc.areas = f.areas.slice(); acc.status = 'pending';
      S.accounts.push(acc);
      U.pendingId = acc.id;
      SH.mark('p_auth');
      SH.go('pending');
    }
    f.name = ''; f.sPhone = '';
  };

  A.approveTech = function () {
    var U = SH.U('provider'), S = SH.S;
    var acc = SH.find(S.accounts, function (a) { return a.id === U.pendingId; });
    if (!acc) return;
    acc.status = 'verified';
    S.n.tech += 1;
    var t = D.newTech(acc, S.n.tech);
    S.techs.push(t);
    acc.techId = t.id;
    U.uid = acc.id; U.pendingId = null; U.tab = 'home';
    SH.mark('p_verified');
    SH.go('home', 'provider');
    SH.flash('ok', 'You are verified. Customers can now find and book you.', 'provider');
  };

  A.signOut = function () {
    var r = role();
    SH.S.ui[r] = SH.newUi(r);
  };

  A.setArea = function (a) { SH.U().f.area = a; };
  A.toggleArea = function (a) {
    var list = SH.U().f.areas, i = list.indexOf(a);
    if (i >= 0) list.splice(i, 1); else list.push(a);
  };
  A.setTrade = function (t) { SH.U().f.trade = t; };
  A.yearsStep = function (d) {
    var f = SH.U().f;
    f.years = Math.min(40, Math.max(1, f.years + Number(d)));
  };
  A.toggleId = function (k) { var f = SH.U().f; f[k] = !f[k]; };
})((window.SH = window.SH || {}));
