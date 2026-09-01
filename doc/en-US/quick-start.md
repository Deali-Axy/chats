# Quick Start

**English** | [简体中文](../zh-CN/quick-start.md)

Ayaka Chats uses SQLite and EF Core migrations. On its first start, the backend creates the database and inserts the initial data.

## Local development

Install [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0), Node.js 20+, pnpm, Task, and goreman.

```bash
git clone https://github.com/Deali-Axy/chats.git
cd chats
cd src/FE && pnpm install && cd ../..
task dev
```

- Frontend: `http://localhost:12836`
- Backend: `http://localhost:5146` (Swagger at `/swagger` in Development)
- Initial account: `chats` / `RESET!!!`; change the password immediately after first sign-in.

## Container deployment

Build and publish an image through the project release script:

```bash
task deploy
```

Mount a persistent volume for `AppData`; the database is stored at `AppData/chats.db`. This project supports SQLite only and applies EF Core migrations when the service starts.

## Upgrading an existing database

- Databases already using this project's 1.12+ migrations: start the backend.
- SQLite databases from 1.11 or earlier: use [`tools/DataMigration`](../../tools/DataMigration/README.md).

Do not manually run SQL files under `src/scripts/db-migration/` against a production database.
