# Data Invaders: antibot progression

The visitor pilots the approved Tamagotchi through increasingly aggressive layers of anti-bot defenses. Enemy geometry is original Canvas artwork, drawn at gameplay scale and checked at desktop, portrait, compact and landscape sizes. The character itself is unchanged.

| Enemy | Introduction | Behavior | Readable signal |
| --- | --- | --- | --- |
| WAF | Wave 1 | Two hits; straight shot | Shield loses its bright armor after the first hit |
| Fingerprint | Wave 1 | Locks onto a position, then fires toward it | Purple charging ring, dotted line and target reticle; dodging does not move the lock |
| Rate limit | Wave 2 | Three diverging shots | Three barrels, 429 label and amber charging cone |
| Honeypot | Wave 3 | One trap splits into two shards | Amber vial and diamond projectile |
| 403 Gatekeeper | Every fourth wave | Armored core alternates targeted fire and a five-shot fan | Rotating iris, charging ring and visible health bar |

Movement accelerates as enemies are removed and as the wave continues. Overall elapsed time and wave number increase firing cadence and projectile speed, with caps. A short phone screen limits simultaneous threats to ten; larger fields allow sixteen. Every attack has a charge, and projectile speed is reduced near the player to retain at least half a second before the projectile reaches the hitbox. Destroying a charging enemy cancels its attack. Clearing a wave removes remaining hostile shots and provides a 1.5-second transition.

Rotating the phone pauses the game and rescales positions, locked targets and trap split positions. The same resize operation is replayed by the score verifier. New scoring/game rules use `invaders-2`, with a separate local best and public leaderboard version.

## Validation

- Ten engine tests: movement/fire, armor and score, damage grace, wave reset and pause, enemy introduction, charge/target lock, spreads/splits/boss alternation, attack cancellation, low-formation reaction time and bounded progression.
- Ten arcade tests, including complete multi-wave boss replay and resizing while a fingerprint is charging.
- Chrome play-throughs reached the actual fifth wave at 390×844 and 1280×900. The deterministic local test pilot uses ordinary pointer/fire inputs and a mirrored engine for decisions. It never changes game state or publishes accelerated scores.
- Chrome keyboard and simultaneous touch passed at 1280×900, 390×844, 844×390 and 320×568. Rotation pauses and resumes without losing the run. WebKit touch, firing, pause and close passed.
- Frame captures of the initial formation, third wave, boss charge and transition were inspected. The approved character remains intact; no placeholder enemy images are used.

Useful checks:

```sh
node --test tests/invaders.test.mjs tests/arcade.test.mjs
node scripts/capture-invaders.mjs
node scripts/capture-invaders-progression.mjs
node scripts/check-pet-webkit.mjs
node scripts/check-arcade.mjs
```

The browser scripts require the explicit local arcade test mode described in [arcade-ranking.md](arcade-ranking.md). Live CAPTCHA/ranking activation, visitor-map refinement, game sound and fullscreen remain separate pending work.
