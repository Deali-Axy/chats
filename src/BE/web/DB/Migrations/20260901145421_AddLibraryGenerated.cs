using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chats.BE.DB.Migrations
{
    /// <inheritdoc />
    public partial class AddLibraryGenerated : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LibraryFolder",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    ParentId = table.Column<int>(type: "INTEGER", nullable: true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LibraryFolder", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LibraryFolder_Parent",
                        column: x => x.ParentId,
                        principalTable: "LibraryFolder",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LibraryFolder_User",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LibraryItem",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    FileId = table.Column<int>(type: "INTEGER", nullable: true),
                    FolderId = table.Column<int>(type: "INTEGER", nullable: true),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "TEXT", nullable: true),
                    IsArchived = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LibraryItem", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LibraryItem_File",
                        column: x => x.FileId,
                        principalTable: "File",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LibraryItem_Folder",
                        column: x => x.FolderId,
                        principalTable: "LibraryFolder",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LibraryItem_User",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LibraryFolder_ParentId",
                table: "LibraryFolder",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryFolder_User_Parent_Name",
                table: "LibraryFolder",
                columns: new[] { "UserId", "ParentId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LibraryItem_FileId",
                table: "LibraryItem",
                column: "FileId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LibraryItem_FolderId",
                table: "LibraryItem",
                column: "FolderId");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryItem_User_Folder_UpdatedAt",
                table: "LibraryItem",
                columns: new[] { "UserId", "FolderId", "UpdatedAt" });

            // Existing uploads and generated artifacts predate LibraryItem. Index them
            // during upgrade so every user sees their existing material immediately.
            migrationBuilder.Sql("""
                INSERT INTO "LibraryItem" ("UserId", "FileId", "Title", "IsArchived", "CreatedAt", "UpdatedAt")
                SELECT "CreateUserId", "Id", "FileName", 0, "CreatedAt", "CreatedAt"
                FROM "File";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LibraryItem");

            migrationBuilder.DropTable(
                name: "LibraryFolder");
        }
    }
}
