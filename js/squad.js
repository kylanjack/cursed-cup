// squad.js — squad (relic) hooks and injuries. Numbers come from data_squad.js.
// A match holds its own copy of the squad: [{ id, injuries, status: 'fit' | 'injured' | 'gone' }].
// run.js copies it back to the run when the match is settled.
(function (CC) {
  'use strict';

  CC.newSquad = function () {
    return CC.STARTER_SQUAD.map(function (id) { return { id: id, injuries: 0, status: 'fit' }; });
  };

  // Fit player with this hook, or null.
  CC.squadHook = function (s, hook) {
    var sq = s.squad || [];
    for (var i = 0; i < sq.length; i++) {
      var d = CC.SQUAD[sq[i].id];
      if (sq[i].status === 'fit' && d.hook === hook) return d;
    }
    return null;
  };

  CC.squadMember = function (s, id) {
    var sq = s.squad || [];
    for (var i = 0; i < sq.length; i++) if (sq[i].id === id) return sq[i];
    return null;
  };

  CC.gkValue = function (s) {
    var k = CC.squadHook(s, 'gk');
    return k ? k.params.gk : CC.SQUAD_RULES.noKeeperGk;
  };

  // SHP kept at the start of your turn, before The Wall.
  CC.decayKeep = function (s) {
    var m = CC.squadHook(s, 'decay');
    var rate = m ? m.params.decay : CC.SQUAD_RULES.baseDecay;
    return s.shp - Math.floor(s.shp * rate);
  };

  // Free cards left this turn from a freePass player, for this card.
  CC.freeCard = function (s, c) {
    var y = CC.squadHook(s, 'freePass');
    return !!(y && c.id === y.params.card && (s.turnPlays.free || 0) < y.params.free);
  };

  CC.shotSquadBonus = function (s) {
    var st = CC.squadHook(s, 'shotPower');
    return st ? st.params.power : 0;
  };

  CC.advanceBonus = function (s) {
    var w = CC.squadHook(s, 'advanceAtk');
    return w ? w.params.atk : 0;
  };

  // True if the keeper still cancels the next goal against this match.
  CC.goalCancelReady = function (s) {
    var k = CC.squadHook(s, 'gk');
    return !!(k && k.params.cancelGoals && (s.cancelled || 0) < k.params.cancelGoals);
  };

  // Default DIRTY TACKLE target: a random fit player (seeded). Telegraphed on the intent.
  CC.pickTarget = function (s, want) {
    var fit = (s.squad || []).filter(function (p) { return p.status === 'fit'; });
    if (!fit.length) return null;
    if (want && want !== 'random') {
      for (var i = 0; i < fit.length; i++) if (fit[i].id === want) return want;
    }
    return fit[Math.floor(CC.rand(s) * fit.length)].id;
  };

  // Applies an injury. Returns a log line. Career over at CAREER_OVER_AT total injuries.
  CC.injure = function (s, id) {
    var p = CC.squadMember(s, id);
    if (!p || p.status !== 'fit') return null;
    var d = CC.SQUAD[id];
    p.injuries += d.injuryHits || 1;
    s.injuredNow = (s.injuredNow || []).concat(id);
    if (p.injuries >= CC.SQUAD_RULES.careerOverAt) {
      p.status = 'gone';
      return d.name + ': CAREER OVER. Gone for the rest of the run.';
    }
    p.status = 'injured';
    return d.name + ' is injured. Out for the rest of the run.';
  };

  CC.squadName = function (id) { return CC.SQUAD[id] ? CC.SQUAD[id].name : 'your player'; };
})(window.CC);
