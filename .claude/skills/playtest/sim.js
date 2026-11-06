// Headless balance sim: loads the game's engine files in Node, plays N matches with a greedy bot.
// Usage: node .claude/skills/playtest/sim.js [matches=2000] [seedToPrintLog|0] [opponent=all] [row=0]
//        node .claude/skills/playtest/sim.js run [runs=500]   — full map runs, bot picks a random node and reward
// The bot plays starter cards by plan and any other card greedily. Extend botTurn when cards need smarter use.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../../..');
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
for (const f of ['state', 'data_cards', 'data_opponents', 'data_run', 'match', 'effects', 'opponent', 'reward', 'map', 'run']) {
  eval(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'));
}
const CC = global.CC;
const find = (s, pred) => s.hand.find(h => pred(CC.card(h)) && !CC.cardBlock(s, h));
const play = (s, h) => CC.playCard(s, h.uid);

function botTurn(s) {
  for (let guard = 0; guard < 10 && !s.over; guard++) {
    const it = s.opp.intent;
    const anyShot = s.hand.find(h => CC.card(h).type === 'shot' && !CC.cardBlock(s, h) && CC.shotPower(s, CC.card(h)) > CC.shotWall(s));
    if (anyShot) { play(s, anyShot); continue; }
    const pressed = (it.type === 'press' || it.type === 'dirty') && it.n > s.control && CC.intentValid(s);
    if (s.ball.side === 'you') {
      const shot = s.hand.find(h => CC.card(h).type === 'shot');
      if (shot && !CC.cardBlock(s, shot) && CC.shotPower(s, CC.card(shot)) > CC.shotWall(s)) { play(s, shot); continue; }
      if (s.ball.zone < 2) { const m = find(s, c => c.id === 'short_pass') || find(s, c => c.id === 'long_ball'); if (m) { play(s, m); continue; } }
      if (pressed) { const hu = find(s, c => c.id === 'hold_up_play'); if (hu) { play(s, hu); continue; } }
      if (shot && s.ball.zone === 2) {
        const sp = find(s, c => c.id === 'short_pass');
        if (sp && s.energy - 1 >= CC.card(shot).cost) { play(s, sp); continue; }
        if (!CC.cardBlock(s, shot) && pressed) { play(s, shot); continue; }
      }
      if (s.ball.zone === 2 && !shot) { const sp = find(s, c => c.id === 'short_pass'); if (sp && s.energy > 1) { play(s, sp); continue; } }
      const j = find(s, c => c.id === 'jockey'); if (j) { play(s, j); continue; }
      const sp2 = find(s, c => c.id === 'short_pass'); if (sp2) { play(s, sp2); continue; }
      const other = find(s, c => c.rarity !== 'starter' && c.type !== 'shot' && c.id !== 'clearance' && c.id !== 'cynical_foul'); if (other) { play(s, other); continue; }
      break;
    } else {
      const t = find(s, c => c.effect === 'steal' && c.params.steal > s.opp.control); if (t) { play(s, t); continue; }
      const j = find(s, c => c.id === 'jockey'); if (j) { play(s, j); continue; }
      const other = find(s, c => c.rarity !== 'starter' && c.type !== 'shot' && c.id !== 'cynical_foul'); if (other) { play(s, other); continue; }
      break;
    }
  }
  CC.endTurn(s);
}

function playOut(s) { let g = 0; while (!s.over && g++ < 40) botTurn(s); return s; }
function runMatch(seed, opp, row) { return playOut(CC.newMatch(seed, opp, CC.STARTER_DECK, { row: row || 0 })); }

if (process.argv[2] === 'run') {
  const R = +process.argv[3] || 500, dist = {}, lostTo = {};
  let total = 0, champs = 0;
  for (let i = 1; i <= R; i++) {
    const run = CC.newRun(i * 104729, false);
    while (!run.result) {
      const reach = CC.reachable(run);
      CC.enterNode(run, reach[Math.floor(CC.rand(run) * reach.length)]);
      playOut(run.match); CC.settleMatch(run);
      if (run.result === 'lost') { const h = run.history[run.history.length - 1]; lostTo[h.opp] = (lostTo[h.opp] || 0) + 1; }
      if (run.result) break;
      const o = run.reward.offer; CC.pickReward(run, o[Math.floor(CC.rand(run) * o.length)]);
      CC.toMap(run);
    }
    if (run.result === 'champion') champs++;
    total += run.won; dist[run.won] = (dist[run.won] || 0) + 1;
  }
  console.log('avg matches won per run ' + (total / R).toFixed(2) + ' of ' + CC.MAP_RULES.rows + '  cup won ' + (100 * champs / R).toFixed(1) + '%');
  console.log('wins before end: ' + Object.entries(dist).map(e => e[0] + ':' + e[1]).join('  '));
  console.log('runs ended by: ' + Object.entries(lostTo).map(e => e[0] + ':' + e[1]).join('  '));
  process.exit(0);
}

const N = +process.argv[2] || 2000;
const LOG = +process.argv[3] || 0;
const OPPS = process.argv[4] && process.argv[4] !== 'all' ? [process.argv[4]] : Object.keys(CC.OPPONENTS);
const ROW = +process.argv[5] || 0;
const pats = [[/They shoot.*GOAL/, 'theirGoal'], [/They shoot.*Saved/, 'theirSave'], [/\d+ vs \d+\. GOAL/, 'yourGoal'],
  [/vs \d+\. Saved\. Their/, 'yourSave'], [/STEAL.*beats/, 'steal'], [/Ball lost/, 'pressWin'], [/INTENT LOST/, 'intentLost'],
  [/They build/, 'build'], [/park the bus/, 'bus'], [/waste time/, 'waste']];
for (const opp of OPPS) {
  const res = { win: 0, lose: 0 }, scores = {}, ev = {};
  let golden = 0, goals = 0, against = 0;
  for (let i = 1; i <= N; i++) {
    const s = runMatch(i * 7919, opp, ROW);
    res[s.result]++; if (s.golden) golden++;
    const k = s.score.you + '-' + s.score.them; scores[k] = (scores[k] || 0) + 1;
    goals += s.score.you + s.score.them; against += s.score.them;
    s.log.forEach(l => pats.forEach(([r, key]) => { if (r.test(l.text)) ev[key] = (ev[key] || 0) + 1; }));
  }
  console.log('== ' + opp + ' (row ' + ROW + ')');
  console.log('win ' + (100 * res.win / N).toFixed(1) + '%  golden ' + (100 * golden / N).toFixed(1) + '%  avg goals ' + (goals / N).toFixed(2) + '  conceded ' + (against / N).toFixed(2));
  console.log('scores: ' + Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 12).map(e => e[0] + ':' + e[1]).join('  '));
  console.log('per match: ' + Object.entries(ev).map(([k, v]) => k + ' ' + (v / N).toFixed(2)).join('  '));
  if (LOG) runMatch(LOG, opp, ROW).log.forEach(l => console.log(l.min + "'", l.text));
}
