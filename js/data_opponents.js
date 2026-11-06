// data_opponents.js — opponent definitions. Balance changes happen HERE, not in opponent.js.
//
// Schema:
//   id, name, short (3 letters for the scoreboard)
//   def, gk       — your shot (power + ATK) must beat def + gk
//   control       — your STEAL must beat this to win the ball
//   shootZone     — zone index they shoot from (0 = your DEF THIRD)
//   patterns      — named intent scripts. Each has:
//     withBall    — cycled when they have the ball: { type: 'build', n } or { type: 'waste' }
//                   ('waste' = TIME WASTING, skipped unless they lead)
//     shoot       — SHOOT numbers, cycled when the ball is in shootZone
//     withoutBall — cycled when you have the ball: press / dirty / park, each with n
//                   ('dirty' also takes target: squad player name)
//   branches      — checked in order, first match picks the pattern, else 'normal'
//     { when: 'trailing' | 'leading', fromTurn, use: patternName }
(function (CC) {
  'use strict';

  CC.OPPONENTS = {
    rustborough: {
      id: 'rustborough', name: 'Rustborough Athletic', short: 'RUS',
      def: 8, gk: 4, control: 5, shootZone: 1,
      patterns: {
        normal: {
          withBall: [{ type: 'build', n: 4 }, { type: 'build', n: 3 }, { type: 'build', n: 5 }],
          shoot: [12, 13, 11],
          withoutBall: [{ type: 'press', n: 3 }, { type: 'park', n: 3 }, { type: 'press', n: 2 }]
        },
        chasing: {
          withBall: [{ type: 'build', n: 6 }, { type: 'build', n: 5 }],
          shoot: [13, 14],
          withoutBall: [{ type: 'press', n: 4 }, { type: 'press', n: 5 }]
        },
        protect: {
          withBall: [{ type: 'waste' }, { type: 'build', n: 2 }],
          shoot: [11],
          withoutBall: [{ type: 'park', n: 5 }, { type: 'press', n: 3 }]
        }
      },
      branches: [
        { when: 'trailing', fromTurn: 8, use: 'chasing' },
        { when: 'leading', fromTurn: 9, use: 'protect' }
      ]
    }
  };
})(window.CC);
