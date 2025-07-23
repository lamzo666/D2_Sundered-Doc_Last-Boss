// logic.js

// Symbol list
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

function openSymbolPopup(slot) {
  const popup = document.getElementById('symbolPopup');
  const grid = document.getElementById('popupGrid');
  popup.style.display = 'block';
  grid.innerHTML = '';

  const group = slot.dataset.position.startsWith('left') ? 'left' : 'right';
  const currentSymbols = getSymbolsFromSlots(group).filter(s => s);
  const usedSymbols = getSymbolsFromSlots('left').concat(getSymbolsFromSlots('right')).filter(s => s);

  let validSymbols = [...allSymbols];

  if (currentSymbols.length === 0) {
    // Only show starting symbols from both truth and lie combinations
    const validStartSymbols = new Set(
      truthCombinations.map(c => c[0])
        .concat(lieCombinations.map(c => c[0]))
    );
    validSymbols = [...validStartSymbols].filter(sym => !usedSymbols.includes(sym));
  } else {
    const possibleCombos = truthCombinations.concat(lieCombinations).filter(c =>
      currentSymbols.every(sym => c.includes(sym))
    );
    validSymbols = possibleCombos.flat().filter(sym => !currentSymbols.includes(sym));
  }

  validSymbols = validSymbols.filter(sym => !usedSymbols.includes(sym));

  [...new Set(validSymbols)].forEach(name => {
    const div = document.createElement('div');
    div.className = 'symbol-option';
    div.style.backgroundImage = `url('./img/${name}.png')`;
    div.onclick = () => {
      slot.style.backgroundImage = `url('./img/${name}.png')`;
      slot.dataset.symbol = name;
      popup.style.display = 'none';
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
    slot.style.backgroundImage = '';
    slot.classList.remove('active', 'locked');
    slot.removeAttribute('data-symbol');
    slot.style.boxShadow = 'none';
  });
  document.getElementById('map-overlay').innerHTML = '';
  document.getElementById('truthLieLabel').textContent = '';
  document.getElementById('lockButton').classList.remove('glow-phase');
  lockPhase = 0;
}

let lockPhase = 0;

function handleLock() {
  if (lockPhase === 0) {
    const left = getSymbolsFromSlots('left').sort();
    const right = getSymbolsFromSlots('right').sort();

    const isLeftTruth = truthCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(left));
    const isRightLie = lieCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(right));
    const isRightTruth = truthCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(right));
    const isLeftLie = lieCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(left));

    if ((isLeftTruth && isRightLie) || (isRightTruth && isLeftLie)) {
      document.getElementById('lockButton').classList.add('glow-phase');
      lockPhase = 1;
      document.querySelectorAll('.dial-slot').forEach(slot => slot.classList.add('locked'));
      document.querySelectorAll('.dial-slot').forEach(slot => {
        slot.addEventListener('click', () => {
          slot.classList.toggle('active');
          slot.style.boxShadow = slot.classList.contains('active') ? '0 0 12px 6px yellow' : 'none';
        });
      });
    } else {
      alert('Invalid combination of truth and lie.');
    }
  } else if (lockPhase === 1) {
    lockPhase = 2;
    document.getElementById('lockButton').classList.remove('glow-phase');

    const leftIlluminated = ['left1','left2','left3'].filter(id => document.querySelector(`.dial-slot.${id}`).classList.contains('active')).map(id => document.querySelector(`.dial-slot.${id}`).dataset.symbol);
    const rightIlluminated = ['right1','right2','right3'].filter(id => document.querySelector(`.dial-slot.${id}`).classList.contains('active')).map(id => document.querySelector(`.dial-slot.${id}`).dataset.symbol);

    const left = getSymbolsFromSlots('left').sort();
    const right = getSymbolsFromSlots('right').sort();

    const isLeftTruth = truthCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(left));
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

window.handleLock = handleLock;
window.resetDial = resetDial;

// Bind click handlers to dial slots once DOM is loaded

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.dial-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      if (!slot.classList.contains('locked') && lockPhase === 0) {
        openSymbolPopup(slot);
      }
    });
  });
});
