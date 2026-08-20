using Chats.BE.DB.Init;
using Chats.DB;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace DataMigration.Etl;

public static class EfSqliteSchema
{
    public static async Task RecreateAsync(string dbPath, CancellationToken cancellationToken)
    {
        string fullPath = Path.GetFullPath(dbPath);
        string? dir = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrEmpty(dir))
        {
            Directory.CreateDirectory(dir);
        }

        DeleteSqliteFiles(fullPath);

        SqliteConnectionStringBuilder builder = new()
        {
            DataSource = fullPath,
            Pooling = false,
            ForeignKeys = false,
        };

        DbContextOptions<ChatsDB> options = new DbContextOptionsBuilder<ChatsDB>()
            .UseSqlite(builder.ToString(), sqlite =>
                sqlite.MigrationsAssembly(typeof(ChatsDbDesignTimeFactory).Assembly.FullName))
            .Options;

        await using ChatsDB db = new(options);
        await db.Database.MigrateAsync(cancellationToken);
        await db.Database.ExecuteSqlRawAsync("PRAGMA wal_checkpoint(TRUNCATE);", cancellationToken);
    }

    public static void DeleteSqliteFiles(string dbPath)
    {
        foreach (string path in new[] { dbPath, dbPath + "-wal", dbPath + "-shm" })
        {
            if (System.IO.File.Exists(path))
            {
                System.IO.File.Delete(path);
            }
        }
    }
}
