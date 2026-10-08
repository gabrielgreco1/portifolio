export function cancelled() { return new DOMException("Cancelled", "AbortError"); }

export function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(cancelled()); return; }
    const abort = () => { clearTimeout(timer); reject(cancelled()); };
    const timer = setTimeout(() => { signal?.removeEventListener("abort", abort); resolve(); }, ms);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

export async function animateElement(element, frames, options, signal) {
  if (!element || signal?.aborted) throw cancelled();
  const animation = element.animate(frames, { fill: "forwards", ...options });
  const abort = () => animation.cancel();
  signal?.addEventListener("abort", abort, { once: true });
  try { await animation.finished; if (signal?.aborted) throw cancelled(); animation.commitStyles(); }
  finally { signal?.removeEventListener("abort", abort); animation.cancel(); }
}

export function cameraTo(top, duration, signal) {
  const start = window.scrollY;
  const destination = Math.max(0, Math.min(top, document.documentElement.scrollHeight - window.innerHeight));
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(cancelled()); return; }
    let frame, started;
    const abort = () => { cancelAnimationFrame(frame); reject(cancelled()); };
    signal?.addEventListener("abort", abort, { once: true });
    function step(now) {
      started ??= now;
      const progress = duration ? Math.min(1, (now - started) / duration) : 1;
      const easing = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      window.scrollTo({ top: start + (destination - start) * easing, behavior: "instant" });
      if (progress < 1) frame = requestAnimationFrame(step);
      else { signal?.removeEventListener("abort", abort); resolve(); }
    }
    frame = requestAnimationFrame(step);
  });
}

// A visual copy is inert. It never takes the original node out of the document.
export function visualCopy(element) {
  const clone = element.cloneNode(true);
  const originals = [element, ...element.querySelectorAll("*")];
  const copies = [clone, ...clone.querySelectorAll("*")];
  const properties = ["display", "color", "background-color", "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "text-transform", "text-decoration", "text-align", "border-radius", "border-width", "border-style", "border-color", "padding", "margin", "gap", "align-items", "justify-content", "object-fit", "flex-direction", "grid-template-columns", "white-space"];
  copies.forEach((node, index) => {
    for (const attr of [...node.attributes]) if (attr.name === "id" || attr.name === "href" || attr.name.startsWith("on") || attr.name.startsWith("data-crawl")) node.removeAttribute(attr.name);
    const style = getComputedStyle(originals[index]);
    properties.forEach((property) => node.style.setProperty(property, style.getPropertyValue(property)));
    node.tabIndex = -1;
    if (node.tagName === "IMG") { node.style.width = `${originals[index].getBoundingClientRect().width}px`; node.style.height = `${originals[index].getBoundingClientRect().height}px`; }
  });
  clone.querySelectorAll("script, iframe, object, embed").forEach((node) => node.remove());
  clone.style.margin = "0";
  clone.style.width = "100%";
  clone.setAttribute("aria-hidden", "true");
  return clone.outerHTML;
}
