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

- **版本更新海报**：自动生成 v1.13.0 版本更新海报，支持一键复制图片分享

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

## 🆕 最新版本（1.12.0）

- 📅 发布日期：2026-06-14
- 🧩 请求自定义：Model Key 和 Model 支持自定义 Header 与 RFC 6902 JSON Patch 请求体补丁，Model 层可以覆盖 Key 层配置
- 🌐 自定义 URL：Model 新增 `Custom URL`，支持 `{baseUrl}` 占位符，便于适配网关、代理和厂商私有 endpoint
- 🧾 配置快照化：新增 `ModelKeySnapshot`、`ModelSnapshot`、`ChatConfigSnapshot`，历史会话、用量和账单引用不可变配置事实
- 🤖 Claude Code 兼容：Anthropic Messages 支持消息中的 `role=system`，兼容最新 Claude Code 请求结构
- 🖼️ 图像与体验：图像生成支持输出格式/压缩，修复图片预览、模型排序、签名文件 URL 缓存和多项协议兼容问题
- 🛠️ 升级重点：迁移脚本会重构模型配置引用关系，删除旧的可变配置列和 `ChatConfigArchived` 表；自定义 SQL/报表需要改读 snapshot 表

👉 [查看 1.12.0 发布说明](./doc/zh-CN/release-notes/1.12.0.md) · [查看全部版本](./doc/zh-CN/release-notes/README.md)

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

## 许可证

本项目采用 [Apache 2.0](LICENSE) 开源许可证。

---

**如果这个项目对你有帮助，欢迎给个 ⭐ Star！**
