# ArcKit Domain Skills

本仓库是 Arckit 可安装 skill 的独立源仓库，按能力域平铺组织：`entry/`、`definition/`、`memory/`、`engineering/`、`code/`、`delivery/`。每个域下直接是 skill 目录，不再增加 `skills/` 中间层。

## 维护约定

- 每个 skill 目录必须包含 `SKILL.md`，目录名与 frontmatter `name` 一致。
- 新增或删除 skill 时，同步更新下游项目中的 `arcforge.skill-project.json` 路径。
- Skill 不声明 agent 白名单；agent 适配能力由安装层决定。
- 多个 arckit 文档类 skill 共享 `definition/_arckit_shared/content-spec.md`。

## Definition skills

| Skill | 角色 | 共享资源 |
|---|---|---|
| `arckit-spec` | 需求规格 | `_arckit_shared/content-spec.md` |
| `arckit-tech` | 技术方案 / 数据契约 | `_arckit_shared/content-spec.md` |
| `arckit-interaction` | 交互 / 线框图 | `_arckit_shared/content-spec.md` |
| `arckit-visual` | 视觉设计系统 | `_arckit_shared/content-spec.md` |
