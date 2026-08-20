namespace DataMigration.Etl;

/// <summary>
/// Upstream 1.12 value conversions: tinyint reasoning effort → string tokens.
/// </summary>
public static class LegacyValueMaps
{
    public static string? EffortFromId(long id) => id switch
    {
        0 => null,
        1 => "minimal",
        2 => "low",
        3 => "medium",
        4 => "high",
        _ => null,
    };

    public static string? MapSupportedEfforts(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        List<string> mapped = [];
        foreach (string token in raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            string value = token.ToLowerInvariant() switch
            {
                "1" or "minimal" => "minimal",
                "2" or "low" => "low",
                "3" or "medium" => "medium",
                "4" or "high" => "high",
                "xhigh" => "xhigh",
                "max" => "max",
                _ => token.ToLowerInvariant(),
            };

            if (value is "minimal" or "low" or "medium" or "high" or "xhigh" or "max"
                && !mapped.Contains(value, StringComparer.Ordinal))
            {
                mapped.Add(value);
            }
        }

        return mapped.Count == 0 ? null : string.Join(',', mapped);
    }
}
