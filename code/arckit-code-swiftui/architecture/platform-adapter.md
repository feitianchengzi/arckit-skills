# 平台 Adapter

## Adapter 边界

系统能力隔离在 Service、Adapter、Representable、Coordinator 或平台辅助组件。业务模型不依赖 Apple UI 类型。

```swift
protocol KeychainStoring: Sendable {
    func data(for key: String) throws -> Data?
    func set(_ data: Data, for key: String) throws
    func remove(_ key: String) throws
}
```

## App Group 共享容器

```swift
protocol AppGroupPathProviding: Sendable {
    func containerURL() throws -> URL
}
```

应用、Widget、扩展的共享路径集中管理，业务键保持稳定。

## UIKit/AppKit 桥接

Representable 只暴露稳定输入、输出回调和重置 ID。Delegate/Coordinator 不进入业务模型或 Service。

```swift
struct PlatformZoomView<Content: View>: UIViewRepresentable {
    let resetID: AnyHashable
    let content: Content
}
```

系统级滚动、缩放、输入、文本选择、系统面板优先复用平台控件，不用 SwiftUI 手写底层物理。

## 配置同步

使用系统能力时同步检查 Info.plist、entitlements、Privacy Manifest、App Group、Associated Domains、开发者后台与服务端配置和验证路径。
