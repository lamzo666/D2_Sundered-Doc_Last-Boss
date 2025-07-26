// Full logic.js

const symbols = [
  'guardian', 'hive', 'kill', 'light', 'darkness', 'drink', 'give', 'pyramid', 'savathun', 'stop',
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

let currentSlot = null;
let lockPhase = 0;

function handleSlotClick(slot) {
  if (lockPhase > 0 || slot.classList.contains('locked')) return;
  currentSlot = slot;
  showSymbolPopup(slot);
}

function showSymbolPopup(slot) {
  const popup = document.getElementById('symbolPopup');
  const grid = document.getElementById('popupGrid');
  grid.innerHTML = '';

  const slotName = slot.dataset.position;
  const slotGroup = slotName.includes('left') ? 'left' : 'right';
  const slotIndex = ['left1', 'left2', 'left3', 'right1', 'right2', 'right3'].indexOf(slotName) % 3;

  const usedSymbols = getUsedSymbols();
  const oppositeGroup = slotGroup === 'left' ? 'right' : 'left';
  const currentGroupSymbols = getGroupSymbols(slotGroup);
  const otherGroupSymbols = getGroupSymbols(oppositeGroup);

  let validSymbols = symbols.filter(s => !usedSymbols.includes(s));

  if (slotIndex === 0) {
    const validFirsts = new Set(truthCombinations.concat(lieCombinations).map(c => c[0]));
    validSymbols = validSymbols.filter(sym => validFirsts.has(sym));
  } else {
    const availableCombinations = getAvailableCombinations(slotGroup, currentGroupSymbols);
    validSymbols = validSymbols.filter(sym =>
      availableCombinations.some(c => c[slotIndex] === sym)
    );

    if (availableCombinations.length === 1) {
      const remaining = availableCombinations[0].filter(sym => !currentGroupSymbols.includes(sym));
      if (remaining.length === 1) {
        setSymbolToSlot(slot, remaining[0]);
        updateTruthLieLabel();
        return;
      }
    }
  }

  validSymbols.forEach(sym => {
    const div = document.createElement('div');
    div.className = 'symbol-option';
    div.style.backgroundImage = `url('./img/${sym}.png')`;
    div.onclick = () => {
      setSymbolToSlot(slot, sym);
      popup.style.display = 'none';
      updateTruthLieLabel();
    };
    grid.appendChild(div);
  });

  popup.style.display = 'block';
}

function setSymbolToSlot(slot, symbol) {
  slot.dataset.symbol = symbol;
  slot.style.backgroundImage = `url('./img/${symbol}.png')`;
  slot.classList.remove('active');
  slot.style.boxShadow = 'none';
  document.getElementById('symbolPopup').style.display = 'none';
  updateTruthLieLabel();
}

function getUsedSymbols() {
  return [...document.querySelectorAll('.dial-slot')]
    .map(s => s.dataset.symbol)
    .filter(Boolean);
}

function getGroupSymbols(group) {
  const ids = group === 'left' ? ['left1', 'left2', 'left3'] : ['right1', 'right2', 'right3'];
  return ids.map(id => document.querySelector(`.dial-slot.${id}`).dataset.symbol).filter(Boolean);
}

function getAvailableCombinations(group, currentSymbols) {
  const isOtherGroupTruth = isGroupTruth(group === 'left' ? 'right' : 'left');
  const combinations = isOtherGroupTruth ? lieCombinations : (isGroupLie(group === 'left' ? 'right' : 'left') ? truthCombinations : truthCombinations.concat(lieCombinations));

  return combinations.filter(c => currentSymbols.every(sym => c.includes(sym)));
}

function isGroupTruth(group) {
  const syms = getGroupSymbols(group);
  return syms.length === 3 && truthCombinations.some(c => arraysEqual(c, syms));
}

function isGroupLie(group) {
  const syms = getGroupSymbols(group);
  return syms.length === 3 && lieCombinations.some(c => arraysEqual(c, syms));
}

function arraysEqual(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.slice().sort().every((v, i) => v === b.slice().sort()[i]);
}

function updateTruthLieLabel() {
  const left = getGroupSymbols('left');
  const right = getGroupSymbols('right');

  const isLeftTruth = left.length === 3 && truthCombinations.some(c => arraysEqual(c, left));
  const isRightTruth = right.length === 3 && truthCombinations.some(c => arraysEqual(c, right));
  const isLeftLie = left.length === 3 && lieCombinations.some(c => arraysEqual(c, left));
  const isRightLie = right.length === 3 && lieCombinations.some(c => arraysEqual(c, right));

  const labelLeft = document.getElementById('label-left');
  const labelRight = document.getElementById('label-right');

  if (!labelLeft || !labelRight) return;
  labelLeft.textContent = '';
  labelRight.textContent = '';

  if (isLeftTruth && isRightLie) {
    labelLeft.textContent = 'TRUTH';
    labelRight.textContent = 'LIE';
  } else if (isRightTruth && isLeftLie) {
    labelLeft.textContent = 'LIE';
    labelRight.textContent = 'TRUTH';
  }
}

document.addEventListener('click', e => {
  if (!document.getElementById('symbolPopup').contains(e.target) && e.target.className !== 'dial-slot') {
    document.getElementById('symbolPopup').style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.dial-slot').forEach(slot => {
    slot.addEventListener('click', () => handleSlotClick(slot));
  });
});


window.handleSlotClick = handleSlotClick;
