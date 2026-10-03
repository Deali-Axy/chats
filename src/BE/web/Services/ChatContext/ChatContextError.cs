using System.Text.Json;
using System.Text.RegularExpressions;

namespace Chats.BE.Services.ChatContext;

public static partial class ChatContextError
{
    public const string TimeoutMessage =
        "The model request timed out. Try again, or compact older turns first.";

    public static string ToUserMessage(Exception exception)
    {
        if (exception is OperationCanceledException)
            return "The request was cancelled.";
        return Sanitize(exception.Message);
    }

    public static string Sanitize(string? message)
    {
        if (string.IsNullOrWhiteSpace(message)) return "Context operation failed";
        message = message.Trim();
        if (LooksLikeGatewayFailure(message)) return TimeoutMessage;
        if (TryReadJsonMessage(message, out string? nested) && nested != message)
            return Sanitize(nested);
        return message;
    }

    internal static bool LooksLikeGatewayFailure(string message)
    {
        if (message.Contains("<html", StringComparison.OrdinalIgnoreCase)
            || message.Contains("<!DOCTYPE", StringComparison.OrdinalIgnoreCase)
            || message.Contains("<head", StringComparison.OrdinalIgnoreCase)
            || message.Contains("<center>", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return GatewayPattern().IsMatch(message);
    }

    private static bool TryReadJsonMessage(string text, out string? message)
    {
        message = null;
        if (text.Length == 0 || (text[0] != '{' && text[0] != '[')) return false;
        try
        {
            using JsonDocument document = JsonDocument.Parse(text);
            if (document.RootElement.ValueKind != JsonValueKind.Object) return false;
            if (TryGetString(document.RootElement, "message", out message)) return true;
            if (document.RootElement.TryGetProperty("error", out JsonElement error))
            {
                if (error.ValueKind == JsonValueKind.String)
                {
                    message = error.GetString();
                    return !string.IsNullOrWhiteSpace(message);
                }
                if (error.ValueKind == JsonValueKind.Object && TryGetString(error, "message", out message))
                    return true;
            }
        }
        catch (JsonException)
        {
            return false;
        }
        return false;
    }

    private static bool TryGetString(JsonElement element, string name, out string? value)
    {
        value = null;
        if (!element.TryGetProperty(name, out JsonElement property) || property.ValueKind != JsonValueKind.String)
            return false;
        value = property.GetString();
        return !string.IsNullOrWhiteSpace(value);
    }

    [GeneratedRegex(@"\b(502|503|504|408)\b.*(Bad Gateway|Time-?out|Service Unavailable)|Gateway Time-?out|cloudflare", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex GatewayPattern();
}
