// Browser playtest: opens index.html in headless Chromium, plays turns by tapping cards,
// reloads mid-match to check save/load, screenshots phone + desktop, reports console errors.
// Usage: node .claude/skills/playtest/browser.js <outDir> [turns=20]
const { chromium } = require('playwright');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const out = path.resolve(process.argv[2] || '.');
const turns = +process.argv[3] || 20;

(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const [name, vp] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 800 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(name + ': ' + m.text()); });
    await p.goto('file://' + root + '/index.html');
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(out, name + '-start.png'), fullPage: true });
    for (let t = 0; t < turns; t++) {
      if (await p.$('#overlay:not([hidden])')) break;
      for (let k = 0; k < 6; k++) { const c = await p.$('.card:not(.blocked)'); if (!c) break; await c.click(); }
      if (t === 3) {
        const before = await p.textContent('#log');
        await p.reload(); await p.waitForTimeout(200);
        if ((await p.textContent('#log')) !== before) errs.push(name + ': state changed across reload');
        await p.screenshot({ path: path.join(out, name + '-mid.png'), fullPage: true });
      }
      await p.click('#btn-end');
    }
    await p.screenshot({ path: path.join(out, name + '-end.png'), fullPage: true });
    await p.close();
  }
  await b.close();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'No console errors. Screenshots in ' + out);
})();
