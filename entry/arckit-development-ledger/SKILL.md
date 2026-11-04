---
name: arckit-development-ledger
description: "维护 Arckit 项目、迭代与事项的权威状态、协议兼容性恢复与确定性状态转换。项目保存推进控制、显式软件定义清单和抽象软件不变量；事项保存事实、状态影响、动态缺口与聚焦实现的完成复审。账本不编码具体版本迁移、技能、路径、固定流程或运行时策略。"
---

# Arckit 开发账本

本技能是“项目状态 → 事项 → 循环”的可信账本。它只校验协议、引用、修订号、责任和证据闭合；相关性、优先级、技能和工具由智能体基于全部上下文动态决定；工件位置遵守所属载体的维护约定，事项专属执行证据由本技能约定。

## 接口所有权

首次接入和开始或恢复会写入本地状态或证据的任务前，使用 `project_state prepare-workspace` 自动维护项目 `.gitignore`，读取[项目本地状态与 Git 忽略](references/workspace-preparation.md)的写入边界、回执与已有跟踪处理。此入口不修改权威状态或 Git 索引；纯读取操作不触发维护。

账本能力清单的 `agent_contracts` 是宿主组装语义载荷模式和定位接口说明的唯一来源；宿主只维护结果封装与授权绑定。语义提交前读取[语义事项命令交接](references/semantic-command-handoff.md)。智能体决定事实、关系与验收结论；账本校验合法性并物化身份、版本和派生关系，运行时不复制这些判断。

可信软件场景契约位于[软件状态定义模板](templates/software-state-definition.json)，快照携带定义和摘要，选择令牌绑定该摘要。通用循环使用定义；替换场景须同时替换状态模型、初始化与验证适配器。首次使用软件场景或需要区分取证、正式结论与排障边界时，读取[软件缺口示例](references/software-gap-examples.md)。

所有当前提交必须带 `planned_transition.selection_assessment`，结构见[选择说明模式](schema/selection-assessment.schema.json)。声明维护对象、实现载体、生效与验证、局部范围、结论性质、前置证据和合并边界。校验显式冲突及同一缺口历次声明的合并边界；正式预期或兑现声明必须关联不变量。不从文本或路径猜测语义，历史轮次不补造声明。

## 权威对象

- 兼容性 `arckit-ledger-compatibility/v1`：低成本识别权威对象是否满足当前协议，并区分版本不一致、当前协议损坏和不可读状态。
- 协调转换 `arckit-protocol-reconciliation/v1`：由智能体提交语义转换后的完整替换记录；账本只负责时效性、结构、保真边界、跨引用和原子写回。
- 项目 `project-state-record/v5`：`advancement`、显式 `software_definition.decision_areas` 与 `software_invariants`。
- 迭代 `iteration-state-record/v3`：阶段目标、逐轮接受的项目变更与事项引用。
- 事项 `development-case-record/v5`：事实、状态影响、动态缺口、问题、交接、内容修订号与完成复审。
- 快照 `arckit-ledger-snapshot/v1`：兼容性、权威来源摘要、项目与事项修订号、事项级选择令牌、版本化 `state_definition` 与已持久化候选目录。
- 语义命令 `arckit-semantic-case-command/v1`：Arckit 智能体绑定快照的语义主张，只携带显式的带类型引用、命令内局部句柄、事实、缺口、影响、项目与不变量判断和证据，不携带权威记账数据。
- 状态转换 `arckit-case-transition/v8`：绑定快照的完整缺口比较、单一验收主张、事项与项目增量以及当前项目不变量目录的完整判断。
- 收尾 `arckit-round-closeout/v2`：实际接受的增量、`planned_transition.selection_assessment`、不变量判断、结果修订号和提交后令牌，不投影下一候选。

## 项目状态边界

