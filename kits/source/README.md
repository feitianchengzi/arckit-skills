# Arckit 事实源最小包

本目录是只安装 `using-arckit` 与 `arckit-development-ledger`、并显式加 `--with-kit` 时，现场生成到项目 `arckit/_kit/` 的资源包。

它不是技能，不参与状态协议，也不写账本。它只提供模板、索引约定和内容规范，让智能体在没有 definition 技能时仍能产出可恢复的事实。仓库只保存本目录的源文件；生成结果不提交，也不做漂移检查。

## 何时读取

1. 恢复状态、选中事项之后，准备维护事实源之前，先读 `CONVENTIONS.md`。
2. 新建文档时，从对应子目录复制模板：
   - 产品规格 → `spec/`
   - 技术方案 → `tech/`
   - 交互原型 → `interaction/`
   - 视觉设计 → `visual/`
3. 更新索引与关系时，参考 `_map/` 下的模板。
4. 需要完整内容规范或证据约定时，读 `shared/` 下的参考。

## 使用顺序

```text
读 arckit/<domain>/INDEX.md
  → 判断查询还是变更
  → 从 _kit/<domain>/ 取模板
  → 创建或更新事实文件
  → 同步 INDEX.md 与 _map/
  → 结果映射进事项转换
```

## 与已有项目共存

如果项目里已经有 `arckit/<domain>/CONVENTIONS.md`：

1. 先读项目约定，再读本包的 `CONVENTIONS.md`。
2. 项目的目录、文件名、ID、Token 命名优先；本包默认结构只用于项目尚未定义的领域。
3. 本包模板只作为新文件的起点，允许按项目规范改名、拆分或合并。
4. 不新建与项目平行的 `_map/`、`tokens`、`models` 结构。

已有项目安装时，CLI 默认不生成 kit；只有最小闭环安装显式加 `--with-kit` 才生成。生成后项目约定仍优先。

## 与 definition 技能的关系

- 安装了 definition 技能时，技能自带的方法和模板优先；本目录可作为项目内稳定副本。
- 只安装两个入口技能时，本目录是唯一的方法来源。
- 无论哪种情况，`arckit/<domain>/` 下的项目文件才是事实源；本目录不是。

## 不做什么

- 不写 `arckit/project/` 或 `arckit/cases/`。
- 不替代 `loop_snapshot`、`case_transition` 或完成复审。
- 不把模板默认值当成已确认事实。
