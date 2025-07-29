// logic.js

const allSymbols = [
  'guardian', 'hive', 'kill', 'light', 'darkness',
  'drink', 'give', 'pyramid', 'savathun', 'stop',
  'traveller', 'witness', 'worm', 'worship'
];

const truthCombinations = [
  [
    "pyramid",
    "drink",
    "worm"
  ],
  [
    "pyramid",
    "kill",
    "worm"
  ],
  [
    "pyramid",
    "stop",
    "savathun"
  ],
  [
    "pyramid",
    "give",
    "darkness"
  ],
  [
    "guardian",
    "worship",
    "light"
  ],
  [
    "guardian",
    "worship",
    "traveller"
  ],
  [
    "guardian",
    "kill",
    "witness"
  ],
  [
    "traveller",
    "give",
    "guardian"
  ],
  [
    "traveller",
    "give",
    "light"
  ],
  [
    "hive",
    "worship",
    "darkness"
  ],
  [
    "hive",
    "worship",
    "worm"
  ],
  [
    "darkness",
    "stop",
    "savathun"
  ]
];

const lieCombinations = [
  [
    "hive",
    "kill",
    "worm"
  ],
  [
    "hive",
    "kill",
    "light"
  ],
  [
    "hive",
    "give",
    "darkness"
  ],
  [
    "hive",
    "stop",
    "witness"
  ],
  [
    "traveller",
    "kill",
    "guardian"
  ],
  [
    "traveller",
    "drink",
    "worm"
  ],
  [
    "traveller",
    "give",
    "hive"
  ],
  [
    "traveller",
    "stop",
    "witness"
  ],
  [
    "pyramid",
    "stop",
    "witness"
  ],
  [
    "witness",
    "drink",
    "light"
  ],
  [
    "witness",
    "kill",
    "pyramid"
  ],
  [
    "guardian",
    "worship",
    "witness"
  ],
  [
    "guardian",
    "kill",
    "traveller"
  ],
  [
    "savathun",
    "drink",
    "darkness"
  ],
  [
    "savathun",
    "stop",
    "darkness"
  ],
  [
    "light",
    "stop",
    "savathun"
  ]
];

function openSymbolPopup(slot) {
  const group = slot.dataset.position.startsWith('left') ? 'left' : 'right';
  const slotId = slot.dataset.position;
  const groupSlots = group === 'left' ? ['left1', 'left2', 'left3'] : ['right1', 'right2', 'right3'];
  const slotIndex = groupSlots.indexOf(slotId);

  const currentSymbols = getSymbolsFromSlots(group).filter(s => s);
  const usedSymbols = getSymbolsFromSlots('left').concat(getSymbolsFromSlots('right')).filter(Boolean);

  let validSymbols = [];

  const possibleCombos = truthCombinations.concat(lieCombinations).filter(combo =>
    currentSymbols.every(sym => combo.includes(sym)) &&
    combo.every(sym => !usedSymbols.includes(sym) || currentSymbols.includes(sym))
  );

  if (slotIndex === 0 && currentSymbols.length === 0) {
    const validStartSymbols = ['guardian', 'hive', 'traveller', 'pyramid', 'savathun', 'darkness', 'witness'];
    validSymbols = validStartSymbols.filter(sym => !usedSymbols.includes(sym));
  } else {
    validSymbols = [...new Set(possibleCombos.map(c => c[slotIndex]))].filter(sym =>
      !usedSymbols.includes(sym)
    );
  }

  if (validSymbols.length === 1) {
    const autoSymbol = validSymbols[0];
    slot.style.backgroundImage = `url('./img/${autoSymbol}.png')`;
    slot.dataset.symbol = autoSymbol;
    updateTruthLieLabel();
document.getElementById('label-left').style.color = '';
document.getElementById('label-right').style.color = '';
    return;
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
    };
    grid.appendChild(div);
  });
}
window.openSymbolPopup = openSymbolPopup;

function getSymbolsFromSlots(group) {
  const ids = group === 'left' ? ['left1','left2','left3'] : ['right1','right2','right3'];
  return ids.map(id => {
    const el = document.querySelector(`.dial-slot.${id}`);
    return el.dataset.symbol || null;
  });
}

