// Keep the existing sprite viewport, floor and screen anchors for the collection choreography.
export default function CrawlerArtwork({ className = "" }) {
  return (
    <svg className={`crawler-art ${className}`} viewBox="0 0 244 256" width="244" height="256" aria-hidden="true" focusable="false">
      <image href="/crawler-character-v2.png" x="10" y="16" width="224" height="224" />
    </svg>
  );
}
