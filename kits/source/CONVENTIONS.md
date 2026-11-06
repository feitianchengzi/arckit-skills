# Arckit 事实源约定（最小包）

无 definition 技能时，本文件为维护 `arckit/spec/`、`arckit/tech/`、`arckit/interaction/`、`arckit/visual/` 提供通用规则和默认结构。

## 优先级

已有项目按以下顺序取值，高优先级覆盖低优先级：

1. 项目自己的 `arckit/<domain>/CONVENTIONS.md`
2. 项目现有目录、文件名、ID 和 Token 命名
3. 本文件的通用规则（索引、语体、证据、结果映射）
4. 本文件的“默认结构”（仅用于新项目或项目尚未定义结构时）

**已有项目只沿用第 3 层，不要用默认结构覆盖项目现有布局。** 模板是起点，不是必须逐字照搬的目标结构。

## 1. 总则

- 事实源是 `arckit/<domain>/` 下的文件，不是技能，也不是本包。
- 每个域只有一个入口：`arckit/<domain>/INDEX.md`。先读索引，再按需读文档。
- 单一事实源：同一结论只在一处正式维护，其他位置引用路径。
- 陈述式、现在时。只写稳定事实，不写过程、计划、排期、候选比较。
- 未决内容保留在活跃 Case 的 `open_questions`、`pending_handoffs`，或域的 `_explorations/`。
- 模板默认值、原型示例和截图都不是已确认事实。

## 2. 目录与索引

```text
arckit/
├── spec/         产品功能规格
├── tech/         技术方案、模型、契约
├── interaction/  页面交互策略与原型
├── visual/       视觉策略、变量、组件
├── _map/         跨域关系与状态矩阵
└── _kit/         本包（模板与规范）
```

INDEX 约定：

- 缩进树形，每级一句描述。
- 每行直接写文件名或目录名，不用链接语法。
- 文档后标注行数，如 `(325行)`，便于判断是否需拆分。
- 状态标识：`🟢 已实现`、`🟡 开发中`、`⚪ 计划中`、`🔴 已废弃`（tech 域可用 `✅ 已采用`、`🔬 调研中`）。

## 3. 默认结构（仅新项目）

仅在项目还没有 `arckit/<domain>/CONVENTIONS.md`、也没有既有目录时使用。已有项目请直接沿用其结构。

### spec

```text
spec/
├── INDEX.md
├── GLOSSARY.md
├── CONVENTIONS.md
├── <module>/
│   ├── <feature>.md
│   └── <sub-module>/
└── _archive/
```

功能文档只写：功能描述、用户场景、需求规则、验收口径、已确认边界。

### tech

```text
tech/
├── INDEX.md
├── CONVENTIONS.md
├── _shared/
│   ├── models/
│   └── contracts/
├── <domain>/
│   ├── research.md
│   ├── solution.md
│   └── decision.md
├── _spikes/
└── _archive/
```

技术文档只写：已确认架构、约束、数据模型、API 契约、决策及理由。代码和测试是证据，不自动等于方案已接受。

### interaction

```text
interaction/
├── INDEX.md
├── CONVENTIONS.md
├── <page>/
│   ├── default.html
│   ├── interaction.md
│   └── ...本地资源
└── _explorations/
```

`interaction.md` 写：策略、主路径、状态与触发、导航、反馈、异常恢复、输入输出边界、视觉来源、模拟边界。

### visual

```text
visual/
├── INDEX.md
├── CONVENTIONS.md
├── _library/
│   ├── brief.md
│   ├── design-tokens.yaml
│   ├── component-catalog.yaml
│   ├── style-preview.html
│   └── preview-server.py
├── themes/
└── _explorations/
```

`brief.md` 是风格源；tokens、组件、主题和预览是投影，必须共同表达同一策略。

### 已有项目的结构适配

遇到下列历史布局时，跟随项目现状，不要新建平行结构：

