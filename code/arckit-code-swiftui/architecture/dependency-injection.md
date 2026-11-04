# 依赖注入

## 默认选择

从零创建项目时默认使用 `AppDependencies` 做应用级装配，Feature 使用构造注入：

```swift
@MainActor
struct AppDependencies {
    var homeService: any HomeService

    static let live = AppDependencies(
        homeService: DefaultHomeService()
    )
}

struct RootView: View {
    let dependencies: AppDependencies

    var body: some View {
        NavigationStack {
            HomeView(
                store: HomeStore(service: dependencies.homeService)
            )
        }
    }
}
```

Store 的依赖从 `init` 进入，测试直接传入测试替身。不要为了单个测试新增全局可变单例。

## EnvironmentKey 取舍

`EnvironmentKey` 适合跨大量页面、低频变化、稳定的横切依赖，例如主题、日志记录器、分析服务、路由器和全局设置。

Feature Service 默认不通过每个子 View 的 `@Environment` 直接读取。若项目已有成熟的 Environment 注入，可以在 Root/App 层把 Environment 中的 Service 适配为 Store 构造参数，保持 Store 和子 View 边界清楚。

## 禁止的结构

```swift
@Observable
final class BadStore {
    @Environment(\.homeService) var service
}
```

状态对象不持有 `@Environment`。子 View 不直接访问页面级 Service；子 View 通过展示模型、`Binding` 和动作闭包表达输入输出。
