using Chats.BE.Services.UrlEncryption;
using System.Text.Json.Serialization;

namespace Chats.BE.Controllers.Chats.UserChats.Dtos;

public record EncryptedCreateChatRequest
{
    [JsonPropertyName("title")]
    public required string Title { get; init; }

    [JsonPropertyName("groupId")]
    public required string? GroupId { get; init; }

    /// <summary>
    /// 是否为临时聊天
    /// </summary>
    [JsonPropertyName("isTemp")]
    public bool IsTemp { get; init; }

    public CreateChatRequest Decrypt(IUrlEncryptionService urlEncryption)
    {
        return new CreateChatRequest
        {
            Title = Title,
            GroupId = urlEncryption.DecryptChatGroupIdOrNull(GroupId),
            IsTemp = IsTemp
        };
    }
}

public record CreateChatRequest
{
    public required string Title { get; init; }

    public required int? GroupId { get; init; }

    /// <summary>
    /// 是否为临时聊天
    /// </summary>
    public bool IsTemp { get; init; }
}