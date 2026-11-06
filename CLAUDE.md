# CURSED CUP

Turn-based soccer deckbuilder inspired by Slay the Spire 1 and 2: StS run structure and card combat, reskinned from the ground up as a cursed cup tournament. Kaz Lowe scored a hat-trick in a European final, the sky tore open, and now he captains a doomed squad through a nightmare cup. Win the final to get home. Lose a match and the run is over.

All characters, clubs and players are fictional. Never use real footballers, clubs or competitions by name.

## How Kylan works — read this first

- Kylan has no local dev environment and no terminal. He edits only through the GitHub web UI and Claude Code on the web.
- He playtests on the live GitHub Pages URL (https://kylanjack.github.io/cursed-cup/), mostly on his iPhone. Never tell him to double-click a file or run a command.
- After each milestone (or each fix round he approves), commit and push **directly to `main`**. Do not open pull requests or leave work on a side branch unless he asks. Pages only deploys `main`.
- Commit messages: short, plain, prefixed with the milestone, e.g. `M1: match screen skeleton`.
- New ideas mid-build go in `TODO.md`, not into this spec and not into code.

## Hard constraints — never violate these

- Vanilla JavaScript + HTML/CSS DOM UI. No frameworks, no canvas game loop, no TypeScript. This is a turn-based card game; the DOM is the renderer.
- No build tools. No bundler, no npm, no package.json. Repo root is served as-is by GitHub Pages.
- No ES modules. Plain `<script>` tags, shared globals under a single `CC` namespace object, loaded in dependency order. Must work both on GitHub Pages and opened directly from disk (file://), which is why modules are banned.
- All filenames lowercase. GitHub Pages is case-sensitive.
- Persistence via `localStorage` only, key prefix `cursedcup_`. Never use `window.storage`. The current run must survive a page refresh (auto-save after every completed action).
- Keep every file under ~400 lines. Split by system, not by shrinking features.
- Mobile matters: the layout must work at 390px wide (iPhone). Cards are tapped, not hovered. Tooltips = tap-to-toggle. No drag-and-drop in V1 — tap card, then tap target if needed.
- All game data (cards, opponents, players, events) lives in plain JS object tables, never inline in engine logic. Balance changes must be data edits.

## Design system

- Palette: #171411 background, #211d19 cards/panels, #3a342c borders, #ff6b2b accent (energy, goals, rare cards), #d8d2c4 text, #8a8375 dim text, #e05a3a danger/injury.
- Fonts: Anton (titles, card names, scoreboard), Manrope (body/card text), JetBrains Mono (numbers, log, clock). Load from Google Fonts with system fallbacks.
- UI copy is plain and blunt. No flavor-text fluff, no exclamation marks in system text.
- Seeded RNG: all randomness goes through one seeded PRNG in state.js (mulberry32). A run stores its seed. This makes bugs reproducible and enables daily-seed runs later.

## File structure

```
index.html
css/style.css
js/main.js        — boot, scene router (title / map / match / reward / market / event / gameover)
js/state.js       — run state object, seeded RNG, save/load to localStorage
js/data_cards.js  — card definition table
js/data_opponents.js — opponent definition table (intents, stats)
js/data_squad.js  — player (relic) definition table, traits, recruits
js/data_events.js — dressing-room event table
js/match.js       — match engine: turns, energy, zones, intents, resolution
js/map.js         — run map generation and rendering
js/reward.js      — post-match card rewards, market, training logic
js/ui.js          — DOM builders: card render, tooltips, log, scoreboard, overlays
```

## Match engine (this is the game — build and tune this before any content)

### Board state
- Three zones: DEF THIRD · MIDFIELD · ATT THIRD (always from the player's perspective).
- One ball marker: a zone + which side has possession.
- Scoreboard: your goals, their goals.
- Clock: 12 turns = 90 minutes (each turn advances the clock 7–8 min, displayed as real match minutes). After turn 12: full time. Higher score wins. A draw goes to a single golden-goal turn: each side gets one more turn; first goal wins; if still level, the player loses (the cup is cursed; ties go to the house). Show this rule on the match screen.

### Turn loop
1. Start of your turn: draw 5, gain 3 energy (unspent energy does not carry).
2. Opponent's intent for this turn is already visible (set at end of their previous action).
3. You play any number of cards you can afford. Cards are discarded on play. Deck reshuffles from discard when empty.
4. End turn: discard hand, then the opponent executes its intent, then its next intent is revealed.

### Core stats (keep this exact vocabulary everywhere)
- **ATTACK (ATK)**: buildup power accumulated this possession by your cards. Spent/checked when you shoot. Resets on turnover.
- **SHAPE (SHP)**: your defensive armor. Absorbs opponent attack. Decays by half (round down) at the start of your turn, like StS block but stickier.
- **GK**: your goalkeeper's flat save value (from your keeper relic). Always applies after SHAPE.
- Opponent mirror stats: their **DEF** (what your shot power must beat), their **GK**, their **ATK** shown inside intents.

### Possession and zones
- With the ball: movement cards advance the ball (Short Pass = +1 zone, Through Ball = +2 zones but exhausts, etc.). Shot cards are only playable in ATT THIRD.
- Shooting is DETERMINISTIC: shot resolves as (card shot power + current ATK) vs (their DEF + their GK). Beat it → goal. Don't beat it → saved, turnover. Both numbers are always visible before you commit. No dice on resolution — all randomness lives in the draw.
- After any goal or save: possession resets to the conceding/saving side in MIDFIELD, ATK resets to 0.
- Without the ball: you can still play cards (defensive cards, buffs). Possession cards like Press/Tackle have a listed STEAL value vs the opponent's listed CONTROL; beat it → win the ball in the current zone.

### Opponent intents (telegraphed, StS-style, with numbers visible)
- **BUILD UP n** — they advance a zone and bank n ATK.
- **SHOOT n** — next end-of-turn they shoot for n + banked ATK vs your SHAPE + GK.
- **PRESS n** — if you hold the ball at end of turn and n > your CONTROL (sum of control values from cards played this turn), you lose possession where you stand.
- **DIRTY TACKLE n** — as PRESS, but if it succeeds it also injures the squad player listed on the intent (see injuries). Counterable: any SHAPE gained this turn above n cancels the injury.
- **PARK THE BUS n** — they gain n DEF until your next end of turn.
- **TIME WASTING** — burns a clock turn doing nothing (appears when they lead late).
- Each opponent is a scripted intent pattern with light branching (e.g., "if trailing after turn 8, switch to desperation pattern"), defined entirely in data_opponents.js.

### Rule decisions (fill gaps above; change only with Kylan's OK)
- **Intents depend on possession.** When the opponent picks its next intent, it picks from its with-ball list (BUILD UP, SHOOT, TIME WASTING) if it has the ball, or its without-ball list (PRESS, DIRTY TACKLE, PARK THE BUS) if you have it.
- **Stale intents fizzle.** If possession changes during your turn and their intent no longer makes sense (e.g. SHOOT but you stole the ball), it does nothing; show "INTENT LOST" in the log. Then they pick a new intent from the correct list.
- **SHAPE is checked, not consumed, by shots.** Their shot (n + banked ATK) must beat SHAPE + GK. SHAPE only drops through decay and card costs. Revisit at the Gate if defending feels too easy.
- **First tuning lever at the Gate:** the starter deck has one shot card and ties go to the house. If matches end 0-0 too often, add a second shot card (Simple Finish) to the starter before touching the engine.

### Match end
- Win → card reward (pick 1 of 3, skippable) + coins.
- Lose → run over. No continues. Back to title with a run summary.

## Cards

Starter playbook (10 cards): 4x Short Pass (1⚡: ball +1 zone, +2 ATK) · 2x Jockey (1⚡: +5 SHP) · 1x Standing Tackle (1⚡: STEAL 6) · 1x Long Ball (1⚡: ball +2 zones, 50% of current ATK is lost) · 1x Hold Up Play (1⚡: +4 CONTROL this turn) · 1x Drive (2⚡: shot, power 8).

Card pool V1 (24, grow later). Commons: Give-and-Go (1⚡: +1 zone, draw 1) · Overlap (1⚡: +4 ATK) · Counter Press (1⚡: STEAL 5, +2 SHP) · Clearance (0⚡: +3 SHP, lose possession if held) · Switch Play (1⚡: +3 ATK, draw 1) · Shepherd Out (1⚡: +4 SHP, +2 CONTROL) · Head It Away (1⚡: +6 SHP, playable only without possession) · One-Two (1⚡: +1 zone if you played another movement card this turn, else +1 ATK) · Row Z (0⚡: reset their banked ATK to 0, lose 2 SHP) · Simple Finish (1⚡: shot, power 6, costs 0 if ATK ≥ 8).
Uncommons: Through Ball (1⚡: +2 zones, exhaust) · Nutmeg (1⚡: +5 ATK, +2 CONTROL) · Offside Trap (1⚡: counter — if their intent is BUILD UP, steal the ball in their half) · Tiki-Taka (1⚡: +2 ATK for every card played this turn before this one) · Cynical Foul (1⚡: cancel their current intent, they gain +3 ATK permanently this match) · Overlap Run (2⚡: +8 ATK) · Park the Bus (2⚡: +12 SHP) · Driven Cross (1⚡: next shot this turn +4 power) · Volley (2⚡: shot, power 7, +4 if the ball advanced 2+ zones this turn).
Rares: Screamer (3⚡: shot, power 14, exhaust) · Total Football (2⚡: this turn, all cards cost 1 less, draw 2) · Route One (1⚡: ball goes straight to ATT THIRD, exhaust) · Prime Form (2⚡ power: at the start of each turn gain +2 ATK) · The Wall (2⚡ power: SHAPE no longer decays below 5).

Card schema in data_cards.js: id, name, cost, rarity, type (move/shot/defend/skill/power), text, effect function name, needsPossession flag. Rendering reads the table; the engine dispatches by effect name.

## Squad = relic row (persistent passives, losable)

Start with 5: 
- **Brick Walls (GK)** — your GK value is 4. First goal conceded each match is cancelled instead.
- **Marek Stone (CB, Captain)** — SHAPE decay is half as punishing (decay 1/3 instead of 1/2).
- **Yuri Engine (MID)** — first Short Pass each turn costs 0.
- **Santi Vane (ST, Clinical)** — all shot cards +2 power.
- **Dax Marrow (WING, Glass Bones)** — +3 ATK whenever the ball advances a zone. Injury rolls against him count twice.

Injuries: DIRTY TACKLE intents and certain events target a named squad player. An injury knocks the player out for the rest of the run unless healed at a market physio; a second injury to the same player is CAREER OVER — the relic is permanently destroyed, mid-run. Losing your GK player sets GK to 1. This is the Nuzlocke heart of the game — never soften it.

Recruits (new relics) come from the market and rare match rewards; define 10+ in data_squad.js with blunt names and one passive + one trait each.

## Run structure (V1: one act)

StS-style node map, 8 rows, 2–3 choices wide, all paths end at the final. Node types: MATCH (fight) · ELITE (rival club, harder pattern, relic reward) · MARKET (buy cards, remove a card for coins, physio heals one injury, one recruit on offer) · TRAINING (upgrade 1 card: upgraded = +cost efficiency or +numbers, shown with a + suffix) · EVENT (dressing-room text event from data_events.js, 2 choices, consequences can include injuries) · FINAL (boss).

V1 opponents (define as data): Rustborough Athletic (teaches BUILD UP/SHOOT) · The Hollow XI (press-heavy) · Referee's Favourites (elite; DIRTY TACKLE pattern, fouls your key players) · Mirror FC (final boss: its DEF/GK/ATK scale off YOUR deck size and relic count — hoarding is punished).

## Out of scope for V1 — refuse scope creep, suggest a TODO note instead

Multiple acts · ascension levels · daily seeds · deck archetypes beyond the base pool · formations/tactics layer · animations beyond CSS transitions · sound (stub a mute toggle) · meta-progression unlocks · multiplayer/leaderboards · WHOOP-style integrations of any kind.

## Milestones — build and verify in this order

1. Boot + design system + match screen skeleton: zones rendered, hand of placeholder cards, energy pips, clock, scoreboard, draw/discard counts. Playing Short Pass advances the ball; End Turn advances the clock. No opponent logic yet.
2. **THE GATE.** Full match vs Rustborough Athletic: intents, SHAPE, ATK, shots, goals, possession changes, full time, win/lose. Starter deck only. STOP HERE and playtest hard. If a full match isn't tense by itself with 10 cards, we tune numbers and intents until it is. No content gets built on top of a boring match.
3. Card pool (all 24) + post-match reward screen (pick 1 of 3) + deck viewer.
4. Run map + 3 regular opponents + coins + run save/load (refresh-proof).
5. Squad relics + injuries/permadeath + market (buy/remove/physio/recruit) + training node.
6. Events + elite + Mirror FC final + title/victory/run-over screens with run summary + first balance pass.

After each milestone: commit and push to `main`, then stop and tell Kylan to refresh https://kylanjack.github.io/cursed-cup/ (wait for the Actions green check) and playtest. Do not continue without playtest feedback. Milestone 2 cannot be approved by "it works" — only by "I wanted to play it again."

## Deploy

GitHub Pages serves the `main` branch root of github.com/kylanjack/cursed-cup. Push directly to `main`. Pages caches ~10 minutes; the Actions tab green check confirms deploy. Lowercase filenames always.
