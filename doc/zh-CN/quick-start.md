# 快速开始

[English](../en-US/quick-start.md) | **简体中文**

Ayaka Chats 使用 SQLite 和 EF Core migrations；后端首次启动会创建数据库并写入初始数据。

## 本地开发

需要 [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)、Node.js 20+、pnpm、Task 和 goreman。

```bash
git clone https://github.com/Deali-Axy/chats.git
cd chats
cd src/FE && pnpm install && cd ../..
task dev
```

- 前端：`http://localhost:12836`
- 后端：`http://localhost:5146`（开发环境 Swagger：`/swagger`）
- 初始账号：`chats` / `RESET!!!`；首次登录后请立即改密。

## 容器部署

使用项目的发布脚本构建并推送镜像：

```bash
task deploy
```

部署时请为 `AppData` 配置持久卷，数据库位于 `AppData/chats.db`。本项目仅支持 SQLite，服务启动时会自动应用 EF Core migrations。

## 旧数据库升级

- 已使用本项目 1.12+ migration 的数据库：直接启动后端。
- 1.11 及更早的 SQLite 数据库：使用 [`tools/DataMigration`](../../tools/DataMigration/README.md)。

不要对生产数据库手工执行 `src/scripts/db-migration/` 中的 SQL 文件。
