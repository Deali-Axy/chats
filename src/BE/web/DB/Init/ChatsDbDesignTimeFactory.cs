using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Chats.DB;

namespace Chats.BE.DB.Init;

/// <summary>
/// Design-time factory for <c>dotnet ef</c> / Taskfile ef:* commands (SQLite only).
/// Uses the same AppData/chats.db path as runtime so tooling and the app stay in sync.
/// </summary>
public sealed class ChatsDbDesignTimeFactory : IDesignTimeDbContextFactory<ChatsDB>
{
    public ChatsDB CreateDbContext(string[] args)
    {
        string webRoot = ResolveWebRoot();
        string appData = Path.Combine(webRoot, "AppData");
        Directory.CreateDirectory(appData);
        string dbPath = Path.Combine(appData, "chats.db");

        DbContextOptionsBuilder<ChatsDB> optionsBuilder = new();
        optionsBuilder.UseSqlite(
            $"Data Source={dbPath}",
            sqlite => sqlite.MigrationsAssembly(typeof(ChatsDbDesignTimeFactory).Assembly.FullName));

        return new ChatsDB(optionsBuilder.Options);
    }

    private static string ResolveWebRoot()
    {
        string cwd = Directory.GetCurrentDirectory();
        string[] candidates =
        [
            cwd,
            Path.Combine(cwd, "src", "BE", "web"),
            Path.GetFullPath(Path.Combine(cwd, "..")), // when cwd is AppData / bin
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..")),
        ];

        foreach (string candidate in candidates)
        {
            if (System.IO.File.Exists(Path.Combine(candidate, "Chats.BE.csproj")))
            {
                return candidate;
            }
        }

        // Fallback: assume repo-root invocation
        return Path.Combine(cwd, "src", "BE", "web");
    }
}
