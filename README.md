# Arckit Skills

Arckit 可安装 skill 的独立源仓库。Skill 按能力域平铺组织，每个域目录下直接是 skill 目录，不设 `skills/` 中间层。

## 目录

```text
entry/       状态驱动入口与 development ledger
definition/  产品、交互、视觉和技术稳定事实维护，_arckit_shared/ 为共享契约
memory/      原始输入与显式按需的未决上下文维护
engineering/ 技术栈无关的工程诊断
code/        语言、框架、平台、SDK 与云服务 coding skills
delivery/    发布、分支与交付触发
```

每个 skill 目录都必须包含 `SKILL.md`，目录名与 frontmatter 的 `name` 一致。

## 在主仓库中使用

Arckit 通过 submodule 引入本仓库：

```bash
git submodule add https://github.com/feitianchengzi/arckit-skills.git vendor/arckit-skills
```

更新到已发布的 skill 版本：

```bash
git submodule update --remote vendor/arckit-skills
```

## License

Apache License 2.0。见 `LICENSE` 与 `NOTICE`。
