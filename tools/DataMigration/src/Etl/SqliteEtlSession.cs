using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;

namespace DataMigration.Etl;

public sealed class SqliteEtlSession : IDisposable
{
    private readonly ILogger _logger;
    private bool _sourceAttached;

    public SqliteConnection Connection { get; }

    public SqliteEtlSession(string targetPath, ILogger logger)
    {
        _logger = logger;
        SqliteConnectionStringBuilder builder = new()
        {
            DataSource = targetPath,
            Mode = SqliteOpenMode.ReadWrite,
            Pooling = false,
            ForeignKeys = false,
        };
        Connection = new SqliteConnection(builder.ToString());
        Connection.Open();
        Execute("PRAGMA foreign_keys = OFF;");
        Execute("PRAGMA busy_timeout = 5000;");
    }

    public void AttachSource(string sourcePath)
    {
        if (!File.Exists(sourcePath))
        {
            throw new FileNotFoundException("Source database not found.", sourcePath);
        }

        string escaped = sourcePath.Replace('\\', '/').Replace("'", "''");
        Execute($"ATTACH DATABASE '{escaped}' AS src;");
        _sourceAttached = true;
        _logger.LogInformation("Attached source {Path} as src", sourcePath);
    }

    public IReadOnlyList<string> ListTables(string schema)
    {
        string master = schema == "main" ? "sqlite_master" : $"{schema}.sqlite_master";
        using SqliteCommand cmd = Connection.CreateCommand();
        cmd.CommandText = $"""
            SELECT name FROM {master}
            WHERE type = 'table'
              AND name NOT LIKE 'sqlite_%'
            ORDER BY name;
            """;
        List<string> names = [];
        using SqliteDataReader reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            names.Add(reader.GetString(0));
        }

