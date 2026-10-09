// Keep the existing sprite viewport, floor and screen anchors for the collection choreography.
export default function CrawlerArtwork({ className = "", mood = 0 }) {
  return (
    <svg className={`crawler-art ${className}`} viewBox="0 0 244 256" width="244" height="256" aria-hidden="true" focusable="false">
      <image href="/crawler-character-v2.png" x="10" y="16" width="224" height="224" style={mood > 1 ? {filter:`sepia(.45) saturate(${mood === 3 ? 2.3 : 1.6}) hue-rotate(-28deg)`} : undefined}/>
      {mood > 0 && <g fill="none" stroke={mood > 1 ? "#f2a17a" : "#f5e8be"} strokeWidth={mood > 1 ? 4 : 3} strokeLinecap="square">
        <path d={mood > 1 ? "M90 108 L98 113 M121 113 L129 107" : "M91 110 L97 112 M122 112 L128 110"}/>
        {mood > 1 && <path d="M105 128 L113 128" strokeWidth="2"/>}
      </g>}
    </svg>
  );
}
