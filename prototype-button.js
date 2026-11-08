// Hover animation for the "View Prototype" buttons, built with Motion (motion.dev).
// The button follows the pointer a little (a magnetic pull), lifts with a glow,
// and its dot springs open to show an arrow, since the link opens Figma.
(function () {
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const buttons = document.querySelectorAll('.lumen-prototype');

  if (!canHover || reducedMotion || !buttons.length || !window.Motion) return;

  const { animate } = window.Motion;
  const SPRING = { type: 'spring', stiffness: 400, damping: 22 };
  const MAGNET = { type: 'spring', stiffness: 300, damping: 20, mass: 0.5 };
  const FADE = { duration: 0.25, ease: 'easeOut' };
  const PULL = 0.25; // How far the button follows the pointer.
  const MAX_PULL = 8;

  buttons.forEach((button) => {
    // The dot was drawn by ::before. It becomes a real element, the same size
    // and in the same place, so it can grow and hold the arrow.
    const label = document.createElement('span');
    label.className = 'proto-label';
    label.textContent = button.textContent.trim();
    button.textContent = '';

    const dot = document.createElement('span');
    dot.className = 'proto-dot';
    dot.setAttribute('aria-hidden', 'true');
    dot.innerHTML =
      '<svg class="proto-arrow" viewBox="0 0 12 12" fill="none"><path d="M3.5 8.5l5-5M4.5 3.5h4v4"/></svg>';
    const arrow = dot.querySelector('.proto-arrow');

    const glow = document.createElement('span');
    glow.className = 'proto-glow';
    glow.setAttribute('aria-hidden', 'true');

    button.append(glow, dot, label);
    button.classList.add('has-proto-motion');

    animate(arrow, { opacity: 0, rotate: -45, scale: 0.6 }, { duration: 0 });

    let open = false;

    function show() {
      if (open) return;
      open = true;
      animate(button, { scale: 1.04 }, SPRING);
      animate(glow, { opacity: 1 }, FADE);
      animate(dot, { scale: 2 }, SPRING);
      animate(arrow, { opacity: 1, rotate: 0, scale: 1 }, { ...SPRING, delay: 0.05 });
      animate(label, { x: 6 }, SPRING);
    }

    function hide() {
      if (!open) return;
      open = false;
      animate(button, { scale: 1, x: 0, y: 0 }, SPRING);
      animate(glow, { opacity: 0 }, FADE);
      animate(dot, { scale: 1 }, SPRING);
      animate(arrow, { opacity: 0, rotate: -45, scale: 0.6 }, { duration: 0.15 });
      animate(label, { x: 0 }, SPRING);
    }

    const clamp = (value) => Math.max(-MAX_PULL, Math.min(MAX_PULL, value));

    button.addEventListener('mouseenter', show);
    button.addEventListener('mousemove', (event) => {
      // Measured from where the button rests, not where the pull has moved it,
      // so it doesn't chase itself. Scaling keeps the center in place.
      const box = button.getBoundingClientRect();
      const pull = new DOMMatrix(getComputedStyle(button).transform);
      const offsetX = event.clientX - (box.left + box.width / 2 - pull.e);
      const offsetY = event.clientY - (box.top + box.height / 2 - pull.f);
      animate(button, { x: clamp(offsetX * PULL), y: clamp(offsetY * PULL) }, MAGNET);
    });
    button.addEventListener('mouseleave', () => {
      if (!button.matches(':focus-visible')) hide();
    });
    button.addEventListener('pointerdown', () => animate(button, { scale: 0.96 }, SPRING));
    button.addEventListener('pointerup', () => animate(button, { scale: open ? 1.04 : 1 }, SPRING));

    // Keyboard focus gets the same look, without the pull.
    button.addEventListener('focus', () => {
      if (button.matches(':focus-visible')) show();
    });
    button.addEventListener('blur', () => {
      if (!button.matches(':hover')) hide();
    });
  });
})();
