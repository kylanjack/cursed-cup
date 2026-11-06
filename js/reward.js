// reward.js — post-match card reward and moving to the next match. Market and training arrive in M5.
(function (CC) {
  'use strict';

  // Reward offer: distinct cards, rarity rolled per slot with the match's seeded RNG.
  CC.rollReward = function (s) {
    var pools = { common: [], uncommon: [], rare: [] };
    Object.keys(CC.CARDS).forEach(function (id) {
      var r = CC.CARDS[id].rarity;
      if (pools[r]) pools[r].push(id);
    });
    var odds = CC.REWARD.odds, out = [];
    for (var guard = 0; out.length < CC.REWARD.choices && guard < 50; guard++) {
      var roll = CC.rand(s);
      var rar = roll < odds.rare ? 'rare' : (roll < odds.rare + odds.uncommon ? 'uncommon' : 'common');
      var pool = pools[rar].filter(function (id) { return out.indexOf(id) < 0; });
      if (pool.length) out.push(pool[Math.floor(CC.rand(s) * pool.length)]);
    }
    return out;
  };

  CC.pickReward = function (s, id) {
    if (!s.reward || s.reward.picked) return;
    if (id === 'skip') { s.reward.picked = 'skip'; return; }
    if (s.reward.offer.indexOf(id) < 0) return;
    s.reward.picked = id;
    s.run.deck.push(id);
  };

  // Next match keeps the run deck. Seed comes from this match's RNG so a run is reproducible.
  CC.nextMatch = function (s) {
    var seed = (Math.floor(CC.rand(s) * 0xffffffff) >>> 0) || 1;
    return CC.newMatch(seed, s.opp.id, s.run);
  };

  // Playtest run (?test=1 in the URL): starter deck + one power + extra random non-starter cards.
  CC.TEST_RUN = { extra: 5 };
  CC.testRun = function (seed) {
    var tmp = { rng: seed };
    var pool = Object.keys(CC.CARDS).filter(function (id) { return CC.CARDS[id].rarity !== 'starter'; });
    var powers = pool.filter(function (id) { return CC.CARDS[id].type === 'power'; });
    var deck = CC.STARTER_DECK.slice();
    deck.push(powers[Math.floor(CC.rand(tmp) * powers.length)]);
    var rest = CC.shuffle(tmp, pool.filter(function (id) { return deck.indexOf(id) < 0; }));
    return { deck: deck.concat(rest.slice(0, CC.TEST_RUN.extra)), won: 0, test: true };
  };
})(window.CC);
