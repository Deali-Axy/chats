# Ayaka Chats [![License](https://img.shields.io/github/license/Deali-Axy/chats)](LICENSE)

**English** | [简体中文](README.md)

> A community fork of [sdcb/chats](https://github.com/sdcb/chats). Merge and schema rules for coding agents live in [AGENTS.md](./AGENTS.md) (Chinese).

Ayaka Chats is a unified frontend for large language models, supporting 22+ mainstream AI providers. On top of upstream, this fork uses an independent **SQLite + EF Core migrations** path, plus UI/UX work, developer toolchain changes, and features that are not in upstream.

Starting with **1.12**, schema evolution has diverged: upstream still ships hand-written SQL; this fork manages SQLite with EF Core and applies pending migrations on startup. Do **not** run files under `src/scripts/db-migration/` against a database that belongs to this fork.

## 🌸 Fork Highlights

### 🗄️ Database: EF Core migrations since 1.12

This is the most important difference, and the one most likely to break an upstream merge.

| | Upstream `sdcb/chats` | This fork `Ayaka Chats` |
|---|---|---|
| Engines | SQLite / SQL Server / PostgreSQL | **SQLite only** (PostgreSQL not enabled; SQL Server removed) |
| Empty database | `EnsureCreatedAsync` | `Database.MigrateAsync` |
| Version upgrades | Run `src/scripts/db-migration/{ver}/*.sql` by hand | EF migrations applied on startup |
| Where history lives | No EF history; SQL scripts per version | `src/BE/web/DB/Migrations/` |
| Pre-1.12 production DBs | Follow upstream SQL step by step | Use `tools/DataMigration` ETL. **Do not** `ef database update` on those files |

Current EF history:

- `InitialCreate_v1_12`: 1.12 baseline (includes fork fields such as `Chat.IsTemp`)
- `Upgrade_to_1_15`: one migration covering upstream 1.13–1.15 schema (plus data-backfill SQL)

New upstream SQL is **reference only**. After a merge, translate it into a new EF migration (e.g. `Upgrade_to_1_16`); do not execute it on this fork’s databases.

Upgrade notes:

- **This fork, 1.12+ SQLite**: start the backend; no manual SQL.
- **1.11 and older SQLite**: [`tools/DataMigration`](./tools/DataMigration/README.md).
- Upstream “run `1.15.0.sql` / `1.15.0-sqlite.sql` first” does **not** apply here.

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
- **Release pipeline**: `scripts/build_push.py` publishes backend, builds frontend, and pushes this fork’s `ayaka-chats` image
- **Poster data**: `task generate:poster` writes `src/FE/data/changelog.json` from git history

### 📢 Independent Features

- **Release poster**: `/poster` with one-click image copy
- **Changelog**: `/changelog`, plus an admin JSON editor
- **1.11 → 1.15 ETL**: [`tools/DataMigration`](./tools/DataMigration/README.md)

---

## ✨ Core Features

Inherited from upstream except for database engines and the upgrade path:

- 🚀 **All-in-One**: one hub for 22+ AI model providers
- 🎯 **Ready in minutes**: SQLite; empty DB is created, migrated, and seeded on startup
- 🐳 **Code Interpreter**: Docker sandbox (browser, code, Excel, and more)
- 🔌 **API Gateway**: Chat Completions/Messages compatible, works with Claude Code
- 🌐 **Standard APIs**: Chat Completions/Messages/Responses/Gemini, interleaved thinking
- 🔍 **Observability**: Request Trace end-to-end HTTP tracing
- 👁️ **Multimodal**: vision in, images out
- 💾 **Storage**: SQLite plus Local / S3 / OSS / Azure Blob / MinIO
- 🔐 **Enterprise Security**: permissions and balance, rate limits, audit logs, Keycloak SSO, SMS login

<img alt="chats" src="https://github.com/user-attachments/assets/106ece3f-d94d-460e-9313-4a01f624a647" />

## 🆕 Latest Release (1.15.0)

- 📅 Release Date: 2026-08-19
- 📝 Prompt convergence: keeps Prompt management and `/xxx` shortcuts, inserts selected content verbatim, removes all `{{...}}` substitutions
- 🧩 MCP metadata: separates protocol/display names, editable tool metadata, four annotation hints
- ⚡ MCP execution: up to four read-only tools in parallel, bounded retries for idempotent failures
- 🧰 Tool-call UX: parallel tools expand independently and collapse after completion
- 🧠 Responses reasoning: preserves signature boundaries and original item order
- 👥 MCP user assignment: compact four-column table
- ⬆️ **This fork**: existing 1.12+ DBs pick up `Upgrade_to_1_15` on startup; 1.11 and older use `tools/DataMigration`. Do not run upstream `1.15.0.sql`

👉 [View 1.15.0 Release Notes](./doc/en-US/release-notes/1.15.0.md) · [View All Releases](./doc/en-US/release-notes/README.md)

## Quick Start

This fork’s default path (needs [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0), [Node.js](https://nodejs.org/) ≥ 20, [pnpm](https://pnpm.io/), [Task](https://taskfile.dev/); concurrent start also needs [goreman](https://github.com/mattn/goreman)):

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

Production builds use `task deploy` (`scripts/build_push.py`). The image name is this fork’s `ayaka-chats`, not upstream `sdcb/chats`.

> The public image `sdcb/chats:latest` is **upstream**. It still supports SQL Server/PostgreSQL and hand-written SQL upgrades. It does **not** include this fork’s UI, temporary chats, or EF migrations. Do not deploy it as Ayaka Chats.

📖 **[Development Guide](./doc/en-US/build.md)** · **[Configuration](./doc/en-US/configuration.md)**

> Some pages under `doc/` still describe upstream (SQL Server, manual SQL). Treat this README and [AGENTS.md](./AGENTS.md) as the source of truth for the fork.

---

## 📚 Documentation

- [🚀 Quick Start](./doc/en-US/quick-start.md) — includes upstream multi-database notes; this fork is SQLite only
- [💾 Downloads](./doc/en-US/downloads.md) — upstream Docker / executables
- [🤖 Supported Model Providers](./doc/en-US/model-providers.md)
- [🛠️ Development Guide](./doc/en-US/build.md)
- [⚙️ Configuration Guide](./doc/en-US/configuration.md)
- [📝 Release Notes](./doc/en-US/release-notes/README.md)
- [❓ FAQ](./doc/en-US/faq.md)
- [🤖 Agent notes](./AGENTS.md) — upstream merges, EF migrations, fork-only changes

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
| Container | Docker (fork image `ayaka-chats`) |

---

## Relationship with Upstream

Forked from [sdcb/chats](https://github.com/sdcb/chats) (`upstream` remote). Features track upstream, but the **schema upgrade path is independent**, and UI/toolchain have lasting forks. Read [AGENTS.md](./AGENTS.md) before merging.

- **This repo**: [github.com/Deali-Axy/chats](https://github.com/Deali-Axy/chats)
- **Upstream**: [github.com/sdcb/chats](https://github.com/sdcb/chats)
- **Upstream docs**: [DeepWiki](https://deepwiki.com/sdcb/chats)
- **Upstream issues**: [https://github.com/sdcb/chats/issues](https://github.com/sdcb/chats/issues)

Do not revert these decisions in a merge:

1. `InitService` must call `MigrateAsync`, never `EnsureCreatedAsync`
2. `DBConfigure` accepts `sqlite` only; do not restore SQL Server / Npgsql packages unless that work is explicitly requested
3. New upstream SQL becomes a new file under `src/BE/web/DB/Migrations/`, not a runtime script
4. Keep `Chat.IsTemp`, in-message search, pnpm, the sidebar, poster/changelog, and Ayaka branding

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
