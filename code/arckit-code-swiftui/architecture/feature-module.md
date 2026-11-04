# Feature 模块

## 默认文件

```text
Features/Home/
├── HomeView.swift
├── HomeStore.swift
├── HomeModels.swift
└── HomeService.swift
```

## View 结构

```swift
struct HomeView: View {
    @State private var store: HomeStore

    init(store: HomeStore) {
        _store = State(initialValue: store)
    }

    var body: some View {
        content
            .task { await store.loadIfNeeded() }
    }
}
```

View 表达状态，不拼接 URL、不解析 DTO、不操作 Keychain/FileManager，也不做系统桥接。

子 View 只接收展示模型、简单值、`Binding`、样式枚举和动作闭包。子 View 不直接访问页面级 Service、`@Query`、`modelContext` 或导航器；需要展示转换时先建立展示模型。

## Store 结构

```swift
@MainActor
@Observable
final class HomeStore {
    private let service: HomeService
    private(set) var state: LoadableState<[HomeItem]> = .idle

    init(service: HomeService) {
        self.service = service
    }

    func load() async {
        state = .loading
        do {
            let items = try await service.fetchHomeItems()
            state = items.isEmpty ? .empty : .loaded(items)
        } catch is CancellationError {
        } catch {
            state = .failed(AppError(error))
        }
    }
}
```

Store 协调用户动作、状态流和 Service 调用。业务流程不要塞进 View。

## Models 结构

领域模型表达应用使用方式，不照搬后端 DTO。展示模型只服务于展示转换，不污染领域模型。

```swift
struct HomeItemDisplayModel: Identifiable, Equatable, Sendable {
    var id: String
    var title: String

    init(item: HomeItem) {
        id = item.id
        title = item.title
    }
}
```

## Service 协议

Feature 自己声明所需能力：

```swift
protocol HomeService: Sendable {
    func fetchHomeItems() async throws -> [HomeItem]
}
```

实现可以组合 API、缓存和平台 Adapter；View 和 Store 只依赖协议。
