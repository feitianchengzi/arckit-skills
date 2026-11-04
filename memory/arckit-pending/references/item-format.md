# 未决事项工作区与事项格式

在创建、更新、归档、合并或提升未决事项时读取本文件。

## 工作区

```text
arckit/pending/
  INDEX.md
  items/
    YYYY-MM-DD-short-slug.md
  archive/
    YYYY-MM-DD-short-slug.md
```

活跃事项放在 `items/`。`closed`、`rejected`、`merged` 或 `stale` 内容移入 `archive/`，除非用户明确要求硬删除。

## 状态与类型

有效 `State`：

- `open`：仍未解决。
- `parked`：已记录，当前无动作。
- `watching`：等待相关信号。
- `candidate`：条件满足后可能成为已承诺工作。
- `promoted`：已进入正式产物或任务。
- `merged`：已并入另一个未决事项。
- `closed`：已明确放弃。

优先使用的 `Type`：`product`、`workflow`、`tool`、`agent`、`technical`、`content`、`operation`、`process_handoff`。

`Decision` 表示当前判断，不等于生命周期状态，例如“仅记录，暂不执行”或“等待补充证据”。

## 事项模板

以下模板中的 `State`、`Type`、`Source`、`Created`、`Updated`、`Decision` 保留为字段名；自然语言栏目使用中文。

```markdown
# 简短标题

## 状态

- State: parked
- Type: workflow
- Source: 用户对话或具体路径
- Created: YYYY-MM-DD
- Updated: YYYY-MM-DD
- Decision: 仅记录，暂不执行

## 背景

该事项为什么存在。

## 未决事项

尚未解决的想法、问题、方向或讨论分支。

## 当前判断

当前判断，以及为什么现在不执行或不能进入稳定事实源。

## 证据与不确定性

### 已接受事实

- 已由用户或可信来源确认的事实。

### 假设

- 尚未确认的假设。

### 缺口

- 开放问题和待补证据。

### 风险

- 主要风险。

## 重访条件

- 可观察、可判断的重访条件。

## 相关范围

- `path/or/module`

## 备注

- 后续讨论更新。

## 处理结果

提升、合并或关闭后填写。
```

`process_handoff` 可按需增加来源技能、候选接收能力、来源引用、已拒绝候选和建议下一步。建议不自动触发接收方；提升时仅携带已确认内容。

## 索引格式

```markdown
# 未决事项

手动记录的项目级未决上下文；不代表待办工作或执行承诺。

| 事项 | `State` | `Type` | `Updated` | 摘要 | 重访条件 |
|---|---|---|---:|---|---|
| [简短标题](items/YYYY-MM-DD-short-slug.md) | parked | workflow | YYYY-MM-DD | 一句话摘要。 | 重访条件。 |

## 已归档

| 事项 | `State` | `Type` | `Updated` | 处理结果 |
|---|---|---|---:|---|
| [已关闭事项](archive/YYYY-MM-DD-closed-item.md) | closed | workflow | YYYY-MM-DD | 一句话结果。 |
```

## 生命周期规则

- 新增：一个主题一个事项；保留必要原话并添加结构化摘要。
- 更新：刷新 `Updated`，同步 `INDEX.md`，不重写来源事实。
- 归档：移动文件并更新“已归档”表。
- 合并：目标事项保留合并来源，原事项标为 `merged` 并写“处理结果”。
- 提升：先写清目标产物/任务和日期；接收方独立判断，未确认内容继续留在未决事项中。
- 硬删除：仅删除用户再次确认的具体路径，并同步 `INDEX.md`。
