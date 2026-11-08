// Dark mode switch in the navbar, animated with Motion (motion.dev).
// The colors and resting positions are in the stylesheets, so the switch still
// works without animation if Motion fails or reduced motion is on.
(function () {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const root = document.documentElement;
  const STORAGE_KEY = 'theme';
  const KNOB_TRAVEL = 28; // Track 60px, minus the 24px knob and 4px on each side.

  const CLOUD = '<path d="M4 9.5a2.5 2.5 0 0 1 .3-5A3.5 3.5 0 0 1 11 4a2.8 2.8 0 0 1 1 5.5z" fill="#fff"/>';
  const STAR = '<path d="M5 0l1.1 3.9L10 5 6.1 6.1 5 10 3.9 6.1 0 5l3.9-1.1z" fill="#f5f3ff"/>';
  const RAYS = [0, 45, 90, 135, 180, 225, 270, 315]
    .map((angle) => `<line x1="12" y1="2.6" x2="12" y2="4.8" transform="rotate(${angle} 12 12)"/>`)
    .join('');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'theme-switch';
  button.setAttribute('role', 'switch');
  button.setAttribute('aria-label', 'Dark mode');
  button.innerHTML = `
    <span class="theme-switch__night"></span>
    <svg class="theme-switch__cloud theme-switch__cloud--1" viewBox="0 0 14 10" aria-hidden="true">${CLOUD}</svg>
    <svg class="theme-switch__cloud theme-switch__cloud--2" viewBox="0 0 14 10" aria-hidden="true">${CLOUD}</svg>
    <svg class="theme-switch__cloud theme-switch__cloud--3" viewBox="0 0 14 10" aria-hidden="true">${CLOUD}</svg>
    <svg class="theme-switch__star theme-switch__star--1" viewBox="0 0 10 10" aria-hidden="true">${STAR}</svg>
    <svg class="theme-switch__star theme-switch__star--2" viewBox="0 0 10 10" aria-hidden="true">${STAR}</svg>
    <svg class="theme-switch__star theme-switch__star--3" viewBox="0 0 10 10" aria-hidden="true">${STAR}</svg>
    <span class="theme-switch__knob">
      <span class="theme-switch__spin">
        <span class="theme-switch__knob-night"></span>
        <svg class="theme-switch__sun" viewBox="0 0 24 24" aria-hidden="true">
          <g class="theme-switch__rays">${RAYS}</g>
          <circle class="theme-switch__core" cx="12" cy="12" r="4.6"/>
        </svg>
        <span class="theme-switch__moon-turn">
          <svg class="theme-switch__moon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.6 5.2a7.2 7.2 0 1 0 4.2 10.6 6 6 0 0 1-4.2-10.6z"/>
            <circle class="theme-switch__crater" cx="9" cy="11" r="1"/>
            <circle class="theme-switch__crater" cx="11.4" cy="15.6" r="0.8"/>
          </svg>
        </span>
      </span>
    </span>`;
  navbar.append(button);

  const isDark = () => root.dataset.theme === 'dark';
  button.setAttribute('aria-checked', String(isDark()));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = !reducedMotion && window.Motion ? window.Motion : null;

  const get = (selector) => button.querySelector(selector);
  const knob = get('.theme-switch__knob');
  const spin = get('.theme-switch__spin');
  const night = get('.theme-switch__night');
  const knobNight = get('.theme-switch__knob-night');
  const rays = get('.theme-switch__rays');
  const core = get('.theme-switch__core');
  const moon = get('.theme-switch__moon');
  const clouds = [...button.querySelectorAll('.theme-switch__cloud')];
  const stars = [...button.querySelectorAll('.theme-switch__star')];

  function animateSwitch(dark, instant) {
    const { animate, stagger } = motion;
    const SPRING = instant ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 };
    const timed = (duration, extra) => (instant ? { duration: 0 } : { duration, ease: 'easeInOut', ...extra });

    animate(knob, { x: dark ? KNOB_TRAVEL : 0 }, SPRING);
    animate(spin, { rotate: dark ? 180 : 0 }, SPRING);
    animate(night, { opacity: dark ? 1 : 0 }, timed(0.4));
    animate(knobNight, { opacity: dark ? 1 : 0 }, timed(0.3));

    animate(rays, { scale: dark ? 0.4 : 1, opacity: dark ? 0 : 1 }, timed(0.25, { delay: dark ? 0 : 0.1 }));
    animate(core, { opacity: dark ? 0 : 1 }, timed(0.2));
    animate(moon, { scale: dark ? 1 : 0.5, opacity: dark ? 1 : 0 }, timed(0.3, { delay: dark ? 0.1 : 0 }));

    animate(clouds, { x: dark ? 10 : 0, opacity: dark ? 0 : 1 }, timed(0.3, { delay: stagger(0.05) }));
    animate(stars, { opacity: dark ? 1 : 0 }, timed(0.3, { delay: stagger(0.06, { startDelay: dark ? 0.12 : 0 }) }));
  }

  // Match the current theme with no sliding on page load.
  if (motion) animateSwitch(isDark(), true);

  function setTheme(dark, instant) {
    root.dataset.theme = dark ? 'dark' : 'light';
    button.setAttribute('aria-checked', String(dark));
    if (motion) animateSwitch(dark, instant);
  }

  // Saved until the switch is clicked again. Storage can be blocked, for example
  // in some private windows, and the switch should still work for this page.
  function saveTheme(dark) {
    try {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    } catch (error) {
      // Nothing to do: the choice just won't be remembered.
    }
  }

  function savedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  button.addEventListener('click', () => {
    const dark = !isDark();
    saveTheme(dark);
    setTheme(dark, false);
  });

  // Keeps the page in step when returning with the Back button, or when the
  // theme was changed in another tab.
  function syncWithSaved() {
    const saved = savedTheme();
    if (saved && (saved === 'dark') !== isDark()) setTheme(saved === 'dark', true);
  }
  window.addEventListener('pageshow', syncWithSaved);
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) syncWithSaved();
  });

  if (motion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const { animate } = motion;
    const QUICK = { duration: 0.15, ease: 'easeOut' };
    let hovering = false;
    let pressed = false;
    // Hover and press would multiply if both applied, so only one is ever on.
    const update = () => {
      if (pressed) animate(knob, { scale: 1, scaleX: 1.15 }, QUICK);
      else animate(knob, { scale: hovering ? 1.08 : 1, scaleX: 1 }, QUICK);
    };
    button.addEventListener('mouseenter', () => {
      hovering = true;
      update();
    });
    button.addEventListener('mouseleave', () => {
      hovering = false;
      update();
    });
    button.addEventListener('pointerdown', () => {
      pressed = true;
      update();
    });
    window.addEventListener('pointerup', () => {
      pressed = false;
      update();
    });
  }
})();
