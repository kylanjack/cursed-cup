// Browser playtest: opens index.html in headless Chromium, picks map nodes, plays turns by clicking cards,
// reloads mid-match and on the map to check save/load, screenshots desktop sizes, reports console errors.
// Usage: node .claude/skills/playtest/browser.js <outDir> [turns=40]
const { chromium } = require('playwright');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const out = path.resolve(process.argv[2] || '.');
const turns = +process.argv[3] || 200;

(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const [name, vp] of [['desk720', { width: 1280, height: 720 }], ['desk1080', { width: 1920, height: 1080 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(name + ': ' + m.text()); });
    const shot = f => p.screenshot({ path: path.join(out, name + '-' + f + '.png') });
    // Page must not scroll at this size.
    const noScroll = async where => {
      const o = await p.evaluate(() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]);
      if (o[0] > o[1] + 1 || o[2] > o[3] + 1) errs.push(name + ': page scrolls on ' + where + ' (' + o.join(' ') + ')');
    };
    await p.goto('file://' + root + '/index.html');
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await p.waitForTimeout(300);
    await shot('map-start'); await noScroll('map');
    let matches = 0, wins = 0, runs = 0, reloadedMap = false, midShot = false;
    for (let t = 0; t < turns; t++) {
      if (await p.$('#scene-map:not([hidden])')) {
        const node = await p.$('.node.st-open');
        if (!node) { errs.push(name + ': map has no open node'); break; }
        await node.click();
        if (!reloadedMap && wins >= 1) {
          await shot('map-selected'); await noScroll('map');
          const before = await p.$$eval('.node.st-done, .node.st-current', n => n.length);
          await p.reload(); await p.waitForTimeout(200);
          if ((await p.$$eval('.node.st-done, .node.st-current', n => n.length)) !== before) errs.push(name + ': map path changed across reload');
          reloadedMap = true;
          await (await p.$('.node.st-open')).click();
        }
        await p.click('[data-act="kickoff"]');
        matches++;
        continue;
      }
      if (await p.$('#overlay:not([hidden])')) {
        const pick = await p.$('[data-pick]:not([data-pick="skip"])');
        if (pick) {
          await shot('reward');
          await pick.click();
          await p.click('[data-act="map"]');
          wins++;
          continue;
        }
        if (await p.$('#overlay h2')) await shot(wins ? 'run-over' : 'loss');
        // Lost before seeing a win: start a new run so reward and map reload get covered.
        if (!wins && runs < 6) { runs++; await p.click('[data-act="new"]'); continue; }
        break;
      }
      // Priority: scoring shot / winning steal, then moves, then anything but a shot that gets saved.
      for (let k = 0; k < 8; k++) {
        const i = await p.$$eval('.hand .card', cs => {
          const ok = cs.map((c, i) => [c, i]).filter(([c]) => !c.classList.contains('blocked'));
          const pick = ok.find(([c]) => c.querySelector('.card-calc.good')) ||
            ok.find(([c]) => c.classList.contains('type-move')) ||
            ok.find(([c]) => !c.classList.contains('type-shot') && !c.querySelector('.card-calc'));
          return pick ? pick[1] : -1;
        });
        if (i < 0) break;
        await (await p.$$('.hand .card'))[i].click();
      }
      if (!midShot && t >= 3) {
        const before = await p.textContent('#log');
        await p.reload(); await p.waitForTimeout(200);
        if ((await p.textContent('#log')) !== before) errs.push(name + ': match state changed across reload');
        await shot('match'); await noScroll('match');
        midShot = true;
      }
      await p.click('#btn-end');
    }
    await shot('end');
    const info = await p.textContent('#runinfo');
    if (!wins) errs.push(name + ': never won a match, reward and map reload untested');
    console.log(name + ': matches entered ' + matches + ', wins ' + wins + ', runs ' + (runs + 1) + ' · ' + info.replace(/\s+/g, ' '));
    await p.click('#btn-deck').catch(() => {});
    await shot('deck');
    await p.close();
  }
  // Corrupt save must recover with a notice, not a blank screen.
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('pageerror', e => errs.push('corrupt: ' + e.message));
  await p.goto('file://' + root + '/index.html');
  await p.evaluate(() => localStorage.setItem('cursedcup_run', '{"version":4,"map":'));
  await p.reload(); await p.waitForTimeout(200);
  if (!(await p.$('#notice:not([hidden])')) || !(await p.$('.node.st-open'))) errs.push('corrupt save: no notice or no map');
  await p.screenshot({ path: path.join(out, 'corrupt.png') });
  await b.close();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'No console errors. Screenshots in ' + out);
})();
