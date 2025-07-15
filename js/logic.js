// logic.js

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

const allCombinations = [...truthCombinations, ...lieCombinations];
const allSymbols = [...new Set(allCombinations.flat())];

let selectedSymbols = {
  left: [null, null, null],
  right: [null, null, null],
};
let activeSlot = null;
let phase = 0; // 0 = input phase, 1 = illumination, 2 = lock-in

function getValidNextSymbols(group, index) {
  const current = selectedSymbols[group];
  const otherGroup = group === 'left' ? 'right' : 'left';
  const filled = current.slice(0, index);

  if (index === 0) {
    return [...new Set(allCombinations.map(c => c[0]))];
  }

  const otherFilled = selectedSymbols[otherGroup];
  const otherComplete = !otherFilled.includes(null);
  const otherIsTruth = truthCombinations.some(c => equalArray(c, otherFilled));
  const otherIsLie = lieCombinations.some(c => equalArray(c, otherFilled));

  let pool = allCombinations;
  if (otherComplete) {
    if (otherIsTruth) pool = lieCombinations;
    else if (otherIsLie) pool = truthCombinations;
  }

  // Filter to those matching what we’ve already selected in this group
  pool = pool.filter(combo => filled.every((sym, i) => combo[i] === sym));

  return [...new Set(pool.map(c => c[index]))];
}

function openSymbolPopup(slotEl) {
  const pos = slotEl.dataset.position;
  const group = pos.includes('left') ? 'left' : 'right';
  const index = parseInt(pos[pos.length - 1]) - 1;
  activeSlot = slotEl;

  const validSymbols = getValidNextSymbols(group, index);
  const used = [...selectedSymbols.left, ...selectedSymbols.right];
  const popup = document.getElementById('symbolPopup');
  const grid = document.getElementById('popupGrid');
  grid.innerHTML = '';

  validSymbols.forEach(name => {
    if (used.includes(name)) return;
    const div = document.createElement('div');
    div.className = 'symbol-option';
    div.style.backgroundImage = `url('./img/${name}.png')`;
    div.dataset.name = name;
    div.onclick = () => selectSymbol(name);
    grid.appendChild(div);
  });
  popup.style.display = 'block';
}

function selectSymbol(name) {
  if (!activeSlot) return;

  const group = activeSlot.dataset.position.includes('left') ? 'left' : 'right';
  const index = parseInt(activeSlot.dataset.position.slice(-1)) - 1;

  selectedSymbols[group][index] = name;
  activeSlot.style.backgroundImage = `url('./img/${name}.png')`;
  activeSlot.classList.remove('active');
  activeSlot = null;
  document.getElementById('symbolPopup').style.display = 'none';

  // 🔍 Check for prediction
  const filled = selectedSymbols[group];
  const positions = ['1', '2', '3'];
  const remainingIndices = filled.map((val, i) => val ? null : i).filter(i => i !== null);

  const otherGroup = group === 'left' ? 'right' : 'left';
  const other = selectedSymbols[otherGroup];
  const otherComplete = !other.includes(null);
  const otherIsTruth = truthCombinations.some(c => equalArray(c, other));
  const otherIsLie = lieCombinations.some(c => equalArray(c, other));
  let pool = allCombinations;

  if (otherComplete) {
    if (otherIsTruth) pool = lieCombinations;
    else if (otherIsLie) pool = truthCombinations;
  }

  pool = pool.filter(c => filled.every((val, i) => !val || c[i] === val));
  const remainingCombos = pool.filter(c => !c.some(sym => [...selectedSymbols.left, ...selectedSymbols.right].includes(sym) && !filled.includes(sym)));

  if (remainingCombos.length === 1) {
    const auto = remainingCombos[0];
    remainingIndices.forEach(i => {
      selectedSymbols[group][i] = auto[i];
      const slot = document.querySelector(`.dial-slot.${group}${i + 1}`);
      slot.style.backgroundImage = `url('./img/${auto[i]}.png')`;
    });
  }
}

function handleLock() {
  const btn = document.getElementById('lockButton');

  if (phase === 0) {
    if ([...selectedSymbols.left, ...selectedSymbols.right].includes(null)) {
      alert('Fill all 6 symbols first.');
      return;
    }
    phase = 1;
    btn.classList.add('glow-phase');
  } else if (phase === 1) {
    phase = 2;
    btn.classList.remove('glow-phase');
    checkCombinations();
  }
}

function checkCombinations() {
  const truthLabel = document.getElementById('truthLieLabel');
  const overlay = document.getElementById('map-overlay');
  overlay.innerHTML = '';

  const left = [...selectedSymbols.left];
  const right = [...selectedSymbols.right];

  const isLeftTruth = truthCombinations.some(c => equalArray(c, left));
  const isRightTruth = truthCombinations.some(c => equalArray(c, right));
  const isLeftLie = lieCombinations.some(c => equalArray(c, left));
  const isRightLie = lieCombinations.some(c => equalArray(c, right));

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

  [...truth, ...lie].forEach(name => {
    const img = document.createElement('img');
    img.className = 'symbol-overlay';
    img.src = `./img/${name}.png`;
    if (truth.includes(name)) img.classList.add('pulse');
    document.getElementById('map-overlay').appendChild(img);
  });
}

function equalArray(a, b) {
  return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
}

function resetDial() {
  document.querySelectorAll('.dial-slot').forEach(slot => {
    slot.style.backgroundImage = '';
    slot.classList.remove('active');
  });
  selectedSymbols = { left: [null, null, null], right: [null, null, null] };
  document.getElementById('symbolPopup').style.display = 'none';
  document.getElementById('truthLieLabel').innerHTML = '';
  document.getElementById('map-overlay').innerHTML = '';
  document.getElementById('lockButton').classList.remove('glow-phase');
  phase = 0;
}

document.querySelectorAll('.dial-slot').forEach(slot => {
  slot.addEventListener('click', () => {
    if (phase === 0) openSymbolPopup(slot);
    else if (phase === 1) {
      slot.classList.toggle('active');
      slot.style.boxShadow = slot.classList.contains('active') ? '0 0 12px 6px yellow' : 'none';
    }
  });
});

document.addEventListener('click', e => {
  if (!document.getElementById('symbolPopup').contains(e.target) && !e.target.classList.contains('dial-slot')) {
    document.getElementById('symbolPopup').style.display = 'none';
  }
});

function toggleInstructions() {
  const box = document.getElementById('instructionsBox');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}
