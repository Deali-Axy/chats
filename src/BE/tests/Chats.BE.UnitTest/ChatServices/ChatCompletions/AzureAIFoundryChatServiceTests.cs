using Chats.BE.Controllers.Users.Usages.Dtos;
using Chats.BE.Services.Models;
using Chats.BE.Services.Models.ChatServices.OpenAI;
using Chats.BE.Services.Models.Dtos;
using Chats.BE.Services.Models.Neutral;
using Chats.BE.UnitTest.ChatServices.Http;
using Chats.DB;
using Chats.DB.Enums;
using System.Net;

namespace Chats.BE.UnitTest.ChatServices.ChatCompletions;

public class AzureAIFoundryChatServiceTests
{
    /// <summary>
    /// Creates a minimal Azure AI Foundry request for chat completion streaming tests.
    /// </summary>
    private static ChatRequest CreateStreamingRequest(Model model)
    {
        var chatConfig = new ChatConfig
        {
            Id = 1,
            ModelId = 1,
            Model = model,
        };

        return new ChatRequest
        {
            Messages = [NeutralMessage.FromUserText("hello")],
            ChatConfig = chatConfig,
            Source = UsageSource.Api,
            Streamed = true,
            EndUserId = "8"
        };
    }

    /// <summary>
    /// Creates a minimal Azure AI Foundry model for streaming parser tests.
    /// </summary>
    private static Model CreateAzureAIFoundryModel()
    {
        var modelKey = new ModelKey
        {
            Id = 1,
            Name = "TestKey",
            Secret = "test-api-key",
            Host = "https://example.services.ai.azure.com/models",
            ModelProviderId = (int)DBModelProvider.AzureAIFoundry,
        };

        return new Model
        {
            Id = 1,
            Name = "Grok",
            DeploymentName = "grok-4-1-fast-reasoning",
            ModelKeyId = 1,
            ModelKey = modelKey,
            AllowStreaming = true,
            ApiTypeId = (byte)DBApiType.OpenAIChatCompletion,
        };
    }

    [Fact]
    public async Task Streaming_GrokUsageShouldRespectTotalTokens()
    {
        var chunks = new List<string>
        {
            "data: {\"id\":\"41b43bde-7f82-4a80-9692-91e8b0739f52\",\"object\":\"chat.completion.chunk\",\"created\":1773405995,\"model\":\"grok-4-1-fast-reasoning\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"hello\"},\"finish_reason\":null}]}\n\n",
            "data: {\"id\":\"41b43bde-7f82-4a80-9692-91e8b0739f52\",\"object\":\"chat.completion.chunk\",\"created\":1773405995,\"model\":\"grok-4-1-fast-reasoning\",\"choices\":[{\"index\":0,\"delta\":{},\"finish_reason\":\"stop\"}]}\n\n",
            "data: {\"id\":\"41b43bde-7f82-4a80-9692-91e8b0739f52\",\"object\":\"chat.completion.chunk\",\"created\":1773405995,\"model\":\"grok-4-1-fast-reasoning\",\"choices\":[],\"usage\":{\"prompt_tokens\":69,\"completion_tokens\":837,\"total_tokens\":1737,\"prompt_tokens_details\":{\"text_tokens\":69,\"audio_tokens\":0,\"image_tokens\":0,\"cached_tokens\":0},\"completion_tokens_details\":{\"reasoning_tokens\":831,\"audio_tokens\":0,\"accepted_prediction_tokens\":0,\"rejected_prediction_tokens\":0},\"num_sources_used\":0,\"cost_in_usd_ticks\":0},\"system_fingerprint\":\"fp_39c5j0a324\"}\n\n",
            "data: [DONE]\n\n"
        };

        var httpClientFactory = new FiddlerDumpHttpClientFactory(chunks, HttpStatusCode.OK);
        var service = new AzureAIFoundryChatService(httpClientFactory);
        var request = CreateStreamingRequest(CreateAzureAIFoundryModel());

        var segments = new List<ChatSegment>();
        await foreach (var segment in service.ChatStreamed(request, CancellationToken.None))
        {
            segments.Add(segment);
        }

        UsageChatSegment? usage = segments.OfType<UsageChatSegment>().LastOrDefault();
        Assert.NotNull(usage);
        Assert.Equal(69, usage.Usage.InputTokens);
        Assert.Equal(1668, usage.Usage.OutputTokens);
        Assert.Equal(831, usage.Usage.ReasoningTokens);
        Assert.Equal(1737, usage.Usage.InputTokens + usage.Usage.OutputTokens);
    }

    [Theory]
    [InlineData("{\"index\":0,\"finish_reason\":\"stop\"}")]
    [InlineData("{\"index\":0,\"delta\":null,\"finish_reason\":\"stop\"}")]
    public async Task Streaming_FinalChunkWithoutObjectDelta_ShouldNotThrow(string finalChoice)
    {
        var chunks = new List<string>
        {
            "data: {\"id\":\"chunk-1\",\"object\":\"chat.completion.chunk\",\"created\":1773405995,\"model\":\"grok-4-1-fast-reasoning\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"hello\"},\"finish_reason\":null}]}\n\n",
            $"data: {{\"id\":\"chunk-2\",\"object\":\"chat.completion.chunk\",\"created\":1773405996,\"model\":\"grok-4-1-fast-reasoning\",\"choices\":[{finalChoice}]}}\n\n",
            "data: [DONE]\n\n"
        };

        var httpClientFactory = new FiddlerDumpHttpClientFactory(chunks, HttpStatusCode.OK);
        var service = new AzureAIFoundryChatService(httpClientFactory);
        var request = CreateStreamingRequest(CreateAzureAIFoundryModel());

        var segments = new List<ChatSegment>();
        await foreach (var segment in service.ChatStreamed(request, CancellationToken.None))
        {
            segments.Add(segment);
        }

        var textSegment = Assert.Single(segments.OfType<TextChatSegment>());
        Assert.Equal("hello", textSegment.Text);

        var finishReason = Assert.Single(segments.OfType<FinishReasonChatSegment>());
        Assert.Equal(DBFinishReason.Stop, finishReason.FinishReason);
    }
}