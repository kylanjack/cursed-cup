# TODO — ideas parked for later

Not in V1. Don't build anything here until V1 ships.

- PWA manifest + icon so the home-screen version opens full screen
- Daily seed runs (seeded RNG already supports it)
- Long Ball in the ATT THIRD only loses ATK — consider blocking it there if it causes misplays

## Visual pass — after M2 approval, before or alongside M3 (cosmetic only)

- Pitch with real markings (halfway line, centre circle, boxes) instead of three grey boxes. Keep the warm dark palette, no green.
- Cards that look like collectible football cards: portrait frame, big cost/rating corner, rarity trim. Own design, not a copy of any existing game's card layout.
- Stadium-board style scoreboard.

## Gameplay ideas — decide after M3 playtest

- Status effects with stacks, StS-style. M3 already brings powers (Prime Form, The Wall) with a visible status row. Open question: debuffs on the opponent (e.g. "Rattled": -DEF for N turns) and on you (e.g. "Tired": -1 energy). New mechanic, so only after M3 is tested.

## Long-term goal: Steam release (post-V1)

- Meta-progression: unlocks between runs (new cards, recruits, starting squads). Needs run-history tracking first.
- Achievements: track run stats (wins, goals, clean sheets, career-overs) in a stats object now-ish; map to Steam achievements later via Steamworks.
- Accounts/login: NOT needed on Steam (Steam is the account). Only needed for a web version with cloud saves or leaderboards → Supabase auth.
- Desktop packaging: wrap the web build (Electron/NW.js/Tauri) for Steam. Needs a desktop/landscape layout, mouse + keyboard, Steam Deck check.
- Original art and audio for every asset. No AI-ambiguous or unlicensed assets in a paid release.
- Store page needs: capsule art, trailer, screenshots, Steam Direct fee.
