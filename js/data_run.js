// data_run.js — run map rules, opponent scaling by row, coins. Balance changes happen HERE.
(function (CC) {
  'use strict';

  // Map: rows 0..rows-2 are regular nodes, the last row is the FINAL (one node).
  // width: nodes per row, rolled between min and max. lanes: vertical slots on the map.
  // types: weighted node types for regular rows. M4 has matches only; market, training,
  // event and rival nodes arrive in M5/M6 as new entries here.
  CC.MAP_RULES = {
    rows: 8,
    lanes: 3,
    width: { min: 2, max: 3 },
    types: [{ type: 'match', weight: 1 }],
    regulars: ['rustborough', 'hollow', 'saltmarsh'],
    // Stand-in until Mirror FC (M6): the final is a regular opponent at final-row scaling.
    finalOpp: 'rustborough'
  };

  // Added to the opponent's numbers by map row (index 0 = first match, last = FINAL).
  // def: added to DEF. shot: added to every SHOOT intent. control: added to CONTROL.
  // Careful with control: +1 can push it past a STEAL card's number and switch stealing off entirely.
  // Kept gentle for M4: no relics or market yet. Retune in the M6 balance pass.
  CC.ROW_SCALE = [
    { def: 0, shot: 0, control: 0 },
    { def: 0, shot: 0, control: 0 },
    { def: 0, shot: 0, control: 0 },
    { def: 1, shot: 0, control: 0 },
    { def: 1, shot: 1, control: 0 },
    { def: 1, shot: 1, control: 0 },
    { def: 2, shot: 1, control: 0 },
    { def: 2, shot: 1, control: 0 }
  ];

  // Coins after a win. Nothing to spend them on until the market (M5).
  CC.COINS = { start: 0, win: 15, perGoal: 5, cleanSheet: 10, test: 100 };

  // Node labels on the map.
  CC.NODE_NAMES = { match: 'MATCH', final: 'FINAL' };
})(window.CC);
