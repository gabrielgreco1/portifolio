# Data Invaders: endless waves (2026-10-10)

## Behavior

The arena no longer renders the decorative ANTIBOT ORBIT label or desktop instruction strip. The interactive introduction teaches movement/fire/pause before starting; touch controls remain visible during play on coarse-pointer devices.

Waves continue until defeat. Pressure, enemy health, fire frequency and bullet speed increase, with bounded bullet counts and mobile reaction time. Ranking uses the best score earned in a single wave, including a partially completed final wave. Each kill awards its base value plus a time-decaying bonus; completing a wave adds 100 points. The HUD distinguishes current-wave score from best-wave score.

Transitions show the cleared wave, points and elapsed time over the arena, followed by the next wave. The result screen contains the mascot, best wave, reached wave, personal rank, top ten and the player's row when outside the top ten. Saving is automatic after server verification.

## Compatibility and integrity

The invaders-2 engine and leaderboard remain available read-only through the previous-records control. Invaders-3 has a separate leaderboard because its scores are not comparable. Existing clients without an explicit version continue receiving v2 starts. Visitor history is untouched.

Every new run requires the existing CAPTCHA and signed owner cookie. The server independently replays inputs. New v3 runs send bounded, nonblocking checkpoints every 30 seconds or cleared wave. The server stores authoritative state, renews expiration and uses atomic sequence checks. Retried identical requests are idempotent; forged, out-of-order and cross-owner proofs are rejected. No client state snapshot is trusted.

A run has no gameplay time cap. A disconnected client pauses simulation at the 120-second unverified segment limit; it can reconnect without claiming an unverified score. Requests time out, transient errors retry with backoff and definitive validation errors offer a new run. Opaque snapshot JSON preserves floating-point values through Redis Lua.

## Verification

- 81 Node tests passed, including real Redis, atomic checkpoint concurrency, tamper/ownership/expiry, legacy compatibility and existing visitor/runner coverage.
- An isolated engine/server fixture runs beyond 600 seconds across checkpoints; this is not a claim of a human-played 630-second run.
- Chrome actual wall-clock gameplay reached wave 3, saved 1570 points and rank 1 in the local test board, with two real server-validated checkpoints. A deliberately delayed response did not stop scoring.
- Official Cloudflare dummy keys, enabled only in local development, verified start -> gameplay -> server replay -> automatic save -> score read from another visitor for both games. No test scores were sent to production.
- Chrome controls passed at 1280x900, 390x844, 320x568 and 844x390: held keyboard fire, movement, simultaneous touch, pause/resume, rotation and close.
- WebKit interactive intros passed at 1440x1000, 390x844, 320x568 and 844x390, including rehearsal, score isolation, ranking and Escape.
- Result fixture with top ten plus rank 42 fits desktop, mobile and landscape without scrolling; actual mobile persisted-score screen was visually inspected.
- ESLint and production Next build passed.

Device tests use browser emulation, not physical-phone measurements. Difficulty and visual preference still benefit from real player feedback; no universal frame-rate guarantee is asserted.
