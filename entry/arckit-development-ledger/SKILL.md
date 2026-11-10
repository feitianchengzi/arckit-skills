---
name: arckit-development-ledger
description: "维护 Arckit 项目、迭代与事项的权威状态、协议兼容性恢复与确定性状态转换。项目保存推进控制、显式软件定义清单和抽象软件不变量；事项保存事实、状态影响、动态缺口与聚焦实现的完成复审。账本不编码具体版本迁移、技能、路径、固定流程或运行时策略。"
---

# Arckit 开发账本

维护“项目状态 → 事项 → 循环”的可信账本，负责确定性校验与原子写回；相关性、优先级、技能和工具由智能体判断。目标提案与人工确认由 `using-arckit` 维护；账本状态和责任投影不提供新增授权，提案确认前不以创建事项代替分析。执行对应步骤前读取所列参考，接口从能力清单解析。

## 工作流程

### 1. 准备工作区

首次接入或开始、恢复写入任务前，按[工作区准备](references/workspace-preparation.md)调用 `project_state prepare-workspace`，检查回执和既有跟踪问题；纯读取不触发维护。

### 2. 读取可信状态

通过 `loop_snapshot` 取得最新快照。按[账本对象与状态边界](references/ledger-contract.md)恢复项目、迭代、事项及场景定义；项目字段细则见[项目状态模型](references/project-state-model.md)。

### 3. 准备结论与证据

在一个有界缺口内形成主张，维护事实、影响和未决义务。构造不变量判断前读取[不变量判断与事实维护](references/invariant-assessment.md)；验证结果或保存、迁移证据前读取[事项证据归档](references/case-evidence.md)。首次使用软件场景时读取[软件缺口示例](references/software-gap-examples.md)；普通工作闭合后按[事项完成复审](references/completion-review.md)处理。

### 4. 校验并原子提交

按[状态转换与原子写回](references/transition-writeback.md)绑定快照、声明 `selection_assessment`、候选比较和完整不变量判断。宿主语义提交遵循[语义事项命令交接](references/semantic-command-handoff.md)，直接提交遵循[转换输入与内容透明性](references/transition-transport.md)；只通过可信入口写回。

### 5. 展示收尾并重读状态

应用成功后先展示账本收尾，再以提交后令牌调用 `loop_snapshot`。按[提交后读取边界](references/transition-writeback.md#收尾与重新读取)取得最新状态后，由当前 Agent 独立判断下一步。写回成功只结束本轮事务；目标未完成且门禁允许时，按 `using-arckit` 继续选择、执行和提交，不把收尾回执当成最终答复。

## 协议恢复分支

权威状态不兼容时暂停普通事项控制与转换，按[协议兼容性恢复边界](references/transition-writeback.md#协议兼容性恢复)和[协议协调转换](references/protocol-reconciliation.md)处理；成功后重新读取可信快照。

## 接口与输出

能力清单的 `agent_contracts` 是宿主定位语义模式和接口说明的唯一来源；脚本映射、命令行及交付项见[可信入口与输出](references/trusted-interfaces.md)。
