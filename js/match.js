// match.js — match engine: turns, energy, hand, zones, shots, full time, rewards.
// Card effects live in effects.js. Opponent intents live in opponent.js.
(function (CC) {
  'use strict';

  CC.ZONES = ['DEF THIRD', 'MIDFIELD', 'ATT THIRD'];
  // gk: your keeper's flat save value. Moves to the Brick Walls relic in Milestone 5.
  CC.MATCH_RULES = { turns: 12, handSize: 5, energy: 3, minutes: 90, gk: 4 };

  // run: { deck: [card ids], won: matches won so far }. Omit for a fresh starter run.
  CC.newMatch = function (seed, oppId, run) {
    var od = CC.OPPONENTS[oppId || 'rustborough'];
    run = run || { deck: CC.STARTER_DECK.slice(), won: 0 };
    var s = {
      version: CC.SAVE_VERSION,
      seed: seed,
      rng: seed,
      turn: 1,
      golden: false,
      over: false,
      result: null,          // 'win' | 'lose'
      score: { you: 0, them: 0 },
      ball: { zone: 1, side: 'you' },
      atk: 0,
      shp: 0,
      control: 0,
      shpGained: 0,          // SHAPE gained this turn (cancels DIRTY TACKLE injuries)
      shotBonus: 0,          // Driven Cross: next shot this turn
      costDown: 0,           // Total Football: cards cost less this turn
      powers: {},            // power id -> value, for the rest of the match
      turnPlays: { cards: 0, moves: 0, zones: 0 },
      run: { deck: run.deck.slice(), won: run.won },
      reward: null,          // { offer: [ids], picked: id | 'skip' | null } after a win
      gk: CC.MATCH_RULES.gk,
      energy: CC.MATCH_RULES.energy,
      draw: [],
      hand: [],
      discard: [],
      exhaust: [],
      log: [],
      nextUid: 1,
      opp: {
        id: od.id, name: od.name, short: od.short,
        atk: 0, perm: 0, bus: 0, busUntil: 0,
        intent: null, idx: {}
      }
    };
    var deck = s.run.deck.map(function (id) { return { uid: s.nextUid++, id: id }; });
    s.draw = CC.shuffle(s, deck);
    CC.log(s, 'Match ' + (run.won + 1) + '. Kick off vs ' + od.name + '. Seed ' + seed + '.');
    CC.pickIntent(s);
    CC.drawCards(s, CC.MATCH_RULES.handSize);
    return s;
  };

  CC.card = function (inst) { return CC.CARDS[inst.id]; };
  CC.oppDef = function (s) { return CC.OPPONENTS[s.opp.id]; };

  CC.log = function (s, text, kind) {
    s.log.push({ min: CC.clockLabel(s), text: text, kind: kind || '' });
    if (s.log.length > 60) s.log.shift();
  };

  // Turn 1 starts at 0'. Each turn is 7.5 minutes. Golden goal shows 90+'.
  CC.clockMinute = function (s) {
    if (s.over || s.turn > CC.MATCH_RULES.turns) return CC.MATCH_RULES.minutes;
    return Math.round((s.turn - 1) * CC.MATCH_RULES.minutes / CC.MATCH_RULES.turns);
  };
  CC.clockLabel = function (s) {
    return s.golden ? '90+' : String(CC.clockMinute(s));
  };

  // What your shot has to beat.
  CC.shotWall = function (s) {
    var od = CC.oppDef(s);
    return od.def + s.opp.bus + od.gk;
  };

  // Current cost after Simple Finish's rule and Total Football.
  CC.cardCost = function (s, inst) {
    var c = CC.card(inst);
    var cost = c.cost;
    if (c.freeIfAtk && s.atk >= c.freeIfAtk) cost = 0;
    return Math.max(0, cost - s.costDown);
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
    if (s.over) return 'Match over. Start a new match.';
    var cost = CC.cardCost(s, inst);
    if (cost > s.energy) return 'Not enough energy. Costs ' + cost + ', you have ' + s.energy + '.';
    if (c.needsPossession === true && s.ball.side !== 'you') return 'Needs the ball.';
    if (c.needsPossession === false && s.ball.side === 'you') return 'Only playable when they have the ball.';
    if (typeof c.zone === 'number' && s.ball.zone !== c.zone) return 'Only playable in the ' + CC.ZONES[c.zone] + '.';
    return null;
  };

  CC.playCard = function (s, uid) {
    var idx = -1;
    for (var i = 0; i < s.hand.length; i++) if (s.hand[i].uid === uid) { idx = i; break; }
    if (idx < 0) return false;
    var inst = s.hand[idx];
    if (CC.cardBlock(s, inst)) return false;
    var c = CC.card(inst);
    s.energy -= CC.cardCost(s, inst);
    s.hand.splice(idx, 1);
    (c.exhaust || c.type === 'power' ? s.exhaust : s.discard).push(inst);
    var res = CC.EFFECTS[c.effect](s, c.params || {}, c);
    s.turnPlays.cards++;
    if (c.type === 'move') s.turnPlays.moves++;
    CC.log(s, c.name + ': ' + res.text, res.kind);
    return true;
  };

  // Possession change. Turnover wipes the losing side's banked ATK.
  CC.setBall = function (s, side, zone) {
    if (side !== s.ball.side) {
      if (side === 'you') s.opp.atk = 0; else s.atk = 0;
    }
    s.ball.side = side;
    s.ball.zone = zone;
  };

  // After any goal or save: conceding/saving side restarts in MIDFIELD, ATK resets.
  CC.restart = function (s, side) {
    s.atk = 0;
    s.opp.atk = 0;
    s.ball.side = side;
    s.ball.zone = 1;
  };

  CC.finish = function (s, result, why) {
    s.over = true;
    s.result = result;
    if (result === 'win') {
      s.run.won++;
      s.reward = { offer: CC.rollReward(s), picked: null };
    }
    CC.log(s, why + ' ' + s.score.you + '-' + s.score.them + '.', result === 'win' ? 'goal' : 'bad');
  };

  CC.endTurn = function (s) {
    if (s.over) return;
    while (s.hand.length) s.discard.push(s.hand.pop());
    var burn = CC.runIntent(s);  // opponent acts; returns extra turns burned
    if (s.over) return;
    s.turn += 1 + burn;
    var R = CC.MATCH_RULES;
    if (s.golden) {
      CC.finish(s, 'lose', 'Golden goal turn over. Still level. Ties go to the house');
      return;
    }
    if (s.turn > R.turns) {
      var y = s.score.you, t = s.score.them;
      if (y > t) { CC.finish(s, 'win', 'Full time. You win'); return; }
      if (y < t) { CC.finish(s, 'lose', 'Full time. You lose'); return; }
      s.golden = true;
      s.turn = R.turns + 1;
      CC.log(s, 'Full time level at ' + y + '-' + t + '. Golden goal: one turn each.', 'bad');
    }
    CC.pickIntent(s);
    CC.startTurn(s);
  };

  CC.startTurn = function (s) {
    var keep = Math.floor(s.shp / 2);
    if (s.powers.the_wall) keep = Math.max(keep, Math.min(s.shp, s.powers.the_wall));
    var decayed = s.shp - keep;
    s.shp = keep;
    s.control = 0;
    s.shpGained = 0;
    s.shotBonus = 0;
    s.costDown = 0;
    s.turnPlays = { cards: 0, moves: 0, zones: 0 };
    s.energy = CC.MATCH_RULES.energy;
    if (decayed) CC.log(s, 'SHP decays by ' + decayed + '.');
    if (s.powers.prime_form && s.ball.side === 'you') {
      s.atk += s.powers.prime_form;
      CC.log(s, 'Prime Form: +' + s.powers.prime_form + ' ATK.');
    }
    CC.drawCards(s, CC.MATCH_RULES.handSize);
  };
})(window.CC);
