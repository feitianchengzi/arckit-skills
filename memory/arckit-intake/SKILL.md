---
name: arckit-intake
description: 把原始项目输入材料记录到 arckit/intake，为每份材料建立 Markdown 记录，并按需做忠实文本提取。适用于只需保存原始材料、暂不分析且不提升为需求、任务或决策的场景。
---

# Arckit 原始材料登记

只用本技能保存、登记原始项目输入，并在需要时把内容忠实提取为同内容 Markdown。不要分析、分流、总结成需求，也不要把输入提升到后续阶段文档。下游解释和转化由其他技能负责。

## 核心原则

- 保留原始输入。不要修改、替换或合并掉原始材料。
- 只记录来源和存储事实，不添加解释。
- 为每份输入材料创建一个 Markdown 记录。
- 仅当材料包含文本，或需要同内容转写时，才创建提取内容的 Markdown 文件。
- 提取可以转写、转换或轻度结构化原始内容，但不能加入结论。
- 每个材料登记条目都要有稳定 ID，方便后续文档引用。
- 文件跟随所属材料登记条目存放，不放入共享附件堆。
- 优先创建小而主题一致的材料登记条目。互不相关的批次要拆分。
- 默认 `sensitivity` 是 `internal`；遇到秘密、凭据、合同、客户数据、个人数据或未公开商业信息时使用 `private`。

## 目录结构

首次使用时创建：

```text
arckit/intake/
  INDEX.md
  _inbox/
  YYYY/
    YYYY-MM-DD-NNN-short-title/
      metadata.yml
      files/
        source/
        records/
        extracted/
```

`_inbox/` 只用于用户一次提供很多文件且分组暂不明确时的临时暂存。除非被阻塞，结束任务前要把材料移动到带日期的材料登记条目中。

## 材料登记条目命名

使用：

```text
YYYY/YYYY-MM-DD-NNN-short-title/
```

规则：

- `YYYY-MM-DD` 是用户当前上下文中的接收日期。
- `NNN` 是当天三位序号，从 `001` 开始。
- `short-title` 尽可能使用小写 ASCII，以连字符分隔单词。
- 如果原始标题是中文或其他非 ASCII 文本，目录短名要简洁翻译，原始标题保留在 `metadata.yml`。

ID 格式：

```text
IN-YYYYMMDD-NNN
```

示例：

```text
arckit/intake/2026/2026-05-28-001-project-brief/
```

## 必需文件

### metadata.yml

```yaml
id: IN-20260528-001
title: 项目初始说明
received_at: 2026-05-28
source: user
input_types:
  - text
status: recorded
sensitivity: internal
description: 用户提供的项目原始背景和目标描述。
artifacts:
  - source: files/source/001-user-message.md
    record: files/records/001-user-message.md
    extracted: files/extracted/001-user-message.md
    type: text
    role: text_source
```

字段说明：

- `source`：通常是 `user`；如果用户点明来源，就使用具体来源。
- `input_types`：使用 `text`、`image`、`pdf`、`doc`、`spreadsheet`、`audio`、`video`、`archive`、`link`、`code`、`other` 等值。
- `status`：取值为 `recorded` 或 `archived`。
- `description`：中性描述收到的材料，不做解释或需求总结。
- `artifacts`：列出每份已存储的输入材料。每份材料必须把一个 `source` 路径映射到一个文件主名相同的 `record` Markdown 路径。`extracted` 可选；不需要文本提取时为 `null`。
- `role`：可读/需提取材料用 `text_source`；可直接使用的素材用 `reusable_asset`；视觉、音频、视频参考材料用 `reference_asset`；不明确时用 `unknown`。

### files/source/

在这里保存每份原始输入材料。尽可能保留原始措辞、字节和结构。

规则：

- 用户粘贴的文本保存为 Markdown 原始文件，通常命名为 `001-user-message.md`。
- 上传文件或本地文件在合理时保留原始扩展名。
- 链接保存为原始记录，例如 `001-link.md`，其中包含 URL 和用户提供的上下文文本。
- 同一材料登记条目中的多份材料必须有稳定且不冲突的文件名。

原始 Markdown 记录使用这个头部，保留 `Source`、`Received`、`Intake ID` 字段名：

```markdown
# 原始输入

Source: user
Received: 2026-05-28
Intake ID: IN-20260528-001

---

```

### files/records/

为每份原始材料保存一个 Markdown 记录。即使不需要提取，也必须创建记录。

文件名规则：

- 每份原始材料必须有一个文件主名相同的 Markdown 记录文件。
- 只把扩展名改成 `.md`。
- 示例：
  - `files/source/product-brief.pdf` -> `files/records/product-brief.md`
  - `files/source/homepage-design.png` -> `files/records/homepage-design.md`
  - `files/source/001-user-message.md` -> `files/records/001-user-message.md`

每个记录文件使用这个头部，保留 `Source`、`Received`、`Intake ID`、`Artifact`、`Role`、`Extracted` 字段名：

