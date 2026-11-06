// data_cards.js — card definitions. Balance changes happen HERE, not in effects.js.
//
// Schema:
//   id, name, cost, rarity (starter/common/uncommon/rare), type (move/shot/defend/skill/power)
//   text            — plain sentence. Zone, without-ball and once-per-match rules show as tags (ui.js), not in text.
//   effect          — handler name in CC.EFFECTS (effects.js). 'basic' applies params in a fixed order.
//   params          — numbers the handler reads
//   needsPossession — true: must have the ball · false: must NOT have the ball · null: either
//   zone            — optional zone index the ball must be in (0 DEF, 1 MID, 2 ATT)
//   exhaust         — optional; removed from the match after play
//   freeIfAtk       — optional; costs 0 when your ATK is at least this
//
// 'basic' params, applied in this order: atkLoss, zones, toZone, atk, shp, control, resetOppAtk, shpLoss, clear, draw
(function (CC) {
  'use strict';

  function card(id, name, cost, rarity, type, text, effect, params, needsPossession, extra) {
    var c = { id: id, name: name, cost: cost, rarity: rarity, type: type, text: text,
      effect: effect, params: params || {}, needsPossession: needsPossession };
    for (var k in extra || {}) c[k] = extra[k];
    return c;
  }

  var ATT = { zone: 2 };

  var LIST = [
    // Starter
    card('short_pass', 'Short Pass', 1, 'starter', 'move', 'Move the ball 1 zone forward. +2 ATK.', 'basic', { zones: 1, atk: 2 }, true),
    card('jockey', 'Jockey', 1, 'starter', 'defend', 'Gain 5 SHP.', 'basic', { shp: 5 }, null),
    card('standing_tackle', 'Standing Tackle', 1, 'starter', 'skill', 'Win the ball if STEAL 6 beats their CONTROL.', 'steal', { steal: 6 }, false),
    card('long_ball', 'Long Ball', 1, 'starter', 'move', 'Move the ball 2 zones forward. Lose half your ATK first.', 'basic', { atkLoss: 0.5, zones: 2 }, true),
    card('hold_up_play', 'Hold Up Play', 1, 'starter', 'skill', '+4 CONTROL this turn. A press has to beat your CONTROL to take the ball.', 'basic', { control: 4 }, true),
    card('drive', 'Drive', 2, 'starter', 'shot', 'Shoot: power 8 + your ATK. Beat their DEF + GK to score.', 'shoot', { power: 8 }, true, ATT),

    // Common
    card('give_and_go', 'Give-and-Go', 1, 'common', 'move', 'Move the ball 1 zone forward. Draw 1 card.', 'basic', { zones: 1, draw: 1 }, true),
    card('overlap', 'Overlap', 1, 'common', 'skill', '+4 ATK.', 'basic', { atk: 4 }, true),
    card('counter_press', 'Counter Press', 1, 'common', 'skill', 'Win the ball if STEAL 5 beats their CONTROL. Gain 2 SHP either way.', 'steal', { steal: 5, shp: 2 }, false),
    card('clearance', 'Clearance', 0, 'common', 'defend', 'Gain 3 SHP. If you have the ball, you hoof it: their ball, in your ATT THIRD.', 'basic', { shp: 3, clear: true }, null),
    card('switch_play', 'Switch Play', 1, 'common', 'skill', '+3 ATK. Draw 1 card.', 'basic', { atk: 3, draw: 1 }, true),
    card('shepherd_out', 'Shepherd Out', 1, 'common', 'defend', 'Gain 4 SHP. +2 CONTROL this turn.', 'basic', { shp: 4, control: 2 }, null),
    card('head_it_away', 'Head It Away', 1, 'common', 'defend', 'Gain 6 SHP.', 'basic', { shp: 6 }, false),
    card('one_two', 'One-Two', 1, 'common', 'move', 'If you already played a move card this turn: move the ball 1 zone forward. Otherwise +1 ATK.', 'oneTwo', { zones: 1, atk: 1 }, true),
    card('row_z', 'Row Z', 0, 'common', 'defend', 'Wipe their banked ATK to 0. Lose 2 SHP.', 'basic', { resetOppAtk: true, shpLoss: 2 }, null),
    card('simple_finish', 'Simple Finish', 1, 'common', 'shot', 'Shoot: power 6 + your ATK. Costs 0 when your ATK is 8 or more.', 'shoot', { power: 6 }, true, { zone: 2, freeIfAtk: 8 }),

    // Uncommon
    card('through_ball', 'Through Ball', 1, 'uncommon', 'move', 'Move the ball 2 zones forward. Keep your ATK.', 'basic', { zones: 2 }, true, { exhaust: true }),
    card('nutmeg', 'Nutmeg', 1, 'uncommon', 'skill', '+5 ATK. +2 CONTROL this turn.', 'basic', { atk: 5, control: 2 }, true),
    card('offside_trap', 'Offside Trap', 1, 'uncommon', 'skill', 'If their intent is BUILD UP, win the ball. It lands in MIDFIELD or further forward.', 'offsideTrap', {}, false),
    card('tiki_taka', 'Tiki-Taka', 1, 'uncommon', 'skill', '+2 ATK for every card you played before it this turn.', 'tikiTaka', { per: 2 }, true),
    card('cynical_foul', 'Cynical Foul', 1, 'uncommon', 'skill', 'Cancel their intent this turn. Price: their shots get +3 for the rest of the match.', 'cynicalFoul', { oppAtk: 3 }, null),
    card('overlap_run', 'Overlap Run', 2, 'uncommon', 'skill', '+8 ATK.', 'basic', { atk: 8 }, true),
    card('park_the_bus', 'Park the Bus', 2, 'uncommon', 'defend', 'Gain 12 SHP.', 'basic', { shp: 12 }, null),
    card('driven_cross', 'Driven Cross', 1, 'uncommon', 'skill', 'Your next shot this turn gets +4 power.', 'shotBonus', { power: 4 }, true),
    card('volley', 'Volley', 2, 'uncommon', 'shot', 'Shoot: power 7 + your ATK. +4 power if the ball moved 2+ zones this turn.', 'shoot', { power: 7, bonus2zones: 4 }, true, ATT),

    // Rare
    card('screamer', 'Screamer', 3, 'rare', 'shot', 'Shoot: power 14 + your ATK.', 'shoot', { power: 14 }, true, { zone: 2, exhaust: true }),
    card('total_football', 'Total Football', 2, 'rare', 'skill', 'Every card costs 1 less this turn. Draw 2 cards.', 'totalFootball', { costDown: 1, draw: 2 }, null),
    card('route_one', 'Route One', 1, 'rare', 'move', 'Move the ball straight to the ATT THIRD.', 'basic', { toZone: 2 }, true, { exhaust: true }),
    card('prime_form', 'Prime Form', 2, 'rare', 'power', 'Start of each turn with the ball: +2 ATK.', 'power', { power: 'prime_form', n: 2 }, null),
    card('the_wall', 'The Wall', 2, 'rare', 'power', 'Your SHP never decays below 5.', 'power', { power: 'the_wall', n: 5 }, null)
  ];

  CC.CARDS = {};
  LIST.forEach(function (c) { CC.CARDS[c.id] = c; });

  CC.STARTER_DECK = [
    'short_pass', 'short_pass', 'short_pass', 'short_pass',
    'jockey', 'jockey',
    'standing_tackle',
    'long_ball',
    'hold_up_play',
    'drive'
  ];

  // Post-match reward: 3 different cards, rarity rolled per slot.
  CC.REWARD = { choices: 3, odds: { common: 0.55, uncommon: 0.35, rare: 0.1 } };

  // Status chips shown under the stats. Text is the one-line rule.
  CC.STATUS = {
    prime_form: { name: 'PRIME FORM', text: '+{n} ATK at the start of each turn with the ball.' },
    the_wall: { name: 'THE WALL', text: 'SHP does not decay below {n}.' },
    shot_bonus: { name: 'CROSS', text: 'Next shot this turn +{n} power.' },
    cost_down: { name: 'TOTAL FOOTBALL', text: 'Cards cost {n} less this turn.' },
    opp_bus: { name: 'BUS', text: 'They have +{n} DEF until your next end of turn.', them: true },
    opp_perm: { name: 'FOULED', text: 'Their shots get +{n} ATK for the rest of the match.', them: true }
  };
})(window.CC);
