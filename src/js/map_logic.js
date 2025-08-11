// src/js/map_logic.js

// === Map anchor positions (percentages relative to the map image) ===
const symbolPositions = {
  stop:       { top: '22.31%', left: '38.64%' },
  kill:       { top: '70.14%', left: '65.96%' },
  darkness:   { top: '39.91%', left: '80.93%' },
  drink:      { top: '1.74%',  left: '56.29%' },
  give:       { top: '22.31%', left: '53.32%' },
  guardian:   { top: '45.96%', left: '19.49%' },
  hive:       { top: '29.77%', left: '19.53%' },
  light:      { top: '59.68%', left: '72.98%' },
  pyramid:    { top: '62.75%', left: '2.15%'  },
  savathun:   { top: '5.32%',  left: '92.50%' },
  traveller:  { top: '87.52%', left: '19.53%' },
  witness:    { top: '30.20%', left: '2.00%'  },
  worm:       { top: '7.16%',  left: '75.20%' },
  worship:    { top: '70.42%', left: '31.45%' }
};

// Utility: normalize names so comparisons are case-insensitive
const norm = s => (s || '').toString().trim().toLowerCase();

/**
 * Render map highlights.
 *  - truthToVisit: TRUTH-side symbols that were illuminated → green glow (must interact)
 *  - lieToVisit:   LIE-side symbols that were NOT illuminated → red glow (must interact)
 */
function showMapHighlights(truthToVisit = [], lieToVisit = []) {
  const overlay = document.getElementById('map-overlay');
  if (!overlay) return;

  // Clear previous markers
  overlay.innerHTML = '';

  // Respect the user's "Show symbol names" preference (default: true on first visit)
  const showNames = (localStorage.getItem('showSymbolNames') ?? 'true') === 'true';

  // Small helper to place one symbol with wrapper+label
  const addSymbol = (rawName, kind /* 'truth' | 'lie' */) => {
    const name = norm(rawName);
    const pos  = symbolPositions[name];
    if (!pos) return; // unknown name → skip safely

    // Wrapper (positioned box for image + label)
    const wrap = document.createElement('div');
    wrap.className = `symbol-wrap ${kind}`; // CSS adds green/red glow to the image
    wrap.style.top  = pos.top;
    wrap.style.left = pos.left;

    // Image
    const img = document.createElement('img');
    img.className = 'symbol-overlay pulse';
    img.src = `/img/${name}.png`; // absolute path to match your other assets
    img.alt = name;

    // Label (all caps), visibility follows the toggle
    const label = document.createElement('div');
    label.className = 'map-label';
    label.textContent = name.toUpperCase();
    label.style.display = showNames ? 'block' : 'none';

    wrap.appendChild(img);
    wrap.appendChild(label);
    overlay.appendChild(wrap);
  };

  // Draw markers
  truthToVisit.forEach(sym => addSymbol(sym, 'truth'));
  lieToVisit.forEach(sym => addSymbol(sym, 'lie'));
}

// Expose to the rest of the app (logic.js calls this after Lock)
window.showMapHighlights = showMapHighlights;

/* ------------------------------------------------------------------ */
/* Optional: if you ever need to refresh label visibility on the map
   after user toggles “Show symbol names” without redrawing the markers */
window.applyMapNamesVisibility = function applyMapNamesVisibility(show) {
  document.querySelectorAll('.map-label').forEach(el => {
    el.style.display = show ? 'block' : 'none';
  });
};
