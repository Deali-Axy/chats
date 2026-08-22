using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chats.BE.DB.Migrations
{
    /// <inheritdoc />
    public partial class Upgrade_to_1_16 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatConfig_Model",
                table: "ChatConfig");

            migrationBuilder.DropForeignKey(
                name: "FK_UserApiCache_ModelId",
                table: "UserApiCache");

            migrationBuilder.DropForeignKey(
                name: "FK_ApiKeyModel2_Model",
                table: "UserApiModel");

            migrationBuilder.DropForeignKey(
                name: "FK_UserModel2_Model",
                table: "UserModel");

            migrationBuilder.AlterColumn<short>(
                name: "ModelId",
                table: "ChatConfig",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(short),
                oldType: "INTEGER");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatConfig_Model",
                table: "ChatConfig",
                column: "ModelId",
                principalTable: "Model",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_UserApiCache_ModelId",
                table: "UserApiCache",
                column: "ModelId",
                principalTable: "Model",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ApiKeyModel2_Model",
                table: "UserApiModel",
                column: "ModelId",
                principalTable: "Model",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserModel2_Model",
                table: "UserModel",
                column: "ModelId",
                principalTable: "Model",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatConfig_Model",
                table: "ChatConfig");

            migrationBuilder.DropForeignKey(
                name: "FK_UserApiCache_ModelId",
                table: "UserApiCache");

            migrationBuilder.DropForeignKey(
                name: "FK_ApiKeyModel2_Model",
                table: "UserApiModel");

            migrationBuilder.DropForeignKey(
                name: "FK_UserModel2_Model",
                table: "UserModel");

            migrationBuilder.AlterColumn<short>(
                name: "ModelId",
                table: "ChatConfig",
                type: "INTEGER",
                nullable: false,
                defaultValue: (short)0,
                oldClrType: typeof(short),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ChatConfig_Model",
                table: "ChatConfig",
                column: "ModelId",
                principalTable: "Model",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserApiCache_ModelId",
                table: "UserApiCache",
                column: "ModelId",
                principalTable: "Model",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ApiKeyModel2_Model",
                table: "UserApiModel",
                column: "ModelId",
                principalTable: "Model",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserModel2_Model",
                table: "UserModel",
                column: "ModelId",
                principalTable: "Model",
                principalColumn: "Id");
        }
    }
}
