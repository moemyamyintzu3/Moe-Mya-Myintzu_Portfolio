// MusicToggle: a floating button that plays looping lofi music.
// Music is on by default. It tries to start when the page loads, and if the
// browser blocks that, it starts on the visitor's first click, tap, or key press.
// Visitors who turn it off keep it off on later visits.
// To change the track, replace public/audio/lofi.mp3 (see TRACK_PATH below).
(function () {
  const TRACK_PATH = 'public/audio/lofi.mp3'; // Relative to the site root.
  const STORAGE_KEY = 'lofi-music';
  const VOLUME = 0.3;
  const FADE_MS = 1000;

  // Find the track from this script's own URL, so it works from /pages/ too
  // and when the site is hosted in a subfolder.
  const scriptUrl = document.currentScript && document.currentScript.src;
  const trackUrl = new URL(TRACK_PATH, scriptUrl || document.baseURI).href;

  const readChoice = () => {
    try { return localStorage.getItem(STORAGE_KEY); } catch (error) { return null; }
  };
  const saveChoice = (value) => {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (error) {}
  };

  // Speaker icon. Off shows an ✕ (muted), on shows the sound waves.
  const SPEAKER_ICON =
    '<svg class="music-toggle__speaker" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path class="music-toggle__cone" d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/>' +
    '<path class="music-toggle__mute" d="M16 9.5l5 5M21 9.5l-5 5"/>' +
    '<path class="music-toggle__wave music-toggle__wave--1" d="M15.5 9.2a4 4 0 0 1 0 5.6"/>' +
    '<path class="music-toggle__wave music-toggle__wave--2" d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/>' +
    '</svg>';

  const audio = document.createElement('audio');
  audio.src = trackUrl;
  audio.preload = 'none'; // The download starts after the page has loaded.
  audio.loop = true;
  audio.volume = 0;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'music-toggle';
  button.innerHTML = SPEAKER_ICON;

  let playing = false;
  let fadeFrame = 0;

  function render() {
    button.classList.toggle('is-playing', playing);
    button.setAttribute('aria-pressed', String(playing));
    const text = playing ? 'Pause background music' : 'Play background music';
    button.setAttribute('aria-label', text);
    button.title = text; // Tooltip on hover, since the button has no visible text.
  }

  // Fades the volume with requestAnimationFrame. iOS Safari ignores
  // audio.volume, so there the music just starts and stops.
  function fadeTo(target, done) {
    cancelAnimationFrame(fadeFrame);
    const start = audio.volume;
    const startTime = performance.now();
    const step = (now) => {
      // The frame time can be a little earlier than startTime, so clamp to 0–1.
      const progress = Math.min(Math.max((now - startTime) / FADE_MS, 0), 1);
      audio.volume = Math.min(Math.max(start + (target - start) * progress, 0), 1);
      if (progress < 1) fadeFrame = requestAnimationFrame(step);
      else if (done) done();
    };
    fadeFrame = requestAnimationFrame(step);
  }

  function hide() {
    cancelAnimationFrame(fadeFrame);
    playing = false;
    audio.pause();
    button.hidden = true;
  }

  // auto: true when the page starts the music, not the visitor's click.
  function play(auto) {
    playing = true;
    button.classList.remove('has-hint');
    if (!auto) saveChoice('on');
    render();
    const attempt = audio.play();
    if (attempt && attempt.catch) {
      attempt.catch((error) => {
        // NotSupportedError means the file is missing or can't be played.
        if (error && error.name === 'NotSupportedError') { hide(); return; }
        cancelAnimationFrame(fadeFrame);
        audio.volume = 0;
        playing = false;
        render();
        // NotAllowedError: the browser blocked sound before any interaction.
        if (auto) waitForFirstInteraction();
      });
    }
    fadeTo(VOLUME);
  }

  function pause() {
    playing = false;
    stopWaiting();
    saveChoice('off');
    render();
    fadeTo(0, () => { if (!playing) audio.pause(); });
  }

  // Browsers only allow sound after the visitor clicks, taps, or presses a key.
  // Scrolling doesn't count. The first such action anywhere starts the music.
  const GESTURES = ['pointerdown', 'keydown', 'touchend'];

  function onFirstInteraction(event) {
    // A click on the button itself is handled by the button.
    if (button.contains(event.target)) return;
    stopWaiting();
    if (!playing) play(true);
  }

  function waitForFirstInteraction() {
    button.classList.add('has-hint'); // Dot shows the music is ready to start.
    GESTURES.forEach((type) => document.addEventListener(type, onFirstInteraction, true));
  }

  function stopWaiting() {
    button.classList.remove('has-hint');
    GESTURES.forEach((type) => document.removeEventListener(type, onFirstInteraction, true));
  }

  button.addEventListener('click', () => {
    stopWaiting();
    if (playing) pause();
    else play();
  });
  audio.addEventListener('error', () => {
    stopWaiting();
    hide();
  });

  render();
  document.body.append(audio, button);

  // Music is on by default. It stays off only for visitors who turned it off.
  if (readChoice() !== 'off') {
    if (document.readyState === 'complete') play(true);
    else window.addEventListener('load', () => play(true), { once: true });
  }

  // preload="none" means a missing file would only show up on the first click.
  // A HEAD request checks it early without downloading the track.
  const check = () => {
    fetch(trackUrl, { method: 'HEAD' })
      .then((response) => {
        // 405 means the server doesn't allow HEAD, which says nothing about the file.
        if (!response.ok && response.status !== 405) hide();
      })
      .catch(() => {}); // Offline or file:// — the audio error handler still covers it.
  };
  if ('requestIdleCallback' in window) requestIdleCallback(check, { timeout: 3000 });
  else setTimeout(check, 1500);
})();
