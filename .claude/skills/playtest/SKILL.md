---
name: playtest
description: Play and test Cursed Cup without a human. Runs a headless balance sim of matches and full map runs, and a real-browser playthrough with desktop screenshots, no-scroll check, save/load and corrupt-save checks, and console errors. Use after any engine, data or UI change, before pushing to main, or when asked to playtest, find bugs or check balance.
---

# Playtest Cursed Cup

Run from the repo root. Playwright and Chromium are preinstalled in cloud sessions; never install them, never add a package.json.

## 1. Balance sim (engine + data only)

```bash
node .claude/skills/playtest/sim.js 2000
```

Plays each opponent with the starter deck and prints win rate, golden-goal rate, goals, score distribution and per-match event counts.
Arguments: `sim.js [matches] [seedToPrintLog|0] [opponent|all] [mapRow]`, e.g. `sim.js 1000 0 hollow 5` for The Hollow XI at round 6 scaling.

The bot is greedy and dumb; a human should beat its win rate. Reference after M4 tuning, row 0: Rustborough ~59%, Hollow XI ~46%, Saltmarsh ~62%.
Red flags: win rate above 80% or below 35%, 0-0 above 10%, opponent averaging under 0.5 goals. Any opponent CONTROL at or above a STEAL card's number switches that card off entirely — check row scaling.

Run mode plays full map runs (random node, random reward pick):
`node .claude/skills/playtest/sim.js run 1000`
Reference M4 (no relics yet): ~1.1 matches won of 8, cup won ~0%. Prints which opponent ends runs.

The bot plays starter cards by plan and other cards greedily. Extend `botTurn` when new cards need smarter use.

## 2. Browser playthrough

```bash
node .claude/skills/playtest/browser.js <scratchpad-dir>
```

Desktop only (1280x720, the minimum target, and 1920x1080). Picks map nodes, plays cards with a simple priority (scoring shot, moves, anything but a saved shot), starts a new run after a loss until it has won once, picks a reward and goes back to the map, reloads on the map and mid-match to confirm the save, checks the page never scrolls, then loads a corrupted save and expects the recovery notice. Screenshots: map-start, map-selected, match, reward, run-over/loss, end, deck, corrupt. Read the PNGs with the Read tool and check layout, overflow and legibility. Any reported error is a bug to fix before pushing.

## Test runs

`index.html?test=1` starts a run with the starter deck + one power + 5 random non-starter cards and 100 coins. Kylan uses https://kylanjack.github.io/cursed-cup/?test=1 to try new cards without winning first. A normal link never continues a test run.

## 3. Report

Give Kylan: sim numbers vs the reference, any errors, and anything that looked wrong in the screenshots. Fix bugs found; propose balance changes as data edits only.
