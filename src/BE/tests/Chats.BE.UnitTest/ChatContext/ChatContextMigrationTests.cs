using Chats.DB;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Chats.BE.UnitTest.ChatContext;

public sealed class ChatContextMigrationTests
{
    [Fact]
    public async Task ExistingSqliteDatabase_UpgradesWithDefaultPolicyAndPreservesData()
    {
        string path = Path.Combine(Path.GetTempPath(), $"chats-context-migration-{Guid.NewGuid():N}.db");
        try
        {
            var options = new DbContextOptionsBuilder<ChatsDB>().UseSqlite($"Data Source={path};Foreign Keys=False;Pooling=False",
                sqlite => sqlite.MigrationsAssembly("Chats.BE")).Options;
            await using var db = new ChatsDB(options);
            var migrator = db.GetService<IMigrator>();
            await migrator.MigrateAsync("20260912163253_MakeModelMaxResponseTokensOptional");
            await db.Database.ExecuteSqlRawAsync("INSERT INTO ChatSpan (ChatId, SpanId, ChatConfigId, Enabled) VALUES (1, 0, 1, 1)");
            await db.Database.MigrateAsync();
            var span = await db.ChatSpans.AsNoTracking().SingleAsync();
            Assert.True(span.AutoCompactEnabled);
            Assert.Equal(6, span.ContextKeepRecentTurns);
            Assert.Null(span.ContextSummary);
            Assert.Equal(0, span.ContextRevision);
            Assert.Contains("20261003060413_AddChatContextManagement", await db.Database.GetAppliedMigrationsAsync());
            Assert.False(db.Database.HasPendingModelChanges());
        }
        finally { System.IO.File.Delete(path); }
    }
}
