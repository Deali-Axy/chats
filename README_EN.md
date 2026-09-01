# Ayaka Chats [![License](https://img.shields.io/github/license/Deali-Axy/chats)](LICENSE)

**English** | [简体中文](README.md)

> Ayaka Chats is an independently maintained open-source project. Repository conventions for coding agents live in [AGENTS.md](./AGENTS.md) (Chinese).

Ayaka Chats is a unified frontend for large language models, supporting 22+ mainstream AI providers. It uses **SQLite + EF Core migrations** and continues to improve UI/UX, developer tooling, and product features.

Starting with **1.12**, schema evolution is managed by EF Core migrations, which are applied on startup. Do **not** run files under `src/scripts/db-migration/` against a production database.

## 🌸 Highlights

### 🗄️ Database: EF Core migrations since 1.12

Ayaka Chats supports SQLite only. Empty databases and databases already using this project's migrations are upgraded through `Database.MigrateAsync`; migrations live under `src/BE/web/DB/Migrations/`.

Current EF history:

- `InitialCreate_v1_12`: 1.12 baseline (includes fork fields such as `Chat.IsTemp`)
- `Upgrade_to_1_15`: schema changes and required data backfills for 1.13–1.15
- `Upgrade_to_1_16`: support physical Model deletion (`ChatConfig.ModelId` becomes nullable and related foreign-key policies)
- `Upgrade_to_1_17`: image-generation background mode (`Background` on `ChatConfig` and its snapshots)

Upgrade notes:

- **1.12+ SQLite**: start the backend; no manual SQL.
- **1.11 and older SQLite**: [`tools/DataMigration`](./tools/DataMigration/README.md).

### 🎨 UI/UX

- **Sidebar**: rebuilt with the shadcn/ui `sidebar-01` block
- **Home layout**: `SidebarProvider`; search bar no longer covers the menu button
- **Temporary chats**: stay in the sidebar; switching chats does not auto-delete them; several create/edit/end bugs fixed
- **Search**: titles, tags, and message body, with highlights
- **Model pricing**: local full-width page with search / free-only / sort
- **Login**: Ayaka branding, carousel, invite-only copy and contact entry
- **Empty state**: prompts for a new chat or a temporary chat

### 🛠️ Developer Toolchain

- **pnpm** instead of npm (do not commit `package-lock.json`)
- **Taskfile + goreman**: `task dev` starts both sides (frontend `http://localhost:12836`)
- **EF commands**: `task ef:add` / `task ef:update` / `task ef:list`
- **Release pipeline**: `scripts/build_push.py` publishes backend, builds frontend, and pushes the configured `ayaka-chats` image
- **Poster data**: `task generate:poster` writes `src/FE/data/changelog.json` from git history

### 📢 Independent Features

- **Release poster**: `/poster` with one-click image copy
- **Changelog**: `/changelog`, plus an admin JSON editor
- **1.11 → 1.15 ETL**: [`tools/DataMigration`](./tools/DataMigration/README.md)

---

## ✨ Core Features

- 🚀 **All-in-One**: one hub for 22+ AI model providers
- 🎯 **Ready in minutes**: SQLite; an empty DB is created, migrated, and seeded on startup
- 🐳 **Code Interpreter**: Docker sandbox (browser, code, Excel, and more)
- 🔌 **API Gateway**: Chat Completions/Messages compatible, works with Claude Code
- 🌐 **Standard APIs**: Chat Completions/Messages/Responses/Gemini, interleaved thinking
- 🔍 **Observability**: Request Trace end-to-end HTTP tracing
- 👁️ **Multimodal**: vision in, images out
- 💾 **Storage**: SQLite plus Local / S3 / OSS / Azure Blob / MinIO
- 🔐 **Enterprise Security**: permissions and balance, rate limits, audit logs, Keycloak SSO, SMS login

<img alt="chats" src="https://github.com/user-attachments/assets/106ece3f-d94d-460e-9313-4a01f624a647" />

## 🆕 Latest Release (1.17.0)

