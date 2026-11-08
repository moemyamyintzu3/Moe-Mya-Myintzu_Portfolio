// Hover animation for the hero social icons, built with Motion (motion.dev).
// The icons lift with a spring and show a label. The color change is in
// css/style.css, so it also works with reduced motion or if Motion fails.
(function () {
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const links = document.querySelectorAll('.hero__social a');

  if (!canHover || reducedMotion || !links.length || !window.Motion) return;

  const { animate } = window.Motion;
  const SPRING = { type: 'spring', stiffness: 400, damping: 15 };
  const TIP = { duration: 0.2, ease: 'easeOut' };
  const SHADOW = { duration: 0.25, ease: 'easeOut' };

  links.forEach((link) => {
    const icon = link.querySelector('svg');

    // The icon moves inside the link, which stays still. That way the hover
    // doesn't flicker when the icon lifts away from the pointer.
    const lift = document.createElement('span');
    lift.className = 'social-lift';
    icon.replaceWith(lift);
    lift.append(icon);

    // A copy behind the icon carries the shadow, so it can fade with opacity.
    const shadow = icon.cloneNode(true);
    shadow.classList.add('social-lift__shadow');
    lift.prepend(shadow);

    // Centered by its anchor, so Motion's transforms stay free for the animation.
    const anchor = document.createElement('span');
    anchor.className = 'social-tip-anchor';
    anchor.setAttribute('aria-hidden', 'true');
    const tip = document.createElement('span');
    tip.className = 'social-tip';
    tip.textContent = link.dataset.tooltip;
    anchor.append(tip);
    link.append(anchor);

    let open = false;

    function show() {
      if (open) return;
      open = true;
      animate(lift, { y: -6, scale: 1.15 }, SPRING);
      animate(shadow, { opacity: 1 }, SHADOW);
      animate(tip, { opacity: 1, y: 0, scale: 1 }, TIP);
    }

    function hide() {
      if (!open) return;
      open = false;
      animate(lift, { y: 0, scale: 1 }, SPRING);
      animate(shadow, { opacity: 0 }, SHADOW);
      animate(tip, { opacity: 0, y: 8, scale: 0.9 }, TIP);
    }

    animate(tip, { opacity: 0, y: 8, scale: 0.9 }, { duration: 0 });

    link.addEventListener('mouseenter', show);
    link.addEventListener('mouseleave', () => {
      if (!link.matches(':focus-visible')) hide();
    });
    // Keyboard focus only, so clicking doesn't leave the label showing.
    link.addEventListener('focus', () => {
      if (link.matches(':focus-visible')) show();
    });
    link.addEventListener('blur', () => {
      if (!link.matches(':hover')) hide();
    });
  });
})();
