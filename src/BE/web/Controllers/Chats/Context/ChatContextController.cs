using Chats.BE.Infrastructure;
using Chats.BE.Controllers.Chats.Chats;
using Chats.BE.Controllers.Chats.UserChats.Dtos;
using Chats.BE.Services;
using Chats.BE.Services.ChatContext;
using Chats.BE.Services.CodeInterpreter;
using Chats.BE.Services.Models;
using Chats.BE.Services.UrlEncryption;
using Chats.DB;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Chats.BE.Controllers.Chats.Context;

[ApiController, Authorize, Route("api/chat/{encryptedChatId}/context")]
public sealed class ChatContextController(ChatsDB db, CurrentUser currentUser, IUrlEncryptionService encryption,
    UserModelManager userModelManager, ChatContextService contextService, CodeInterpreterExecutor codeInterpreter,
    ChatContextHandoffService handoffService) : ControllerBase
{
    public sealed record ContextSettingsRequest(bool AutoCompactEnabled, [Range(2, 20)] int KeepRecentTurns);
    public sealed record ContextRequest(byte SpanId, string? LeafMessageId);
    public sealed record ContextPreviewRequest(byte SpanId, string? LeafMessageId,
        [StringLength(2000000)] string? DraftText, [Range(0, 100)] int DraftFileCount = 0);
    public sealed record HandoffPreviewRequest(byte SpanId, string? LeafMessageId, bool GenerateSummary = false);
    public sealed record HandoffCreateRequest(byte SpanId, string? LeafMessageId,
        [Required, StringLength(64, MinimumLength = 64)] string SourceHash,
        [Required, StringLength(100000)] string Summary, [Required, StringLength(50)] string Title,
        [RegularExpression("^(zh-CN|en)$")] string Language = "zh-CN");

    [HttpPost("handoff/preview")]
    public async Task<IActionResult> HandoffPreview(string encryptedChatId, HandoffPreviewRequest request, CancellationToken cancellationToken)
    {
        if (!request.GenerateSummary)
        {
            var loaded = await LoadAsync(encryptedChatId, request.SpanId, request.LeafMessageId, cancellationToken);
            if (loaded.Error != null) return loaded.Error;
            try
            {
                return Ok(await handoffService.PreviewAsync(loaded.Session!, loaded.UserModel!, false, cancellationToken));
            }
            catch (Exception ex) when (ex is InvalidOperationException or ChatServiceException)
            {
                return BadRequest(new { message = ChatContextError.ToUserMessage(ex) });
            }
        }

        await StreamHandoffPreview(encryptedChatId, request, cancellationToken);
        return new EmptyResult();
    }

    [HttpPost("handoff")]
    public async Task<ActionResult<ChatsResponse>> Handoff(string encryptedChatId, HandoffCreateRequest request, CancellationToken cancellationToken)
    {
        var loaded = await LoadAsync(encryptedChatId, request.SpanId, request.LeafMessageId, cancellationToken);
        if (loaded.Error != null) return loaded.Error;
        try
        {
            Chat chat = await handoffService.CreateAsync(loaded.Session!, loaded.UserModel!, request.SourceHash,
                request.Summary, request.Title, "/home#/" + encryptedChatId, request.Language, cancellationToken);
            return Created(default(string), new ChatsResponse
            {
                Id = encryption.EncryptChatId(chat.Id), Title = chat.Title,
                IsTopMost = false, IsShared = false, IsTemp = false,
                GroupId = encryption.EncryptChatGroupId(chat.ChatGroupId), Tags = [],
                Spans = [.. chat.ChatSpans.Select(ChatSpanDto.FromDB)],
                LeafTurnId = encryption.EncryptTurnId(chat.LeafTurnId), UpdatedAt = chat.UpdatedAt,
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ChatContextError.ToUserMessage(ex) });
        }
    }

    [HttpPost("preview")]
    public async Task<ActionResult<ChatContextStatus>> Preview(string encryptedChatId, ContextPreviewRequest request, CancellationToken cancellationToken)
    {
        var loaded = await LoadAsync(encryptedChatId, request.SpanId, request.LeafMessageId, cancellationToken);
        if (loaded.Error != null) return loaded.Error;
        ChatContextStatus status = ChatContextService.GetStatus(loaded.Session!);
        int draft = string.IsNullOrEmpty(request.DraftText) && request.DraftFileCount == 0 ? 0
            : 4 + ChatService.Tokenizer.CountTokens(request.DraftText ?? "") + 1105 * request.DraftFileCount;
        return Ok(status with { EstimatedTokens = status.EstimatedTokens + draft, DraftTokens = draft });
    }

    [HttpGet]
    public async Task<ActionResult<ChatContextStatus>> Get(string encryptedChatId, byte spanId, string? leafMessageId, CancellationToken cancellationToken)
    {
        var loaded = await LoadAsync(encryptedChatId, spanId, leafMessageId, cancellationToken);
        return loaded.Error != null ? loaded.Error : Ok(ChatContextService.GetStatus(loaded.Session!));
    }

    [HttpPost("compact")]
    public async Task Compact(string encryptedChatId, ContextRequest request, CancellationToken cancellationToken)
    {
        await using ContextSseWriter sse = await ContextSseWriter.Start(Response, cancellationToken);
        try
        {
            var loaded = await LoadAsync(encryptedChatId, request.SpanId, request.LeafMessageId, cancellationToken);
            if (loaded.Error != null)
            {
                await sse.WriteError(LoadErrorMessage(loaded.Error), cancellationToken);
                return;
            }
            await contextService.PrepareAsync(loaded.Session!, loaded.UserModel!, true, null, cancellationToken);
            await sse.Write(new ContextStreamEvent { K = "done", Status = ChatContextService.GetStatus(loaded.Session!) }, cancellationToken);
        }
        catch (OperationCanceledException)
        {
        }
        catch (Exception ex)
        {
            await sse.WriteError(ChatContextError.ToUserMessage(ex), cancellationToken);
        }
    }

    [HttpPut("settings")]
    public async Task<ActionResult> Settings(string encryptedChatId, byte spanId, ContextSettingsRequest request, CancellationToken cancellationToken)
    {
        int chatId = encryption.DecryptChatId(encryptedChatId);
        // Increasing retention restores the full history before applying the new policy.
        int updated = await OwnedSpan(chatId, spanId).ExecuteUpdateAsync(setters => setters
            .SetProperty(x => x.AutoCompactEnabled, request.AutoCompactEnabled)
            .SetProperty(x => x.ContextSummary, x => request.KeepRecentTurns > x.ContextKeepRecentTurns ? null : x.ContextSummary)
            .SetProperty(x => x.ContextBoundaryTurnId, x => request.KeepRecentTurns > x.ContextKeepRecentTurns ? null : x.ContextBoundaryTurnId)
            .SetProperty(x => x.ContextKeepRecentTurns, request.KeepRecentTurns)
            .SetProperty(x => x.ContextRevision, x => x.ContextRevision + 1), cancellationToken);
        return updated == 1 ? NoContent() : NotFound();
    }

    [HttpPost("reset")]
    public async Task<ActionResult> Reset(string encryptedChatId, ContextRequest request, CancellationToken cancellationToken)
    {
        int chatId = encryption.DecryptChatId(encryptedChatId);
        int updated = await OwnedSpan(chatId, request.SpanId).ExecuteUpdateAsync(setters => setters
            .SetProperty(x => x.ContextSummary, (string?)null)
            .SetProperty(x => x.ContextBoundaryTurnId, (long?)null)
            .SetProperty(x => x.ContextSourceHash, (string?)null)
            .SetProperty(x => x.ContextCompactedTurns, 0)
            .SetProperty(x => x.ContextCompactedAt, (DateTime?)null)
            .SetProperty(x => x.ContextBeforeTokens, (int?)null)
            .SetProperty(x => x.ContextAfterTokens, (int?)null)
            .SetProperty(x => x.AutoCompactEnabled, false)
            .SetProperty(x => x.ContextRevision, x => x.ContextRevision + 1), cancellationToken);
        return updated == 1 ? NoContent() : NotFound();
    }

    private async Task StreamHandoffPreview(string encryptedChatId, HandoffPreviewRequest request, CancellationToken cancellationToken)
    {
        await using ContextSseWriter sse = await ContextSseWriter.Start(Response, cancellationToken);
        try
        {
            var loaded = await LoadAsync(encryptedChatId, request.SpanId, request.LeafMessageId, cancellationToken);
            if (loaded.Error != null)
            {
                await sse.WriteError(LoadErrorMessage(loaded.Error), cancellationToken);
                return;
            }
            ContextHandoffPreview preview = await handoffService.PreviewAsync(
                loaded.Session!, loaded.UserModel!, true, cancellationToken,
                async (text, replace, ct) => await sse.Write(new ContextStreamEvent { K = "delta", R = text, Replace = replace }, ct));
            await sse.Write(new ContextStreamEvent
            {
                K = "done",
                Summary = preview.Summary,
                SourceHash = preview.SourceHash,
                IncludesRecentMessages = preview.IncludesRecentMessages,
            }, cancellationToken);
        }
        catch (OperationCanceledException)
        {
        }
        catch (Exception ex)
        {
            await sse.WriteError(ChatContextError.ToUserMessage(ex), cancellationToken);
        }
    }

    private static string LoadErrorMessage(ActionResult error) => error switch
    {
        NotFoundResult or NotFoundObjectResult => "Chat not found",
        ForbidResult => "Access denied",
        BadRequestObjectResult { Value: string text } => ChatContextError.Sanitize(text),
        BadRequestObjectResult bad => ChatContextError.Sanitize(bad.Value?.ToString() ?? "Invalid request"),
        _ => "Unable to load context usage",
    };

    private IQueryable<ChatSpan> OwnedSpan(int chatId, byte spanId) =>
        db.ChatSpans.Where(x => x.ChatId == chatId && x.SpanId == spanId && x.Chat.UserId == currentUser.Id);

    private async Task<(ChatContextSession? Session, UserModel? UserModel, ActionResult? Error)> LoadAsync(
        string encryptedChatId, byte spanId, string? leafMessageId, CancellationToken cancellationToken)
    {
        int chatId = encryption.DecryptChatId(encryptedChatId);
        ChatSpan? span = await OwnedSpan(chatId, spanId).AsNoTracking()
            .Include(x => x.Chat)
            .Include(x => x.ChatConfig).ThenInclude(x => x.ChatConfigMcps).ThenInclude(x => x.McpServer.McpTools)
            .FirstOrDefaultAsync(cancellationToken);
        if (span == null) return (null, null, NotFound());
        if (span.ChatConfig.ModelId is not short modelId) return (null, null, BadRequest("No chat model"));
        UserModel? userModel = await userModelManager.GetUserModel(currentUser.Id, modelId, cancellationToken);
        if (userModel == null) return (null, null, Forbid());
        span.ChatConfig.Model = userModel.Model;
        long? leaf = leafMessageId == null ? span.Chat.LeafTurnId : encryption.DecryptTurnId(leafMessageId);
        var turns = await db.ChatTurns.AsNoTracking().Where(t => t.ChatId == chatId)
            .Include(t => t.ChatConfigSnapshot).ThenInclude(c => c!.ModelSnapshot).ToDictionaryAsync(t => t.Id, cancellationToken);
        List<ChatTurn> branch = [];
        HashSet<long> visited = [];
        while (leaf != null)
        {
            if (!visited.Add(leaf.Value) || !turns.TryGetValue(leaf.Value, out ChatTurn? turn))
                return (null, null, BadRequest("Invalid conversation branch"));
            branch.Add(turn);
            leaf = turn.ParentId;
        }
        branch.Reverse();
        var turnIds = branch.Select(t => t.Id).ToArray();
        var steps = await db.Steps.AsNoTracking().Where(s => turnIds.Contains(s.TurnId))
            .Include(s => s.StepContents).ThenInclude(c => c.StepContentText)
            .Include(s => s.StepContents).ThenInclude(c => c.StepContentThink)
            .Include(s => s.StepContents).ThenInclude(c => c.StepContentBlob)
            .Include(s => s.StepContents).ThenInclude(c => c.StepContentFile).ThenInclude(f => f!.File)
            .Include(s => s.StepContents).ThenInclude(c => c.StepContentToolCall)
            .Include(s => s.StepContents).ThenInclude(c => c.StepContentToolCallResponse)
            .OrderBy(s => s.Id).ToListAsync(cancellationToken);
        var byTurn = steps.ToLookup(s => s.TurnId);
        foreach (var turn in branch) turn.Steps = byTurn[turn.Id].ToList();
        var history = ChatContextRequestBuilder.BuildHistory(branch, modelId, spanId);
        ChatRequest chatRequest = ChatContextRequestBuilder.BuildRequest(span, history, codeInterpreter);
        return (await contextService.CreateSessionAsync(span, history, chatRequest, cancellationToken), userModel, null);
    }
}

