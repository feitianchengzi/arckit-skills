# Service 边界

## APIClient 客户端

```swift
struct APIEndpoint<Response: Decodable & Sendable>: Sendable {
    let method: HTTPMethod
    let path: String
}

protocol APIClient: Sendable {
    func send<Response: Decodable & Sendable>(
        _ endpoint: APIEndpoint<Response>
    ) async throws -> Response
}
```

APIClient 负责请求、鉴权、状态码映射、解码和脱敏日志。Feature Service 负责业务接口组合和 DTO 到领域模型的映射。

## Service 协议

Service 表达外部能力或技术通道。接口使用稳定输入输出类型：领域模型、DTO、`Data`、`URL`、MIME 类型、业务 ID 或领域枚举。不要暴露 `UIImage`、`UIViewController`、SwiftUI `View`、`Color`、`PhotosPickerItem` 等 UI/平台边界类型。

Feature 的 Service 协议放在 Feature 内，描述这个 Feature 需要的能力；实现放在 `Services/`，可以组合 API、缓存和平台 Adapter。

```swift
protocol OCRService: Sendable {
    func recognizeText(in imageData: Data) async throws -> String
}
```

## 注入边界

默认由 `AppDependencies` 装配真实 Service，再通过 FeatureStore 构造注入。EnvironmentKey 只用于横切依赖或已有项目成熟约定；不要让子 View 自己读取页面级 Service。

## 错误分类

```swift
enum APIError: Error, Sendable {
    case cancelled
    case timeout
    case offline
    case unauthorized
    case forbidden
    case rateLimited
    case server(statusCode: Int)
    case decoding
    case business(code: String)
}
```

底层错误必须可分类；UI 文案后续映射。

## DTO 映射器

DTO 反映接口结构，领域模型反映应用使用方式。资源详情响应不默认等于完整领域模型；若详情缺少入口摘要字段，Service 或映射器应定义保留、补全或合并策略。

## 刷新元数据

```swift
struct RefreshKey: Hashable, Sendable {
    var namespace: String
    var identity: String
    var scope: String
}

struct RefreshMetadata: Sendable {
    var key: RefreshKey
    var lastSuccessfulFetchAt: Date
}
```

列表摘要、详情补全、用户态、媒体资源使用独立刷新键，不共用通用 `lastSyncedAt`。

## 测试替身

每个 Feature 的 Service 协议默认允许测试替身实现，供 Store 测试和 Preview 使用。
