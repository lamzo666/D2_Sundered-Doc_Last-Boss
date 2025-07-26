console.log('✅ logic.js loaded');
function handleSlotClick(slot) { alert('Clicked: ' + slot.dataset.position); }
window.handleSlotClick = handleSlotClick;