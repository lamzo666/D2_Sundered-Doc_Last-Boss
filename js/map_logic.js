// map.js

const symbolPositions = {
  "stop": { top: '22.31%', left: '38.64%' },
  "kill": { top: '70.14%', left: '65.96%' },
  "darkness": { top: '39.91%', left: '80.93%' },
  "drink": { top: '1.74%', left: '56.29%' },
  "give": { top: '22.31%', left: '53.32%' },
  "guardian": { top: '45.96%', left: '19.49%' },
  "hive": { top: '29.77%', left: '19.53%' },
  "light": { top: '59.68%', left: '72.98%' },
  "pyramid": { top: '62.75%', left: '2.15%' },
  "savathun": { top: '5.32%', left: '92.50%' },
  "traveller": { top: '87.52%', left: '19.53%' },
  "witness": { top: '30.20%', left: '2.00%' },
  "worm": { top: '7.16%', left: '75.20%' },
  "worship": { top: '70.42%', left: '31.45%' }
};

function showMapHighlights(truthSymbols, lieSymbols, illuminatedSymbols) {
  const overlay = document.getElementById('map-overlay');
  if (!overlay) return;

  overlay.innerHTML = '';

  const truthToShow = truthSymbols.filter(sym => illuminatedSymbols.includes(sym));
  const lieToShow = lieSymbols.filter(sym => !illuminatedSymbols.includes(sym));

  [...truthToShow, ...lieToShow].forEach(symbol => {
    if (!symbolPositions[symbol]) return;

    const img = document.createElement('img');
    img.src = `./img/${symbol}.png`;
    img.className = 'symbol-overlay pulse';
    img.style.top = symbolPositions[symbol].top;
    img.style.left = symbolPositions[symbol].left;
    overlay.appendChild(img);
  });
}

window.showMapHighlights = showMapHighlights;
