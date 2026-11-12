// SiteShell: runs on index.html, the frame that every page is shown inside.
// The background music lives here instead of on each page, so it keeps
// playing without a gap when a visitor moves between pages.
// The music button on each page (music-toggle.js) controls it through
// window.__lofiShell.
(function () {
  // A link to index.html opened inside the frame would put a frame inside the
  // frame. Show the Work page instead.
  if (window.top !== window) {
    location.replace('pages/work.html');
    return;
  }

  const TRACK_PATH = 'audio/lofi.mp3';
  const DEFAULT_PAGE = 'pages/work.html';

  // Worked out before the address bar changes, since it changes to the page's address.
  const siteRoot = new URL('./', location.href);
  const frame = document.getElementById('site-frame');

  // Which page to show first. Pages opened directly send visitors here with
  // ?p=/pages/about.html so they still land on the page they asked for.
  function firstPage() {
    const requested = new URLSearchParams(location.search).get('p');
    if (requested) {
      try {
        const url = new URL(requested, siteRoot);
        const isSitePage =
          url.origin === location.origin &&
          url.pathname.startsWith(siteRoot.pathname) &&
          url.pathname.endsWith('.html') &&
          !url.pathname.endsWith('/index.html');
        if (isSitePage) return url.pathname + location.hash;
      } catch (error) {}
    }
    return new URL(DEFAULT_PAGE, siteRoot).pathname + location.hash;
  }

  // The music. Pages start, stop and fade it through window.__lofiShell.
  const audio = document.createElement('audio');
  audio.src = new URL(TRACK_PATH, siteRoot).href;
  audio.preload = 'none';
  audio.loop = true;
  audio.volume = 0;
  document.body.append(audio);

  // Fades run here, not on the page, so a fade still finishes when the
  // visitor moves to another page partway through it.
  let fadeFrame = 0;
  function fadeTo(target, duration, pauseAtEnd) {
    cancelAnimationFrame(fadeFrame);
    const start = audio.volume;
    const startTime = performance.now();
    const step = (now) => {
      // The frame time can be a little earlier than startTime, so clamp to 0–1.
      const progress = Math.min(Math.max((now - startTime) / duration, 0), 1);
      audio.volume = Math.min(Math.max(start + (target - start) * progress, 0), 1);
      if (progress < 1) fadeFrame = requestAnimationFrame(step);
      else if (pauseAtEnd) audio.pause();
    };
    fadeFrame = requestAnimationFrame(step);
  }
  function stopFade() {
    cancelAnimationFrame(fadeFrame);
  }

  window.__lofiShell = { audio, fadeTo, stopFade };

  // Keeps the address bar and tab title in step with the page in the frame,
  // so visitors can copy, share or bookmark the page they're on.
  function syncWithPage() {
    let page;
    try {
      page = frame.contentWindow;
      if (page.location.origin !== location.origin) return;
    } catch (error) {
      return; // The page is from another site, so it can't be read.
    }
    document.title = page.document.title;
    const syncAddress = () => {
      const address = page.location.pathname + page.location.search + page.location.hash;
      history.replaceState(null, '', address);
    };
    syncAddress();
    page.addEventListener('hashchange', syncAddress);
    // Send keyboard scrolling (arrow keys, space) to the page.
    page.focus();
  }

  frame.addEventListener('load', syncWithPage);
  frame.src = firstPage();
})();
