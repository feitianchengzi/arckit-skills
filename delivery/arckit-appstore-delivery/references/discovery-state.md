# 发现、配置和恢复

## 发现顺序
1. 读取适用的 `AGENTS.md`，记录当前工作目录、Git 根目录、分支、`HEAD`、上游分支、远端和原有未提交改动的文件。
2. 查找 `xcodeproj`/`xcworkspace`、`Package.swift`、XcodeGen/Tuist 生成源及 CI。用 `xcodebuild -list/-showBuildSettings` 获取实际配置，不仅通过正则表达式读取 `pbxproj`。
3. 识别主应用、扩展、测试和多平台构建目标。版本只要求同一分发单元相关构建目标对齐。
4. 查找明确的团队、Bundle ID、版本规范和交付配置。不跨全盘扫描私钥，不读取用户其他项目作为默认身份。
5. 发现已有 ASC CLI、Fastlane、MCP 或脚本并评估复用；无入口使用附带脚本。无 Node 18+ 时说明依赖，不能擅自全局安装。

可推断字段直接采用并说明依据。多团队、多主应用、缺凭据或 Bundle ID 命名依据时集中询问最少字段。已有有效营销版本保持；没有时默认 `1.0.0`。默认应用名为产品名，组名为“产品名 Internal”。Developer Team ID 与 API Issuer ID 不同，不能互换。

## 记录契约
优先沿用项目现有路径。否则非秘密共享配置可放 `arckit/delivery/apple.json`，进度放 Git 公共目录下的 `arckit-appstore-delivery/<发布单元>/state.json`（不提交）。通过 `git rev-parse --git-common-dir` 处理工作树；写入前检查该发布单元是否有并发任务，避免同时分配标签。

配置：`schemaVersion`、发布单元、`platform`、`project`/`workspace`、`scheme`、`teamId`、`bundleIds`、`appId`、`workflowId`、`groupId`、`remote`、标签规则来源、测试成员策略。凭据仅从环境或明确的本机配置引用；共享配置不含绝对私钥路径、成员邮箱或令牌。

进度：`schemaVersion`、仓库标识、发布单元、目标 SHA/标签、获准范围及指令来源、资源 ID、`runId`/`buildId`、阶段状态、`verifiedAt`、证据摘要、`pendingHumanAction` 和下一步查询。旧记录不提供无限授权，当前用户指令优先。

使用同目录临时文件及原子重命名，权限 `0600`，保留上一个有效记录。解析失败不盲目覆盖。恢复时无论记录是否完整，都重新查询关键远端事实。这个版本由智能体维护记录，不宣称附带 API 客户端是自动状态机或常驻服务。

## 幂等键
- 团队 + `bundleIdentifier`
- 应用 + 平台
- 产品 + 仓库 + 工作流
- 应用 + 内部测试组
- 应用 + 规范化测试成员邮箱
- 工作流 + 标签 + SHA → 运行 → 构建

匹配多个候选时消歧。写前记录预期变更，写后记录 ID 和回读结果。写超时为 `outcome_unknown`：查询再决定，不直接重放。409 也先查冲突资源。

已存在匹配运行则续接；同提交已交付则报告完成；只有代码变动或明确重建意图才新发构建。不能每次调用自动增加标签序号。

