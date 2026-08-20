using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DataMigration.Framework;

public class FluentConsoleBuilder
{
    public IConfiguration Configuration { get; set; } = null!;
    public IServiceCollection Services { get; set; } = null!;

    internal FluentConsoleBuilder()
    {
    }

    public FluentConsoleApp Build()
    {
        var app = new FluentConsoleApp
        {
            Configuration = Configuration,
            Services = Services
        };

        return app;
    }
}