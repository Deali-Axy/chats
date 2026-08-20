using DataMigration.Entities;
using DataMigration.Etl;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;

namespace DataMigration.Jobs;

/// <summary>
/// One-shot upgrade of a pre-EF (≈1.11) Ayaka SQLite dump onto a fresh 1.15 schema.
/// </summary>
public sealed class ProdSqliteV111ToV115Job(ILogger<ProdSqliteV111ToV115Job> logger) : IEtlJob
{
    public const string JobName = "ProdSqliteV111ToV115";

    public string Name => JobName;

    private static readonly HashSet<string> TransformTables = new(StringComparer.Ordinal)
    {
        "Model",
        "ModelKey",
        "ModelSnapshot",
        "ModelKeySnapshot",
        "ChatConfig",
        "ChatConfigSnapshot",
        "ChatTurn",
        "UsageTransaction",
        "UserModelUsage",
        "McpServer",
    };

    public Task RunAsync(SqliteEtlSession session, EtlOptions options, EtlReport report, CancellationToken cancellationToken)
    {
        HashSet<string> exclude = new(TransformTables, StringComparer.Ordinal);
        if (options.SkipRequestTrace)
        {
            exclude.Add("RequestTrace");
            exclude.Add("RequestTracePayload");
            report.Warnings.Add("SkipRequestTrace=true; RequestTrace / RequestTracePayload were not copied.");
        }

        session.BeginTransaction();
        try
        {
            session.CopyCommonTables(exclude);
            InsertModelKeySnapshots(session);
            InsertModelSnapshots(session);
            InsertChatConfigs(session);
            InsertMcpServers(session);
            InsertChatTurns(session);
            InsertUsage(session);
            session.SyncSequences();
            session.Commit();
        }
        catch
        {
            session.RollbackQuietly();
            throw;
        }

        IReadOnlyList<string> fk = session.ForeignKeyCheck();
        report.ForeignKeyViolations.AddRange(fk);

        Validate(session, report);
        AddFileWarning(session, options, report);
        report.Counts.AddRange(BuildCounts(session, options));

        if (fk.Count > 0)
        {
            report.Errors.Add($"PRAGMA foreign_key_check returned {fk.Count} violation(s).");
        }

        return Task.CompletedTask;
    }

    private static void InsertModelKeySnapshots(SqliteEtlSession session)
    {
        session.Execute("""
            INSERT INTO "ModelKeySnapshot" (
                "Id", "ModelKeyId", "ModelProviderId", "Name", "Host", "Secret", "CreatedAt"
            )
            SELECT
                "Id", "Id", "ModelProviderId", "Name", "Host", "Secret", "CreatedAt"
            FROM src."ModelKey";
            """);

        session.Execute("""
            INSERT INTO "ModelKey" (
                "Id", "CreatedAt", "UpdatedAt", "Order", "CurrentSnapshotId"
            )
            SELECT
                "Id", "CreatedAt", "UpdatedAt", "Order", "Id"
            FROM src."ModelKey";
            """);
    }

