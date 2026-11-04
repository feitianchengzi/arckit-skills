# 架构索引

本目录定义 Arckit SwiftUI 默认目标架构。新项目和新功能默认采用这些代码组织方式；已有代码偏离时，应评估迁移成本，不能以此为由照抄。

## 默认结构

```text
App
-> RootView
-> FeatureView
-> FeatureStore
-> FeatureService 协议
-> Service 实现
-> API / Persistence / 平台 Adapter
-> Tests
```

默认目录：

```text
App/
DesignSystem/
Navigation/
Features/<FeatureName>/
Services/API/
Services/Persistence/
Services/Platform/
Shared/
```

## 读取顺序

从零创建项目时先读 `project-structure.md`、`dependency-injection.md` 和 `design-tokens.md`。新增功能读 `feature-module.md`、`state-model.md` 和 `view-composition.md`。涉及外部数据读 `service-boundary.md`。涉及系统能力读 `platform-adapter.md`。涉及外部入口读 `navigation.md`。编写完成后按 `testing.md` 补充测试。

## 偏离处理

- 低成本：本次直接拉齐默认架构。
- 中成本：新增代码使用默认架构，旧代码用兼容层连接。
- 高成本：保持行为稳定，记录重构入口，不在功能任务中强迁移。
