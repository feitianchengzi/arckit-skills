import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { cleanup, makeCatalog, makeTempDir } from "./helpers.mjs";

const BIN = fileURLToPath(new URL("../bin/arckit-skills.mjs", import.meta.url));

function run(args, { cwd } = {}) {
  return spawnSync(process.execPath, [BIN, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
}

function addKit(root) {
  const ledger = join(root, "entry", "arckit-development-ledger");
  mkdirSync(ledger, { recursive: true });
  writeFileSync(ledger + "/SKILL.md", "---\nname: arckit-development-ledger\ndescription: 账本\n---\n\n# ledger\n");

  const source = join(root, "kits", "source");
  mkdirSync(join(source, "_map"), { recursive: true });
  writeFileSync(join(source, "README.md"), "# definition kit\n");
  writeFileSync(join(source, "CONVENTIONS.md"), "# rules\n");

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

test("install works non-interactively with --yes defaults", (t) => {
  const source = makeCatalog();
  const project = makeTempDir("arckit-project-");
  t.after(() => cleanup(source, project));

  const result = run(
    ["install", "--source", source, "--project", "--flat", "--only", "arckit-spec", "--yes"],
    { cwd: project },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(join(project, ".agents", "skills", "arckit-spec", "SKILL.md")));
  assert.ok(existsSync(join(project, ".agents", "skills", ".arckit-skills.json")));
});

test("--agent claude installs into .claude/skills", (t) => {
  const source = makeCatalog();
  const project = makeTempDir("arckit-project-");
  t.after(() => cleanup(source, project));

  const result = run(
    ["install", "--source", source, "--project", "--flat", "--agent", "claude", "--only", "arckit-spec", "--yes"],
    { cwd: project },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(join(project, ".claude", "skills", "arckit-spec", "SKILL.md")));
});

test("--agents is a shorthand for --agent agents", (t) => {
  const source = makeCatalog();
  const project = makeTempDir("arckit-project-");
  t.after(() => cleanup(source, project));

  const result = run(
    ["install", "--source", source, "--project", "--flat", "--agents", "--only", "arckit-spec", "--yes"],
    { cwd: project },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(join(project, ".agents", "skills", "arckit-spec", "SKILL.md")));
});

test("--target overrides scope and layout still applies", (t) => {
  const source = makeCatalog();
  const target = makeTempDir("arckit-custom-");
  t.after(() => cleanup(source, target));

  const result = run([
    "install",
    "--source",
    source,
    "--target",
    target,
    "--structured",
    "--only",
    "arckit-tech",
    "--yes",
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(join(target, "definition", "arckit-tech", "SKILL.md")));
});

test("non-interactive runs without choices fail with guidance", (t) => {
  const source = makeCatalog();
  t.after(() => cleanup(source));

  const result = run(["install", "--source", source]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--personal\/--project/);
});

test("list prints available skills", (t) => {
  const source = makeCatalog();
  t.after(() => cleanup(source));

  const result = run(["list", "--source", source]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /arckit-spec/);
  assert.match(result.stdout, /definition/);
});

test("uninstall removes what install created", (t) => {
  const source = makeCatalog();
  const project = makeTempDir("arckit-project-");
  t.after(() => cleanup(source, project));

  assert.equal(
    run(["install", "--source", source, "--project", "--flat", "--yes"], { cwd: project }).status,
    0,
  );

  const result = run(["uninstall", "--source", source, "--project", "--yes"], { cwd: project });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(join(project, ".agents", "skills", ".arckit-skills.json")), false);
});

test("help documents .agents compatibility", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\.agents\/skills/);
  assert.match(result.stdout, /Codex、Cursor、Gemini CLI/);
});

test("minimal loop installs the definition kit only with --with-kit", (t) => {
  const source = addKit(makeCatalog());
  const project = makeTempDir("arckit-project-");
  t.after(() => cleanup(source, project));

  const without = run(
    ["install", "--source", source, "--project", "--flat", "--agents", "--only", "using-arckit,arckit-development-ledger", "--yes"],
    { cwd: project },
  );
  assert.equal(without.status, 0, without.stderr);
  assert.equal(existsSync(join(project, "arckit")), false);

  const withKit = run(
    ["install", "--source", source, "--project", "--flat", "--agents", "--only", "using-arckit,arckit-development-ledger", "--with-kit", "--yes"],
    { cwd: project },
  );
  assert.equal(withKit.status, 0, withKit.stderr);
  assert.ok(existsSync(join(project, "arckit", "_kit", "README.md")));
  assert.ok(existsSync(join(project, "arckit", "_kit", "spec", "feature-template.md")));
  assert.ok(existsSync(join(project, ".agents", "skills", "using-arckit", "SKILL.md")));
});

test("--with-kit is rejected outside the minimal loop", (t) => {
  const source = addKit(makeCatalog());
  const project = makeTempDir("arckit-project-");
  t.after(() => cleanup(source, project));

  const result = run(
    ["install", "--source", source, "--project", "--flat", "--agents", "--only", "using-arckit", "--with-kit", "--yes"],
    { cwd: project },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--with-kit 仅用于最小闭环安装/);
  assert.equal(existsSync(join(project, "arckit")), false);
});
