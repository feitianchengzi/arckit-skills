# Agent Install Guide

> 本文供 AI Agent / 自动化脚本阅读，用于**非交互**安装 Arckit skills。
> 人类用户请先读 [README.md](README.md)。

目标：把本仓库的 skills 安装到目标智能体可发现的目录，过程可重复、可校验、可卸载。

## 1. 硬性规则

1. **禁止运行裸命令** `npx arckit-skills`：它会进入交互选择并阻塞。必须携带完整参数。
2. **必须带 `--yes`**：即使当前 shell 是非 TTY，也统一使用 `--yes`，保证行为确定。
3. **禁止自动使用 `--force`**：遇到同名目录冲突时停止，把 stderr 和冲突路径报告给用户，由用户决定。
4. **禁止手工创建/删除 skill 目录，禁止编辑 `.arckit-skills.json`**：安装、升级、卸载都通过 CLI 完成。
5. **未经用户明确要求，不要安装到个人目录**（`--personal`）；默认只安装到当前项目。
6. 安装完成后**必须执行第 5 节校验**，并报告实际命令、目标目录和条目数量。

## 2. 参数决策表

默认组合（用户未指定时使用）：

```text
--project --flat --agent agents --yes
```

| 用户意图 | 追加/替换参数 |
| --- | --- |
| 默认：当前项目、跨智能体通用目录 | `--project --flat --agents --yes` |
| 安装给 Claude Code | `--project --flat --agent claude --yes` |
| 安装到个人目录（本机所有项目） | `--personal --flat --agents --yes` |
| 按能力域安装 | 追加 `--domain definition,code` |
| 只装指定 skills | 追加 `--only arckit-spec,arckit-tech` |
| 安装到自定义目录 | 用 `--target <path>` 替换 `--project/--personal` |
| 技能来自项目内 submodule | 追加 `--source vendor/arckit-skills` |
| 用户明确要求保留能力域结构 | 把 `--flat` 换成 `--structured` |

约束：

- `--target` 不能与 `--personal` / `--project` 同时使用。
- `--agents` 等价于 `--agent agents`。
- 未指定 `--only` / `--domain` 时安装全部 skills。
- 除用户明确要求外，一律使用 `--flat`；部分智能体不扫描嵌套目录。

## 3. 标准安装命令

优先使用 GitHub 直连形式（无需发布到 npm）：

### 3.1 项目级通用安装（默认，推荐）

```bash
npx github:feitianchengzi/arckit-skills install --project --flat --agents --yes
```

安装到 `<repo>/.agents/skills/<skill>/SKILL.md`。Codex、Cursor、Gemini CLI、GitHub Copilot、Cline、OpenCode、Kilo Code、Zed、Warp、Amp、Antigravity、Droid 等可读取。

### 3.2 安装给 Claude Code

```bash
npx github:feitianchengzi/arckit-skills install --project --flat --agent claude --yes
```

安装到 `<repo>/.claude/skills/`。**Claude Code 不读取 `.agents/skills`**。

### 3.3 个人目录

```bash
npx github:feitianchengzi/arckit-skills install --personal --flat --agents --yes
```

安装到 `~/.agents/skills/`。仅在用户明确要求“全局/个人/所有项目可用”时执行。

### 3.4 只安装部分 skills

```bash
# 按名称
npx github:feitianchengzi/arckit-skills install --project --flat --agents \
  --only arckit-spec,arckit-tech --yes

# 按能力域
npx github:feitianchengzi/arckit-skills install --project --flat --agents \
  --domain definition,code --yes
```

能力域：`entry`、`definition`、`memory`、`engineering`、`code`、`delivery`。

### 3.5 自定义目标目录

```bash
npx github:feitianchengzi/arckit-skills install \
  --target path/to/agent/skills --flat --yes
```

### 3.6 来自项目内 submodule

```bash
npx github:feitianchengzi/arckit-skills install \
  --project --flat --agents --source vendor/arckit-skills --yes
```

## 4. 安装目录

