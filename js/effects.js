// effects.js — card effect handlers. Each reads numbers from card params and returns { text, kind }.
// Card numbers live in data_cards.js.
(function (CC) {
  'use strict';

  CC.HAND_LIMIT = 10;

  CC.drawMid = function (s, n) {
    var room = Math.max(0, CC.HAND_LIMIT - s.hand.length);
    CC.drawCards(s, Math.min(n, room));
    return Math.min(n, room);
  };

  // Moves the ball forward. Records zones advanced this turn (Volley reads it).
  function advance(s, to) {
    var from = s.ball.zone;
    s.ball.zone = Math.max(from, Math.min(2, to));
    s.turnPlays.zones += s.ball.zone - from;
    return s.ball.zone > from ? 'ball to ' + CC.ZONES[s.ball.zone] : 'ball stays in ' + CC.ZONES[from];
  }

  function stealTo(s, zone) {
    CC.setBall(s, 'you', zone);
  }

  CC.EFFECTS = {
    // Generic: applies params in a fixed order. Covers most cards.
    basic: function (s, p) {
      var parts = [];
      if (p.atkLoss) {
        var lost = Math.floor(s.atk * p.atkLoss);
        s.atk -= lost;
        if (lost) parts.push('-' + lost + ' ATK');
      }
      if (p.zones) parts.push(advance(s, s.ball.zone + p.zones));
      if (typeof p.toZone === 'number') parts.push(advance(s, p.toZone));
      if (p.atk) { s.atk += p.atk; parts.push('+' + p.atk + ' ATK'); }
      if (p.shp) { s.shp += p.shp; s.shpGained += p.shp; parts.push('+' + p.shp + ' SHP'); }
      if (p.control) { s.control += p.control; parts.push('+' + p.control + ' CONTROL'); }
      if (p.resetOppAtk) { parts.push('their banked ATK ' + s.opp.atk + ' → 0'); s.opp.atk = 0; }
      if (p.shpLoss) { var l = Math.min(s.shp, p.shpLoss); s.shp -= l; parts.push('-' + l + ' SHP'); }
      if (p.clear && s.ball.side === 'you') {
        CC.setBall(s, 'them', 2);
        parts.push('ball cleared, their ball in ATT THIRD');
      }
      if (p.draw) parts.push('draw ' + CC.drawMid(s, p.draw));
      return { text: (parts.join(', ') || 'no effect') + '.' };
    },

    steal: function (s, p) {
      var ctrl = CC.oppDef(s).control;
      var extra = '';
      if (p.shp) { s.shp += p.shp; s.shpGained += p.shp; extra = ' +' + p.shp + ' SHP.'; }
      if (p.steal > ctrl) {
        stealTo(s, s.ball.zone);
        return { text: 'STEAL ' + p.steal + ' beats CONTROL ' + ctrl + '. Ball won in ' + CC.ZONES[s.ball.zone] + '.' + extra };
      }
      return { text: 'STEAL ' + p.steal + ' does not beat CONTROL ' + ctrl + '. No change.' + extra, kind: 'bad' };
    },

    oneTwo: function (s, p) {
      if (s.turnPlays.moves > 0) return { text: advance(s, s.ball.zone + p.zones) + '.' };
      s.atk += p.atk;
      return { text: 'no move card before it, +' + p.atk + ' ATK.' };
    },

    offsideTrap: function (s) {
      var it = s.opp.intent;
      if (it && it.type === 'build' && !it.cancelled && s.ball.side === 'them') {
        stealTo(s, Math.max(1, s.ball.zone));
        return { text: 'flag up. Ball won in ' + CC.ZONES[s.ball.zone] + '.' };
      }
      return { text: 'their intent is not BUILD UP. No effect.', kind: 'bad' };
    },

    tikiTaka: function (s, p) {
      var n = s.turnPlays.cards * p.per;
      s.atk += n;
      return { text: s.turnPlays.cards + ' cards before it, +' + n + ' ATK.' };
    },

    cynicalFoul: function (s, p) {
      var it = s.opp.intent;
      if (it) it.cancelled = true;
      s.opp.perm += p.oppAtk;
      return { text: 'their intent is cancelled. Their shots +' + p.oppAtk + ' ATK for the match (total ' + s.opp.perm + ').', kind: 'bad' };
    },

    shotBonus: function (s, p) {
      s.shotBonus += p.power;
      return { text: 'next shot this turn +' + p.power + ' power.' };
    },

    totalFootball: function (s, p) {
      s.costDown += p.costDown;
      return { text: 'cards cost ' + p.costDown + ' less this turn, draw ' + CC.drawMid(s, p.draw) + '.' };
    },

    power: function (s, p, c) {
      s.powers[p.power] = (s.powers[p.power] || 0) + p.n;
      if (p.power === 'the_wall') s.powers.the_wall = p.n; // does not stack
      return { text: c.name + ' is active for the rest of the match.' };
    },

    shoot: function (s, p, c) {
      var power = CC.shotPower(s, c);
      var wall = CC.shotWall(s);
      s.shotBonus = 0;
      if (power > wall) {
        s.score.you++;
        CC.restart(s, 'them');
        if (s.golden) CC.finish(s, 'win', 'Golden goal. You win');
        return { text: power + ' vs ' + wall + '. GOAL.', kind: 'goal' };
      }
      CC.restart(s, 'them');
      return { text: power + ' vs ' + wall + '. Saved. Their ball in MIDFIELD.', kind: 'bad' };
    }
  };

  // Shot power before you commit: card power + ATK + cross bonus + Volley bonus.
  CC.shotPower = function (s, c) {
    var p = c.params.power + s.atk + s.shotBonus;
    if (c.params.bonus2zones && s.turnPlays.zones >= 2) p += c.params.bonus2zones;
    return p;
  };
})(window.CC);
