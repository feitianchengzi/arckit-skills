# 导航

## Route 路由

```swift
enum AppRoute: Hashable, Sendable {
    case home
    case item(id: String)
}
```

Route 表达业务目标，不表达 UI 细节。只携带稳定 ID 和必要上下文，不传大对象、DTO 或 View。

## URL 解析器

外部入口统一进入解析器，再转换为 AppRoute：

```swift
protocol RouteParsing: Sendable {
    func parse(_ url: URL) -> AppRoute?
    func url(for route: AppRoute) -> URL?
}
```

Universal Link、URL Scheme、Widget、推送、分享回流进入同一套路由、解析器和路由器。

## 等价性

外部入口和应用内入口进入同一业务目标时，必须得到等价的资源身份、展示模型、权限状态和主操作能力。不能只验证“能打开页面”。

## 测试

公开链接要有解析与构建的往返测试。无效链接要有回退或忽略策略。
