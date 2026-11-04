---
name: arckit-code-swiftui
description: Arckit SwiftUI 默认架构与编码实践技能。用于引导 Codex 按 Arckit 最佳实践从零创建或持续演进 SwiftUI/Apple 客户端项目，定义默认工程结构、Feature 模块、状态模型、View/Service/Store/Adapter 边界、导航、网络、本地数据、平台能力、测试和验证口径。适用于 iOS/macOS/watchOS/tvOS/visionOS 的功能实现、SwiftUI 架构整理、工程脚手架、PhotosPicker/WidgetKit/Keychain/ShareLink/Universal Link/UIKit 桥接接入、发布配置、性能治理、重构、排障和补测试。用户要求写 SwiftUI 代码、从零开发 iOS 应用，或希望智能体按 SwiftUI 工程质量标准编码时使用。
---

# Arckit SwiftUI 编码

## 具体作用

定义 Arckit SwiftUI 客户端的默认目标架构，引导智能体把功能写成可维护、可测试、符合 Apple 平台体验的代码，并提供默认工程结构和 Swift 代码组织方式。

## 优先级

1. 用户目标和行为正确性。
2. 本技能定义的 SwiftUI 最佳实践与默认架构。
3. 项目已有代码的迁移成本和风险。
4. 本次任务的改动范围。

项目已有模式不是天然优先。若旧代码偏离默认架构，先评估成本：低成本直接拉齐；中成本让新增代码采用默认架构并加兼容边界；高成本保持行为稳定，记录后续重构切入点。

## 正向编码循环

1. 理解用户路径：用户看到什么、做什么、成功后发生什么，失败/取消/空数据/权限拒绝时怎样表现。
2. 建状态模型：区分局部 UI 状态、页面业务状态、持久化数据、远端数据、系统权限状态和外部入口状态。
3. 定代码边界：View 表达界面，Store/ViewModel 协调业务状态，Service 处理外部能力，Adapter/Representable 隔离平台类型。
4. 按默认架构实现：新功能默认使用 `architecture/` 中的代码组织方式；旧代码按迁移成本拉齐。
5. 补完整边界态：加载中、空数据、错误、成功、取消、重试、权限拒绝和过期结果按风险补齐。
6. 做匹配验证：小改动定向验证，高风险改动补测试、样本数据、手测矩阵、截图、日志或发布前清单。

## 默认读取

从零开发、创建新功能、整理架构或新增复杂 SwiftUI 代码时，先读 `architecture/INDEX.md`，再按需要读取架构细节和专项参考文档。

| 问题 | 读取 |
| --- | --- |
| 默认工程结构和依赖方向 | `architecture/project-structure.md` |
| FeatureView、FeatureStore、FeatureModels、FeatureService | `architecture/feature-module.md` |
| LoadableState、MutationState、PermissionState、过期结果 | `architecture/state-model.md` |
| 子 View 拆分、展示模型、Preview、可访问性 | `architecture/view-composition.md` |
| AppDependencies、构造注入、EnvironmentKey 取舍 | `architecture/dependency-injection.md` |
| DesignTokens、Asset Catalog、稳定视觉值 | `architecture/design-tokens.md` |
| APIClient、DTO 映射器、缓存刷新元数据、Service 测试替身 | `architecture/service-boundary.md` |
| AppRoute、URL 解析与构建、外部入口 | `architecture/navigation.md` |
| 权限、Keychain、App Group、UIKit/AppKit 桥接 | `architecture/platform-adapter.md` |
| Store 异步测试、测试替身、路由与解析、缓存与迁移测试 | `architecture/testing.md` |

## 专项判断

| 风险主题 | 读取 |
| --- | --- |
| 需求如何落成页面、状态、操作和失败路径 | `references/feature-shaping.md` |
| 状态归属、View 拆分、Preview、DesignTokens、复杂手势 | `references/state-and-view-boundaries.md` |
| 网络、本地数据、缓存、上传下载、媒体管线、AI 生成链路 | `references/data-and-service-boundaries.md` |
| PhotosPicker、Widget、ShareLink、二维码、entitlements、隐私、Universal Link | `references/platform-integration.md` |
| Swift Testing/XCTest、测试替身、异步测试、性能、发布前验证 | `references/validation-and-testing.md` |
| 大重构、迁移、未知根因缺陷、回归和偶发问题 | `references/refactor-and-debug.md` |

## 核心纪律

- 优先使用 SwiftUI；需要时使用其他平台框架。
- 先确定状态所有权和数据流，再拆 View。
- View 的 `body` 保持轻量、纯粹、可预览；不要做网络请求、文件 IO、Keychain 访问、JSON 解码、排序过滤、同步图片处理或系统桥接。
- Service API 不泄漏 `UIImage`、`UIViewController`、`Color`、`View` 等 UI 类型。
- UIKit/AppKit 桥接只存在于 Adapter、Representable、Coordinator、Service 或集成层。
- 异步任务必须考虑取消、重复触发、失败回退、过期状态写入和 MainActor 语义。
- 系统能力不能只改 Swift 文件；同步检查 Info.plist、entitlements、Privacy Manifest、App Group、Associated Domains、开发者后台与服务端配置和验证路径。
- 新抽象必须服务真实复杂度、测试边界或复用边界。

## 工程底座

新建空 iOS 工程可使用 `scripts/create-ios-app.sh`，模板在 `templates/ios-app-template/`。模板应与 `architecture/` 默认架构保持一致；修改架构约定时同步更新模板。
