// logic.js (final rules fully applied, with fallback message for blocked group)

import {
  getValidSymbols,
  getSlotRestrictedSymbols,
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

  let restrictedSymbols = getSlotRestrictedSymbols(slotIndex, side);
  let validSymbols = getValidSymbols(selected, side);
  let displayOptions = restrictedSymbols.filter(sym => validSymbols.includes(sym) && !usedSymbols.has(sym));

  console.log(`Slot ${slotClass}:`, {
    side,
    slotIndex,
    selected,
    restrictedSymbols,
    validSymbols,
    usedSymbols: Array.from(usedSymbols),
    displayOptions
  });

  if (displayOptions.length === 0) {
    const msg = document.createElement("div");
    msg.textContent = (restrictedSymbols.length && validSymbols.length)
      ? "No valid symbols"
      : "No valid combinations remain — reset required.";
    msg.style.color = "#aaa";
    msg.style.textAlign = "center";
    msg.style.padding = "10px";
    popupGrid.appendChild(msg);
  }

  displayOptions.forEach(sym => {
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
