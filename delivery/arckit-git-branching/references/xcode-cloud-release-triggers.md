# Xcode Cloud Git 触发约定

本引用文档只补充 Apple 项目使用 Xcode Cloud 时的 Git 触发模式和失败证据入口。平台无关分支/标签规则以 [通用触发约定](platform-release-triggers.md) 为准。

## 工作流触发模式

- `release/v*` 分支推送：验证发布线。
- 标签使用通用版本命名，例如 `v1.2.3-beta.1`、`v1.2.3-rc.1`、`v1.2.3`，不另设 Apple 专用前缀。
- 监听 `v*`（或项目既有命名空间）时，应区分预发布与正式版本；具体匹配方式以 Xcode Cloud 工作流配置为准。
- 内部 TestFlight、外部 TestFlight 或 App Store 候选包由项目工作流的分发配置决定，不直接从标签阶段推断；已有监听规则不自动迁移。

智能体在本技能中只做 Git 层动作：推荐分支/标签，确认后创建并推送到远端。推送后停止，不追踪 Xcode Cloud 的构建、上传、处理、测试组或审核状态。

## Apple 默认规则

- 同时表达 Apple 平台发布和 TestFlight 分发意图时，默认推荐内部 TestFlight；此处只决定分发建议，不决定标签的版本阶段。
- 版本及预发布序号按通用“标签策略”确定，不设置 Apple 专用初始版本或标签序号。
- 平台构建号与标签的预发布序号分别管理，不将内部/外部测试映射为 `bN`/`rcN`。

## 失败证据

当用户反馈 Xcode Cloud 或 TestFlight 首次出包失败，但没有具体错误时，先收集失败原因，不要盲改项目配置。

优先检查顺序：

1. 开发者账号邮箱或 App Store Connect 相关通知邮箱。Apple 可能把具体失败原因发到邮件里，尤其是上传、处理或 App Store Connect 准备阶段失败时。
2. Xcode Cloud 的构建历史。`Preparing build for App Store Connect failed` 可能只是泛化标题；即使日志和产物看起来成功，也不代表上传或 App Store Connect 准备阶段成功。
3. App Store Connect / TestFlight 页面。首次上传在成功前可能看不到任何上传历史或失败记录，不能把“没有历史”当成没有失败原因。

需要用户粘贴给智能体的最小信息：

- 触发标签或分支，例如 `v1.2.3-beta.1`。
- 提交哈希。
- Xcode Cloud 工作流名称和失败时间。
- 构建历史里的失败标题。
- 开发者邮箱收到的具体失败原因原文。
- 如果 TestFlight 没有上传历史，明确说明是否是首次上传。

拿到失败原因原文后，再按错误内容进入调试、配置修复或平台配置协作；本引用文档不提供具体修复方案。

## 边界

不要把 Apple 发布意图扩展成本机执行：

- `xcodebuild`
- 归档（`archive`）
- `exportArchive`
- Organizer 上传
- Transporter / altool
- App Store Connect 构建查询
- 签名或预置描述文件处理
- TestFlight 测试信息或测试组维护
