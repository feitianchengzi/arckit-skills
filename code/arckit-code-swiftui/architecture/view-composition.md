# View 组合

## 主 View 规则

一个 SwiftUI 文件默认只放一个主 View、紧邻的辅助小类型和 `#Preview`。页面、Root、Navigation、Service、Model 不混放。

页面级 View 负责把状态映射成界面，并把用户意图转发给 Store。不要在子 View 中重新获取页面级 Service、`@Query`、`modelContext` 或导航器。

## 子 View 输入

子 View 接收稳定展示输入：

```swift
struct HomeItemRow: View {
    let item: HomeItemDisplayModel
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack {
                Text(item.title)
                Spacer()
            }
        }
        .accessibilityLabel(item.accessibilityLabel)
    }
}
```

允许输入简单值、展示模型、`Binding`、样式枚举和动作闭包。不要传整个父级 Store/ViewModel、Service、`modelContext` 或与展示无关的状态。

## 展示模型

展示模型服务于展示转换，不污染领域模型：

```swift
struct HomeItemDisplayModel: Identifiable, Equatable, Sendable {
    var id: String
    var title: String
    var accessibilityLabel: String

    init(item: HomeItem) {
        id = item.id
        title = item.title
        accessibilityLabel = item.title
    }
}
```

当远端低完整度数据更新为完整数据时，展示模型的输入字段必须足以触发目标区域刷新，不要只按 `id` 跳过。

## 状态矩阵

页面至少覆盖加载中、空数据、错误、成功。涉及网络、图片、AI 生成、本地数据、权限或外部入口时，补充重试、已取消、权限拒绝、离线或降级、长文本和 Dynamic Type 场景。

## Preview 预览

Preview 使用 Store/Service 测试替身或固定展示模型，不访问真实网络、Keychain、文件系统或系统权限。关键组件至少覆盖默认、空态、错误、长文本和深浅色/大字体中风险最高的状态。
