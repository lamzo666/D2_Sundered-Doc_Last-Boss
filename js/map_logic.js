// map_logic.js

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

function showMapHighlights(truthToVisit, lieToVisit, allIlluminated) {
  const overlay = document.getElementById('map-overlay');
  overlay.innerHTML = '';

  const addSymbol = (name, className) => {
    if (!symbolPositions[name]) return;
    const img = document.createElement('img');
    img.className = `symbol-overlay ${className}`;
    img.src = `./img/${name}.png`;
    img.style.top = symbolPositions[name].top;
    img.style.left = symbolPositions[name].left;
    img.style.position = 'absolute';
    img.style.width = '5%';
    img.style.aspectRatio = '1 / 1';
    img.style.pointerEvents = 'none';
    img.style.zIndex = '2';
    overlay.appendChild(img);
  };

  truthToVisit.forEach(sym => addSymbol(sym, 'pulse'));
  lieToVisit.forEach(sym => addSymbol(sym, 'pulse'));
}

window.showMapHighlights = showMapHighlights;

// Attach click event to each dial slot
window.addEventListener('DOMContentLoaded', () => {
  const dialSlots = document.querySelectorAll('.dial-slot');
  dialSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      if (!slot.classList.contains('locked')) {
        openSymbolPopup(slot);
      }
    });
  });
});
