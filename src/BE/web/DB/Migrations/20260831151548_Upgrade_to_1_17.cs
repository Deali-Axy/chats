using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chats.BE.DB.Migrations
{
    /// <inheritdoc />
    public partial class Upgrade_to_1_17 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Background",
                table: "ChatConfigSnapshot",
                type: "TEXT",
                unicode: false,
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Background",
                table: "ChatConfig",
                type: "TEXT",
                unicode: false,
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Background",
                table: "ChatConfigSnapshot");

            migrationBuilder.DropColumn(
                name: "Background",
                table: "ChatConfig");
        }
    }
}
