// state.js — seeded RNG, shuffle, save/load. Loaded first; creates the CC namespace.
window.CC = window.CC || {};

(function (CC) {
  'use strict';

  CC.SAVE_KEY = 'cursedcup_run';
  CC.OLD_KEYS = ['cursedcup_match'];   // pre-M4 saves, removed on boot
  CC.SAVE_VERSION = 4;

  // New seed for a new run/match. The only use of Math.random in the game.
  CC.newSeed = function () {
    return ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0) || 1;
  };

  // mulberry32. RNG position lives on the state object (s.rng) so it survives save/load.
  CC.rand = function (s) {
    var a = (s.rng + 0x6d2b79f5) | 0;
    s.rng = a;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Fisher-Yates using the seeded RNG. Returns a new array.
  CC.shuffle = function (s, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(CC.rand(s) * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  };

  CC.save = function (run) {
    try {
      localStorage.setItem(CC.SAVE_KEY, JSON.stringify(run));
    } catch (e) { /* storage blocked or full: game still runs, just won't persist */ }
  };

  // Returns { run, status }. status: 'none' (no save), 'ok', 'old' (older version, dropped),
  // 'corrupt' (unreadable or broken, dropped). Main starts a fresh run and tells the player.
  CC.load = function () {
    var raw;
    try { raw = localStorage.getItem(CC.SAVE_KEY); } catch (e) { return { run: null, status: 'none' }; }
    if (!raw) {
      var old = false;
      try {
        CC.OLD_KEYS.forEach(function (k) {
          if (localStorage.getItem(k)) { old = true; localStorage.removeItem(k); }
        });
      } catch (e) { /* ignore */ }
      return { run: null, status: old ? 'old' : 'none' };
    }
    try {
      var run = JSON.parse(raw);
      if (!run || typeof run !== 'object') return { run: null, status: 'corrupt' };
      if (run.version !== CC.SAVE_VERSION) return { run: null, status: 'old' };
      if (!run.map || !run.map.rows || !Array.isArray(run.deck) || !Array.isArray(run.path)) return { run: null, status: 'corrupt' };
      if (run.scene === 'match' && (!run.match || !run.match.opp || !CC.OPPONENTS[run.match.opp.id])) return { run: null, status: 'corrupt' };
      return { run: run, status: 'ok' };
    } catch (e) {
      return { run: null, status: 'corrupt' };
    }
  };

  CC.clearSave = function () {
    try {
      localStorage.removeItem(CC.SAVE_KEY);
      CC.OLD_KEYS.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { /* ignore */ }
  };
})(window.CC);
