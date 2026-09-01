# Ayaka Chats Development Guide

**English** | [简体中文](../zh-CN/build.md)

## Requirements

- .NET SDK 10
- Node.js 20+
- pnpm
- Task; goreman is also required for `task dev`

## Clone and start

```bash
git clone https://github.com/Deali-Axy/chats.git
cd chats
cd src/FE && pnpm install && cd ../..
task dev
```

Common commands:

```bash
task dev:be
task dev:fe
task test:be
task ef:list
task ef:update
```

The frontend uses pnpm; do not create or commit `package-lock.json`. The backend runs at `http://localhost:5146` and the frontend at `http://localhost:12836` by default.

## Database

This project supports SQLite only. After changing an entity, run `task ef:add -- MigrationName` to create a migration; the backend automatically calls `Database.MigrateAsync` at startup. For legacy database migration, see [`tools/DataMigration`](../../tools/DataMigration/README.md).
