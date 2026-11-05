# Security Policy

## Supported scope

Security reports are welcome for the MITROON browser game and its optional WebSocket room service. The static game stores match records in the visitor's browser. It does not provide accounts, payments, or a server-side leaderboard.

## Reporting a vulnerability

Please do not publish exploitable details in a public issue. Contact the repository maintainers privately through GitHub's security advisory reporting feature where available. Include affected paths, reproduction steps, impact, and a suggested mitigation.

## Security expectations

- Never commit API keys, credentials, private URLs, or personal data.
- Treat room messages and all client-provided state as untrusted.
- The current WebSocket relay prototype is not authoritative and must not be used for ranked, competitive, or sensitive play.
- Validate message shape, room membership, payload size, and rate limits on any deployed relay.
- Keep dependencies updated and review changes before deployment.

## Disclosure

Please allow maintainers reasonable time to investigate and prepare a fix before public disclosure. This project is an entertainment prototype and is provided without guarantees of secure competitive multiplayer.
