
// logic.js (final: no filtering until manual lock phase is triggered)

import {
  getValidSymbols,
  validateGroup
} from './combination_logic_module.js';

const popup = document.getElementById("symbolPopup");
const popupGrid = document.getElementById("popupGrid");

let activeSlot = null;
let lockPhase = 0;

function getSymbolsFromSlots(group) {
  const ids = [`${group}1`, `${group}2`, `${group}3`];
  return ids.map(id => {
    const el = document.querySelector(`.dial-slot.${id}`);
    return el?.dataset.symbol || null;
  });
}

function updateTruthLieLabel() {
  const left = getSymbolsFromSlots('left');
  const right = getSymbolsFromSlots('right');

  const leftType = validateGroup(left);
  const rightType = validateGroup(right);

  const leftLabel = document.getElementById('label-left');
  const rightLabel = document.getElementById('label-right');

  if ((leftType === 'truth' && rightType === 'lie') || (leftType === 'lie' && rightType === 'truth')) {
    leftLabel.textContent = leftType.toUpperCase();
    leftLabel.style.color = leftType === 'truth' ? 'limegreen' : 'red';
    rightLabel.textContent = rightType.toUpperCase();
    rightLabel.style.color = rightType === 'truth' ? 'limegreen' : 'red';
  } else {
    leftLabel.textContent = '';
    rightLabel.textContent = '';
  }
}

function getUsedSymbols() {
  return [...getSymbolsFromSlots('left'), ...getSymbolsFromSlots('right')].filter(Boolean);
}

function openSymbolPopup(slot) {
  if (slot.classList.contains('locked')) return;
  activeSlot = slot;
  const side = slot.classList.contains('left') ? 'left' : 'right';
  const selected = getSymbolsFromSlots(side);
  const usedSymbols = getUsedSymbols();
  const slotClass = slot.dataset.position;
  const slotIndex = ['1', '2', '3'].indexOf(slotClass.slice(-1));

  popupGrid.innerHTML = '';

  const allSymbols = [
    "worship", "witness", "light", "guardian", "worm", "traveller", "savathun",
    "stop", "darkness", "hive", "drink", "pyramid", "kill", "give"
  ];

  let validSymbols = allSymbols.filter(sym => !usedSymbols.includes(sym));

  if (validSymbols.length === 0) {
    const msg = document.createElement("div");
    msg.textContent = "No valid combinations remain — reset required.";
    msg.style.color = "#aaa";
    msg.style.textAlign = "center";
    msg.style.padding = "10px";
    popupGrid.appendChild(msg);
  }

  validSymbols.forEach(sym => {
    const div = document.createElement("div");
    div.className = "symbol-option";
    div.style.backgroundImage = `url('./img/${sym}.png')`;
    div.onclick = () => {
      slot.style.backgroundImage = `url('./img/${sym}.png')`;
      slot.dataset.symbol = sym;
      popup.style.display = "none";
      updateTruthLieLabel();
    };
    popupGrid.appendChild(div);
  });

  popup.style.display = "block";
}

function lockSlots(side) {
  ['1', '2', '3'].forEach(n => {
    const slot = document.querySelector(`.dial-slot.${side}${n}`);
    slot.classList.add('locked');
    slot.style.cursor = 'not-allowed';
  });
}

function handleLock() {
  const left = getSymbolsFromSlots('left');
  const right = getSymbolsFromSlots('right');
  const isLeftTruth = validateGroup(left) === 'truth';
  const isRightTruth = validateGroup(right) === 'truth';
  const isLeftLie = validateGroup(left) === 'lie';
  const isRightLie = validateGroup(right) === 'lie';

  if (lockPhase === 0) {
    if ((isLeftTruth && isRightLie) || (isLeftLie && isRightTruth)) {
      document.getElementById('lockButton').classList.add('glow-phase');
      lockPhase = 1;

      ['left1','left2','left3','right1','right2','right3'].forEach(id => {
        const slot = document.querySelector(`.dial-slot.${id}`);
        slot.classList.add('locked');
        slot.addEventListener('click', () => {
          slot.classList.toggle('active');
          slot.style.boxShadow = slot.classList.contains('active') ? '0 0 12px 6px yellow' : 'none';
        });
      });
    } else {
      alert('You must enter one TRUTH and one LIE combination before locking.');
    }
  } else if (lockPhase === 1) {
    lockPhase = 2;
    document.getElementById('lockButton').classList.remove('glow-phase');
    // Future illumination handling...
  }
}

function bindDialClickHandlers() {
  const slots = document.querySelectorAll('.dial-slot');
  slots.forEach(slot => {
    slot.addEventListener('click', () => {
      if (!slot.classList.contains('locked') && lockPhase === 0) {
        openSymbolPopup(slot);
      }
    });
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
  bindDialClickHandlers();
}

window.handleLock = handleLock;
window.resetDial = resetDial;

document.addEventListener('DOMContentLoaded', () => {
  bindDialClickHandlers();
});

document.addEventListener('click', (e) => {
  const popup = document.getElementById('symbolPopup');
  if (!popup.contains(e.target) && e.target !== activeSlot) {
    popup.style.display = 'none';
  }
});
