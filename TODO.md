# TODO — ideas parked for later

Not in V1. Don't build anything here until V1 ships.

- PWA manifest + icon so the home-screen version opens full screen
- Daily seed runs (seeded RNG already supports it)
- Long Ball in the ATT THIRD only loses ATK — consider blocking it there if it causes misplays

## Visual pass — after M2 approval, before or alongside M3 (cosmetic only)

- Pitch with real markings (halfway line, centre circle, boxes) instead of three grey boxes. Keep the warm dark palette, no green.
- Cards that look like collectible football cards: portrait frame, big cost/rating corner, rarity trim. Own design, not a copy of any existing game's card layout.
- Stadium-board style scoreboard.
- Card-play feedback with CSS only: card flies/fades on play, ball slides between zones, goal flash on the scoreboard, shake on goal against.
- Sound (V2): kick, crowd, whistle, goal. Needs original or licensed audio. V1 keeps only a mute toggle stub.

## Gameplay ideas — decide after M3 playtest

- Status effects with stacks, StS-style. M3 already brings powers (Prime Form, The Wall) with a visible status row. Open question: debuffs on the opponent (e.g. "Rattled": -DEF for N turns) and on you (e.g. "Tired": -1 energy). New mechanic, so only after M3 is tested.

## Long-term goal: Steam release (post-V1)

- Meta-progression: unlocks between runs (new cards, recruits, starting squads). Needs run-history tracking first.
- Achievements: track run stats (wins, goals, clean sheets, career-overs) in a stats object now-ish; map to Steam achievements later via Steamworks.
- Accounts/login: NOT needed on Steam (Steam is the account). Only needed for a web version with cloud saves or leaderboards → Supabase auth.
- Desktop packaging: wrap the web build (Electron/NW.js/Tauri) for Steam. Needs a desktop/landscape layout, mouse + keyboard, Steam Deck check.
- Original art and audio for every asset. No AI-ambiguous or unlicensed assets in a paid release.
- Store page needs: capsule art, trailer, screenshots, Steam Direct fee.

## Content ideas — V2+ (after V1 ships)

- Intro: short opening sequence (the hat-trick, the sky tearing open). Fits with the M6 title screen; keep it skippable.
- Pick your starting club = StS characters. Each club: own starter deck, own card pool slice, own unique passive. Biggest content cost on this list; do one extra club first and test it.
- Clubs: parody/archetype clubs only. No real names, crests, kits or near-copies (trademark risk on a paid Steam release). Recognisable by style, not by name.
- Competitions as run types / acts, all with fictional names: domestic cup, continental cups (three tiers), international tournaments. Knockout formats fit the run structure. Leagues (38 matches) don't fit a roguelike run as-is; needs its own design if wanted.

## Harder opponents

- Already in V1 spec: ELITE nodes (rival clubs, harder scripts, relic reward) and the FINAL boss (Mirror FC). Consider renaming ELITE to RIVAL in the UI.
- Rival matches as a longer game: rejected for now. 12 turns is tuned; more turns dilutes tension. Make rivals harder through a rule twist per rival instead (e.g. extra intent per turn, no golden goal, hostile crowd: -1 energy turn 1).
