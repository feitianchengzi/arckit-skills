import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { isInside } from "./targets.mjs";

export const MANIFEST_NAME = ".arckit-skills.json";
export const MANIFEST_SCHEMA = "arckit-skills-install/v1";

const TEXT_EXTENSIONS = new Set([".md", ".markdown", ".yaml", ".yml", ".json", ".txt"]);

export function manifestPath(targetDir) {
  return join(targetDir, MANIFEST_NAME);
}

export function readManifest(targetDir) {
  const path = manifestPath(targetDir);
  if (!existsSync(path)) return null;
  try {
    const manifest = JSON.parse(readFileSync(path, "utf8"));
    if (!Array.isArray(manifest.items)) manifest.items = [];
    return manifest;
  } catch (error) {
    throw new Error(`Cannot read install manifest ${path}: ${error.message}`);
  }
}

function itemKey(item) {
  return `${item.kind}:${item.domain}:${item.name}`;
}

const KIT_ASSET_SOURCES = [
  { to: "spec", from: "definition/arckit-spec/assets" },
  { to: "tech", from: "definition/arckit-tech/assets" },
  { to: "interaction", from: "definition/arckit-interaction/assets" },
  { to: "visual", from: "definition/arckit-visual/assets" },
  { to: "shared", from: "definition/_arckit_shared", include: (name) => name.endsWith(".md") },
];

function walkFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path, base));
    else if (entry.isFile()) files.push(relative(base, path).replaceAll("\\", "/"));
  }
  return files.sort();
}

/** Compose the kit from committed source docs plus the definition assets. */
export function collectKitFiles(catalog, kit) {
  const files = [];
  const sourceRoot = join(catalog.root, ...kit.path.split("/"));
  for (const rel of walkFiles(sourceRoot)) {
    files.push({ rel, source: join(sourceRoot, ...rel.split("/")) });
  }
  for (const group of KIT_ASSET_SOURCES) {
    const dir = join(catalog.root, ...group.from.split("/"));
    for (const rel of walkFiles(dir)) {
      if (group.include && !group.include(rel.split("/").at(-1))) continue;
      files.push({ rel: `${group.to}/${rel}`, source: join(dir, ...rel.split("/")) });
    }
  }
  return files;
}

/**
 * Build the list of directories to install.
 *
 * - `flat`: every skill lands directly in the target. Shared bundles such as
 *   `_arckit_shared` are embedded inside each skill and their relative links
 *   are rewritten, so flat installs stay self-contained.
 * - `structured`: the source relative path is preserved (`definition/<skill>`),
 *   keeping shared bundles as siblings.
 */
export function planInstall(catalog, { skills, shared, kits = [], layout, targetDir, projectDir }) {
  if (layout !== "structured" && layout !== "flat") {
    throw new Error(`Unknown layout: ${layout}`);
  }

  const sharedByDomain = new Map();
  for (const entry of shared) {
    if (!sharedByDomain.has(entry.domain)) sharedByDomain.set(entry.domain, []);
    sharedByDomain.get(entry.domain).push(entry);
  }

  const items = [];

  for (const skill of skills) {
    const embeds =
      layout === "flat"
        ? (sharedByDomain.get(skill.domain) ?? []).map((entry) => ({
            name: entry.name,
            path: entry.path,
            source: join(catalog.root, entry.path),
          }))
        : [];
    items.push({
      kind: "skill",
      name: skill.name,
      domain: skill.domain,
      layout,
      path: layout === "flat" ? skill.name : skill.path,
      source: join(catalog.root, skill.path),
      embeds,
    });
  }

  if (layout === "structured") {
    for (const entry of shared) {
      if (!skills.some((skill) => skill.domain === entry.domain)) continue;
      items.push({
        kind: "shared",
        name: entry.name,
        domain: entry.domain,
        layout,
        path: entry.path,
        source: join(catalog.root, entry.path),
        embeds: [],
      });
    }
  }

  for (const kit of kits) {
    if (!projectDir) throw new Error(`Kit ${kit.name} requires a project directory.`);
    items.push({
      kind: "kit",
      name: kit.name,
      domain: kit.domain,
      layout: "project",
      root: "project",
      path: "arckit/_kit",
      destination: join(resolve(projectDir), "arckit", "_kit"),
      files: collectKitFiles(catalog, kit),
      embeds: [],
    });
  }

  const byPath = new Map();
  for (const item of items) {
    const existing = byPath.get(item.path);
    if (existing) {
      if (existing.source !== item.source) {
        throw new Error(`Install path collision at ${item.path}: ${existing.source} and ${item.source}`);
      }
      continue;
    }
    byPath.set(item.path, item);
  }

  return [...byPath.values()].map((item) => ({
    ...item,
    root: item.root ?? "target",
    destination: item.destination ?? join(targetDir, ...item.path.split("/")),
  }));
}

export function findConflicts(plan, { force = false } = {}) {
  if (force) return [];
  return plan.filter((item) => existsSync(item.destination));
}

function rewriteSharedLinks(dir, sharedName) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteSharedLinks(path, sharedName);
      continue;
    }
    if (!entry.isFile() || !TEXT_EXTENSIONS.has(extname(entry.name).toLowerCase())) continue;

    const raw = readFileSync(path, "utf8");
    const next = raw
      .replaceAll(`../${sharedName}/`, `./${sharedName}/`)
      .replaceAll(`..\\${sharedName}\\`, `.\\${sharedName}\\`);
    if (next !== raw) writeFileSync(path, next, "utf8");
  }
}

/**
 * Remove copies installed at a stale path, for example after switching from
 * flat to structured layout. Only entries tracked by our own manifest and
 * whose target path changed are touched.
 */
