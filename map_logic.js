// Map symbol positions (percentages match your map.jpg)
const symbolPositions = {
  "stop":      { top: '22.31%', left: '38.64%' },
  "kill":      { top: '70.14%', left: '65.96%' },
  "darkness":  { top: '39.91%', left: '80.93%' },
  "drink":     { top: '1.74%',  left: '56.29%' },
  "give":      { top: '22.31%', left: '53.32%' },
  "guardian":  { top: '45.96%', left: '19.49%' },
  "hive":      { top: '29.77%', left: '19.53%' },
  "light":     { top: '59.68%', left: '72.98%' },
  "pyramid":   { top: '62.75%', left: '2.15%'  },
  "savathun":  { top: '5.32%',  left: '92.50%' },
  "traveller": { top: '87.52%', left: '19.53%' },
  "witness":   { top: '30.20%', left: '2.00%'  },
  "worm":      { top: '7.16%',  left: '75.20%' },
  "worship":   { top: '70.42%', left: '31.45%' }
};

/**
 * truthToVisit: TRUTH group symbols that were illuminated (must visit)
 * lieToVisit:   LIE group symbols that were not illuminated (must visit)
 */
function showMapHighlights(truthToVisit, lieToVisit) {
  const overlay = document.getElementById('map-overlay');
  overlay.innerHTML = '';

  const addSymbol = (name, groupClass) => {
    if (!symbolPositions[name]) return;

    // wrapper so we can put the label under the image
    const wrap = document.createElement('div');
    wrap.className = `symbol-wrap pulse ${groupClass}`;
    wrap.style.top = symbolPositions[name].top;
    wrap.style.left = symbolPositions[name].left;

    const img = document.createElement('img');
    img.className = 'symbol-overlay';
    img.src = `img/${name}.png`;       // relative path (no leading slash)
    img.alt = name;
    wrap.appendChild(img);

    // label (respects the symbol name toggle via logic.js)
    const label = document.createElement('div');
    label.className = 'map-label';
    label.textContent = name.toUpperCase();
    wrap.appendChild(label);

    overlay.appendChild(wrap);
  };

  truthToVisit.forEach(sym => addSymbol(sym, 'truth'));
  lieToVisit.forEach(sym => addSymbol(sym, 'lie'));
}

window.showMapHighlights = showMapHighlights;