- `software_definition.decision_areas` 是协议明确列出的软件能力决策清单，不由智能体临时生发，也不是执行检查表。每项保存问题、决策要求、证据要求、当前决策与实际缺口引用。
- `software_invariants` 保存项目当前的不变量定义。智能体从当前项目状态读取集合及每项适用条件、约束和证据要求，不在工作方法中复制模板内容或按预设分类解释。完整判断只要求识别义务，不要求本轮全部成立；相关但未解决的缺口可以保持 `threatened`/`undetermined` 并关联开放缺口。模板定义的核心项仍由初始化写入并受精确校验保护，不允许项目任意修改、删除或退役；引导层通过状态读取使用定义，不改变模板的维护权限。
- 不变量定义软件责任范围，业务缺口应说明所对应的责任；候选证据来源和推理方法不限。首次构造判断、出现反证或恢复 `upheld` 时读取[软件不变量的判断与事实维护](references/invariant-assessment.md)。初始化或维护定义时读取[软件不变量模板](templates/software-invariants.json)；具体内容只在模板定义，智能体读取当前状态后理解，其他提示词和脚本不预设维度、数量、顺序或语义映射。
- `advancement` 只保存当前迭代、未完成事项、真实项目缺口和下一事项的选择上下文；不保存固定工作流或历史事项注册表。
- 技术栈、端、登录、反馈、授权、模块等具体结论写入对应 `decision` 的 `statement`/`evidence`；事项局部发现写入 `facts`/`evidence`。不要把项目事实伪装成新不变量。
- `open` 决策不自动生成缺口；只有当前事项确实需要解决它时才建立项目或事项缺口。`stale` 决策必须有缺口承接。

完整模型见[项目状态 v5 模型](references/project-state-model.md)。

## 事项状态与审计

检查结果是否符合预期，以及保存或迁移相应验证证据前，读取[事项结果验证证据归档](references/case-evidence.md)。新增结果验证证据统一归档到 `arckit/cases/evidence/<case-id>/`；已有正式载体直接引用，不为证据另建顶层目录。此约定管理智能体的文件写入，不让账本或运行时按路径推断事实语义。

- 事实有稳定 `id`、递增 `revision`、`accepted`/`superseded` 状态、`statement`、`basis` 和持久 `evidence`。
- 影响记录只记录当前事实或被接受状态转换实际影响的项目决策、不变量目标，不在事项创建时预测范围。软件决策影响必须绑定当前决策修订号；不变量修订号为 `null`（由项目修订号绑定）。不变量适用性本身不要求创建影响记录。
- `upheld` 需要证据；`threatened`/`undetermined` 至少绑定一个开放缺口。
- 缺口表示当前尚未成立的具体结果，子结果须共享目标、前提和验收边界，只包含结果型目标、原因、来源与依赖、开放式优先级依据、责任、证据要求和解决结果，不含分面、技能、工件类别或未来执行步骤。
- 审计保留所有依赖已闭合的责任类型候选，不以 `human`/`external` 隐藏可执行的 `agent` 工作；数组顺序不代表优先级。普通缺口、问题、交接和未闭合影响清零后，派生唯一完成复审候选，但智能体仍可在最新状态中提出更重要的普通缺口。
- 复审只检查实现正确性、问题解决、验证可信度、回归风险和最小性；规则见[事项完成复审](references/completion-review.md)。

## 状态转换与原子写回

