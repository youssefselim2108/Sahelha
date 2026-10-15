/* Small HTML helpers shared by every screen. All dynamic text goes through SH.esc(). */
(function (SH) {
  SH.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var esc = SH.esc;

  SH.egp = function (n) { return Number(n).toLocaleString('en-US') + ' EGP'; };
  SH.initials = function (name) {
    var s = String(name || '').trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
    return s || '?';
  };
  SH.first = function (name) { return String(name || '').trim().split(/\s+/)[0] || ''; };
  SH.shortName = function (name) {
    var p = String(name || '').trim().split(/\s+/);
    return p.length > 1 ? p[0] + ' ' + p[1].charAt(0) + '.' : p[0] || '';
  };

  function arg(a) { return a != null ? ' data-arg="' + esc(a) + '"' : ''; }
  SH.arg = arg;

  /* Button: kind = primary | ghost | soft | danger | amber */
  SH.btn = function (label, act, o) {
    o = o || {};
    var cls = 'btn btn-' + (o.kind || 'primary') + (o.sm ? ' btn-sm' : '') + (o.narrow ? ' narrow' : '');
    return '<button class="' + cls + '" data-act="' + act + '"' + arg(o.arg) + (o.disabled ? ' disabled' : '') + '>' +
      (o.icon ? SH.icon(o.icon, 20) : '') + '<span>' + esc(label) + '</span></button>';
  };

  SH.chip = function (label, act, a, on) {
    return '<button class="chip' + (on ? ' on' : '') + '" data-act="' + act + '"' + arg(a) + ' aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(label) + '</button>';
  };

  SH.hdr = function (title, back, backArg) {
    return '<header class="hdr' + (back ? '' : ' root') + '">' +
      (back ? '<button class="iconbtn" data-act="' + back + '"' + arg(backArg) + ' aria-label="Back">' + SH.icon('back', 24) + '</button>' : '') +
      '<h1>' + esc(title) + '</h1></header>';
  };
  SH.foot = function (inner) { return '<footer class="foot">' + inner + '</footer>'; };
  SH.scr = function (key, inner) { return '<section class="scr" data-screen="' + key + '">' + inner + '</section>'; };

  SH.tabbar = function (items, active) {
    return '<nav class="tabs" aria-label="Main">' + items.map(function (t) {
      var on = t.id === active;
      return '<button class="tab' + (on ? ' on' : '') + '" data-act="' + t.act + '"' + arg(t.arg) + (on ? ' aria-current="page"' : '') + '>' +
        SH.icon(t.icon, 24) + '<span>' + esc(t.label) + '</span></button>';
    }).join('') + '</nav>';
  };

  SH.note = function (kind, html, icon) {
    return '<div class="note ' + kind + '">' + (icon ? SH.icon(icon, 18) : '') + '<div>' + html + '</div></div>';
  };

  SH.avatar = function (t, size) {
    return '<span class="avatar ' + (size || '') + '" style="background:' + esc(t.av) + '">' + esc(t.initials) + '</span>';
  };

  SH.input = function (id, label, path, value, o) {
    o = o || {};
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' +
      '<input id="' + id + '" class="input" type="' + (o.type || 'text') + '"' + (o.mode ? ' inputmode="' + o.mode + '"' : '') +
      (o.max ? ' maxlength="' + o.max + '"' : '') + ' autocomplete="off" data-in="' + path + '"' + (o.enter ? ' data-enter="' + o.enter + '"' : '') +
      (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + ' value="' + esc(value) + '"></div>';
  };

  /* ---------- illustrations (no photos in the prototype) ---------- */
  SH.art = {
    before: function () {
      return '<svg class="art" viewBox="0 0 160 110" role="img" aria-label="Illustration: AC unit with a fault">' +
        '<rect width="160" height="110" fill="#E4ECE9"/><rect y="86" width="160" height="24" fill="#D3DEDA"/>' +
        '<rect x="20" y="20" width="120" height="38" rx="8" fill="#FFFFFF" stroke="#8FA39D" stroke-width="1.5"/>' +
        '<rect x="30" y="44" width="100" height="6" rx="3" fill="#C9D6D2"/><circle cx="124" cy="31" r="3" fill="#F2B24A"/>' +
        '<circle cx="132" cy="92" r="11" fill="#F2B24A"/><path d="M132 86v7" stroke="#2B1A00" stroke-width="2.6" stroke-linecap="round"/><circle cx="132" cy="97.5" r="1.5" fill="#2B1A00"/></svg>';
    },
    after: function () {
      return '<svg class="art" viewBox="0 0 160 110" role="img" aria-label="Illustration: the same AC unit, dry and repaired">' +
        '<rect width="160" height="110" fill="#E4ECE9"/><rect y="86" width="160" height="24" fill="#D3DEDA"/>' +
        '<rect x="20" y="20" width="120" height="38" rx="8" fill="#FFFFFF" stroke="#8FA39D" stroke-width="1.5"/>' +
        '<rect x="30" y="44" width="100" height="6" rx="3" fill="#C9D6D2"/><circle cx="124" cy="31" r="3" fill="#2E9E6B"/>' +
        '<circle cx="132" cy="92" r="11" fill="#2E9E6B"/><path d="M126.5 92l4 4 7-7.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    },
    unit: function (size) {
      size = size || 44;
      return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 40 40" aria-hidden="true"><rect x="4" y="9" width="32" height="14" rx="4" fill="#fff" stroke="#35746E" stroke-width="1.6"/><path d="M9 18h22" stroke="#35746E" stroke-width="1.6" stroke-linecap="round"/><path d="M12 28v4M20 28v6M28 28v4" stroke="#35746E" stroke-width="1.6" stroke-linecap="round"/></svg>';
    }
  };
})((window.SH = window.SH || {}));
