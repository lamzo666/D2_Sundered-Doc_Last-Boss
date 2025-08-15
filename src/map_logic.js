// src/map_logic.js
// Your original TOP/LEFT percentages (top-left anchor) for map.jpg.
// We keep them exactly as-is; CSS now nudges pins down with --pin-y-nudge.
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

// Shown names
window.SYMBOL_NAME_MAP = {
  stop:'STOP', kill:'KILL', darkness:'DARKNESS', drink:'DRINK', give:'GIVE',
  guardian:'GUARDIAN', hive:'HIVE', light:'LIGHT', pyramid:'PYRAMID',
  savathun:'SAVATHUN', traveller:'TRAVELLER', witness:'WITNESS',
  worm:'WORM', worship:'WORSHIP'
};

// === Label placement preferences ===
// Everything not listed uses the defaults (below/below as requested).
const LABEL_PREFS = {
  defaultDesktop: 'below',
  defaultMobile:  'below',
  desktopAbove:   ['hive','drink','witness','pyramid','worm'],
  mobileAbove:    ['hive','drink','witness','pyramid','worm']
};

function isMobile() {
  // Same breakpoint as your CSS mobile rules
  return window.matchMedia('(max-width: 640px)').matches;
}

function applyLabelPlacement() {
  const aboveList = isMobile() ? LABEL_PREFS.mobileAbove : LABEL_PREFS.desktopAbove;
  const defaultAbove = (isMobile() ? LABEL_PREFS.defaultMobile : LABEL_PREFS.defaultDesktop) === 'above';
  const aboveSet = new Set(aboveList);

  document.querySelectorAll('.symbol-wrap').forEach(wrap => {
    const sym = wrap.dataset.symbol;
    const placeAbove = aboveSet.has(sym) || defaultAbove;
    wrap.classList.toggle('label-above', placeAbove);
    wrap.classList.toggle('label-below', !placeAbove);
  });
}

// Build pins for the given groups
function showMapHighlights(truthToVisit = [], lieToVisit = [], _force = false) {
  const overlay = document.getElementById('map-overlay');
  if (!overlay) return;
  overlay.innerHTML = '';

  const addPin = (name, kind /* 'truth' | 'lie' */) => {
    const pos = window.MAP_COORDS[name];
    if (!pos) return;

    // Wrapper at top-left percentage with a small downward nudge via calc()
    const wrap = document.createElement('div');
    wrap.className = `symbol-wrap ${kind}`;
    wrap.dataset.symbol = name;
    wrap.style.left = pos.left;
    wrap.style.top  = `calc(${pos.top} + var(--pin-y-nudge))`;

    // Pin image (pulses via CSS)
    const img = document.createElement('img');
    img.className = 'symbol-overlay';
    img.src = `img/${name}.png`;
    img.alt = name;
    wrap.appendChild(img);

    // Label (visibility still controlled by your checkbox logic)
    const label = document.createElement('div');
    label.className = 'map-label';
    label.textContent = (window.SYMBOL_NAME_MAP[name] || name).toUpperCase();
    wrap.appendChild(label);

    overlay.appendChild(wrap);
  };

  truthToVisit.forEach(s => addPin(s, 'truth'));
  lieToVisit.forEach(s => addPin(s, 'lie'));

  applyLabelPlacement();
}

// Keep labels responsive
window.addEventListener('resize', applyLabelPlacement);
window.addEventListener('orientationchange', applyLabelPlacement);

// Expose for logic.js
window.showMapHighlights = showMapHighlights;
