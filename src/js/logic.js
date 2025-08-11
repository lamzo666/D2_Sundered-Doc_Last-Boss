// src/js/logic.js
import {
  getValidSymbols,
  validateGroup,
  lockGroup,
  clearLock
} from './combination_logic_module.js';

window.addEventListener('DOMContentLoaded', () => {
  // ---------- Elements ----------
  const slots = document.querySelectorAll('.dial-slot');
  const symbolPopup = document.getElementById('symbolPopup');
  const popupGrid = document.getElementById('popupGrid');
  const lockButton = document.getElementById('lockButton');
  const resetButton = document.querySelector('.btn-reset');
  const tooltip = document.getElementById('tooltip');
  const tooltipCheckbox = document.getElementById('tooltipCheckbox');
  const symbolNamesCheckbox = document.getElementById('symbolNamesCheckbox');

  // ---------- First-visit defaults + persistent toggles ----------
  function getBoolPref(key, defaultTrue) {
    const v = localStorage.getItem(key);
    if (v === null) {
      localStorage.setItem(key, defaultTrue ? 'true' : 'false');
      return !!defaultTrue;
    }
    return v === 'true';
  }

  // First time on site: both ON by default
  const tooltipOn = getBoolPref('tooltipVisible', true);
  const namesOn   = getBoolPref('showSymbolNames', true);

  // Apply tooltip state + checkbox
  if (tooltipOn) tooltip?.classList.remove('hidden');
  else tooltip?.classList.add('hidden');
  if (tooltipCheckbox) tooltipCheckbox.checked = tooltipOn;

  // Show/hide labels (dial + map)
  function applyNamesVisibility(show) {
    document
      .querySelectorAll('.dial-slot .symbol-name, .map-label')
      .forEach(el => el.style.display = show ? 'block' : 'none');
  }
  applyNamesVisibility(namesOn);
  if (symbolNamesCheckbox) symbolNamesCheckbox.checked = namesOn;

  // Persist on change
  tooltipCheckbox?.addEventListener('change', () => {
    const show = tooltipCheckbox.checked;
    tooltip?.classList.toggle('hidden', !show);
    localStorage.setItem('tooltipVisible', show ? 'true' : 'false');
  });
  symbolNamesCheckbox?.addEventListener('change', () => {
    const show = symbolNamesCheckbox.checked;
    localStorage.setItem('showSymbolNames', show ? 'true' : 'false');
    applyNamesVisibility(show);
  });

  const tell = (msg) => { if (tooltip) tooltip.textContent = msg; };

  // ---------- State ----------
  let phase = 'entry';          // 'entry' -> 'illumination' -> 'final'
  let allowedGlowSlots = [];
  let truthGroup = [];
  let lieGroup = [];

  // ---------- Mobile landscape full-map mode ----------
  function updateLandscapeMapMode() {
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    const smallScreen = window.innerWidth <= 900;
    const body = document.body;

    if (phase === 'final' && isLandscape && smallScreen) {
      body.classList.add('map-full');
      document.getElementById('tooltip-toggle')?.classList.add('hidden-on-map');
    } else {
      body.classList.remove('map-full');
      document.getElementById('tooltip-toggle')?.classList.remove('hidden-on-map');
    }
  }
  window.addEventListener('resize', updateLandscapeMapMode);
  window.addEventListener('orientationchange', updateLandscapeMapMode);

  // ---------- Helpers ----------
  const trio = (side) => ([
    document.querySelector(`.dial-slot.${side}1`)?.dataset.symbol || null,
    document.querySelector(`.dial-slot.${side}2`)?.dataset.symbol || null,
    document.querySelector(`.dial-slot.${side}3`)?.dataset.symbol || null,
  ]);
  const bothComplete = () => trio('left').every(Boolean) && trio('right').every(Boolean);

  // Create/update the text label under a dial slot
  function updateSlotLabel(slot) {
    const name = (slot.dataset.symbol || '').toUpperCase();
    let label = slot.querySelector('.symbol-name');
    if (!label) {
      label = document.createElement('div');
      label.className = 'symbol-name';
      slot.appendChild(label);
    }
    label.textContent = name;
    label.style.display = (symbolNamesCheckbox?.checked ?? true) ? 'block' : 'none';
  }

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
  }

  // As soon as one side forms a valid trio, pre-lock that side/type
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

  // ----- Autofill helpers -----
  const sideSlots = (side) => [1,2,3].map(i => document.querySelector(`.dial-slot.${side}${i}`));
  const pickSymbol = (slot, symbol) => {
    slot.dataset.symbol = symbol;
    slot.style.backgroundImage = `url('/img/${symbol}.png')`;
    updateSlotLabel(slot);
  };
  const validFor = (side, index) => {
    const selected = sideSlots(side).map(s => s?.dataset.symbol || null);
    const options = [...new Set(getValidSymbols(selected, side, index))]
      .filter(sym => !selected.includes(sym));
    return options;
  };

  const cascadeAutofill = () => {
    if (phase !== 'entry') return;
    let changed = true;
    while (changed) {
      changed = false;
      ['left','right'].forEach(side => {
        sideSlots(side).forEach((slot, i) => {
          if (!slot || slot.dataset.symbol) return;
          const options = validFor(side, i);
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
  slots.forEach(slot => {
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

      const options = validFor(side, idx);

      // Autofill if only one feasible choice
      if (options.length === 1) {
        pickSymbol(slot, options[0]);
        maybePrelock();
        checkProgress();
        cascadeAutofill();
        return;
      }

      // Otherwise show popup
      popupGrid.innerHTML = '';
      if (options.length === 0) {
        const div = document.createElement('div');
        div.textContent = 'No valid symbols';
        popupGrid.appendChild(div);
      } else {
        options.forEach(symbol => {
          const img = document.createElement('img');
          img.src = `/img/${symbol}.png`;
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
    if (!symbolPopup.contains(e.target) && ![...slots].includes(e.target)) {
      symbolPopup.style.display = 'none';
    }
  });

  // ----- Phases -----
  function enterIllumination(leftType, rightType) {
    phase = 'illumination';
    lockButton.classList.add('glow-phase');
    symbolPopup.style.display = 'none';
    tell('Now select the symbols that are illuminated in‑game');

    const L = document.getElementById('label-left');
    const R = document.getElementById('label-right');
    if (L && R) {
      L.textContent = leftType.toUpperCase();
      R.textContent = rightType.toUpperCase();
      L.className = leftType === 'truth' ? 'truth-label' : 'lie-label';
      R.className = rightType === 'truth' ? 'truth-label' : 'lie-label';
    }

    const left = trio('left');
    const right = trio('right');
    truthGroup = (leftType === 'truth') ? left : right;
    lieGroup   = (leftType === 'truth') ? right : left;

    // Only these can glow
    allowedGlowSlots = [];
    [...truthGroup, ...lieGroup].forEach(sym => {
      const slot = [...slots].find(s => s.dataset.symbol === sym);
      if (slot) {
        slot.classList.remove('glow'); // ensure clean slate
        allowedGlowSlots.push(slot);
      }
    });
  }

  function handleLock() {
    if (phase !== 'illumination') return;
    const glowingSyms = [...document.querySelectorAll('.dial-slot.glow')].map(s => s.dataset.symbol);
    const truthToVisit = truthGroup.filter(sym => glowingSyms.includes(sym)); // illuminated truths
    const lieToVisit   = lieGroup.filter(sym => !glowingSyms.includes(sym));  // non‑illuminated lies
    lockButton.classList.remove('glow-phase');
    phase = 'final';
    window.showMapHighlights(truthToVisit, lieToVisit, true);
    updateLandscapeMapMode();

    if (window.innerWidth <= 900) {
      tell('Follow the map to interact with the marked symbols. Tip: rotate your phone to landscape for a full‑map view.');
    } else {
      tell('Follow the map to interact with the marked symbols. Click Reset to start again.');
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
    tell('Enter the symbols you see in‑game');
    const overlay = document.getElementById('map-overlay');
    if (overlay) overlay.innerHTML = '';
    document.body.classList.remove('map-full');
    document.getElementById('tooltip-toggle')?.classList.remove('hidden-on-map');
    updateLandscapeMapMode();
    applyNamesVisibility(symbolNamesCheckbox?.checked ?? true);
  }

  window.handleLock = handleLock;
  window.resetDial = resetUI;
  lockButton.addEventListener('click', handleLock);
  resetButton.addEventListener('click', resetUI);

  // When both trios are set, only proceed if they’re opposite types AND disjoint
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
});
