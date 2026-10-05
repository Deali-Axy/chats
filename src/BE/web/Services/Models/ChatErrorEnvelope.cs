using System.Text.Json;
using System.Text.Json.Nodes;

namespace Chats.BE.Services.Models;

public static class ChatErrorEnvelope
{
    public const string GatewayUnavailableMessage =
        "The service is temporarily unavailable. Please retry later.";

    public static string FromRaw(int statusCode, string? body)
    {
        string trimmed = (body ?? string.Empty).Trim();
        if (LooksLikeHtml(trimmed))
        {
            return JsonSerializer.Serialize(new Dictionary<string, object?>
            {
                ["code"] = "upstream_error",
                ["message"] = GatewayUnavailableMessage,
                ["type"] = "upstream_error",
                ["status"] = statusCode,
            });
        }

        if (trimmed.Length > 0 && (trimmed[0] == '{' || trimmed[0] == '['))
        {
            try
            {
                JsonNode? node = JsonNode.Parse(trimmed);
                if (node is JsonObject obj)
                {
                    obj["status"] = statusCode;
                    return obj.ToJsonString();
                }
            }
            catch (JsonException)
            {
            }
        }

        return trimmed;
    }

    internal static bool LooksLikeHtml(string text) =>
        text.Contains("<html", StringComparison.OrdinalIgnoreCase)
        || text.Contains("<!DOCTYPE", StringComparison.OrdinalIgnoreCase)
        || text.Contains("<center>", StringComparison.OrdinalIgnoreCase);
}
