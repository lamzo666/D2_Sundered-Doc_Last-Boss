// logic.js (ensures slot 1 for BOTH groups filters to first-position symbols only)

import {
  getValidSymbols,
  validateGroup,
  lockGroup,
  getAllowedCombinations
} from './combination_logic_module.js';

const popup = document.getElementById("symbolPopup");
const popupGrid = document.getElementById("popupGrid");
const symbolList = [
  "worship", "witness", "light", "guardian", "worm", "traveller", "savathun",
  "stop", "darkness", "hive", "drink", "pyramid", "kill", "give"
];

let activeSlot = null;

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
  const all = [...getSymbolsFromSlots('left'), ...getSymbolsFromSlots('right')];
  return new Set(all.filter(Boolean));
}

function openSymbolPopup(slot) {
  if (slot.classList.contains('locked')) return;
  activeSlot = slot;
  const side = slot.classList.contains('left') ? 'left' : 'right';
  const selected = getSymbolsFromSlots(side);
  const usedSymbols = getUsedSymbols();

  const slotClass = slot.classList[1];
  const slotIndex = parseInt(slotClass.replace(side, '')) - 1;

  popupGrid.innerHTML = '';

  let allowedSymbols;
  if (slotIndex === 0) {
    const allCombos = getAllowedCombinations(side);
    allowedSymbols = [...new Set(allCombos.map(c => c[0]))];
  } else {
    allowedSymbols = getValidSymbols(selected, side);
  }

  const finalOptions = allowedSymbols.filter(sym => !usedSymbols.has(sym));

  finalOptions.forEach(sym => {
    const div = document.createElement("div");
    div.className = "symbol-option";
    div.style.backgroundImage = `url('./img/${sym}.png')`;
    div.onclick = () => {
      slot.style.backgroundImage = `url('./img/${sym}.png')`;
      slot.dataset.symbol = sym;

      const current = getSymbolsFromSlots(side);

      if (current.every(Boolean)) {
        const result = validateGroup(current);
        if (result) {
          lockGroup(side, result);
          lockSlots(side);
          updateTruthLieLabel();
        }
      }

      popup.style.display = "none";
    };
    popupGrid.appendChild(div);
  });

  popup.style.display = "block";
}

function lockSlots(side) {
  ['1','2','3'].forEach(n => {
    const slot = document.querySelector(`.dial-slot.${side}${n}`);
    slot.classList.add('locked');
    slot.style.cursor = 'not-allowed';
  });
}

window.addEventListener("click", (e) => {
  if (!popup.contains(e.target) && e.target !== activeSlot) {
    popup.style.display = "none";
  }
});

function bindDialClickHandlers() {
  const dialSlots = document.querySelectorAll('.dial-slot');
  dialSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      openSymbolPopup(slot);
    });
  });
}

window.addEventListener('DOMContentLoaded', bindDialClickHandlers);
