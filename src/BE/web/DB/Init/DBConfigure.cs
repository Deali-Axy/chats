using Microsoft.EntityFrameworkCore;

namespace Chats.BE.DB.Init;

public static class DBConfigure
{
    /// <summary>
    /// Ayaka Chats fork: SQLite is the only supported database for EF Core migrations and production.
    /// SQL Server support is removed. PostgreSQL may be reintroduced later with a separate migration set.
    /// </summary>
    public static void Configure(this DbContextOptionsBuilder dbContextOptionsBuilder, IConfiguration configuration, IHostEnvironment environment)
    {
        string? dbType = configuration["DBType"];
        string? connectionString = configuration.GetConnectionString("ChatsDB")
            ?? throw new Exception("ConnectionStrings:ChatsDB not found");

        if (string.IsNullOrWhiteSpace(dbType) || dbType.Equals("sqlite", StringComparison.OrdinalIgnoreCase))
        {
            // help client create the AppData folder for better startup experience
            if (connectionString == "Data Source=./AppData/chats.db" && !Directory.Exists("AppData"))
            {
                Console.WriteLine("Creating AppData folder...");
                Directory.CreateDirectory("AppData");
            }

            dbContextOptionsBuilder.UseSqlite(connectionString, sqlite =>
            {
                sqlite.MigrationsAssembly(typeof(DBConfigure).Assembly.FullName);
            });
        }
        else if (dbType.Equals("sqlserver", StringComparison.OrdinalIgnoreCase)
                 || dbType.Equals("mssql", StringComparison.OrdinalIgnoreCase))
        {
            throw new NotSupportedException(
                "SQL Server is not supported in Ayaka Chats. " +
                "This fork uses SQLite only (EF Core migrations). Set DBType=sqlite.");
        }
        else if (dbType.Equals("postgresql", StringComparison.OrdinalIgnoreCase)
                 || dbType.Equals("pgsql", StringComparison.OrdinalIgnoreCase))
        {
            throw new NotSupportedException(
                "PostgreSQL is not enabled yet in Ayaka Chats. " +
                "SQLite is the only supported database for now. " +
                "A separate EF Core migration set may be added later for PostgreSQL.");
        }
        else
        {
            throw new Exception(
                $"Unknown DBType: {dbType}. Ayaka Chats currently supports only: sqlite");
        }

        if (environment.IsDevelopment())
        {
            dbContextOptionsBuilder.EnableSensitiveDataLogging();
        }
    }
}
