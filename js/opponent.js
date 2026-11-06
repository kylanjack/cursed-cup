// opponent.js — opponent intents: pick (telegraph), validate, execute.
// All numbers and scripts come from data_opponents.js.
(function (CC) {
  'use strict';

  var WITH_BALL = { build: true, shoot: true, waste: true };

  CC.INTENT_NAMES = {
    build: 'BUILD UP', shoot: 'SHOOT', waste: 'TIME WASTING',
    press: 'PRESS', dirty: 'DIRTY TACKLE', park: 'PARK THE BUS'
  };

  function lead(s) { return s.score.them - s.score.you; }

  // Branches are checked in order. First match wins, else 'normal'.
  CC.activePattern = function (s) {
    var od = CC.oppDef(s);
    var br = od.branches || [];
    for (var i = 0; i < br.length; i++) {
      var b = br[i];
      if (s.turn < b.fromTurn) continue;
      if (b.when === 'trailing' && lead(s) < 0) return b.use;
      if (b.when === 'leading' && lead(s) > 0) return b.use;
    }
    return 'normal';
  };

  function next(s, key, list) {
    var i = s.opp.idx[key] || 0;
    s.opp.idx[key] = i + 1;
    return list[i % list.length];
  }

  // Sets s.opp.intent from the list that matches current possession.
  CC.pickIntent = function (s) {
    var od = CC.oppDef(s);
    var name = CC.activePattern(s);
    var pat = od.patterns[name];
    var it;
    if (s.ball.side === 'them') {
      if (s.ball.zone <= od.shootZone) {
        it = { type: 'shoot', n: next(s, name + '.shoot', pat.shoot) };
      } else {
        // Skip TIME WASTING entries unless they lead. Bounded so a bad table can't loop.
        for (var k = 0; k < pat.withBall.length + 1; k++) {
          it = next(s, name + '.with', pat.withBall);
          if (it.type !== 'waste' || (lead(s) > 0 && !s.golden)) break;
          it = null;
        }
        if (!it) it = { type: 'build', n: 1 };
      }
    } else {
      it = next(s, name + '.without', pat.withoutBall);
    }
    s.opp.intent = { type: it.type, n: it.n || 0, target: it.target || null };
  };

  // Stale intents fizzle: a with-ball intent needs them on the ball, and vice versa.
  CC.intentValid = function (s) {
    var it = s.opp.intent;
    if (!it) return false;
    return WITH_BALL[it.type] ? s.ball.side === 'them' : s.ball.side === 'you';
  };

  // Their shot total and what it has to beat.
  CC.theirShot = function (s) { return s.opp.intent.n + s.opp.atk; };
  CC.yourWall = function (s) { return s.shp + s.gk; };

  // Executes the intent at end of your turn. Returns extra clock turns burned.
  CC.runIntent = function (s) {
    var it = s.opp.intent;
    // PARK THE BUS lasts until your next end of turn.
    if (s.opp.bus && s.turn >= s.opp.busUntil) {
      s.opp.bus = 0;
      CC.log(s, 'Their bus leaves. DEF back to normal.');
    }
    if (!CC.intentValid(s)) {
      CC.log(s, 'INTENT LOST: ' + CC.INTENT_NAMES[it.type] + ' no longer possible.');
      return 0;
    }
    return CC.INTENT_RUN[it.type](s, it) || 0;
  };

  function press(s, it) {
    if (it.n > s.control) {
      CC.setBall(s, 'them', s.ball.zone);
      CC.log(s, CC.INTENT_NAMES[it.type] + ' ' + it.n + ' beats your CONTROL ' + s.control +
        '. Ball lost in ' + CC.ZONES[s.ball.zone] + '.', 'bad');
      return true;
    }
    CC.log(s, CC.INTENT_NAMES[it.type] + ' ' + it.n + ' does not beat your CONTROL ' + s.control + '. You keep the ball.');
    return false;
  }

  CC.INTENT_RUN = {
    build: function (s, it) {
      var from = s.ball.zone;
      s.ball.zone = Math.max(0, from - 1);
      s.opp.atk += it.n;
      CC.log(s, 'They build up: ball to ' + CC.ZONES[s.ball.zone] + ', +' + it.n + ' ATK (banked ' + s.opp.atk + ').');
    },
    shoot: function (s) {
      var power = CC.theirShot(s);
      var wall = CC.yourWall(s);
      if (power > wall) {
        s.score.them++;
        CC.restart(s, 'you');
        CC.log(s, 'They shoot: ' + power + ' vs your ' + wall + '. GOAL against.', 'bad');
        if (s.golden) CC.finish(s, 'lose', 'Golden goal against. You lose');
      } else {
        CC.restart(s, 'you');
        CC.log(s, 'They shoot: ' + power + ' vs your ' + wall + '. Saved. Your ball in MIDFIELD.');
      }
    },
    waste: function (s) {
      CC.log(s, 'They waste time. Clock runs an extra turn.', 'bad');
      return 1;
    },
    press: function (s, it) { press(s, it); },
    dirty: function (s, it) {
      if (!press(s, it)) return;
      if (s.shpGained > it.n) {
        CC.log(s, 'Your SHAPE gained (' + s.shpGained + ') beats ' + it.n + '. No injury.');
      } else {
        // Injuries need the squad (Milestone 5). Logged only for now.
        CC.log(s, 'Dirty tackle on ' + (it.target || 'your player') + '. Injuries arrive with the squad.', 'bad');
      }
    },
    park: function (s, it) {
      s.opp.bus = it.n;
      s.opp.busUntil = s.turn + 1;
      CC.log(s, 'They park the bus: +' + it.n + ' DEF until your next end of turn.');
    }
  };

  // Plain-language preview for the intent bar. Numbers always visible.
  CC.intentPreview = function (s) {
    var it = s.opp.intent;
    if (!it) return { head: '-', detail: '' };
    var head = CC.INTENT_NAMES[it.type] + (it.n ? ' ' + it.n : '');
    if (!CC.intentValid(s)) return { head: head, detail: 'INTENT LOST. They do nothing this turn.', lost: true };
    switch (it.type) {
      case 'build':
        return { head: head, detail: 'Ball to ' + CC.ZONES[Math.max(0, s.ball.zone - 1)] + '. Banked ATK ' + s.opp.atk + ' → ' + (s.opp.atk + it.n) + '.' };
      case 'shoot':
        var p = CC.theirShot(s), w = CC.yourWall(s);
        return { head: head, detail: it.n + '+' + s.opp.atk + ' = ' + p + ' vs SHP ' + s.shp + ' + GK ' + s.gk + ' = ' + w + '. ' +
          (p > w ? 'GOAL unless you add ' + (p - w) + ' SHP.' : 'Saved.'), danger: p > w };
      case 'waste':
        return { head: head, detail: 'Clock runs an extra turn.', danger: true };
      case 'press':
      case 'dirty':
        var lose = it.n > s.control;
        var d = it.n + ' vs your CONTROL ' + s.control + '. ' +
          (lose ? 'You lose the ball unless you add ' + (it.n - s.control) + ' CONTROL.' : 'You keep the ball.');
        if (it.type === 'dirty') d += ' Target: ' + (it.target || '-') + '. SHAPE gained > ' + it.n + ' blocks the injury.';
        return { head: head, detail: d, danger: lose };
      case 'park':
        return { head: head, detail: '+' + it.n + ' DEF through your next turn.' };
    }
    return { head: head, detail: '' };
  };
})(window.CC);