    private void InsertModelSnapshots(SqliteEtlSession session)
    {
        using SqliteCommand read = session.Connection.CreateCommand();
        read.CommandText = """
            SELECT
                "Id", "ModelKeyId", "Name", "DeploymentName",
                "InputFreshTokenPrice1M", "InputCachedTokenPrice1M", "OutputTokenPrice1M",
                "AllowSearch", "AllowVision", "AllowStreaming", "AllowToolCall", "AllowCodeExecution",
                "ThinkTagParserEnabled", "MinTemperature", "MaxTemperature",
                "ContextWindow", "MaxResponseTokens", "ReasoningEffortOptions", "SupportedImageSizes",
                "ApiTypeId", "UseAsyncApi", "UseMaxCompletionTokens", "IsLegacy",
                "MaxThinkingBudget", "SupportsVisionLink", "CreatedAt", "IsDeleted", "Order", "UpdatedAt"
            FROM src."Model";
            """;

        using SqliteDataReader reader = read.ExecuteReader();
        List<ModelRow> rows = [];
        while (reader.Read())
        {
            rows.Add(ModelRow.Read(reader));
        }

        using SqliteCommand insertSnapshot = session.Connection.CreateCommand();
        insertSnapshot.CommandText = """
            INSERT INTO "ModelSnapshot" (
                "Id", "ModelId", "Name", "DeploymentName", "ModelKeyId", "ModelKeySnapshotId",
                "ApiTypeId", "InputFreshTokenPrice1M", "InputCachedTokenPrice1M", "OutputTokenPrice1M",
                "AllowSearch", "AllowVision", "AllowStreaming", "AllowToolCall", "AllowCodeExecution",
                "ThinkTagParserEnabled", "MinTemperature", "MaxTemperature", "ContextWindow", "MaxResponseTokens",
                "SupportedEfforts", "SupportedImageSizes", "UseAsyncApi", "UseMaxCompletionTokens", "IsLegacy",
                "MaxThinkingBudget", "SupportsVisionLink", "CreatedAt"
            ) VALUES (
                @Id, @ModelId, @Name, @DeploymentName, @ModelKeyId, @ModelKeySnapshotId,
                @ApiTypeId, @InputFreshTokenPrice1M, @InputCachedTokenPrice1M, @OutputTokenPrice1M,
                @AllowSearch, @AllowVision, @AllowStreaming, @AllowToolCall, @AllowCodeExecution,
                @ThinkTagParserEnabled, @MinTemperature, @MaxTemperature, @ContextWindow, @MaxResponseTokens,
                @SupportedEfforts, @SupportedImageSizes, @UseAsyncApi, @UseMaxCompletionTokens, @IsLegacy,
                @MaxThinkingBudget, @SupportsVisionLink, @CreatedAt
            );
            """;
        AddParams(insertSnapshot,
            "@Id", "@ModelId", "@Name", "@DeploymentName", "@ModelKeyId", "@ModelKeySnapshotId",
            "@ApiTypeId", "@InputFreshTokenPrice1M", "@InputCachedTokenPrice1M", "@OutputTokenPrice1M",
            "@AllowSearch", "@AllowVision", "@AllowStreaming", "@AllowToolCall", "@AllowCodeExecution",
            "@ThinkTagParserEnabled", "@MinTemperature", "@MaxTemperature", "@ContextWindow", "@MaxResponseTokens",
            "@SupportedEfforts", "@SupportedImageSizes", "@UseAsyncApi", "@UseMaxCompletionTokens", "@IsLegacy",
            "@MaxThinkingBudget", "@SupportsVisionLink", "@CreatedAt");

        using SqliteCommand insertModel = session.Connection.CreateCommand();
        insertModel.CommandText = """
            INSERT INTO "Model" (
                "Id", "Order", "CreatedAt", "UpdatedAt", "CurrentSnapshotId", "Enabled"
            ) VALUES (
                @Id, @Order, @CreatedAt, @UpdatedAt, @CurrentSnapshotId, @Enabled
            );
            """;
        AddParams(insertModel, "@Id", "@Order", "@CreatedAt", "@UpdatedAt", "@CurrentSnapshotId", "@Enabled");

        int deleted = 0;
        foreach (ModelRow row in rows)
        {
            insertSnapshot.Parameters["@Id"].Value = row.Id;
            insertSnapshot.Parameters["@ModelId"].Value = row.Id;
            insertSnapshot.Parameters["@Name"].Value = row.Name;
            insertSnapshot.Parameters["@DeploymentName"].Value = row.DeploymentName;
            insertSnapshot.Parameters["@ModelKeyId"].Value = row.ModelKeyId;
            insertSnapshot.Parameters["@ModelKeySnapshotId"].Value = row.ModelKeyId;
            insertSnapshot.Parameters["@ApiTypeId"].Value = row.ApiTypeId;
            insertSnapshot.Parameters["@InputFreshTokenPrice1M"].Value = row.InputFreshTokenPrice1M;
            insertSnapshot.Parameters["@InputCachedTokenPrice1M"].Value = row.InputCachedTokenPrice1M;
            insertSnapshot.Parameters["@OutputTokenPrice1M"].Value = row.OutputTokenPrice1M;
            insertSnapshot.Parameters["@AllowSearch"].Value = row.AllowSearch;
            insertSnapshot.Parameters["@AllowVision"].Value = row.AllowVision;
            insertSnapshot.Parameters["@AllowStreaming"].Value = row.AllowStreaming;
            insertSnapshot.Parameters["@AllowToolCall"].Value = row.AllowToolCall;
            insertSnapshot.Parameters["@AllowCodeExecution"].Value = row.AllowCodeExecution;
            insertSnapshot.Parameters["@ThinkTagParserEnabled"].Value = row.ThinkTagParserEnabled;
            insertSnapshot.Parameters["@MinTemperature"].Value = row.MinTemperature;
            insertSnapshot.Parameters["@MaxTemperature"].Value = row.MaxTemperature;
            insertSnapshot.Parameters["@ContextWindow"].Value = row.ContextWindow;
            insertSnapshot.Parameters["@MaxResponseTokens"].Value = row.MaxResponseTokens;
            insertSnapshot.Parameters["@SupportedEfforts"].Value = (object?)LegacyValueMaps.MapSupportedEfforts(row.ReasoningEffortOptions) ?? DBNull.Value;
            insertSnapshot.Parameters["@SupportedImageSizes"].Value = (object?)row.SupportedImageSizes ?? DBNull.Value;
            insertSnapshot.Parameters["@UseAsyncApi"].Value = row.UseAsyncApi;
            insertSnapshot.Parameters["@UseMaxCompletionTokens"].Value = row.UseMaxCompletionTokens;
            insertSnapshot.Parameters["@IsLegacy"].Value = row.IsLegacy;
            insertSnapshot.Parameters["@MaxThinkingBudget"].Value = (object?)row.MaxThinkingBudget ?? DBNull.Value;
            insertSnapshot.Parameters["@SupportsVisionLink"].Value = row.SupportsVisionLink;
            insertSnapshot.Parameters["@CreatedAt"].Value = row.CreatedAt;
            insertSnapshot.ExecuteNonQuery();

            insertModel.Parameters["@Id"].Value = row.Id;
            insertModel.Parameters["@Order"].Value = row.Order;
            insertModel.Parameters["@CreatedAt"].Value = row.CreatedAt;
            insertModel.Parameters["@UpdatedAt"].Value = row.UpdatedAt;
            insertModel.Parameters["@CurrentSnapshotId"].Value = row.Id;
            insertModel.Parameters["@Enabled"].Value = row.IsDeleted ? 0 : 1;
            insertModel.ExecuteNonQuery();

            if (row.IsDeleted)
            {
                deleted++;
            }
        }

        logger.LogInformation("Copied Model/ModelSnapshot: {Count} rows ({Deleted} disabled from IsDeleted)", rows.Count, deleted);
    }

