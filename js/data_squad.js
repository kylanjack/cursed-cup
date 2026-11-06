// data_squad.js — squad players (relics). Balance changes happen HERE, not in squad.js.
//
// Schema:
//   id, name, pos, text (the passive, shown on click), trait (name + text, optional)
//   hook    — which engine hook reads this player (squad.js): gk / decay / freePass / shotPower / advanceAtk
//   params  — numbers the hook reads
//   injuryHits — how many injuries one DIRTY TACKLE counts as (Glass Bones = 2). Default 1.
//
// Injury rules (CLAUDE.md, never soften): one injury = out for the rest of the run (until a physio
// heals it, M5b). Total injuries reaching CAREER_OVER_AT = career over, player gone for good.
(function (CC) {
  'use strict';

  CC.SQUAD = {
    brick_walls: {
      id: 'brick_walls', name: 'Brick Walls', pos: 'GK',
      text: 'Your GK is 4. The first goal you concede each match is cancelled.',
      hook: 'gk', params: { gk: 4, cancelGoals: 1 }
    },
    marek_stone: {
      id: 'marek_stone', name: 'Marek Stone', pos: 'CB', trait: { name: 'Captain', text: '' },
      text: 'SHP decays by a third instead of half.',
      hook: 'decay', params: { decay: 1 / 3 }
    },
    yuri_engine: {
      id: 'yuri_engine', name: 'Yuri Engine', pos: 'MID',
      text: 'Your first Short Pass each turn costs 0.',
      hook: 'freePass', params: { card: 'short_pass', free: 1 }
    },
    santi_vane: {
      id: 'santi_vane', name: 'Santi Vane', pos: 'ST', trait: { name: 'Clinical', text: '' },
      text: 'All shot cards +2 power.',
      hook: 'shotPower', params: { power: 2 }
    },
    dax_marrow: {
      id: 'dax_marrow', name: 'Dax Marrow', pos: 'WING',
      trait: { name: 'Glass Bones', text: 'One injury counts as two: a single injury is career over.' },
      text: '+3 ATK each time a card moves the ball forward.',
      hook: 'advanceAtk', params: { atk: 3 }, injuryHits: 2
    }
  };

  CC.STARTER_SQUAD = ['brick_walls', 'marek_stone', 'yuri_engine', 'santi_vane', 'dax_marrow'];

  // GK when your keeper is injured or gone.
  CC.SQUAD_RULES = { noKeeperGk: 1, careerOverAt: 2, baseDecay: 1 / 2 };
})(window.CC);
