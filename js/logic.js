// logic.js

const symbolOptions = [
  "guardian", "hive", "kill", "light", "darkness",
  "drink", "give", "pyramid", "savathun", "stop",
  "traveller", "witness", "worm", "worship"
];

const truthCombinations = [
  ["pyramid", "drink", "worm"], ["pyramid", "kill", "worm"],
  ["pyramid", "stop", "savathun"], ["pyramid", "give", "darkness"],
  ["guardian", "worship", "light"], ["guardian", "worship", "traveller"],
  ["guardian", "kill", "witness"], ["traveller", "give", "guardian"],
  ["traveller", "give", "light"], ["hive", "worship", "darkness"],
  ["hive", "worship", "worm"], ["darkness", "stop", "savathun"]
];

const lieCombinations = [
  ["hive", "kill", "worm"], ["hive", "kill", "light"],
  ["hive", "give", "darkness"], ["hive", "stop", "witness"],
  ["traveller", "kill", "guardian"], ["traveller", "drink", "worm"],
  ["traveller", "give", "hive"], ["traveller", "stop", "witness"],
  ["pyramid", "stop", "witness"], ["witness", "drink", "light"],
  ["witness", "kill", "pyramid"], ["guardian", "worship", "witness"],
  ["guardian", "kill", "traveller"], ["savathun", "drink", "darkness"],
  ["savathun", "stop", "darkness"], ["light", "stop", "savathun"]
];

let selectedSymbols = {
  left: [null, null, null],
  right: [null, null, null]
};

function equalArray(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function getValidSymbols(group, index) {
  const otherGroup = group === 'left' ? 'right' : 'left';
  const currentGroupSymbols = selectedSymbols[group].filter(Boolean);
  const otherGroupSymbols = selectedSymbols[otherGroup].filter(Boolean);

  const allCurrent = [...currentGroupSymbols, ...otherGroupSymbols];

  if (index === 0) {
    return ["guardian", "hive", "traveller", "pyramid", "darkness", "savathun", "witness"].filter(sym => !allCurrent.includes(sym));
  }

  const pool = [...truthCombinations, ...lieCombinations];
  const possible = new Set();
  const current = selectedSymbols[group].filter(Boolean);

  const validCombos = pool.filter(combo =>
    [...current, ...otherGroupSymbols].every(sym => combo.includes(sym))
  );

  validCombos.forEach(combo => {
    combo.forEach(sym => {
      if (!current.includes(sym) && !otherGroupSymbols.includes(sym)) {
        possible.add(sym);
      }
    });
  });

  return Array.from(possible);
}

function checkCombinations() {
  const truthLabel = document.getElementById('truthLieLabel');
  const overlay = document.getElementById('map-overlay');
  overlay.innerHTML = '';

  const left = [...selectedSymbols.left];
  const right = [...selectedSymbols.right];

  const isLeftTruth = truthCombinations.some(c => equalArray(c.sort(), left.sort()));
  const isRightTruth = truthCombinations.some(c => equalArray(c.sort(), right.sort()));
  const isLeftLie = lieCombinations.some(c => equalArray(c.sort(), left.sort()));
  const isRightLie = lieCombinations.some(c => equalArray(c.sort(), right.sort()));

  let truth = [], lie = [];

  if (isLeftTruth && isRightLie) {
    truth = left;
    lie = right;
    truthLabel.innerHTML = '<div style="text-align:center;color:#00ff00;">TRUTH</div><div></div><div style="text-align:center;color:#ff4444;">LIE</div>';
  } else if (isRightTruth && isLeftLie) {
    truth = right;
    lie = left;
    truthLabel.innerHTML = '<div style="text-align:center;color:#ff4444;">LIE</div><div></div><div style="text-align:center;color:#00ff00;">TRUTH</div>';
  } else {
    truthLabel.innerHTML = '';
    alert('No valid Truth/Lie match');
    return;
  }

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

  [...truth, ...lie].forEach(name => {
    const img = document.createElement('img');
    img.className = 'symbol-overlay';
    img.src = `./img/${name}.png`;

    const pos = symbolPositions[name];
    if (!pos) return;

    img.style.position = 'absolute';
    img.style.top = pos.top;
    img.style.left = pos.left;
    img.style.width = '5%';
    img.style.aspectRatio = '1 / 1';
    img.style.pointerEvents = 'none';
    img.style.zIndex = '2';
    if (truth.includes(name)) img.classList.add('pulse');

    overlay.appendChild(img);
  });
}

function createPopupSymbols(targetSlot) {
  const popup = document.getElementById('symbolPopup');
  const grid = document.getElementById('popupGrid');
  grid.innerHTML = '';

  const group = targetSlot.dataset.position.startsWith('left') ? 'left' : 'right';
  const index = parseInt(targetSlot.dataset.position.slice(-1)) - 1;

  const options = getValidSymbols(group, index);

  const used = [...selectedSymbols.left, ...selectedSymbols.right].filter(Boolean);
  const availableSymbols = options.filter(sym => !used.includes(sym));

  availableSymbols.forEach(sym => {
    const div = document.createElement('div');
    div.className = 'symbol-option';
    div.style.backgroundImage = `url('./img/${sym}.png')`;
    div.addEventListener('click', () => {
      selectedSymbols[group][index] = sym;
      targetSlot.style.backgroundImage = `url('./img/${sym}.png')`;
      popup.style.display = 'none';
      grid.innerHTML = '';

      const current = selectedSymbols[group].filter(Boolean);
      const matching = [...truthCombinations, ...lieCombinations].filter(c => current.every(s => c.includes(s)));
      if (current.length === 2 && matching.length === 1) {
        const missing = matching[0].find(s => !current.includes(s));
        const idx = selectedSymbols[group].findIndex(s => !s);
        if (missing && idx !== -1) {
          selectedSymbols[group][idx] = missing;
          const autoSlot = document.querySelector(`.dial-slot.${group}${idx + 1}`);
          autoSlot.style.backgroundImage = `url('./img/${missing}.png')`;
        }
      }
    });
    grid.appendChild(div);
  });

  popup.style.display = 'block';
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.dial-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const group = slot.dataset.position.startsWith('left') ? 'left' : 'right';
      const index = parseInt(slot.dataset.position.slice(-1)) - 1;
      if (!selectedSymbols[group][index]) {
        createPopupSymbols(slot);
      } else {
        slot.classList.toggle('active');
        slot.style.boxShadow = slot.classList.contains('active') ? '0 0 12px 6px yellow' : 'none';
      }
    });
  });

  document.addEventListener('click', (e) => {
    const popup = document.getElementById('symbolPopup');
    if (popup.style.display === 'block' && !popup.contains(e.target) && !e.target.classList.contains('dial-slot')) {
      popup.style.display = 'none';
    }
  });
});
