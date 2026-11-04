# 工程结构

## 默认目录

```text
App/                 # 应用入口、Root、依赖装配
DesignSystem/        # DesignTokens、基础视觉入口
Navigation/          # AppRoute、URL 解析与构建、入口分发
Features/            # 按业务功能组织 View/Store/Models/Service 协议
Services/API/        # APIClient、Endpoint、APIError、DTO 传输
Services/Persistence/# SwiftData/Core Data、缓存元数据、文件存储
Services/Platform/   # Keychain、Photos、Widget、App Group、UIKit/AppKit 桥接
Shared/              # AppError、LoadableState、通用领域工具
```

## 依赖方向

Feature 可以依赖 Shared、DesignSystem、Navigation 和 Service 协议。Service 实现可以依赖 API/Persistence/Platform。View 不直接依赖 URLSession、Keychain、FileManager、UIKit 控制器或 DTO。

## 类型选择

默认使用 `struct` 表达值语义数据、DTO、配置和轻量模型。只在需要引用语义时使用 `final class`，例如 `@Observable` Store、SwiftData `@Model` 或长期共享对象。有限状态、路由、错误类型和选项集使用 `enum`。

## 文件组织基线

- 一个 SwiftUI View 文件默认只放一个主 View、紧邻的辅助小类型和对应 `#Preview`。
- App 入口、Root、Navigation、Service、Model 不混放。
- 不设置通用 `Utils/` 作为业务垃圾桶；共享工具放 `Shared/`，且不能反向依赖 Feature。
- 新增系统能力前先确认能力配置、entitlements、Info.plist、Privacy Manifest 和发布验证。

## 应用入口

应用入口只负责 Root 和依赖装配。RootView 持有依赖，把具体 Service 注入 FeatureStore。不要在应用入口写业务流程。

## 并发基线

默认使用 Swift Concurrency：`async/await`、`Task`、`actor`、`@MainActor`。UI 状态更新保持 MainActor 语义；不新增 `NSThread`、`performSelector(on:)` 或裸 GCD 线程调度。`.task`、网络请求、图片加载和生成任务都要考虑取消、去重或过期结果处理。

## 构建目标边界

从零创建项目时默认先保持单个应用构建目标和测试构建目标。只有复用、编译时间、权限隔离或团队边界确实需要时，才拆分本地包或框架。

## 平台基线

从零创建 Apple 平台 SwiftUI 工程时，默认最低支持版本统一为 26.0：iOS、macOS、watchOS、tvOS、visionOS 均从 26.0 开始支持。只有用户明确要求兼容旧系统，或项目已有发布目标必须保留时，才降低对应的最低部署版本，并同步检查 API 可用性和降级路径。
