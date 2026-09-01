using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chats.BE.DB.Migrations
{
    /// <inheritdoc />
    public partial class Upgrade_to_1_18_single_model_chat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // An old chat can contain parallel spans. Keep the first enabled one
            // (or the first span if none was enabled) before enforcing the new
            // one-span-per-chat invariant.
            migrationBuilder.Sql("""
                DELETE FROM "ChatSpan"
                WHERE ("ChatId", "SpanId") IN
                (
                    SELECT "ChatId", "SpanId"
                    FROM
                    (
                        SELECT "ChatId", "SpanId",
                            ROW_NUMBER() OVER
                            (
                                PARTITION BY "ChatId"
                                ORDER BY CASE WHEN "Enabled" THEN 0 ELSE 1 END, "SpanId"
                            ) AS "RowNumber"
                        FROM "ChatSpan"
                    )
                    WHERE "RowNumber" > 1
                );
                """);

            // Span IDs are an internal detail now. Existing turns retain their
            // config snapshots, so normalizing the ID does not lose model history.
            migrationBuilder.Sql("""
                UPDATE "ChatSpan" SET "SpanId" = 0, "Enabled" = 1;
                UPDATE "ChatTurn" SET "SpanId" = 0 WHERE "SpanId" IS NOT NULL;
                """);

            migrationBuilder.DropTable(
                name: "ChatPresetSpan");

            migrationBuilder.DropTable(
                name: "ChatPreset");

            // After preset rows are gone, configs without a surviving chat span
            // are exclusively legacy data and can be safely removed.
            migrationBuilder.Sql("""
                DELETE FROM "ChatConfigMcp"
                WHERE "ChatConfigId" IN
                (
                    SELECT "Id" FROM "ChatConfig"
                    WHERE NOT EXISTS (SELECT 1 FROM "ChatSpan" WHERE "ChatSpan"."ChatConfigId" = "ChatConfig"."Id")
                );

                DELETE FROM "ChatConfig"
                WHERE NOT EXISTS (SELECT 1 FROM "ChatSpan" WHERE "ChatSpan"."ChatConfigId" = "ChatConfig"."Id");
                """);

            migrationBuilder.CreateIndex(
                name: "IX_ChatSpan_ChatId",
                table: "ChatSpan",
                column: "ChatId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChatSpan_ChatId",
                table: "ChatSpan");

            migrationBuilder.CreateTable(
                name: "ChatPreset",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    IsSystem = table.Column<bool>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Order = table.Column<short>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatPreset", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatPreset_User",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatPresetSpan",
                columns: table => new
                {
                    ChatPresetId = table.Column<int>(type: "INTEGER", nullable: false),
                    SpanId = table.Column<byte>(type: "INTEGER", nullable: false),
                    ChatConfigId = table.Column<int>(type: "INTEGER", nullable: false),
                    Enabled = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatPresetSpan", x => new { x.ChatPresetId, x.SpanId });
                    table.ForeignKey(
                        name: "FK_ChatPresetSpan_Config",
                        column: x => x.ChatConfigId,
                        principalTable: "ChatConfig",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ChatPresetSpan_Preset",
                        column: x => x.ChatPresetId,
                        principalTable: "ChatPreset",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatPreset_IsSystem_Order",
                table: "ChatPreset",
                columns: new[] { "IsSystem", "Order", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatPreset_Name",
                table: "ChatPreset",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_ChatPreset_UserId",
                table: "ChatPreset",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatPresetSpan_Config",
                table: "ChatPresetSpan",
                column: "ChatConfigId");
        }
    }
}
