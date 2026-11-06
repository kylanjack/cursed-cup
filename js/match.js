// match.js — match engine. Milestone 1: turns, energy, hand, zones, card effects.
// No opponent logic yet (Milestone 2).
(function (CC) {
  'use strict';

  CC.ZONES = ['DEF THIRD', 'MIDFIELD', 'ATT THIRD'];
  CC.MATCH_RULES = { turns: 12, handSize: 5, energy: 3, minutes: 90 };

  CC.newMatch = function (seed) {
    var s = {
      version: CC.SAVE_VERSION,
      seed: seed,
      rng: seed,
      turn: 1,
      over: false,
      score: { you: 0, them: 0 },
      ball: { zone: 1, side: 'you' },
      atk: 0,
      shp: 0,
      control: 0,
      energy: CC.MATCH_RULES.energy,
      draw: [],
      hand: [],
      discard: [],
      exhaust: [],
      log: [],
      nextUid: 1,
      opponent: { name: 'Rustborough Athletic', short: 'RUS' }
    };
    var deck = CC.STARTER_DECK.map(function (id) { return { uid: s.nextUid++, id: id }; });
    s.draw = CC.shuffle(s, deck);
    CC.log(s, 'Kick off. Seed ' + seed + '.');
    CC.drawCards(s, CC.MATCH_RULES.handSize);
    return s;
  };

  CC.card = function (inst) { return CC.CARDS[inst.id]; };

  CC.log = function (s, text) {
    s.log.push({ min: CC.clockMinute(s), text: text });
    if (s.log.length > 40) s.log.shift();
  };

  // Turn 1 starts at 0'. Each turn is 7.5 minutes. Full time shows 90'.
  CC.clockMinute = function (s) {
    if (s.over) return CC.MATCH_RULES.minutes;
    return Math.round((s.turn - 1) * CC.MATCH_RULES.minutes / CC.MATCH_RULES.turns);
  };

  CC.drawCards = function (s, n) {
    for (var i = 0; i < n; i++) {
      if (s.draw.length === 0) {
        if (s.discard.length === 0) return;
        s.draw = CC.shuffle(s, s.discard);
        s.discard = [];
        CC.log(s, 'Discard reshuffled into draw pile.');
      }
      s.hand.push(s.draw.pop());
    }
  };

  // Returns null if playable, otherwise a plain reason string.
  CC.cardBlock = function (s, inst) {
    var c = CC.card(inst);
    if (s.over) return 'Full time. Start a new match.';
    if (c.cost > s.energy) return 'Not enough energy. Costs ' + c.cost + ', you have ' + s.energy + '.';
    if (c.needsPossession === true && s.ball.side !== 'you') return 'Needs the ball.';
    if (c.needsPossession === false && s.ball.side === 'you') return 'Only playable when they have the ball.';
    if (typeof c.zone === 'number' && s.ball.zone !== c.zone) return 'Only playable in the ' + CC.ZONES[c.zone] + '.';
    if (c.type === 'shot') return 'Shooting is not built yet. Milestone 2.'; // M1 stub — remove in M2
    return null;
  };

  CC.playCard = function (s, uid) {
    var idx = -1;
    for (var i = 0; i < s.hand.length; i++) if (s.hand[i].uid === uid) { idx = i; break; }
    if (idx < 0) return false;
    var inst = s.hand[idx];
    if (CC.cardBlock(s, inst)) return false;
    var c = CC.card(inst);
    s.energy -= c.cost;
    s.hand.splice(idx, 1);
    var result = CC.EFFECTS[c.effect](s, c.params || {}, c);
    (c.exhaust ? s.exhaust : s.discard).push(inst);
    CC.log(s, c.name + ': ' + result);
    return true;
  };

  // Effect handlers. Each reads numbers from card params and returns a log line.
  CC.EFFECTS = {
    move: function (s, p) {
      var parts = [];
      if (p.atkLoss) {
        var lost = Math.floor(s.atk * p.atkLoss);
        s.atk -= lost;
        if (lost) parts.push('-' + lost + ' ATK');
      }
      var from = s.ball.zone;
      s.ball.zone = Math.min(2, from + (p.zones || 0));
      parts.push(s.ball.zone > from ? 'ball to ' + CC.ZONES[s.ball.zone] : 'ball stays in ' + CC.ZONES[from]);
      if (p.atk) { s.atk += p.atk; parts.push('+' + p.atk + ' ATK'); }
      return parts.join(', ') + '.';
    },
    gainShape: function (s, p) {
      s.shp += p.shp;
      return '+' + p.shp + ' SHP.';
    },
    gainControl: function (s, p) {
      s.control += p.control;
      return '+' + p.control + ' CONTROL.';
    },
    steal: function (s, p) {
      return 'STEAL ' + p.steal + '. No opponent yet.'; // resolved vs CONTROL in M2
    },
    shoot: function (s, p) {
      return 'Shot power ' + (p.power + s.atk) + '. No opponent yet.'; // resolved vs DEF + GK in M2
    }
  };

  CC.endTurn = function (s) {
    if (s.over) return;
    while (s.hand.length) s.discard.push(s.hand.pop());
    CC.log(s, 'End of turn ' + s.turn + '.');
    // M2: opponent executes its intent here, then reveals the next one.
    s.turn++;
    if (s.turn > CC.MATCH_RULES.turns) {
      s.over = true;
      CC.log(s, 'Full time. ' + s.score.you + '-' + s.score.them + '.');
      return;
    }
    CC.startTurn(s);
  };

  CC.startTurn = function (s) {
    var decayed = s.shp - Math.floor(s.shp / 2);
    s.shp = Math.floor(s.shp / 2);
    s.control = 0;
    s.energy = CC.MATCH_RULES.energy;
    if (decayed) CC.log(s, 'SHP decays by ' + decayed + '.');
    CC.drawCards(s, CC.MATCH_RULES.handSize);
  };
})(window.CC);
