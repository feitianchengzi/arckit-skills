import { homedir } from "node:os";
import { isAbsolute, join, resolve, sep } from "node:path";

/**
 * Target aliases. `project` is the default so installing inside a repository
 * never touches user-level agent configuration by accident.
 */
export const TARGET_ALIASES = {
  project: { base: "cwd", path: ".agents/skills" },
  agents: { base: "cwd", path: ".agents/skills" },
  user: { base: "home", path: ".agents/skills" },
  claude: { base: "cwd", path: ".claude/skills" },
  "claude-user": { base: "home", path: ".claude/skills" },
  codex: { base: "home", path: ".codex/skills" },
  "codex-project": { base: "cwd", path: ".codex/skills" },
};

export const DEFAULT_TARGET = "project";

export function resolveTarget(value = DEFAULT_TARGET, { cwd = process.cwd(), home = homedir() } = {}) {
  if (!value) return { dir: join(cwd, ".agents/skills"), alias: DEFAULT_TARGET };

  const alias = TARGET_ALIASES[value];
  if (alias) {
    const base = alias.base === "home" ? home : cwd;
    return { dir: join(base, ...alias.path.split("/")), alias: value };
  }

  let expanded = value;
  if (expanded === "~") expanded = home;
  else if (expanded.startsWith("~/") || expanded.startsWith("~\\")) expanded = join(home, expanded.slice(2));

  const dir = isAbsolute(expanded) ? expanded : resolve(cwd, expanded);
  return { dir, alias: null };
}

export function isInside(parent, child) {
  const normalizedParent = resolve(parent);
  const normalizedChild = resolve(child);
  return normalizedChild === normalizedParent || normalizedChild.startsWith(normalizedParent + sep);
}
