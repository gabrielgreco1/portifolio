const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Stay with a small group of fragments before choosing another working position.
// The route describes an excursion and return, never an alternating left/right hop.
export function collectionLane(index) {
  return ['rail', 'center', 'left', 'left', 'center', 'rail'][Math.floor(index / 3) % 6];
}

export function collectionStation(rect, index, viewport) {
  const { width, height, pet, mobile, compact, dockY } = viewport;
  const sidebar = width > 980 ? 264 : 0;
  const minX = sidebar + 12, maxX = width - pet - 20;
  const lane = collectionLane(index);
  if (mobile) {
    // The phone still has room for a visible excursion; cargo is independently
    // constrained to the viewport so it never clips when the pet crosses left.
    const fraction = lane === 'rail' ? .88 : lane === 'center' ? .52 : .18;
    return { x: clamp((width - pet) * fraction, 12, maxX), y: dockY, lane: compact ? 'compact' : lane };
  }
  const center = rect.left + Math.min(rect.width, width - sidebar - 70) * .52 - pet * .5;
  const left = rect.left - pet * .84;
  const field = lane !== 'rail';
  return {
    x: clamp(field ? lane === 'left' ? left : center : maxX - 22, minX, maxX),
    y: clamp(field ? rect.top - pet * 1.049 - 136 : rect.top + Math.min(rect.height, 240) * .5 - pet * .4, 86, Math.max(86, height - pet - 287)),
    lane,
  };
}

export function travelDuration(from, to, minimum = .12) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  return Math.max(minimum, Math.min(.8, distance / 780));
}
