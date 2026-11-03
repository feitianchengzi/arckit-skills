import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DOMAIN_ORDER = [
  "entry",
  "idea",
  "thinking",
  "iteration",
  "definition",
  "memory",
  "media",
  "engineering",
  "code",
  "quality",
  "delivery",
];

export function defaultSource() {
  return resolve(fileURLToPath(new URL("../vendor/arckit-skills", import.meta.url)));
}

function parseFrontmatter(raw) {
  const text = raw.replace(/^\uFEFF/, "");
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = text.slice(3, end);
  const values = {};
  for (const line of block.split(/\r\n|\n|\r/)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

function scan(source) {
  const skills = [];
  const shared = [];
  const domains = readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .filter((domain) => existsSync(join(source, domain, "skills")))
    .sort((a, b) => {
      const ai = DOMAIN_ORDER.indexOf(a);
      const bi = DOMAIN_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

  for (const domain of domains) {
    for (const name of readdirSync(join(source, domain, "skills")).sort()) {
      const dir = join(source, domain, "skills", name);
      if (!statSync(dir).isDirectory()) continue;
      const skillFile = join(dir, "SKILL.md");
      if (!existsSync(skillFile)) {
        shared.push({ name, domain, path: `${domain}/skills/${name}` });
        continue;
      }
      const frontmatter = parseFrontmatter(readFileSync(skillFile, "utf8"));
      skills.push({
        name: frontmatter.name ?? name,
        domain,
        path: `${domain}/skills/${name}`,
        description: frontmatter.description ?? "",
      });
    }
  }
  return { skills, shared };
}

export function loadCatalog({ source = defaultSource() } = {}) {
  const root = resolve(source);
  if (!existsSync(root)) {
    throw new Error(
      `Skill source not found: ${root}\n` +
        "The vendor subtree is missing. Run `git subtree pull --prefix vendor/arckit-skills <arckit-repo> skills-dist --squash`.",
    );
  }

  const indexPath = join(root, "skills.index.json");
  const hasIndex = existsSync(indexPath);
  const index = hasIndex ? JSON.parse(readFileSync(indexPath, "utf8")) : null;
  const scanned = index ? null : scan(root);

  const skills = (index?.skills ?? scanned.skills).map((skill) => ({
    name: skill.name,
    domain: skill.domain,
    path: skill.path,
    description: skill.description ?? "",
  }));
  const shared = (index?.shared ?? scanned.shared).map((entry) => ({
    name: entry.name,
    domain: entry.domain,
    path: entry.path,
  }));

  for (const skill of skills) {
    if (!existsSync(join(root, skill.path, "SKILL.md"))) {
      throw new Error(`Catalog entry is missing SKILL.md: ${skill.path} (source: ${root})`);
    }
  }

  return {
    root,
    indexPath: hasIndex ? indexPath : null,
    sourceCommit: index?.source?.commit ?? null,
    skills,
    shared,
  };
}

export function selectSkills(catalog, { names = [], domains = [], all = false } = {}) {
  let selected = catalog.skills;
  if (domains.length > 0) {
    const wanted = new Set(domains);
    const unknown = domains.filter((domain) => !catalog.skills.some((skill) => skill.domain === domain));
    if (unknown.length > 0) throw new Error(`Unknown domain: ${unknown.join(", ")}`);
    selected = selected.filter((skill) => wanted.has(skill.domain));
  }
  if (names.length > 0) {
    const known = new Map(catalog.skills.map((skill) => [skill.name, skill]));
    const unknown = names.filter((name) => !known.has(name));
    if (unknown.length > 0) throw new Error(`Unknown skill: ${unknown.join(", ")}`);
    const wanted = new Set(names);
    selected = selected.filter((skill) => wanted.has(skill.name));
  }
  if (selected.length === 0) throw new Error("No skills matched the selection.");
  return selected;
}
