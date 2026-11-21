/* Inline stroke icons. SH.icon('name', size) returns an <svg> string. */
(function (SH) {
  var P = {
    back: '<path d="M15 5l-7 7 7 7"/>',
    chevron: '<path d="M9 5l7 7-7 7"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    bell: '<path d="M6 9a6 6 0 0112 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 004 0"/>',
    home: '<path d="M4 11l8-6.5 8 6.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="M9.5 15l2 2 3.5-3.5"/>',
    history: '<path d="M4 12a8 8 0 108-8 8 8 0 00-6 2.7L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M12 8v4.5l3 1.8"/>',
    user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20c.8-4 4-6 7.5-6s6.7 2 7.5 6"/>',
    shield: '<path d="M12 3l7 3v5.5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V6l7-3z"/><path d="M8.8 12l2.2 2.2 4.2-4.4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    pin: '<path d="M12 21s7-6 7-11.5a7 7 0 10-14 0C5 15 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    chat: '<path d="M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2h-8l-5 4v-4H5a2 2 0 01-2-2V7a2 2 0 012-2z"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4V8z"/><circle cx="12" cy="13" r="3.5"/>',
    snow: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>',
    drop: '<path d="M12 3.5s6 6.2 6 10.5a6 6 0 01-12 0c0-4.3 6-10.5 6-10.5z"/>',
    bolt: '<path d="M13 3L5.5 13.5H11L10 21l7.5-10.5H12L13 3z"/>',
    washer: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><circle cx="12" cy="13.5" r="4"/><path d="M8 7h2"/>',
    hammer: '<path d="M14 5l5 5-2.5 2.5-5-5L14 5z"/><path d="M12 9L5 16.5 7.5 19l7.5-7.5"/>',
    roller: '<rect x="4" y="4" width="14" height="5" rx="1.5"/><path d="M18 6.5h2v5h-8v3"/><rect x="10.5" y="14.5" width="3" height="6" rx="1"/>',
    bug: '<ellipse cx="12" cy="13.5" rx="4" ry="5.5"/><path d="M12 8V4M9 5.5L10.5 8M15 5.5L13.5 8M8 12H4M16 12h4M8.5 16.5L5 19M15.5 16.5L19 19"/>',
    truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    wrench: '<path d="M14.5 6.5a4 4 0 005 5l-9.5 9.5a2.1 2.1 0 01-3-3l9.5-9.5a4 4 0 00-2-2z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    card: '<rect x="3" y="6" width="18" height="12.5" rx="2.5"/><path d="M3 10.5h18"/>',
    logout: '<path d="M10 4H6a2 2 0 00-2 2v12a2 2 0 002 2h4"/><path d="M15 8l4 4-4 4M9 12h10"/>',
    wallet: '<rect x="4" y="7" width="16" height="12" rx="2.5"/><path d="M4 9.5V7a2 2 0 012-2h10v2"/><circle cx="16" cy="13" r="1.2"/>',
    briefcase: '<rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M9 8V6.5A1.5 1.5 0 0110.5 5h3A1.5 1.5 0 0115 6.5V8M4 13h16"/>',
    star: '<path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1L3.2 9.6l6.1-.8L12 3.2z"/>',
    id: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="9" cy="12" r="2"/><path d="M14 10.5h4M14 13.5h3"/>',
    hourglass: '<path d="M7 4h10M7 20h10"/><path d="M8 4c0 4 4 4.5 4 8s-4 4-4 8M16 4c0 4-4 4.5-4 8s4 4.5 4 8"/>',
    upload: '<path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M5 19h14"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/>'
  };

  SH.icon = function (name, size, cls) {
    size = size || 22;
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  };

  /* Filled / empty star for ratings */
  SH.starSvg = function (on, size) {
    size = size || 26;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + 'M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1L3.2 9.6l6.1-.8L12 3.2z' + '" fill="' + (on ? '#F0A126' : 'none') + '" stroke="' + (on ? '#F0A126' : '#9AA5B5') + '" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  };
})((window.SH = window.SH || {}));
