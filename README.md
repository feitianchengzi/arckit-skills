# Arckit Skills

Arckit 可安装 skill 的独立源仓库。Skill 按能力域平铺组织，每个域目录下直接是 skill 目录，不设 `skills/` 中间层。

## 目录

```text
entry/       状态驱动入口与 development ledger
definition/  产品、交互、视觉和技术稳定事实维护，_arckit_shared/ 为共享契约
memory/      原始输入与显式按需的未决上下文维护
engineering/ 技术栈无关的工程诊断
code/        语言、框架、平台、SDK 与云服务 coding skills
delivery/    发布、分支与交付触发
```

每个 skill 目录都必须包含 `SKILL.md`，目录名与 frontmatter 的 `name` 一致。

## 安装

无需克隆仓库，直接通过 npx 运行：

```bash
# 已发布到 npm 时
npx arckit-skills

# 直接从 GitHub 运行（未发布也可用）
npx github:feitianchengzi/arckit-skills
```

> 供 AI Agent 或自动化脚本使用的非交互说明见 [INSTALL.md](INSTALL.md)：包含完整参数、校验命令、卸载与错误处理。

默认进入交互安装，会依次提示：

| 提示 | 选项 | 说明 |
| --- | --- | --- |
| 目标智能体 | **`.agents`（通用，默认）** | `./.agents/skills`，Codex、Cursor、Gemini CLI、GitHub Copilot、Cline、OpenCode 等可直接读取 |
| | **Claude Code** | `./.claude/skills`，Claude Code 专用，不读取 `.agents` |
| 安装范围 | **个人** | `~/.agents/skills` 或 `~/.claude/skills`（取决于上一步） |
| | **项目** | `./.agents/skills` 或 `./.claude/skills`（取决于上一步） |
| 目录结构 | **平铺** | 每个 skill 直接位于目标目录下，agent 可直接发现（推荐） |
| | **保持结构** | 保留 `entry/`、`definition/`、`code/` 等能力域分组 |

平铺安装会把 `definition/_arckit_shared/` 内嵌到同域的每个 skill 中，并改写 `../_arckit_shared/` 链接，因此单个 skill 目录自包含。

非交互环境或脚本中使用参数跳过提示：

```bash
npx arckit-skills install --project --flat --yes           # 默认：.agents + 项目 + 平铺
npx arckit-skills install --agent claude --personal --flat # 安装给 Claude Code
npx arckit-skills install --structured --only arckit-spec
npx arckit-skills install --domain definition,code
npx arckit-skills list
npx arckit-skills uninstall --project --only arckit-spec
```

常用参数：

| 参数 | 说明 |
| --- | --- |
| `--agents` | 安装到 `.agents/skills`，等价于 `--agent agents`（默认） |
| `--agent <agents\|claude>` | 选择目标智能体目录约定，默认 `agents` |
| `--personal` / `--project` | 安装到个人目录或当前项目目录（与 `--target` 互斥） |
| `--flat` / `--structured`（`--keep`） | 平铺或保持能力域结构 |
| `--target <alias\|path>` | 直接指定目标目录，覆盖智能体与范围选择 |
| `--only <name[,name]>` / `--domain <name[,name]>` | 只安装指定 skill 或能力域 |
| `--source <path>` | 指定 skill 源目录（默认使用包内 skills） |
| `--force` | 覆盖非本工具安装的同名目录 |
| `--dry-run` | 只输出安装计划 |
| `--yes` / `-y` | 非交互确认，默认「`.agents` + 项目 + 平铺」 |

安装清单写入目标目录下的 `.arckit-skills.json`，卸载和布局切换都以清单为准；从平铺切到保持结构时，旧布局副本会被自动清理。

支持的安装目标：

| `--agent` | 个人 | 项目 |
| --- | --- | --- |
| `agents`（默认） | `~/.agents/skills` | `./.agents/skills` |
| `claude` | `~/.claude/skills` | `./.claude/skills` |

## `.agents` 兼容性

`.agents/skills` 是跨智能体的通用 skill 目录约定。下列常用智能体可直接读取（以各项目官方文档和 [skills.sh agents 清单](https://github.com/vercel-labs/skills/blob/main/docs/agents.md) 为准，2026-11 核对）：

| 智能体 | 项目级 | 个人级 |
| --- | --- | --- |
| Codex | `.agents/skills` | `~/.agents/skills` |
| Cursor | `.agents/skills` | `~/.agents/skills` |
| Gemini CLI | `.agents/skills` | `~/.agents/skills` |
| Cline | `.agents/skills` | `~/.agents/skills` |
| OpenCode | `.agents/skills` | `~/.agents/skills` |
| Kilo Code | `.agents/skills` | `~/.kilo/skills` |
| Zed、Warp | `.agents/skills` | `~/.agents/skills` |
| Amp | `.agents/skills` | `~/.config/agents/skills` |
| GitHub Copilot | `.agents/skills` | `~/.copilot/skills` |
| Antigravity | `.agents/skills` | `~/.gemini/antigravity/skills` |
| Droid | `.agents/skills` | `~/.factory/skills` |
| Claude Code | `.claude/skills` | `~/.claude/skills` |

要点：

- **项目级 `.agents/skills` 覆盖最广**，Codex、Cursor、Gemini CLI、GitHub Copilot、Cline、OpenCode、Kilo Code、Zed、Warp、Amp、Antigravity、Droid、Deep Agents、Firebender、Replit 等均支持。
- **个人级 `~/.agents/skills`** 已确认支持 Codex、Cursor、Gemini CLI、Cline、OpenCode、Zed、Warp、Kimi Code CLI 等；部分智能体的个人目录不同（见上表），这类场景请用 `--target` 指定。
- **Claude Code 不读取 `.agents/skills`**，只读取 `.claude/skills` 与 `~/.claude/skills`。给 Claude Code 安装时使用 `--agent claude`。
- 智能体版本迭代较快，安装前建议用目标智能体文档复核其支持的 skill 目录。

## 在主仓库中使用

Arckit 通过 submodule 引入本仓库：

```bash
git submodule add https://github.com/feitianchengzi/arckit-skills.git vendor/arckit-skills
```

更新到已发布的 skill 版本：

```bash
git submodule update --remote vendor/arckit-skills
```

也可以直接安装 submodule 中的 skills：

```bash
npx arckit-skills install --project --flat --source vendor/arckit-skills
```

## 开发

```bash
npm test
npm start                 # 等价于 node bin/arckit-skills.mjs
node bin/arckit-skills.mjs list
```

## License

Apache License 2.0。见 `LICENSE` 与 `NOTICE`。
