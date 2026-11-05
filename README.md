# MITROON

**Apna Arena.** MITROON is an Indian political-satire 2D arcade fighting game. Choose a caricature of a recognisable public political figure, challenge the CPU locally, or invite a friend into a private online room.

## Live demos

- **GitHub Pages:** https://tejas-mk2.github.io/MITROON/
- **Vercel:** https://mitroon-pijush1.vercel.app
- **Source repository:** https://github.com/TEJAS-MK2/MITROON

## Political parody roster

The current sixteen-fighter roster includes public figures associated with different Indian political parties:

| Fighter | Party association | Visual caricature cues |
|---|---|---|
| Narendra Modi | BJP | White beard and distinctive kurta/turban styling |
| Amit Shah | BJP | Bald head, glasses and moustache |
| Yogi Adityanath | BJP | Shaved head and saffron attire |
| Rahul Gandhi | Indian National Congress | White T-shirt and beard |
| Mamata Banerjee | All India Trinamool Congress | White sari with a contrasting border |
| Arvind Kejriwal | Aam Aadmi Party | Glasses and muffler |
| Akhilesh Yadav | Samajwadi Party | Red cap |
| M. K. Stalin | Dravida Munnetra Kazhagam | Dark glasses and dark hair |
| Priyanka Gandhi | Indian National Congress | Green-accented campaign shawl |
| Mallikarjun Kharge | Indian National Congress | Silver hair and veteran statesperson styling |
| Pinarayi Vijayan | CPI(M) | Glasses and red-accented attire |
| Uddhav Thackeray | Shiv Sena (UBT) | Dark glasses and understated styling |
| Devendra Fadnavis | BJP | Glasses and green-accented attire |
| Nitish Kumar | Janata Dal (United) | White kurta styling |
| N. Chandrababu Naidu | Telugu Desam Party | Silver hair and gold-accented attire |
| Hemant Soren | Jharkhand Mukti Morcha | Green regional scarf styling |

Party labels are descriptive associations, not endorsements. Fighter power, speed, animations, attacks and match outcomes are fictional game mechanics; they do not represent real-world ability, character or political performance. MITROON is parody and is not affiliated with any politician or party. The artwork is original stylised game art, not official portraits or photographs.

## Play locally

No build step is needed for the browser game.

1. Open `index.html` in a modern browser, or serve this folder with any static web server.
2. Choose **Fight the CPU**.
3. Select your fighter, opponent, arena and CPU difficulty.
4. Press **Fight** and then **Start Fight**.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | A / D | ◀ / ▶ |
| Jump | W | ▲ |
| Punch | J | PUNCH |
| Kick | K | KICK |
| Special | L (requires energy) | SPECIAL |
| Block | S | BLOCK |

## Match rules, tournament and leaderboard\n\nMatches use a best-of-three round system: the first fighter to win two rounds takes the match. Tournament Run pits your selected fighter against every other roster member in sequence. Match wins, losses and cup victories are stored locally in your browser using `localStorage`; clearing browser site data removes those records. The leaderboard is device-local and is not a global or server-synchronised ranking.\n\n## Arenas and difficulty

Choose Sansad at Sunset, Jantar Mantar or Desi Gully. CPU difficulty can be set to Easy, Normal or Hard.

## Online friend rooms

The browser client is static; online rooms need the separate Node.js WebSocket service in `server/`.

```sh
cd server
npm install
npm start
```

The server listens on `PORT` (default `8080`) and exposes `/health`. The included `render.yaml` is a Render Blueprint: create a new Blueprint from this repository and deploy the `mitroon-realtime` service. Copy its HTTPS host, change the scheme to `wss://`, and paste that URL into the game's **Play with a friend** panel. Any Node-compatible host with WebSocket support also works. One player creates a room and shares the six-character code; the other joins with that code.

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
- [x] Sixteen public-figure parody fighters from multiple parties\n- [x] Distinctive illustrated costumes, facial details, signature moves and victory poses
- [x] Character attributes, opponent selection, three stage themes and CPU difficulty
- [x] Keyboard and touch controls
- [x] Private room creation/joining and WebSocket state relay
- [x] Expanded the parody roster to sixteen fighters across multiple parties
- [ ] More stages and signature animations
- [x] Best-of-three match scoring and round progression\n- [x] Single-player tournament run and local persistent leaderboard\n- [ ] Improved combat animation, audio and accessibility
- [ ] Server-authoritative combat, reconnection and abuse protection
- [ ] Automated gameplay tests and production monitoring

## License

MIT. See [LICENSE](LICENSE).
