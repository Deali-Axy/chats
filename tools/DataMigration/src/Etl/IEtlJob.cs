using DataMigration.Entities;

namespace DataMigration.Etl;

public interface IEtlJob
{
    string Name { get; }

    Task RunAsync(SqliteEtlSession session, EtlOptions options, EtlReport report, CancellationToken cancellationToken);
}
