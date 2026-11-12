// MusicToggle: a floating button that plays looping lofi music.
// Music is on by default. It tries to start when the page loads, and if the
// browser blocks that, it starts on the visitor's first click, tap, or key press.
// Visitors who turn it off keep it off on later visits.
//
// Pages are normally shown inside the site frame (index.html + site-shell.js),
// which holds the music, so it plays on without a gap between pages. This
// button then controls the frame's music. If a page is opened on its own,
// the button plays the music itself and picks the song up where the last
// page left off.
// To change the track, replace audio/lofi.mp3 (see TRACK_PATH below).
(function () {
  const TRACK_PATH = 'audio/lofi.mp3'; // Relative to the site root.
  const STORAGE_KEY = 'lofi-music';
  const VOLUME = 0.3;
  const FADE_MS = 1000;
  const RESUME_FADE_MS = 250; // Shorter fade when carrying on from the last page.
  const POSITION_KEY = 'lofi-position'; // Per tab, in sessionStorage.

  // The site frame's music, when this page is shown inside the frame.
  let shell = null;
  try {
    if (window.parent !== window && window.parent.__lofiShell) shell = window.parent.__lofiShell;
  } catch (error) {} // Shown inside another site's frame, which can't be read.

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

  let audio;
  if (shell) {
    audio = shell.audio;
  } else {
    audio = document.createElement('audio');
    audio.src = trackUrl;
    audio.preload = 'none'; // The download starts after the page has loaded.
    audio.loop = true;
    audio.volume = 0;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'music-toggle';
  button.innerHTML = SPEAKER_ICON;

  // Inside the frame the music may already be playing from the last page.
  let playing = Boolean(shell) && !audio.paused && readChoice() !== 'off';
  let fadeFrame = 0;

  function render() {
    button.classList.toggle('is-playing', playing);
    button.setAttribute('aria-pressed', String(playing));
    const text = playing ? 'Pause background music' : 'Play background music';
    button.setAttribute('aria-label', text);
    button.title = text; // Tooltip on hover, since the button has no visible text.
  }

  // Fades the volume, then pauses if pauseAtEnd is true. iOS Safari ignores
  // audio.volume, so there the music just starts and stops.
  function fadeTo(target, duration, pauseAtEnd) {
    if (shell) {
      shell.fadeTo(target, duration, pauseAtEnd);
      return;
    }
    cancelAnimationFrame(fadeFrame);
    const start = audio.volume;
    const startTime = performance.now();
    const step = (now) => {
      // The frame time can be a little earlier than startTime, so clamp to 0–1.
      const progress = Math.min(Math.max((now - startTime) / duration, 0), 1);
      audio.volume = Math.min(Math.max(start + (target - start) * progress, 0), 1);
      if (progress < 1) fadeFrame = requestAnimationFrame(step);
      else if (pauseAtEnd && !playing) audio.pause();
    };
    fadeFrame = requestAnimationFrame(step);
  }

  function stopFade() {
    if (shell) shell.stopFade();
    else cancelAnimationFrame(fadeFrame);
  }

  function hide() {
    stopFade();
    playing = false;
    audio.pause();
    button.hidden = true;
  }

  // auto: true when the page starts the music, not the visitor's click.
  // fadeMs: how long the fade in takes (optional).
  function play(auto, fadeMs) {
    playing = true;
    button.classList.remove('has-hint');
    if (!auto) saveChoice('on');
    render();
    const attempt = audio.play();
    if (attempt && attempt.catch) {
      attempt.catch((error) => {
        // NotSupportedError means the file is missing or can't be played.
        if (error && error.name === 'NotSupportedError') { hide(); return; }
        // AbortError: a pause or a page change interrupted it, nothing to do.
        if (error && error.name === 'AbortError') return;
        stopFade();
        audio.volume = 0;
        playing = false;
        render();
        // NotAllowedError: the browser blocked sound before any interaction.
        if (auto) waitForFirstInteraction();
      });
    }
    fadeTo(VOLUME, fadeMs || FADE_MS);
  }

  function pause() {
    playing = false;
    stopWaiting();
    saveChoice('off');
    render();
    fadeTo(0, FADE_MS, true);
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

  const onAudioError = () => {
    stopWaiting();
    hide();
  };
  audio.addEventListener('error', onAudioError);

  render();
  if (shell) {
    document.body.append(button);
    // The frame's music outlives this page, so stop listening to it on the way out.
    window.addEventListener('pagehide', () => audio.removeEventListener('error', onAudioError));
    if (audio.error) hide();
  } else {
    document.body.append(audio, button);
  }

  if (shell) {
    if (playing) {
      // Already playing from the last page. Finish a fade in that the page
      // change cut short.
      if (audio.volume < VOLUME) fadeTo(VOLUME, RESUME_FADE_MS);
    } else if (readChoice() !== 'off') {
      // Music is on by default. It stays off only for visitors who turned it off.
      if (document.readyState === 'complete') play(true);
      else window.addEventListener('load', () => play(true), { once: true });
    }
  } else {
    setUpStandalone();
  }

  // A page opened on its own, outside the frame: the music restarts with
  // every page, so remember where the song was and carry on from there.
  function setUpStandalone() {
    const savePosition = () => {
      try {
        if (playing && !audio.paused) {
          sessionStorage.setItem(POSITION_KEY, JSON.stringify({ time: audio.currentTime, at: Date.now() }));
        } else {
          sessionStorage.removeItem(POSITION_KEY);
        }
      } catch (error) {}
    };

    // Where to start the song on this page, in seconds. The time spent loading
    // the new page is added on, so the music sounds like it never stopped.
    const readResumeTime = () => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(POSITION_KEY));
        if (!saved || typeof saved.time !== 'number') return 0;
        const elapsed = (Date.now() - saved.at) / 1000;
        return elapsed >= 0 && elapsed < 30 ? saved.time + elapsed : saved.time;
      } catch (error) {
        return 0;
      }
    };

    // Jump to a time in the song once the browser knows how long it is.
    const seekTo = (seconds) => {
      const seek = () => {
        const length = audio.duration;
        audio.currentTime = isFinite(length) && length > 0 ? seconds % length : seconds;
      };
      if (audio.readyState >= 1) seek();
      else audio.addEventListener('loadedmetadata', seek, { once: true });
    };

    window.addEventListener('pagehide', savePosition);

    // Coming back with the browser's Back button can restore the old page as
    // it was, with its song paused at the old spot. Catch it up to the latest spot.
    window.addEventListener('pageshow', (event) => {
      if (!event.persisted || !playing) return;
      const time = readResumeTime();
      if (time > 0) seekTo(time);
      play(true, RESUME_FADE_MS);
    });

    // Music is on by default. It stays off only for visitors who turned it off.
    if (readChoice() === 'off') return;
    const resumeTime = readResumeTime();
    if (resumeTime > 0) {
      // Carrying on from the last page: start right away so the gap is short.
      seekTo(resumeTime);
      play(true, RESUME_FADE_MS);
    } else if (document.readyState === 'complete') {
      play(true);
    } else {
      window.addEventListener('load', () => play(true), { once: true });
    }
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
