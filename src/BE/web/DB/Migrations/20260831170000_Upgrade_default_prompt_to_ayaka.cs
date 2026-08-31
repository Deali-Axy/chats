using Chats.DB;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chats.BE.DB.Migrations
{
    /// <summary>
    /// Rebrands the untouched upstream default prompt and active chat configs in existing SQLite databases.
    /// Historical chat-config snapshots are intentionally left unchanged.
    /// </summary>
    [DbContext(typeof(ChatsDB))]
    [Migration("20260831170000_Upgrade_default_prompt_to_ayaka")]
    public partial class Upgrade_default_prompt_to_ayaka : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "Prompt"
                SET "Content" = 'You are an AI assistant named Ayaka Chats. Please follow user instructions carefully and respond accordingly.',
                    "UpdatedAt" = CURRENT_TIMESTAMP
                WHERE "IsDefault" = 1
                  AND "IsSystem" = 1
                  AND "Content" IN (
                    'You are an AI assistant named Sdcb Chats. Please follow user instructions carefully and respond accordingly.',
                    'You are an AI assistant named Sdcb Chats. Please follow user instructions carefully and respond accordingly. Current date: {{CURRENT_DATE}}'
                  );
                """);

            migrationBuilder.Sql("""
                UPDATE "ChatConfig"
                SET "SystemPrompt" = 'You are an AI assistant named Ayaka Chats. Please follow user instructions carefully and respond accordingly.'
                WHERE "SystemPrompt" IN (
                    'You are an AI assistant named Sdcb Chats. Please follow user instructions carefully and respond accordingly.',
                    'You are an AI assistant named Sdcb Chats. Please follow user instructions carefully and respond accordingly. Current date: {{CURRENT_DATE}}'
                  );
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // This is a one-way branding correction; never restore the upstream name.
        }
    }
}
