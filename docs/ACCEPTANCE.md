# MITROON Browser Acceptance Checklist

This checklist is a repeatable manual QA plan. A checkbox should be marked only after a real browser test.

## Core flow

- [ ] Landing page loads without console errors.
- [ ] All sixteen fighters appear and can be selected.
- [ ] Opponent, arena, and CPU difficulty selections are respected.
- [ ] VS announcement displays the selected fighters before the match.
- [ ] Start, round win/loss, next round, rematch, and tournament progression work.
- [ ] Health and SHAKTI meters update after attacks.
- [ ] Punch, kick, grab, block, crouch, jump, special, and documented combos work.
- [ ] CPU guards and attacks at each difficulty.
- [ ] Hit feedback, particles, and arena-specific scenery render.

## Responsive and accessibility

- [ ] Desktop keyboard controls work.
- [ ] Mobile touch controls work without accidental page scrolling.
- [ ] Portrait orientation shows a useful rotate hint.
- [ ] Landscape orientation keeps HUD, arena, and controls visible.
- [ ] Fullscreen can be entered and exited.
- [ ] Focus indicators are visible when navigating controls by keyboard.
- [ ] Reduced-motion preference is respected by interface transitions.

## Persistence and deployment

- [ ] Local leaderboard survives reload and remains device-local.
- [ ] No secrets or private configuration are exposed in static files.
- [ ] GitHub Actions validation and Pages deployment pass.
- [ ] GitHub Pages live assets match the intended commit.
- [ ] Vercel production deployment reaches READY and live assets match the intended commit.

## Known exclusions

Online multiplayer infrastructure is explicitly outside the MITROON 2.0 scope. The room UI and relay prototype are not evidence of a production multiplayer service. Dedicated sprite-sheet animation, global ranking, accounts, and server-authoritative combat are also not acceptance criteria for this release.
