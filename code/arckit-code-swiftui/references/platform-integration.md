# 平台集成

## 判断顺序

1. SwiftUI 原生 API 能否覆盖真实体验？能覆盖则使用 SwiftUI。
2. 是否只是展示系统 UI？是则用局部 representable，不进入领域层。
3. 是否是长期业务能力？是则定义协议和 Adapter/Service，View 只依赖稳定接口。
4. 是否需要 Info.plist、entitlements、开发者后台、App Group、Keychain Group、Associated Domains 或 Privacy Manifest？

## 桥接边界

UIKit/AppKit 桥接隔离在 Service、Adapter、Representable、Coordinator 或平台辅助组件。不要让业务模型依赖 Apple UI 类型，不要让多个页面各自写系统桥接。

允许桥接的典型原因：SwiftUI 无替代、系统 API 必须、性能或物理体验需要、平台控件已内建滚动惯性、缩放锚点、回弹、文本选择或系统面板交互。

## 常见能力

- PhotosPicker：View 可持有选择状态；读取、压缩、上传交给媒体管线；处理取消、读取失败、文件过大。
- Keychain：只存敏感凭据；错误区分未找到、重复写入、系统状态异常、数据格式错误。
- WidgetKit：共享数据小、稳定、可序列化；图片路径 Widget 可访问；点击 URL 使用业务 ID。
- 权限：用户理解用途时请求；拒绝后有降级；权限文案和实际用途一致。
- Universal Link：应用、AASA、域名、回退、冷热启动一起验证。

## 分享媒体

分享前先拆分载荷：文字、URL、本地图片文件、预览和回退内容。`ShareLink` 的 `item` 是核心载荷；`subject`、`message`、`preview` 只传目标系统可能使用的辅助信息。

分享海报要能脱离应用独立表达内容名称、简介或核心价值、应用名称或图标、二维码或打开入口。生成图片时显式设置输出逻辑尺寸、实际像素尺寸、渲染缩放比例、JPEG/PNG 格式、压缩质量和文件体积预算。

二维码按最终导出文件验证，检查实际像素、静区、对比度、JPEG 损伤、海报缩放和社交应用二次压缩。面向微信分享海报，3:4 海报可参考 `1440x1920 @ scale 1`；二维码区域建议至少约 `180px` 实际像素宽高，并保留白底静区。

系统相册级缩放、平移、惯性和回弹优先使用 `UIScrollView` 桥接。外层只传 SwiftUI 内容、重置 ID 和缩放状态回调；UIKit 类型不进入业务模型或 Service。

## 发布配置

代码用到的能力必须和 Bundle ID、Signing Team、entitlements、Associated Domains、App Groups、推送能力配置、Background Modes、Keychain Sharing、Privacy Manifest、Info.plist 权限文案、URL Types 保持一致。日志和埋点不得记录 API Key、令牌、完整个人内容、完整敏感 URL 或大对象。

发布能力要在仓库中留下可审查的配置记录，至少写清能力配置、entitlement、服务端文件、验证路径和负责人。例如 Associated Domains 要记录 `applinks:`、AASA URL、冷热启动验证和 iOS/服务端责任边界。
