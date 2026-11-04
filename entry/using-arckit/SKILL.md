---
name: using-arckit
description: "在 Arckit 项目中开始、恢复与持续推进已授权事项时使用。依据可信场景定义与项目、事项状态选择有界缺口，控制局部前置、探索与正式建立的边界；不代替领域能力或账本写回。"
---

# 使用 Arckit

依据可信场景定义和最新状态，每轮推进一个有界缺口。执行对应步骤前读取所列参考；字段、规则和示例由参考文件维护。

## 全程约束

- 用户原任务、当前增量和未撤回授权决定范围。
- 只以可信最新快照判断当前项目与事项状态。
- 每轮聚焦一个可共同决策、共同验收的缺口，显式识别相关不变量责任。
- 智能体负责语义判断，账本负责可信校验与写回，运行时负责交接与用户控制；不直接手改账本。

## 状态驱动循环

### 1. 恢复全部相关信息

按[状态恢复与事项选择](references/state-recovery.md)取得可信快照、检查可用性、准备写入工作区，并恢复场景契约、全部相关状态与证据。`unavailable` 时暂停普通循环，按[协议兼容性恢复](references/protocol-compatibility-recovery.md)处理，成功后重读快照。

### 2. 选择或创建事项

结合用户意图、项目缺口、活跃事项、风险和依赖选择一个事项；没有合适事项时，按[事项选择与创建](references/state-recovery.md#事项选择与创建)提交 `case_control.create_case`，注册后重读快照。

### 3. 动态选择下一缺口

按[缺口选择流程](references/gap-selection.md)识别义务、检查前置与因果边界、比较全部已持久化候选和实际新发现，展示开轮说明并声明 `selection_assessment`。普通工作闭合后才选择完成复审。

### 4. 同一智能体完成一个缺口

按[缺口执行与证据](references/gap-execution.md)选择技能和工具、维护事实载体，并在结果验证前确定证据上下文。独立新问题只记录；需要重新决定时保存证据和义务，提交后重读状态再选。

### 5. 提交状态转换

按[提交、续轮与输出](references/round-submission.md)核对跨轮义务，选择宿主声明的语义命令或直接状态转换入口。未完成则如实提交 `partial` 并保留原缺口；完成复审单独提交。

### 6. 自动续轮

按[轮次边界契约](references/round-boundary-contract.md)判断进展与下一责任，先展示账本收尾，再调用并展示提交后可信快照，之后独立判断下一轮。交付项见[输出清单](references/round-submission.md#输出)。

## 宿主接入

宿主提供自动续轮、拒绝恢复或完成后的新发现时，读取[运行时与宿主边界](references/runtime-host-boundary.md)；正常循环的输入与对话顺序见[输入边界](references/controller-input-boundary.md)和[循环对话协议](references/controller-conversation-protocol.md)。
