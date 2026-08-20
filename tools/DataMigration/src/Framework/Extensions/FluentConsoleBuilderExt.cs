using System.Reflection;
using DataMigration.Entities;
using DataMigration.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog;

namespace DataMigration.Framework.Extensions;

public static class FluentConsoleBuilderExt
{
    public static FluentConsoleBuilder InitializeConfiguration(this FluentConsoleBuilder builder)
    {
        IConfigurationRoot config;
        var configBuilder = new ConfigurationBuilder();
        configBuilder.AddEnvironmentVariables();
        configBuilder.SetBasePath(AppContext.BaseDirectory);
        configBuilder.AddYamlFile("appsettings.yaml", optional: false, reloadOnChange: false);
        try
        {
            config = configBuilder.Build();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"配置文件加载失败！请检查配置文件是不是哪里写错了？\n错误信息：{ex.Message}");
            throw;
        }

        builder.Configuration = config;
        builder.Services.AddSingleton<IConfiguration>(config);
        builder.Services.AddOptions().Configure<AppSettings>(e => config.GetSection(nameof(AppSettings)).Bind(e));

        return builder;
    }

    public static FluentConsoleBuilder InitializeLogging(this FluentConsoleBuilder builder)
    {
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .WriteTo.File("logs/fluent-demo-logs.log")
            .CreateLogger();

        builder.Services.AddLogging(b =>
        {
            b.AddConfiguration(builder.Configuration.GetSection("Logging"));
            b.AddConsole();
            b.AddSerilog(dispose: true);
        });

        return builder;
    }

    public static FluentConsoleBuilder RegisterServices(this FluentConsoleBuilder builder)
    {
        var serviceTypes = Assembly.GetExecutingAssembly()
            .GetTypes()
            .Where(type => typeof(IService).IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract);

        foreach (var type in serviceTypes)
        {
            builder.Services.AddScoped(type);
        }

        return builder;
    }
}