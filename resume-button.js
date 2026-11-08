// Hover animation for the Resume button in the navbar, built with Motion (motion.dev).
// The button lifts with a soft shadow, a shine sweeps across it once, and the
// download arrow keeps dropping into its tray while the pointer stays.
// The color change is in resume-button.css, so it also works without this script.
(function () {
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const button = document.querySelector('.navbar__resume');

  if (!canHover || reducedMotion || !button || !window.Motion) return;

  const { animate } = window.Motion;
  const EASE = { duration: 0.25, ease: 'easeOut' };
  const SETTLE = { type: 'spring', stiffness: 400, damping: 25 };
  const LOOP = 0.6;
  // The arrow reaches the tray 35% of the way through each loop.
  const LANDS = 0.35;

  const arrow = button.querySelector('.navbar__resume-arrow');
  const tray = button.querySelector('.navbar__resume-tray');

  const glow = document.createElement('span');
  glow.className = 'navbar__resume-glow';
  glow.setAttribute('aria-hidden', 'true');

  const shineClip = document.createElement('span');
  shineClip.className = 'navbar__resume-shine-clip';
  shineClip.setAttribute('aria-hidden', 'true');
  const shine = document.createElement('span');
  shine.className = 'navbar__resume-shine';
  shineClip.append(shine);

  button.prepend(glow, shineClip);

  let open = false;
  let loops = [];

  function startLoop() {
    // Down 4px and fade out into the tray, then back in from above.
    loops = [
      animate(
        arrow,
        { y: [0, 4, -6, 0], opacity: [1, 0, 0, 1] },
        { duration: LOOP, times: [0, LANDS, LANDS + 0.05, 1], ease: 'easeInOut', repeat: Infinity }
      ),
      // A small squash as the arrow lands.
      animate(
        tray,
        { scaleY: [1, 1, 0.85, 1] },
        { duration: LOOP, times: [0, LANDS - 0.05, LANDS + 0.1, 0.7], ease: 'easeOut', repeat: Infinity }
      ),
    ];
  }

  function stopLoop() {
    loops.forEach((loop) => loop.stop());
    loops = [];
    animate(arrow, { y: 0, opacity: 1 }, SETTLE);
    animate(tray, { scaleY: 1 }, SETTLE);
  }

  function show() {
    if (open) return;
    open = true;
    animate(button, { y: -2 }, EASE);
    animate(glow, { opacity: 1 }, EASE);
    animate(shine, { x: ['-100%', '170%'] }, { duration: 0.6, ease: 'easeInOut' });
    startLoop();
  }

  function hide() {
    if (!open) return;
    open = false;
    animate(button, { y: 0 }, EASE);
    animate(glow, { opacity: 0 }, EASE);
    stopLoop();
  }

  button.addEventListener('mouseenter', show);
  button.addEventListener('mouseleave', () => {
    if (!button.matches(':focus-visible')) hide();
  });
  // Keyboard focus gets the same look.
  button.addEventListener('focus', () => {
    if (button.matches(':focus-visible')) show();
  });
  button.addEventListener('blur', () => {
    if (!button.matches(':hover')) hide();
  });
})();
