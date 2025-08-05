
import {
  getValidSymbols,
  validateGroup,
  lockGroup
} from './js/combination_logic_module.js';

const slots = document.querySelectorAll('.dial-slot');
const symbolPopup = document.getElementById('symbolPopup'); // ✅ fixed here
const lockButton = document.getElementById('lock-button');
const resetButton = document.getElementById('reset-button');

let currentSlot = null;

slots.forEach(slot => {
  slot.addEventListener('click', () => {
    if (lockButton.classList.contains('locked')) return;

    currentSlot = slot;

    const classList = Array.from(slot.classList);
    const leftMatch = classList.find(cls => /^left[123]$/.test(cls));
    const rightMatch = classList.find(cls => /^right[123]$/.test(cls));
    const side = leftMatch ? "left" : rightMatch ? "right" : null;
    const slotIndex = leftMatch
      ? parseInt(leftMatch.replace("left", "")) - 1
      : rightMatch
        ? parseInt(rightMatch.replace("right", "")) - 1
        : null;

    if (!side || slotIndex === null) {
      console.error("Unable to determine slot side or index.");
      return;
    }

    const selected = Array.from(slots)
      .filter(s => s.classList.contains(`${side}1`) || s.classList.contains(`${side}2`) || s.classList.contains(`${side}3`))
      .map(s => s.dataset.symbol || null);

    const validSymbols = [...new Set(getValidSymbols(selected, side, slotIndex))].filter(sym => !selected.includes(sym));

    symbolPopup.innerHTML = '';
    if (validSymbols.length === 0) {
      const noSymbols = document.createElement('div');
      noSymbols.textContent = 'No valid symbols';
      symbolPopup.appendChild(noSymbols);
    } else {
      validSymbols.forEach(symbol => {
        const img = document.createElement('img');
        img.src = `img/${symbol}.png`;
        img.alt = symbol;
        img.addEventListener('click', () => {
          currentSlot.dataset.symbol = symbol;
          currentSlot.style.backgroundImage = `url('img/${symbol}.png')`;
          symbolPopup.style.display = 'none';

          checkForGroupCompletion('left');
          checkForGroupCompletion('right');
        });
        symbolPopup.appendChild(img);
      });
    }

    symbolPopup.style.display = 'block';
  });
});

document.addEventListener('click', e => {
  if (!symbolPopup.contains(e.target) && ![...slots].includes(e.target)) {
    symbolPopup.style.display = 'none';
  }
});

lockButton.addEventListener('click', () => {
  lockButton.classList.toggle('locked');
  if (lockButton.classList.contains('locked')) {
    lockInGroupStates();
  }
});

resetButton.addEventListener('click', () => {
  slots.forEach(slot => {
    slot.dataset.symbol = '';
    slot.style.backgroundImage = '';
  });
  lockButton.classList.remove('locked');
  symbolPopup.style.display = 'none';
});

function checkForGroupCompletion(side) {
  const groupSymbols = [
    document.querySelector(`.dial-slot.${side}1`)?.dataset.symbol,
    document.querySelector(`.dial-slot.${side}2`)?.dataset.symbol,
    document.querySelector(`.dial-slot.${side}3`)?.dataset.symbol
  ];

  if (groupSymbols.every(Boolean)) {
    const result = validateGroup(groupSymbols);
    if (result) {
      lockGroup(side, result);
    }
  }
}

function lockInGroupStates() {
  checkForGroupCompletion('left');
  checkForGroupCompletion('right');
}
