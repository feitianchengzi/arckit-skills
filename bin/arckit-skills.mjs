#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, sep } from "node:path";

import { defaultSource, loadCatalog, selectShared, selectSkills } from "../lib/catalog.mjs";
import {
  applyInstall,
  applyUninstall,
  findConflicts,
  planInstall,
  planUninstall,
  readManifest,
  MANIFEST_NAME,
} from "../lib/install.mjs";
import { confirm, isInteractive, select } from "../lib/prompt.mjs";
import { AGENTS, DEFAULT_AGENT, resolveScopeTarget, resolveTarget } from "../lib/targets.mjs";
import { color, fail, heading, info, table, warn } from "../lib/ui.mjs";

const VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

const HELP = `Arckit Skills v${VERSION}

用法:
  npx arckit-skills [install] [选项]
  npx arckit-skills list [选项]
  npx arckit-skills uninstall [选项]

命令:
  install, add                 安装 skills（默认命令，可交互选择）
  list, ls                     列出可用 skills
  uninstall, remove, rm        卸载已安装 skills
  help                         显示帮助

安装选项:
  --personal                   安装到个人目录（交互模式下会提示选择）
  --project                    安装到当前项目目录
  --flat                       平铺：每个 skill 直接位于目标目录下
  --structured, --keep         保持结构：按能力域分组
  --target <alias|path>        直接指定目标目录，覆盖范围选择
  --agents                     安装到 .agents/skills（等价 --agent agents，默认）
  --agent <agents|claude>      目标智能体目录约定，默认 agents
  --only <name[,name]>         只安装指定 skills，可重复
  --domain <name[,name]>       只安装指定能力域，可重复
  --source <path>              指定 skill 源目录
  --force                      覆盖非本工具安装的同名目录
  --dry-run                    只显示安装计划，不写入文件
  --yes, -y                    非交互确认，使用默认选择（.agents + 项目 + 平铺）

.agents 兼容性:
  项目级 .agents/skills 可被 Codex、Cursor、Gemini CLI、GitHub Copilot、Cline、
  OpenCode、Kilo Code、Zed、Warp、Amp、Antigravity、Droid 等读取。
  个人级 ~/.agents/skills 可被 Codex、Cursor、Gemini CLI、Cline、OpenCode 等读取。
  Claude Code 只读取 .claude/skills，请使用 --agent claude。

示例:
  npx arckit-skills
  npx arckit-skills install --project --flat --only arckit-spec
  npx arckit-skills list
  npx github:feitianchengzi/arckit-skills
`;

function splitList(value) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseArgs(argv) {
  const args = {
    _: [],
    names: [],
    domains: [],
    agent: DEFAULT_AGENT,
    agentExplicit: false,
    force: false,
    dryRun: false,
    yes: false,
    help: false,
    version: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (raw === "--") {
      args._.push(...argv.slice(index + 1));
      break;
    }

    const eq = raw.startsWith("--") ? raw.indexOf("=") : -1;
    const name = eq === -1 ? raw : raw.slice(0, eq);
    const inline = eq === -1 ? undefined : raw.slice(eq + 1);
    const value = () => {
      if (inline !== undefined) return inline;
      const next = argv[++index];
      if (next === undefined) throw new Error(`${name} 需要一个参数`);
      return next;
    };

    switch (name) {
      case "-h":
      case "--help":
        args.help = true;
        break;
      case "-v":
      case "--version":
        args.version = true;
        break;
      case "-y":
      case "--yes":
        args.yes = true;
        break;
      case "--force":
        args.force = true;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--personal":
      case "--user":
        args.scope = "personal";
        break;
      case "--project":
        args.scope = "project";
        break;
      case "--flat":
        args.layout = "flat";
        break;
      case "--structured":
      case "--keep":
      case "--preserve":
        args.layout = "structured";
        break;
      case "--all":
        break;
      case "--source":
        args.source = value();
        break;
      case "--target":
        args.target = value();
        break;
      case "--agents":
        args.agent = "agents";
        args.agentExplicit = true;
        break;
      case "--agent":
        args.agent = value();
        args.agentExplicit = true;
        break;
      case "--only":
      case "--skill":
        args.names.push(...splitList(value()));
        break;
      case "--domain":
        args.domains.push(...splitList(value()));
        break;
      default:
        if (name.startsWith("-")) throw new Error(`未知选项: ${name}`);
        args._.push(raw);
    }
  }

  if (!AGENTS[args.agent]) {
    throw new Error(`未知 agent: ${args.agent}。可选: ${Object.keys(AGENTS).join(", ")}`);
  }
  if (args.scope && args.target) {
    throw new Error("--target 不能与 --personal/--project 同时使用");
  }
  return args;
}

