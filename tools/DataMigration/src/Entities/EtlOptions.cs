namespace DataMigration.Entities;

public sealed class EtlOptions
{
    public string Job { get; set; } = "ProdSqliteV111ToV115";

    /// <summary>Production / source sqlite file. Relative paths are resolved from the repo root.</summary>
    public string SourceDb { get; set; } = "";

    /// <summary>Fresh 1.15 database written by this run. Do not point this at the live chats.db.</summary>
    public string TargetDb { get; set; } = "";

    /// <summary>Live app database replaced after a successful run when <see cref="SwapToFinal"/> is true.</summary>
    public string FinalDb { get; set; } = "";

    public bool SkipRequestTrace { get; set; }

    public bool SwapToFinal { get; set; } = true;
}
