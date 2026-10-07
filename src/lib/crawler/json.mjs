// Preserve JSON.stringify formatting while linking field lines to their sources.
export function jsonLines(value, origins = {}) {
  const lines = [];
  function findOrigin(pointer) {
    for (let path = pointer; path; path = path.slice(0, path.lastIndexOf("/"))) if (origins[path]) return origins[path].evidence_ids;
    return [];
  }
  function emit(object, pointer, depth, prefix = "", comma = "") {
    const indent = "  ".repeat(depth);
    const entries = object && typeof object === "object" ? Object.entries(object) : null;
    const array = Array.isArray(object);
    if (!entries?.length) { lines.push({ text: `${indent}${prefix}${JSON.stringify(object)}${comma}`, evidence_ids: findOrigin(pointer) }); return; }
    lines.push({ text: `${indent}${prefix}${array ? "[" : "{"}`, evidence_ids: findOrigin(pointer) });
    entries.forEach(([key, child], index) => emit(child, `${pointer}/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`, depth + 1, array ? "" : `${JSON.stringify(key)}: `, index < entries.length - 1 ? "," : ""));
    lines.push({ text: `${indent}${array ? "]" : "}"}${comma}`, evidence_ids: findOrigin(pointer) });
  }
  emit(value, "", 0); return lines;
}
