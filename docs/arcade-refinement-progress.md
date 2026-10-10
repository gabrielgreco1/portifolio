# Arcade refinement — 2026-10-10

## Accepted direction

- Existing approved mascot stays unchanged.
- No decorative eyebrow over a giant title, no serif game headings, no broad background glow.
- Name is requested **before** the run; entering clearly states the best score is published automatically.
- Death replaces the arena with one complete result screen: score, rank, top ten, own row below if outside ten, and retry. No scrolling required at tested sizes.
- Server replays every run before saving. No client-generated rankings or silent success when saving fails.
- Existing map history and backend configuration must remain untouched by arcade changes.
- Parallel isolated worktrees: globe UI/performance and mascot-led interactive game intros. Root reviews/integrates each after validation.

## Implemented / validated so far

- Runner sprite articulation precomputed from the approved PNG into 33 canvas frames. Local Chrome readback benchmark: jump draw median ~6.9 ms before / ~0.7 ms after; this measures drawing, not a guarantee for all device FPS.
- Pace negotiated at start and persisted on the signed server run. New clients accelerate at +6 units/s; older already-open clients retain +2.1. Same reaction-time cap and score formula; old signed runs remain replayable.
- Visible packet counter, +50 feedback, speed multiplier, score breakdown.
- Before-run nickname saved locally for convenience and bound to server run. Automatic finish returns persisted top ten/personal record; lower runs keep the previous best.
- Record retention no longer trims players below 100. Existing names/board keys unchanged. Already discarded historical rows cannot be reconstructed.
- Restart resize no longer accidentally pauses a newly started run.
- Real local Redis: atomic/idempotent finish, tie order, rank beyond 100, namespace separation.
- Chrome: three consecutive real test-CAPTCHA games for one visitor persisted automatically, kept one personal identity, retained best, and passed held-key/restart checks.
- Chrome result layout verified at 1440×1000, 390×844, 320×568, 844×390: top ten + own row + retry visible without scrolling. Local fixtures explicitly named TEST ONLY, never production.

## Release verification

- Interactive intros integrated and tested in Chrome + WebKit at four sizes, including rehearsal, score isolation, ranking and Escape. Gameplay jump/duck/pause/retry/rotation checks passed at four sizes.
- Both games passed official local test CAPTCHA → real game → server replay → automatic persisted personal record. Three consecutive Runner matches retained a single player and their best. Zero-point completed matches are also valid; lower scores update the chosen nickname without replacing best points.
- Lint, production build and all 70 unit/integration/security checks passed after game integration. Inspect live deploy only after successful release checks.
- Globe delegated: remove pointer-only cut focus outline while retaining keyboard focus; readable metrics; unify historical/live/GA surface without mixing unlike metrics; no historical record labeled active; clear city/region/country; diagnose severe GA drag/close lag; preserve all real visit history.
