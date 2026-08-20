namespace DataMigration.Entities;

public class OutputResult
{
    public string Result { get; set; } = string.Empty;
    public IEnumerable<string> Messages { get; set; } = [];
}