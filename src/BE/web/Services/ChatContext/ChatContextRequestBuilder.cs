using Chats.BE.Controllers.Chats.Chats;
using Chats.BE.Controllers.Users.Usages.Dtos;
using Chats.BE.Services.CodeInterpreter;
using Chats.BE.Services.Mcp;
using Chats.BE.Services.Models;
using Chats.BE.Services.Models.ChatServices.OpenAI;
using Chats.BE.Services.Models.Neutral;
using Chats.BE.Services.Models.Neutral.Conversions;
using Chats.DB;

namespace Chats.BE.Services.ChatContext;

public static class ChatContextRequestBuilder
{
    public static IReadOnlyList<ContextTurn> BuildHistory(IReadOnlyList<ChatTurn> turns, short modelId, byte spanId)
    {
        var steps = ChatController.RemoveNonMatchingHistoricalTurnThinkingBlocks(turns, modelId).ToLookup(s => s.TurnId);
        return turns.Select(turn => new ContextTurn(turn.Id, turn.IsUser, steps[turn.Id].ToNeutral(spanId))).ToArray();
    }

    public static ChatRequest BuildRequest(ChatSpan span, IReadOnlyList<ContextTurn> history, CodeInterpreterExecutor codeInterpreter)
    {
        ChatRequest request = new()
        {
            Messages = history.SelectMany(t => t.Messages).ToList(),
            ChatConfig = span.ChatConfig,
            Source = UsageSource.WebChat,
            System = span.ChatConfig.CodeExecutionEnabled
                ? codeInterpreter.BuildSystemMessage(span.ChatConfig.SystemPrompt)
                : string.IsNullOrWhiteSpace(span.ChatConfig.SystemPrompt) ? null : NeutralSystemMessage.FromText(span.ChatConfig.SystemPrompt),
        };
        McpServer[] servers = [.. span.ChatConfig.ChatConfigMcps.Select(x => x.McpServer).DistinctBy(x => x.Id)];
        request = request with { System = McpServerInstructionsBuilder.MergeSystemMessage(request.System, servers) };
        if (span.ChatConfig.CodeExecutionEnabled)
            codeInterpreter.AddTools(request.Tools, span.ChatConfig.Model!.CurrentSnapshot.AllowVision);
        var mappings = McpToolNameMapper.Build(servers.SelectMany(s => s.McpTools),
            span.ChatConfig.CodeExecutionEnabled ? CodeInterpreterExecutor.ToolNames : []);
        foreach (var mapping in mappings)
            request.Tools.Add(FunctionTool.Create(mapping.ExposedName, mapping.Tool.Description, mapping.Tool.Parameters));
        return request;
    }
}