- 每轮必须提交绑定选中事项选择令牌的 `gap_selection`，并逐项说明该事项范围内已持久化候选的 `selected`/`deferred`/`excluded` 结果；`fresh` 候选只记录智能体本轮实际发现的工作。`candidate` 以 `selected_ref`、缺口标识、事项修订号、选择令牌和当前就绪状态确认身份与时效性；智能体可以用自己的语言表达 `goal`/`reason`，账本重新解析并持久化当前权威候选，不以描述逐字相等作为身份门禁。`fresh` 原子创建并推进一个此前未持久化、由智能体负责、无未闭合依赖的普通缺口；验收未完成时可以保留开放状态。
- 每轮只接受选中缺口的有界结论集合或部分进展；新事实可以支持当前缺口，也可以新增或重开其他候选，但不顺带解决独立缺口。一个结论可以影响多个项目目标，相关低风险结果可合并；独立重要决定及建立预期与正式兑现不能因属于同一任务而合并。
- `invariant_assessment` 对观察到的项目修订版本中的全部不变量恰好判断一次。`not_relevant` 需要理由，`upheld` 需要持久证据，`threatened`/`undetermined` 需要已接受事实和写回后仍开放的事项缺口。账本不判断语义相关性或路由工件、技能。
- `project_state_delta` 可在任何被接受的缺口状态转换中更新软件定义决策、不变量、项目缺口或选择上下文，不必等待事项解决；只写入当前缺口已经建立的结论，不为补齐决策领域或不变量目录顺带作出独立决定。
- 语义命令物化器只按显式的带类型引用与局部句柄分配权威标识、读取并递增修订号、重建选中缺口、展开项目缺口的反向决策索引，并编译内部 v8；不得从 `statement`/`reason`/`evidence` 猜测 `target`、`effect`、`disposition`、`responsibility` 或下一缺口。直接提交 v8 的项目决策更新仍检查观察到的修订号；事项影响必须引用提交后的当前修订号。
- 内容变化提升 `content_revision` 并使旧的 `clean` 复审失效；`clean` 复审与内容变化分轮提交。完成复审是唯一显式语义自查；普通缺口的证据要求与账本校验只是完成证据和确定性协议校验。
- 正式应用在项目锁内重新读取最新状态，并原子写入事项、项目、迭代、投影与索引；任一步失败全部回滚。
- 应用成功由账本生成轮次收尾；宿主必须先展示收尾，再以提交后令牌调用 `loop_snapshot`。运行时和直接调用的智能体都不得从写回结果推断下一缺口。
- 传输和持久证据规则见[事项状态转换输入与内容透明性](references/transition-transport.md)。

## 协议兼容性恢复

- `protocol_compatibility probe` 是只读确定性门禁；兼容时不改变正常循环，失败时返回受影响引用、预期与观察到的模式、分类、来源摘要与快照令牌。
- 权威状态不兼容时，不接受普通事项控制或状态转换。智能体依据语义形成替换记录，账本不编码具体版本迁移步骤或字段映射。
- 协调转换在项目锁内重新探测最新状态，要求所有不兼容对象被覆盖，拒绝未决不确定性、身份或开放义务静默丢失、未知路径、陈旧摘要和跨记录失配；任一步失败全部回滚。
- 完整契约、命令行和验收边界见[协议协调转换](references/protocol-reconciliation.md)。

## 可信入口

- `project_state`: `scripts/project-state.mjs`
- `project_iteration`: `scripts/project-iteration.mjs`
- `development_case`: `scripts/development-case.mjs`
- `protocol_compatibility`: `scripts/protocol-compatibility.mjs`
- `loop_snapshot`: `scripts/loop-snapshot.mjs`
- `case_control`: `scripts/runtime-case-control.mjs`
- `case_transition`: `scripts/case-transition.mjs`
- `writeback`: `scripts/runtime-writeback.mjs`

## 命令行

```text
node scripts/project-state.mjs prepare-workspace|init|render|audit|validate|summary [record]
node scripts/development-case.mjs new|validate|audit|close ...
node scripts/case-transition.mjs validate <transition.json|->
node scripts/case-transition.mjs apply --case <case.md> --transition <transition.json|-> [--dry-run true]
node scripts/protocol-compatibility.mjs probe
node scripts/protocol-compatibility.mjs validate|reconcile <reconciliation.json|-> [--dry-run true]
node scripts/loop-snapshot.mjs read [--after-commit <snapshot-token>]
```

## 输出

- 项目、迭代与事项的权威状态
- 兼容性探测与协议协调转换结果
- 事实、针对具体目标的影响、动态缺口与完成复审解决结果
- 每轮接受的事项增量、项目增量、不变量判断、校验与基于最新状态的下一步
