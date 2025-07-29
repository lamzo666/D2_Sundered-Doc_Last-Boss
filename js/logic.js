// logic.js — Instant auto-fill when one combination remains

const allSymbols = [
  'guardian', 'hive', 'kill', 'light', 'darkness',
  'drink', 'give', 'pyramid', 'savathun', 'stop',
  'traveller', 'witness', 'worm', 'worship'
];

const truthCombinations = [
  ['pyramid','drink','worm'], ['pyramid','kill','worm'], ['pyramid','stop','savathun'], ['pyramid','give','darkness'],
  ['guardian','worship','light'], ['guardian','worship','traveller'], ['guardian','kill','witness'], ['traveller','give','guardian'],
  ['traveller','give','light'], ['hive','worship','darkness'], ['hive','worship','worm'], ['darkness','stop','savathun']
];

const lieCombinations = [
  ['hive','kill','worm'], ['hive','kill','light'], ['hive','give','darkness'], ['hive','stop','witness'],
  ['traveller','kill','guardian'], ['traveller','drink','worm'], ['traveller','give','hive'], ['traveller','stop','witness'],
  ['pyramid','stop','witness'], ['witness','drink','light'], ['witness','kill','pyramid'], ['guardian','worship','witness'],
  ['guardian','kill','traveller'], ['savathun','drink','darkness'], ['savathun','stop','darkness'], ['light','stop','savathun']
];

let lockPhase = 0;

function getSymbolsFromSlots(group) {
  const ids = group === 'left' ? ['left1','left2','left3'] : ['right1','right2','right3'];
  return ids.map(id => {
    const el = document.querySelector(`.dial-slot.${id}`);
    return el.dataset.symbol || null;
  });
}

function updateTruthLieLabel() {
  const left = getSymbolsFromSlots('left').sort();
  const right = getSymbolsFromSlots('right').sort();

  const isLeftTruth = truthCombinations.some(c => arraysEqual(c, left));
  const isLeftLie = lieCombinations.some(c => arraysEqual(c, left));
  const isRightTruth = truthCombinations.some(c => arraysEqual(c, right));
  const isRightLie = lieCombinations.some(c => arraysEqual(c, right));

  const labelLeft = document.getElementById('label-left');
  const labelRight = document.getElementById('label-right');

  if (labelLeft && labelRight) {
    labelLeft.textContent = isLeftTruth ? 'TRUTH' : isLeftLie ? 'LIE' : '';
    labelLeft.style.color = isLeftTruth ? 'lime' : isLeftLie ? 'red' : '';
    labelRight.textContent = isRightTruth ? 'TRUTH' : isRightLie ? 'LIE' : '';
    labelRight.style.color = isRightTruth ? 'lime' : isRightLie ? 'red' : '';
  }
}

function arraysEqual(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
         a.slice().sort().every((v, i) => v === b.slice().sort()[i]);
}

function openSymbolPopup(slot) {
  if (!slot || slot.classList.contains('locked') || lockPhase > 0) return;

  const group = slot.dataset.position.startsWith('left') ? 'left' : 'right';
  const slotId = slot.dataset.position;
  const groupSlots = group === 'left' ? ['left1','left2','left3'] : ['right1','right2','right3'];
  const slotIndex = groupSlots.indexOf(slotId);
  const currentSymbols = getSymbolsFromSlots(group).filter(Boolean);
  const usedSymbols = getSymbolsFromSlots('left').concat(getSymbolsFromSlots('right')).filter(Boolean);

  const allCombos = truthCombinations.concat(lieCombinations).filter(combo =>
    currentSymbols.every(sym => combo.includes(sym)) &&
    combo.every(sym => !usedSymbols.includes(sym) || currentSymbols.includes(sym))
  );

  // Limit slot 1 to specific valid starters
  const validStart = ['pyramid','guardian','traveller','hive','darkness','witness','savathun','light'];
  let validSymbols = slotIndex === 0 && currentSymbols.length === 0
    ? validStart.filter(sym => !usedSymbols.includes(sym))
    : [...new Set(allCombos.map(c => c[slotIndex]))].filter(sym => !usedSymbols.includes(sym));

  // Auto-fill entire group if only one combo remains
  if (allCombos.length === 1) {
    const fullCombo = allCombos[0];
    groupSlots.forEach((id, idx) => {
      const s = document.querySelector(`.dial-slot.${id}`);
      s.style.backgroundImage = `url('./img/${fullCombo[idx]}.png')`;
      s.dataset.symbol = fullCombo[idx];
    });
    updateTruthLieLabel();
    return;
  }

  // Auto-set single option directly
  if (validSymbols.length === 1) {
    slot.style.backgroundImage = `url('./img/${validSymbols[0]}.png')`;
    slot.dataset.symbol = validSymbols[0];
    updateTruthLieLabel();
    return;
  }

  // Show selection popup
  const popup = document.getElementById('symbolPopup');
  const grid = document.getElementById('popupGrid');
  popup.style.display = 'block';
  grid.innerHTML = '';

  validSymbols.forEach(name => {
    const div = document.createElement('div');
    div.className = 'symbol-option';
    div.style.backgroundImage = `url('./img/${name}.png')`;
    div.onclick = () => {
      slot.style.backgroundImage = `url('./img/${name}.png')`;
      slot.dataset.symbol = name;
      popup.style.display = 'none';
      updateTruthLieLabel();
    };
    grid.appendChild(div);
  });
}

window.openSymbolPopup = openSymbolPopup;