using System.Text.Json.Serialization;
using DataMigration.Entities;

namespace DataMigration.Utilities;

[JsonSourceGenerationOptions(WriteIndented = true)]
[JsonSerializable(typeof(OutputResult))]
internal partial class SourceGenerationContext : JsonSerializerContext
{
}