    private static void InsertChatConfigs(SqliteEtlSession session)
    {
        session.Execute("""
            INSERT INTO "ChatConfig" (
                "Id", "ModelId", "SystemPrompt", "Temperature", "WebSearchEnabled",
                "MaxOutputTokens", "Effort", "CodeExecutionEnabled", "ImageSize", "ThinkingBudget"
            )
            SELECT
                "Id", "ModelId", "SystemPrompt", "Temperature", "WebSearchEnabled",
                "MaxOutputTokens",
                CASE "ReasoningEffortId"
                    WHEN 0 THEN NULL
                    WHEN 1 THEN 'minimal'
                    WHEN 2 THEN 'low'
                    WHEN 3 THEN 'medium'
                    WHEN 4 THEN 'high'
                    ELSE NULL
                END,
                "CodeExecutionEnabled", "ImageSize", "ThinkingBudget"
            FROM src."ChatConfig";
            """);

        session.Execute("""
            INSERT INTO "ChatConfigSnapshot" (
                "Id", "ModelSnapshotId", "SystemPrompt", "Temperature", "WebSearchEnabled",
                "MaxOutputTokens", "Effort", "CodeExecutionEnabled", "ImageSize", "ThinkingBudget",
                "EnabledMcpNames", "HashCode", "CreatedAt"
            )
            SELECT
                cc."Id",
                cc."ModelId",
                cc."SystemPrompt",
                cc."Temperature",
                cc."WebSearchEnabled",
                cc."MaxOutputTokens",
                CASE cc."ReasoningEffortId"
                    WHEN 0 THEN NULL
                    WHEN 1 THEN 'minimal'
                    WHEN 2 THEN 'low'
                    WHEN 3 THEN 'medium'
                    WHEN 4 THEN 'high'
                    ELSE NULL
                END,
                cc."CodeExecutionEnabled",
                cc."ImageSize",
                cc."ThinkingBudget",
                (
                    SELECT GROUP_CONCAT(ms."Label", ',')
                    FROM src."ChatConfigMcp" ccm
                    INNER JOIN src."McpServer" ms ON ms."Id" = ccm."McpServerId"
                    WHERE ccm."ChatConfigId" = cc."Id"
                ),
                a."HashCode",
                strftime('%Y-%m-%d %H:%M:%f', 'now')
            FROM src."ChatConfig" cc
            LEFT JOIN src."ChatConfigArchived" a ON a."ChatConfigId" = cc."Id";
            """);
    }

