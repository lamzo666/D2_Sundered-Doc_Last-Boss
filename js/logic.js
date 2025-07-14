// logic.js

let isInIlluminationPhase = false;
let selectedSlot = null;
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
  const lockButton = document.getElementById('lockButton');
  if (!isInIlluminationPhase) {
    isInIlluminationPhase = true;
    lockButton.classList.add('glow-phase');
  } else {
    isInIlluminationPhase = false;
    lockButton.classList.remove('glow-phase');
    lockInSymbols();
  }
}

function resetDial() {
  document.querySelectorAll('.dial-slot').forEach(slot => {
    slot.style.backgroundImage = '';
    slot.classList.remove('active');
    slot.style.boxShadow = 'none';
  });
  document.getElementById('truthLieLabel').textContent = '';
  document.getElementById('map-overlay').innerHTML = '';
  document.getElementById('lockButton').classList.remove('glow-phase');
  isInIlluminationPhase = false;
  renderSymbolPicker();
}

function lockInSymbols() {
  const left = getSymbolsFromSlots(['left1', 'left2', 'left3']).sort();
  const right = getSymbolsFromSlots(['right1', 'right2', 'right3']).sort();
  const leftLit = getIlluminatedSymbols(['left1', 'left2', 'left3']);
  const rightLit = getIlluminatedSymbols(['right1', 'right2', 'right3']);

  const label = document.getElementById('truthLieLabel');
  let truthSymbols = [], lieSymbols = [];

  const isLeftTruth = truthCombinations.some(t => JSON.stringify(t.sort()) === JSON.stringify(left));
  const isRightTruth = truthCombinations.some(t => JSON.stringify(t.sort()) === JSON.stringify(right));
  const isLeftLie = lieCombinations.some(t => JSON.stringify(t.sort()) === JSON.stringify(left));
  const isRightLie = lieCombinations.some(t => JSON.stringify(t.sort()) === JSON.stringify(right));

  if (isLeftTruth && isRightLie) {
    label.innerHTML = '<div style="text-align: center; color: #00ff00; text-shadow: 0 0 4px #000, 0 0 10px #000">TRUTH</div><div></div><div style="text-align: center; color: #ff4444; text-shadow: 0 0 4px #000, 0 0 10px #000">LIE</div>';
    truthSymbols = left;
    lieSymbols = right;
  } else if (isRightTruth && isLeftLie) {
    label.innerHTML = '<div style="text-align: center; color: #ff4444; text-shadow: 0 0 4px #000, 0 0 10px #000">LIE</div><div></div><div style="text-align: center; color: #00ff00; text-shadow: 0 0 4px #000, 0 0 10px #000">TRUTH</div>';
    truthSymbols = right;
    lieSymbols = left;
  } else {
    label.textContent = '';
    alert('Could not match either side to a valid truth/lie combo.');
    return;
  }

  const illuminated = [...leftLit, ...rightLit];
  const truthToVisit = truthSymbols.filter(sym => illuminated.includes(sym));
  const lieToVisit = [...left, ...right].filter(sym => lieSymbols.includes(sym) && !illuminated.includes(sym));
  pulseMapSymbols([...truthToVisit, ...lieToVisit]);
}

function getSymbolsFromSlots(positions) {
  return positions.map(id => {
    const el = document.querySelector(`.dial-slot.${id}`);
    const match = el?.style.backgroundImage.match(/\/([^\/]+)\.png/);
    return match ? match[1].replace('.png','') : null;
  });
}

function getIlluminatedSymbols(positions) {
  return positions.filter(id => {
    const el = document.querySelector(`.dial-slot.${id}`);
    return el.classList.contains('active');
  }).map(id => {
    const match = document.querySelector(`.dial-slot.${id}`).style.backgroundImage.match(/\/([^\/]+)\.png/);
    return match ? match[1].replace('.png','') : null;
  });
}

function pulseMapSymbols(symbolsToHighlight) {
  const overlay = document.getElementById('map-overlay');
  overlay.innerHTML = '';
  Object.entries(symbolPositions).forEach(([name, pos]) => {
    if (symbolsToHighlight.includes(name)) {
      const div = document.createElement('img');
      div.className = 'symbol-overlay pulse';
      div.src = `./img/${name}.png`;
      div.style.top = pos.top;
      div.style.left = pos.left;
      overlay.appendChild(div);
    }
  });
}

function renderSymbolPicker() {
  const grid = document.getElementById('popupGrid');
  grid.innerHTML = '';
  allSymbols.forEach(name => {
    const div = document.createElement('div');
    div.className = 'symbol-option';
    div.style.backgroundImage = `url('./img/${name}.png')`;
    div.onclick = () => {
      if (selectedSlot) {
        selectedSlot.style.backgroundImage = `url('./img/${name}.png')`;
        document.getElementById('symbolPopup').style.display = 'none';
        selectedSlot = null;
        renderSymbolPicker();
      }
    };
    grid.appendChild(div);
  });
}

function openSymbolPicker(slot) {
  selectedSlot = slot;
  document.getElementById('symbolPopup').style.display = 'block';
}

window.addEventListener('DOMContentLoaded', () => {
  renderSymbolPicker();
  document.querySelectorAll('.dial-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      if (!isInIlluminationPhase) {
        openSymbolPicker(slot);
      } else {
        if (slot.style.backgroundImage) {
          slot.classList.toggle('active');
          slot.style.boxShadow = slot.classList.contains('active')
            ? '0 0 12px 6px yellow'
            : 'none';
        }
      }
    });
  });
});
