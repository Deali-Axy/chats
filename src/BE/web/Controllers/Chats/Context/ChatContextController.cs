using Chats.BE.Infrastructure;
using Chats.BE.Controllers.Chats.Chats;
using Chats.BE.Services;
using Chats.BE.Services.ChatContext;
using Chats.BE.Services.CodeInterpreter;
using Chats.BE.Services.Models;
using Chats.BE.Services.UrlEncryption;
using Chats.DB;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Chats.BE.Controllers.Chats.Context;

[ApiController, Authorize, Route("api/chat/{encryptedChatId}/context")]
public sealed class ChatContextController(ChatsDB db, CurrentUser currentUser, IUrlEncryptionService encryption,
    UserModelManager userModelManager, ChatContextService contextService, CodeInterpreterExecutor codeInterpreter) : ControllerBase
{
    public sealed record ContextSettingsRequest(bool AutoCompactEnabled, [Range(2, 20)] int KeepRecentTurns);
    public sealed record ContextRequest(byte SpanId, string? LeafMessageId);
    public sealed record ContextPreviewRequest(byte SpanId, string? LeafMessageId,
        [StringLength(2000000)] string? DraftText, [Range(0, 100)] int DraftFileCount = 0);

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
    public async Task<ActionResult<ChatContextStatus>> Compact(string encryptedChatId, ContextRequest request, CancellationToken cancellationToken)
    {
        var loaded = await LoadAsync(encryptedChatId, request.SpanId, request.LeafMessageId, cancellationToken);
        if (loaded.Error != null) return loaded.Error;
        try
        {
            await contextService.PrepareAsync(loaded.Session!, loaded.UserModel!, true, null, cancellationToken);
            return Ok(ChatContextService.GetStatus(loaded.Session!));
        }
        catch (Exception ex) when (ex is InvalidOperationException or CustomChatServiceException)
        {
            return BadRequest(new { message = ex.Message });
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