    private static void InsertMcpServers(SqliteEtlSession session)
    {
        session.Execute("""
            INSERT INTO "McpServer" (
                "Id", "DisplayName", "Url", "Headers", "CreatedAt", "OwnerUserId", "UpdatedAt", "Name"
            )
            SELECT
                "Id", "Label", "Url", "Headers", "CreatedAt", "OwnerUserId", "UpdatedAt", CAST("Id" AS TEXT)
            FROM src."McpServer";
            """);
    }

    private static void InsertChatTurns(SqliteEtlSession session)
    {
        session.Execute("""
            INSERT INTO "ChatTurn" (
                "Id", "ChatId", "SpanId", "ParentId", "IsUser", "ReactionId", "ChatConfigSnapshotId"
            )
            SELECT
                "Id", "ChatId", "SpanId", "ParentId", "IsUser", "ReactionId", "ChatConfigId"
            FROM src."ChatTurn";
            """);
    }

    private static void InsertUsage(SqliteEtlSession session)
    {
        session.Execute("""
            INSERT INTO "UsageTransaction" (
                "Id", "TransactionTypeId", "TokenAmount", "CountAmount",
                "CreditUserId", "CreatedAt", "ModelSnapshotId"
            )
            SELECT
                "Id", "TransactionTypeId", "TokenAmount", "CountAmount",
                "CreditUserId", "CreatedAt", "ModelId"
            FROM src."UsageTransaction";
            """);

        session.Execute("""
            INSERT INTO "UserModelUsage" (
                "Id", "FinishReasonId", "SegmentCount", "InputFreshTokens", "OutputTokens", "ReasoningTokens",
                "IsUsageReliable", "PreprocessDurationMs", "ReasoningDurationMs", "FirstResponseDurationMs",
                "PostprocessDurationMs", "TotalDurationMs", "InputFreshCost", "OutputCost",
                "BalanceTransactionId", "UsageTransactionId", "ClientInfoId", "CreatedAt", "UserId",
                "InputCachedTokens", "InputCachedCost", "SourceId", "ModelSnapshotId"
            )
            SELECT
                "Id", "FinishReasonId", "SegmentCount", "InputFreshTokens", "OutputTokens", "ReasoningTokens",
                "IsUsageReliable", "PreprocessDurationMs", "ReasoningDurationMs", "FirstResponseDurationMs",
                "PostprocessDurationMs", "TotalDurationMs", "InputFreshCost", "OutputCost",
                "BalanceTransactionId", "UsageTransactionId", "ClientInfoId", "CreatedAt", "UserId",
                "InputCachedTokens", "InputCachedCost", "SourceId", "ModelId"
            FROM src."UserModelUsage";
            """);
    }

