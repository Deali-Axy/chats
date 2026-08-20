using DataMigration.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DataMigration.Framework.Extensions;

public static class EFCoreIntegration
{
    public static void AddDefaultEFCoreIntegration(this FluentConsoleApp app)
    {
        app.Services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlite(app.Configuration.GetConnectionString("SQLite"));
        });
    }

    [Obsolete("Use AddDefaultEFCoreIntegration instead.")]
    public static void AddDefaultEFCoreItegration(this FluentConsoleApp app)
    {
        app.AddDefaultEFCoreIntegration();
    }
}