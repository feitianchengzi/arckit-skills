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
import { dirname, join, resolve, sep } from "node:path";
import { isInside } from "./targets.mjs";

export const MANIFEST_NAME = ".arckit-skills.json";
export const MANIFEST_SCHEMA = "arckit-skills-install/v1";

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

export function planInstall(catalog, { skills, shared, layout, targetDir }) {
  if (layout !== "structured" && layout !== "flat") {
    throw new Error(`Unknown layout: ${layout}`);
  }

  const domains = new Set(skills.map((skill) => skill.domain));
  const items = [];

  for (const skill of skills) {
    const path = layout === "flat" ? skill.name : `${skill.domain}/skills/${skill.name}`;
    items.push({
      kind: "skill",
      name: skill.name,
      domain: skill.domain,
      layout,
      path,
      source: join(catalog.root, skill.path),
    });
  }

  for (const entry of shared) {
    if (!domains.has(entry.domain)) continue;
    const path = layout === "flat" ? entry.name : `${entry.domain}/skills/${entry.name}`;
    items.push({
      kind: "shared",
      name: entry.name,
      domain: entry.domain,
      layout,
      path,
      source: join(catalog.root, entry.path),
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

  return [...byPath.values()].map((item) => ({ ...item, destination: join(targetDir, ...item.path.split("/")) }));
}

export function findConflicts(plan, { force = false } = {}) {
  if (force) return [];
  return plan.filter((item) => existsSync(item.destination));
}

export function applyInstall(plan, { targetDir, catalog, layout, force = false }) {
  mkdirSync(targetDir, { recursive: true });

  for (const item of plan) {
    if (existsSync(item.destination)) {
      if (!force) throw new Error(`Refusing to overwrite ${item.destination}. Use --force.`);
      rmSync(item.destination, { recursive: true, force: true });
    }
    mkdirSync(dirname(item.destination), { recursive: true });
    cpSync(item.source, item.destination, { recursive: true });
  }

  const previous = readManifest(targetDir) ?? { schema: MANIFEST_SCHEMA, items: [] };
  const items = previous.items.filter((old) => !plan.some((item) => item.path === old.path));
  for (const item of plan) {
    items.push({
      kind: item.kind,
      name: item.name,
      domain: item.domain,
      layout: item.layout,
      path: item.path,
    });
  }
  const manifest = {
    schema: MANIFEST_SCHEMA,
    source: {
      commit: catalog.sourceCommit,
      vendor: catalog.root,
    },
    updatedAt: new Date().toISOString(),
    layout,
    items,
  };
  writeFileSync(manifestPath(targetDir), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
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

export function planUninstall(targetDir, { names = [] } = {}) {
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
      const destination = resolve(targetDir, ...item.path.split("/"));
      if (!isInside(targetDir, destination) || destination === resolve(targetDir)) {
        throw new Error(`Manifest entry escapes the target directory: ${item.path}`);
      }
      return { ...item, destination };
    }),
  };
}

export function applyUninstall(targetDir, { manifest, items }) {
  for (const item of items) {
    if (existsSync(item.destination) && statSync(item.destination).isDirectory()) {
      rmSync(item.destination, { recursive: true, force: true });
    }
    pruneEmptyParents(targetDir, dirname(item.destination));
  }

  const remaining = manifest.items.filter((item) => !items.some((removed) => removed.path === item.path && removed.layout === item.layout));
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
