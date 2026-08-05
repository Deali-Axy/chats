# Ayaka Chats [![License](https://img.shields.io/github/license/Deali-Axy/chats)](LICENSE)

**English** | [简体中文](README.md)

> A community fork of [sdcb/chats](https://github.com/sdcb/chats).

Ayaka Chats is a powerful and flexible unified frontend for large language models, supporting 22+ mainstream AI model providers. Building on top of the upstream project, Ayaka Chats focuses on **UI/UX improvements**, **developer toolchain enhancements**, and **independent feature iteration**.

## 🌸 Fork Highlights

While inheriting all upstream capabilities, Ayaka Chats introduces the following improvements:

### 🎨 UI/UX Overhaul

- **Redesigned Sidebar**: Rebuilt the chat sidebar using the shadcn/ui `sidebar-01` block for a more modern look and smoother interactions
- **Homepage Layout Upgrade**: Refactored the homepage layout with `SidebarProvider`, fixing issues like the search bar and menu button overlapping each other
- **Temporary Chat Improvements**: Temporary chats now persist in the sidebar and survive tab switching; fixed multiple issues including model editing, duplicate creation, and the end-chat button not working; replaced banners with subtle background colors for a cleaner look
- **Model Pricing Page**: Refactored into a local component with full-width display for a better experience

### 🛠️ Developer Toolchain

- **pnpm Package Manager**: Migrated the frontend from npm to pnpm for faster installs and smaller disk footprint
- **Automation Scripts**: Added unified build, package, push, and deploy scripts to streamline CI/CD
- **goreman Concurrent Startup**: One-command dev environment via `Procfile` + `Taskfile` running both frontend and backend

### 📢 Independent Features

- **Release Poster**: Auto-generated v1.13.0 release poster with one-click image copy for sharing

---

## ✨ Core Features

All capabilities inherited from upstream:

- 🚀 **All-in-One**: One hub for 22+ AI model providers
- 🎯 **Ready in Minutes**: One-command Docker deploy, plus native executables for 8 platforms
- 🐳 **Code Interpreter**: Docker sandbox with built-in tools (browser, code execution, Excel, and more)
- 🔌 **API Gateway**: Chat Completions/Messages compatible, works with Claude Code
- 🌐 **Standard APIs**: Chat Completions/Messages/Responses/Gemini, with interleaved thinking
- 🔍 **Observability**: Request Trace provides end-to-end inbound and outbound HTTP tracing for faster troubleshooting
- 👁️ **Multimodal**: Vision in, images out
- 💾 **Storage Freedom**: SQLite/SQL Server/PostgreSQL, plus Local/S3/OSS/Azure Blob
- 🔐 **Enterprise Security**: Permissions & balance control, rate limiting & audit logs, Keycloak SSO & SMS login

<img alt="chats" src="https://github.com/user-attachments/assets/106ece3f-d94d-460e-9313-4a01f624a647" />

## 🆕 Latest Release (1.12.0)

- 📅 Release Date: 2026-06-14
- 🧩 Request customization: Model Key and Model support custom headers and RFC 6902 JSON Patch body patches, with Model-level settings overriding Key-level settings
- 🌐 Custom URL: Model adds `Custom URL` with `{baseUrl}` placeholder support for gateways, proxies, and provider-specific endpoints
- 🧾 Configuration snapshots: adds `ModelKeySnapshot`, `ModelSnapshot`, and `ChatConfigSnapshot` so historical chats, usage, and billing reference immutable configuration facts
- 🤖 Claude Code compatibility: Anthropic Messages supports in-message `role=system`, matching the latest Claude Code request structure
- 🖼️ Image and UX fixes: image generation supports output format/compression, with fixes for image preview, model ordering, signed file URL caching, and protocol compatibility
- 🛠️ Upgrade focus: the migration restructures model configuration references and removes old mutable config columns and `ChatConfigArchived`; custom SQL/reports should read snapshot tables instead

👉 [View 1.12.0 Release Notes](./doc/en-US/release-notes/1.12.0.md) · [View All Releases](./doc/en-US/release-notes/README.md)

## Quick Start

Start with a single command (requires Docker):

```bash
mkdir -p ./AppData && chmod 755 ./AppData && docker run --restart unless-stopped --name sdcb-chats -e DBType=sqlite -e ConnectionStrings__ChatsDB="Data Source=./AppData/chats.db" -v ./AppData:/app/AppData -v /var/run/docker.sock:/var/run/docker.sock --user 0:0 -p 8080:8080 sdcb/chats:latest
```

After startup, visit `http://localhost:8080` and log in with the default account `chats` / `RESET!!!`.

📖 **[View Full Deployment Guide](./doc/en-US/quick-start.md)** - Including Docker deployment, executable deployment, database configuration, and more.

---

## 📚 Documentation

- [🚀 Quick Start](./doc/en-US/quick-start.md) - Deployment guide, Docker configuration, database setup
- [💾 Downloads](./doc/en-US/downloads.md) - Docker images and executable file downloads
- [🤖 Supported Model Providers](./doc/en-US/model-providers.md) - 22+ model providers list and support status
- [🛠️ Development Guide](./doc/en-US/build.md) - How to compile and develop Chats
- [⚙️ Configuration Guide](./doc/en-US/configuration.md) - Detailed configuration parameters
- [📝 Release Notes](./doc/en-US/release-notes/README.md) - Version update history
- [❓ FAQ](./doc/en-US/faq.md) - Common questions about deployment and usage

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | C# / .NET 10.0 / ASP.NET Core / Entity Framework Core |
| Frontend | TypeScript / Next.js 16 / React 19 / Tailwind CSS / shadcn/ui |
| Database | SQLite / SQL Server / PostgreSQL |
| Storage | Local filesystem / AWS S3 / Aliyun OSS / Azure Blob / MinIO |
| Package Manager | pnpm (frontend) / NuGet (backend) |
| Container | Docker / Docker Compose |

---

## Relationship with Upstream

This project is forked from [sdcb/chats](https://github.com/sdcb/chats) and continuously tracks and merges important upstream updates. Ayaka Chats aims to explore UI/UX improvements and developer experience enhancements on top of the upstream's stable feature set.

- **Upstream Repository**: [github.com/sdcb/chats](https://github.com/sdcb/chats)
- **Upstream Documentation**: [DeepWiki](https://deepwiki.com/sdcb/chats)
- **Upstream Issues**: [https://github.com/sdcb/chats/issues](https://github.com/sdcb/chats/issues)

---

## License

This project is licensed under the [Apache 2.0](LICENSE).

---

**If this project helps you, please give it a ⭐ Star!**
