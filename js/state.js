// state.js — seeded RNG, shuffle, save/load. Loaded first; creates the CC namespace.
window.CC = window.CC || {};

(function (CC) {
  'use strict';

  CC.SAVE_KEY = 'cursedcup_match';
  CC.SAVE_VERSION = 1;

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

  CC.save = function (s) {
    try {
      localStorage.setItem(CC.SAVE_KEY, JSON.stringify(s));
    } catch (e) { /* storage blocked or full: game still runs, just won't persist */ }
  };

  CC.load = function () {
    try {
      var raw = localStorage.getItem(CC.SAVE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || s.version !== CC.SAVE_VERSION) return null;
      return s;
    } catch (e) {
      return null;
    }
  };

  CC.clearSave = function () {
    try { localStorage.removeItem(CC.SAVE_KEY); } catch (e) { /* ignore */ }
  };
})(window.CC);
