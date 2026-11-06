import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SKIP_DIRS = new Set(["node_modules", "vendor", "bin", "lib", "test", "tests", "dist", "coverage"]);

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

export const PACKAGE_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

/**
 * Skills ship inside the package itself. Older layouts vendored the source
 * repository under `vendor/arckit-skills`; keep supporting that when present.
 */
export function defaultSource() {
  const vendor = join(PACKAGE_ROOT, "vendor", "arckit-skills");
  return existsSync(vendor) ? vendor : PACKAGE_ROOT;
}

function parseFrontmatter(raw) {
  const text = raw.replace(/^﻿/, "");
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

function compareDomains(a, b) {
  const ai = DOMAIN_ORDER.indexOf(a);
  const bi = DOMAIN_ORDER.indexOf(b);
  if (ai === -1 && bi === -1) return a.localeCompare(b);
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}

function hasSkill(dir) {
  return existsSync(join(dir, "SKILL.md"));
}

/**
 * A domain is a top-level directory whose children are either skill
 * directories (flat source repository) or a `skills/` directory (legacy
 * distribution layout).
 */
function isDomainDir(dir) {
  if (existsSync(join(dir, "skills"))) return true;
  return readdirSync(dir, { withFileTypes: true }).some(
    (entry) => entry.isDirectory() && hasSkill(join(dir, entry.name)),
  );
}

function collectSkill({ domain, dir, relPath, name, legacy, skills, shared }) {
  if (!hasSkill(dir)) {
    if (legacy || name.startsWith("_")) {
      shared.push({ name, domain, path: relPath });
    }
    return;
  }
  const frontmatter = parseFrontmatter(readFileSync(join(dir, "SKILL.md"), "utf8"));
  skills.push({
    name: frontmatter.name ?? name,
    domain,
    path: relPath,
    description: frontmatter.description ?? "",
  });
}

function scan(source) {
  const skills = [];
  const shared = [];
  const domains = readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && !SKIP_DIRS.has(entry.name))
    .map((entry) => entry.name)
    .filter((name) => isDomainDir(join(source, name)))
    .sort(compareDomains);

  for (const domain of domains) {
    const domainDir = join(source, domain);
    const legacySkillsDir = join(domainDir, "skills");
    const legacy = existsSync(legacySkillsDir);
    const container = legacy ? legacySkillsDir : domainDir;

    for (const name of readdirSync(container).sort()) {
      const dir = join(container, name);
      if (!statSync(dir).isDirectory()) continue;
      collectSkill({
        domain,
        dir,
        relPath: legacy ? `${domain}/skills/${name}` : `${domain}/${name}`,
        name,
        legacy,
        skills,
        shared,
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
        "Pass --source <path> or run `git submodule update --init vendor/arckit-skills`.",
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

  if (skills.length === 0) {
    throw new Error(`No skills found in ${root}. Expected <domain>/<skill>/SKILL.md.`);
  }

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
    kits: loadKits(root),
  };
}

/**
 * Kits are composed at install time from `kits/source/` plus the definition
 * assets. Nothing is pre-generated in the repository.
 */
export function loadKits(root) {
  const source = join(resolve(root), "kits", "source");
  if (!existsSync(join(source, "README.md"))) return [];
  return [{
    name: "definition-kit",
    domain: "kits",
    path: "kits/source",
    description: "事实源模板与最小规范（安装时生成）",
  }];
}

export function selectKits(catalog, { names = [] } = {}) {
  const kits = catalog.kits ?? [];
  if (names.length === 0) return kits;
  const known = new Map(kits.map((kit) => [kit.name, kit]));
  const unknown = names.filter((name) => !known.has(name));
  if (unknown.length > 0) {
    throw new Error(`Unknown kit: ${unknown.join(", ")}. Available: ${kits.map((kit) => kit.name).join(", ")}`);
  }
  return names.map((name) => known.get(name));
}

export function selectSkills(catalog, { names = [], domains = [], all = false } = {}) {
  let selected = catalog.skills;
  if (domains.length > 0) {
    const wanted = new Set(domains);
    const available = [...new Set(catalog.skills.map((skill) => skill.domain))];
    const unknown = domains.filter((domain) => !available.includes(domain));
    if (unknown.length > 0) {
      throw new Error(`Unknown domain: ${unknown.join(", ")}. Available: ${available.join(", ")}`);
    }
    selected = selected.filter((skill) => wanted.has(skill.domain));
  }
  if (names.length > 0) {
    const known = new Map(catalog.skills.map((skill) => [skill.name, skill]));
    const unknown = names.filter((name) => !known.has(name));
    if (unknown.length > 0) {
      throw new Error(`Unknown skill: ${unknown.join(", ")}. Run \`npx arckit-skills list\` to see names.`);
    }
    const wanted = new Set(names);
    selected = selected.filter((skill) => wanted.has(skill.name));
  }
  if (selected.length === 0 && !all) throw new Error("No skills matched the selection.");
  return selected;
}

/** Shared bundles (for example `definition/_arckit_shared`) of selected domains. */
export function selectShared(catalog, skills) {
  const domains = new Set(skills.map((skill) => skill.domain));
  return catalog.shared.filter((entry) => domains.has(entry.domain));
}