function displayPath(path) {
  const home = homedir();
  if (path === home) return "~";
  if (path.startsWith(home + sep)) return `~${path.slice(home.length)}`;
  const cwd = process.cwd();
  if (path === cwd) return ".";
  if (path.startsWith(cwd + sep)) return `.${path.slice(cwd.length)}`;
  return path;
}

function scopeLabel(scope) {
  if (scope === "personal") return "个人";
  if (scope === "project") return "项目";
  return "自定义";
}

function layoutLabel(layout) {
  return layout === "structured" ? "保持结构" : "平铺";
}

function describeSource(catalog) {
  return catalog.root === defaultSource() ? `${catalog.root}${color.dim("（内置）")}` : catalog.root;
}

function banner(catalog) {
  info(`${color.bold("Arckit Skills")} ${color.dim(`v${VERSION}`)}`);
  info(color.dim(`源: ${describeSource(catalog)}`));
  info(color.dim(`可用: ${catalog.skills.length} 个 skill · ${catalog.shared.length} 个共享目录`));
}

async function chooseAgent(args) {
  if (args.target || args.agentExplicit) return args.agent;
  if (!isInteractive() || args.yes) return args.agent;

  return select({
    message: "目标智能体",
    options: [
      {
        value: "agents",
        label: ".agents（通用）",
        description: ".agents/skills；Codex、Cursor、Gemini CLI、Copilot、Cline、OpenCode 等可读取",
      },
      {
        value: "claude",
        label: "Claude Code",
        description: ".claude/skills；Claude Code 专用（不读取 .agents）",
      },
    ],
    defaultIndex: 0,
  });
}

async function chooseScope(args, agent) {
  if (args.scope) return args.scope;
  if (args.target) return null;

  const canAsk = isInteractive() && !args.yes;
  if (!canAsk) {
    if (args.yes) return "project";
    throw new Error("无法确定安装范围：非交互环境请使用 --personal/--project（或 --target）。");
  }

  const personal = resolveScopeTarget("personal", { agent });
  const project = resolveScopeTarget("project", { agent });
  return select({
    message: "安装范围",
    options: [
      {
        value: "personal",
        label: "个人",
        description: `${displayPath(personal.dir)}，本机所有项目可用`,
      },
      {
        value: "project",
        label: "项目",
        description: `${displayPath(project.dir)}，只对当前仓库生效`,
      },
    ],
    defaultIndex: 1,
  });
}

async function chooseLayout(args) {
  if (args.layout) return args.layout;
  if (args.yes) return "flat";
  if (!isInteractive()) {
    throw new Error("无法确定目录结构：非交互环境请使用 --flat 或 --structured。");
  }

  return select({
    message: "目录结构",
    options: [
      {
        value: "flat",
        label: "平铺",
        description: "所有 skill 直接放在目标目录，agent 可直接发现（推荐）",
      },
      {
        value: "structured",
        label: "保持结构",
        description: "保留 entry/definition/code 等能力域分组，适合归档或自定义分发",
      },
    ],
    defaultIndex: 0,
  });
}

