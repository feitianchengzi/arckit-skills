# Agent Instructions

本仓库发布 Arckit agent skills，安装由 npx CLI 完成。

- **安装说明（给 Agent）**：[INSTALL.md](INSTALL.md) —— 非交互命令、目标目录、校验、卸载与错误处理。
- **人类文档**：[README.md](README.md)

如果你被要求安装 Arckit skills：

1. 先阅读 `INSTALL.md`；
2. 不要运行不带参数的 `npx arckit-skills`（会进入交互提示并阻塞）；
3. 一律携带完整参数与 `--yes`，例如：

```bash
npx github:feitianchengzi/arckit-skills install --project --flat --agents --yes
```

4. 安装后按 `INSTALL.md` 第 5 节校验，并向用户报告实际目标目录与条目数量。