function removeStaleCopies(previous, plan, { targetDir, projectDir = targetDir, layout }) {
  if (!previous) return [];
  const plannedPaths = new Map(plan.map((item) => [itemKey(item), item.path]));
  const allPlannedPaths = new Set(plan.map((item) => item.path));
  const removed = [];
  for (const old of previous.items) {
    const nextPath = plannedPaths.get(itemKey(old));
    if (nextPath === old.path) continue;
    // Flat installs embed shared bundles, so structured shared copies are stale.
    const staleShared = old.kind === "shared" && layout === "flat" && !allPlannedPaths.has(old.path);
    if (!nextPath && !staleShared) continue;
    const base = old.root === "project" ? projectDir : targetDir;
    const destination = resolve(base, ...old.path.split("/"));
    if (!isInside(base, destination) || destination === resolve(base)) continue;
    if (existsSync(destination)) rmSync(destination, { recursive: true, force: true });
    pruneEmptyParents(base, dirname(destination));
    removed.push(old.path);
  }
  return removed;
}

export function applyInstall(plan, { targetDir, catalog, layout, scope = null, agent = null, force = false, projectDir = targetDir }) {
  mkdirSync(targetDir, { recursive: true });

  const previous = readManifest(targetDir);
  const removed = removeStaleCopies(previous, plan, { targetDir, projectDir, layout });

  for (const item of plan) {
    if (item.kind === "kit") {
      if (existsSync(item.destination)) {
        if (!force) throw new Error(`Refusing to overwrite ${item.destination}. Use --force.`);
        rmSync(item.destination, { recursive: true, force: true });
      }
      for (const file of item.files ?? []) {
        const target = join(item.destination, ...file.rel.split("/"));
        mkdirSync(dirname(target), { recursive: true });
        cpSync(file.source, target);
      }
      continue;
    }
    if (existsSync(item.destination)) {
      if (!force) throw new Error(`Refusing to overwrite ${item.destination}. Use --force.`);
      rmSync(item.destination, { recursive: true, force: true });
    }
    mkdirSync(dirname(item.destination), { recursive: true });
    cpSync(item.source, item.destination, { recursive: true });

    for (const embed of item.embeds ?? []) {
      const embedDestination = join(item.destination, embed.name);
      if (existsSync(embedDestination)) rmSync(embedDestination, { recursive: true, force: true });
      cpSync(embed.source, embedDestination, { recursive: true });
      rewriteSharedLinks(item.destination, embed.name);
    }
  }

  const removedPaths = new Set(removed);
  const plannedPaths = new Set(plan.map((item) => item.path));
  const itemsByKey = new Map(
    (previous?.items ?? [])
      .filter((item) => !(removedPaths.has(item.path) && !plannedPaths.has(item.path)))
      .map((item) => [itemKey(item), item]),
  );
  for (const item of plan) {
    itemsByKey.set(itemKey(item), {
      kind: item.kind,
      name: item.name,
      domain: item.domain,
      layout: item.layout,
      root: item.root ?? "target",
      path: item.path,
      embeds: (item.embeds ?? []).map((embed) => embed.name),
    });
  }

  const manifest = {
    schema: MANIFEST_SCHEMA,
    source: {
      commit: catalog.sourceCommit,
      root: catalog.root,
    },
    updatedAt: new Date().toISOString(),
    scope,
    agent,
    layout,
    items: [...itemsByKey.values()],
  };
  writeFileSync(manifestPath(targetDir), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { manifest, removed };
}

function pruneEmptyParents(targetDir, startDir) {
  let current = startDir;
  while (isInside(targetDir, current) && resolve(current) !== resolve(targetDir)) {
    if (!existsSync(current)) {
      current = dirname(current);
      continue;
    }
    if (readdirSync(current).length > 0) return;
    rmSync(current, { recursive: true, force: true });
    current = dirname(current);
  }
}

export function planUninstall(targetDir, { names = [], projectDir = targetDir } = {}) {
  const manifest = readManifest(targetDir);
  if (!manifest) return { manifest: null, items: [] };

  const wanted = new Set(names);
  const items = manifest.items.filter((item) => wanted.size === 0 || wanted.has(item.name));
  if (wanted.size > 0) {
    const known = new Set(manifest.items.map((item) => item.name));
    const unknown = names.filter((name) => !known.has(name));
    if (unknown.length > 0) throw new Error(`Not installed in this target: ${unknown.join(", ")}`);
  }

  return {
    manifest,
    items: items.map((item) => {
      const base = item.root === "project" ? projectDir : targetDir;
      const destination = resolve(base, ...item.path.split("/"));
      if (!isInside(base, destination) || destination === resolve(base)) {
        throw new Error(`Manifest entry escapes its install base: ${item.path}`);
      }
      return { ...item, base, destination };
    }),
  };
}

export function applyUninstall(targetDir, { manifest, items }) {
  for (const item of items) {
    if (existsSync(item.destination) && statSync(item.destination).isDirectory()) {
      rmSync(item.destination, { recursive: true, force: true });
    }
    pruneEmptyParents(item.base ?? targetDir, dirname(item.destination));
  }

  const remaining = manifest.items.filter(
    (item) => !items.some((removed) => removed.path === item.path && removed.layout === item.layout),
  );
  if (remaining.length === 0) {
    rmSync(manifestPath(targetDir), { force: true });
  } else {
    writeFileSync(
      manifestPath(targetDir),
      `${JSON.stringify({ ...manifest, updatedAt: new Date().toISOString(), items: remaining }, null, 2)}\n`,
      "utf8",
    );
  }
  return remaining;
}

export { sep };
