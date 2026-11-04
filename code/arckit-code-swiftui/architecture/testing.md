# 测试

## Store 异步测试

```swift
@MainActor
@Test func storeLoadsItems() async throws {
    let store = HomeStore(service: FakeHomeService(items: [HomeItem(id: "1", title: "One")]))
    await store.load()

    if case .loaded(let items) = store.state {
        #expect(items.count == 1)
    } else {
        #expect(Bool(false), "Expected loaded state")
    }
}
```

## Service 测试替身

测试替身实现 Feature 的 Service 协议，不访问真实网络、Keychain、文件系统，也不触发系统弹窗。

```swift
private struct FakeHomeService: HomeService {
    var items: [HomeItem] = []
    var error: AppError?

    func fetchHomeItems() async throws -> [HomeItem] {
        if let error {
            throw error
        }
        return items
    }
}
```

## 可控输入

时间、UUID、时钟、网络客户端、缓存、Keychain、分析服务和日志记录器通过依赖注入替换。不要为了单个测试引入全局可变单例。

Store 测试直接构造 Store 并传入 Service 测试替身；View 预览使用预览用 Service 或固定展示模型。Preview 不访问真实网络、Keychain、文件系统或系统权限。

## 构建前置

涉及 Swift Package 依赖的构建或测试，先按 `references/validation-and-testing.md` 使用 `scripts/xcodebuild-verify.sh` 解析包，再执行构建或测试。

## 覆盖目标

- Store：成功、空数据、错误、取消、过期结果。
- Service：DTO 映射器、错误分类、令牌刷新、缓存刷新元数据。
- Navigation：URL 解析与构建的往返测试、无效链接回退。
- Platform：权限拒绝、不可用、系统失败、App Group 路径。
- Persistence：旧数据、损坏数据、迁移样本。
