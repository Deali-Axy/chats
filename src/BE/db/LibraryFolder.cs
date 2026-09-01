using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Chats.DB;

[Table("LibraryFolder")]
[Index("UserId", "ParentId", "Name", Name = "IX_LibraryFolder_User_Parent_Name", IsUnique = true)]
public class LibraryFolder
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? ParentId { get; set; }

    [StringLength(100)]
    public string Name { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    [ForeignKey("ParentId")]
    public virtual LibraryFolder? Parent { get; set; }

    [InverseProperty("Parent")]
    public virtual ICollection<LibraryFolder> Children { get; set; } = new List<LibraryFolder>();
}
