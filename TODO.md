# TODO — ideas parked for later

Kylan wants every item on this list eventually. Order: finish V1 (M3–M6) small and polished first, then pull from here.
Pillar: no two runs feel the same. Biggest variety drivers below, in rough priority: starting club pick, pre-season choice, curse cards, rival rule twists, ? nodes, kit bag, half-time talks.

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

- Rivals (V1 spec, M6): each rival gets a rule twist, not a longer match. Ideas: they act twice per turn, no golden goal (draw = loss), hostile crowd (-1 energy turn 1).

## StS-style ideas — after V1

- Curse cards (StS Wounds/curses, fits the theme): junk cards added to your deck by events or rivals, e.g. "Cramp" (unplayable), "Booed" (costs 1, does nothing). Removed at the market.
- Kit bag consumables (StS potions): hold 2, use any time, one shot. E.g. "Energy Gel" +2 energy, "Smelling Salts" +8 SHP.
- Pre-season blessing (StS Neow): one choice at run start, e.g. remove a card / random rare / +coins with a curse.
- Unknown "?" map nodes: event, match, market or treasure.
- Card library and run history screens.
- Keywords: Retain (stays in hand), Ethereal (exhausts if not played).

## Football ideas — after V1

- Half-time at turn 6: pick one team talk (heal SHP, +1 energy next turn, upgrade a card for this match).
- Yellow and red cards: cynical/foul cards give yellows; second yellow sends a squad player off for the match (relic disabled). Pairs with the injury system.
- Squad chemistry: bonus when relics of linked positions are both fit (GK + CB, MID + ST).
- One substitution per match: swap an injured player's relic for a bench player.
- Man of the match after a win: small upgrade to one relic.

## App basics — slot in where noted

- Keyword glossary: tap ATK / SHP / CTRL / GK / intent names for a one-line rule. (Visual pass. Kylan needed a match to learn the rules.)
- First-match tutorial prompts, skippable. (M6, with the title screen.)
- Version number in the corner for bug reports. (Any time, tiny.)
- Settings: mute, reduced motion, text size. (M6.)
- Colour-blind check: accent #ff6b2b and danger #e05a3a are close. Always pair with text (GOAL / SAVED), never colour alone. (Visual pass.)
- Corrupted-save recovery: if load fails, offer a fresh start instead of a blank screen. (M4, with run save.)
- Save migration instead of wiping old saves. (Before any public release.)
- Desktop: keyboard shortcuts (1–5 play card, Space end turn). (Steam phase.)
- UI strings in one table so translation is possible later. (Steam phase.)
