# EF Core Migrations (SQLite only)

Ayaka Chats uses **EF Core migrations for SQLite only**.

## Commands

From repo root (requires `dotnet tool restore`):

```bash
# Add a migration after entity changes
dotnet tool run dotnet-ef migrations add <Name> \
  --project src/BE/web/Chats.BE.csproj \
  --startup-project src/BE/web/Chats.BE.csproj \
  --context ChatsDB \
  --output-dir DB/Migrations

# Apply migrations
dotnet tool run dotnet-ef database update \
  --project src/BE/web/Chats.BE.csproj \
  --startup-project src/BE/web/Chats.BE.csproj \
  --context ChatsDB
```

Runtime also applies pending migrations on startup via `InitService` (`Database.MigrateAsync`).

## Name collision note

Entity `Chats.DB.ModelSnapshot` collides with EF's `Microsoft.EntityFrameworkCore.Infrastructure.ModelSnapshot`.

After generating a new migration, if `ChatsDBModelSnapshot.cs` fails to compile, change the base class to the fully qualified EF type:

```csharp
partial class ChatsDBModelSnapshot : Microsoft.EntityFrameworkCore.Infrastructure.ModelSnapshot
```

## Scope

- SQL Server: not supported in this fork
- PostgreSQL: not enabled yet (future: separate migration set)
