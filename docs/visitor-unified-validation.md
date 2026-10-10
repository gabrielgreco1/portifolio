# Unified visitor map — 2026-10-10

## Behavior and provenance

- One globe includes the checked-in historical city report plus the current visitor feed. There is no source/period mode switch.
- Green pins mean a session was seen within the server's live window; gold pins represent earlier records. The sidebar always displays live presence, recorded visits and archived users with separate, explicit labels.
- GA `activeUsers` is labeled **users in the archive / usuários no histórico**, never online presence. The archive is a reporting-period aggregate, not a live stream; its users are not added to visit counts. Selected cities also retain the engaged-session metric.
- Hover and selected details explicitly distinguish City, State/region and Country. Unknown regions remain unknown. Unconfirmed coordinates remain in the searchable records without fabricated pins.
- No changes to API handlers, visitor storage, Redis namespaces, environment variables or historical JSON. Read-only public baseline at validation: **45 visits, 24 cities**, `startedAt=2026-10-09T19:42:43.217Z`; captured at `/tmp/visitor-unified-production-baseline.json`. Archive remains **320 rows, reported total 869 users**.

## Rendering

The prior implementation rebuilt SVG geography, reconciled all city rows and formatted labels on each drag. Each visible pin had a Gaussian-blur filter and the SVG itself a large drop shadow. The new isolated canvas renderer coalesces updates through requestAnimationFrame, draws only on actual changes, and avoids per-pin filters. Search renders 60 rows at a time with explicit load-more, while every located pin remains on the globe. Land texture, borders, graticule, depth shading and orbital silhouette remain.

Pointer clicks do not paint a rectangular outline. Keyboard users get a `:focus-visible` outline, arrow-key rotation and city search/buttons as the accessible equivalent of canvas pins. Closing city detail restores focus after the mobile trigger is visible again.

## Validation

- `node --test tests/visitor-history.test.mjs tests/visitors.test.mjs tests/visitor-map-points.test.mjs`: **12 passing**. Includes immutable source counts, independent live/history metrics, no invented location, missing-region handling, and session/storage regressions.
- `node scripts/check-visitor-unified.mjs`: Chrome and WebKit at 1440×900, 1440×700, 390×844, 320×568, and 844×390, PT/EN. Search, full city detail semantics, unavailable coordinates, keyboard rotation/focus, pointer outline, focus restoration, bounds and closing passed. Chrome also checks two-finger pinch.
- `node scripts/check-visitor-google.mjs`: repeats the responsive suite with live GET forced unavailable in the browser test only. Historical locations, totals and search remain usable, with an explicit unavailable-live notice.
- Targeted ESLint passed. `npm run build` passed.
- `node scripts/benchmark-visitor-globe.mjs`: real mouse-down plus 60 frame-paced movement events, all archive markers enabled, Chrome 1440×900. Final measured median / p95 **16.7 / 16.7 ms**, mean 16.67 ms (about 60 FPS), pointer-handler mean 0.14 ms. Click-to-dialog-removal **316 ms**, including exit animation. Automation harness wall time is reported separately and is not input latency.
- A 4× CPU-throttled run measured median 16.7 ms, p95 33.4 ms, mean 22.03 ms, handler mean 0.66 ms. This is a stress check, not a guarantee of 60 FPS on every phone. A reliable before/after benchmark for the prior version was not obtained; only the new measurements are claimed.

Screenshots: `/tmp/visitor-unified/chrome-historical-tooltip.png`, `chrome-1440-900-detail.png`, `chrome-390-844.png`, `chrome-320-568.png`, `chrome-844-390.png`. Screenshots use the local visitor store plus real checked-in archive; local live counters are not production counts.

No deployment or production write was performed by this subtask.
