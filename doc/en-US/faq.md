# FAQ

**English** | [简体中文](../zh-CN/faq.md)

## How do I change the port?

Set `ASPNETCORE_URLS` or pass `--urls`:

```bash
ASPNETCORE_URLS=http://+:5000 dotnet run --project src/BE/web/Chats.BE.csproj
```

## Can I use SQL Server or PostgreSQL?

No. Ayaka Chats supports SQLite only. Keep `DBType` set to `sqlite` and configure the file path with `ConnectionStrings__ChatsDB`.

## How is the database upgraded?

Databases from this project using 1.12+ migrations are upgraded automatically when the backend starts. For SQLite databases from 1.11 or earlier, use [`tools/DataMigration`](../../tools/DataMigration/README.md).

## I forgot the administrator password. What should I do?

Back up `AppData/chats.db` first, then reset the password through the database. For a disposable new installation, you can instead delete the database file and initialize it again.

## How do I report a problem?

Open an [Ayaka Chats issue](https://github.com/Deali-Axy/chats/issues) with reproduction steps, the version, and any necessary redacted logs.
