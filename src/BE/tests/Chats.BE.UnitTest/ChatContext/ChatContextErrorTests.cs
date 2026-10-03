using Chats.BE.Controllers.Chats.Chats;
using Chats.BE.Services.ChatContext;

namespace Chats.BE.UnitTest.ChatContext;

public sealed class ChatContextErrorTests
{
    private const string Nginx504 = """
        <html> <head><title>504 Gateway Time-out</title></head> <body> <center><h1>504 Gateway Time-out</h1></center> <hr><center>nginx</center> </body> </html> <!-- a padding to disable MSIE and Chrome friendly error page -->
        """;

    [Fact]
    public void HtmlGatewayTimeout_IsReplacedWithActionableMessage()
    {
        Assert.Equal(ChatContextError.TimeoutMessage, ChatContextError.Sanitize(Nginx504));
        Assert.Equal(ChatContextError.TimeoutMessage, ChatContextError.ToUserMessage(new RawChatServiceException(504, Nginx504)));
    }

    [Fact]
    public void JsonWrappedHtml_IsReplacedWithActionableMessage()
    {
        Assert.Equal(ChatContextError.TimeoutMessage, ChatContextError.Sanitize($$"""{"message":{{JsonQuote(Nginx504)}}}"""));
        Assert.Equal(ChatContextError.TimeoutMessage, ChatContextError.Sanitize("""{"error":{"message":"504 Gateway Time-out"}}"""));
    }

    [Fact]
    public void OrdinaryMessages_AreKept()
    {
        Assert.Equal("Finish the pending tool calls before generating a handoff summary.",
            ChatContextError.Sanitize("Finish the pending tool calls before generating a handoff summary."));
        Assert.Equal("The request was cancelled.", ChatContextError.ToUserMessage(new OperationCanceledException()));
        Assert.Equal("Context operation failed", ChatContextError.Sanitize("  "));
    }

    [Fact]
    public void LooksLikeGatewayFailure_DetectsStatusPages()
    {
        Assert.True(ChatContextError.LooksLikeGatewayFailure(Nginx504));
        Assert.True(ChatContextError.LooksLikeGatewayFailure("502 Bad Gateway"));
        Assert.False(ChatContextError.LooksLikeGatewayFailure("The model returned an empty handoff summary."));
    }

    private static string JsonQuote(string value) => System.Text.Json.JsonSerializer.Serialize(value);
}
