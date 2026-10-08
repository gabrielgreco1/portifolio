// The number of fragments controls choreography, never extraction coverage.
export function captureTiming(total, index = 0) {
  const unit = Math.max(600,Math.min(4400,22000/Math.max(1,total)));
  const beat = index === 0 && total > 12 ? Math.max(1100,unit) : unit;
  return {unit:beat,scan:beat*.13,lift:beat*.17,hold:beat*.08,encode:beat*.27,confirm:beat*.24,gap:beat*.025,frame:Math.max(34,beat*.025),move:Math.min(.7,beat*.12/1000),camera:Math.min(900,Math.max(150,beat*.18)),card:Math.min(.5,beat*.32/1000)};
}