internal sealed class ContextStreamEvent
{
    [JsonPropertyName("k")] public required string K { get; init; }
    [JsonPropertyName("r")] public string? R { get; init; }
    [JsonPropertyName("replace")] public bool? Replace { get; init; }
    [JsonPropertyName("message")] public string? Message { get; init; }
    [JsonPropertyName("summary")] public string? Summary { get; init; }
    [JsonPropertyName("sourceHash")] public string? SourceHash { get; init; }
    [JsonPropertyName("includesRecentMessages")] public bool? IncludesRecentMessages { get; init; }
    [JsonPropertyName("status")] public ChatContextStatus? Status { get; init; }
}

internal sealed class ContextSseWriter : IAsyncDisposable
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };
    private static readonly ReadOnlyMemory<byte> DataPrefix = "data: "u8.ToArray();
    private static readonly ReadOnlyMemory<byte> EventSuffix = "\n\n"u8.ToArray();
    private static readonly ReadOnlyMemory<byte> KeepAlive = ": keepalive\n\n"u8.ToArray();

    private readonly HttpResponse response;
    private readonly SemaphoreSlim gate = new(1, 1);
    private readonly CancellationTokenSource heartbeatCts = new();
    private readonly Task heartbeat;

    private ContextSseWriter(HttpResponse response)
    {
        this.response = response;
        heartbeat = RunHeartbeat();
    }

    public static async Task<ContextSseWriter> Start(HttpResponse response, CancellationToken cancellationToken)
    {
        response.Headers.ContentType = "text/event-stream; charset=utf-8";
        response.Headers.CacheControl = "no-store, no-cache, must-revalidate, max-age=0";
        response.Headers.Connection = "keep-alive";
        response.Headers["X-Accel-Buffering"] = "no";
        response.HttpContext.Features.Get<IHttpResponseBodyFeature>()?.DisableBuffering();
        ContextSseWriter writer = new(response);
        await writer.Write(new ContextStreamEvent { K = "started" }, cancellationToken);
        return writer;
    }

    public Task WriteError(string message, CancellationToken cancellationToken) =>
        Write(new ContextStreamEvent { K = "error", Message = message }, cancellationToken);

    public async Task Write(ContextStreamEvent payload, CancellationToken cancellationToken)
    {
        byte[] bytes = JsonSerializer.SerializeToUtf8Bytes(payload, Json);
        await gate.WaitAsync(cancellationToken);
        try
        {
            await response.Body.WriteAsync(DataPrefix, cancellationToken);
            await response.Body.WriteAsync(bytes, cancellationToken);
            await response.Body.WriteAsync(EventSuffix, cancellationToken);
            await response.Body.FlushAsync(cancellationToken);
        }
        finally
        {
            gate.Release();
        }
    }

    private async Task RunHeartbeat()
    {
        try
        {
            using PeriodicTimer timer = new(TimeSpan.FromSeconds(10));
            while (await timer.WaitForNextTickAsync(heartbeatCts.Token))
            {
                await gate.WaitAsync(heartbeatCts.Token);
                try
                {
                    await response.Body.WriteAsync(KeepAlive, heartbeatCts.Token);
                    await response.Body.FlushAsync(heartbeatCts.Token);
                }
                finally
                {
                    gate.Release();
                }
            }
        }
        catch (OperationCanceledException)
        {
        }
    }

    public async ValueTask DisposeAsync()
    {
        await heartbeatCts.CancelAsync();
        try { await heartbeat; }
        catch (OperationCanceledException) { }
        heartbeatCts.Dispose();
        gate.Dispose();
    }
}
