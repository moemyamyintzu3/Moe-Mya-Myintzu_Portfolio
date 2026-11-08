// Certificates deck on the About page, built with Motion (motion.dev).
// The cards start stacked, fan out once when the section scrolls into view,
// and lift when hovered or focused. Positions come from css/style.css.
(function () {
  const section = document.querySelector('.cert-section');
  if (!section) return;

  // Below 1024px the certificates are a grid (tablet) or a swipeable row (phone),
  // laid out in css/responsive.css, so the fan doesn't run.
  const responsive = document.body.classList.contains('is-responsive');
  if (responsive && window.matchMedia('(max-width: 1023px)').matches) {
    if (window.matchMedia('(max-width: 767px)').matches) addCarouselDots(section);
    return;
  }

  if (!window.Motion) return; // Without Motion, the CSS shows the fan.

  const { animate, inView } = window.Motion;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;

  const SPRING = { type: 'spring', stiffness: 120, damping: 18 };
  const STAGGER = 0.08;
  const HOVER = { duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' };
  const FADE = { duration: 0.25, ease: 'easeOut' };

  const deck = section.querySelector('.cert-deck');
  const caption = section.querySelector('.cert-caption');
  const captionTitle = caption.querySelector('.cert-caption__title');
  const captionMeta = caption.querySelector('.cert-caption__meta');

  const cards = [...deck.querySelectorAll('.cert-card')].map((element, index) => {
    const styles = getComputedStyle(element);
    const read = (name) => parseFloat(styles.getPropertyValue(name));
    return {
      element,
      index,
      fan: { x: read('--fan-x'), y: read('--fan-y'), rotate: read('--fan-r') },
      stackRotate: read('--stack-r'),
    };
  });

  let fanned = false;
  let active = null;
  let captionFade = null;

  function showCaption(card) {
    captionTitle.textContent = card.element.dataset.title;
    captionMeta.textContent = card.element.dataset.meta;
    if (captionFade) captionFade.stop();
    captionFade = animate(caption, { opacity: 1 }, FADE);
  }

  function hideCaption() {
    if (captionFade) captionFade.stop();
    captionFade = animate(caption, { opacity: 0 }, FADE);
  }

  function lift(card) {
    if (!fanned) return;
    if (active && active !== card) lower(active);
    active = card;
    card.element.classList.add('is-active');
    animate(card.element, { y: -20, rotate: 0, scale: 1.05 }, HOVER);
    showCaption(card);
  }

  function lower(card) {
    card.element.classList.remove('is-active');
    animate(card.element, { y: card.fan.y, rotate: card.fan.rotate, scale: 1 }, HOVER);
    if (active === card) active = null;
  }

  function release(card) {
    if (active !== card) return;
    lower(card);
    hideCaption();
  }

  cards.forEach((card) => {
    if (canHover) {
      card.element.addEventListener('mouseenter', () => lift(card));
      card.element.addEventListener('mouseleave', () => {
        if (!card.element.matches(':focus-visible')) release(card);
      });
    }
    card.element.addEventListener('focus', () => {
      if (card.element.matches(':focus-visible')) lift(card);
    });
    card.element.addEventListener('blur', () => release(card));
  });

  function setStart() {
    cards.forEach((card) => {
      if (reducedMotion) {
        animate(card.element, { ...card.fan, opacity: 0 }, { duration: 0 });
      } else {
        animate(card.element, { x: 0, y: 0, rotate: card.stackRotate }, { duration: 0 });
      }
    });
  }

  function reveal() {
    fanned = true;
    cards.forEach((card) => {
      if (reducedMotion) {
        animate(card.element, { opacity: 1 }, { duration: 0.4, ease: 'easeOut' });
      } else {
        animate(card.element, card.fan, { ...SPRING, delay: card.index * STAGGER });
      }
    });
  }

  setStart();

  // Runs once, when 30% of the section is visible.
  const stopWatching = inView(
    section,
    () => {
      reveal();
      // inView can call back before it returns, so wait a tick to stop it.
      setTimeout(() => stopWatching(), 0);
    },
    { amount: 0.3 }
  );

  // Dots under the phone carousel: they show which certificate is in view, and
  // tapping one scrolls to it.
  function addCarouselDots(sectionEl) {
    const deck = sectionEl.querySelector('.cert-deck');
    const cards = [...deck.querySelectorAll('.cert-card')];
    const dots = document.createElement('div');
    dots.className = 'cert-dots';
    dots.setAttribute('role', 'group');
    dots.setAttribute('aria-label', 'Choose a certificate');

    const buttons = cards.map((card, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'cert-dots__dot';
      dot.setAttribute('aria-label', `Certificate ${index + 1} of ${cards.length}`);
      dot.addEventListener('click', () => {
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        deck.scrollTo({ left: card.offsetLeft - (deck.clientWidth - card.offsetWidth) / 2, behavior });
      });
      dots.append(dot);
      return dot;
    });
    deck.after(dots);

    function update() {
      const center = deck.scrollLeft + deck.clientWidth / 2;
      let current = 0;
      cards.forEach((card, index) => {
        const mid = card.offsetLeft + card.offsetWidth / 2;
        if (Math.abs(mid - center) < Math.abs(cards[current].offsetLeft + cards[current].offsetWidth / 2 - center)) current = index;
      });
      buttons.forEach((dot, index) => dot.setAttribute('aria-current', String(index === current)));
    }

    deck.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    update();
  }
})();
