using System.Text.Json;
using Dumpify;
using DataMigration.Entities;
using DataMigration.Etl;
using DataMigration.Jobs;
using DataMigration.Utilities;
using FluentResults;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DataMigration.Services;

public sealed class EtlService : IService
{
    private readonly ILogger<EtlService> _logger;
    private readonly ILoggerFactory _loggerFactory;
    private readonly IConfiguration _conf;

    public EtlService(ILogger<EtlService> logger, ILoggerFactory loggerFactory, IConfiguration conf)
    {
        _logger = logger;
        _loggerFactory = loggerFactory;
        _conf = conf;
    }

    public async Task<Result> Run()
    {
        EtlOptions options = new();
        _conf.GetSection("Etl").Bind(options);

        string source = RepoPaths.Resolve(options.SourceDb);
        string target = RepoPaths.Resolve(options.TargetDb);
        string? final = string.IsNullOrWhiteSpace(options.FinalDb) ? null : RepoPaths.Resolve(options.FinalDb);

        EtlReport report = new()
        {
            Job = options.Job,
            SourceDb = source,
            TargetDb = target,
            FinalDb = options.SwapToFinal ? final : null,
        };

        if (!File.Exists(source))
        {
            return Result.Fail($"Source database not found: {source}");
        }

        if (string.Equals(Path.GetFullPath(source), Path.GetFullPath(target), StringComparison.OrdinalIgnoreCase))
        {
            return Result.Fail("SourceDb and TargetDb must be different files.");
        }

        if (final is not null
            && string.Equals(Path.GetFullPath(target), Path.GetFullPath(final), StringComparison.OrdinalIgnoreCase))
        {
            return Result.Fail("TargetDb must not be the live FinalDb. Write to chats.migrated.db first.");
        }

        IEtlJob job = CreateJob(options.Job);
        _logger.LogInformation("Running job {Job}: {Source} -> {Target}", job.Name, source, target);

        await EfSqliteSchema.RecreateAsync(target, CancellationToken.None);

        try
        {
            using SqliteEtlSession session = new(target, _logger);
            session.AttachSource(source);
            await job.RunAsync(session, options, report, CancellationToken.None);
            session.Checkpoint();
        }
        catch (Exception ex)
        {
            report.Success = false;
            report.Errors.Add(ex.Message);
            _logger.LogError(ex, "ETL job {Job} failed", job.Name);
            return Result.Fail(ex.Message);
        }

        report.Success = report.Errors.Count == 0 && report.ForeignKeyViolations.Count == 0;

        if (report.Success && options.SwapToFinal && final is not null)
        {
            report.BackupDb = SwapToFinal(target, final);
            _logger.LogInformation("Replaced {Final} (backup {Backup})", final, report.BackupDb);
        }
        else if (!options.SwapToFinal)
        {
            report.Warnings.Add("SwapToFinal=false; live chats.db was not replaced.");
        }

        string reportPath = Path.Combine(Path.GetDirectoryName(target)!, "etl-report.json");
        await File.WriteAllTextAsync(reportPath, JsonSerializer.Serialize(report, SourceGenerationContext.Default.EtlReport));
        _logger.LogInformation("Wrote {Report}", reportPath);
        report.Dump();

        if (!report.Success)
        {
            return Result.Fail(string.Join("; ", report.Errors.Concat(report.ForeignKeyViolations.Take(5))));
        }

        return Result.Ok();
    }

    private IEtlJob CreateJob(string name) => name switch
    {
        ProdSqliteV111ToV115Job.JobName => new ProdSqliteV111ToV115Job(
            _loggerFactory.CreateLogger<ProdSqliteV111ToV115Job>()),
        _ => throw new InvalidOperationException($"Unknown Etl.Job '{name}'."),
    };

    private static string? SwapToFinal(string target, string final)
    {
        string dir = Path.GetDirectoryName(final) ?? ".";
        string? backup = null;
        if (File.Exists(final))
        {
            backup = Path.Combine(dir, $"chats.db.bak-pre-etl-{DateTime.Now:yyyyMMdd-HHmmss}");
            File.Copy(final, backup, overwrite: false);
        }

        foreach (string side in new[] { final + "-wal", final + "-shm" })
        {
            if (File.Exists(side))
            {
                File.Delete(side);
            }
        }

        File.Copy(target, final, overwrite: true);
        return backup;
    }
}
