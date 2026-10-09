# Arcade audio and fullscreen

Both games share fourteen original Web Audio cues: start, jump, landing, duck, dodge, data collection, shot, armor hit, destruction, target lock, player damage, next wave, game over and mute-toggle feedback. Cues follow observed simulation transitions; they never change game physics or scores. Envelopes use a short attack and exponential decay. There are no downloaded assets or looping audio.

Audio is created only after a keyboard/pointer gesture. The visitor can mute with the toolbar or M; the preference persists locally. Pausing, changing games, losing window focus and closing silence active voices. Closing also disposes the AudioContext. Moving keyboard focus from a game to the toolbar releases held controls, avoiding stuck fire or crouching.

F or the toolbar requests native fullscreen. If unavailable or denied, the glass window fills the viewport and announces the fallback to assistive technology. Escape first restores the window; the close button always closes the arcade. Request completion is guarded against a panel that closed while fullscreen was pending. Small screens retain reachable sound/fullscreen buttons; short desktop windows reduce the scene height to keep game controls visible.

The canvas uses one uniform scale, preserving character proportions. The world stays within server replay bounds (width 280–1500; height 320–430), with centered margins for extreme aspect ratios. Touch steering subtracts margins before converting to world coordinates. Resizing pauses the game; resuming records the new simulation dimensions. A run authorized after a pending CAPTCHA starts at the current viewport dimensions.

## Evidence

- Lint and the production build passed, along with 32 media, runner, invaders and arcade/replay tests and five SEO checks.
- The production build passed fullscreen layout/exit checks in both Chrome and WebKit at 1280×754 (Portuguese), 390×844 (English) and 844×390 (Portuguese), with no page errors.
- Chrome and WebKit: both games at 1280×900, 390×844, 844×390 and 320×568. Tests instrument actual AudioContexts/oscillators, check gesture-only initialization, action-triggered sounds, silence on pause, no new voices when muted, persistent preference, context disposal and canvas bounds. Native fullscreen is exercised on desktop; unsupported-native fallback is explicitly simulated for mobile cases.
- Escape and F transitions passed. A regression test first reproduced stuck Invaders fire after focus moved to the toolbar; the fix passed in both engines.
- At 1280×754, both games show all lower controls without scrolling in Chrome and WebKit.
- Both real-time local score-publication flows passed after entering/exiting fullscreen; Invaders also rotated to 844×390. The actual server replay accepted each score, which was visible from another browser context. These tests use official dummy CAPTCHA keys and an explicitly local leaderboard, not production.
- All fourteen cues rendered through OfflineAudioContext to PCM. Individual peaks ranged from 0.029 to 0.115, below clipping; RMS ranged from 0.002 to 0.015. This is signal verification, not an assertion of listening review on every device.

```sh
node --test tests/arcade-media.test.mjs tests/arcade.test.mjs tests/runner.test.mjs tests/invaders.test.mjs
node scripts/check-arcade-media.mjs
ARCADE_SCREEN_CHECK=1 node scripts/check-arcade.mjs
node scripts/render-arcade-audio.mjs
```

Media verification defaults to http://127.0.0.1:4318 with explicit development test mode. `TEST_BROWSER=chrome|webkit` and `TEST_WIDTH=1280|390|844|320` select focused cases. Artifacts are saved under `/tmp/tamagotchi-arcade-media/`. Ranking tests refuse remote origins. Production credentials and database activation remain tracked separately in `arcade-ranking.md`.