| 项目现状 | 做法 |
|---|---|
| `spec/<module>/` 使用 `_overview.md`、`spec.md`、`tasks.md`、`quickstart.md`、`checklists/` | 沿用现有文件角色，不强行改成单个 feature 文件 |
| `tech/_shared/` 使用 `*-overview.md`、`*-summary.md` | 沿用文档式共享区，不新建 `models/`、`contracts/` 目录 |
| 模型/契约放在 `<domain>/models/`、`<domain>/contracts/` 或 YAML/Markdown 混用 | 跟随所在领域的既有位置和格式 |
| `decision-log.md` 在 `tech/_map/`，`RELATIONS.md`/`feature-matrix.md` 在域内 `_map/` | 更新项目已有的那份，不复制到根级 `_map/` |
| `visual/_library/` 使用 `color-tokens.yaml` + `tokens.yaml` + `brand.md` + `components/*.yaml` | 沿用拆分方式，不合并成 `design-tokens.yaml` |
| `interaction/<page>/` 下已有多个 `*-pages.html`、`*-states.html` | 保留现有拆分，新增文件按同样命名 |
| 项目使用 `FEAT-ID`、`TECH-ID`、`MODEL-ID`、`API-ID` | 沿用现有 ID 体系；没有时才按 `INDEX` 最大编号递增 |
| 项目有代码同步要求（如 Tokens 对应运行时 JSON） | 遵守项目 `CONVENTIONS.md` 的同步规则，模板不覆盖 |

判断依据是项目文件和 `arckit/<domain>/CONVENTIONS.md`，不是本包的默认结构。

## 4. 体量阈值

| 对象 | 警告 | 强制拆分 |
|---|---|---|
| `spec/**/feature.md` | >450 行 | >500 行 |
| `tech/**/solution.md` | >450 行 | >500 行 |
| `tech/**/research.md` | >700 行 | >800 行 |
| `tech/**/decision.md` | — | >500 行 |
| 任一 `INDEX.md` | >120 行 | >150 行 |
| 模型 / 契约 YAML | — | >200 行 |
| 嵌套层级 | — | spec >4 层、tech >3 层 |

拆分后同步更新 INDEX、`_map/RELATIONS.md`、`_map/feature-matrix.md`。

## 5. 探索隔离

- 候选方案、风格比较、未采纳原型放在对应域的 `_explorations/`。
- 探索索引单独维护，不写入正式 INDEX。
- 采纳时形成完整正式稿，不留“布局参考 A、行为参考 B”的拼装指令。

## 6. 证据

- 结果验证前确定证据目录：`arckit/cases/evidence/<case-id>/`。
- 区分交付物、可复用验证源码与本次运行证据。
- 证据引用写进事项转换的 `evidence[]`；没有证据的 `upheld` 不成立。

## 7. 无领域技能时的结果映射

definition 技能的 `fact_result` 不存在时，把结论直接映射到事项转换：

| 结论 | 写入位置 |
|---|---|
| 稳定事实 | `accepted_state_delta.facts_added[]`，并在事实文件正文维护 |
| 产品 / 技术决策 | `project_state_delta.software_definition_changes[]` |
| 不适用 | `invariant_assessment[].disposition = not_relevant`，附理由 |
| 阻塞 / 需人工 | `open_questions`、`pending_handoffs`，必要时标记 `human_decision_required` |
| 证据 | `arckit/cases/evidence/<case-id>/` + `evidence[]` |
| 未完成 | `round_outcome = partial`，保留原缺口 |

不要为了填满映射而补做独立决策；只有原任务验收必需、确实阻塞或修复本次回归的结论才形成缺口。

## 8. 归档

- 废弃内容移入 `<domain>/_archive/YYYY-MM-DD-<name>.*`，在文件顶部写归档说明。
- 同步更新 INDEX、关系与矩阵。
- 有效预期不因上线或实现完成而归档。