- 📅 Release Date: 2026-08-27
- ⚡ Response speed: token speed excludes first-token (TTFT) latency and measures generation only
- 🖼️ Image-generation backgrounds: supports provider default, `auto`, `opaque`, and `transparent`
- 🧠 Context prompts: sends original user text to image-generation models and preserves required runtime context
- 🌳 Branching stability: fixes live SSE branch metadata and invalid subtree requests
- 👥 User management: separates user-edit and password-change forms and improves password-manager compatibility
- 🐛 Stability fixes: corrects duplicated `/v1` image endpoints, validates missing models, and adds regression coverage
- ⬆️ **Upgrade**: existing 1.12+ SQLite databases apply `Upgrade_to_1_17` automatically at startup; 1.11 and older use `tools/DataMigration`.

👉 [View 1.17.0 Release Notes](./doc/en-US/release-notes/1.17.0.md) · [View All Releases](./doc/en-US/release-notes/README.md)

## Quick Start

The default development path (needs [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0), [Node.js](https://nodejs.org/) ≥ 20, [pnpm](https://pnpm.io/), [Task](https://taskfile.dev/); concurrent start also needs [goreman](https://github.com/mattn/goreman)):

```bash
git clone https://github.com/Deali-Axy/chats.git
cd chats
cd src/FE && pnpm install && cd ../..
task dev
```

- Backend: `http://localhost:5146` (Swagger at `/swagger` in Development)
- Frontend: `http://localhost:12836`
- Default account: `chats` / `RESET!!!` (change immediately)
- SQLite file: `src/BE/web/AppData/chats.db` (created and seeded if missing)

Without Task:

```bash
# terminal 1
cd src/BE/web && dotnet run --project Chats.BE.csproj
# terminal 2
cd src/FE && pnpm run dev
```

Production builds use `task deploy` (`scripts/build_push.py`). The default image name is `ayaka-chats`.

📖 **[Development Guide](./doc/en-US/build.md)** · **[Configuration](./doc/en-US/configuration.md)**

---

## 📚 Documentation

- [🚀 Quick Start](./doc/en-US/quick-start.md) — deployment guide
- [💾 Downloads](./doc/en-US/downloads.md) — project release and build information
- [🤖 Supported Model Providers](./doc/en-US/model-providers.md)
- [🛠️ Development Guide](./doc/en-US/build.md)
- [⚙️ Configuration Guide](./doc/en-US/configuration.md)
- [📝 Release Notes](./doc/en-US/release-notes/README.md)
- [❓ FAQ](./doc/en-US/faq.md)
- [🤖 Agent notes](./AGENTS.md) — repository maintenance and EF migration conventions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | C# / .NET 10.0 / ASP.NET Core / Entity Framework Core (SQLite migrations) |
| Frontend | TypeScript / Next.js 16 / React 19 / Tailwind CSS / shadcn/ui |
| Database | **SQLite only** (EF Core `MigrateAsync`) |
| Storage | Local filesystem / AWS S3 / Aliyun OSS / Azure Blob / MinIO |
| Package Manager | pnpm (frontend) / NuGet (backend) / `dotnet-ef` (local tool) |
| Dev | Task / goreman / Procfile |
| Container | Docker (image `ayaka-chats`) |

---

## Special Thanks

<div align="left">
  <h1>RoutinAI</h1>
  <img width="154" height="151" src="https://routin.ai/favicon.png"/>
</div>

[RoutinAI](https://routin.ai/) is an enterprise-grade unified LLM API gateway that provides a single, type-safe interface to access over 100 leading large language models from the GPT, Claude, and Gemini families, including models such as gpt-5.6-sol, claude-opus-5 and gemini-3.1-pro-preview. It eliminates the complexity of managing multiple AI vendors by providing zero-latency edge routing, seamless model switching without code modifications, unified billing, and centralized governance with spending caps and access policies.

---

## License

This project is licensed under the [Apache 2.0](LICENSE).

---

**If this project helps you, please give it a ⭐ Star!**
