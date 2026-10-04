using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Chats.BE.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Chats.BE.Controllers.Chats.ClientDiagnostics;

[ApiController, Authorize, Route("api/client-diagnostics/chat")]
public sealed class ClientDiagnosticsController(
    CurrentUser currentUser,
    ILogger<ClientDiagnosticsController> logger) : ControllerBase
{
    [HttpPost, RequestSizeLimit(16 * 1024)]
    public IActionResult Report(ChatDiagnosticRequest request)
    {
        string userAgent = Request.Headers.UserAgent.ToString();
        logger.LogWarning("Client chat diagnostic: {Diagnostic}", JsonSerializer.Serialize(new
        {
            UserId = currentUser.Id,
            Request = request,
            UserAgent = userAgent[..Math.Min(userAgent.Length, 500)],
        }));
        return NoContent();
    }
}

public sealed class ChatDiagnosticRequest
{
    [Required, RegularExpression("^(render|stream-read|stream-parse|stream-incomplete)$")]
    public string Stage { get; set; } = "";

    [StringLength(100)] public string? ChatId { get; set; }
    [StringLength(128)] public string? RequestTraceId { get; set; }
    [StringLength(100)] public string? StopId { get; set; }
    [StringLength(100)] public string? Version { get; set; }
    [StringLength(100)] public string? ErrorName { get; set; }
    [StringLength(4000)] public string? StackFrames { get; set; }
    [StringLength(4000)] public string? ComponentStack { get; set; }
    [Range(0, int.MaxValue)] public int EventCount { get; set; }
    public int? LastEventKind { get; set; }
}
