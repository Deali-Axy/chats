namespace DataMigration.Entities;

public sealed class EtlReport
{
    public string Job { get; set; } = "";

    public bool Success { get; set; }

    public string SourceDb { get; set; } = "";

    public string TargetDb { get; set; } = "";

    public string? FinalDb { get; set; }

    public string? BackupDb { get; set; }

    public List<TableCount> Counts { get; set; } = [];

    public List<string> ForeignKeyViolations { get; set; } = [];

    public List<string> Warnings { get; set; } = [];

    public List<string> Errors { get; set; } = [];
}

public sealed class TableCount
{
    public string Table { get; set; } = "";

    public long Destination { get; set; }

    public long? Source { get; set; }

    public string? Note { get; set; }
}