        return names;
    }

    public IReadOnlyList<string> GetColumns(string? schema, string table)
        => GetColumnInfos(schema, table).Select(c => c.Name).ToList();

    public IReadOnlyList<ColumnInfo> GetColumnInfos(string? schema, string table)
    {
        using SqliteCommand cmd = Connection.CreateCommand();
        cmd.CommandText = schema is null
            ? $"PRAGMA table_info({Quote(table)});"
            : $"PRAGMA {schema}.table_info({Quote(table)});";
        List<ColumnInfo> columns = [];
        using SqliteDataReader reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            columns.Add(new ColumnInfo(
                reader.GetString(1),
                reader.GetString(2),
                reader.GetInt32(5)));
        }

        return columns;
    }

    public int CopyCommonColumns(string table)
    {
        List<string> destCols = [.. GetColumns(null, table)];
        List<string> srcCols = [.. GetColumns("src", table)];
        List<string> common = destCols.Intersect(srcCols, StringComparer.Ordinal).ToList();
        if (common.Count == 0)
        {
            throw new InvalidOperationException($"No common columns for table {table}.");
        }

        string list = string.Join(", ", common.Select(Quote));
        int rows = Execute($"INSERT INTO {Quote(table)} ({list}) SELECT {list} FROM src.{Quote(table)};");
        _logger.LogInformation("Copied {Table}: {Rows} rows ({Columns} columns)", table, rows, common.Count);
        return rows;
    }

    public Dictionary<string, int> CopyCommonTables(ISet<string> exclude)
    {
        HashSet<string> sourceTables = ListTables("src").ToHashSet(StringComparer.Ordinal);
        Dictionary<string, int> copied = [];
        foreach (string table in ListTables("main"))
        {
            if (table.StartsWith("__EF", StringComparison.Ordinal))
            {
                continue;
            }

            if (exclude.Contains(table) || !sourceTables.Contains(table))
            {
                continue;
            }

            copied[table] = CopyCommonColumns(table);
        }

        return copied;
    }

    public long Count(string qualifiedTable)
    {
        using SqliteCommand cmd = Connection.CreateCommand();
        cmd.CommandText = $"SELECT COUNT(*) FROM {qualifiedTable};";
        return (long)(cmd.ExecuteScalar() ?? 0L);
    }

    public int Execute(string sql)
    {
        using SqliteCommand cmd = Connection.CreateCommand();
        cmd.CommandText = sql;
        cmd.CommandTimeout = 0;
        return cmd.ExecuteNonQuery();
    }

    public void BeginTransaction() => Execute("BEGIN IMMEDIATE;");

    public void Commit() => Execute("COMMIT;");

    public void RollbackQuietly()
    {
        try
        {
            Execute("ROLLBACK;");
        }
        catch (SqliteException)
        {
            // no active transaction
        }
    }

    public IReadOnlyList<string> ForeignKeyCheck()
    {
        Execute("PRAGMA foreign_keys = ON;");
        using SqliteCommand cmd = Connection.CreateCommand();
        cmd.CommandText = "PRAGMA foreign_key_check;";
        List<string> violations = [];
        using SqliteDataReader reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            // table, rowid, parent, fkid
            violations.Add($"{reader.GetValue(0)} rowid={reader.GetValue(1)} parent={reader.GetValue(2)} fkid={reader.GetValue(3)}");
        }

        return violations;
    }

    public void SyncSequences()
    {
        Execute("""
            DELETE FROM sqlite_sequence;
            INSERT INTO sqlite_sequence(name, seq)
            SELECT s.name, s.seq
            FROM src.sqlite_sequence s
            INNER JOIN sqlite_master m ON m.type = 'table' AND m.name = s.name;
            """);

        foreach (string table in IntegerIdTables())
        {
            EnsureSequence(table, "Id");
        }
    }

    public IEnumerable<string> IntegerIdTables()
    {
        foreach (string table in ListTables("main"))
        {
            if (table.StartsWith("__EF", StringComparison.Ordinal))
            {
                continue;
            }

            List<ColumnInfo> pk = GetColumnInfos(null, table).Where(c => c.Pk > 0).ToList();
            if (pk.Count == 1
                && pk[0].Name == "Id"
                && pk[0].Type.Equals("INTEGER", StringComparison.OrdinalIgnoreCase))
            {
                yield return table;
            }
        }
    }

    public void Checkpoint()
    {
        Execute("PRAGMA wal_checkpoint(TRUNCATE);");
    }

    public void Dispose()
    {
        if (_sourceAttached)
        {
            try
            {
                Execute("DETACH DATABASE src;");
            }
            catch (SqliteException)
            {
                // ignore
            }
        }

        Connection.Dispose();
    }

    public static string Quote(string identifier) => "\"" + identifier.Replace("\"", "\"\"") + "\"";

    private void EnsureSequence(string table, string pk)
    {
        using SqliteCommand maxCmd = Connection.CreateCommand();
        maxCmd.CommandText = $"SELECT MAX({Quote(pk)}) FROM {Quote(table)};";
        object? maxObj = maxCmd.ExecuteScalar();
        if (maxObj is null or DBNull)
        {
            return;
        }

        long max = Convert.ToInt64(maxObj);
        using SqliteCommand update = Connection.CreateCommand();
        update.CommandText = "UPDATE sqlite_sequence SET seq = MAX(seq, @seq) WHERE name = @name;";
        update.Parameters.AddWithValue("@name", table);
        update.Parameters.AddWithValue("@seq", max);
        int updated = update.ExecuteNonQuery();
        if (updated == 0)
        {
            using SqliteCommand insert = Connection.CreateCommand();
            insert.CommandText = "INSERT INTO sqlite_sequence(name, seq) VALUES (@name, @seq);";
            insert.Parameters.AddWithValue("@name", table);
            insert.Parameters.AddWithValue("@seq", max);
            insert.ExecuteNonQuery();
        }
    }

    public readonly record struct ColumnInfo(string Name, string Type, int Pk);
}
