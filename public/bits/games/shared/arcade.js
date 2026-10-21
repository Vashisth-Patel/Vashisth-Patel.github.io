/*
 * Shared helpers for the BITS arcade pages (plain JS, no build).
 * - Esc inside a game tells the terminal overlay to close: parent.postMessage('close').
 * - Arcade.sfx: tiny WebAudio blips with a mute toggle remembered in localStorage.
 * - Arcade.reducedMotion, Arcade.touch, Arcade.store (localStorage that never throws).
 */
(function () {
  var inFrame = window.parent !== window;
  var root = document.documentElement;
  if (inFrame) root.classList.add('in-overlay');

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && inFrame) {
      e.preventDefault();
      window.parent.postMessage('close', window.location.origin);
    }
  });

  var store = {
    get: function (k, fallback) {
      try {
        var v = window.localStorage.getItem(k);
        return v === null ? fallback : v;
      } catch (e) {
        return fallback;
      }
    },
    set: function (k, v) {
      try {
        window.localStorage.setItem(k, String(v));
      } catch (e) {
        /* storage blocked */
      }
    },
  };

  var ctx = null;
  var muted = store.get('bits-arcade-muted', '0') === '1';

  function audio() {
    if (muted) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) {
      return null;
    }
  }

  /** blip(freqStart, freqEnd, ms, type, volume) */
  function blip(f1, f2, ms, type, vol) {
    var a = audio();
    if (!a) return;
    var t = a.currentTime;
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + ms / 1000);
    g.gain.setValueAtTime(vol || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    o.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + ms / 1000 + 0.02);
  }

  var sfx = {
    eat: function () { blip(520, 1040, 70, 'square', 0.035); },
    step: function () { blip(300, 420, 40, 'triangle', 0.04); },
    level: function () {
      [0, 90, 180].forEach(function (d, i) {
        setTimeout(function () { blip(440 * Math.pow(1.26, i), 440 * Math.pow(1.26, i + 1), 90, 'square', 0.035); }, d);
      });
    },
    over: function () { blip(380, 60, 420, 'sawtooth', 0.045); },
  };

  function setMuted(m) {
    muted = m;
    store.set('bits-arcade-muted', m ? '1' : '0');
    document.querySelectorAll('[data-mute]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(m));
      b.textContent = m ? 'sound: off' : 'sound: on';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setMuted(muted);
    document.querySelectorAll('[data-mute]').forEach(function (b) {
      b.addEventListener('click', function () { setMuted(!muted); });
    });
  });
  window.addEventListener('keydown', function (e) {
    if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && document.querySelector('[data-mute]')) setMuted(!muted);
  });

  window.Arcade = {
    inFrame: inFrame,
    store: store,
    sfx: sfx,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    touch: window.matchMedia('(pointer: coarse)').matches,
  };
})();