function printPlan(plan, { target, layout, scope }) {
  heading("安装计划");
  info(`  ${color.dim("目标")}  ${target.dir} ${color.dim(`(${scopeLabel(scope)} · ${layoutLabel(layout)})`)}`);

  const byDomain = new Map();
  for (const item of plan) {
    if (item.kind !== "skill") continue;
    if (!byDomain.has(item.domain)) byDomain.set(item.domain, []);
    byDomain.get(item.domain).push(item.name);
  }
  const rows = [...byDomain.entries()].map(([domain, names]) => [domain, String(names.length), names.join(", ")]);
  info(table(rows, { head: ["能力域", "数量", "Skills"], maxDescription: 88 }));

  const sharedCount = plan.filter((item) => item.kind === "shared").length;
  const embedded = plan.reduce((count, item) => count + (item.embeds?.length ?? 0), 0);
  info(
    color.dim(
      `  共 ${plan.length} 个目录` +
        (sharedCount ? `（含 ${sharedCount} 个共享目录）` : "") +
        (embedded ? `，共享资源已内嵌到 ${plan.filter((item) => item.embeds?.length).length} 个 skill` : ""),
    ),
  );
}

async function runInstall(args, extraNames = []) {
  const catalog = loadCatalog({ source: args.source });
  banner(catalog);

  const names = [...args.names, ...extraNames];
  const skills = selectSkills(catalog, { names, domains: args.domains });
  const shared = selectShared(catalog, skills);

  const agent = await chooseAgent(args);
  const scope = await chooseScope(args, agent);
  const target = args.target ? resolveTarget(args.target) : resolveScopeTarget(scope, { agent });
  const layout = await chooseLayout(args);

  const plan = planInstall(catalog, { skills, shared, layout, targetDir: target.dir });
  printPlan(plan, { target, layout, scope: scope ?? inferScope(target) });

  if (args.dryRun) {
    info(color.dim("\n--dry-run：未写入任何文件。"));
    return;
  }

  const conflicts = args.force ? [] : findConflicts(plan);
  const previous = readManifest(target.dir);
  const tracked = new Set((previous?.items ?? []).map((item) => item.path));
  const untracked = conflicts.filter((item) => !tracked.has(item.path));
  let force = args.force;

  if (untracked.length > 0) {
    warn(`目标目录已存在 ${untracked.length} 个非本工具管理的同名目录：`);
    for (const item of untracked.slice(0, 8)) info(`    ${item.path}`);
    if (untracked.length > 8) info(color.dim(`    … 另有 ${untracked.length - 8} 个`));

    if (!isInteractive() || args.yes) {
      throw new Error("不会覆盖非本工具安装的目录。确认覆盖请加 --force。");
    }
    const overwrite = await confirm({ message: "覆盖这些已存在的目录？", defaultIndex: 1 });
    if (!overwrite) {
      info("已取消。");
      return;
    }
  }

  // 已存在的内容：本工具安装过的直接升级，用户确认过的也覆盖。
  if (conflicts.length > 0) force = true;

  if (isInteractive() && !args.yes) {
    const resolvedScope = scope ?? inferScope(target);
    const confirmed = await confirm({
      message: `安装 ${plan.length} 个目录到${resolvedScope ? `（${scopeLabel(resolvedScope)}）` : ""} ${target.dir}？`,
      defaultIndex: 0,
    });
    if (!confirmed) {
      info("已取消。");
      return;
    }
  }

  const { removed } = applyInstall(plan, {
    targetDir: target.dir,
    catalog,
    layout,
    scope: scope ?? inferScope(target),
    agent: args.target ? inferAgent(target) : agent,
    force,
  });

  info("");
  info(`${color.green("✔")} 已安装 ${plan.length} 个目录到 ${target.dir}`);
  for (const stale of removed) info(color.dim(`  - 已清理旧布局副本 ${stale}`));
  info(color.dim(`  清单: ${join(target.dir, MANIFEST_NAME)}`));
  if (layout === "structured" && (target.alias ?? "").startsWith("claude")) {
    warn("保持结构不会改变 agent 的发现规则；若 agent 只扫描目标目录下一层，请改用平铺。");
  }
}

