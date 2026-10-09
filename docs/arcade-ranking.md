# Arcade verification and public scores

Both games request a Cloudflare Turnstile verification before starting. The server validates the token through Siteverify, including hostname, action (`arcade_start`) and game (`cdata`). A successful verification creates a signed, expiring run with a server-selected seed. Public score submission is optional and explicit.

## Score verification

The browser records changes to its controls at a fixed 60 Hz. The server replays the same deterministic engine, checks the final score and terminal state, rejects runs submitted faster than their duration, and binds each run to an HttpOnly signed anonymous cookie. The replay accepts legal viewport changes so phone rotation does not invalidate a run. Runs last at most ten minutes and expire twenty minutes after authorization, including pauses.

Redis atomically retains each browser identity's best score per game version, keeps the best 100 entries and returns the first 20 publicly. Identical finish retries are idempotent; changed reuse is rejected. Only a public identifier, nickname, score, duration and timestamp are published. The raw input recording is verified but not retained. Clearing cookies creates a new identity; this is not an account-based unique-person ranking. CAPTCHA and replay validation reduce abuse but do not guarantee that automated players are impossible.

## Production setup

Required server environment variables:

| Variable | Purpose |
| --- | --- |
| `TURNSTILE_SITEKEY` | Public widget key, returned by the configuration endpoint |
| `TURNSTILE_SECRET_KEY` | Secret for server-side Siteverify; never sent to the browser |
| `ARCADE_SIGNING_SECRET` | Random secret of at least 32 characters for cookies/run signatures |
| `UPSTASH_REDIS_REST_URL` | Shared database URL (`KV_REST_API_URL` also accepted) |
| `UPSTASH_REDIS_REST_TOKEN` | Database credential (`KV_REST_API_TOKEN` also accepted) |
| `ARCADE_ALLOWED_HOSTNAMES` | Exact comma-separated hostnames; defaults to `gabrielgreco.com,www.gabrielgreco.com` |

Production and preview use separate Redis prefixes. If verifying a Vercel preview, add its exact hostname to both the widget's allowed hostnames and the preview environment's allowlist. Do not allow all `vercel.app` domains. A missing configuration returns an honest unavailable state; production never substitutes local storage or test CAPTCHA keys.

On 2026-10-09 the real managed widget **gabrielgreco.com — Tamagotchi Arcade** was created in the user's Cloudflare account for `gabrielgreco.com`, with pre-clearance disabled. Secret transfer to Vercel is awaiting confirmation. The shared production database is not connected yet, so neither public ranking nor the live verification flow is claimed active. Existing Upstash marketplace terms approval remains pending. A subsequent read-only check of the Vercel project on 2026-10-09 still showed “No Environment Variables Added” and no database connection. Neither missing prerequisite can be inferred complete from the open setup form.

## Local verification

Only an explicit development server accepts Cloudflare's official test keys:

```sh
ARCADE_TEST_MODE=1 npm run dev -- -p 4318
node --test tests/arcade.test.mjs
REDIS_SERVER_BIN=/path/to/redis-server node --test tests/arcade-redis.test.mjs
node scripts/check-arcade.mjs
node scripts/check-arcade-layout.mjs
TEST_ORIGIN=http://127.0.0.1:4318 node scripts/check-pet-webkit.mjs
```

The mode requires `NODE_ENV=development` and no `VERCEL` flag. It displays a visible test badge and persists only to ignored `.local/arcade.json`. The end-to-end test uses the official dummy widget and actual Siteverify request, plays in real elapsed time, publishes explicitly labelled local test scores, and verifies visibility from a separate browser context. It refuses to publish to a remote origin. This is not evidence of production activation.

Real isolated Redis tests cover concurrent publication, retries, personal best preservation, top-100 trimming, top-20 output, game/environment isolation, expiry and rate limits. Application tests cover replay tampering, signed identity, origin checks, dimensions, resize parity and the prohibition of test keys in production.

Validated on 2026-10-09: both complete real-time local publication flows; 9 arcade/Redis tests; 30 collection, motion and game regression tests; lint and production build. Chrome and WebKit panel checks passed at 320×568 and 844×390 in Portuguese and 390×844 in English, including cancellation/reopening, fresh CAPTCHA tokens, contained Tab navigation and Escape closing only the inner panel. The widget switches between Cloudflare's compact and flexible layouts according to available width. WebKit touch/pause/firing and Chrome desktop/phone/landscape gameplay passed. Production without credentials returns 503 `not_configured` rather than a fake ranking.