function resetDial() {
  document.querySelectorAll('.dial-slot').forEach(slot => {
    const newSlot = slot.cloneNode(true);
    newSlot.classList.remove('active', 'locked');
    newSlot.removeAttribute('data-symbol');
    newSlot.style.backgroundImage = '';
    newSlot.style.boxShadow = 'none';

    slot.replaceWith(newSlot);
  });

  document.getElementById('map-overlay').innerHTML = '';
  document.getElementById('lockButton').classList.remove('glow-phase');
  lockPhase = 0;
  updateTruthLieLabel();

  // Rebind initial click handlers
  document.querySelectorAll('.dial-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      if (!slot.classList.contains('locked') && lockPhase === 0) {
        openSymbolPopup(slot);
      }
    });
  });
}

let lockPhase = 0;

function handleLock() {
  const left = getSymbolsFromSlots('left').sort();
  const right = getSymbolsFromSlots('right').sort();

  const isLeftTruth = left.length === 3 && truthCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(left));
  const isLeftLie = left.length === 3 && lieCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(left));
  const isRightTruth = right.length === 3 && truthCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(right));
  const isRightLie = right.length === 3 && lieCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(right));

  updateTruthLieLabel();

  if (lockPhase === 0) {
    if ((isLeftTruth && isRightLie) || (isRightTruth && isLeftLie)) {
      document.getElementById('lockButton').classList.add('glow-phase');
      lockPhase = 1;

      document.querySelectorAll('.dial-slot').forEach(slot => {
        slot.classList.add('locked');
        slot.addEventListener('click', () => {
          slot.classList.toggle('active');
          slot.style.boxShadow = slot.classList.contains('active') ? '0 0 12px 6px yellow' : 'none';
        });
      });
    } else {
      alert('You must enter one full TRUTH and one full LIE combination before locking.');
    }
  } else if (lockPhase === 1) {
    lockPhase = 2;
    document.getElementById('lockButton').classList.remove('glow-phase');

    const leftIlluminated = ['left1','left2','left3'].filter(id => document.querySelector(`.dial-slot.${id}`).classList.contains('active')).map(id => document.querySelector(`.dial-slot.${id}`).dataset.symbol);
    const rightIlluminated = ['right1','right2','right3'].filter(id => document.querySelector(`.dial-slot.${id}`).classList.contains('active')).map(id => document.querySelector(`.dial-slot.${id}`).dataset.symbol);

    const truthSymbols = isLeftTruth ? left : right;
    const lieSymbols = isLeftTruth ? right : left;

    const allIlluminated = [...leftIlluminated, ...rightIlluminated];
    const truthToVisit = truthSymbols.filter(sym => allIlluminated.includes(sym));
    const lieToVisit = lieSymbols.filter(sym => !allIlluminated.includes(sym));

    if (typeof showMapHighlights === 'function') {
      showMapHighlights(truthToVisit, lieToVisit, allIlluminated);
    }
  }
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
    // Reset both first
    leftLabel.textContent = '';
    leftLabel.style.color = '';
    rightLabel.textContent = '';
    rightLabel.style.color = '';

    if (isLeftTruth && isRightLie) {
      leftLabel.textContent = 'TRUTH';
      leftLabel.style.color = '#00ff00';
      rightLabel.textContent = 'LIE';
      rightLabel.style.color = '#ff4444';
    } else if (isRightTruth && isLeftLie) {
      leftLabel.textContent = 'LIE';
      leftLabel.style.color = '#ff4444';
      rightLabel.textContent = 'TRUTH';
      rightLabel.style.color = '#00ff00';
    }
  }
}

function toggleInstructions() {
  const box = document.getElementById('instructionsBox');
  if (box) {
    box.style.display = box.style.display === 'block' ? 'none' : 'block';
  }
}

window.toggleInstructions = toggleInstructions;
window.handleLock = handleLock;
window.resetDial = resetDial;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.dial-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      if (!slot.classList.contains('locked') && lockPhase === 0) {
        openSymbolPopup(slot);
      }
    });
  });
});
document.addEventListener('click', (e) => {
  const popup = document.getElementById('symbolPopup');
  const grid = document.getElementById('popupGrid');
  if (!popup || !grid) return;

  const isInsidePopup = popup.contains(e.target);
  const isDialSlot = e.target.classList.contains('dial-slot');

  // Close popup if clicked outside both popup and a slot
  if (!isInsidePopup && !isDialSlot) {
    popup.style.display = 'none';
  }
});
