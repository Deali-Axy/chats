using System.Text.Json;
using Chats.BE.Services.Models;

namespace Chats.BE.UnitTest.Services.Models;

public sealed class ChatErrorEnvelopeTests
{
    [Fact]
    public void JsonBody_MergesHttpStatus()
    {
        string result = ChatErrorEnvelope.FromRaw(503, """{"code":"upstream_error","message":"The service is temporarily unavailable. Please retry later.","request_id":"abc","type":"upstream_error"}""");
        using JsonDocument doc = JsonDocument.Parse(result);
        Assert.Equal(503, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("upstream_error", doc.RootElement.GetProperty("code").GetString());
        Assert.Equal("abc", doc.RootElement.GetProperty("request_id").GetString());
    }

    [Fact]
    public void HtmlGateway_BecomesShortEnvelope()
    {
        string html = "<html><head><title>504 Gateway Time-out</title></head><body><center>nginx</center></body></html>";
        string result = ChatErrorEnvelope.FromRaw(504, html);
        using JsonDocument doc = JsonDocument.Parse(result);
        Assert.Equal(504, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(ChatErrorEnvelope.GatewayUnavailableMessage, doc.RootElement.GetProperty("message").GetString());
        Assert.DoesNotContain("<html", result, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void PlainText_IsUnchanged()
    {
        Assert.Equal("boom", ChatErrorEnvelope.FromRaw(500, "boom"));
    }
}
