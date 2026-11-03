import { test } from "node:test";
import assert from "node:assert/strict";
import { homedir } from "node:os";
import { resolve } from "node:path";

import { DEFAULT_AGENT, resolveScopeTarget, resolveTarget } from "../lib/targets.mjs";

test(".agents is the default agent and resolves cross-agent directories", () => {
  assert.equal(DEFAULT_AGENT, "agents");

  const cwd = resolve("/work/project");
  const home = resolve("/home/user");

  assert.deepEqual(resolveScopeTarget("project", { agent: "agents", cwd, home }), {
    dir: resolve(cwd, ".agents/skills"),
    alias: "project",
  });
  assert.deepEqual(resolveScopeTarget("personal", { agent: "agents", cwd, home }), {
    dir: resolve(home, ".agents/skills"),
    alias: "user",
  });
});

test("claude agent resolves .claude directories", () => {
  const cwd = resolve("/work/project");
  const home = resolve("/home/user");

  assert.deepEqual(resolveScopeTarget("project", { agent: "claude", cwd, home }), {
    dir: resolve(cwd, ".claude/skills"),
    alias: "claude",
  });
  assert.deepEqual(resolveScopeTarget("personal", { agent: "claude", cwd, home }), {
    dir: resolve(home, ".claude/skills"),
    alias: "claude-user",
  });
});

test("unknown agents and scopes are rejected", () => {
  assert.throws(() => resolveScopeTarget("project", { agent: "nope" }), /Unknown agent: nope/);
  assert.throws(() => resolveScopeTarget("nope", { agent: "agents" }), /Unknown scope: nope/);
});

test("resolveTarget still accepts alias names and explicit paths", () => {
  const home = homedir();
  assert.equal(resolveTarget("agents").dir, resolve(".agents/skills"));
  assert.equal(resolveTarget("user").dir, resolve(home, ".agents/skills"));
  assert.equal(resolveTarget("~/custom", { home }).dir, resolve(home, "custom"));
});
