# Visitor observatory redesign — 2026-10-10

The previous card-based dashboard becomes an immersive observatory: large globe, warm geographic signals, editorial typography, Tamagotchi guide and a liquid-glass connection journal opened on demand. Pointer/focus labels identify cities directly on the globe. The data sources and security infrastructure are unchanged.

## Historical data preservation

Production was checked immediately before publication: 41 visits, 23 cities, 2 active sessions, history starting 2026-10-09T19:42:43.217Z. Read-only baseline saved to `/tmp/observatory-production-before.json`. No API, database, namespace, credential, history snapshot or persistence file changes are included. The post-deployment check must confirm each existing city's aggregate and the total have not decreased, and the history start is unchanged. Presence is transient and must not be compared as a cumulative count.

## Interaction and layout

- The default scene emphasizes geography; city lists and activity appear on demand.
- Journal retains city/region search, real individual signals, selected city detail, hourly activity, and source/privacy information. Provenance stays inside the scrollable journal at every viewport size.
- Live, cumulative and Google sources remain distinct; the historical snapshot is never counted as people online.
- Closing the journal restores focus to its opener. Modal Escape, keyboard rotation, zoom, drag and pinch are preserved.
- Mobile source switching remains available while exploring; landscape has a compact composition.
- The existing Tamagotchi artwork is unchanged. No runtime dependency, third-party asset or external request was added.

## Verified locally

All three browser suites passed in Chrome and WebKit at desktop, 390×844, 320×568 and 844×390 (24 combinations total):

- `TEST_ORIGIN=http://localhost:4323 node scripts/check-visitor-scene.mjs`: real historical data, keyboard rotation, search, detail, focus return, source switching, Escape and viewport bounds.
- `TEST_ORIGIN=http://localhost:4323 node scripts/check-visitor-google.mjs`: all historical rows, totals, unknown locations and independent historical browsing while the live API is unavailable.
- `TEST_ORIGIN=http://localhost:4323 node scripts/capture-visitor-map.mjs`: test-only intercepted live fixture, individual signals, hourly activity, selection, rotation, zoom, pinch and layout.
- `npm run lint` and `npm run build` passed.
- Native Chrome inspected the empty-location state against actual local data; geography remains empty when location is unavailable.

Deployment verification is pending. Local checks do not prove publication or production data retention.
