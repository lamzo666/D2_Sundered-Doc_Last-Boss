// logic.js (aligned with locked combination rules — no truth/lie filtering until both groups filled)

import {
  getValidSymbols,
  validateGroup,
  lockGroup,
  getAllowedCombinations
} from './combination_logic_module.js';

const popup = document.getElementById("symbolPopup");
const popupGrid = document.getElementById("popupGrid");

let activeSlot = null;
let lockPhase = 0;

function getSymbolsFromSlots(group) {
  return [`${group}1`, `${group}2`, `${group}3`].map(id => {
    const el = document.querySelector(`.dial-slot.${id}`);
    return el?.dataset.symbol || null;
  });
}

function getUsedSymbols() {
  return [...getSymbolsFromSlots('left'), ...getSymbolsFromSlots('right')].filter(Boolean);
}

function openSymbolPopup(slot) {
  if (slot.classList.contains('locked') || lockPhase > 0) return;
  activeSlot = slot;

  const side = slot.classList.contains('left') ? 'left' : 'right';
  const selected = getSymbolsFromSlots(side);
  const usedSymbols = getSymbolsFromSlots(side).filter(Boolean);

  const slotClass = slot.dataset.position;
  const slotIndex = parseInt(slotClass.replace(/[^123]/g, '')) - 1;

  popupGrid.innerHTML = '';

  const allSymbols = [
    "worship", "witness", "light", "guardian", "worm", "traveller", "savathun",
    "stop", "darkness", "hive", "drink", "pyramid", "kill", "give"
  ];

  let validSymbols = getValidSymbols(selected, side).filter(sym => !usedSymbols.includes(sym));

  if (validSymbols.length === 0) {
    popupGrid.innerHTML = '<div style="text-align:center; color:#aaa">No valid combinations remain — reset required.</div>';
  } else {
    validSymbols.forEach(sym => {
      const div = document.createElement("div");
      div.className = "symbol-option";
      div.style.backgroundImage = `url('./img/${sym}.png')`;
      div.onclick = () => {
        slot.style.backgroundImage = `url('./img/${sym}.png')`;
        slot.dataset.symbol = sym;
        popup.style.display = "none";
      };
      popupGrid.appendChild(div);
    });
  }

  popup.style.display = "block";
}

function handleLock() {
  const left = getSymbolsFromSlots('left');
  const right = getSymbolsFromSlots('right');
  const isLeftTruth = validateGroup(left) === 'truth';
  const isLeftLie = validateGroup(left) === 'lie';
  const isRightTruth = validateGroup(right) === 'truth';
  const isRightLie = validateGroup(right) === 'lie';

  if (lockPhase === 0) {
    if ((isLeftTruth && isRightLie) || (isLeftLie && isRightTruth)) {
      document.getElementById('lockButton').classList.add('glow-phase');
      lockPhase = 1;

      [...document.querySelectorAll('.dial-slot')].forEach(slot => {
        slot.classList.add('locked');
        slot.addEventListener('click', () => {
          slot.classList.toggle('active');
          slot.style.boxShadow = slot.classList.contains('active') ? '0 0 12px 6px yellow' : 'none';
        });
      });
    } else {
      alert("You must enter one TRUTH and one LIE combination before locking.");
    }
  } else if (lockPhase === 1) {
    lockPhase = 2;
    document.getElementById('lockButton').classList.remove('glow-phase');
    const leftType = validateGroup(left);
    const rightType = validateGroup(right);

    const activeLeft = [...document.querySelectorAll('.dial-slot.left')].filter(s => s.classList.contains('active')).map(s => s.dataset.symbol);
    const activeRight = [...document.querySelectorAll('.dial-slot.right')].filter(s => s.classList.contains('active')).map(s => s.dataset.symbol);

    const truthSymbols = leftType === 'truth' ? activeLeft : activeRight;
    const lieSymbols = leftType === 'truth' ? activeRight : activeLeft;

    if (window.showMapHighlights) {
      window.showMapHighlights(truthSymbols, lieSymbols, [...new Set([...activeLeft, ...activeRight])]);
    }
  }
}

function resetDial() {
  document.querySelectorAll('.dial-slot').forEach(slot => {
    const newSlot = slot.cloneNode(true);
    newSlot.classList.remove('locked', 'active');
    newSlot.removeAttribute('data-symbol');
    newSlot.style.backgroundImage = '';
    newSlot.style.boxShadow = 'none';
    slot.replaceWith(newSlot);
  });
  document.getElementById('lockButton').classList.remove('glow-phase');
  lockPhase = 0;
  bindDialClickHandlers();
}

function bindDialClickHandlers() {
  document.querySelectorAll('.dial-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      if (!slot.classList.contains('locked') && lockPhase === 0) {
        openSymbolPopup(slot);
      }
    });
  });
}

window.handleLock = handleLock;
window.resetDial = resetDial;
window.addEventListener('DOMContentLoaded', bindDialClickHandlers);
window.addEventListener('click', (e) => {
  if (!document.getElementById('symbolPopup').contains(e.target) && e.target !== activeSlot) {
    document.getElementById('symbolPopup').style.display = 'none';
  }
});
