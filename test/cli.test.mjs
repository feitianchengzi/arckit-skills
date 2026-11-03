import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
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