    private static void Validate(SqliteEtlSession session, EtlReport report)
    {
        ExpectEqual(session, report, "User", "src.\"User\"", "\"User\"");
        ExpectEqual(session, report, "Chat", "src.\"Chat\"", "\"Chat\"");
        ExpectEqual(session, report, "ChatTurn", "src.\"ChatTurn\"", "\"ChatTurn\"");
        ExpectEqual(session, report, "ChatConfig", "src.\"ChatConfig\"", "\"ChatConfig\"");
        ExpectEqual(session, report, "ChatConfigSnapshot vs ChatConfig", "src.\"ChatConfig\"", "\"ChatConfigSnapshot\"");
        ExpectEqual(session, report, "Model", "src.\"Model\"", "\"Model\"");
        ExpectEqual(session, report, "ModelSnapshot vs Model", "src.\"Model\"", "\"ModelSnapshot\"");
        ExpectEqual(session, report, "ModelKeySnapshot vs ModelKey", "src.\"ModelKey\"", "\"ModelKeySnapshot\"");
        ExpectEqual(session, report, "UserModelUsage", "src.\"UserModelUsage\"", "\"UserModelUsage\"");
        ExpectEqual(session, report, "Step", "src.\"Step\"", "\"Step\"");
        ExpectEqual(session, report, "File", "src.\"File\"", "\"File\"");

        long danglingTurns = Scalar(session, """
            SELECT COUNT(*) FROM "ChatTurn" t
            WHERE t."ChatConfigSnapshotId" IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM "ChatConfigSnapshot" s WHERE s."Id" = t."ChatConfigSnapshotId"
              );
            """);
        if (danglingTurns != 0)
        {
            report.Errors.Add($"ChatTurn has {danglingTurns} rows whose ChatConfigSnapshotId does not exist.");
        }

        long danglingUsage = Scalar(session, """
            SELECT COUNT(*) FROM "UserModelUsage" u
            WHERE NOT EXISTS (
                SELECT 1 FROM "ModelSnapshot" s WHERE s."Id" = u."ModelSnapshotId"
            );
            """);
        if (danglingUsage != 0)
        {
            report.Errors.Add($"UserModelUsage has {danglingUsage} rows whose ModelSnapshotId does not exist.");
        }

        long missingModelSnap = Scalar(session, """
            SELECT COUNT(*) FROM "Model" m
            WHERE NOT EXISTS (
                SELECT 1 FROM "ModelSnapshot" s WHERE s."Id" = m."CurrentSnapshotId"
            );
            """);
        if (missingModelSnap != 0)
        {
            report.Errors.Add($"Model has {missingModelSnap} rows whose CurrentSnapshotId does not exist.");
        }
    }

    private static void ExpectEqual(SqliteEtlSession session, EtlReport report, string label, string sourceSql, string destSql)
    {
        long src = Scalar(session, $"SELECT COUNT(*) FROM {sourceSql};");
        long dest = Scalar(session, $"SELECT COUNT(*) FROM {destSql};");
        if (src != dest)
        {
            report.Errors.Add($"{label} count mismatch: source={src} dest={dest}");
        }
    }

    private static long Scalar(SqliteEtlSession session, string sql)
    {
        using SqliteCommand cmd = session.Connection.CreateCommand();
        cmd.CommandText = sql;
        return Convert.ToInt64(cmd.ExecuteScalar() ?? 0L);
    }

    private static IEnumerable<TableCount> BuildCounts(SqliteEtlSession session, EtlOptions options)
    {
        HashSet<string> srcTables = session.ListTables("src").ToHashSet(StringComparer.Ordinal);
        foreach (string table in session.ListTables("main"))
        {
            if (table.StartsWith("__EF", StringComparison.Ordinal))
            {
                continue;
            }

            long dest = session.Count(SqliteEtlSession.Quote(table));
            long? src = srcTables.Contains(table)
                ? session.Count("src." + SqliteEtlSession.Quote(table))
                : table switch
                {
                    "ModelSnapshot" => session.Count("src.\"Model\""),
                    "ModelKeySnapshot" => session.Count("src.\"ModelKey\""),
                    "ChatConfigSnapshot" => session.Count("src.\"ChatConfig\""),
                    _ => null,
                };

            string? note = null;
            if (options.SkipRequestTrace && table is "RequestTrace" or "RequestTracePayload")
            {
                note = "skipped";
            }

            yield return new TableCount
            {
                Table = table,
                Destination = dest,
                Source = src,
                Note = note,
            };
        }
    }

