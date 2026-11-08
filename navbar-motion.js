// Navbar hover animation, built with Motion (motion.dev).
// A single shared pill slides and resizes between the links.
(function () {
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const links = document.querySelector('.navbar__links');

  // These cases keep the normal hover from the site's stylesheets.
  if (!canHover || reducedMotion || !links || !window.Motion) return;

  const { animate, motionValue } = window.Motion;

  const PADDING_X = 16;
  const CAP_WIDTH = 20;
  const SPRING = { type: 'spring', stiffness: 400, damping: 30 };
  const FADE = { duration: 0.18, ease: 'easeOut' };

  const pill = document.createElement('div');
  pill.className = 'nav-pill';
  pill.setAttribute('aria-hidden', 'true');
  pill.innerHTML = `
    <div class="nav-pill__body">
      <div class="nav-pill__fill">
        <div class="nav-pill__cap nav-pill__cap--start"></div>
        <div class="nav-pill__middle"></div>
        <div class="nav-pill__cap nav-pill__cap--end"></div>
      </div>
    </div>`;
  links.prepend(pill);
  links.classList.add('has-nav-pill');

  const body = pill.querySelector('.nav-pill__body');
  const middle = pill.querySelector('.nav-pill__middle');
  const endCap = pill.querySelector('.nav-pill__cap--end');

  // Motion values keep the speed when a slide is interrupted by another hover.
  const pillX = motionValue(0);
  const pillWidth = motionValue(0);

  let visible = false;
  let slideX = null;
  let slideWidth = null;
  let fade = null;

  function render() {
    const width = Math.max(pillWidth.get(), CAP_WIDTH * 2);
    pill.style.transform = `translateX(${pillX.get()}px)`;
    middle.style.transform = `translateX(${CAP_WIDTH - 1}px) scaleX(${width - CAP_WIDTH * 2 + 2})`;
    endCap.style.transform = `translateX(${width - CAP_WIDTH}px)`;
    // Keeps the fade's scale centered on the pill.
    body.style.transformOrigin = `${width / 2}px 20px`;
  }

  pillX.on('change', render);
  pillWidth.on('change', render);

  function setFade(target) {
    if (fade) fade.stop();
    fade = animate(body, target, FADE);
  }

  function moveTo(link) {
    const linkBox = link.getBoundingClientRect();
    const linksBox = links.getBoundingClientRect();
    const x = linkBox.left - linksBox.left - PADDING_X;
    const width = linkBox.width + PADDING_X * 2;

    if (slideX) slideX.stop();
    if (slideWidth) slideWidth.stop();

    if (visible) {
      slideX = animate(pillX, x, SPRING);
      slideWidth = animate(pillWidth, width, SPRING);
      return;
    }

    // First hover: appear at the link, with no slide from the side.
    pillX.jump(x);
    pillWidth.jump(width);
    render();
    visible = true;
    setFade({ opacity: [0, 1], scale: [0.9, 1] });
  }

  function hide() {
    if (!visible) return;
    visible = false;
    setFade({ opacity: 0, scale: 0.9 });
  }

  links.querySelectorAll('.navbar__link').forEach((link) => {
    link.addEventListener('mouseenter', () => moveTo(link));
    // Keyboard focus only, so clicking with the mouse doesn't leave a pill behind.
    link.addEventListener('focus', () => {
      if (link.matches(':focus-visible')) moveTo(link);
    });
  });

  // The Resume button has its own hover, so the pill steps away from it.
  const resume = links.querySelector('.navbar__resume');
  if (resume) {
    resume.addEventListener('mouseenter', hide);
    resume.addEventListener('focus', hide);
  }

  links.addEventListener('mouseleave', () => {
    const focused = links.querySelector('.navbar__link:focus-visible');
    if (focused) moveTo(focused);
    else hide();
  });

  links.addEventListener('focusout', (event) => {
    if (!links.contains(event.relatedTarget) && !links.matches(':hover')) hide();
  });
})();
