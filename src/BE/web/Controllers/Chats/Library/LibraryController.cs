using Chats.BE.Controllers.Chats.Library.Dtos;
using Chats.BE.Controllers.Chats.Messages.Dtos;
using Chats.BE.Controllers.Common.Dtos;
using Chats.BE.Infrastructure;
using Chats.BE.Services.FileServices;
using Chats.DB;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Chats.BE.Controllers.Chats.Library;

[Route("api/library"), Authorize]
public sealed class LibraryController(ChatsDB db) : ControllerBase
{
    [HttpGet("folders")]
    public async Task<ActionResult<LibraryFolderDto[]>> GetFolders(
        [FromServices] CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        LibraryFolderDto[] folders = await db.LibraryFolders
            .Where(x => x.UserId == currentUser.Id)
            .OrderBy(x => x.Name)
            .Select(x => new LibraryFolderDto
            {
                Id = x.Id,
                ParentId = x.ParentId,
                Name = x.Name,
                UpdatedAt = x.UpdatedAt,
            })
            .ToArrayAsync(cancellationToken);
        return Ok(folders);
    }

    [HttpPost("folders")]
    public async Task<ActionResult<LibraryFolderDto>> CreateFolder(
        [FromBody] CreateLibraryFolderRequest request,
        [FromServices] CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        string name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name)) return BadRequest("Folder name is required.");

        if (request.ParentId.HasValue && !await FolderExists(request.ParentId.Value, currentUser.Id, cancellationToken))
        {
            return NotFound("Parent folder not found.");
        }

        bool duplicated = await db.LibraryFolders.AnyAsync(
            x => x.UserId == currentUser.Id && x.ParentId == request.ParentId && x.Name == name,
            cancellationToken);
        if (duplicated) return Conflict("A folder with this name already exists.");

        DateTime now = DateTime.UtcNow;
        LibraryFolder folder = new()
        {
            UserId = currentUser.Id,
            ParentId = request.ParentId,
            Name = name,
            CreatedAt = now,
            UpdatedAt = now,
        };
        db.LibraryFolders.Add(folder);
        await db.SaveChangesAsync(cancellationToken);

        return Created($"api/library/folders/{folder.Id}", ToDto(folder));
    }

    [HttpGet("items")]
    public async Task<ActionResult<PagedResult<LibraryItemDto>>> GetItems(
        [FromQuery] PagingRequest paging,
        int? folderId,
        string? kind,
        string? query,
        bool includeArchived,
        [FromServices] CurrentUser currentUser,
        [FromServices] FileUrlProvider fileUrlProvider,
        CancellationToken cancellationToken)
    {
        IQueryable<LibraryItem> items = db.LibraryItems
            .Where(x => x.UserId == currentUser.Id)
            .Include(x => x.File!).ThenInclude(x => x.FileService)
            .OrderByDescending(x => x.UpdatedAt);

        if (!includeArchived) items = items.Where(x => !x.IsArchived);
        if (folderId.HasValue) items = items.Where(x => x.FolderId == folderId);

        if (!string.IsNullOrWhiteSpace(kind))
        {
            items = kind.Trim().ToLowerInvariant() switch
            {
                "image" => items.Where(x => x.File != null && x.File.MediaType.StartsWith("image/")),
                "file" => items.Where(x => x.File != null && !x.File.MediaType.StartsWith("image/")),
                "note" => items.Where(x => x.FileId == null),
                _ => items,
            };
        }

        if (!string.IsNullOrWhiteSpace(query))
        {
            string keyword = query.Trim();
            items = items.Where(x => x.Title.Contains(keyword) || (x.Content != null && x.Content.Contains(keyword)));
        }

        LibraryItem[] rows = await items
            .Skip(paging.Skip)
            .Take(paging.PageSize)
            .ToArrayAsync(cancellationToken);
        int count = await items.CountAsync(cancellationToken);

        return Ok(new PagedResult<LibraryItemDto>
        {
            Rows = rows.Select(x => ToDto(x, fileUrlProvider)).ToArray(),
            Count = count,
        });
    }

    [HttpPost("notes")]
    public async Task<ActionResult<LibraryItemDto>> CreateNote(
        [FromBody] CreateLibraryNoteRequest request,
        [FromServices] CurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        string title = request.Title.Trim();
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest("Title and content are required.");
        }
        if (request.FolderId.HasValue && !await FolderExists(request.FolderId.Value, currentUser.Id, cancellationToken))
        {
            return NotFound("Folder not found.");
        }

        DateTime now = DateTime.UtcNow;
        LibraryItem item = new()
        {
            UserId = currentUser.Id,
            FolderId = request.FolderId,
            Title = title,
            Content = request.Content,
            CreatedAt = now,
            UpdatedAt = now,
        };
        db.LibraryItems.Add(item);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"api/library/items/{item.Id}", ToDto(item, null));
    }

    [HttpPatch("items/{id:long}")]
    public async Task<ActionResult<LibraryItemDto>> UpdateItem(
        long id,
        [FromBody] UpdateLibraryItemRequest request,
        [FromServices] CurrentUser currentUser,
        [FromServices] FileUrlProvider fileUrlProvider,
        CancellationToken cancellationToken)
    {
        LibraryItem? item = await db.LibraryItems
            .Include(x => x.File!).ThenInclude(x => x.FileService)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == currentUser.Id, cancellationToken);
        if (item == null) return NotFound("Library item not found.");

        if (request.FolderId.HasValue && !await FolderExists(request.FolderId.Value, currentUser.Id, cancellationToken))
        {
            return NotFound("Folder not found.");
        }
        if (!string.IsNullOrWhiteSpace(request.Title)) item.Title = request.Title.Trim();
        item.FolderId = request.FolderId;
        if (request.IsArchived.HasValue) item.IsArchived = request.IsArchived.Value;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(item, fileUrlProvider));
    }

    private Task<bool> FolderExists(int id, int userId, CancellationToken cancellationToken)
        => db.LibraryFolders.AnyAsync(x => x.Id == id && x.UserId == userId, cancellationToken);

    private static LibraryFolderDto ToDto(LibraryFolder folder) => new()
    {
        Id = folder.Id,
        ParentId = folder.ParentId,
        Name = folder.Name,
        UpdatedAt = folder.UpdatedAt,
    };

    private static LibraryItemDto ToDto(LibraryItem item, FileUrlProvider? fileUrlProvider) => new()
    {
        Id = item.Id,
        FolderId = item.FolderId,
        Title = item.Title,
        Kind = item.File == null ? "note" : item.File.MediaType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ? "image" : "file",
        Content = item.Content,
        File = item.File == null || fileUrlProvider == null ? null : fileUrlProvider.CreateFileDto(item.File),
        UpdatedAt = item.UpdatedAt,
    };
}
