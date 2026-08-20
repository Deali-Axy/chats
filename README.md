# Ayaka Chats [![License](https://img.shields.io/github/license/Deali-Axy/chats)](LICENSE)

[English](README_EN.md) | **简体中文**

> 基于 [sdcb/chats](https://github.com/sdcb/chats) 的社区 Fork 版本。

Ayaka Chats 是一个强大灵活的大语言模型统一前端，支持 22+ 主流 AI 模型服务商。在上游版本的基础上，Ayaka Chats 侧重于 **UI/UX 体验优化**、**开发工具链改进** 以及 **独立版本迭代**。

## 🌸 Fork 特色

在继承上游全部功能的前提下，Ayaka Chats 做了以下改进：

### 🎨 UI/UX 重构

- **全新侧边栏**：基于 shadcn/ui `sidebar-01` block 重新设计聊天侧边栏，视觉风格更现代、交互更流畅
- **首页框架升级**：使用 `SidebarProvider` 重构首页布局，解决了搜索栏与菜单按钮互相遮挡等交互问题
- **临时聊天优化**：支持临时聊天在侧边栏中持久显示、切换时不再自动删除；修复了临时聊天的模型修改、重复创建、结束按钮无效等多个问题；用背景色区分替代横幅，视觉更简洁
- **模型定价页改进**：重构为本地组件，改为全宽展示，体验更好

### 🛠️ 开发工具链

- **pnpm 包管理**：前端从 npm 迁移到 pnpm，依赖安装更快、磁盘占用更小
- **自动化脚本**：新增构建、打包、推送、部署一体化脚本，简化 CI/CD 流程
- **goreman 并发启动**：通过 `Procfile` + `Taskfile` 一键启动前后端开发环境

### 📢 独立版本功能

- **版本更新海报**：自动生成 v1.15.0 版本更新海报，支持一键复制图片分享

---

## ✨ 核心功能

继承自上游的全部能力：

- 🚀 **一站式**：22+ 模型服务商，一个入口
- 🎯 **分钟级上手**：一条命令 Docker 部署，8 平台原生可执行
- 🐳 **代码解释器**：Docker 沙箱，内置浏览器/代码执行/Excel 等工具
- 🔌 **API 网关**：Chat Completions/Messages 兼容，支持 Claude Code
- 🌐 **标准协议**：Chat Completions/Messages/Responses/Gemini，支持交错思考
- 🔍 **可观测性**：Request Trace 全链路追踪，快速定位入站/出站请求问题
- 👁️ **多模态**：视觉输入，图像生成
- 💾 **灵活存储**：SQLite/SQL Server/PostgreSQL + 本地/AWS S3/Aliyun OSS/Azure Blob
- 🔐 **企业级安全**：完善的用户权限管理和账户余额控制，限流审计日志，支持 Keycloak SSO 与短信验证码登录

<img alt="chats" src="https://github.com/user-attachments/assets/106ece3f-d94d-460e-9313-4a01f624a647" />

## 🆕 最新版本（1.15.0）

- 📅 发布日期：2026-08-19
- 📝 Prompt 收敛：保留 Prompt 管理和 `/xxx` 快捷选择，选中内容原样插入，并移除所有 `{{...}}` 变量替换
- 🧩 MCP 元数据：分离协议名称与显示名称，支持工具元数据编辑和四个 annotation hint 同步
- ⚡ MCP 执行优化：只读工具最多四个并行，幂等失败有限重试，并保持调用顺序稳定
- 🧰 工具调用展示：并行工具独立展开，参数和 progress 期间保持展开，完成后延时收起
- 🧠 Responses 推理回传：保留 reasoning signature 边界及 reasoning/tool/message 原始顺序，避免密文拼接错误
- 👥 MCP 用户分配：紧凑四列表格、长用户名省略、多行 JSON 请求头和可用用户列表即时更新
- ⬆️ 升级重点：SQL Server 和 SQLite 部署需运行对应的 `1.15.0` 数据库迁移脚本

👉 [查看 1.15.0 发布说明](./doc/zh-CN/release-notes/1.15.0.md) · [查看全部版本](./doc/zh-CN/release-notes/README.md)

## 快速开始

一条命令即可启动（需要 Docker）：

```bash
mkdir -p ./AppData && chmod 755 ./AppData && docker run --restart unless-stopped --name sdcb-chats -e DBType=sqlite -e ConnectionStrings__ChatsDB="Data Source=./AppData/chats.db" -v ./AppData:/app/AppData -v /var/run/docker.sock:/var/run/docker.sock --user 0:0 -p 8080:8080 sdcb/chats:latest
```

启动后访问 `http://localhost:8080`，使用默认账号 `chats` / `RESET!!!` 登录。

📖 **[查看完整部署指南](./doc/zh-CN/quick-start.md)** - 包含 Docker 部署、可执行文件部署、数据库配置等详细说明。

---

## 📚 文档中心

- [🚀 快速开始](./doc/zh-CN/quick-start.md) - 部署指南、Docker 配置、数据库设置
- [💾 下载地址](./doc/zh-CN/downloads.md) - Docker 镜像和可执行文件下载
- [🤖 支持的模型提供商](./doc/zh-CN/model-providers.md) - 22+ 模型服务商列表及支持情况
- [🛠️ 开发指南](./doc/zh-CN/build.md) - 如何编译和开发 Chats
- [⚙️ 配置说明](./doc/zh-CN/configuration.md) - 详细配置参数说明
- [📝 更新日志](./doc/zh-CN/release-notes/README.md) - 版本更新记录
- [❓ 常见问题](./doc/zh-CN/faq.md) - 部署和使用中的常见问题解答

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | C# / .NET 10.0 / ASP.NET Core / Entity Framework Core |
| 前端 | TypeScript / Next.js 16 / React 19 / Tailwind CSS / shadcn/ui |
| 数据库 | SQLite / SQL Server / PostgreSQL |
| 存储 | 本地文件系统 / AWS S3 / 阿里云 OSS / Azure Blob / MinIO |
| 包管理 | pnpm (前端) / NuGet (后端) |
| 容器 | Docker / Docker Compose |

---

## 与上游的关系

本项目 Fork 自 [sdcb/chats](https://github.com/sdcb/chats)，持续关注并合并上游的重要更新。Ayaka Chats 的定位是在上游稳定功能的基础上，探索 UI/UX 改进和开发体验优化。

- **上游仓库**：[github.com/sdcb/chats](https://github.com/sdcb/chats)
- **上游文档**：[DeepWiki](https://deepwiki.com/sdcb/chats)
- **上游 Issues**：[https://github.com/sdcb/chats/issues](https://github.com/sdcb/chats/issues)

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
