// data_cards.js — card definitions. Balance changes happen HERE, not in match.js.
//
// Schema:
//   id, name, cost, rarity, type (move/shot/defend/skill/power), text
//   effect          — name of the handler in CC.EFFECTS (match.js)
//   params          — numbers the handler reads
//   needsPossession — true: must have the ball · false: must NOT have the ball · null: either
//   zone            — optional zone index the ball must be in (0 DEF, 1 MID, 2 ATT)
//   exhaust         — optional; removed from the match after play
(function (CC) {
  'use strict';

  CC.CARDS = {
    short_pass: {
      id: 'short_pass', name: 'Short Pass', cost: 1, rarity: 'starter', type: 'move',
      text: 'Ball +1 zone. +2 ATK.',
      effect: 'move', params: { zones: 1, atk: 2 }, needsPossession: true
    },
    jockey: {
      id: 'jockey', name: 'Jockey', cost: 1, rarity: 'starter', type: 'defend',
      text: '+5 SHP.',
      effect: 'gainShape', params: { shp: 5 }, needsPossession: null
    },
    standing_tackle: {
      id: 'standing_tackle', name: 'Standing Tackle', cost: 1, rarity: 'starter', type: 'skill',
      text: 'STEAL 6.',
      effect: 'steal', params: { steal: 6 }, needsPossession: false
    },
    long_ball: {
      id: 'long_ball', name: 'Long Ball', cost: 1, rarity: 'starter', type: 'move',
      text: 'Ball +2 zones. Lose half your ATK.',
      effect: 'move', params: { zones: 2, atkLoss: 0.5 }, needsPossession: true
    },
    hold_up_play: {
      id: 'hold_up_play', name: 'Hold Up Play', cost: 1, rarity: 'starter', type: 'skill',
      text: '+4 CONTROL this turn.',
      effect: 'gainControl', params: { control: 4 }, needsPossession: true
    },
    drive: {
      id: 'drive', name: 'Drive', cost: 2, rarity: 'starter', type: 'shot',
      text: 'Shot, power 8. ATT THIRD only.',
      effect: 'shoot', params: { power: 8 }, needsPossession: true, zone: 2
    }
  };

  CC.STARTER_DECK = [
    'short_pass', 'short_pass', 'short_pass', 'short_pass',
    'jockey', 'jockey',
    'standing_tackle',
    'long_ball',
    'hold_up_play',
    'drive'
  ];
})(window.CC);
