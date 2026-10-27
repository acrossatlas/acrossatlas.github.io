// Records whether the last interaction was keyboard or pointer on <html data-input>,
// so focus rings show for keyboard navigation only (Safari focuses some controls on click).
const root = document.documentElement;
root.dataset.input = 'pointer';
window.addEventListener('pointerdown', () => { root.dataset.input = 'pointer'; }, true);
window.addEventListener('keydown', event => {
  if (event.key === 'Tab' || event.key.startsWith('Arrow') || event.key === 'Enter' || event.key === ' ') root.dataset.input = 'keyboard';
}, true);
