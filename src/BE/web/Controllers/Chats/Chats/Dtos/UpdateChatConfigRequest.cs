using System.Text.Json.Serialization;
using Chats.BE.Controllers.Chats.UserChats.Dtos;
using Chats.DB;

namespace Chats.BE.Controllers.Chats.Chats.Dtos;

/// <summary>Mutable configuration for the single model assigned to a chat.</summary>
public record UpdateChatConfigRequest
{
    [JsonPropertyName("modelId")] public short ModelId { get; init; }
    [JsonPropertyName("systemPrompt")] public string? SystemPrompt { get; init; }
    [JsonPropertyName("temperature")] public float? Temperature { get; init; }
    [JsonPropertyName("webSearchEnabled")] public bool WebSearchEnabled { get; init; }
    [JsonPropertyName("codeExecutionEnabled")] public bool CodeExecutionEnabled { get; init; }
    [JsonPropertyName("maxOutputTokens")] public int? MaxOutputTokens { get; init; }
    [JsonPropertyName("reasoningEffort")] public string? ReasoningEffort { get; init; }
    [JsonPropertyName("thinkingBudget")] public int? ThinkingBudget { get; init; }
    [JsonPropertyName("imageSize")] public string? ImageSize { get; init; }
    [JsonPropertyName("format")] public string? Format { get; init; }
    [JsonPropertyName("compression")] public byte? Compression { get; init; }
    [JsonPropertyName("background")] public string? Background { get; init; }
    [JsonPropertyName("mcps")] public ChatSpanMcp[] Mcps { get; init; } = [];

    public void ApplyTo(ChatConfig config)
    {
        ReasoningEfforts.ThrowIfInvalid(ReasoningEffort);
        config.ModelId = ModelId;
        config.SystemPrompt = string.IsNullOrEmpty(SystemPrompt) ? null : SystemPrompt;
        config.Temperature = Temperature;
        config.WebSearchEnabled = WebSearchEnabled;
        config.CodeExecutionEnabled = CodeExecutionEnabled;
        config.MaxOutputTokens = MaxOutputTokens;
        config.Effort = ReasoningEffort;
        config.ThinkingBudget = ThinkingBudget;
        config.ImageSize = ImageSize;
        config.Format = Format;
        config.Compression = Compression;
        config.Background = Background;

        HashSet<int> requested = [.. Mcps.Select(x => x.Id)];
        foreach (ChatConfigMcp item in config.ChatConfigMcps.Where(x => !requested.Contains(x.McpServerId)).ToArray())
        {
            config.ChatConfigMcps.Remove(item);
        }
        foreach (ChatSpanMcp mcp in Mcps)
        {
            ChatConfigMcp? existing = config.ChatConfigMcps.FirstOrDefault(x => x.McpServerId == mcp.Id);
            if (existing is null)
            {
                config.ChatConfigMcps.Add(new ChatConfigMcp { McpServerId = mcp.Id, CustomHeaders = mcp.GetNormalizedCustomHeaders() });
            }
            else
            {
                existing.CustomHeaders = mcp.GetNormalizedCustomHeaders();
            }
        }
    }
}
