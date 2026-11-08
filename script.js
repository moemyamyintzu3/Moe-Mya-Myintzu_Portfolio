const palette = document.querySelector('.command-palette');
const palettePanel = document.querySelector('.palette-panel');
const triggerButtons = document.querySelectorAll('[data-open-palette], .nav-trigger');
const closeButton = document.querySelector('.close-button');
const items = document.querySelectorAll('.palette-item');
const input = document.getElementById('palette-input');

function openPalette() {
  if (!palette) return;
  palette.classList.add('visible');
  palette.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => input && input.focus());
}

function closePalette() {
  if (!palette) return;
  palette.classList.remove('visible');
  palette.setAttribute('aria-hidden', 'true');
}

triggerButtons.forEach((button) => {
  button.addEventListener('click', openPalette);
});

closeButton?.addEventListener('click', closePalette);

palette?.addEventListener('click', (event) => {
  if (event.target === palette) {
    closePalette();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !event.target.matches('input, textarea')) {
    event.preventDefault();
    openPalette();
  }

  if (event.key === 'Escape' && palette?.classList.contains('visible')) {
    closePalette();
  }
});

items.forEach((item) => {
  item.addEventListener('click', () => {
    const target = item.dataset.target;
    if (!target) return;

    document.querySelectorAll('.palette-item').forEach((node) => node.classList.remove('is-active'));
    item.classList.add('is-active');

    const section = document.querySelector(target);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    closePalette();
  });
});

if (input) {
  input.addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();

    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      const shouldShow = !query || text.includes(query);
      item.style.display = shouldShow ? 'flex' : 'none';
    });
  });
}
