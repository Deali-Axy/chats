using Chats.BE.Controllers.Chats.Chats.Dtos;
using Chats.BE.Controllers.Chats.UserChats.Dtos;
using Chats.BE.Infrastructure;
using Chats.BE.Services;
using Chats.BE.Services.Mcp;
using Chats.BE.Services.UrlEncryption;
using Chats.DB;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Chats.BE.Controllers.Chats.Chats;

[Route("api/chat/{encryptedChatId}/config"), Authorize]
public class ChatConfigController(ChatsDB db, IUrlEncryptionService idEncryption, CurrentUser currentUser) : ControllerBase
{
    [HttpPut]
    public async Task<ActionResult<ChatSpanDto>> Update(
        string encryptedChatId,
        [FromBody] UpdateChatConfigRequest request,
        [FromServices] UserModelManager userModelManager,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (request.Mcps.Select(x => x.Id).Distinct().Count() != request.Mcps.Length)
            return BadRequest("Duplicate MCP servers are not allowed");

        string? mcpNameConflict = await McpServerNameConflictValidator.FindConflictAsync(db, request.Mcps.Select(x => x.Id), cancellationToken);
        if (mcpNameConflict is not null) return BadRequest(mcpNameConflict);

        ChatSpan? span = await LoadSpan(encryptedChatId, cancellationToken);
        if (span is null) return NotFound();
        UserModel? userModel = await userModelManager.GetUserModel(currentUser.Id, request.ModelId, cancellationToken);
        if (userModel is null) return BadRequest("Model not available");
        string? validationError = Validate(request, userModel.Model.CurrentSnapshot);
        if (validationError is not null) return BadRequest(validationError);

        if (request.Mcps.Length > 0)
        {
            int allowed = await db.UserMcps.Where(x => x.UserId == currentUser.Id && request.Mcps.Select(m => m.Id).Contains(x.McpServerId))
                .Select(x => x.McpServerId).Distinct().CountAsync(cancellationToken);
            if (allowed != request.Mcps.Length) return BadRequest("Invalid MCP server permission");
        }

        request.ApplyTo(span.ChatConfig);
        span.ChatConfig.Model = userModel.Model;
        span.Enabled = true;
        span.Chat.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(ChatSpanDto.FromDB(span));
    }

    [HttpPost("switch-model/{modelId:int}")]
    public async Task<ActionResult<ChatSpanDto>> SwitchModel(
        string encryptedChatId,
        short modelId,
        [FromServices] UserModelManager userModelManager,
        CancellationToken cancellationToken)
    {
        ChatSpan? span = await LoadSpan(encryptedChatId, cancellationToken);
        if (span is null) return NotFound();
        UserModel? userModel = await userModelManager.GetUserModel(currentUser.Id, modelId, cancellationToken);
        if (userModel is null) return BadRequest("Model not available");

        ChatConfig config = span.ChatConfig;
        ModelSnapshot snapshot = userModel.Model.CurrentSnapshot;
        config.ModelId = modelId;
        config.Model = userModel.Model;
        NormalizeUnsupportedSettings(config, snapshot);
        span.Enabled = true;
        span.Chat.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(ChatSpanDto.FromDB(span));
    }

    private async Task<ChatSpan?> LoadSpan(string encryptedChatId, CancellationToken cancellationToken) =>
        await db.ChatSpans
            .Include(x => x.Chat).Include(x => x.ChatConfig).ThenInclude(x => x.ChatConfigMcps)
            .Include(x => x.ChatConfig.Model!.CurrentSnapshot).ThenInclude(x => x.ModelKeySnapshot)
            .FirstOrDefaultAsync(x => x.ChatId == idEncryption.DecryptChatId(encryptedChatId) && x.Chat.UserId == currentUser.Id && !x.Chat.IsArchived, cancellationToken);

    private static string? Validate(UpdateChatConfigRequest request, ModelSnapshot model)
    {
        if (request.WebSearchEnabled && !model.AllowSearch) return "This model does not support web search";
        if (request.CodeExecutionEnabled && !model.AllowCodeExecution) return "This model does not support code execution";
        if (request.Mcps.Length > 0 && !model.AllowToolCall) return "This model does not support MCP tools";
        if (request.Temperature is float temperature && ((decimal)temperature < model.MinTemperature || (decimal)temperature > model.MaxTemperature)) return "Temperature is outside the model range";
        if (request.MaxOutputTokens is int maxTokens && maxTokens > model.MaxResponseTokens) return "Max output tokens exceeds the model limit";
        if (request.ThinkingBudget is int budget && (!model.MaxThinkingBudget.HasValue || budget > model.MaxThinkingBudget)) return "Thinking budget is not supported by this model";
        if (request.ReasoningEffort is not null && !Supports(model.SupportedEfforts, request.ReasoningEffort)) return "Reasoning effort is not supported by this model";
        if (request.ImageSize is not null && !Supports(model.SupportedImageSizes, request.ImageSize)) return "Image size is not supported by this model";
        if (request.Format is not null && !Supports(model.SupportedFormats, request.Format)) return "Image format is not supported by this model";
        if (request.Background == "transparent" && request.Format is not "png" and not "webp") return "Transparent background requires PNG or WebP";
        return null;
    }

    private static void NormalizeUnsupportedSettings(ChatConfig config, ModelSnapshot model)
    {
        config.WebSearchEnabled &= model.AllowSearch;
        config.CodeExecutionEnabled &= model.AllowCodeExecution;
        if (!model.AllowToolCall) config.ChatConfigMcps.Clear();
        if (config.Temperature is float temperature) config.Temperature = (float)Math.Clamp((decimal)temperature, model.MinTemperature, model.MaxTemperature);
        if (config.MaxOutputTokens is int maxTokens) config.MaxOutputTokens = Math.Min(maxTokens, model.MaxResponseTokens);
        if (!model.MaxThinkingBudget.HasValue) config.ThinkingBudget = null;
        else if (config.ThinkingBudget is int budget) config.ThinkingBudget = Math.Min(budget, model.MaxThinkingBudget.Value);
        if (config.Effort is not null && !Supports(model.SupportedEfforts, config.Effort)) config.Effort = null;
        if (config.ImageSize is not null && !Supports(model.SupportedImageSizes, config.ImageSize)) config.ImageSize = null;
        if (config.Format is not null && !Supports(model.SupportedFormats, config.Format))
        {
            config.Format = null;
            config.Compression = null;
            config.Background = null;
        }
        else if (config.Background == "transparent" && config.Format is not "png" and not "webp") config.Background = null;
    }

    private static bool Supports(string? supportedValues, string value) =>
        supportedValues?.Split([',', ';', '\n', '\r'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Contains(value, StringComparer.OrdinalIgnoreCase) == true;
}
