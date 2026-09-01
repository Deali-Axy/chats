using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Chats.BE.Controllers.Chats.Messages.Dtos;

namespace Chats.BE.Controllers.Chats.Library.Dtos;

public sealed record LibraryFolderDto
{
    [JsonPropertyName("id")]
    public required int Id { get; init; }

    [JsonPropertyName("parentId")]
    public int? ParentId { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("updatedAt")]
    public required DateTime UpdatedAt { get; init; }
}

public sealed record LibraryItemDto
{
    [JsonPropertyName("id")]
    public required long Id { get; init; }

    [JsonPropertyName("folderId")]
    public int? FolderId { get; init; }

    [JsonPropertyName("title")]
    public required string Title { get; init; }

    [JsonPropertyName("kind")]
    public required string Kind { get; init; }

    [JsonPropertyName("content")]
    public string? Content { get; init; }

    [JsonPropertyName("file")]
    public FileDto? File { get; init; }

    [JsonPropertyName("updatedAt")]
    public required DateTime UpdatedAt { get; init; }
}

public sealed record CreateLibraryFolderRequest
{
    [Required, StringLength(100)]
    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("parentId")]
    public int? ParentId { get; init; }
}

public sealed record CreateLibraryNoteRequest
{
    [Required, StringLength(200)]
    [JsonPropertyName("title")]
    public required string Title { get; init; }

    [Required]
    [JsonPropertyName("content")]
    public required string Content { get; init; }

    [JsonPropertyName("folderId")]
    public int? FolderId { get; init; }
}

public sealed record UpdateLibraryItemRequest
{
    [StringLength(200)]
    [JsonPropertyName("title")]
    public string? Title { get; init; }

    [JsonPropertyName("folderId")]
    public int? FolderId { get; init; }

    [JsonPropertyName("isArchived")]
    public bool? IsArchived { get; init; }
}
