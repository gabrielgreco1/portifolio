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

The complete filtered Google history is now imported as a **separate dated source**, selected through “Google Analytics” in the map. The report was restricted to the exact portfolio hostname regex and stream ID, for 2020-01-01 through 2026-10-08. Its reported total is 869 active users across 23 identified countries, with 311 named city/country records plus nine unlocated-city records. All 320 rows remain searchable. City details preserve active users and engaged sessions. They never claim present activity, individual identities or first/last visit timestamps.

The original table was read through the signed-in report UI in two pages after the CSV event failed to yield a file. Row sequence, full-capture checksum and source SHA-256 establish the copied dataset's integrity. Report totals (869 users / 278 engaged sessions) are independent of row sums (876 / 282). The date range does not establish collection since 2020. See [source provenance](../data/analytics/README.md) and `scripts/import-visitor-google.py`.

A bulk public GeoNames gazetteer supplies approximate city centers without sending visitor records to a geocoding service. Current-name matches are preferred, country is mandatory, and ambiguous matches do not choose the largest city. Coordinates are rounded to 0.1°. The snapshot has 263 matched records, 44 ambiguous, four unmatched and nine unknown. Unresolved records remain selectable without a marker. Region/city identifiers from a richer report can improve coverage. GeoNames is attributed as CC BY 4.0.

Historical data works independently of live database availability and never gets added to the site's own visit totals. Switching sources clears incompatible selections and search state. Google history has a fixed retrieval date and no automatic sync; an authorized Data API integration would be needed for that. No new Google credentials were created.

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

Google-history validation: two source-integrity/provenance tests and Chrome/WebKit at 1280×1000, 390×844, 320×568 and English 844×390 passed. Checks cover all 320 real rows, report totals, selected city coordinates/details, ambiguous and unknown cities, offline independence, source switching and bounds. Native Chrome also displayed the real historical snapshot. The existing live-map suite passed at the same eight browser/size combinations.

Still required: connect the approved free database, validate actual Vercel geography and production writes, improve ambiguous-city coverage where the source permits, and check the deployed experience before merging PR #10.
