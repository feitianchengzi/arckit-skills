# 可信入口与输出

定位可信脚本、直接调用命令行或确认交付项时读取。以当前安装包的能力清单为准；宿主从 `agent_contracts` 解析语义模式与接口说明，不复制账本的判断或物化逻辑。

## 工作区接入

首次接入和开始或恢复会写入本地状态或证据的任务前，使用 `project_state prepare-workspace` 自动维护项目 `.gitignore`，读取[项目本地状态与 Git 忽略](workspace-preparation.md)的写入边界、回执与已有跟踪处理。此入口不修改权威状态或 Git 索引；纯读取操作不触发维护。

## 可信入口

- `project_state`: `scripts/project-state.mjs`
- `project_iteration`: `scripts/project-iteration.mjs`
- `development_case`: `scripts/development-case.mjs`
- `protocol_compatibility`: `scripts/protocol-compatibility.mjs`
- `loop_snapshot`: `scripts/loop-snapshot.mjs`
- `case_control`: `scripts/runtime-case-control.mjs`
- `case_transition`: `scripts/case-transition.mjs`
- `writeback`: `scripts/runtime-writeback.mjs`

脚本路径相对于当前账本技能包；以授权项目根目录为工作目录，通过能力清单解析后的路径调用。

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
