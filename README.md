# MITROON

**Apna Arena.** MITROON is an original Indian-inspired 2D arcade fighting game. Challenge the CPU locally or invite a friend into a private online room.

## Play locally

No build step is needed for the browser game.

1. Open `index.html` in a modern browser, or serve this folder with any static web server.
2. Choose **Fight the CPU**.
3. Press **Start Fight**.

### Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | A / D | ◀ / ▶ |
| Jump | W | ▲ |
| Punch | J | PUNCH |
| Kick | K | KICK |
| Special | L (requires energy) | SPECIAL |
| Block | S | BLOCK |

## Online friend rooms

The browser client is static; online rooms need the separate Node.js WebSocket service in `server/`.

```sh
cd server
npm install
npm start
```

The server listens on `PORT` (default `8080`) and exposes `/health`. Deploy it to a Node-compatible host that supports WebSockets. Use the resulting secure WebSocket URL (`wss://...`) in the game's **Play with a friend** panel. One player creates a room and shares the six-character code; the other joins with that code.

**Current multiplayer scope:** private two-player room creation/joining and real-time state relay are implemented as an early prototype. The game is not yet authoritative against cheating, and matchmaking, persistence, accounts, ranked play, voice chat and tournaments are not implemented.

## Deploy the browser game

The repository root is a static site. It can be hosted on GitHub Pages or any static host. The workflow in `.github/workflows/pages.yml` publishes the root directory to GitHub Pages when enabled in repository settings.

The WebSocket server must be deployed separately; GitHub Pages cannot run the Node.js server.

## Project structure

```
.
├── index.html
├── styles.css
├── game.js
├── server/
│   ├── package.json
│   └── server.js
└── .github/workflows/
    └── pages.yml
```

## Roadmap

- [x] Responsive arcade landing page and arena UI
- [x] Playable local CPU duel prototype
- [x] Keyboard and touch controls
- [x] Private room creation/joining and WebSocket state relay
- [ ] Character select, additional fighters and stages
- [ ] Improved combat animation, audio and accessibility
- [ ] Server-authoritative combat, reconnection and abuse protection
- [ ] Automated gameplay tests and production monitoring

## License

MIT. See [LICENSE](LICENSE).
