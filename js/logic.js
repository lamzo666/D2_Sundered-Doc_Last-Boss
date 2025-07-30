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

  const isLeftTruth = truthCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(left));
  const isLeftLie = lieCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(left));
  const isRightTruth = truthCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(right));
  const isRightLie = lieCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(right));

  const leftLabel = document.getElementById('label-left');
  const rightLabel = document.getElementById('label-right');

  if (leftLabel && rightLabel) {
    leftLabel.textContent = isLeftTruth ? 'TRUTH' : isLeftLie ? 'LIE' : '';
    leftLabel.style.color = isLeftTruth ? 'lime' : isLeftLie ? 'red' : '';
    rightLabel.textContent = isRightTruth ? 'TRUTH' : isRightLie ? 'LIE' : '';
    rightLabel.style.color = isRightTruth ? 'lime' : isRightLie ? 'red' : '';
  }
}

function resetDial() {
  document.querySelectorAll('.dial-slot').forEach(slot => {
    slot.style.backgroundImage = '';
    slot.classList.remove('active', 'locked');
    slot.removeAttribute('data-symbol');
    slot.replaceWith(slot.cloneNode(true)); // removes listeners
  });
  document.getElementById('map-overlay').innerHTML = '';
  document.getElementById('lockButton').classList.remove('glow-phase');
  document.getElementById('symbolPopup').style.display = 'none';
  lockPhase = 0;
  updateTruthLieLabel();
  initSlotClicks();
}

function attemptAutoFillGroup(group) {
  const groupSlots = group === 'left' ? ['left1','left2','left3'] : ['right1','right2','right3'];
  const currentSymbols = getSymbolsFromSlots(group).filter(Boolean);
  const usedSymbols = getSymbolsFromSlots('left').concat(getSymbolsFromSlots('right')).filter(Boolean);

  const possibleCombos = truthCombinations.concat(lieCombinations).filter(combo =>
    currentSymbols.every(sym => combo.includes(sym)) &&
    combo.every(sym => !usedSymbols.includes(sym) || currentSymbols.includes(sym))
  );

  if (possibleCombos.length === 1 && currentSymbols.length > 0) {
    const fullCombo = possibleCombos[0];
    groupSlots.forEach((id, i) => {
      const slot = document.querySelector(`.dial-slot.${id}`);
      if (!slot.dataset.symbol) {
        slot.style.backgroundImage = `url('./img/${fullCombo[i]}.png')`;
        slot.dataset.symbol = fullCombo[i];
      }
    });
    updateTruthLieLabel();
  }
}

function openSymbolPopup(slot) {
  const group = slot.dataset.position.startsWith('left') ? 'left' : 'right';
  const slotId = slot.dataset.position;
  const groupSlots = group === 'left' ? ['left1','left2','left3'] : ['right1','right2','right3'];
  const slotIndex = groupSlots.indexOf(slotId);

  const currentSymbols = getSymbolsFromSlots(group).filter(Boolean);
  const usedSymbols = getSymbolsFromSlots('left').concat(getSymbolsFromSlots('right')).filter(Boolean);

  let validSymbols = [];
const possibleCombos = truthCombinations.concat(lieCombinations).filter(combo =>
  currentSymbols.every(sym => combo.includes(sym))
);

  if (slotIndex === 0 && currentSymbols.length === 0) {
    const validStartSymbols = ['pyramid','guardian','traveller','hive','darkness','witness','savathun','light'];
    validSymbols = validStartSymbols.filter(sym => !usedSymbols.includes(sym));
  } else {
    validSymbols = [...new Set(possibleCombos.map(c => c[slotIndex]))].filter(sym =>
      !usedSymbols.includes(sym)
    );
  }

  if (validSymbols.length === 0) return;

  const popup = document.getElementById('symbolPopup');
  const grid = document.getElementById('popupGrid');
  popup.style.display = 'block';
  grid.innerHTML = '';

  validSymbols.forEach(name => {
    const div = document.createElement('div');
    div.className = 'symbol-option';
    div.dataset.name = name;
    div.style.backgroundImage = `url('./img/${name}.png')`;
    div.onclick = () => {
      slot.style.backgroundImage = `url('./img/${name}.png')`;
      slot.dataset.symbol = name;
      popup.style.display = 'none';
      updateTruthLieLabel();
      attemptAutoFillGroup(group);  // Auto-complete rest immediately
    };
    grid.appendChild(div);
  });
}

function initSlotClicks() {
  document.querySelectorAll('.dial-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      if (!slot.classList.contains('locked') && lockPhase === 0) {
        openSymbolPopup(slot);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initSlotClicks);