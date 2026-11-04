# 语义事项命令交接

首次构造不变量判断、发现反证或恢复 `upheld` 时读取[软件不变量的判断与事实维护](invariant-assessment.md)。选择前显式考虑当前完整目录，提交时按各自动态定义的责任更新；不变量是必须的保障，不是全部候选来源。`reason` 明确具体适用对象、证据支持范围和未决部分，不以笼统“验证通过”覆盖多个判断。

当宿主输出模式声明 `arckit-semantic-case-command/v1` 时使用本契约。智能体生成业务语义，可信账本生成权威记账数据；运行时只传输和投影。

## 智能体必须声明

- `case_id` 与绑定当前事项的 `selection.snapshot_token`。
- 完整的已持久化候选比较、唯一 `selected_ref`，以及本轮实际发现的新候选。
- 本轮目标、一个验收主张、事实、缺口、影响、项目决策与不变量变化、完整不变量判断、证据和 `unresolved` 语义。
- 每条关系的方向与类型。脚本不会根据 `statement`、`reason`、路径或空字段猜测关系。

## 选中缺口主张

选择说明使用 `goal`、`reason`、优先级依据、证据要求与必填 `planned_transition.selection_assessment` 表达有界验收集合、局部前置和结论性质。`selection_assessment` 使用与直接提交 v8 相同的结构，`invariant_refs` 是当前目录的原始标识；结构见[选择说明模式](../schema/selection-assessment.schema.json)。事实、项目决策变化和影响必须来自当前缺口已经建立的结论；相关低风险结果可以共同决定和验收，但不能合并重要独立取舍，也不能将建立预期与正式兑现合并。完整不变量判断可以保留其他相关缺口未解决，不要求本轮全部为 `upheld`。


- 普通事项缺口未验收完成时允许 `round_outcome: partial`、`claim.resolve_selected_gap: null`，提交已有事实和证据并保留同一缺口；不得为通过校验虚报完成或新增替代缺口。
- 普通事项缺口的完成使用 `claim.resolve_selected_gap`；完成复审候选是账本派生的审查门禁，不是可由该字段关闭的普通缺口。
- 选择完成复审候选时，`resolve_selected_gap` 必须为 `null`，事项内容变更数组必须为空；只用 `completion_review_result` 提交 `clean`/`findings`/`needs_human`，或只用 `review_budget_extension` 提交人工授权，两者不能同轮出现。
- 复审问题由 `completion_review_result.findings` 声明并由账本派生后续普通修复缺口。修复和事实变化在重新读取最新状态后选择该普通缺口的下一轮提交，不能与复审合并。

## 带类型引用

- 新实体使用命令内局部句柄：`local:fact:<handle>`、`local:gap:<handle>`、`local:impact:<handle>`、`local:project-gap:<handle>`、`local:invariant:<handle>`。
- 既有事项实体使用：`case:fact:<id>`、`case:gap:<id>`、`case:impact:<id>`。
- 项目目标使用：`project:decision:<id>`、`project:invariant:<id>`、`project:project-gap:<id>`。
- `derived_from` 的协议来源使用 `system:<source>`；新增事实或缺口关系仍使用对应的带类型引用。
- 局部句柄只在当前命令内建立显式关系，不是权威标识提示。账本返回的回执才包含权威映射。

## 智能体不生成

- 新实体权威标识、事实修订号、事项 `updated_at` 或项目修订号。
- 选中缺口的复制对象或完成后的事项状态、交接。
- 项目决策的观察修订号或更新后修订号。
- `Project Gap.affects` 已声明关系的 `decision_area.gap_refs` 反向副本。
- 内部 `arckit-case-transition/v8`。

## 账本物化

可信写回在同一项目提交锁内验证快照与候选的时效性，解析带类型引用，分配标识与修订号，重建权威候选，展开反向索引，编译 v8，对完整投影状态预检并原子提交。任何缺失的业务 `target`、`effect`、`disposition`、`responsibility` 或关系都必须拒绝，不得自动补义。

物化器在编译内部状态转换前校验选中候选、命令内身份与动作一致性，并验证本轮主张形成的事项、项目投影仍满足确定性闭包：智能体主张冲突返回可修复的 `claim_invalid`；只有确定性物化或内部实现自身失败才归账本责任。

成功结果返回 `arckit-semantic-command-receipt/v1`、内部状态转换结果、`arckit-round-closeout/v2` 与提交后快照令牌。下一缺口仍只来自独立的最新状态读取。

## 复审问题的修复义务引用

复审不新增普通缺口。`invariant_assessment.gap_refs` 可以显式引用本次 `completion_review_result.findings` 中已声明的 `local:review-finding:<handle>`；账本将它物化为该问题实际派生的开放修复缺口。未知句柄仍拒绝，智能体不预测缺口标识，也不降低 `threatened`/`undetermined` 判断来绕过提交。

## 契约与运行版本

宿主从当前可信账本能力清单的 `agent_contracts` 读取模式与本说明；修复源码不等于当前运行副本已更新。使用快照的 `selection_tokens[case_id]` 提交所选事项，顶层 `snapshot_token` 是快照观察凭据，不能与选择令牌互换。引用格式错误属于主张修复；真实状态过期需要重新读取最新状态；当前可信实现不能表达合法主张时保留原主张、证据、拒绝和实际能力路径，交回能力故障，不改写为业务已完成。
