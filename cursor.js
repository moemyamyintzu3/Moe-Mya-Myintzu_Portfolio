// Custom cursor: a dot that follows the mouse exactly and a ring that trails it.
(function () {
  // Phones and tablets keep their normal behavior.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const LERP = 0.18;
  const LINK_SELECTOR = 'a[href], button, [role="button"], label, select, summary, input[type="button"], input[type="checkbox"], input[type="radio"], input[type="reset"], input[type="submit"]';
  const FIELD_SELECTOR = 'input:not([type="button"], [type="checkbox"], [type="color"], [type="file"], [type="image"], [type="radio"], [type="range"], [type="reset"], [type="submit"]), textarea, [contenteditable="true"]';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');

  document.body.append(ring, dot);
  root.classList.add('has-custom-cursor');

  let mouseX = 0;
  let mouseY = 0;
  let ringX = 0;
  let ringY = 0;
  let frame = null;
  let hasMoved = false;

  function placeRing() {
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
  }

  function followMouse() {
    ringX += (mouseX - ringX) * LERP;
    ringY += (mouseY - ringY) * LERP;

    // Stop once the ring has caught up, so nothing runs while the mouse is still.
    if (Math.abs(mouseX - ringX) < 0.1 && Math.abs(mouseY - ringY) < 0.1) {
      ringX = mouseX;
      ringY = mouseY;
      frame = null;
    } else {
      frame = requestAnimationFrame(followMouse);
    }

    placeRing();
  }

  document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;

    // Start the ring at the mouse rather than flying in from the corner.
    // With reduced motion, it stays on the mouse with no delay.
    if (!hasMoved || reducedMotion.matches) {
      hasMoved = true;
      ringX = mouseX;
      ringY = mouseY;
      placeRing();
    }

    root.classList.add('cursor-visible');

    if (reducedMotion.matches) return;
    if (frame === null) frame = requestAnimationFrame(followMouse);
  });

  document.addEventListener('mouseover', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const overField = Boolean(target.closest(FIELD_SELECTOR));
    const overLink = !overField && Boolean(target.closest(LINK_SELECTOR));

    root.classList.toggle('cursor-over-field', overField);
    root.classList.toggle('cursor-over-link', overLink);
  });

  document.addEventListener('mousedown', () => root.classList.add('cursor-pressed'));
  document.addEventListener('mouseup', () => root.classList.remove('cursor-pressed'));

  // Hide the cursor when the mouse leaves the window.
  root.addEventListener('mouseleave', () => {
    root.classList.remove('cursor-visible', 'cursor-pressed');
  });
  root.addEventListener('mouseenter', () => {
    if (hasMoved) root.classList.add('cursor-visible');
  });
})();
