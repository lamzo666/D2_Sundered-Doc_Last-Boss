// src/map_logic.js
// Percent coordinates for each symbol on map.jpg (x = left %, y = top %)
window.MAP_COORDS = {
  stop:      { x: 38.64, y: 22.31 },
  kill:      { x: 65.96, y: 70.14 },
  darkness:  { x: 80.93, y: 39.91 },
  drink:     { x: 56.29, y:  1.74 },
  give:      { x: 53.32, y: 22.31 },
  guardian:  { x: 19.49, y: 45.96 },
  hive:      { x: 19.53, y: 29.77 },
  light:     { x: 72.98, y: 59.68 },
  pyramid:   { x:  2.15, y: 62.75 },
  savathun:  { x: 92.50, y:  5.32 },
  traveller: { x: 19.53, y: 87.52 },
  witness:   { x:  2.00, y: 30.20 },
  worm:      { x: 75.20, y:  7.16 },
  worship:   { x: 31.45, y: 70.42 }
};

// Pretty names for map labels
window.SYMBOL_NAME_MAP = {
  stop: 'STOP',
  kill: 'KILL',
  darkness: 'DARKNESS',
  drink: 'DRINK',
  give: 'GIVE',
  guardian: 'GUARDIAN',
  hive: 'HIVE',
  light: 'LIGHT',
  pyramid: 'PYRAMID',
  savathun: 'SAVATHUN',
  traveller: 'TRAVELLER',
  witness: 'WITNESS',
  worm: 'WORM',
  worship: 'WORSHIP'
};

// === Label placement preferences ===
// Put symbol names that should be ABOVE on desktop/mobile here.
// Everything else will be BELOW.
// Tip: tweak these lists to your liking.
const LABEL_PREFS = {
  defaultDesktop: 'below',
  defaultMobile:  'below',
  desktopAbove:   ['hive', 'drink', 'witness', 'pyramid', 'worm'],
  mobileAbove:    ['hive', 'drink', 'witness', 'pyramid', 'worm']
};

function isMobile() {
  // Use same breakpoint as your mobile media query
  return window.matchMedia('(max-width: 640px)').matches;
}

function applyLabelPlacement() {
  const aboveSet = new Set(isMobile() ? LABEL_PREFS.mobileAbove : LABEL_PREFS.desktopAbove);
  const defaultIsAbove = (isMobile() ? LABEL_PREFS.defaultMobile : LABEL_PREFS.defaultDesktop) === 'above';

  document.querySelectorAll('.symbol-wrap').forEach(wrap => {
    const sym = wrap.dataset.symbol;
    const shouldBeAbove = aboveSet.has(sym) || defaultIsAbove;

    wrap.classList.toggle('label-above', shouldBeAbove);
    wrap.classList.toggle('label-below', !shouldBeAbove);
  });
}

function showMapHighlights(truthToVisit = [], lieToVisit = []) {
  const overlay = document.getElementById('map-overlay');
  if (!overlay) return;
  overlay.innerHTML = '';

  const addSymbol = (name, kind /* 'truth' | 'lie' */) => {
    const pos = symbolPositions[name];
    if (!pos) return;

    // wrapper at map coordinates
    const wrap = document.createElement('div');
    wrap.className = `symbol-wrap ${kind}`;
    wrap.dataset.symbol = name;
    wrap.style.top = pos.top;
    wrap.style.left = pos.left;

    // icon image (pulses via CSS)
    const img = document.createElement('img');
    img.className = 'symbol-overlay';
    img.src = `img/${name}.png`;
    img.alt = name;
    wrap.appendChild(img);

    // static label (visibility is toggled by logic.js checkbox)
    const label = document.createElement('div');
    label.className = 'map-label';
    label.textContent = name.toUpperCase();
    wrap.appendChild(label);

    overlay.appendChild(wrap);
  };

  truthToVisit.forEach(sym => addSymbol(sym, 'truth'));
  lieToVisit.forEach(sym => addSymbol(sym, 'lie'));

  // initial placement + keep synced on viewport changes
  applyLabelPlacement();
}

// Keep label placement responsive to viewport changes
window.addEventListener('resize', applyLabelPlacement);
window.addEventListener('orientationchange', applyLabelPlacement);

// Expose to the rest of the app
window.showMapHighlights = showMapHighlights;
