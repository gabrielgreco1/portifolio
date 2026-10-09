# Tamagotchi security validation — 2026-10-09

This is an application review and bounded functional security test, not a certification or a guarantee of no vulnerabilities.

## Infrastructure and cost

Dedicated Upstash Redis `portifolio-tamagotchi`, Free plan, connected only to the `portifolio` project. The creation flow selected Free, not Pay As You Go; no payment method, paid add-on or automatic upgrade was enabled. Its current allowance is 500,000 commands/month. Free availability and future provider pricing are not guaranteed. Quota exhaustion can interrupt the feature; the application reports unavailable instead of inventing data.

Redis is accessed by server-side HTTPS requests with bearer authentication. Sensitive Vercel variables hold the database credentials, Turnstile secret and independent random 48-byte signing secrets. No secret is prefixed NEXT_PUBLIC, committed to Git or returned by either API. Preview and Production use separate Redis key namespaces, but share a dedicated database credential: this is logical data separation, not an independent security boundary. Compromise of that server credential can affect both namespaces. No other Supabase project was changed.

## Implemented controls

- Vercel WAF: `/api/` starts-with rule, 120 requests per IP per 60-second fixed window, HTTP 429; applies before execution/database reads. Existing DDoS mitigations stay active.
- Visitor storage: atomic all-write cap 120/IP/minute and additional new-session cap 60/IP/minute. Limits expire. Existing signed cookies cannot bypass the all-write cap. Missing trusted IP uses the shared unknown bucket.
- POST origin checks include host and protocol, and reject cross-site fetches. Redis credentials, key names and commands are never accepted from the caller. JSON arcade payloads are capped at 1 MB including streamed bodies.
- Cookies are HMAC-signed, HttpOnly, Secure on deployment, with SameSite restrictions. Invalid signatures create a new random identity. Deployed visitor signing requires its own secret of at least 32 characters and fails closed.
- Turnstile Siteverify checks success, exact hostname, action and game. Dummy keys and local storage cannot be activated on Vercel. Pre-clearance is disabled.
- Runs have a server-selected seed, signed owner-bound token and 20-minute TTL. Server replay validates score, legal controls, completion and elapsed time. Atomic publication prevents races; identical retries are idempotent. Altered reuse and another visitor's token are rejected.
- Public ranking retains 100 best entries and returns 20. Nicknames are restricted to 20 safe characters. Public fields are nickname, pseudonymous ID, score, duration and timestamp. Input recordings are not retained.
- Visits store approximate city geography, never raw IP/GPS, referrer or browsing trail. Public signals use derived IDs rather than session cookies. Session data expires in 30 minutes; presence in 90 seconds; hour buckets in 26 hours. Aggregate city counts persist.
- Timeouts bound calls to Redis and Cloudflare. Infrastructure errors return generic responses without upstream details or credentials. Plain-text edge 429 responses receive a readable retry message.
- Environment files are ignored by Git, except a deliberately named `.env.example`. Existing nosniff, frame denial, referrer and camera/microphone/geolocation restrictions remain.

## Evidence

- 66 tests passed after the runtime upgrade with the SEO suite targeting this repository's production server, not another localhost app. An additional response-handling test passes after the edge-429 UX fix.
- Actual isolated Redis: concurrency/deduplication, TTL, arrival counts, 130 same-cookie concurrent writes yielding exactly 120 successes and 10 rate rejections, retry atomicity, top-100 trimming and separate namespaces.
- Arcade negative cases: foreign/null origin, cross-site fetches, wrong protocol, unknown host, method, malformed/array JSON, incorrect content type, oversized declared and streamed body; rejected before database writes.
- Forged cookies, wrong CAPTCHA hostname/action/game, altered proof/score, premature finish, expired run, cross-player token use and modified duplicate submission are rejected.
- Native Chrome preview: real live map and Vercel geography; actual CAPTCHA success; server-authorized Runner and Invaders; a real Runner record persisted in Preview. Mobile 390×844 CAPTCHA fits and succeeds.
- Bounded production WAF test: 120 HEAD requests to a nonexistent API route, 117 HTTP 404 and 3 HTTP 429; no database writes. A follow-up 429 included `server: Vercel` and `x-vercel-mitigated: deny`.
- 16 client JS bundles scanned: no references to server credential/signing variable names. No tracked `.env` files. Lint and optimized Next.js build pass.
- Next.js and its ESLint config updated from 16.1.6 to 16.4.0; compatible dependency fixes applied. `npm audit --omit=dev`: zero known vulnerabilities at verification time.

## Residual risks and limits

The full development dependency audit still reports the unpatched `braces` deep-pattern stack-exhaustion advisory, propagated through micromatch/fast-glob to the Next ESLint plugin (five high-severity package entries for the same dependency chain). This is a development lint path, not a deployed runtime dependency. The suggested forced downgrade to Next 14's lint config was not applied. Recheck upstream patches before processing untrusted repository patterns.

Rate limits reduce abuse, but a distributed attacker can consume the free database quota. Shared-IP visitors can also encounter limits; the UI explains retries. CAPTCHA/replay cannot prove one unique human or prevent every automated legal game. Aggregate statistics are intentionally public and aren't an access-control bypass. The free provider's at-rest encryption/backup guarantees have not been independently certified here; do not store private user profiles, credentials or sensitive documents in this database.

Direct unauthenticated access to the Redis endpoint was not independently probed: Vercel requires passkey reauthentication before revealing connection details. No MFA bypass or secret rotation was attempted. The successful real application writes establish connectivity, not a standalone database penetration test. No external paid audit was performed.
