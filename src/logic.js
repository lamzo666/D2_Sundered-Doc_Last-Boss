import {
  getValidSymbols,
  validateGroup,
  lockGroup,
  clearLock
} from './combination_logic_module.js';
import './map_logic.js';

window.addEventListener('DOMContentLoaded', () => {
  /* ---------- Force TRUTH/LIE label size from the dial's width ---------- */
  const sizeTruthLieFromDial = () => {
    const dial = document.querySelector('.dial');
    if (!dial) return;
    const dialWidth = dial.getBoundingClientRect().width; // current pixels
    const coef = parseFloat(getComputedStyle(document.documentElement)
                  .getPropertyValue('--truthlie-coef')) || 0.085;
    const px = Math.max(10, Math.round(dialWidth * coef)) + 'px';
    const L = document.getElementById('label-left');
    const R = document.getElementById('label-right');
    if (L) L.style.setProperty('font-size', px, 'important');
    if (R) R.style.setProperty('font-size', px, 'important');
  };
  requestAnimationFrame(sizeTruthLieFromDial);
  window.addEventListener('resize', sizeTruthLieFromDial);

  const slots = document.querySelectorAll('.dial-slot');
  const symbolPopup = document.getElementById('symbolPopup');
  const popupGrid = document.getElementById('popupGrid');
  const lockButton = document.getElementById('lockButton');
  const resetButton = document.querySelector('.btn-reset');
  const tooltip = document.getElementById('tooltip');
  const tooltipCheckbox = document.getElementById('tooltipCheckbox');
  const symbolNamesCheckbox = document.getElementById('symbolNamesCheckbox');

  let phase = 'entry';
  let allowedGlowSlots = [];
  let truthGroup = [];
  let lieGroup = [];

  // ---------- First-visit defaults ----------
  if (localStorage.getItem('firstVisitDone') !== 'true') {
    localStorage.setItem('tooltipVisible', 'true');
    localStorage.setItem('showSymbolNames', 'true');
    localStorage.setItem('firstVisitDone', 'true');
  }

  // ---------- Tooltip toggle (persist) ----------
  const tooltipOn = (localStorage.getItem('tooltipVisible') ?? 'true') === 'true';
  tooltipCheckbox.checked = tooltipOn;
  tooltip.classList.toggle('hidden', !tooltipOn);
  tooltipCheckbox.addEventListener('change', () => {
    const show = tooltipCheckbox.checked;
    tooltip.classList.toggle('hidden', !show);
    localStorage.setItem('tooltipVisible', show ? 'true' : 'false');
  });
  const tell = (msg) => { if (tooltip) tooltip.textContent = msg; };

  // ---------- Symbol names toggle (persist) ----------
  const showNames = (localStorage.getItem('showSymbolNames') ?? 'true') === 'true';
  symbolNamesCheckbox.checked = showNames;
  function applyNamesVisibility(show) {
    document.querySelectorAll('.dial-slot .symbol-name, .map-label').forEach(el => {
      el.style.display = show ? 'block' : 'none';
    });
  }
  applyNamesVisibility(showNames);
  symbolNamesCheckbox.addEventListener('change', () => {
    const on = symbolNamesCheckbox.checked;
    localStorage.setItem('showSymbolNames', on ? 'true' : 'false');
    applyNamesVisibility(on);
  });

  // ---------- Helpers ----------
  const sideSlots = (side) => [1,2,3].map(i => document.querySelector(`.dial-slot.${side}${i}`));
  const trio = (side) => sideSlots(side).map(s => s?.dataset.symbol || null);
  const bothComplete = () => trio('left').every(Boolean) && trio('right').every(Boolean);

  function updateSlotLabel(slot) {
    const name = (slot.dataset.symbol || '').toUpperCase();
    let label = slot.querySelector('.symbol-name');
    if (!label) {
      label = document.createElement('div');
      label.className = 'symbol-name';
      slot.appendChild(label);
    }
    label.textContent = name;
    label.style.display = symbolNamesCheckbox.checked ? 'block' : 'none';
  }

  // Pre-lock whichever side finishes first
  const maybePrelock = () => {
    if (phase !== 'entry') return;
    const L = trio('left'), R = trio('right');
    const Lc = L.every(Boolean), Rc = R.every(Boolean);
    if (Lc && !Rc) {
      const t = validateGroup(L);
      if (t) { lockGroup('left', t); setLabel('left', t); tell('Now complete the opposite side.'); }
    } else if (Rc && !Lc) {
      const t = validateGroup(R);
      if (t) { lockGroup('right', t); setLabel('right', t); tell('Now complete the opposite side.'); }
    }
  };

  function setLabel(which, type) {
    const L = document.getElementById('label-left');
    const R = document.getElementById('label-right');
    const apply = (el, t) => {
      if (!el) return;
      el.textContent = t ? t.toUpperCase() : '';
      el.className = t === 'truth' ? 'truth-label' : (t === 'lie' ? 'lie-label' : '');
    };
    if (which === 'left') { apply(L, type); if (R) apply(R, ''); }
    else { apply(R, type); if (L) apply(L, ''); }
    sizeTruthLieFromDial();
  }

  const pickSymbol = (slot, symbol) => {
    slot.dataset.symbol = symbol || '';
    slot.style.backgroundImage = symbol ? `url('img/${symbol}.png')` : '';
    updateSlotLabel(slot);
  };

  // ====== Options helpers (additions) ======
  function getOptionsForSelected(selectedArr, side, index) {
    const raw = [...new Set(getValidSymbols(selectedArr, side, index))];
    const taken = new Set(selectedArr.filter(Boolean)); // avoid dup in same trio
    return raw.filter(sym => !taken.has(sym));
  }
  // treat a filled slot as empty to let user change their mind
  function optionsTreatingSlotEmpty(side, index) {
    const arr = trio(side);
    arr[index] = null;
    return getOptionsForSelected(arr, side, index);
  }
  // normal (slot is empty already)
  function optionsNormal(side, index) {
    const arr = trio(side);
    return getOptionsForSelected(arr, side, index);
  }

  const cascadeAutofill = () => {
    if (phase !== 'entry') return;
    let changed = true;
    while (changed) {
      changed = false;
      ['left','right'].forEach(side => {
        sideSlots(side).forEach((slot, i) => {
          if (!slot || slot.dataset.symbol) return;
          const options = optionsNormal(side, i);
          if (options.length === 1) {
            pickSymbol(slot, options[0]);
            changed = true;
            maybePrelock();
          }
        });
      });
    }
    checkProgress();
  };

  // ----- Slot click -----
  const slotsArr = [...slots];
  slotsArr.forEach(slot => {
    slot.addEventListener('click', () => {
      if (phase === 'final') return;

      const cls = Array.from(slot.classList);
      const l = cls.find(c => /^left[123]$/.test(c));
      const r = cls.find(c => /^right[123]$/.test(c));
      const side = l ? 'left' : r ? 'right' : null;
      const idx  = l ? +l.replace('left','')-1 : r ? +r.replace('right','')-1 : null;
      if (!side || idx == null) return;

      if (phase === 'illumination') {
        if (allowedGlowSlots.includes(slot)) slot.classList.toggle('glow');
        return;
      }

      const hadSymbol = !!slot.dataset.symbol;

      // If slot has a symbol, pretend it's empty so we can show alternatives
      let options = hadSymbol ? optionsTreatingSlotEmpty(side, idx)
                              : optionsNormal(side, idx);

      // If there are truly no alternatives, allow re-picking the same symbol
      if (hadSymbol && options.length === 0 && slot.dataset.symbol) {
        options = [slot.dataset.symbol];
      }

      // Build popup
      popupGrid.innerHTML = '';

      // "Clear" tile for filled slots
      if (hadSymbol) {
        const clearDiv = document.createElement('div');
        clearDiv.textContent = 'Clear';
        Object.assign(clearDiv.style, {
          width:'60px', height:'60px', display:'flex',
          alignItems:'center', justifyContent:'center',
          background:'#333', border:'1px solid #777',
          borderRadius:'8px', color:'#fff', cursor:'pointer',
          fontSize:'14px', fontWeight:'700'
        });
        clearDiv.addEventListener('click', () => {
          pickSymbol(slot, '');
          symbolPopup.style.display = 'none';
          // Clearing can invalidate any pre-lock
          clearLock();
          document.getElementById('label-left').textContent = '';
          document.getElementById('label-right').textContent = '';
          tell('Enter the symbols you see in-game');
          sizeTruthLieFromDial();
          checkProgress();
        });
        popupGrid.appendChild(clearDiv);
      }

      if (options.length === 0) {
        const div = document.createElement('div');
        div.textContent = 'No valid symbols';
        popupGrid.appendChild(div);
      } else {
        options.forEach(symbol => {
          const img = document.createElement('img');
          img.src = `img/${symbol}.png`;
          img.alt = symbol;
          img.addEventListener('click', () => {
            pickSymbol(slot, symbol);
            symbolPopup.style.display = 'none';
            maybePrelock();
            checkProgress();
            cascadeAutofill();
          });
          popupGrid.appendChild(img);
        });
      }
      symbolPopup.style.display = 'block';
    });
  });

  document.addEventListener('click', e => {
    if (!symbolPopup.contains(e.target) && !slotsArr.includes(e.target)) {
      symbolPopup.style.display = 'none';
    }
  });

  // ----- Phases -----
  function enterIllumination(leftType, rightType) {
    phase = 'illumination';
    lockButton.classList.add('glow-phase');
    symbolPopup.style.display = 'none';
    tell('Now select the symbols that are illuminated in-game');

    const L = document.getElementById('label-left');
    const R = document.getElementById('label-right');
    if (L && R) {
      L.textContent = leftType.toUpperCase();
      R.textContent = rightType.toUpperCase();
      L.className = leftType === 'truth' ? 'truth-label' : 'lie-label';
      R.className = rightType === 'truth' ? 'truth-label' : 'lie-label';
      sizeTruthLieFromDial();
    }

    const left = trio('left');
    const right = trio('right');
    truthGroup = (leftType === 'truth') ? left : right;
    lieGroup   = (leftType === 'truth') ? right : left;

    allowedGlowSlots = [];
    [...truthGroup, ...lieGroup].forEach(sym => {
      const slot = slotsArr.find(s => s.dataset.symbol === sym);
      if (slot) allowedGlowSlots.push(slot);
    });
  }

  function handleLock() {
    if (phase !== 'illumination') return;
    const glowing = [...document.querySelectorAll('.dial-slot.glow')].map(s => s.dataset.symbol);
    const truthToVisit = truthGroup.filter(sym => glowing.includes(sym));
    const lieToVisit   = lieGroup.filter(sym => !glowing.includes(sym));
    lockButton.classList.remove('glow-phase');
    phase = 'final';
    tell('Follow the map to interact with the marked symbols. Click Reset to start again.');
    window.showMapHighlights(truthToVisit, lieToVisit);

    if (window.matchMedia('(orientation: landscape)').matches && window.innerWidth <= 900) {
      document.body.classList.add('map-full');
    }
  }

  function resetUI() {
    document.querySelectorAll('.dial-slot').forEach(s => {
      s.dataset.symbol = '';
      s.style.backgroundImage = '';
      s.classList.remove('glow');
      const label = s.querySelector('.symbol-name');
      if (label) label.textContent = '';
    });
    document.getElementById('label-left').textContent = '';
    document.getElementById('label-right').textContent = '';
    lockButton.classList.remove('glow-phase');
    symbolPopup.style.display = 'none';
    phase = 'entry';
    allowedGlowSlots = [];
    truthGroup = [];
    lieGroup = [];
    clearLock();
    tell('Enter the symbols you see in-game');
    const overlay = document.getElementById('map-overlay');
    if (overlay) overlay.innerHTML = '';
    applyNamesVisibility(symbolNamesCheckbox.checked);
    document.body.classList.remove('map-full');
    sizeTruthLieFromDial();
  }

  window.handleLock = handleLock;
  window.resetDial = resetUI;
  lockButton.addEventListener('click', handleLock);
  resetButton.addEventListener('click', resetUI);

  // When both trios are set, only proceed if opposite types AND disjoint
  function checkProgress() {
    if (!bothComplete()) return;

    const L = trio('left');
    const R = trio('right');
    const Lt = validateGroup(L);
    const Rt = validateGroup(R);
    const disjoint = !L.some(s => R.includes(s));
    const validPair =
      disjoint &&
      ((Lt === 'truth' && Rt === 'lie') || (Lt === 'lie' && Rt === 'truth'));

    if (validPair) {
      enterIllumination(Lt, Rt);
    } else {
      tell('Both sides must be opposite types with no duplicate symbols across the dial.');
    }
  }

  window.addEventListener('orientationchange', () => {
    if (phase === 'final' && window.innerWidth <= 900 &&
        window.matchMedia('(orientation: landscape)').matches) {
      document.body.classList.add('map-full');
    } else {
      document.body.classList.remove('map-full');
    }
  });
});
