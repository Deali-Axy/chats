using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chats.BE.DB.Migrations
{
    /// <inheritdoc />
    public partial class Upgrade_to_1_15 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_McpServer_OwnerUserId",
                table: "McpServer");

            migrationBuilder.DropIndex(
                name: "UX_McpServer_Label",
                table: "McpServer");

            // Preserve Label into DisplayName / Name before dropping (matches upstream 1.15 sqlite intent).
            migrationBuilder.AddColumn<string>(
                name: "DisplayName",
                table: "McpServer",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "McpServer",
                type: "TEXT",
                unicode: false,
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ServerInstructions",
                table: "McpServer",
                type: "TEXT",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "McpServer"
                SET "DisplayName" = "Label",
                    "Name" = CAST("Id" AS TEXT);
                """);

            migrationBuilder.DropColumn(
                name: "Label",
                table: "McpServer");

            migrationBuilder.AddColumn<bool>(
                name: "ShowShortcut",
                table: "UserMcp",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ApiKeyEnabled",
                table: "UserInitialConfig",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "Mcps",
                table: "UserInitialConfig",
                type: "TEXT",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<bool>(
                name: "ApiKeyEnabled",
                table: "User",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "DisplayName",
                table: "StepContentToolCall",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContextTemplate",
                table: "StepContentText",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Destructive",
                table: "McpTool",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Idempotent",
                table: "McpTool",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "OpenWorld",
                table: "McpTool",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ReadOnly",
                table: "McpTool",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "McpTool",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsSystem",
                table: "ChatPreset",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "UX_McpServer_Owner_Name",
                table: "McpServer",
                columns: new[] { "OwnerUserId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatPreset_IsSystem_Order",
                table: "ChatPreset",
                columns: new[] { "IsSystem", "Order", "Id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_McpServer_Owner_Name",
                table: "McpServer");

            migrationBuilder.DropIndex(
                name: "IX_ChatPreset_IsSystem_Order",
                table: "ChatPreset");

            migrationBuilder.DropColumn(
                name: "ShowShortcut",
                table: "UserMcp");

            migrationBuilder.DropColumn(
                name: "ApiKeyEnabled",
                table: "UserInitialConfig");

            migrationBuilder.DropColumn(
                name: "Mcps",
                table: "UserInitialConfig");

            migrationBuilder.DropColumn(
                name: "ApiKeyEnabled",
                table: "User");

            migrationBuilder.DropColumn(
                name: "DisplayName",
                table: "StepContentToolCall");

            migrationBuilder.DropColumn(
                name: "ContextTemplate",
                table: "StepContentText");

            migrationBuilder.DropColumn(
                name: "Destructive",
                table: "McpTool");

            migrationBuilder.DropColumn(
                name: "Idempotent",
                table: "McpTool");

            migrationBuilder.DropColumn(
                name: "OpenWorld",
                table: "McpTool");

            migrationBuilder.DropColumn(
                name: "ReadOnly",
                table: "McpTool");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "McpTool");

            migrationBuilder.DropColumn(
                name: "DisplayName",
                table: "McpServer");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "McpServer");

            migrationBuilder.DropColumn(
                name: "ServerInstructions",
                table: "McpServer");

            migrationBuilder.DropColumn(
                name: "IsSystem",
                table: "ChatPreset");

            migrationBuilder.AddColumn<string>(
                name: "Label",
                table: "McpServer",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_McpServer_OwnerUserId",
                table: "McpServer",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "UX_McpServer_Label",
                table: "McpServer",
                column: "Label",
                unique: true);
        }
    }
}
