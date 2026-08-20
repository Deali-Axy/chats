namespace DataMigration.Entities;

public class AppSettings
{
    public string Name { get; set; } = string.Empty;
    public bool Boolean { get; set; }
    public List<string> DemoList { get; set; } = [];
}