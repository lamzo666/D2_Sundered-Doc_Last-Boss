console.log('✅ logic.js loaded');

const symbols = ['guardian','hive','kill','light','darkness','drink','give','pyramid','savathun','stop','traveller','witness','worm','worship'];

const truthCombinations = [
  ['pyramid','drink','worm'], ['pyramid','kill','worm'], ['pyramid','stop','savathun'],
  ['pyramid','give','darkness'], ['guardian','worship','light'], ['guardian','worship','traveller'],
  ['guardian','kill','witness'], ['traveller','give','guardian'], ['traveller','give','light'],
  ['hive','worship','darkness'], ['hive','worship','worm'], ['darkness','stop','savathun']
];

const lieCombinations = [
  ['hive','kill','worm'], ['hive','kill','light'], ['hive','give','darkness'], ['hive','stop','witness'],
  ['traveller','kill','guardian'], ['traveller','drink','worm'], ['traveller','give','hive'],
  ['traveller','stop','witness'], ['pyramid','stop','witness'], ['witness','drink','light'],
  ['witness','kill','pyramid'], ['guardian','worship','witness'], ['guardian','kill','traveller'],
  ['savathun','drink','darkness'], ['savathun','stop','darkness'], ['light','stop','savathun']
];

let currentSlot = null;

function handleSlotClick(slot) {
  currentSlot = slot;
  showSymbolPopup(slot);
}

function showSymbolPopup(slot) {
  const popup = document.getElementById('symbolPopup');
  const grid = document.getElementById('popupGrid');
  grid.innerHTML = '';
  const used = getUsedSymbols();
  const available = symbols.filter(s => !used.includes(s));
  available.forEach(sym => {
    const div = document.createElement('div');
    div.className = 'symbol-option';
    div.style.backgroundImage = `url('./img/${sym}.png')`;
    div.onclick = () => {
      slot.dataset.symbol = sym;
      slot.style.backgroundImage = `url('./img/${sym}.png')`;
      popup.style.display = 'none';
      updateTruthLieLabel();
    };
    grid.appendChild(div);
  });
  popup.style.display = 'block';
}

function getUsedSymbols() {
  return [...document.querySelectorAll('.dial-slot')].map(s => s.dataset.symbol).filter(Boolean);
}

function arraysEqual(a, b) {
  return a.length === b.length && a.sort().every((v, i) => v === b.sort()[i]);
}

function updateTruthLieLabel() {
  const getGroup = pos => ['left1','left2','left3'].includes(pos);
  const left = ['left1','left2','left3'].map(id => document.querySelector(`[data-position='${id}']`).dataset.symbol).filter(Boolean);
  const right = ['right1','right2','right3'].map(id => document.querySelector(`[data-position='${id}']`).dataset.symbol).filter(Boolean);

  const labelL = document.getElementById('label-left');
  const labelR = document.getElementById('label-right');
  labelL.textContent = '';
  labelR.textContent = '';

  if (left.length === 3 && right.length === 3) {
    if (truthCombinations.some(c => arraysEqual(c, left)) && lieCombinations.some(c => arraysEqual(c, right))) {
      labelL.textContent = 'TRUTH';
      labelR.textContent = 'LIE';
    } else if (truthCombinations.some(c => arraysEqual(c, right)) && lieCombinations.some(c => arraysEqual(c, left))) {
      labelL.textContent = 'LIE';
      labelR.textContent = 'TRUTH';
    }
  }
}

document.addEventListener('click', e => {
  if (!document.getElementById('symbolPopup').contains(e.target)) {
    document.getElementById('symbolPopup').style.display = 'none';
  }
});

window.handleSlotClick = handleSlotClick;
