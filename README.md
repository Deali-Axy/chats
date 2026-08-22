# Ayaka Chats [![License](https://img.shields.io/github/license/Deali-Axy/chats)](LICENSE)

[English](README_EN.md) | **简体中文**

> 基于 [sdcb/chats](https://github.com/sdcb/chats) 的社区 Fork。给编码 Agent 的合并约定见 [AGENTS.md](./AGENTS.md)。

Ayaka Chats 是一个大语言模型统一前端，支持 22+ 主流 AI 模型服务商。本 Fork 在上游功能之上，走 **SQLite + EF Core migrations** 的独立数据库路线，并持续做 UI/UX、开发工具链和独立功能迭代。

从 **1.12** 起，本仓库与上游在表结构演进上已经分叉：上游继续用手工 SQL 改库；本 Fork 用 EF Core 管理 SQLite schema，启动时自动 `Migrate`。不要再对本 Fork 的数据库执行 `src/scripts/db-migration/` 里的 SQL。

## 🌸 Fork 特色

### 🗄️ 数据库：从 1.12 起使用 EF Core migrations

这是本 Fork 与上游最关键、也最容易在合并时踩坑的差异。

| | 上游 `sdcb/chats` | 本 Fork `Ayaka Chats` |
|---|---|---|
| 支持的库 | SQLite / SQL Server / PostgreSQL | **仅 SQLite**（PostgreSQL 未启用；SQL Server 已移除） |
| 空库初始化 | `EnsureCreatedAsync` | `Database.MigrateAsync` |
| 版本升级 | 手工跑 `src/scripts/db-migration/{ver}/*.sql` | 启动时自动应用 EF migrations |
| Migration 位置 | 无 EF 历史；SQL 脚本按版本堆积 | `src/BE/web/DB/Migrations/` |
| 1.11 及更早的生产库 | 按上游 SQL 逐步升级 | 用 `tools/DataMigration` ETL，**不要**对旧库直接 `ef database update` |

当前 EF 历史：

- `InitialCreate_v1_12`：1.12 基线（含本 Fork 的 `Chat.IsTemp` 等字段）
- `Upgrade_to_1_15`：一次覆盖上游 1.13–1.15 的 schema 变更（含必要的数据回填 SQL）

上游每次发版新增的 SQL **只作对照**，合并后要翻译成新的 EF migration（例如 `Upgrade_to_1_16`），而不是拿到生产库上执行。

升级注意：

- **本 Fork 1.12+ 的 SQLite**：启动后端即可，无需手工 SQL。
- **1.11 及更早的 SQLite**：走 [`tools/DataMigration`](./tools/DataMigration/README.md)，把扁平结构灌进当前 EF schema。
- 上游文档里「先跑 `1.15.0.sql` / `1.15.0-sqlite.sql`」的步骤 **不适用于本 Fork**。

### 🎨 UI/UX

- **全新侧边栏**：基于 shadcn/ui `sidebar-01` block 重做聊天侧边栏
- **首页框架**：`SidebarProvider` 重构首页，避免搜索栏与菜单按钮互相遮挡
- **临时聊天**：侧边栏持久显示、切换不自动删除；修复模型修改、重复创建、结束按钮等；用背景色区分替代横幅
- **会话搜索**：可搜标题、标签和消息正文，结果高亮
- **模型定价页**：本地组件、全宽表格，支持搜索 / 免费过滤 / 排序
- **登录页**：Ayaka 品牌轮播、邀请制提示与联系入口
- **欢迎页**：未选会话时引导新建聊天 / 临时聊天

### 🛠️ 开发工具链

- **pnpm**：前端从 npm 迁到 pnpm（不要再提交 `package-lock.json`）
- **Taskfile + goreman**：`task dev` 一键起前后端（前端默认 `http://localhost:12836`）
- **EF 命令**：`task ef:add` / `task ef:update` / `task ef:list`
- **构建部署**：`scripts/build_push.py` 发布后端、构建前端、打 Docker 并推送到本 Fork 的镜像仓库
- **海报数据**：`task generate:poster` 从 git 历史生成 `src/FE/data/changelog.json`

### 📢 独立功能

- **版本海报**：`/poster` 一键复制图片；数据源为 changelog JSON
- **更新日志页**：`/changelog`，管理后台可编辑 JSON
- **1.11 → 1.15 ETL**：[`tools/DataMigration`](./tools/DataMigration/README.md) 把生产 1.11 SQLite 迁到当前 schema

---

## ✨ 核心功能

继承自上游（除数据库引擎与升级方式外）：

- 🚀 **一站式**：22+ 模型服务商，一个入口
- 🎯 **分钟级上手**：本 Fork 以 SQLite 为主，空库启动即自动建表和种子数据
- 🐳 **代码解释器**：Docker 沙箱，内置浏览器/代码执行/Excel 等工具
- 🔌 **API 网关**：Chat Completions/Messages 兼容，支持 Claude Code
- 🌐 **标准协议**：Chat Completions/Messages/Responses/Gemini，支持交错思考
- 🔍 **可观测性**：Request Trace 全链路追踪
- 👁️ **多模态**：视觉输入，图像生成
- 💾 **存储**：SQLite + 本地 / AWS S3 / 阿里云 OSS / Azure Blob / MinIO
- 🔐 **企业级安全**：用户权限与余额、限流审计、Keycloak SSO、短信登录

<img alt="chats" src="https://github.com/user-attachments/assets/106ece3f-d94d-460e-9313-4a01f624a647" />

## 🆕 最新版本（1.15.0）

- 📅 发布日期：2026-08-19
- 📝 Prompt 收敛：保留 Prompt 管理和 `/xxx` 快捷选择，选中内容原样插入，并移除所有 `{{...}}` 变量替换
- 🧩 MCP 元数据：分离协议名称与显示名称，支持工具元数据编辑和四个 annotation hint 同步
- ⚡ MCP 执行优化：只读工具最多四个并行，幂等失败有限重试，并保持调用顺序稳定
- 🧰 工具调用展示：并行工具独立展开，参数和 progress 期间保持展开，完成后延时收起
- 🧠 Responses 推理回传：保留 reasoning signature 边界及 reasoning/tool/message 原始顺序
- 👥 MCP 用户分配：紧凑四列表格、长用户名省略、多行 JSON 请求头
- ⬆️ **本 Fork 升级**：已有 1.12+ 库启动时自动 `Upgrade_to_1_15`；1.11 及更早请用 `tools/DataMigration`。不要跑上游的 `1.15.0.sql`

👉 [查看 1.15.0 发布说明](./doc/zh-CN/release-notes/1.15.0.md) · [查看全部版本](./doc/zh-CN/release-notes/README.md)

## 快速开始

本 Fork 的开发默认路径（需要 [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)、[Node.js](https://nodejs.org/) ≥ 20、[pnpm](https://pnpm.io/)、[Task](https://taskfile.dev/)；并发启动还需要 [goreman](https://github.com/mattn/goreman)）：

```bash
git clone https://github.com/Deali-Axy/chats.git
cd chats
cd src/FE && pnpm install && cd ../..
task dev
```

- 后端：`http://localhost:5146`（开发环境 Swagger：`/swagger`）
- 前端：`http://localhost:12836`
- 默认账号：`chats` / `RESET!!!`（请立刻改密）
- SQLite 文件：`src/BE/web/AppData/chats.db`（不存在则自动创建并 seed）

没有 Task 时：

```bash
# 终端 1
cd src/BE/web && dotnet run --project Chats.BE.csproj
# 终端 2
cd src/FE && pnpm run dev
```

生产构建走 `task deploy`（`scripts/build_push.py`），镜像名是本 Fork 的 `ayaka-chats`，不是上游的 `sdcb/chats`。

> 公开镜像 `sdcb/chats:latest` 是**上游**产物：它仍支持 SQL Server/PostgreSQL，并用手工 SQL 升级，**不包含**本 Fork 的 UI、临时聊天、EF migrations。不要拿它当 Ayaka Chats 来部署。

📖 **[开发指南](./doc/zh-CN/build.md)** · **[配置说明](./doc/zh-CN/configuration.md)**

> 文档中心里部分页面仍沿用上游表述（例如 SQL Server / 手工 SQL）。以本 README 和 [AGENTS.md](./AGENTS.md) 为准。

---

## 📚 文档中心

- [🚀 快速开始](./doc/zh-CN/quick-start.md) - 部署指南（含上游多数据库说明，本 Fork 仅 SQLite）
- [💾 下载地址](./doc/zh-CN/downloads.md) - 上游 Docker / 可执行文件
- [🤖 支持的模型提供商](./doc/zh-CN/model-providers.md)
- [🛠️ 开发指南](./doc/zh-CN/build.md)
- [⚙️ 配置说明](./doc/zh-CN/configuration.md)
- [📝 更新日志](./doc/zh-CN/release-notes/README.md)
- [❓ 常见问题](./doc/zh-CN/faq.md)
- [🤖 Agent 约定](./AGENTS.md) - 上游合并、EF migration、不要覆盖的 Fork 改动

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | C# / .NET 10.0 / ASP.NET Core / Entity Framework Core（SQLite migrations） |
| 前端 | TypeScript / Next.js 16 / React 19 / Tailwind CSS / shadcn/ui |
| 数据库 | **SQLite only**（EF Core `MigrateAsync`） |
| 存储 | 本地文件系统 / AWS S3 / 阿里云 OSS / Azure Blob / MinIO |
| 包管理 | pnpm（前端）/ NuGet（后端）/ `dotnet-ef`（本地工具） |
| 开发 | Task / goreman / Procfile |
| 容器 | Docker（本 Fork 镜像 `ayaka-chats`） |

---

## 与上游的关系

本项目 Fork 自 [sdcb/chats](https://github.com/sdcb/chats)，remote 名为 `upstream`。功能会跟进上游，但 **schema 升级路径已经独立**，UI 与工具链也有长期分叉。合并前请读 [AGENTS.md](./AGENTS.md)。

- **本仓库**：[github.com/Deali-Axy/chats](https://github.com/Deali-Axy/chats)
- **上游仓库**：[github.com/sdcb/chats](https://github.com/sdcb/chats)
- **上游文档**：[DeepWiki](https://deepwiki.com/sdcb/chats)
- **上游 Issues**：[https://github.com/sdcb/chats/issues](https://github.com/sdcb/chats/issues)

合并时不要还原这些决定：

1. `InitService` 必须 `MigrateAsync`，禁止改回 `EnsureCreatedAsync`
2. `DBConfigure` 只接受 `sqlite`；不要把 SQL Server / Npgsql 包和 `UseSqlServer` / `UseNpgsql` 加回来（除非明确要重新启用）
3. 上游新 SQL 要变成 `src/BE/web/DB/Migrations/` 里的新 migration，而不是运行时执行
4. 保留 `Chat.IsTemp`、消息内容搜索、pnpm、侧边栏、海报/changelog、Ayaka 品牌

---

## 特别感谢

<div align="left">
  <h1>RoutinAI</h1>
  <img width="154" height="151" src="https://routin.ai/favicon.png"/>
</div>

[RoutinAI](https://routin.ai/) 是一个企业级统一 LLM API 网关，提供单一、类型安全的接口，可访问来自 GPT、Claude 和 Gemini 系列的 100 多个主流大语言模型，包括 gpt-5.6-sol、claude-opus-5 和 gemini-3.1-pro-preview 等模型。它通过提供零延迟边缘路由、无需修改代码即可无缝切换模型、统一计费以及带有消费上限和访问策略的集中治理，消除了管理多个 AI 供应商的复杂性。

---

## 许可证

本项目采用 [Apache 2.0](LICENSE) 开源许可证。

---

**如果这个项目对你有帮助，欢迎给个 ⭐ Star！**
