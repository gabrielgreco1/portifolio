export function crawlerGeometry(viewWidth, viewHeight) {
  const mobile = viewWidth < 800 || (viewWidth <= 980 && viewHeight < 500);
  const compact = mobile && viewHeight < 500;
  const sidebar = viewWidth > 980 ? 264 : 0;
  const width = Math.min(900, viewWidth - sidebar - (mobile ? 32 : 180));
  const height = mobile ? viewHeight - 24 : Math.min(650, viewHeight - 110);
  const left = mobile ? 16 : sidebar + Math.max(20, (viewWidth - sidebar - width - 150) / 2);
  const top = mobile ? 12 : Math.max(55, (viewHeight - height) / 2);
  const pet = compact ? 64 : mobile ? 82 : 122;
  const pileStep = compact ? viewHeight < 350 ? 22 : 26 : 40;
  const pileTail = compact ? viewHeight < 350 ? 66 : 76 : 96;
  const dockY = Math.max(12, viewHeight - pet * 1.049 - (3 * pileStep + pileTail + 20) - 84 - 12);
  return { mobile, compact, width, height, left, top, pet, pileStep, pileTail, dockY };
}
