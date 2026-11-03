import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadCatalog, selectShared, selectSkills } from "../lib/catalog.mjs";
import { cleanup, makeCatalog } from "./helpers.mjs";

test("scans the flat domain/skill layout", (t) => {
  const root = makeCatalog();
  t.after(() => cleanup(root));

  const catalog = loadCatalog({ source: root });
  assert.deepEqual(
    catalog.skills.map((skill) => [skill.domain, skill.name, skill.path]),
    [
      ["entry", "using-arckit", "entry/using-arckit"],
      ["definition", "arckit-spec", "definition/arckit-spec"],
      ["definition", "arckit-tech", "definition/arckit-tech"],
      ["code", "demo-code", "code/demo-code"],
    ],
  );
  assert.equal(catalog.skills[1].description, "需求规格");
  assert.deepEqual(catalog.shared, [
    { name: "_arckit_shared", domain: "definition", path: "definition/_arckit_shared" },
  ]);
});

test("selects skills by name and domain", (t) => {
  const root = makeCatalog();
  t.after(() => cleanup(root));
  const catalog = loadCatalog({ source: root });

  assert.deepEqual(
    selectSkills(catalog, { domains: ["definition"] }).map((skill) => skill.name),
    ["arckit-spec", "arckit-tech"],
  );
  assert.deepEqual(
    selectSkills(catalog, { names: ["demo-code"] }).map((skill) => skill.name),
    ["demo-code"],
  );
  assert.throws(() => selectSkills(catalog, { names: ["missing"] }), /Unknown skill: missing/);
  assert.throws(() => selectSkills(catalog, { domains: ["missing"] }), /Unknown domain: missing/);
});

test("shared bundles follow the selected domains", (t) => {
  const root = makeCatalog();
  t.after(() => cleanup(root));
  const catalog = loadCatalog({ source: root });

  assert.deepEqual(selectShared(catalog, selectSkills(catalog, { domains: ["definition"] })), [
    { name: "_arckit_shared", domain: "definition", path: "definition/_arckit_shared" },
  ]);
  assert.deepEqual(selectShared(catalog, selectSkills(catalog, { names: ["demo-code"] })), []);
});

test("scans the legacy domain/skills layout", (t) => {
  const root = mkdtempSync(join(tmpdir(), "arckit-legacy-"));
  t.after(() => cleanup(root));

  const skillDir = join(root, "definition", "skills", "arckit-spec");
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, "SKILL.md"), "---\nname: arckit-spec\ndescription: 需求规格\n---\n");
  mkdirSync(join(root, "definition", "skills", "_shared"), { recursive: true });
  writeFileSync(join(root, "definition", "skills", "_shared", "spec.md"), "# shared\n");

  const catalog = loadCatalog({ source: root });
  assert.deepEqual(catalog.skills, [
    { name: "arckit-spec", domain: "definition", path: "definition/skills/arckit-spec", description: "需求规格" },
  ]);
  assert.deepEqual(catalog.shared, [
    { name: "_shared", domain: "definition", path: "definition/skills/_shared" },
  ]);
});
