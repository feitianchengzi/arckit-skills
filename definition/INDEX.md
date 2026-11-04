# Arckit 能力域技能

本仓库是 Arckit 可安装技能的独立源仓库，按能力域平铺组织：`entry/`、`definition/`、`memory/`、`engineering/`、`code/`、`delivery/`。每个域下直接是技能目录，不再增加 `skills/` 中间层。

## 维护约定

- 每个技能目录必须包含 `SKILL.md`，目录名与前置元数据的 `name` 一致。
- 新增或删除技能时，同步更新下游项目中的 `arcforge.skill-project.json` 路径。
- 技能不声明智能体白名单；智能体适配能力由安装层决定。
- 多个 Arckit 文档类技能共享 `definition/_arckit_shared/content-spec.md`。

## 定义类技能

| 技能 | 角色 | 共享资源 |
|---|---|---|
| `arckit-spec` | 需求规格 | `_arckit_shared/content-spec.md` |
| `arckit-tech` | 技术方案 / 数据契约 | `_arckit_shared/content-spec.md` |
| `arckit-interaction` | 交互 / 线框图 | `_arckit_shared/content-spec.md` |
| `arckit-visual` | 视觉设计系统 | `_arckit_shared/content-spec.md` |
