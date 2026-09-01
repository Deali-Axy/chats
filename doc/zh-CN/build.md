# Ayaka Chats 开发指南

[English](../en-US/build.md) | **简体中文**

## 环境要求

- .NET SDK 10
- Node.js 20+
- pnpm
- Task；运行 `task dev` 时还需要 goreman

## 获取并启动项目

```bash
git clone https://github.com/Deali-Axy/chats.git
cd chats
cd src/FE && pnpm install && cd ../..
task dev
```

常用命令：

```bash
task dev:be
task dev:fe
task test:be
task ef:list
task ef:update
```

前端使用 pnpm，不要创建或提交 `package-lock.json`。后端默认运行在 `http://localhost:5146`，前端运行在 `http://localhost:12836`。

## 数据库

项目仅支持 SQLite。修改实体后，请使用 `task ef:add -- MigrationName` 创建 migration；后端启动时会自动调用 `Database.MigrateAsync`。有关旧库迁移，请阅读 [`tools/DataMigration`](../../tools/DataMigration/README.md)。
