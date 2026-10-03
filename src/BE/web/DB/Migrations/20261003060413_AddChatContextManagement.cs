using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chats.BE.DB.Migrations
{
    /// <inheritdoc />
    public partial class AddChatContextManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AutoCompactEnabled",
                table: "ChatSpan",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "ContextAfterTokens",
                table: "ChatSpan",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ContextBeforeTokens",
                table: "ChatSpan",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ContextBoundaryTurnId",
                table: "ChatSpan",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ContextCompactedAt",
                table: "ChatSpan",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ContextCompactedTurns",
                table: "ChatSpan",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ContextKeepRecentTurns",
                table: "ChatSpan",
                type: "INTEGER",
                nullable: false,
                defaultValue: 6);

            migrationBuilder.AddColumn<int>(
                name: "ContextRevision",
                table: "ChatSpan",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ContextSourceHash",
                table: "ChatSpan",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContextSummary",
                table: "ChatSpan",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AutoCompactEnabled",
                table: "ChatSpan");

            migrationBuilder.DropColumn(
                name: "ContextAfterTokens",
                table: "ChatSpan");

            migrationBuilder.DropColumn(
                name: "ContextBeforeTokens",
                table: "ChatSpan");

            migrationBuilder.DropColumn(
                name: "ContextBoundaryTurnId",
                table: "ChatSpan");

            migrationBuilder.DropColumn(
                name: "ContextCompactedAt",
                table: "ChatSpan");

            migrationBuilder.DropColumn(
                name: "ContextCompactedTurns",
                table: "ChatSpan");

            migrationBuilder.DropColumn(
                name: "ContextKeepRecentTurns",
                table: "ChatSpan");

            migrationBuilder.DropColumn(
                name: "ContextRevision",
                table: "ChatSpan");

            migrationBuilder.DropColumn(
                name: "ContextSourceHash",
                table: "ChatSpan");

            migrationBuilder.DropColumn(
                name: "ContextSummary",
                table: "ChatSpan");
        }
    }
}
