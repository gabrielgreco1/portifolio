# Tamagotchi implementation log

Work sequentially and inspect each feature in Chrome and mobile before continuing. Preserve `public/crawler-character-v2.png`, existing extraction coverage, stacked fragments, JSON and PDF.

## Validated locally

- Source-aware collection excursions: rail → center → left in short groups; distance-based travel; bounded cargo on mobile. Full résumé: 52 fragments / 22 records; scoped Zyte: 7 fragments / 1 record. Chrome desktop and phone, pause/resume.
- Small liquid glass menu: context actions, keyboard navigation, outside click, focus restoration, measured viewport bounds. Mobile and desktop.
- Three clicks: eight-view axial spin with anticipation, jump and landing; five clicks: overload, steam and real page text fragments. Rest uses the exact approved artwork. Reduced motion supported. Deterministic Playwright frame capture and real Chrome clicks validated.
- Drag: pointer capture, four planted feet, bounded movement, increasing resistance, smooth release. Arrow keys work when the character has focus. Drag cannot accidentally open the menu. Mouse, touch and keyboard validated.

- Data Run: parallax server district, approved character with moving legs, beveled HTTP obstacles, collectible packets, immediate keyboard and touch jump, pause, collision, retry and local best score. Chrome gameplay and deterministic desktop/mobile frame captures passed.

- Data Invaders: approved character, three enemy classes, waves, shield and three lives; held keyboard fire, arrows, two-finger touch and swipe controls. Desktop, phone and 844×390 landscape capture passed. Both games preserve a playable world when the phone rotates.

- Collection personality: real-fragment reactions (Zyte, work activities, images, quotations, Python), no extra collection delay.
- Delivery receipt: exact exported byte size, real fragment/record counts, approved character nod, optional seal revealing the SHA-256 of the JSON. JSON downloads and the identical JSON embedded in PDFs verified. PT/EN and portrait/landscape.
- WebKit: scoped extraction and downloads, overload color fallback, runner touch and pause, invaders held firing and points verified. This is browser-engine testing, not a claim of testing every physical iPhone.

## Visitor map: implementation ready, production connection pending

- Orthographic globe, pan, zoom, city selection and keyboard controls, current/history toggle, mobile glass dialog.
- Real browser sessions recorded by `/api/visitors`. No hardcoded visitor data in application code.
- Production: Upstash Redis REST, atomic history increments and expiring presence; local development: persistent `.local/visits.json`, always unknown location. Production never falls back to local storage.
- New visit after 30 minutes of inactivity; presence window 90 seconds, heartbeat every 45 seconds while visible; map refresh every 15 seconds. DNT and recognized bots are excluded.
- Only city-level location from Vercel headers is accepted. Rounded coordinates, no IP/GPS storage, no session IDs in public responses. New-session rate limiting uses a short-lived keyed hash.
- Local browser records, persistence, concurrency, cookie validation, location validation and expiration tested. Marker layout and navigation tested in an isolated Playwright fixture explicitly labelled TEST; fixtures never enter the database or site.
- **Still required:** user confirmation for Vercel marketplace / Upstash terms, choose a free plan, connect only `portifolio`, validate real deployed Redis writes and real geolocation, confirm preview/production namespace separation. Do not claim the map is live before this.
- Historical records begin at activation. Older analytics have not been imported and must not be invented.

## Remaining

- Final regression: PT/EN, complete and scoped extraction, pause/resume with menu/gestures, JSON/PDF, phone portrait/landscape, reduced motion, production build and SEO tests.
- Push, PR, attach it to the chat, merge after validation, verify gabrielgreco.com. None of this branch has been published yet.

## Checks

```sh
npm run lint
npm run build
npm run test:crawler
node --test tests/pet-motion.test.mjs tests/visitors.test.mjs
node scripts/capture-pet-motion.mjs
node scripts/capture-pet-drag.mjs
node scripts/capture-visitor-map.mjs
node scripts/capture-runner.mjs
node --test tests/runner.test.mjs tests/invaders.test.mjs
node scripts/capture-invaders.mjs
TEST_ORIGIN=http://127.0.0.1:4322 node scripts/capture-delivery.mjs
TEST_BROWSER=webkit TEST_ORIGIN=http://127.0.0.1:4322 node scripts/capture-delivery.mjs
node scripts/check-pet-webkit.mjs
SEO_TEST_ORIGIN=http://127.0.0.1:4322 npm run test:seo
```

The capture scripts render the actual local application using installed Chrome. Default origin is port 4318; screenshots go to `/tmp/tamagotchi-*`.

Implementation references: [Vercel request geolocation headers](https://vercel.com/docs/headers/request-headers), [Upstash REST commands](https://upstash.com/docs/redis/features/restapi), [D3 geographic projections](https://d3js.org/d3-geo/projection), [Natural Earth geometry via world-atlas](https://github.com/topojson/world-atlas).
