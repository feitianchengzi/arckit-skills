# 案例缺口契约

当智能体判断某个动态缺口需要维护其事实域时，定义类技能进入托管案例（`managed-case`）模式。缺口只表达当前缺少的结果，不预先指定 `facet`、技能、文档路径或固定工作顺序；智能体依据完整的 `Case`、`Project`、实现和验证上下文动态选择所需能力。

## 输入

```yaml
case_gap:
  case_id: CASE-YYYYMMDD-NNN
  case_updated_at: "预期的 Case 修订版本"
  id: GAP-stable-id
  goal: "当前需要得到的结果"
  reason: "为什么它现在重要"
  derived_from: []
  blocked_by: []
  priority_basis: {}
  responsibility: agent | human | external
  evidence_required: []
  relevant_facts: []
  relevant_state_impacts: []
  context_refs: []
```

`case_gap` 是绑定特定 `Case` 修订版本的工作目标，不是写入台账的授权。技能必须先读取缺口与全部相关上下文，再判断自己的事实域是否需要查询、更新、确认既有事实或明确不适用；不得仅凭缺口标题、代码现状或文档现状推断结论。修订版本已变化时，旧结果只能作为候选证据。

## 动态工作原则

- 当前工作的先后顺序由智能体基于阻塞、风险、信息增益、依赖、用户影响和可验证性决定，定义类技能不规定固定阶段。该判断须遵守可信场景定义的局部前置：正式兑现所需预期先接受；探索不等于采纳；本轮建立或改变预期时不同时正式兑现实现。
- 维护某一事实域时，结论基于全部相关信息。清楚就是清楚，不清楚就保留在 `unresolved` 中；不创建“已清楚但与代码未对齐”一类中间状态。
- 如果缺口的可信完成需要改变本技能管理的稳定事实源，应在本次工作中更新；如果已有内容已充分表达，则确认既有事实；如果与该事实域无关，则明确不适用。
- 技能只完成当前缺口中属于自己的事实维护，不决定下一个缺口、不关闭 `Case`、不更新 `Project State` / `Case State`。智能体汇总工具和技能结果后形成一次 `transition`。
- 完成复核（`Completion Review`）只在普通缺口全部闭合后查缺补漏，按授权交付范围验证结果；不能把常规文档补齐推迟到复核。

## 输出

托管案例模式在原有 `document_scope` 之外输出：

```yaml
fact_result:
  schema_version: arckit-fact-result/v2
  mode: managed_case
  case_id: CASE-YYYYMMDD-NNN
  gap_id: GAP-stable-id
  outcome: updated | confirmed_existing | not_applicable | blocked | needs_human
  facts:
    - statement: "稳定事实"
      basis: "为什么可以接受"
      source_refs: []
      evidence: []
  unresolved: []
  human_decision_required: false
```

- `updated` 与 `confirmed_existing` 必须给出非空事实、来源和足以支持结论的证据。
- `not_applicable` 只说明当前缺口不需要该事实域，不会在 `Case` 中形成固定的 `not-required` 状态项。
- `blocked` 或 `needs_human` 必须说明 `unresolved`、责任和恢复所需信息。
- 技能不输出 `Case resolution`、`facet` 状态、`maturity`、`alignment`、后续缺口或 `Project impact`。

独立（`standalone`）模式没有 `case_gap`，继续直接维护或查询事实源；仍输出 `fact_result.mode: standalone`，`case_id` 与 `gap_id` 为空，但不形成台账声明。


## 交互与视觉探索的限定补充

交互/视觉技能同时支持候选产物时，按[设计产物结果契约](design-result-contract.md) 区分产物完成与正式事实影响。纯探索且没有正式事实判断时显式输出 `fact_result: null`，以 `exploration_result` 回传目标、产物、证据和当前必要决定；不得滥用 `updated`、`not_applicable` 或 `needs_human`。存在正式事实判断时继续使用上述 v2 结构。本补充不改变其他定义类技能的输出要求，不新增运行时或台账协议。

是否满足当前缺口、是否提交或续轮由同一智能体判断。跨域交接不规定执行者或轮次，同一结论的多个事实载体可以在当前授权与缺口范围内同步；独立新取舍回传智能体判断，不由专业技能自行扩展目标。
