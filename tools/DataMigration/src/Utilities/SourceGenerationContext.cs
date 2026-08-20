using System.Text.Json.Serialization;
using DataMigration.Entities;

namespace DataMigration.Utilities;

[JsonSourceGenerationOptions(WriteIndented = true)]
[JsonSerializable(typeof(OutputResult))]
[JsonSerializable(typeof(EtlReport))]
internal partial class SourceGenerationContext : JsonSerializerContext
{
}