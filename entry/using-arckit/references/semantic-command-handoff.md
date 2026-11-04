# 语义命令交接

语义命令的字段、带类型引用、候选令牌和复审问题关联契约由 `arckit-development-ledger` 独占维护。

提交前，从宿主提供的 `agent_contracts.contracts.case_command` 读取实际绑定账本的 `reference_path`；无宿主时从已安装账本的能力清单解析 `agent_contracts.case_command.reference`。按该完整契约提交 `arckit-semantic-case-command/v1`，不以仓库中新版本代替当前可信运行版本。

本文件只定位显式接口，不隐式调用另一技能，也不复制其协议正文。单缺口选择、证据判断及续轮方法仍以 `using-arckit` 为准。
