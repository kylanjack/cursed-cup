// Headless balance sim: loads the game's engine files in Node, plays N matches with a greedy bot.
// Usage: node .claude/skills/playtest/sim.js [matches=2000] [seedToPrintLog]
// The bot only knows starter cards. Update botTurn when the card pool changes.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../../..');
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
for (const f of ['state', 'data_cards', 'data_opponents', 'match', 'opponent']) {
  eval(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'));
}
const CC = global.CC;
const find = (s, pred) => s.hand.find(h => pred(CC.card(h)) && !CC.cardBlock(s, h));
const play = (s, h) => CC.playCard(s, h.uid);

function botTurn(s) {
  for (let guard = 0; guard < 10 && !s.over; guard++) {
    const it = s.opp.intent;
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
      break;
    } else {
      const t = find(s, c => c.effect === 'steal' && c.params.steal > CC.oppDef(s).control); if (t) { play(s, t); continue; }
      const j = find(s, c => c.id === 'jockey'); if (j) { play(s, j); continue; }
      break;
    }
  }
  CC.endTurn(s);
}

function runMatch(seed) { const s = CC.newMatch(seed); let g = 0; while (!s.over && g++ < 40) botTurn(s); return s; }

const N = +process.argv[2] || 2000;
const res = { win: 0, lose: 0 }, scores = {}, ev = {};
let golden = 0, goals = 0;
const pats = [[/They shoot.*GOAL/, 'theirGoal'], [/They shoot.*Saved/, 'theirSave'], [/\d+ vs \d+\. GOAL/, 'yourGoal'],
  [/vs \d+\. Saved\. Their/, 'yourSave'], [/STEAL.*beats/, 'steal'], [/Ball lost/, 'pressWin'], [/INTENT LOST/, 'intentLost'],
  [/They build/, 'build'], [/park the bus/, 'bus'], [/waste time/, 'waste']];
for (let i = 1; i <= N; i++) {
  const s = runMatch(i * 7919);
  res[s.result]++; if (s.golden) golden++;
  const k = s.score.you + '-' + s.score.them; scores[k] = (scores[k] || 0) + 1;
  goals += s.score.you + s.score.them;
  s.log.forEach(l => pats.forEach(([r, key]) => { if (r.test(l.text)) ev[key] = (ev[key] || 0) + 1; }));
}
console.log('win ' + (100 * res.win / N).toFixed(1) + '%  golden ' + (100 * golden / N).toFixed(1) + '%  avg goals ' + (goals / N).toFixed(2));
console.log('scores: ' + Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 12).map(e => e[0] + ':' + e[1]).join('  '));
console.log('per match: ' + Object.entries(ev).map(([k, v]) => k + ' ' + (v / N).toFixed(2)).join('  '));
if (process.argv[3]) runMatch(+process.argv[3]).log.forEach(l => console.log(l.min + "'", l.text));
