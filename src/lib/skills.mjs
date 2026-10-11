// Agent skills listed on the site, read from the public skills repo on GitHub.
// Fetched on the server and revalidated hourly, so a new skill folder shows up without a deploy.
export const SKILLS_REPO = "gabrielgreco1/skills";
const BRANCH = "main";
const REVALIDATE = 3600;
const API = `https://api.github.com/repos/${SKILLS_REPO}`;
const RAW = `https://raw.githubusercontent.com/${SKILLS_REPO}/${BRANCH}`;

async function get(url, as = "json") {
  const res = await fetch(url, {
    headers: as === "json" ? { Accept: "application/vnd.github+json" } : {},
    next: { revalidate: REVALIDATE },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return as === "json" ? res.json() : res.text();
}

// Minimal YAML frontmatter reader: top-level `key: value` pairs, quotes stripped.
export function parseFrontmatter(md) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
  if (!match) return {};
  const out = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (kv) out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

// The README's "| [`name`](./name) | what it does |" table holds the human-facing one-liners.
export function parseReadmeTable(md) {
  const out = {};
  for (const line of md.split(/\r?\n/)) {
    const row = /^\|\s*\[`?([^`\]]+)`?\]\([^)]*\)\s*\|\s*(.+?)\s*\|\s*$/.exec(line);
    if (row) out[row[1]] = row[2];
  }
  return out;
}

function firstSentences(text, max = 260) {
  if (!text || text.length <= max) return text || "";
  const cut = text.slice(0, max);
  const end = cut.lastIndexOf(". ");
  return end > 80 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`;
}

export async function getSkills() {
  try {
    const [tree, repo, readme] = await Promise.all([
      get(`${API}/git/trees/${BRANCH}?recursive=1`),
      get(API),
      get(`${RAW}/README.md`, "text").catch(() => ""),
    ]);
    const paths = tree.tree.map((n) => n.path);
    const folders = paths.filter((p) => /^[^/]+\/SKILL\.md$/.test(p)).map((p) => p.split("/")[0]);
    const blurbs = parseReadmeTable(readme);
    const skills = await Promise.all(
      folders.map(async (folder) => {
        const fm = parseFrontmatter(await get(`${RAW}/${folder}/SKILL.md`, "text").catch(() => ""));
        const files = paths.filter((p) => p.startsWith(`${folder}/`) && tree.tree.find((n) => n.path === p)?.type === "blob");
        return {
          name: fm.name || folder,
          folder,
          description: blurbs[folder] || firstSentences(fm.description),
          files: files.length,
          url: `https://github.com/${SKILLS_REPO}/tree/${BRANCH}/${folder}`,
        };
      }),
    );
    return {
      ok: true,
      repo: SKILLS_REPO,
      url: repo.html_url,
      stars: repo.stargazers_count,
      updatedAt: repo.pushed_at,
      skills: skills.sort((a, b) => a.name.localeCompare(b.name)),
    };
  } catch (error) {
    console.error("skills: could not read the GitHub repo", error);
    return { ok: false, repo: SKILLS_REPO, url: `https://github.com/${SKILLS_REPO}`, stars: null, updatedAt: null, skills: [] };
  }
}