function inferScope(target) {
  if (!target.alias) return null;
  if (target.alias.endsWith("-user") || target.alias === "user") return "personal";
  return "project";
}

function inferAgent(target) {
  if (!target.alias) return null;
  return target.alias.startsWith("claude") ? "claude" : "agents";
}

function runList(args, extraNames = []) {
  const catalog = loadCatalog({ source: args.source });
  const filter = new Set([...args.names, ...extraNames]);
  let skills = catalog.skills;
  if (filter.size > 0) {
    const unknown = [...filter].filter((name) => !skills.some((skill) => skill.name === name));
    if (unknown.length > 0) throw new Error(`Unknown skill: ${unknown.join(", ")}`);
    skills = skills.filter((skill) => filter.has(skill.name));
  }

  banner(catalog);
  info("");
  info(table(
    skills.map((skill) => [skill.domain, skill.name, skill.description]),
    { head: ["能力域", "Skill", "说明"] },
  ));
}

async function runUninstall(args, extraNames = []) {
  const names = [...args.names, ...extraNames];
  let scope = args.scope;
  let target;

  if (args.target) {
    target = resolveTarget(args.target);
  } else {
    if (!scope) {
      if (!isInteractive() || args.yes) {
        if (!args.yes) throw new Error("请使用 --personal/--project（或 --target）指定卸载目标。");
        scope = "project";
      } else {
        const personal = resolveScopeTarget("personal", { agent: args.agent });
        const project = resolveScopeTarget("project", { agent: args.agent });
        scope = await select({
          message: "卸载范围",
          options: [
            { value: "personal", label: "个人", description: displayPath(personal.dir) },
            { value: "project", label: "项目", description: displayPath(project.dir) },
          ],
          defaultIndex: 1,
        });
      }
    }
    target = resolveScopeTarget(scope, { agent: args.agent });
  }

  const { manifest, items } = planUninstall(target.dir, { names });
  if (!manifest) {
    info(`${color.dim("未找到安装清单:")} ${join(target.dir, MANIFEST_NAME)}`);
    info("该目录不是由 arckit-skills 安装的，未做任何修改。");
    return;
  }
  if (items.length === 0) {
    info("没有匹配的可卸载项。");
    return;
  }

  heading("卸载计划");
  info(`  ${color.dim("目标")}  ${target.dir}`);
  for (const item of items) info(`  - ${item.path}`);

  if (isInteractive() && !args.yes) {
    const confirmed = await confirm({ message: `卸载 ${items.length} 个目录？`, defaultIndex: 1 });
    if (!confirmed) {
      info("已取消。");
      return;
    }
  }

  const remaining = applyUninstall(target.dir, { manifest, items });
  info(`${color.green("✔")} 已卸载 ${items.length} 个目录`);
  if (remaining.length > 0) info(color.dim(`  清单保留 ${remaining.length} 项`));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    info(HELP);
    return;
  }
  if (args.version) {
    info(VERSION);
    return;
  }

  const [command = "install", ...rest] = args._;
  switch (command) {
    case "install":
    case "add":
      await runInstall(args, rest);
      return;
    case "list":
    case "ls":
      runList(args, rest);
      return;
    case "uninstall":
    case "remove":
    case "rm":
      await runUninstall(args, rest);
      return;
    case "help":
      info(HELP);
      return;
    default:
      throw new Error(`未知命令: ${command}\n运行 npx arckit-skills --help 查看用法。`);
  }
}

main().catch((error) => {
  if (error?.code === "CANCELLED") {
    process.exitCode = 130;
    return;
  }
  fail(error?.message ?? String(error));
  if (process.env.ARCKIT_DEBUG) console.error(error);
  process.exitCode = 1;
});
