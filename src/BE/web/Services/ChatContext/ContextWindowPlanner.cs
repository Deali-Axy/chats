using Chats.BE.Services.Models;
using Chats.BE.Services.Models.Neutral;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Encodings.Web;

namespace Chats.BE.Services.ChatContext;

public sealed record ContextTurn(long Id, bool IsUser, IList<NeutralMessage> Messages);

public static class ContextWindowPlanner
{
    public const double AutoCompactRatio = 0.8;
    // This JSON is plain model input, not HTML. Keep non-ASCII text readable and token-efficient.
    private static readonly JsonSerializerOptions TranscriptOptions = new() { Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };

    public static (int Window, int Reserved, int Budget, int Threshold) GetBudget(ChatRequest request)
    {
        int window = Math.Max(1, request.GetRequiredModel().CurrentSnapshot.ContextWindow);
        // Keep space for output even when the provider chooses its own default output limit.
        int reserved = Math.Clamp(request.ChatConfig.MaxOutputTokens ?? Math.Min(8192, Math.Max(256, window / 8)), 1, Math.Max(1, window - 1));
        int margin = Math.Min(4096, Math.Max(32, window / 20));
        int budget = Math.Max(1, window - reserved - margin);
        return (window, reserved, budget, Math.Max(1, (int)(budget * AutoCompactRatio)));
    }

    public static int FindBoundary(IReadOnlyList<ContextTurn> turns, int keepRecentTurns)
    {
        int limit = Math.Max(0, turns.Count - keepRecentTurns);
        HashSet<string> pending = new(StringComparer.Ordinal);
        int boundary = 0;
        for (int i = 0; i < limit; i++)
        {
            foreach (NeutralContent content in turns[i].Messages.SelectMany(m => m.Contents))
            {
                if (content is NeutralToolCallContent call) pending.Add(call.Id);
                if (content is NeutralToolCallResponseContent result) pending.Remove(result.ToolCallId);
            }
            // Never split a user/assistant exchange or a tool call from its result.
            if (!turns[i].IsUser && pending.Count == 0 && (i + 1 == turns.Count || turns[i + 1].IsUser))
            {
                boundary = i + 1;
            }
        }
        return boundary;
    }

    public static NeutralMessage SummaryMessage(string summary) => NeutralMessage.FromUserText(
        "The following is a summary of earlier conversation, supplied as historical background. " +
        "It may be incomplete. Use current instructions and recent messages when resolving conflicts.\n" +
        "<conversation_summary>\n" + summary + "\n</conversation_summary>");

    public static string Transcript(IEnumerable<ContextTurn> turns)
    {
        // JSON quotes delimit untrusted message data and avoid ambiguous role/tool boundaries.
        var transcript = turns.Select(turn => new
        {
            turn.Id,
            turn.IsUser,
            Messages = turn.Messages.Select(message => new
            {
                Role = message.Role.ToString(),
                Contents = message.Contents.Where(c => c is not NeutralThinkContent).Select(DescribeContent),
            }),
        });
        return JsonSerializer.Serialize(transcript, TranscriptOptions);
    }

    public static string SourceHash(IEnumerable<ContextTurn> turns) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(Transcript(turns))));

    private static object DescribeContent(NeutralContent content) => content switch
    {
        NeutralTextContent text => new { Type = "text", text.Content },
        NeutralErrorContent error => new { Type = "error", error.Content },
        NeutralToolCallContent call => new { Type = "tool_call", call.Id, call.Name, call.Parameters },
        NeutralToolCallResponseContent result => new { Type = "tool_result", result.ToolCallId, result.Response, result.IsSuccess },
        NeutralFileContent file => new { Type = "attachment_reference", file.File.Id, file.File.FileName, file.File.MediaType },
        NeutralFileUrlContent file => new { Type = "attachment_reference", file.Url },
        NeutralFileBlobContent file => new { Type = "attachment_reference", file.MediaType, Hash = Convert.ToHexString(SHA256.HashData(file.Data)) },
        _ => new { Type = content.GetType().Name },
    };
}
