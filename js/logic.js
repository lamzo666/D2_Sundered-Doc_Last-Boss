// logic.js - extracted interactivity logic from HTML

// Global variables
let currentPhase = 0;
let currentSlot = null;
let selectedSymbols = new Set();

const symbols = [
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

function toggleInstructions() {
  const box = document.getElementById('instructionsBox');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function handleLock() {
  const slots = document.querySelectorAll('.dial-slot');
  const filled = Array.from(slots).every(slot => slot.style.backgroundImage);
  if (!filled) return alert("Assign all symbols first");

  if (currentPhase === 0) {
    currentPhase = 1;
  } else if (currentPhase === 1) {
    lockInSymbols();
    currentPhase = 0;
  }
}

function resetDial() {
  const slots = document.querySelectorAll('.dial-slot');
  slots.forEach(slot => {
    slot.style.backgroundImage = '';
    slot.classList.remove('active');
  });
  selectedSymbols.clear();
  document.getElementById('map-overlay').innerHTML = '';
  document.getElementById('truthLieLabel').innerHTML = '';
  currentPhase = 0;
}

function openSymbolPicker(slotEl) {
  if (currentPhase !== 0) return;
  currentSlot = slotEl;
  const popup = document.getElementById('symbolPopup');
  const grid = document.getElementById('popupGrid');
  grid.innerHTML = '';
  symbols.forEach(name => {
    if (selectedSymbols.has(name)) return;
    const div = document.createElement('div');
    div.className = 'symbol-option';
    div.style.backgroundImage = `url('./img/${name}.png')`;
    div.onclick = () => {
      slotEl.style.backgroundImage = `url('./img/${name}.png')`;
      selectedSymbols.add(name);
      popup.style.display = 'none';
    };
    grid.appendChild(div);
  });
  popup.style.display = 'block';
}

document.querySelectorAll('.dial-slot').forEach(slot => {
  slot.addEventListener('click', () => {
    if (currentPhase === 0) {
      openSymbolPicker(slot);
    } else if (currentPhase === 1 && slot.style.backgroundImage) {
      slot.classList.toggle('active');
      slot.style.boxShadow = slot.classList.contains('active')
        ? '0 0 12px 6px yellow'
        : 'none';
    }
  });
});

function getSymbolsFromSlots(group) {
  const positions = group === 'left' ? ['left1','left2','left3'] : ['right1','right2','right3'];
  return positions.map(pos => {
    const el = document.querySelector(`.dial-slot.${pos}`);
    const match = el.style.backgroundImage.match(/\/([^\/]+)\.png/);
    return match ? match[1] : null;
  });
}

function lockInSymbols() {
  const left = getSymbolsFromSlots('left').sort();
  const right = getSymbolsFromSlots('right').sort();
  const leftLit = ['left1','left2','left3'].filter(id => document.querySelector(`.dial-slot.${id}`).classList.contains('active'));
  const rightLit = ['right1','right2','right3'].filter(id => document.querySelector(`.dial-slot.${id}`).classList.contains('active'));
  const leftIll = leftLit.map(id => extractName(id));
  const rightIll = rightLit.map(id => extractName(id));

  const label = document.getElementById('truthLieLabel');
  let truthSymbols = [], lieSymbols = [], result = [];

  if (truthCombinations.some(t => JSON.stringify(t.sort()) === JSON.stringify(left)) &&
      lieCombinations.some(l => JSON.stringify(l.sort()) === JSON.stringify(right))) {
    label.innerHTML = '<div style="text-align:center; color:#0f0">TRUTH</div><div></div><div style="text-align:center; color:#f44">LIE</div>';
    truthSymbols = left;
    lieSymbols = right;
  } else if (truthCombinations.some(t => JSON.stringify(t.sort()) === JSON.stringify(right)) &&
             lieCombinations.some(l => JSON.stringify(l.sort()) === JSON.stringify(left))) {
    label.innerHTML = '<div style="text-align:center; color:#f44">LIE</div><div></div><div style="text-align:center; color:#0f0">TRUTH</div>';
    truthSymbols = right;
    lieSymbols = left;
  } else {
    alert("Could not match either side to a valid truth/lie combo.");
    label.textContent = '';
    return;
  }

  const allIlluminated = [...leftIll, ...rightIll];
  const truthToVisit = truthSymbols.filter(sym => allIlluminated.includes(sym));
  const lieToVisit = lieSymbols.filter(sym => !allIlluminated.includes(sym));
  result = [...truthToVisit, ...lieToVisit];

  pulseMapSymbols(result);
}

function extractName(slotId) {
  const el = document.querySelector(`.dial-slot.${slotId}`);
  const match = el.style.backgroundImage.match(/\/([^\/]+)\.png/);
  return match ? match[1] : null;
}

function pulseMapSymbols(highlight) {
  const overlay = document.getElementById('map-overlay');
  overlay.innerHTML = '';
  Object.entries(symbolPositions).forEach(([name, pos]) => {
    if (!highlight.includes(name)) return;
    const div = document.createElement('img');
    div.className = 'symbol-overlay pulse';
    div.src = `./img/${name}.png`;
    div.style.top = pos.top;
    div.style.left = pos.left;
    overlay.appendChild(div);
  });
}
