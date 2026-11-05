# Contributing to MITROON

Thanks for helping improve MITROON.

## Before starting

1. Read the README and SECURITY policy.
2. Search existing issues to avoid duplicate work.
3. Keep changes focused and preserve existing gameplay.
4. Do not add real-world political claims as game facts. Fighter stats, moves, and outcomes are fictional parody mechanics.

## Development

MITROON is a static browser game. Open `index.html` through a local static server or browser. The optional relay lives in `server/`.

Before submitting changes:

- Run `node --check game.js`.
- Test the full match flow: select fighter, choose opponent and stage, start, finish a round, rematch.
- Test keyboard and touch controls.
- Check mobile portrait and landscape layouts.
- Confirm the leaderboard remains local and that no secrets were added.

## Pull requests

Describe the player-facing change, list files touched, include test results, and add screenshots or a short recording for visual changes. Do not claim device testing that was not performed.
