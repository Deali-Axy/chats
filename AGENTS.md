# AGENTS.md

给编码 Agent 的仓库约定。人类说明见 `README.md`。不要把两份文档互相复制成长文。

本文件的首要目的：**合并上游 `sdcb/chats` 时，不要把本 Fork 已经分叉的路线改回去。**

## 这是什么

**Ayaka Chats**（`Deali-Axy/chats`）是 [sdcb/chats](https://github.com/sdcb/chats) 的社区 Fork。

- `origin` → `git@github.com:Deali-Axy/chats.git`
- `upstream` → `git@github.com:sdcb/chats.git`

当前产品版本 `1.15.0`。后端 `net10.0`，前端 Next.js 16 / React 19。

`tools/DataMigration/AGENTS.md` 只约束那个 ETL 控制台，不要和本文件混用。

## 硬规则（合并时先看）

1. **从 1.12 起，本 Fork 用 EF Core migrations 管理 SQLite。** 上游用 `src/scripts/db-migration/**/*.sql` 手工改表。这两条路已经永久分叉。
2. **禁止**把 `InitService` 改回 `EnsureCreatedAsync`。必须保持 `Database.MigrateAsync`。
3. **禁止**对本 Fork 的 SQLite 执行上游 SQL 脚本（包括 `1.15.0.sql` / `1.15.0-sqlite.sql`）。那些文件可以随上游 merge 进来，只当对照。
4. **仅 SQLite。** `DBConfigure` 对 `sqlserver`/`mssql`/`postgresql`/`pgsql` 抛 `NotSupportedException`。不要把 `Microsoft.EntityFrameworkCore.SqlServer` 或 `Npgsql.EntityFrameworkCore.PostgreSQL` 加回 `Chats.BE.csproj` / `Chats.DB.csproj`，除非用户明确要求重新启用。
5. **1.11 及更早的生产库**走 `tools/DataMigration`，不要 `dotnet ef database update`。EF 历史从 1.12 的 `InitialCreate` 开始，对旧库跑 `update` 会 `CREATE TABLE` 撞车。
6. 前端包管理是 **pnpm**。不要恢复 `package-lock.json`，不要把 `pnpm` 脚本改回 `npm`。
7. 品牌是 Ayaka Chats，不是 Sdcb Chats。默认 Prompt、User-Agent、登录页、GitHub 跳转都已改。

## 命令

优先根目录 `Taskfile.yml`（[Task](https://taskfile.dev/) + [goreman](https://github.com/mattn/goreman)）：

```bash
task --list
task dev                 # goreman：后端 + 前端
task dev:be              # http://localhost:5146 ，启动时自动 Migrate
task dev:fe              # http://localhost:12836
task test:be
task tools:restore       # 还原 dotnet-ef（见根目录 dotnet-tools.json）
task ef:add -- Name      # 新增 migration
task ef:update
task ef:list
task ef:remove           # 只删尚未应用到库的最近一次
task generate:poster     # 可带版本号：task generate:poster -- 1.15.0
task deploy              # scripts/build_push.py
```

没有 Task 时：

```bash
cd src/BE/web && dotnet run --project Chats.BE.csproj
cd src/FE && pnpm install && pnpm run dev
dotnet test src/BE/tests/Chats.BE.UnitTest/Chats.BE.UnitTest.csproj
dotnet tool restore
dotnet tool run dotnet-ef migrations add Name --project src/BE/web/Chats.BE.csproj --startup-project src/BE/web/Chats.BE.csproj --context ChatsDB --output-dir DB/Migrations
```

CORS 已放行 `FE_URL` 以及 `http://localhost:12836` 和 `http://localhost:3000`。改前端端口时同步 `src/FE/package.json` 的 `dev` script 和 `src/BE/web/Infrastructure/CORS.cs`。

## 目录（改哪里）

| 要做的事 | 放这里 |
|---|---|
| 实体 / 表 | `src/BE/db/`（`Chats.DB`） |
| EF migrations | `src/BE/web/DB/Migrations/` |
| 启动、空库 seed、DB 引擎 | `src/BE/web/DB/Init/`（`InitService`、`DBConfigure`、`ChatsDbDesignTimeFactory`、`BasicData`） |
| HTTP API | `src/BE/web/Controllers/` |
| 模型协议 / MCP / Trace | `src/BE/web/Services/` |
| 上游对照 SQL（不执行） | `src/scripts/db-migration/` |
| 1.11→当前 schema ETL | `tools/DataMigration/` |
| 前端页面 | `src/FE/pages/` |
| 聊天壳 / 侧边栏 | `src/FE/components/Home/`、`Chatbar/`、`shadcn-space/blocks/sidebar-01/` |
| changelog / 海报 | `src/FE/data/changelog.json`、`pages/changelog/`、`pages/poster/`、`pages/admin/changelog/` |

生产 SQLite 默认 `src/BE/web/AppData/chats.db`。不要提交 `*.db`、`bin/`、`obj/`、`logs/`、`src/FE/.next/`。

## Schema 与 EF（本 Fork 的升级路径）

### 现状

| Migration | 作用 |
|---|---|
| `20260805155346_InitialCreate_v1_12` | 1.12 全量建表。已含 Fork 字段 `Chat.IsTemp` |
| `20260820131401_Upgrade_to_1_15` | 1.13–1.15 的增量（列/索引 + `migrationBuilder.Sql` 数据回填，例如 MCP `Label` → `DisplayName`/`Name`） |

`__EFMigrationsHistory` 是已应用版本的唯一真相。运行时：`InitService.Init` → `MigrateAsync` → 仅当 `Users` 为空才 `InsertInitialData`。

Design-time 工厂：`ChatsDbDesignTimeFactory`，连同一份 `AppData/chats.db`。

### 实体改完之后

1. 改 `src/BE/db/` 实体或 Fluent 配置。
2. `task ef:add -- SomeName`。命名跟上游版本时用 `Upgrade_to_1_16` 这种，不要再 `InitialCreate`。
3. 打开生成的 `Up`：缺的数据迁移用 `migrationBuilder.Sql("""...""")` 补上（对照上游 `*-sqlite.sql`，用 SQLite 方言：`TEXT` / `INTEGER`，标识符双引号）。
4. 编译。若 `ChatsDBModelSnapshot.cs` 基类冲突（实体 `Chats.DB.ModelSnapshot` 撞名），改成：

```csharp
partial class ChatsDBModelSnapshot : Microsoft.EntityFrameworkCore.Infrastructure.ModelSnapshot
```

5. 空库或开发库：`task ef:update` 或直接启动后端。不要手改已提交的 Designer / ModelSnapshot，除非在修生成结果。

### 把上游 SQL 翻成 EF

上游每个小版本在 `src/scripts/db-migration/{ver}/` 下有 `*.sql` 和 `*-sqlite.sql`。合并后：

1. 只读 sqlite 变体，忽略 SQL Server 变体。
2. DDL 尽量用 `MigrationBuilder` API；`UPDATE`/`INSERT` 回填用 `Sql()`。
3. 一次上游发版对应一次本仓库 migration。不要改写已经发布的 `InitialCreate_v1_12` / `Upgrade_to_1_15` 的 `Up`（已有库不会重跑）。
4. 本 Fork 多出来的列（至少 `Chat.IsTemp`）必须出现在后续 snapshot 里，合并实体时若上游重生成了 `Chat.cs`，把 `IsTemp` 加回去。

### 什么库能跑 EF，什么不能

- **空文件 / 本 Fork 1.12+ 已有 `__EFMigrationsHistory`**：启动或 `ef database update`。
- **上游手工 SQL 堆出来的库、或 1.11 扁平结构**：`tools/DataMigration`（`ProdSqliteV111ToV115Job`）。目标库用本仓库 migrations 建空 schema，再 ATTACH 源库拷数据。源库只读，不要 in-place 改生产备份。

## 合并上游（playbook）

```bash
git fetch upstream
git checkout -b merge/upstream-<ver>
git merge upstream/main
```

冲突时：**功能代码可以接上游；下面这些文件默认留本 Fork 侧，再手工把上游新逻辑打进来。**

### 几乎每次都会冲突、且不能整文件取上游

| 文件 | 本 Fork 必须留下的 |
|---|---|
| `src/BE/web/DB/Init/InitService.cs` | `MigrateAsync`；空库才 seed；`DefaultPrompt` 为 Ayaka |
| `src/BE/web/DB/Init/DBConfigure.cs` | SQLite + `MigrationsAssembly`；非 sqlite 抛错 |
| `src/BE/web/DB/Init/ChatsDbDesignTimeFactory.cs` | 本 Fork 新增，不要删 |
| `src/BE/web/DB/Migrations/**` | 本 Fork 新增。上游没有这些文件 |
| `src/BE/db/Chats.DB.csproj` | 只引用 `Microsoft.EntityFrameworkCore.Sqlite` |
| `src/BE/web/Chats.BE.csproj` | 有 `Sqlite` + `Design`；无 SqlServer/Npgsql |
| `src/BE/web/appsettings.json` | `DBType=sqlite` 注释；不要加回多引擎示例当默认 |
| `src/BE/web/Program.cs` | User-Agent `Ayaka-Chats/{version}` |
| `src/BE/db/Chat.cs` | `IsTemp` |
| `src/BE/web/Controllers/Chats/UserChats/UserChatsController.cs` | `IsTemp`、消息正文搜索、`MatchedContent`、`DELETE .../temp` |
| `src/BE/web/Infrastructure/CORS.cs` | `localhost:12836` |
| `src/FE/package.json` | pnpm；`dev --port 12836`；`www` 脚本 |
| `Taskfile.yml` / `Procfile` / `dotnet-tools.json` | 本 Fork 新增 |
| `README.md` / `README_EN.md` / 本文件 | 不要接上游 README |

### 前端：按块接，不要整页覆盖

上游聊天功能可以进 `ChatView`、消息气泡、MCP、工具卡。下面这些是本 Fork 长期分叉，合并后要重新编译检查，而不是 `git checkout --theirs`：

- `src/FE/components/Home/HomeContent.tsx`
- `src/FE/components/Chatbar/**`、`components/Sidebar/Sidebar.tsx`、`components/ui/sidebar.tsx`
- `src/FE/components/shadcn-space/blocks/sidebar-01/**`
- `src/FE/components/Chat/NoChat.tsx`（欢迎页 + 临时聊天）
- `src/FE/components/Search/**`、`src/FE/utils/highlight.tsx`
- `src/FE/pages/login/index.tsx`、`pages/model-prices/index.tsx`
- `src/FE/pages/poster/`、`pages/changelog/`、`pages/admin/changelog/`、`src/FE/data/changelog.json`
- `src/FE/components/Poster/**`
- `src/FE/utils/website.ts`（GitHub → `deali-axy`）

`src/FE/components.json` 带 `@shadcn-space` registry，不要改回上游默认。

### 合并后必做

1. 看上游 `src/scripts/db-migration/` 相对上次 merge 是否有新目录。有则按上一节新增 EF migration。
2. 实体若被上游改过，确认 `Chat.IsTemp` 还在，`ChatsDB` 仍能编译。
3. `task test:be`。
4. 前端 `pnpm`，不要 npm。
5. 启动一次后端，确认日志是 `Applying EF Core migrations` 而不是 `Database created`。
6. 更新 `README.md` 里「最新版本」和升级说明（本 Fork 不写「请执行 xxx.sql」）。

历史 merge 分支名：`merge/upstream-1.12`、`merge/upstream-1.15`。继续用这个模式。

## 本 Fork 相对上游多出来的产品行为

合并功能时这些要还在：

- 临时聊天：`Chat.IsTemp`；侧边栏常驻；结束才硬删除（`DELETE /temp`）。注释里「切换即删」已过时，以当前前端为准。
- 会话搜索：标题 / 标签 / `StepContentText`，响应带 `matchedContent`。
- 访问 `/home` 不自动选中第一条会话；`NoChat` 欢迎卡。
- 模型定价本地页。
- changelog + 海报。
- 登录页 Ayaka 图和邀请/联系 UI。

## 不要改 / 不要提交

- 不要把 `src/scripts/db-migration` 接到运行时。
- 不要在 `InitService` 里对已有库重新 seed。
- 不要提交 `src/BE/web/AppData/*.db*`、`etl-report.json`、`dist/` 运行产物。
- `tools/DataMigration/src/Framework`：用户没要求就别动脚手架。
- 文档 `doc/**` 大量仍是上游口吻（SQL Server、手工 SQL）。改文档时与本 Fork 事实对齐，但不要为了「看起来完整」把多数据库部署指南写回成支持项。

## 技术栈摘要

- 后端：ASP.NET Core 10、EF Core 10 SQLite、Swagger
- 前端：Next.js 16 pages router、Tailwind、shadcn/ui、pnpm
- 本地工具：`dotnet-ef` 10.0.x（`dotnet-tools.json`）
- 生产镜像名：`ayaka-chats`（`scripts/build_push.py`）。`sdcb/chats` 是上游，不是本 Fork。