    private static void AddFileWarning(SqliteEtlSession session, EtlOptions options, EtlReport report)
    {
        long files = Scalar(session, "SELECT COUNT(*) FROM \"File\";");
        if (files <= 0 || string.IsNullOrWhiteSpace(options.FinalDb))
        {
            return;
        }

        string filesDir = Path.Combine(Path.GetDirectoryName(RepoPaths.Resolve(options.FinalDb))!, "Files");
        if (!Directory.Exists(filesDir))
        {
            report.Warnings.Add($"File table has {files} rows but '{filesDir}' does not exist. Copy production AppData/Files next to chats.db.");
            return;
        }

        int onDisk = Directory.EnumerateFiles(filesDir, "*", SearchOption.AllDirectories).Count();
        if (onDisk == 0)
        {
            report.Warnings.Add($"File table has {files} rows but '{filesDir}' is empty. History attachments will 404 until files are copied.");
        }
        else if (onDisk < files)
        {
            report.Warnings.Add($"File table has {files} rows but only {onDisk} files under '{filesDir}'.");
        }
    }

    private static void AddParams(SqliteCommand cmd, params string[] names)
    {
        foreach (string name in names)
        {
            cmd.Parameters.Add(new SqliteParameter(name, DBNull.Value));
        }
    }

    private readonly record struct ModelRow(
        int Id,
        int ModelKeyId,
        string Name,
        string DeploymentName,
        decimal InputFreshTokenPrice1M,
        decimal InputCachedTokenPrice1M,
        decimal OutputTokenPrice1M,
        int AllowSearch,
        int AllowVision,
        int AllowStreaming,
        int AllowToolCall,
        int AllowCodeExecution,
        int ThinkTagParserEnabled,
        decimal MinTemperature,
        decimal MaxTemperature,
        int ContextWindow,
        int MaxResponseTokens,
        string? ReasoningEffortOptions,
        string? SupportedImageSizes,
        int ApiTypeId,
        int UseAsyncApi,
        int UseMaxCompletionTokens,
        int IsLegacy,
        int? MaxThinkingBudget,
        int SupportsVisionLink,
        string CreatedAt,
        bool IsDeleted,
        int Order,
        string UpdatedAt)
    {
        public static ModelRow Read(SqliteDataReader r)
        {
            int Ord(string name) => r.GetOrdinal(name);
            int? MaxThinkingBudget() => r.IsDBNull(Ord("MaxThinkingBudget")) ? null : r.GetInt32(Ord("MaxThinkingBudget"));
            string? Opt(string name) => r.IsDBNull(Ord(name)) ? null : r.GetString(Ord(name));

            return new ModelRow(
                r.GetInt32(Ord("Id")),
                r.GetInt32(Ord("ModelKeyId")),
                r.GetString(Ord("Name")),
                r.GetString(Ord("DeploymentName")),
                r.GetDecimal(Ord("InputFreshTokenPrice1M")),
                r.GetDecimal(Ord("InputCachedTokenPrice1M")),
                r.GetDecimal(Ord("OutputTokenPrice1M")),
                r.GetInt32(Ord("AllowSearch")),
                r.GetInt32(Ord("AllowVision")),
                r.GetInt32(Ord("AllowStreaming")),
                r.GetInt32(Ord("AllowToolCall")),
                r.GetInt32(Ord("AllowCodeExecution")),
                r.GetInt32(Ord("ThinkTagParserEnabled")),
                r.GetDecimal(Ord("MinTemperature")),
                r.GetDecimal(Ord("MaxTemperature")),
                r.GetInt32(Ord("ContextWindow")),
                r.GetInt32(Ord("MaxResponseTokens")),
                Opt("ReasoningEffortOptions"),
                Opt("SupportedImageSizes"),
                r.GetInt32(Ord("ApiTypeId")),
                r.GetInt32(Ord("UseAsyncApi")),
                r.GetInt32(Ord("UseMaxCompletionTokens")),
                r.GetInt32(Ord("IsLegacy")),
                MaxThinkingBudget(),
                r.GetInt32(Ord("SupportsVisionLink")),
                r.GetString(Ord("CreatedAt")),
                r.GetInt32(Ord("IsDeleted")) != 0,
                r.GetInt32(Ord("Order")),
                r.GetString(Ord("UpdatedAt")));
        }
    }
}
