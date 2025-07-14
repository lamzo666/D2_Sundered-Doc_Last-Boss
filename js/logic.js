// logic.js

const symbols = [
  'guardian', 'hive', 'kill', 'light', 'darkness',
  'drink', 'give', 'pyramid', 'savathun', 'stop',
  'traveller', 'witness', 'worm', 'worship'
];

let selectedSymbols = new Set();
let illuminationPhase = false;

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

function createPopupGrid() {
  const grid = document.getElementById('popupGrid');
  grid.innerHTML = '';
  symbols.forEach(symbol => {
    if (!selectedSymbols.has(symbol)) {
      const div = document.createElement('div');
      div.className = 'symbol-option';
      div.style.backgroundImage = `url('./img/${symbol}.png')`;
      div.dataset.symbol = symbol;
      div.onclick = () => {
        const target = grid.dataset.target;
        const slot = document.querySelector(`.dial-slot.${target}`);
        slot.style.backgroundImage = `url('./img/${symbol}.png')`;
        slot.dataset.symbol = symbol;
        selectedSymbols.add(symbol);
        document.getElementById('symbolPopup').style.display = 'none';
      };
      grid.appendChild(div);
    }
  });
}

document.querySelectorAll('.dial-slot').forEach(slot => {
  slot.onclick = () => {
    if (illuminationPhase) {
      slot.classList.toggle('active');
      slot.style.boxShadow = slot.classList.contains('active') ? '0 0 12px 6px yellow' : 'none';
    } else {
      const popup = document.getElementById('symbolPopup');
      const grid = document.getElementById('popupGrid');
      grid.dataset.target = slot.dataset.position;
      createPopupGrid();
      popup.style.display = 'block';
    }
  };
});

document.body.addEventListener('click', e => {
  const popup = document.getElementById('symbolPopup');
  if (!popup.contains(e.target) && !e.target.classList.contains('dial-slot')) {
    popup.style.display = 'none';
  }
});

function handleLock() {
  const filled = [...document.querySelectorAll('.dial-slot')].every(slot => slot.style.backgroundImage);
  if (!filled) return alert('All 6 slots must be filled.');

  const lockBtn = document.getElementById('lockButton');

  if (!illuminationPhase) {
    illuminationPhase = true;
    lockBtn.classList.add('glow-phase');
  } else {
    illuminationPhase = false;
    lockBtn.classList.remove('glow-phase');
    checkTruthLie();
  }
}

function checkTruthLie() {
  const left = ['left1','left2','left3'].map(id => document.querySelector(`.dial-slot.${id}`).dataset.symbol).sort();
  const right = ['right1','right2','right3'].map(id => document.querySelector(`.dial-slot.${id}`).dataset.symbol).sort();
  const illuminated = [...document.querySelectorAll('.dial-slot.active')].map(el => el.dataset.symbol);

  const isLeftTruth = truthCombinations.some(t => JSON.stringify(t.sort()) === JSON.stringify(left));
  const isRightTruth = truthCombinations.some(t => JSON.stringify(t.sort()) === JSON.stringify(right));
  const isLeftLie = lieCombinations.some(t => JSON.stringify(t.sort()) === JSON.stringify(left));
  const isRightLie = lieCombinations.some(t => JSON.stringify(t.sort()) === JSON.stringify(right));

  let truth = [], lie = [], label = document.getElementById('truthLieLabel');
  label.innerHTML = '';

  if (isLeftTruth && isRightLie) {
    label.innerHTML = '<div style="color:red">LIE</div><div></div><div style="color:lime">TRUTH</div>';
    truth = left; lie = right;
  } else if (isRightTruth && isLeftLie) {
    label.innerHTML = '<div style="color:red">LIE</div><div></div><div style="color:lime">TRUTH</div>';
    truth = right; lie = left;
  } else {
    alert('No valid truth/lie match found.');
    return;
  }

  const highlight = [
    ...truth.filter(sym => illuminated.includes(sym)),
    ...lie.filter(sym => !illuminated.includes(sym))
  ];
  showHighlights(highlight);
}

function showHighlights(names) {
  const overlay = document.getElementById('map-overlay');
  overlay.innerHTML = '';
  names.forEach(name => {
    const img = document.createElement('img');
    img.src = `./img/${name}.png`;
    img.className = 'symbol-overlay pulse';
    img.style.top = symbolPositions[name].top;
    img.style.left = symbolPositions[name].left;
    overlay.appendChild(img);
  });
}

function resetDial() {
  document.querySelectorAll('.dial-slot').forEach(slot => {
    slot.style.backgroundImage = '';
    slot.style.boxShadow = 'none';
    slot.classList.remove('active');
    delete slot.dataset.symbol;
  });
  document.getElementById('map-overlay').innerHTML = '';
  document.getElementById('truthLieLabel').innerHTML = '';
  selectedSymbols.clear();
  illuminationPhase = false;
  document.getElementById('lockButton').classList.remove('glow-phase');
}

function toggleInstructions() {
  const box = document.getElementById('instructionsBox');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}
