// Entrance animations, built with Motion (motion.dev).
// Everything starts visible in the HTML. This script hides items just before
// animating them, so the content still shows if JavaScript or Motion fails.
(function () {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The page's guard hides <main> until this runs. If its timer already gave up,
  // the content is on screen, so don't hide it again.
  const guardActive = root.classList.contains('anim-wait');

  function showPage() {
    root.classList.remove('anim-wait');
  }

  if (reducedMotion || !window.Motion || !guardActive) {
    showPage();
    return;
  }

  const { animate, inView, stagger } = window.Motion;
  const EASE = [0.22, 1, 0.36, 1];

  // What fades up on scroll. Left out on purpose: the case study Contents list,
  // which must always be visible, and the certificates deck, which has its own
  // animation in certificates.js.
  const FADE_ONLY_SELECTOR = '.about-closing, .fun-snippets, .fun-thanks';

  const REVEAL_SELECTOR = [
    // Case study pages
    '.lumen .at:not(h1, .lumen-contents *, .illo-logos)',
    // Case study pages below 1200px (the single-column copy from case-study-flow.js)
    '.lumen-flow .flow-section:not(.flow-section--intro) > *',
    '.lumen-flow .flow-section--intro > :not(h1)',
    // About
    '.about-intro__heading',
    '.about-intro__bio p',
    '.about-intro__photo',
    '.section-pill',
    '.experience__item',
    '.skill',
    '.skills__more',
    '.tool',
    '.cert-subtitle',
    '.about-closing',
    // Fun
    '.fun-text',
    '.fun-photo',
    '.fun-snippets',
    '.fun-thanks',
    // Home
    '.eyebrow',
    '.lede',
    '.cta-row',
    '.highlights li',
    '.visual-card',
    '.section-heading h2',
    '.case-study',
    '.process-card',
    '.portrait-block',
    '.about-copy > *',
  ].join(', ');

  function hide(elements, transform) {
    elements.forEach((element) => {
      element.style.opacity = '0';
      element.style.transform = transform;
    });
  }

  // Removes what Motion leaves behind, so the stylesheet's own transforms,
  // like the button hover, keep working afterward.
  function clear(elements) {
    elements.forEach((element) => {
      element.style.opacity = '';
      element.style.transform = '';
      element.style.willChange = '';
    });
  }

  // A temporary layer while moving, so text glides instead of snapping to
  // whole pixels, which looks like shaking on the slow end of the ease.
  function promote(elements) {
    elements.forEach((element) => {
      element.style.willChange = 'transform, opacity';
    });
  }

  function play(elements, keyframes, options) {
    promote(elements);
    // Motion writes its final values on the next frame, so clear after that.
    return animate(elements, keyframes, options).then(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => clear(elements)));
    });
  }

  // Wraps each word in its own span. The spaces stay, so the text still reads
  // normally to screen readers and wraps the same way.
  function splitWords(element) {
    const words = [];
    // A copy of the list, because the loop adds and replaces nodes as it goes.
    [...element.childNodes].forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        words.push(...splitWords(node));
        return;
      }
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;

      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (!part.trim()) {
          fragment.append(part);
          return;
        }
        const word = document.createElement('span');
        word.style.display = 'inline-block';
        word.textContent = part;
        words.push(word);
        fragment.append(word);
      });
      node.replaceWith(fragment);
    });
    return words;
  }

  // Fades a title up word by word, then puts its original text back, so the
  // finished title is exactly what's in the HTML.
  function animateWords(title) {
    const original = title.innerHTML;
    const words = splitWords(title);
    hide(words, 'translateY(20px)');
    promote(words);
    animate(words, { opacity: [0, 1], y: [20, 0] }, { duration: 0.6, ease: EASE, delay: stagger(0.08) }).then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          title.innerHTML = original;
        });
      });
    });
  }

  function animateHero() {
    const title = document.querySelector('.hero__title');
    if (!title) return;

    const intro = document.querySelector('.hero__intro');
    const photo = document.querySelector('.hero__photo');
    const icons = [...document.querySelectorAll('.hero__social li')];

    animateWords(title);
    hide([intro], 'translateY(20px)');
    hide([photo], 'scale(0.92)');
    hide(icons, 'scale(0.6)');

    play([intro], { opacity: [0, 1], y: [20, 0] }, { duration: 0.6, ease: EASE, delay: 0.4 });
    play([photo], { opacity: [0, 1], scale: [0.92, 1] }, { duration: 0.8, ease: EASE });
    play(icons, { opacity: [0, 1], scale: [0.6, 1] }, { duration: 0.5, ease: EASE, delay: stagger(0.06, { startDelay: 0.6 }) });
  }

  function animateCards() {
    // Shorter on phones, where the cards fill the screen.
    const CARD_SHIFT = window.matchMedia('(max-width: 767px)').matches ? 30 : 60;

    document.querySelectorAll('.case-card').forEach((card) => {
      const parts = [
        '.case-card__icon',
        '.case-card__name',
        '.case-card__label',
        '.case-card__title',
        '.case-card__role',
        '.case-card__description',
        '.case-card__button',
      ]
        .map((selector) => card.querySelector(selector))
        .filter(Boolean);

      hide([card], `translateY(${CARD_SHIFT}px)`);
      hide(parts, 'translateY(16px)');

      const stop = inView(
        card,
        () => {
          play([card], { opacity: [0, 1], y: [CARD_SHIFT, 0] }, { duration: 0.7, ease: EASE });
          play(parts, { opacity: [0, 1], y: [16, 0] }, { duration: 0.5, ease: EASE, delay: stagger(0.07, { startDelay: 0.15 }) });
          // Once only. inView can call back before it returns, so wait a tick.
          setTimeout(() => stop(), 0);
        },
        // The margin cancels the card's starting shift, so 25% means 25% of
        // where the card will actually sit.
        { amount: 0.25, margin: `0px 0px ${CARD_SHIFT}px 0px` }
      );
    });
  }

  // Page titles other than the Work hero, which has its own timing above.
  function animateTitle() {
    const title = document.querySelector('main h1:not(.hero__title)');
    if (!title) return;
    animateWords(title);
  }

  // Fades content up the first time it scrolls into view, on every other page.
  function animateOnScroll() {
    const SHIFT = 24;
    const STEP = 0.05;
    const MAX_DELAY = 0.4;
    const TITLE_TIME = 0.4;
    const startedAt = performance.now();

    const items = [...new Set(document.querySelectorAll(REVEAL_SELECTOR))];
    let batch = [];

    function flush() {
      // Content already on screen at load waits for the page title.
      const startDelay = performance.now() - startedAt < 300 ? TITLE_TIME : 0;
      batch.forEach(({ element, fadeOnly }, index) => {
        const delay = startDelay + Math.min(index * STEP, MAX_DELAY);
        const keyframes = fadeOnly ? { opacity: [0, 1] } : { opacity: [0, 1], y: [SHIFT, 0] };
        play([element, ...followersOf(element)], keyframes, { duration: 0.6, ease: EASE, delay });
      });
      batch = [];
    }

    // A copy that sits exactly on top of another image, like the logo layer in
    // dark mode, has to move with it.
    function followersOf(element) {
      const next = element.nextElementSibling;
      return next && next.classList.contains('illo-logos') ? [next] : [];
    }

    items.forEach((element) => {
      // These only fade: panels so text never shows before its background,
      // anchor targets so Contents links land correctly, large closing lines
      // so they stay perfectly still, and anything with its own transform,
      // like the tilted Lumen logo.
      const isPanel = element.classList.contains('lumen-panel');
      const fadeOnly =
        isPanel ||
        element.id !== '' ||
        element.matches(FADE_ONLY_SELECTOR) ||
        getComputedStyle(element).transform !== 'none';

      [element, ...followersOf(element)].forEach((part) => {
        part.style.opacity = '0';
        if (!fadeOnly) part.style.transform = `translateY(${SHIFT}px)`;
      });

      const stop = inView(
        element,
        () => {
          if (batch.length === 0) requestAnimationFrame(flush);
          batch.push({ element, fadeOnly });
          setTimeout(() => stop(), 0);
        },
        { amount: isPanel ? 0 : 0.15, margin: `0px 0px ${fadeOnly ? 0 : SHIFT}px 0px` }
      );
    });
  }

  animateHero();
  animateCards();
  animateTitle();
  animateOnScroll();
  showPage();
})();
