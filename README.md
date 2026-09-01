# Ayaka Chats [![License](https://img.shields.io/github/license/Deali-Axy/chats)](LICENSE)

[English](README_EN.md) | **简体中文**

> Ayaka Chats 是一个独立维护的开源项目。给编码 Agent 的仓库约定见 [AGENTS.md](./AGENTS.md)。

Ayaka Chats 是一个大语言模型统一前端，支持 22+ 主流 AI 模型服务商，使用 **SQLite + EF Core migrations** 管理数据库，并持续迭代 UI/UX、开发工具链和产品功能。

从 **1.12** 起，数据库 schema 由 EF Core migrations 管理，后端启动时自动 `Migrate`。不要对生产数据库手工执行 `src/scripts/db-migration/` 里的 SQL。

## 🌸 项目特色

### 🗄️ 数据库：从 1.12 起使用 EF Core migrations

Ayaka Chats 仅支持 SQLite。空库与已使用本项目 migration 的数据库会在启动时通过 `Database.MigrateAsync` 自动升级；migration 位于 `src/BE/web/DB/Migrations/`。

当前 EF 历史：

- `InitialCreate_v1_12`：1.12 基线（含本 Fork 的 `Chat.IsTemp` 等字段）
- `Upgrade_to_1_15`：1.13–1.15 的 schema 变更与必要的数据回填
- `Upgrade_to_1_16`：Model 物理删除支持（`ChatConfig.ModelId` 可空及相关外键删除策略）
- `Upgrade_to_1_17`：图像生成背景模式（`ChatConfig` 及其快照的 `Background` 字段）

升级注意：

- **1.12+ 的 SQLite**：启动后端即可，无需手工 SQL。
- **1.11 及更早的 SQLite**：走 [`tools/DataMigration`](./tools/DataMigration/README.md)，把扁平结构灌进当前 EF schema。

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
- **构建部署**：`scripts/build_push.py` 发布后端、构建前端、打 Docker 并推送到配置的镜像仓库
- **海报数据**：`task generate:poster` 从 git 历史生成 `src/FE/data/changelog.json`

### 📢 独立功能

- **版本海报**：`/poster` 一键复制图片；数据源为 changelog JSON
- **更新日志页**：`/changelog`，管理后台可编辑 JSON
- **1.11 → 1.15 ETL**：[`tools/DataMigration`](./tools/DataMigration/README.md) 把生产 1.11 SQLite 迁到当前 schema

---

## ✨ 核心功能

- 🚀 **一站式**：22+ 模型服务商，一个入口
- 🎯 **分钟级上手**：以 SQLite 为主，空库启动即自动建表和种子数据
- 🐳 **代码解释器**：Docker 沙箱，内置浏览器/代码执行/Excel 等工具
- 🔌 **API 网关**：Chat Completions/Messages 兼容，支持 Claude Code
- 🌐 **标准协议**：Chat Completions/Messages/Responses/Gemini，支持交错思考
- 🔍 **可观测性**：Request Trace 全链路追踪
- 👁️ **多模态**：视觉输入，图像生成
- 💾 **存储**：SQLite + 本地 / AWS S3 / 阿里云 OSS / Azure Blob / MinIO
- 🔐 **企业级安全**：用户权限与余额、限流审计、Keycloak SSO、短信登录

<img alt="chats" src="https://github.com/user-attachments/assets/106ece3f-d94d-460e-9313-4a01f624a647" />

## 🆕 最新版本（1.17.0）

- 📅 发布日期：2026-08-27
- ⚡ 响应速度统计：Token 速度排除首 Token（TTFT）等待时间，仅统计生成阶段
- 🖼️ 图像生成背景模式：支持默认、`auto`、`opaque` 和 `transparent`
- 🧠 模型上下文提示词：图像生成直接使用用户原文，保留必要运行时上下文
- 🌳 聊天分支稳定性：修复实时 SSE 分支元数据和无效子树请求
- 👥 用户管理：拆分用户编辑和修改密码表单，改善密码管理器兼容性
- 🐛 稳定性修复：修复图像接口重复 `/v1`、缺少模型校验并增加回归测试
- ⬆️ **升级**：已有 1.12+ SQLite 库启动时自动应用 `Upgrade_to_1_17`；1.11 及更早请用 `tools/DataMigration`。

👉 [查看 1.17.0 发布说明](./doc/zh-CN/release-notes/1.17.0.md) · [查看全部版本](./doc/zh-CN/release-notes/README.md)

## 快速开始

开发默认路径（需要 [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)、[Node.js](https://nodejs.org/) ≥ 20、[pnpm](https://pnpm.io/)、[Task](https://taskfile.dev/)；并发启动还需要 [goreman](https://github.com/mattn/goreman)）：

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

生产构建走 `task deploy`（`scripts/build_push.py`），默认镜像名是 `ayaka-chats`。

📖 **[开发指南](./doc/zh-CN/build.md)** · **[配置说明](./doc/zh-CN/configuration.md)**

---

## 📚 文档中心

- [🚀 快速开始](./doc/zh-CN/quick-start.md) - 部署指南
- [💾 下载地址](./doc/zh-CN/downloads.md) - 本项目发布与构建说明
- [🤖 支持的模型提供商](./doc/zh-CN/model-providers.md)
- [🛠️ 开发指南](./doc/zh-CN/build.md)
- [⚙️ 配置说明](./doc/zh-CN/configuration.md)
- [📝 更新日志](./doc/zh-CN/release-notes/README.md)
- [❓ 常见问题](./doc/zh-CN/faq.md)
- [🤖 Agent 约定](./AGENTS.md) - 仓库维护与 EF migration 约定

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
| 容器 | Docker（镜像 `ayaka-chats`） |

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
