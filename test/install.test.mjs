import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { loadCatalog, selectShared, selectSkills } from "../lib/catalog.mjs";
import {
  applyInstall,
  applyUninstall,
  MANIFEST_NAME,
  planInstall,
  planUninstall,
  readManifest,
} from "../lib/install.mjs";
import { cleanup, makeCatalog, makeTempDir } from "./helpers.mjs";

function setup(t) {
  const root = makeCatalog();
  const target = makeTempDir();
  t.after(() => cleanup(root, target));
  const catalog = loadCatalog({ source: root });
  const skills = selectSkills(catalog, { names: ["arckit-spec"] });
  const shared = selectShared(catalog, skills);
  return { catalog, skills, shared, target };
}

test("flat plan puts skills at the top level and embeds shared bundles", (t) => {
  const { catalog, skills, shared, target } = setup(t);
  const plan = planInstall(catalog, { skills, shared, layout: "flat", targetDir: target });

  assert.equal(plan.length, 1);
  assert.equal(plan[0].path, "arckit-spec");
  assert.deepEqual(plan[0].embeds.map((embed) => embed.name), ["_arckit_shared"]);
});

test("structured plan preserves the source domain layout", (t) => {
  const { catalog, skills, shared, target } = setup(t);
  const plan = planInstall(catalog, { skills, shared, layout: "structured", targetDir: target });

  assert.deepEqual(
    plan.map((item) => item.path),
    ["definition/arckit-spec", "definition/_arckit_shared"],
  );
  assert.equal(plan[0].embeds.length, 0);
});

test("flat install makes each skill self-contained", (t) => {
  const { catalog, skills, shared, target } = setup(t);
  const plan = planInstall(catalog, { skills, shared, layout: "flat", targetDir: target });
  const { manifest } = applyInstall(plan, { targetDir: target, catalog, layout: "flat", scope: "project" });

  const skillFile = join(target, "arckit-spec", "SKILL.md");
  assert.ok(existsSync(skillFile));
  assert.ok(existsSync(join(target, "arckit-spec", "_arckit_shared", "content-spec.md")));
  assert.equal(existsSync(join(target, "_arckit_shared")), false);

  const text = readFileSync(skillFile, "utf8");
  assert.match(text, /\]\(\.\/_arckit_shared\/content-spec\.md\)/);
  assert.doesNotMatch(text, /\.\.\/_arckit_shared/);

  assert.equal(manifest.layout, "flat");
  assert.equal(manifest.scope, "project");
  assert.ok(existsSync(join(target, MANIFEST_NAME)));
});

test("switching layout removes stale copies tracked by the manifest", (t) => {
  const { catalog, skills, shared, target } = setup(t);

  const flatPlan = planInstall(catalog, { skills, shared, layout: "flat", targetDir: target });
  applyInstall(flatPlan, { targetDir: target, catalog, layout: "flat", scope: "project" });
  assert.ok(existsSync(join(target, "arckit-spec")));

  const structuredPlan = planInstall(catalog, { skills, shared, layout: "structured", targetDir: target });
  applyInstall(structuredPlan, { targetDir: target, catalog, layout: "structured", scope: "project" });

  assert.equal(existsSync(join(target, "arckit-spec")), false);
  assert.ok(existsSync(join(target, "definition", "arckit-spec", "SKILL.md")));
  assert.equal(readManifest(target).layout, "structured");

  const flatAgain = planInstall(catalog, { skills, shared, layout: "flat", targetDir: target });
  applyInstall(flatAgain, { targetDir: target, catalog, layout: "flat", scope: "project" });

  assert.equal(existsSync(join(target, "definition")), false);
  assert.ok(existsSync(join(target, "arckit-spec", "_arckit_shared", "content-spec.md")));
});

test("uninstall removes installed directories and the manifest", (t) => {
  const { catalog, skills, shared, target } = setup(t);
  const plan = planInstall(catalog, { skills, shared, layout: "structured", targetDir: target });
  applyInstall(plan, { targetDir: target, catalog, layout: "structured", scope: "project" });

  const { manifest, items } = planUninstall(target);
  assert.equal(items.length, 2);
  const remaining = applyUninstall(target, { manifest, items });

  assert.deepEqual(remaining, []);
  assert.equal(readdirSync(target).length, 0);
  assert.equal(existsSync(join(target, MANIFEST_NAME)), false);
});
