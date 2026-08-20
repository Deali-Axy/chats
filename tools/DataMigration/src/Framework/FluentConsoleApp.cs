using System.Reflection;
using dotenv.net;
using DataMigration.Framework.Extensions;
using DataMigration.Services;
using DataMigration.Utilities;
using FluentResults;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DataMigration.Framework;

public sealed class FluentConsoleApp
{
    public static FluentConsoleBuilder CreateBuilder(string[] args)
    {
        DotEnv.Load(options: new DotEnvOptions(
            envFilePaths: [Path.Combine(AppContext.BaseDirectory, ".env")]));

        var version = Assembly.GetExecutingAssembly().GetName().Version;

        ConsoleTool.PrintLogo();
        ConsoleTool.PrintTitle($"DataMigration - {version}");

        var builder = new FluentConsoleBuilder
        {
            Services = new ServiceCollection()
        };

        builder.InitializeConfiguration()
            .InitializeLogging()
            .RegisterServices();

        return builder;
    }

    public IConfiguration Configuration { get; set; } = null!;
    public IServiceCollection Services { get; set; } = null!;

    internal FluentConsoleApp()
    {
    }

    /// <summary>
    /// 运行指定任务
    /// </summary>
    public async Task<Result> Run<T>() where T : IService
    {
        await using var sp = Services.BuildServiceProvider();
        await using var scope = sp.CreateAsyncScope();
        var service = scope.ServiceProvider.GetRequiredService<T>();
        return await service.Run();
    }
}