| `--agent` | `--project` | `--personal` |
| --- | --- | --- |
| `agents`（默认） | `./.agents/skills` | `~/.agents/skills` |
| `claude` | `./.claude/skills` | `~/.claude/skills` |

布局：

- `--flat`：`<target>/<skill-name>/SKILL.md`（推荐，agent 可直接发现）。
- `--structured`：`<target>/<domain>/<skill-name>/SKILL.md`，保留能力域分组。
- 平铺布局会把 `definition/_arckit_shared/` 内嵌进同域 skill，并改写相对链接。

## 5. 安装后校验（必须执行）

以默认项目级安装为例，读取清单并逐项检查路径是否存在：

```bash
node -e "const fs=require('fs'),path=require('path');const p=process.argv[1];const m=JSON.parse(fs.readFileSync(p,'utf8'));const root=path.dirname(p);const missing=m.items.filter(i=>!fs.existsSync(path.join(root,...i.path.split('/'))));console.log(JSON.stringify({layout:m.layout,scope:m.scope,agent:m.agent,items:m.items.length,missing:missing.map(i=>i.path)}));process.exit(missing.length?1:0)" .agents/skills/.arckit-skills.json
```

成功输出形如：

```json
{"layout":"flat","scope":"project","agent":"agents","items":15,"missing":[]}
```

最小成功标准（全部满足才算完成）：

1. 安装命令退出码为 `0`；
2. 目标目录下存在 `.arckit-skills.json`；
3. 清单 `items.length > 0` 且 `missing` 为空；
4. 至少抽查一个 skill：`<target>/<skill-name>/SKILL.md` 可读。

需要查看可用名称时执行：

```bash
npx github:feitianchengzi/arckit-skills list
```

## 6. 升级 / 重装

重复执行同一安装命令即可。工具以 `.arckit-skills.json` 为准：

- 已由本工具安装的同名目录会被更新；
- 平铺与保持结构互相切换时，旧布局副本会被自动清理；
- 不会删除本次未选中的其他已安装 skills。

## 7. 卸载

```bash
# 卸载当前项目下由本工具安装的全部 skills
npx github:feitianchengzi/arckit-skills uninstall --project --agents --yes

# 只卸载指定 skills
npx github:feitianchengzi/arckit-skills uninstall --project \
  --only arckit-spec,arckit-tech --yes

# 卸载个人目录
npx github:feitianchengzi/arckit-skills uninstall --personal --agents --yes
```

只删除清单中记录的路径；没有清单时不做任何修改。

## 8. 退出码与错误处理

| 退出码 | 含义 | Agent 动作 |
| --- | --- | --- |
| `0` | 成功 | 继续执行第 5 节校验 |
| `1` | 参数、源目录或冲突错误 | 读取 stderr，按下表修正；不要盲目重试 |
| `130` | 用户取消（Ctrl+C） | 停止并询问用户 |

常见错误与处理：

| stderr 关键字 | 原因 | 处理 |
| --- | --- | --- |
| `无法确定安装范围` | 缺少范围参数且非交互 | 补 `--project` 或 `--personal`（并加 `--yes`） |
| `无法确定目录结构` | 缺少布局参数且非交互 | 补 `--flat` 或 `--structured` |
| `不会覆盖非本工具安装的目录` | 目标存在非本工具创建的同名目录 | 停止，向用户报告路径；仅在用户明确同意后加 `--force` |
| `Unknown skill` / `Unknown domain` | 名称写错 | 执行 `list` 获取准确名称 |
| `Skill source not found` | `--source` 路径不存在 | 去掉 `--source`（使用包内 skills）或修正 submodule 路径 |
| `Unknown agent` | `--agent` 取值错误 | 只能使用 `agents` 或 `claude` |

输出含 ANSI 颜色时，可设置 `NO_COLOR=1` 获取纯文本（仅在需要解析输出时）。

## 9. 完成后回复用户

报告以下信息，不要只回复“安装完成”：

```text
安装命令: <实际执行的完整命令>
目标目录: <绝对路径>
安装条目: <items.length> 个
校验结果: missing 为空 / 失败项
后续操作: 重启或重新加载目标智能体会话后生效
```
