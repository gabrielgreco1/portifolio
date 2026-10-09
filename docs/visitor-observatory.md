# Visitor observatory: data and interaction

The globe now supports city/country search, city details, a current-session feed and a 24-hour arrivals chart. A selected session centers its city on the globe and shows a temporary public identifier, observation start and last signal. Unknown locations remain selectable in the feed without creating a fake map marker. City details show cumulative visits, current sessions, share of all visits (including unlocated visits), and first/last monitored signals. Mouse, keyboard, zoom controls and two-finger pinch are supported.

## Real-data contract

- Existing cumulative visit counts and the production/preview Redis namespaces are preserved.
- First/last monitored timestamps and hourly arrivals begin when this instrumentation first records data. They do not reconstruct earlier visits. Hours before coverage are `null`; the first/current hour are marked partial.
- A heartbeat updates presence and last signal, but never adds another arrival. A new session after 30 minutes of inactivity adds one arrival. Redis performs these updates atomically.
- Hour counters expire after 26 hours; the chart reads 24 hourly buckets. Cumulative city counts remain available. Local storage prunes old hour buckets too.
- Public session identifiers are HMAC-derived, differ from cookie/session IDs and change for a new visit. No raw cookie ID, IP, GPS, name, account, browsing trail or referrer is returned. The feed shows at most the 100 most recently observed sessions while the counters include all current sessions.
- Presence expires after 90 seconds without a heartbeat. The snapshot excludes the exact boundary consistently in both adapters.
- Dates/times render in the visitor's browser timezone. The API supplies ISO timestamps.
- A failed refresh preserves prior data, displays OFFLINE and the last successful update time. Localhost shows a LOCAL badge and unknown location. Production without its database returns unavailable, never local or invented data.

## Google Analytics assessment — 2026-10-09

Read-only inspection of the signed-in Google Analytics UI confirmed that property **253423768** contains web stream **16056749338**, named **portifolio**, with URL **https://gabrielgreco.com** and measurement ID **G-DJ7RMKV2HR**, exactly matching `src/components/GoogleAnalytics.js`. The UI reported recent collection and displayed historical city, country and traffic-source reports. No Google account permissions or collection settings were changed.

Google history has **not** been imported. It can be used as a separate, dated historical source after exporting/querying records filtered to this stream and the exact portfolio hostname(s). Do not assume the property's entire earlier history belongs to this website. Query compatible dimensions such as date, city and country ID with sessions, retaining the requested range, retrieval date and metric definition. Keep GA session totals separate from this observatory's own 30-minute visit rule; do not add active-user counts across dates/cities or present a 30-minute GA realtime window as this site's 90-second presence window.

The core reporting schema exposes aggregated city/country/session data. It does not supply a complete historical list of identifiable visitors or exact personal coordinates for this UI. A historical city marker needs a verified city/country coordinate mapping; unresolved cities must stay unlocated. Google data should not be turned into fictional individual session IDs. Automated synchronization would require a properly authorized Data API connection; no new credentials were created during this assessment.

Sources:
- [Google Analytics Data API dimensions and metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- [Google Analytics realtime reporting](https://developers.google.com/analytics/devguides/reporting/data/v1/realtime-basics)
- [Google Analytics realtime report](https://support.google.com/analytics/answer/9271392)

## Validation

- Six storage tests, including an actual isolated Redis server, cover concurrent deduplication, signed cookies, trusted geography, TTL, first/last signals, hourly arrivals, unknown pre-activation coverage, visit renewal, raw-ID non-disclosure, a 100-signal public cap and preview/production isolation.
- Chrome and WebKit at 1280×1000, 390×844, 320×568 and 844×390: search with accent normalization, live/historical mode, individual signal selection, city details, hourly inspection, globe rotation, zoom, bounds and closing. A Chrome touch test verifies actual pinch projection changes.
- Chrome/WebKit English checks cover empty data, unavailable refresh, preserved prior counts and retry recovery.
- Native Chrome confirmed actual local sessions appear as unlocated signals. No fixture location is written to application storage.
- Lint, production build and five SEO checks passed. The production build also passed the mobile interaction suite in Chrome/WebKit; an unconfigured production visitor API correctly returned 503 unavailable.
- Populated screenshots use an intercepted GET response with TEST-prefixed locations only. They prove rendering and interaction, not production activation.

```sh
node --test tests/visitors.test.mjs
REDIS_SERVER_BIN=/path/to/redis-server node --test tests/visitors-redis.test.mjs
node scripts/capture-visitor-map.mjs
```

The browser script accepts `TEST_ORIGIN`, `TEST_BROWSER=chrome|webkit` and `TEST_WIDTH=1280|390|320|844`. Captures go to `/tmp/tamagotchi-map/`.

Still required: connect the approved free database, validate actual Vercel geography and production writes, import a verified historical Google dataset if available, and check the deployed experience before merging PR #10.
