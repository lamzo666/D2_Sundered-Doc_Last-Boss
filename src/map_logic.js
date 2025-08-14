// src/map_logic.js
// Percent coordinates for each symbol on map.jpg (x = left %, y = top %)
// src/map_logic.js
// NOTE: These coordinates are the ORIGINAL top-left percentages
// from your map (not centered). logic.js normalizes them at runtime.

window.MAP_COORDS = {
  stop:      { top: '22.31%', left: '38.64%' },
  kill:      { top: '70.14%', left: '65.96%' },
  darkness:  { top: '39.91%', left: '80.93%' },
  drink:     { top: '1.74%',  left: '56.29%' },
  give:      { top: '22.31%', left: '53.32%' },
  guardian:  { top: '45.96%', left: '19.49%' },
  hive:      { top: '29.77%', left: '19.53%' },
  light:     { top: '59.68%', left: '72.98%' },
  pyramid:   { top: '62.75%', left: '2.15%'  },
  savathun:  { top: '5.32%',  left: '92.50%' },
  traveller: { top: '87.52%', left: '19.53%' },
  witness:   { top: '30.20%', left: '2.00%'  },
  worm:      { top: '7.16%',  left: '75.20%' },
  worship:   { top: '70.42%', left: '31.45%' }
};

// Optional pretty names for the map labels
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
