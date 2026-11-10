# 收尾与交接

## 三层结果

`round_outcome` 说明本轮是否产生可接受结果；`case_resolution` 说明整个事项是否闭合；`project_state_delta` 说明本轮被接受事实对项目软件定义、软件不变量、项目缺口或选择上下文的直接影响。三者互不替代。

## 事项状态转换 v8

```yaml
schema_version: arckit-case-transition/v8
case_id: CASE-YYYYMMDD-NNN
case_updated_at: "预期事项修订号"
project_revision: 12
gap_selection:
  mode: candidate
  basis: "为何这是当前最重要的行动"
  snapshot_token: "可信快照中所选事项范围的令牌"
  selected_ref: "case-gap:CASE-...:GAP-..."
  comparison_summary: "已持久化候选与新发现候选的比较"
  fresh_discovery_summary: "实际发现了哪些新工作"
  considered: []
selected_gap: {}
planned_transition: { goal: "...", expected_state_change: "...", selection_assessment: { ... } }
accepted_state_delta:
  resolved_gap: null
  facts_added: []
  facts_superseded: []
  impacts_added: []
  impacts_updated: []
  gaps_added: []
  gaps_cancelled: []
  resolved_open_questions: []
  completed_handoffs: []
  completion_review_result: null
  resolved_review_findings: []
  review_budget_extension: null
project_state_delta:
  software_definition_changes: []
  software_invariant_changes: []
  project_gap_changes: []
  selection_context_change: null
  evidence: []
invariant_assessment:
  project_revision: 12
  judgments:
    - invariant_ref: technical-decisions-remain-explainable
      disposition: threatened
      reason: "新接受的事实暴露了一个尚未解决的技术契约问题。"
      fact_refs: [FACT-003]
      evidence: []
      gap_refs: [GAP-TECH-JUDGMENT]
evidence: []
unresolved: []
round_outcome: completed
case_resolution: { claimed_status: unresolved, reason: "..." }
```

`gap_selection.mode=candidate` 时，`selected_ref` 与 `selected_gap.id` 精确指向当前候选；`selected_gap.goal/reason` 允许智能体作不改变验收主张的自然语言转述，账本以快照令牌、事项修订号、稳定引用和当前就绪状态重新解析权威候选，并将权威内容写入轮次与收尾。`mode=fresh` 时，`selected_gap` 描述一个尚未持久化、由智能体负责、无未闭合依赖并在本轮完成的普通缺口。`considered` 覆盖选中事项范围的已持久化候选和本轮实际发现的新候选，恰好一项为 `selected`。两种模式都只关闭一个验收主张。`gaps_added` 只记录结果型未解决义务，不保存未来循环的执行步骤；新增缺口只能在下一次重新读取最新状态后被执行。关闭 `threatened`/`undetermined` 影响记录的最后一个承接缺口时，必须将该影响更新为 `upheld` 或绑定新缺口。

`selected_gap` 和 `planned_transition` 只能由本轮可信快照中已经接受的事实与决定直接支持。本轮 `facts_added` 可以证明选中缺口，也可以派生 `gaps_added`，但不能在同一状态转换中成为其他下游结果的执行依据；依赖这些事实的结果必须等收尾和提交后最新状态读取完成后重新选择。

`invariant_assessment` 必须覆盖观察到的项目修订版本中的全部软件不变量，且每项恰好一次。`not_relevant` 需要理由；`upheld` 需要持久证据；`threatened`/`undetermined` 需要已接受事实引用和写回后仍开放的事项缺口引用。它不代替 `state_impacts`：判断是每轮完整判断记录，影响是事项中实际受影响项目目标的持久关系。

应用成功返回 `arckit-round-closeout/v2`；只有该回执中的已接受增量、不变量判断与结果修订号可作为“本轮已接受”证据。其 `next_candidate_projection` 为 `null`，下一缺口只能来自独立的提交后快照。

项目增量不等待事项解决：长期结论在被澄清的当轮就更新对应软件决策；新事实使旧结论失效时标记 `stale` 并绑定项目缺口；任何被接受的缺口也可更新项目缺口和选择上下文。所有变更都绑定观察到的项目修订号，并在项目锁内与事项状态转换原子提交。

软件定义变更更新协议已有决策领域；非核心不变量才允许 `add`/`update`/`retire`，且必须是跨事项的抽象正确性约束。核心不变量只允许由协议升级用 `sync_core` 精确同步权威定义。不得写入技能、路径、负责人、固定流程或把项目具体事实变成不变量。

## 完成复审与交接

普通工作全部闭合后，复审只检查实现正确性、问题解决、验证可信度、回归风险和最小性。发现的问题转成普通动态缺口；解决问题会提升内容修订号，随后重新复审。它是唯一显式语义自查，也是兜底而非常规事实维护阶段。事项解决后不在该历史验收上追加语义工作；完成后的新发现按正常入口重新读取最新状态，再选择适合的活跃事项或有依据的后续事项。

账本 `case_resolution.loop_handoff` 是当前 CASE 的确定性责任投影：`human` 表示人工候选、`external` 保存恢复条件、`agent` 表示可由 Agent 继续判断，`none` 仅在该 CASE 已派生 `resolved` 时出现。它不是新的执行授权或下一缺口选择，也不替代[续轮门禁](round-boundary-contract.md#续轮门禁)。一个 CASE 已解决，仍须检查同一授权目标的其他 CASE；存在其他独立就绪工作时不因局部人工或外部责任停止整个目标。

当前执行的 `handoff.next_responsibility` 与账本上述字段不同：用户停止或明确执行边界可使执行交接为 `none`，同时保留未完成 CASE；不得据此改写账本责任或宣称目标完成。可恢复的拒绝先修复或重读；无法恢复的权限、能力或技术故障如实说明，不伪造人工业务决定。未触发停止条件且有已授权可执行工作时，当前 Agent 按提交、重读、重选的顺序继续，不在 GAP 收尾处返回最终答复。
