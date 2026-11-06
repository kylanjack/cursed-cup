# CURSED CUP — How to work on this

No PC setup. Everything happens on GitHub and in Claude Code on the web.

## One-time

1. Repo **Settings** → **Pages** → **Deploy from a branch** → `main` / `(root)` → **Save**.
2. Live game: https://kylanjack.github.io/cursed-cup/ (first deploy takes a few minutes).
3. On your iPhone: open that URL in Safari → **Share** → **Add to Home Screen**.

## The loop

1. Open https://claude.ai/code and select the `kylanjack/cursed-cup` repo.
2. Tell it what's wrong or what milestone to build. It reads `CLAUDE.md` automatically.
3. It commits and pushes to `main` (CLAUDE.md tells it to).
4. Wait for the green check on the repo's **Actions** tab (~1–2 min; Pages can cache up to ~10 min).
5. Refresh the game on your phone and playtest.

## Prompts

**Milestone 1 feedback** (after playtesting the match screen):
> Milestone 1 playtest notes: [what felt wrong]. Fix these, push to main, stop.

**Start Milestone 2** (only when M1 feels right):
> Build Milestone 2 per CLAUDE.md, including the "Rule decisions" section. Remove the M1 shot stub. Push to main and stop for playtest.

## Rules of engagement

- Milestone 2 is THE GATE. One standard: did you immediately want a second match? "It works" doesn't pass.
- One milestone at a time. Formations, second acts, ascension — V2. New ideas go in `TODO.md`.
- Balance changes are data edits (`js/data_cards.js`, `js/data_opponents.js`), never engine rewrites. If Claude Code starts restructuring the engine to fix a number, point it at CLAUDE.md.
- No pivots. The genre and loop are decided.
