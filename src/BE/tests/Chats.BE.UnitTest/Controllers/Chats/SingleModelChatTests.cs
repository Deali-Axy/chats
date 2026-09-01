using Chats.DB;
using Microsoft.EntityFrameworkCore;

namespace Chats.BE.UnitTest.Controllers.Chats;

public sealed class SingleModelChatTests
{
    [Fact]
    public void ChatSpan_ModelHasUniqueChatIdIndex()
    {
        DbContextOptions<ChatsDB> options = new DbContextOptionsBuilder<ChatsDB>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        using ChatsDB db = new(options);

        Microsoft.EntityFrameworkCore.Metadata.IIndex index = db.Model
            .FindEntityType(typeof(ChatSpan))!
            .GetIndexes()
            .Single(x => x.Name == "IX_ChatSpan_ChatId");

        Assert.True(index.IsUnique);
        Assert.Equal([nameof(ChatSpan.ChatId)], index.Properties.Select(x => x.Name));
    }
}