```markdown
# 输入记录

Source: user
Received: 2026-05-28
Intake ID: IN-20260528-001
Artifact: files/source/product-brief.pdf
Role: text_source
Extracted: files/extracted/product-brief.md

---

```

规则：

- 记录存储和来源事实：文件名、类型、`role`、`source` 路径，以及存在时的 `extracted` 路径。
- 对可直接使用的素材，设置 `Extracted: none`，只说明原始材料已按原样保留。
- 不要添加需求、假设、开放问题、建议、标签或下游分类。

### files/extracted/

仅在有用或可行时，保存同内容 Markdown 提取结果。

文件名规则：

- 提取文件使用与原始材料相同的文件主名。
- 示例：
  - `files/source/product-brief.pdf` -> `files/extracted/product-brief.md`
  - `files/source/login-screenshot.png` -> `files/extracted/login-screenshot.md`

规则：

- 内容必须忠实于原始材料。
- 使用 Markdown 标题、列表、表格和围栏代码块保留结构。
- 文本内容尽可能保留原始措辞。
- 按适用情况包含提取文本、OCR 识别文本、表格内容或转写文本。
- 如果内容无法读取或提取，不要伪造提取结果。在该材料的 `files/records/*.md` 中记录这个事实。
- 不要添加需求、假设、开放问题、建议、标签或下游分类。

## INDEX.md

维护 `arckit/intake/INDEX.md` 作为顶层登记表。

使用：

```markdown
# 材料登记索引

| ID | 日期 | 标题 | 输入类型 | 状态 | 敏感级别 | 描述 |
| --- | --- | --- | --- | --- | --- | --- |
| IN-20260528-001 | 2026-05-28 | 项目初始说明 | text | recorded | internal | 用户提供的项目原始背景和目标描述。 |
```

新条目按倒序时间追加。只更新存储事实、状态、敏感级别、标题、输入类型和描述。

## 处理输入

### 文本

- 除非文本明显包含互不相关的主题，否则创建一个材料登记条目。
- 把原始文本放入 `files/source/001-user-message.md`。
- 创建 `files/records/001-user-message.md`。
- 把同样文本放入 `files/extracted/001-user-message.md`；仅在能更清晰保留原始内容时使用 Markdown 结构。
- 在 `metadata.yml` 和 `INDEX.md` 中中性描述收到的材料。

### 文件

- 当本地路径或上传文件可用时，把文件复制到 `files/source/`。
- 合理时保留原始文件名。
- 如果文件名不安全或不清楚，改为简洁 ASCII 文件名，并在 `metadata.yml` 记录原始名称。
- 不要修改原始文件。
- 为 `files/source/` 中的每个文件创建对应的 `files/records/<same-stem>.md`。
- 仅当同内容提取有用或可行时，创建 `files/extracted/<same-stem>.md`：
  - 文档：提取标题、段落、列表和表格
  - 电子表格：把可见工作表或用户提供的范围转换为 Markdown 表格
  - 图片/截图：有 OCR 识别文本时记录；否则只记录中性文件条目
  - 音频/视频：仅当用户提供转写文本，或可通过已批准工具获取转写文本时记录
  - 压缩包：列出包含的文件；只有在技术上可行且不改变原始文件时，才提取可读文本
- 不要提取可直接使用的素材，例如标志、图标、设计效果图、作为素材的照片、设计源文件、音频素材或视频素材，除非用户明确要求转写/OCR。它们只需要记录文件。
- 如果提取不可行或不需要，在 `metadata.yml` 设置 `extracted: null`，并在记录文件中设置 `Extracted: none`。

### 链接

- 把 URL 保存到 `files/source/001-link.md`。
- 创建 `files/records/001-link.md`。
- 如果用户需要持久保存，在技术可行时把获取或导出的内容保存到 `files/source/`。
- 技术可行时，把获取的页面文本或链接记录放入 `files/extracted/001-link.md`。
- 如果链接需要认证或无法获取，记录访问限制。

### 混合批次

- 如果所有材料描述同一个连贯主题，创建一个材料登记条目。
- 如果材料覆盖不同主题，创建多个材料登记条目，并说明拆分情况。
- 如果分组不明确，暂存到 `_inbox/`，写清楚存储说明，不要询问需求澄清问题。

## 边界

不要：

- 推断需求
- 产出产品规格
- 产出技术方案
- 产出交互文档
- 产出视觉文档
- 超出中性输入类型做下游归属分类
- 为澄清需求而追问
- 标记假设或开放问题

如果用户同时要求下游处理，先完成输入记录，然后停止。后续工作由用户再调用其他技能。

## 输出给用户

创建或更新材料登记记录后，报告：

- 创建或更新的路径
- 分配的材料登记 ID
- 状态
- 任何敏感或私密材料的处理说明

回复保持简短，重点放在路径和 ID 上。
