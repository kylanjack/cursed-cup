// run.js — run state: new run, enter a map node, settle a finished match, back to the map.
// The run object is what gets saved. It holds the current match (run.match) while one is on.
(function (CC) {
  'use strict';

  // test: ?test=1 playtest run (extra cards and coins).
  CC.newRun = function (seed, test) {
    var run = {
      version: CC.SAVE_VERSION,
      seed: seed,
      rng: seed,
      test: !!test,
      deck: test ? CC.testDeck(seed) : CC.STARTER_DECK.slice(),
      coins: test ? CC.COINS.test : CC.COINS.start,
      won: 0,
      squad: CC.newSquad(),
      // Run stats for achievements and meta-progression later.
      stats: { wins: 0, goalsFor: 0, goalsAgainst: 0, cleanSheets: 0, injuries: 0, careerOvers: 0, goalsCancelled: 0 },
      path: [],             // node ids entered, in order. Last one is the current/last node.
      scene: 'map',         // 'map' | 'match'
      match: null,
      reward: null,         // { offer, picked, coins: { total, parts } } after a win
      result: null,         // null while alive · 'lost' · 'champion'
      history: []           // { node, opp, you, them, result } per finished match
    };
    run.map = CC.genMap(run);
    return run;
  };

  CC.currentNode = function (run) {
    return run.path.length ? CC.mapNode(run.map, run.path[run.path.length - 1]) : null;
  };

  // Start the match on a reachable node. Returns false if the node can't be entered.
  CC.enterNode = function (run, id) {
    if (run.scene !== 'map' || CC.reachable(run).indexOf(id) < 0) return false;
    var node = CC.mapNode(run.map, id);
    run.path.push(id);
    run.reward = null;
    var seed = (Math.floor(CC.rand(run) * 0xffffffff) >>> 0) || 1;
    var label = (node.type === 'final' ? 'FINAL' : 'Match ' + (node.row + 1)) + ' of ' + CC.MAP_RULES.rows;
    run.match = CC.newMatch(seed, node.opp, run.deck, { row: node.row, label: label, squad: run.squad });
    run.scene = 'match';
    return true;
  };

  // Call after every match action. Pays out once when the match ends.
  CC.settleMatch = function (run) {
    var m = run.match;
    if (!m || !m.over || m.settled) return;
    m.settled = true;
    var node = CC.currentNode(run);
    run.history.push({ node: node.id, opp: m.opp.id, you: m.score.you, them: m.score.them, result: m.result,
      hurt: m.injuredNow.slice() });
    run.squad = JSON.parse(JSON.stringify(m.squad));
    var st = run.stats;
    st.goalsFor += m.score.you;
    st.goalsAgainst += m.score.them;
    st.goalsCancelled += m.cancelled;
    st.injuries += m.injuredNow.length;
    m.injuredNow.forEach(function (id) { if (CC.squadMember(m, id).status === 'gone') st.careerOvers++; });
    if (m.result === 'win') {
      st.wins++;
      if (m.score.them === 0) st.cleanSheets++;
    }
    if (m.result !== 'win') { run.result = 'lost'; return; }
    run.won++;
    var coins = CC.matchCoins(m);
    run.coins += coins.total;
    if (node.type === 'final') { run.result = 'champion'; return; }
    run.reward = { offer: CC.rollReward(run), picked: null, coins: coins };
  };

  // After the reward: drop the match, back to the map.
  CC.toMap = function (run) {
    if (!run.match || !run.match.over || run.result) return;
    run.match = null;
    run.scene = 'map';
  };
})(window.CC);
