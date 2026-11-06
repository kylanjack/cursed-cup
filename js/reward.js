// reward.js — post-match card reward and coins. Market and training arrive in M5.
// Works on the run object (run.js). Uses the run's seeded RNG.
(function (CC) {
  'use strict';

  // Reward offer: distinct cards, rarity rolled per slot.
  CC.rollReward = function (run) {
    var pools = { common: [], uncommon: [], rare: [] };
    Object.keys(CC.CARDS).forEach(function (id) {
      var r = CC.CARDS[id].rarity;
      if (pools[r]) pools[r].push(id);
    });
    var odds = CC.REWARD.odds, out = [];
    for (var guard = 0; out.length < CC.REWARD.choices && guard < 50; guard++) {
      var roll = CC.rand(run);
      var rar = roll < odds.rare ? 'rare' : (roll < odds.rare + odds.uncommon ? 'uncommon' : 'common');
      var pool = pools[rar].filter(function (id) { return out.indexOf(id) < 0; });
      if (pool.length) out.push(pool[Math.floor(CC.rand(run) * pool.length)]);
    }
    return out;
  };

  // Coins for a won match. Returns { total, parts: [text] } for the results screen.
  CC.matchCoins = function (m) {
    var C = CC.COINS, parts = ['Win ' + C.win];
    var total = C.win + C.perGoal * m.score.you;
    if (m.score.you) parts.push(m.score.you + ' goals x ' + C.perGoal);
    if (m.score.them === 0) { total += C.cleanSheet; parts.push('Clean sheet ' + C.cleanSheet); }
    return { total: total, parts: parts };
  };

  CC.pickReward = function (run, id) {
    var r = run.reward;
    if (!r || r.picked) return;
    if (id === 'skip') { r.picked = 'skip'; return; }
    if (r.offer.indexOf(id) < 0) return;
    r.picked = id;
    run.deck.push(id);
  };

  // Playtest run (?test=1 in the URL): starter deck + one power + extra random non-starter cards.
  CC.TEST_RUN = { extra: 5 };
  CC.testDeck = function (seed) {
    var tmp = { rng: seed };
    var pool = Object.keys(CC.CARDS).filter(function (id) { return CC.CARDS[id].rarity !== 'starter'; });
    var powers = pool.filter(function (id) { return CC.CARDS[id].type === 'power'; });
    var deck = CC.STARTER_DECK.slice();
    deck.push(powers[Math.floor(CC.rand(tmp) * powers.length)]);
    var rest = CC.shuffle(tmp, pool.filter(function (id) { return deck.indexOf(id) < 0; }));
    return deck.concat(rest.slice(0, CC.TEST_RUN.extra));
  };
})(window.CC);
