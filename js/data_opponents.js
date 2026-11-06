// data_opponents.js — opponent definitions. Balance changes happen HERE, not in opponent.js.
//
// Schema:
//   id, name, short (3 letters for the scoreboard), style (one line shown on the map)
//   def, gk       — your shot (power + ATK) must beat def + gk
//   control       — your STEAL must beat this to win the ball
//   shootZone     — zone index they shoot from (0 = your DEF THIRD)
//   patterns      — named intent scripts. Each has:
//     withBall    — cycled when they have the ball: { type: 'build', n } or { type: 'waste' }
//                   ('waste' = TIME WASTING, skipped unless they lead)
//     shoot       — SHOOT numbers, cycled when the ball is in shootZone
//     withoutBall — cycled when you have the ball: press / dirty / park, each with n
//                   ('dirty' also takes target: a squad id, or 'random' for a random fit player)
//   branches      — checked in order, first match picks the pattern, else 'normal'
//     { when: 'trailing' | 'leading', fromTurn, use: patternName }
(function (CC) {
  'use strict';

  CC.OPPONENTS = {
    rustborough: {
      id: 'rustborough', name: 'Rustborough Athletic', short: 'RUS',
      style: 'Builds up and shoots. Presses lightly.',
      def: 15, gk: 4, control: 5, shootZone: 1,
      patterns: {
        normal: {
          withBall: [{ type: 'build', n: 4 }, { type: 'build', n: 3 }, { type: 'build', n: 5 }],
          shoot: [21, 22, 20],
          withoutBall: [{ type: 'press', n: 3 }, { type: 'park', n: 3 }, { type: 'press', n: 2 }]
        },
        chasing: {
          withBall: [{ type: 'build', n: 6 }, { type: 'build', n: 5 }],
          shoot: [22, 23],
          withoutBall: [{ type: 'press', n: 4 }, { type: 'press', n: 5 }]
        },
        protect: {
          withBall: [{ type: 'waste' }, { type: 'build', n: 2 }],
          shoot: [20],
          withoutBall: [{ type: 'park', n: 5 }, { type: 'press', n: 3 }]
        }
      },
      branches: [
        { when: 'trailing', fromTurn: 8, use: 'chasing' },
        { when: 'leading', fromTurn: 9, use: 'protect' }
      ]
    },

    // Press-heavy: hard to keep the ball, but a soft back line once you get through.
    hollow: {
      id: 'hollow', name: 'The Hollow XI', short: 'HOL',
      style: 'Presses hard, with dirty tackles. Shoots on the turnover. Weak at the back.',
      def: 12, gk: 3, control: 5, shootZone: 1,
      patterns: {
        normal: {
          withBall: [{ type: 'build', n: 3 }, { type: 'build', n: 4 }],
          shoot: [16, 17],
          withoutBall: [{ type: 'press', n: 5 }, { type: 'dirty', n: 5, target: 'random' }, { type: 'press', n: 4 }, { type: 'press', n: 7 }]
        },
        chasing: {
          withBall: [{ type: 'build', n: 5 }],
          shoot: [17, 18],
          withoutBall: [{ type: 'press', n: 6 }, { type: 'dirty', n: 6, target: 'random' }]
        },
        protect: {
          withBall: [{ type: 'waste' }, { type: 'build', n: 3 }],
          shoot: [16],
          withoutBall: [{ type: 'press', n: 5 }, { type: 'park', n: 3 }]
        }
      },
      branches: [
        { when: 'trailing', fromTurn: 8, use: 'chasing' },
        { when: 'leading', fromTurn: 9, use: 'protect' }
      ]
    },

    // Deep block: parks the bus a lot, easy to rob, hits hard on the break.
    saltmarsh: {
      id: 'saltmarsh', name: 'Saltmarsh Rovers', short: 'SAL',
      style: 'Sits deep and parks the bus. Easy to rob. Hits hard on the break.',
      def: 18, gk: 5, control: 4, shootZone: 1,
      patterns: {
        normal: {
          withBall: [{ type: 'build', n: 6 }, { type: 'build', n: 5 }],
          shoot: [21, 22],
          withoutBall: [{ type: 'park', n: 4 }, { type: 'press', n: 2 }, { type: 'park', n: 5 }]
        },
        chasing: {
          withBall: [{ type: 'build', n: 7 }],
          shoot: [23, 24],
          withoutBall: [{ type: 'press', n: 4 }, { type: 'press', n: 5 }]
        },
        protect: {
          withBall: [{ type: 'waste' }, { type: 'build', n: 3 }],
          shoot: [21],
          withoutBall: [{ type: 'park', n: 6 }, { type: 'park', n: 5 }]
        }
      },
      branches: [
        { when: 'trailing', fromTurn: 8, use: 'chasing' },
        { when: 'leading', fromTurn: 9, use: 'protect' }
      ]
    }
  };
})(window.CC);
