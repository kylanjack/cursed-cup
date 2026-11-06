// data_cards.js — card definitions. Balance changes happen HERE, not in effects.js.
//
// Schema:
//   id, name, cost, rarity (starter/common/uncommon/rare), type (move/shot/defend/skill/power), text
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
    card('short_pass', 'Short Pass', 1, 'starter', 'move', 'Ball +1 zone. +2 ATK.', 'basic', { zones: 1, atk: 2 }, true),
    card('jockey', 'Jockey', 1, 'starter', 'defend', '+5 SHP.', 'basic', { shp: 5 }, null),
    card('standing_tackle', 'Standing Tackle', 1, 'starter', 'skill', 'STEAL 6.', 'steal', { steal: 6 }, false),
    card('long_ball', 'Long Ball', 1, 'starter', 'move', 'Ball +2 zones. Lose half your ATK.', 'basic', { atkLoss: 0.5, zones: 2 }, true),
    card('hold_up_play', 'Hold Up Play', 1, 'starter', 'skill', '+4 CONTROL this turn.', 'basic', { control: 4 }, true),
    card('drive', 'Drive', 2, 'starter', 'shot', 'Shot, power 8. ATT THIRD only.', 'shoot', { power: 8 }, true, ATT),

    // Common
    card('give_and_go', 'Give-and-Go', 1, 'common', 'move', 'Ball +1 zone. Draw 1.', 'basic', { zones: 1, draw: 1 }, true),
    card('overlap', 'Overlap', 1, 'common', 'skill', '+4 ATK.', 'basic', { atk: 4 }, true),
    card('counter_press', 'Counter Press', 1, 'common', 'skill', 'STEAL 5. +2 SHP.', 'steal', { steal: 5, shp: 2 }, false),
    card('clearance', 'Clearance', 0, 'common', 'defend', '+3 SHP. If you have the ball, hoof it: their ball in ATT THIRD.', 'basic', { shp: 3, clear: true }, null),
    card('switch_play', 'Switch Play', 1, 'common', 'skill', '+3 ATK. Draw 1.', 'basic', { atk: 3, draw: 1 }, true),
    card('shepherd_out', 'Shepherd Out', 1, 'common', 'defend', '+4 SHP. +2 CONTROL.', 'basic', { shp: 4, control: 2 }, null),
    card('head_it_away', 'Head It Away', 1, 'common', 'defend', '+6 SHP. Only without the ball.', 'basic', { shp: 6 }, false),
    card('one_two', 'One-Two', 1, 'common', 'move', 'If you played another move card this turn: ball +1 zone. Else +1 ATK.', 'oneTwo', { zones: 1, atk: 1 }, true),
    card('row_z', 'Row Z', 0, 'common', 'defend', 'Their banked ATK to 0. Lose 2 SHP.', 'basic', { resetOppAtk: true, shpLoss: 2 }, null),
    card('simple_finish', 'Simple Finish', 1, 'common', 'shot', 'Shot, power 6. Costs 0 if ATK is 8+. ATT THIRD only.', 'shoot', { power: 6 }, true, { zone: 2, freeIfAtk: 8 }),

    // Uncommon
    card('through_ball', 'Through Ball', 1, 'uncommon', 'move', 'Ball +2 zones. Exhaust.', 'basic', { zones: 2 }, true, { exhaust: true }),
    card('nutmeg', 'Nutmeg', 1, 'uncommon', 'skill', '+5 ATK. +2 CONTROL.', 'basic', { atk: 5, control: 2 }, true),
    card('offside_trap', 'Offside Trap', 1, 'uncommon', 'skill', 'If their intent is BUILD UP: win the ball, at least in MIDFIELD.', 'offsideTrap', {}, false),
    card('tiki_taka', 'Tiki-Taka', 1, 'uncommon', 'skill', '+2 ATK for each card played before this one this turn.', 'tikiTaka', { per: 2 }, true),
    card('cynical_foul', 'Cynical Foul', 1, 'uncommon', 'skill', 'Cancel their intent. They gain +3 ATK on every shot for the rest of the match.', 'cynicalFoul', { oppAtk: 3 }, null),
    card('overlap_run', 'Overlap Run', 2, 'uncommon', 'skill', '+8 ATK.', 'basic', { atk: 8 }, true),
    card('park_the_bus', 'Park the Bus', 2, 'uncommon', 'defend', '+12 SHP.', 'basic', { shp: 12 }, null),
    card('driven_cross', 'Driven Cross', 1, 'uncommon', 'skill', 'Your next shot this turn +4 power.', 'shotBonus', { power: 4 }, true),
    card('volley', 'Volley', 2, 'uncommon', 'shot', 'Shot, power 7. +4 if the ball moved 2+ zones this turn. ATT THIRD only.', 'shoot', { power: 7, bonus2zones: 4 }, true, ATT),

    // Rare
    card('screamer', 'Screamer', 3, 'rare', 'shot', 'Shot, power 14. ATT THIRD only. Exhaust.', 'shoot', { power: 14 }, true, { zone: 2, exhaust: true }),
    card('total_football', 'Total Football', 2, 'rare', 'skill', 'This turn, cards cost 1 less. Draw 2.', 'totalFootball', { costDown: 1, draw: 2 }, null),
    card('route_one', 'Route One', 1, 'rare', 'move', 'Ball straight to ATT THIRD. Exhaust.', 'basic', { toZone: 2 }, true, { exhaust: true }),
    card('prime_form', 'Prime Form', 2, 'rare', 'power', 'Power. Start of each turn with the ball: +2 ATK.', 'power', { power: 'prime_form', n: 2 }, null),
    card('the_wall', 'The Wall', 2, 'rare', 'power', 'Power. SHP no longer decays below 5.', 'power', { power: 'the_wall', n: 5 }, null)
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
  CC.REWARD = { choices: 3, odds: { common: 0.6, uncommon: 0.35, rare: 0.05 } };

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
