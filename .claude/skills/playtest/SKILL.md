---
name: playtest
description: Play and test Cursed Cup without a human. Runs a headless balance sim of many matches and a real-browser playthrough with screenshots (phone + desktop), save/load check and console errors. Use after any engine, data or UI change, before pushing to main, or when asked to playtest, find bugs or check balance.
---

# Playtest Cursed Cup

Run from the repo root. Playwright and Chromium are preinstalled in cloud sessions; never install them, never add a package.json.

## 1. Balance sim (engine + data only)

```bash
node .claude/skills/playtest/sim.js 2000
```

Prints win rate, golden-goal rate, average goals, score distribution and per-match event counts.
Add a seed as a second argument to print that match's full log: `node .claude/skills/playtest/sim.js 10 12345`.

The bot is greedy and dumb; a human should beat its win rate. Reference after M2 tuning vs Rustborough: win ~59%, golden ~32%, avg goals ~2.3, 0-0 under 5%.
Red flags: win rate above 80% or below 35%, 0-0 above 10%, opponent averaging under 0.5 goals.

Run mode chains matches like a run (random reward pick each win, capped at 15):
`node .claude/skills/playtest/sim.js run 500`

The bot plays starter cards by plan and other cards greedily. Extend `botTurn` when new cards need smarter use.

## 2. Browser playthrough

```bash
node .claude/skills/playtest/browser.js <scratchpad-dir> 20
```

Plays up to 20 turns by tapping the first playable card repeatedly, picks a reward and continues after a win, reloads at turn 4 to confirm the save survives, and screenshots phone (390px, informational only) and desktop (1280px, the real target) at start, mid, reward, end and the deck viewer. Read the PNGs with the Read tool and check layout, overflow and legibility. Any console error is a bug to fix before pushing.

## Test runs

`index.html?test=1` starts a run with the starter deck + one power + 5 random non-starter cards. Kylan uses https://kylanjack.github.io/cursed-cup/?test=1 to try new cards without winning first. A normal link never continues a test run.

## 3. Report

Give Kylan: sim numbers vs the reference, any errors, and anything that looked wrong in the screenshots. Fix bugs found; propose balance changes as data edits only.
