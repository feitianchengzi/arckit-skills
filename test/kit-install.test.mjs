import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { loadCatalog, selectKits, selectSkills } from "../lib/catalog.mjs";
import {
  applyInstall,
  applyUninstall,
  planInstall,
  planUninstall,
  readManifest,
} from "../lib/install.mjs";
import { cleanup, makeCatalog, makeTempDir } from "./helpers.mjs";

function withKit(root) {
  const source = join(root, "kits", "source");
  mkdirSync(join(source, "_map"), { recursive: true });
  writeFileSync(join(source, "README.md"), "# definition kit\n");
  writeFileSync(join(source, "CONVENTIONS.md"), "# rules\n");
  writeFileSync(join(source, "_map", "RELATIONS-template.md"), "# relations\n");

  const assets = {
    "definition/arckit-spec/assets": "feature-template.md",
    "definition/arckit-tech/assets": "solution-template.md",
    "definition/arckit-interaction/assets": "interaction-template.md",
    "definition/arckit-visual/assets": "brief-template.md",
  };
  for (const [dir, file] of Object.entries(assets)) {
    const target = join(root, ...dir.split("/"));
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, file), `# ${file}\n`);
  }
  return root;
}

function setup(t) {
  const root = withKit(makeCatalog());
  const target = makeTempDir();
  const project = makeTempDir();
  t.after(() => cleanup(root, target, project));
  const catalog = loadCatalog({ source: root });
  return { catalog, target, project };
}

test("catalog exposes kits without treating them as skills", (t) => {
  const { catalog } = setup(t);
  assert.deepEqual(catalog.kits.map((kit) => kit.name), ["definition-kit"]);
  assert.equal(catalog.skills.some((skill) => skill.name === "definition-kit"), false);
  assert.deepEqual(selectKits(catalog, { names: ["definition-kit"] }).map((kit) => kit.path), [
    "kits/source",
  ]);
});

test("planInstall composes the kit from source docs and definition assets", (t) => {
  const { catalog, target, project } = setup(t);
  const skills = selectSkills(catalog, { names: ["using-arckit"] });
  const kits = selectKits(catalog);
  const plan = planInstall(catalog, {
    skills,
    shared: [],
    kits,
    layout: "flat",
    targetDir: target,
    projectDir: project,
  });

  const kit = plan.find((item) => item.kind === "kit");
  assert.ok(kit);
  assert.equal(kit.path, "arckit/_kit");
  assert.equal(kit.root, "project");
  assert.equal(kit.destination, join(project, "arckit", "_kit"));
  assert.deepEqual(
    kit.files.map((file) => file.rel).sort(),
    [
      "_map/RELATIONS-template.md",
      "CONVENTIONS.md",
      "README.md",
      "interaction/interaction-template.md",
      "shared/content-spec.md",
      "spec/feature-template.md",
      "tech/solution-template.md",
      "visual/brief-template.md",
    ].sort(),
  );
});

test("applyInstall writes the kit outside the skills target and records its root", (t) => {
  const { catalog, target, project } = setup(t);
  const skills = selectSkills(catalog, { names: ["using-arckit"] });
  const plan = planInstall(catalog, {
    skills,
    shared: [],
    kits: selectKits(catalog),
    layout: "flat",
    targetDir: target,
    projectDir: project,
  });

  const { manifest } = applyInstall(plan, {
    targetDir: target,
    projectDir: project,
    catalog,
    layout: "flat",
    scope: "project",
  });

  assert.ok(existsSync(join(target, "using-arckit", "SKILL.md")));
  assert.ok(existsSync(join(project, "arckit", "_kit", "README.md")));
  assert.ok(existsSync(join(project, "arckit", "_kit", "spec", "feature-template.md")));
  assert.ok(existsSync(join(project, "arckit", "_kit", "shared", "content-spec.md")));
  assert.equal(existsSync(join(target, "arckit")), false);

  const kit = manifest.items.find((item) => item.kind === "kit");
  assert.equal(kit.root, "project");
  assert.equal(kit.path, "arckit/_kit");
});

test("planUninstall resolves the kit under the project directory", (t) => {
  const { catalog, target, project } = setup(t);
  const plan = planInstall(catalog, {
    skills: selectSkills(catalog, { names: ["using-arckit"] }),
    shared: [],
    kits: selectKits(catalog),
    layout: "flat",
    targetDir: target,
    projectDir: project,
  });
  applyInstall(plan, { targetDir: target, projectDir: project, catalog, layout: "flat" });

  const { manifest, items } = planUninstall(target, { names: ["definition-kit"], projectDir: project });
  assert.equal(items.length, 1);
  assert.equal(items[0].destination, join(project, "arckit", "_kit"));
  applyUninstall(target, { manifest, items });

  assert.equal(existsSync(join(project, "arckit", "_kit")), false);
  assert.ok(existsSync(join(target, "using-arckit", "SKILL.md")));
});

test("reinstalling without --with-kit keeps the previously generated kit", (t) => {
  const { catalog, target, project } = setup(t);
  const skills = selectSkills(catalog, { names: ["using-arckit"] });
  const withKitPlan = planInstall(catalog, {
    skills,
    shared: [],
    kits: selectKits(catalog),
    layout: "flat",
    targetDir: target,
    projectDir: project,
  });
  applyInstall(withKitPlan, { targetDir: target, projectDir: project, catalog, layout: "flat" });
  assert.ok(existsSync(join(project, "arckit", "_kit")));

  const withoutKit = planInstall(catalog, { skills, shared: [], kits: [], layout: "flat", targetDir: target });
  const { removed } = applyInstall(withoutKit, {
    targetDir: target,
    projectDir: project,
    catalog,
    layout: "flat",
    force: true,
  });

  assert.deepEqual(removed, []);
  assert.ok(existsSync(join(project, "arckit", "_kit", "README.md")));
  assert.ok(existsSync(join(target, "using-arckit", "SKILL.md")));
  assert.ok(readManifest(target).items.some((item) => item.kind === "kit"));
});
