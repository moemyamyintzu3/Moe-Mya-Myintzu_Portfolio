// Menu button and full-screen menu for phones, animated with Motion (motion.dev).
// Runs only on pages whose <body> has the is-responsive class. The layout is in
// css/responsive.css, so the menu still opens and closes if Motion fails.
(function () {
  const navbar = document.querySelector('.navbar');
  const links = document.querySelector('.navbar__links');
  if (!navbar || !links || !document.body.classList.contains('is-responsive')) return;

  const root = document.documentElement;
  // Tablets and phones. Matches the menu breakpoint in css/responsive.css.
  const phone = window.matchMedia('(max-width: 1023px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion = window.Motion || null;

  // Menu button: three lines that turn into an ✕ (drawn in CSS).
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'menu-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'mobile-menu');
  toggle.setAttribute('aria-label', 'Open menu');
  toggle.innerHTML =
    '<span class="menu-toggle__line"></span><span class="menu-toggle__line"></span><span class="menu-toggle__line"></span>';
  navbar.append(toggle);

  // The menu is built from the navbar's own links, so they only live in one place.
  const menu = document.createElement('div');
  menu.className = 'mobile-menu';
  menu.id = 'mobile-menu';
  menu.hidden = true;

  const nav = document.createElement('nav');
  nav.className = 'mobile-menu__links';
  nav.setAttribute('aria-label', 'Main navigation');
  links.querySelectorAll('.navbar__link').forEach((link) => {
    const item = document.createElement('a');
    item.className = 'mobile-menu__link';
    item.href = link.getAttribute('href');
    item.textContent = link.textContent.trim();
    if (link.hasAttribute('aria-current')) item.setAttribute('aria-current', link.getAttribute('aria-current'));
    nav.append(item);
  });

  const bottom = document.createElement('div');
  bottom.className = 'mobile-menu__bottom';
  const resume = links.querySelector('.navbar__resume');
  if (resume) bottom.append(resume.cloneNode(true));

  menu.append(nav, bottom);
  navbar.after(menu);
  document.body.classList.add('has-mobile-menu');

  const items = [...nav.children, ...bottom.children];
  // Everything except the navbar and the menu, so focus and screen readers stay inside.
  const outside = [...document.body.children].filter((el) => el !== navbar && el !== menu && el.tagName !== 'SCRIPT');

  let open = false;
  let closing = null;

  function setOutsideInert(value) {
    outside.forEach((el) => {
      el.inert = value;
    });
  }

  function openMenu() {
    if (open) return;
    open = true;
    if (closing) closing.stop();
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    menu.hidden = false;
    root.classList.add('menu-open');
    setOutsideInert(true);

    if (motion && !reducedMotion.matches) {
      const { animate, stagger } = motion;
      animate(menu, { opacity: [0, 1] }, { duration: 0.25, ease: 'easeOut' });
      animate(items, { opacity: [0, 1], y: [24, 0] }, { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: stagger(0.06, { startDelay: 0.05 }) });
    }
  }

  function closeMenu(instant) {
    if (!open) return;
    open = false;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    root.classList.remove('menu-open');
    setOutsideInert(false);

    const finish = () => {
      if (!open) menu.hidden = true;
    };
    if (motion && !reducedMotion.matches && !instant) {
      closing = motion.animate(menu, { opacity: 0 }, { duration: 0.2, ease: 'easeIn' });
      closing.then(finish);
    } else {
      finish();
    }
  }

  toggle.addEventListener('click', () => (open ? closeMenu() : openMenu()));

  // A tap on any link closes the menu. The Resume link opens in a new tab, so
  // the page is still here, closed, when the visitor comes back.
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu(true);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) {
      closeMenu();
      toggle.focus();
    }
  });

  // Turning a tablet sideways can make the screen wide enough for the normal navbar.
  phone.addEventListener('change', () => {
    if (!phone.matches) closeMenu(true);
  });

  // Coming back with the Back button can restore the page with the menu open.
  window.addEventListener('pageshow', () => closeMenu(true));
})();
