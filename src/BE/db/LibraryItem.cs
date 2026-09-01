using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Chats.DB;

[Table("LibraryItem")]
[Index("UserId", "FolderId", "UpdatedAt", Name = "IX_LibraryItem_User_Folder_UpdatedAt")]
[Index("FileId", Name = "IX_LibraryItem_FileId", IsUnique = true)]
public class LibraryItem
{
    [Key]
    public long Id { get; set; }

    public int UserId { get; set; }

    public int? FileId { get; set; }

    public int? FolderId { get; set; }

    [StringLength(200)]
    public string Title { get; set; } = null!;

    /// <summary>Saved text or Markdown content. File-backed items leave this null.</summary>
    public string? Content { get; set; }

    public bool IsArchived { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    [ForeignKey("FileId")]
    public virtual File? File { get; set; }

    [ForeignKey("FolderId")]
    public virtual LibraryFolder? Folder { get; set; }

    public static LibraryItem FromFile(File file)
        => new()
        {
            UserId = file.CreateUserId,
            File = file,
            Title = file.FileName,
            CreatedAt = file.CreatedAt,
            UpdatedAt = file.CreatedAt,
        };
}
