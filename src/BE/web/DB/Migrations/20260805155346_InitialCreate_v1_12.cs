using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chats.BE.DB.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate_v1_12 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChatTag",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatTag", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ClientIP",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    IPAddress = table.Column<string>(type: "TEXT", unicode: false, maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientIP", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ClientUserAgent",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserAgent = table.Column<string>(type: "TEXT", unicode: false, maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientUserAgent", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Config",
                columns: table => new
                {
                    Key = table.Column<string>(type: "TEXT", unicode: false, maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Configs", x => x.Key);
                });

            migrationBuilder.CreateTable(
                name: "FileService",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FileServiceTypeId = table.Column<byte>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Configs = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    IsDefault = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileServices2", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FinishReason",
                columns: table => new
                {
                    Id = table.Column<byte>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", unicode: false, maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinishReason", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InvitationCode",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Value = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Count = table.Column<short>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreateUserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("InvitationCode2_pkey", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LoginService",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Type = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    Enabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    Configs = table.Column<string>(type: "TEXT", maxLength: 2048, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoginServices2", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ModelKeySnapshot",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ModelKeyId = table.Column<short>(type: "INTEGER", nullable: false),
                    ModelProviderId = table.Column<short>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Host = table.Column<string>(type: "TEXT", unicode: false, maxLength: 500, nullable: true),
                    Secret = table.Column<string>(type: "TEXT", unicode: false, maxLength: 1000, nullable: true),
                    CustomHeaders = table.Column<string>(type: "TEXT", unicode: false, nullable: true),
                    CustomBody = table.Column<string>(type: "TEXT", unicode: false, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModelKeySnapshot", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ModelProviderOrder",
                columns: table => new
                {
                    ModelProviderId = table.Column<short>(type: "INTEGER", nullable: false),
                    Order = table.Column<short>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModelProviderOrder", x => x.ModelProviderId);
                });

            migrationBuilder.CreateTable(
                name: "RequestTrace",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    RequestBodyAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ResponseHeaderAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ResponseBodyAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Direction = table.Column<byte>(type: "INTEGER", nullable: false),
                    Source = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: true),
                    TraceId = table.Column<string>(type: "TEXT", unicode: false, maxLength: 100, nullable: true),
                    Method = table.Column<string>(type: "TEXT", unicode: false, maxLength: 10, nullable: false),
                    Url = table.Column<string>(type: "TEXT", maxLength: 2048, nullable: false),
                    RequestContentType = table.Column<string>(type: "TEXT", unicode: false, maxLength: 200, nullable: true),
                    ResponseContentType = table.Column<string>(type: "TEXT", unicode: false, maxLength: 200, nullable: true),
                    StatusCode = table.Column<short>(type: "INTEGER", nullable: true),
                    ErrorType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    RawRequestBodyBytes = table.Column<int>(type: "INTEGER", nullable: false),
                    RawResponseBodyBytes = table.Column<int>(type: "INTEGER", nullable: true),
                    RequestBodyLength = table.Column<int>(type: "INTEGER", nullable: false),
                    ResponseBodyLength = table.Column<int>(type: "INTEGER", nullable: true),
                    ScheduledDeleteAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestTrace", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SmsStatus",
                columns: table => new
                {
                    Id = table.Column<byte>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", unicode: false, maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SmsStatus", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SmsType",
                columns: table => new
                {
                    Id = table.Column<byte>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", unicode: false, maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SmsType", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Avatar = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    UserName = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", unicode: false, maxLength: 1000, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Role = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    Enabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    Provider = table.Column<string>(type: "TEXT", unicode: false, maxLength: 1000, nullable: true),
                    Sub = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("Users2_pkey", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ClientInfo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ClientIpId = table.Column<int>(type: "INTEGER", nullable: false),
                    ClientUserAgentId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientInfo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientInfo_ClientIP",
                        column: x => x.ClientIpId,
                        principalTable: "ClientIP",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ClientInfo_ClientUserAgent",
                        column: x => x.ClientUserAgentId,
                        principalTable: "ClientUserAgent",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserInitialConfig",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    LoginType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Price = table.Column<decimal>(type: "decimal(32, 16)", nullable: false),
                    Models = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    InvitationCodeId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserInitialConfig", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserInitialConfig_InvitationCode",
                        column: x => x.InvitationCodeId,
                        principalTable: "InvitationCode",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ModelKey",
                columns: table => new
                {
                    Id = table.Column<short>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Order = table.Column<short>(type: "INTEGER", nullable: false),
                    CurrentSnapshotId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModelKey2", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModelKey_CurrentSnapshot",
                        column: x => x.CurrentSnapshotId,
                        principalTable: "ModelKeySnapshot",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ModelSnapshot",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ModelId = table.Column<short>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    DeploymentName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    ModelKeyId = table.Column<short>(type: "INTEGER", nullable: false),
                    ModelKeySnapshotId = table.Column<int>(type: "INTEGER", nullable: false),
                    ApiTypeId = table.Column<byte>(type: "INTEGER", nullable: false),
                    InputFreshTokenPrice1M = table.Column<decimal>(type: "decimal(9, 5)", nullable: false),
                    InputCachedTokenPrice1M = table.Column<decimal>(type: "decimal(9, 5)", nullable: false),
                    OutputTokenPrice1M = table.Column<decimal>(type: "decimal(9, 5)", nullable: false),
                    AllowSearch = table.Column<bool>(type: "INTEGER", nullable: false),
                    AllowVision = table.Column<bool>(type: "INTEGER", nullable: false),
                    AllowStreaming = table.Column<bool>(type: "INTEGER", nullable: false),
                    AllowToolCall = table.Column<bool>(type: "INTEGER", nullable: false),
                    AllowCodeExecution = table.Column<bool>(type: "INTEGER", nullable: false),
                    ThinkTagParserEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    MinTemperature = table.Column<decimal>(type: "decimal(3, 2)", nullable: false),
                    MaxTemperature = table.Column<decimal>(type: "decimal(3, 2)", nullable: false),
                    ContextWindow = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxResponseTokens = table.Column<int>(type: "INTEGER", nullable: false),
                    SupportedEfforts = table.Column<string>(type: "TEXT", unicode: false, maxLength: 200, nullable: true),
                    SupportedImageSizes = table.Column<string>(type: "TEXT", maxLength: 400, nullable: true),
                    UseAsyncApi = table.Column<bool>(type: "INTEGER", nullable: false),
                    UseMaxCompletionTokens = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsLegacy = table.Column<bool>(type: "INTEGER", nullable: false),
                    MaxThinkingBudget = table.Column<int>(type: "INTEGER", nullable: true),
                    SupportsVisionLink = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    SupportedFormats = table.Column<string>(type: "TEXT", unicode: false, maxLength: 100, nullable: true),
                    OverrideUrl = table.Column<string>(type: "TEXT", unicode: false, maxLength: 1000, nullable: true),
                    CustomHeaders = table.Column<string>(type: "TEXT", unicode: false, nullable: true),
                    CustomBody = table.Column<string>(type: "TEXT", unicode: false, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModelSnapshot", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModelSnapshot_ModelKeySnapshot",
                        column: x => x.ModelKeySnapshotId,
                        principalTable: "ModelKeySnapshot",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RequestTracePayload",
                columns: table => new
                {
                    LogId = table.Column<Guid>(type: "TEXT", nullable: false),
                    RequestHeaders = table.Column<string>(type: "TEXT", unicode: false, nullable: false),
                    ResponseHeaders = table.Column<string>(type: "TEXT", unicode: false, nullable: true),
                    RequestBody = table.Column<string>(type: "TEXT", nullable: true),
                    ResponseBody = table.Column<string>(type: "TEXT", nullable: true),
                    ErrorMessage = table.Column<string>(type: "TEXT", nullable: true),
                    RequestBodyRaw = table.Column<byte[]>(type: "BLOB", nullable: true),
                    ResponseBodyRaw = table.Column<byte[]>(type: "BLOB", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestTracePayload", x => x.LogId);
                    table.ForeignKey(
                        name: "FK_RequestTracePayload_RequestTrace",
                        column: x => x.LogId,
                        principalTable: "RequestTrace",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BalanceTransaction",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TransactionTypeId = table.Column<byte>(type: "INTEGER", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(14, 8)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreditUserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BalanceLog2", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BalanceTransaction_CreditUserId",
                        column: x => x.CreditUserId,
                        principalTable: "User",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_BalanceTransaction_UserId",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ChatGroup",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    IsExpanded = table.Column<bool>(type: "INTEGER", nullable: false),
                    Rank = table.Column<short>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatGroup", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatGroup_User",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ChatPreset",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Order = table.Column<short>(type: "INTEGER", nullable: false)
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
                name: "McpServer",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Label = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Url = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    Headers = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    OwnerUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_McpServer", x => x.Id);
                    table.ForeignKey(
                        name: "FK_McpServer_User",
                        column: x => x.OwnerUserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Prompt",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Content = table.Column<string>(type: "TEXT", nullable: false),
                    Temperature = table.Column<float>(type: "REAL", nullable: true),
                    IsDefault = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsSystem = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreateUserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Prompt2", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Prompt_CreateUserId",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SmsRecord",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PhoneNumber = table.Column<string>(type: "TEXT", unicode: false, maxLength: 20, nullable: false),
                    TypeId = table.Column<byte>(type: "INTEGER", nullable: false),
                    StatusId = table.Column<byte>(type: "INTEGER", nullable: false),
                    ExpectedCode = table.Column<string>(type: "TEXT", unicode: false, maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SmsHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SmsHistory_SmsStatus",
                        column: x => x.StatusId,
                        principalTable: "SmsStatus",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SmsHistory_SmsType",
                        column: x => x.TypeId,
                        principalTable: "SmsType",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SmsRecord_UserId",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserApiKey",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Key = table.Column<string>(type: "TEXT", unicode: false, maxLength: 200, nullable: false),
                    IsRevoked = table.Column<bool>(type: "INTEGER", nullable: false),
                    Comment = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    AllowEnumerate = table.Column<bool>(type: "INTEGER", nullable: false),
                    AllowAllModels = table.Column<bool>(type: "INTEGER", nullable: false),
                    Expires = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserApiKey", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserApiKey_UserId",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserBalance",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Balance = table.Column<decimal>(type: "decimal(32, 16)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBalances2", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserBalance_UserId",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserConfig",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Key = table.Column<string>(type: "TEXT", unicode: false, maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserConfig", x => new { x.UserId, x.Key });
                    table.ForeignKey(
                        name: "FK_UserConfig_User",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserInvitation",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    InvitationCodeId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserInvitation_1", x => new { x.UserId, x.InvitationCodeId });
                    table.ForeignKey(
                        name: "FK_UserInvitation_InvitationCode",
                        column: x => x.InvitationCodeId,
                        principalTable: "InvitationCode",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserInvitation_Users",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "File",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FileName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    FileServiceId = table.Column<int>(type: "INTEGER", nullable: false),
                    StorageKey = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    Size = table.Column<int>(type: "INTEGER", nullable: false),
                    ClientInfoId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreateUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    MediaType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_File", x => x.Id);
                    table.ForeignKey(
                        name: "FK_File_ClientInfo",
                        column: x => x.ClientInfoId,
                        principalTable: "ClientInfo",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_File_FileService",
                        column: x => x.FileServiceId,
                        principalTable: "FileService",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_File_User",
                        column: x => x.CreateUserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KeycloakAttempt",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ClientInfoId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: true),
                    Provider = table.Column<string>(type: "TEXT", unicode: false, maxLength: 200, nullable: false),
                    Sub = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    IsSuccessful = table.Column<bool>(type: "INTEGER", nullable: false),
                    FailureReason = table.Column<string>(type: "TEXT", unicode: false, maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KeycloakAttempt", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KeycloakAttempt_ClientInfo",
                        column: x => x.ClientInfoId,
                        principalTable: "ClientInfo",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_KeycloakAttempt_User",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PasswordAttempt",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserName = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    ClientInfoId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: true),
                    IsSuccessful = table.Column<bool>(type: "INTEGER", nullable: false),
                    FailureReason = table.Column<string>(type: "TEXT", unicode: false, maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordAttempt", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PasswordAttempt_ClientInfo",
                        column: x => x.ClientInfoId,
                        principalTable: "ClientInfo",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PasswordAttempt_User",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ChatConfigSnapshot",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ModelSnapshotId = table.Column<int>(type: "INTEGER", nullable: false),
                    SystemPrompt = table.Column<string>(type: "TEXT", nullable: true),
                    Temperature = table.Column<float>(type: "REAL", nullable: true),
                    WebSearchEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    MaxOutputTokens = table.Column<int>(type: "INTEGER", nullable: true),
                    Effort = table.Column<string>(type: "TEXT", unicode: false, maxLength: 50, nullable: true),
                    CodeExecutionEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    ImageSize = table.Column<string>(type: "TEXT", maxLength: 40, nullable: true),
                    ThinkingBudget = table.Column<int>(type: "INTEGER", nullable: true),
                    EnabledMcpNames = table.Column<string>(type: "TEXT", nullable: true),
                    HashCode = table.Column<long>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Format = table.Column<string>(type: "TEXT", unicode: false, maxLength: 20, nullable: true),
                    Compression = table.Column<byte>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatConfigSnapshot", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatConfigSnapshot_ModelSnapshot",
                        column: x => x.ModelSnapshotId,
                        principalTable: "ModelSnapshot",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Model",
                columns: table => new
                {
                    Id = table.Column<short>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Order = table.Column<short>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CurrentSnapshotId = table.Column<int>(type: "INTEGER", nullable: false),
                    Enabled = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Model", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Model_CurrentSnapshot",
                        column: x => x.CurrentSnapshotId,
                        principalTable: "ModelSnapshot",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UsageTransaction",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TransactionTypeId = table.Column<byte>(type: "INTEGER", nullable: false),
                    TokenAmount = table.Column<int>(type: "INTEGER", nullable: false),
                    CountAmount = table.Column<int>(type: "INTEGER", nullable: false),
                    CreditUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ModelSnapshotId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsageTransaction", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UsageTransaction_ModelSnapshot",
                        column: x => x.ModelSnapshotId,
                        principalTable: "ModelSnapshot",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UsageTransaction_User",
                        column: x => x.CreditUserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "McpTool",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    McpServerId = table.Column<int>(type: "INTEGER", nullable: false),
                    ToolName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    Parameters = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_McpTool", x => x.Id);
                    table.ForeignKey(
                        name: "FK_McpTool_McpServer",
                        column: x => x.McpServerId,
                        principalTable: "McpServer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserMcp",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    McpServerId = table.Column<int>(type: "INTEGER", nullable: false),
                    CustomHeaders = table.Column<string>(type: "TEXT", nullable: true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserMcp", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserMcp_McpServer",
                        column: x => x.McpServerId,
                        principalTable: "McpServer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserMcp_User",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SmsAttempt",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SmsRecordId = table.Column<int>(type: "INTEGER", nullable: false),
                    Code = table.Column<string>(type: "TEXT", unicode: false, maxLength: 10, nullable: false),
                    ClientInfoId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SmsAttempt", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SmsAttempt_ClientInfo",
                        column: x => x.ClientInfoId,
                        principalTable: "ClientInfo",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SmsAttempt_SmsHistory",
                        column: x => x.SmsRecordId,
                        principalTable: "SmsRecord",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FileImageInfo",
                columns: table => new
                {
                    FileId = table.Column<int>(type: "INTEGER", nullable: false),
                    Width = table.Column<int>(type: "INTEGER", nullable: false),
                    Height = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileImageInfo", x => x.FileId);
                    table.ForeignKey(
                        name: "FK_FileImageInfo_File",
                        column: x => x.FileId,
                        principalTable: "File",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatConfig",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ModelId = table.Column<short>(type: "INTEGER", nullable: false),
                    SystemPrompt = table.Column<string>(type: "TEXT", nullable: true),
                    Temperature = table.Column<float>(type: "REAL", nullable: true),
                    WebSearchEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    MaxOutputTokens = table.Column<int>(type: "INTEGER", nullable: true),
                    Effort = table.Column<string>(type: "TEXT", unicode: false, maxLength: 50, nullable: true),
                    CodeExecutionEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    ImageSize = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    ThinkingBudget = table.Column<int>(type: "INTEGER", nullable: true),
                    Format = table.Column<string>(type: "TEXT", unicode: false, maxLength: 20, nullable: true),
                    Compression = table.Column<byte>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatConfig", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatConfig_Model",
                        column: x => x.ModelId,
                        principalTable: "Model",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserApiCache",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserApiKeyId = table.Column<int>(type: "INTEGER", nullable: false),
                    ModelId = table.Column<short>(type: "INTEGER", nullable: false),
                    RequestHashCode = table.Column<long>(type: "INTEGER", nullable: false),
                    Expires = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ClientInfoId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserApiCache", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserApiCache_ClientInfoId",
                        column: x => x.ClientInfoId,
                        principalTable: "ClientInfo",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserApiCache_ModelId",
                        column: x => x.ModelId,
                        principalTable: "Model",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserApiCache_UserApiKeyId",
                        column: x => x.UserApiKeyId,
                        principalTable: "UserApiKey",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserApiModel",
                columns: table => new
                {
                    ApiKeyId = table.Column<int>(type: "INTEGER", nullable: false),
                    ModelId = table.Column<short>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApiKeyModel2", x => new { x.ApiKeyId, x.ModelId });
                    table.ForeignKey(
                        name: "FK_ApiKeyModel2_ApiKey",
                        column: x => x.ApiKeyId,
                        principalTable: "UserApiKey",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ApiKeyModel2_Model",
                        column: x => x.ModelId,
                        principalTable: "Model",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserModel",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ModelId = table.Column<short>(type: "INTEGER", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TokenBalance = table.Column<int>(type: "INTEGER", nullable: false),
                    CountBalance = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserModel2", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserModel2_Model",
                        column: x => x.ModelId,
                        principalTable: "Model",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserModel_UserId",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserModelUsage",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FinishReasonId = table.Column<byte>(type: "INTEGER", nullable: false),
                    SegmentCount = table.Column<short>(type: "INTEGER", nullable: false),
                    InputFreshTokens = table.Column<int>(type: "INTEGER", nullable: false),
                    OutputTokens = table.Column<int>(type: "INTEGER", nullable: false),
                    ReasoningTokens = table.Column<int>(type: "INTEGER", nullable: false),
                    IsUsageReliable = table.Column<bool>(type: "INTEGER", nullable: false),
                    PreprocessDurationMs = table.Column<int>(type: "INTEGER", nullable: false),
                    ReasoningDurationMs = table.Column<int>(type: "INTEGER", nullable: false),
                    FirstResponseDurationMs = table.Column<int>(type: "INTEGER", nullable: false),
                    PostprocessDurationMs = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalDurationMs = table.Column<int>(type: "INTEGER", nullable: false),
                    InputFreshCost = table.Column<decimal>(type: "decimal(14, 8)", nullable: false),
                    OutputCost = table.Column<decimal>(type: "decimal(14, 8)", nullable: false),
                    BalanceTransactionId = table.Column<long>(type: "INTEGER", nullable: true),
                    UsageTransactionId = table.Column<long>(type: "INTEGER", nullable: true),
                    ClientInfoId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    InputCachedTokens = table.Column<int>(type: "INTEGER", nullable: false),
                    InputCachedCost = table.Column<decimal>(type: "decimal(14, 8)", nullable: false),
                    SourceId = table.Column<byte>(type: "INTEGER", nullable: false),
                    ModelSnapshotId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModelUsage", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModelUsage_ClientInfo",
                        column: x => x.ClientInfoId,
                        principalTable: "ClientInfo",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ModelUsage_TransactionLog",
                        column: x => x.BalanceTransactionId,
                        principalTable: "BalanceTransaction",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ModelUsage_UsageTransactionLog",
                        column: x => x.UsageTransactionId,
                        principalTable: "UsageTransaction",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserModelUsage_FinishReason",
                        column: x => x.FinishReasonId,
                        principalTable: "FinishReason",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserModelUsage_ModelSnapshot",
                        column: x => x.ModelSnapshotId,
                        principalTable: "ModelSnapshot",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserModelUsage_User",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ChatConfigMcp",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ChatConfigId = table.Column<int>(type: "INTEGER", nullable: false),
                    McpServerId = table.Column<int>(type: "INTEGER", nullable: false),
                    CustomHeaders = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatConfigMcp", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatConfigMcp_ChatConfig",
                        column: x => x.ChatConfigId,
                        principalTable: "ChatConfig",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatConfigMcp_McpServer",
                        column: x => x.McpServerId,
                        principalTable: "McpServer",
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

            migrationBuilder.CreateTable(
                name: "UserApiCacheBody",
                columns: table => new
                {
                    UserApiCacheId = table.Column<int>(type: "INTEGER", nullable: false),
                    Request = table.Column<string>(type: "TEXT", nullable: false),
                    Response = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserApiCacheBody", x => x.UserApiCacheId);
                    table.ForeignKey(
                        name: "FK_UserApiCacheBody_Id",
                        column: x => x.UserApiCacheId,
                        principalTable: "UserApiCache",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserApiCacheUsage",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserApiCacheId = table.Column<int>(type: "INTEGER", nullable: false),
                    ClientInfoId = table.Column<int>(type: "INTEGER", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserApiCacheUsage", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserApiCacheUsage_ClientInfoId",
                        column: x => x.ClientInfoId,
                        principalTable: "ClientInfo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserApiCacheUsage_UserApiCacheId",
                        column: x => x.UserApiCacheId,
                        principalTable: "UserApiCache",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserApiUsage",
                columns: table => new
                {
                    ApiKeyId = table.Column<int>(type: "INTEGER", nullable: false),
                    UsageId = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserApiUsage", x => new { x.ApiKeyId, x.UsageId });
                    table.ForeignKey(
                        name: "FK_ApiUsage2_ApiKey",
                        column: x => x.ApiKeyId,
                        principalTable: "UserApiKey",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserApiUsage_UserModelUsage",
                        column: x => x.UsageId,
                        principalTable: "UserModelUsage",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Chat",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    ChatGroupId = table.Column<int>(type: "INTEGER", nullable: true),
                    Title = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    IsArchived = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsTopMost = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsTemp = table.Column<bool>(type: "INTEGER", nullable: false),
                    LeafTurnId = table.Column<long>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chat", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Chat_ChatGroup",
                        column: x => x.ChatGroupId,
                        principalTable: "ChatGroup",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Chat_UserId",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ChatShare",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ChatId = table.Column<int>(type: "INTEGER", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    SnapshotTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatShare", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatShare_Chat",
                        column: x => x.ChatId,
                        principalTable: "Chat",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatSpan",
                columns: table => new
                {
                    ChatId = table.Column<int>(type: "INTEGER", nullable: false),
                    SpanId = table.Column<byte>(type: "INTEGER", nullable: false),
                    Enabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    ChatConfigId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatSpan", x => new { x.ChatId, x.SpanId });
                    table.ForeignKey(
                        name: "FK_ChatSpan_Chat",
                        column: x => x.ChatId,
                        principalTable: "Chat",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatSpan_ChatConfig",
                        column: x => x.ChatConfigId,
                        principalTable: "ChatConfig",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ChatTagChat",
                columns: table => new
                {
                    ChatId = table.Column<int>(type: "INTEGER", nullable: false),
                    ChatTagId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatTagChat", x => new { x.ChatId, x.ChatTagId });
                    table.ForeignKey(
                        name: "FK_ChatTagChat_Chat",
                        column: x => x.ChatId,
                        principalTable: "Chat",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatTagChat_ChatTag",
                        column: x => x.ChatTagId,
                        principalTable: "ChatTag",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ChatTurn",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ChatId = table.Column<int>(type: "INTEGER", nullable: false),
                    SpanId = table.Column<byte>(type: "INTEGER", nullable: true),
                    ParentId = table.Column<long>(type: "INTEGER", nullable: true),
                    IsUser = table.Column<bool>(type: "INTEGER", nullable: false),
                    ReactionId = table.Column<bool>(type: "INTEGER", nullable: true),
                    ChatConfigSnapshotId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Message", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatTurn_ChatConfigSnapshot",
                        column: x => x.ChatConfigSnapshotId,
                        principalTable: "ChatConfigSnapshot",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Message_Chat",
                        column: x => x.ChatId,
                        principalTable: "Chat",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Message_ParentMessage",
                        column: x => x.ParentId,
                        principalTable: "ChatTurn",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ChatDockerSession",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    OwnerTurnId = table.Column<long>(type: "INTEGER", nullable: true),
                    Label = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    ContainerId = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    Image = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    MemoryBytes = table.Column<long>(type: "INTEGER", nullable: true),
                    CpuCores = table.Column<float>(type: "REAL", nullable: true),
                    MaxProcesses = table.Column<short>(type: "INTEGER", nullable: true),
                    NetworkMode = table.Column<byte>(type: "INTEGER", nullable: false),
                    TerminatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastActiveAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ShellPrefix = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    Ip = table.Column<string>(type: "TEXT", maxLength: 45, nullable: true),
                    OwnerChatId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatDockerSession", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatDockerSession_Chat",
                        column: x => x.OwnerChatId,
                        principalTable: "Chat",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ChatDockerSession_ChatTurn",
                        column: x => x.OwnerTurnId,
                        principalTable: "ChatTurn",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Step",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TurnId = table.Column<long>(type: "INTEGER", nullable: false),
                    ChatRoleId = table.Column<byte>(type: "INTEGER", nullable: false),
                    Edited = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UsageId = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Step", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Step_Turn",
                        column: x => x.TurnId,
                        principalTable: "ChatTurn",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Step_Usage",
                        column: x => x.UsageId,
                        principalTable: "UserModelUsage",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "StepContent",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ContentTypeId = table.Column<byte>(type: "INTEGER", nullable: false),
                    StepId = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageContent2", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StepContent_Step",
                        column: x => x.StepId,
                        principalTable: "Step",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StepContentBlob",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    Content = table.Column<byte[]>(type: "BLOB", nullable: false),
                    MediaType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    FileName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageContentBlob", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MessageContentBlob_MessageContent",
                        column: x => x.Id,
                        principalTable: "StepContent",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StepContentFile",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    FileId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageContentFile", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MessageContentFile_File",
                        column: x => x.FileId,
                        principalTable: "File",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MessageContentFile_MessageContent",
                        column: x => x.Id,
                        principalTable: "StepContent",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StepContentText",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    Content = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageContentText", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MessageContentUTF16_MessageContent",
                        column: x => x.Id,
                        principalTable: "StepContent",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StepContentThink",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    Content = table.Column<string>(type: "TEXT", nullable: false),
                    Signature = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StepContentThink", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StepContentThink_StepContent",
                        column: x => x.Id,
                        principalTable: "StepContent",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StepContentToolCall",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    ToolCallId = table.Column<string>(type: "TEXT", unicode: false, maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Parameters = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageContentToolCall", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MessageContentToolCall_MessageContent",
                        column: x => x.Id,
                        principalTable: "StepContent",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StepContentToolCallResponse",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    ToolCallId = table.Column<string>(type: "TEXT", unicode: false, maxLength: 100, nullable: false),
                    IsSuccess = table.Column<bool>(type: "INTEGER", nullable: false),
                    Response = table.Column<string>(type: "TEXT", nullable: false),
                    DurationMs = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageContentToolCallResponse", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MessageContentToolCallResponse_MessageContent",
                        column: x => x.Id,
                        principalTable: "StepContent",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BalanceTransaction_CreditUserId",
                table: "BalanceTransaction",
                column: "CreditUserId");

            migrationBuilder.CreateIndex(
                name: "IX_BalanceTransaction_UserId",
                table: "BalanceTransaction",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Chat_ChatGroupId",
                table: "Chat",
                column: "ChatGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Chat_LeafTurnId",
                table: "Chat",
                column: "LeafTurnId");

            migrationBuilder.CreateIndex(
                name: "IX_Chat_UpdatedAt",
                table: "Chat",
                columns: new[] { "IsTopMost", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Chat_UserId",
                table: "Chat",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatConfig_ModelId",
                table: "ChatConfig",
                column: "ModelId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatConfigMcp_ChatConfigId",
                table: "ChatConfigMcp",
                column: "ChatConfigId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatConfigMcp_McpServerId",
                table: "ChatConfigMcp",
                column: "McpServerId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatConfigSnapshot_HashCode",
                table: "ChatConfigSnapshot",
                column: "HashCode");

            migrationBuilder.CreateIndex(
                name: "IX_ChatConfigSnapshot_ModelSnapshotId",
                table: "ChatConfigSnapshot",
                column: "ModelSnapshotId");

            migrationBuilder.CreateIndex(
                name: "UX_ChatConfigSnapshot_ModelSnapshotId_HashCode",
                table: "ChatConfigSnapshot",
                columns: new[] { "ModelSnapshotId", "HashCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatDockerSession_Active_ExpiresAt",
                table: "ChatDockerSession",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_ChatDockerSession_OwnerChatId",
                table: "ChatDockerSession",
                column: "OwnerChatId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatDockerSession_OwnerTurnId",
                table: "ChatDockerSession",
                column: "OwnerTurnId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatGroup_UserId",
                table: "ChatGroup",
                columns: new[] { "UserId", "Rank" });

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

            migrationBuilder.CreateIndex(
                name: "IX_ChatShare_Chat",
                table: "ChatShare",
                column: "ChatId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatSpan_ChatConfigId",
                table: "ChatSpan",
                column: "ChatConfigId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatTag_Name",
                table: "ChatTag",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatTagChat_ChatTagId",
                table: "ChatTagChat",
                column: "ChatTagId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatTurn_ChatConfigSnapshotId",
                table: "ChatTurn",
                column: "ChatConfigSnapshotId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatTurn_ParentId",
                table: "ChatTurn",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_Message_ChatSpan",
                table: "ChatTurn",
                columns: new[] { "ChatId", "SpanId" });

            migrationBuilder.CreateIndex(
                name: "IX_ClientInfo",
                table: "ClientInfo",
                columns: new[] { "ClientIpId", "ClientUserAgentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClientInfo_ClientUserAgentId",
                table: "ClientInfo",
                column: "ClientUserAgentId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientIP_IPAddress",
                table: "ClientIP",
                column: "IPAddress",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClientUserAgent",
                table: "ClientUserAgent",
                column: "UserAgent",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "Configs_key_key",
                table: "Config",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_File_ClientInfo",
                table: "File",
                column: "ClientInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_File_CreateUser",
                table: "File",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_File_StorageKey",
                table: "File",
                columns: new[] { "FileServiceId", "StorageKey" });

            migrationBuilder.CreateIndex(
                name: "InvitationCode2_value_key",
                table: "InvitationCode",
                column: "Value",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KeycloakAttempt_ClientInfo",
                table: "KeycloakAttempt",
                column: "ClientInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_KeycloakAttempt_CreatedAt",
                table: "KeycloakAttempt",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_KeycloakAttempt_UserId",
                table: "KeycloakAttempt",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_McpServer_OwnerUserId",
                table: "McpServer",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "UX_McpServer_Label",
                table: "McpServer",
                column: "Label",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_McpTool_Server_Name",
                table: "McpTool",
                columns: new[] { "McpServerId", "ToolName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_Model_CurrentSnapshotId",
                table: "Model",
                column: "CurrentSnapshotId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_ModelKey_CurrentSnapshotId",
                table: "ModelKey",
                column: "CurrentSnapshotId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ModelKeySnapshot_ModelKeyId",
                table: "ModelKeySnapshot",
                column: "ModelKeyId");

            migrationBuilder.CreateIndex(
                name: "IX_ModelProviderOrder_Order",
                table: "ModelProviderOrder",
                column: "Order");

            migrationBuilder.CreateIndex(
                name: "IX_ModelSnapshot_ModelId",
                table: "ModelSnapshot",
                column: "ModelId");

            migrationBuilder.CreateIndex(
                name: "IX_ModelSnapshot_ModelKeyId",
                table: "ModelSnapshot",
                column: "ModelKeyId");

            migrationBuilder.CreateIndex(
                name: "IX_ModelSnapshot_ModelKeySnapshotId",
                table: "ModelSnapshot",
                column: "ModelKeySnapshotId");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordAttempt_ClientInfo",
                table: "PasswordAttempt",
                column: "ClientInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordAttempt_CreatedAt",
                table: "PasswordAttempt",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordAttempt_UserId",
                table: "PasswordAttempt",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Prompt_CreateUserId",
                table: "Prompt",
                column: "CreateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Prompt2_Name",
                table: "Prompt",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_RequestTrace_ScheduledDeleteAt_NotNull",
                table: "RequestTrace",
                column: "ScheduledDeleteAt");

            migrationBuilder.CreateIndex(
                name: "IX_RequestTrace_StartedAt",
                table: "RequestTrace",
                column: "StartedAt");

            migrationBuilder.CreateIndex(
                name: "IX_RequestTrace_TraceId",
                table: "RequestTrace",
                column: "TraceId");

            migrationBuilder.CreateIndex(
                name: "IX_RequestTrace_UserId",
                table: "RequestTrace",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SmsAttempt",
                table: "SmsAttempt",
                column: "ClientInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_SmsAttempt_CreatedAt",
                table: "SmsAttempt",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SmsAttempt_SmsHistoryId",
                table: "SmsAttempt",
                column: "SmsRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_SmsHistory_PhoneNumber",
                table: "SmsRecord",
                column: "PhoneNumber");

            migrationBuilder.CreateIndex(
                name: "IX_SmsRecord_StatusId",
                table: "SmsRecord",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_SmsRecord_TypeId",
                table: "SmsRecord",
                column: "TypeId");

            migrationBuilder.CreateIndex(
                name: "IX_SmsRecord_UserId",
                table: "SmsRecord",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Step_TurnId",
                table: "Step",
                columns: new[] { "TurnId", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_Step_UsageId",
                table: "Step",
                column: "UsageId");

            migrationBuilder.CreateIndex(
                name: "IX_StepContent_StepId",
                table: "StepContent",
                column: "StepId");

            migrationBuilder.CreateIndex(
                name: "IX_MessageContentFile_FileId",
                table: "StepContentFile",
                column: "FileId");

            migrationBuilder.CreateIndex(
                name: "IX_UsageTransaction_CreditUser",
                table: "UsageTransaction",
                column: "CreditUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UsageTransaction_ModelSnapshotId",
                table: "UsageTransaction",
                column: "ModelSnapshotId");

            migrationBuilder.CreateIndex(
                name: "IX_UserApiCache_ClientInfoId",
                table: "UserApiCache",
                column: "ClientInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_UserApiCache_CreatedAt",
                table: "UserApiCache",
                column: "Expires");

            migrationBuilder.CreateIndex(
                name: "IX_UserApiCache_ModelId",
                table: "UserApiCache",
                column: "ModelId");

            migrationBuilder.CreateIndex(
                name: "IX_UserApiCache_RequestHashCode",
                table: "UserApiCache",
                column: "RequestHashCode");

            migrationBuilder.CreateIndex(
                name: "IX_UserApiCache_UserApiKeyId",
                table: "UserApiCache",
                column: "UserApiKeyId");

            migrationBuilder.CreateIndex(
                name: "IX_UserApiCacheUsage_ClientInfoId",
                table: "UserApiCacheUsage",
                column: "ClientInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_UserApiCacheUsage_UserApiCacheId",
                table: "UserApiCacheUsage",
                column: "UserApiCacheId");

            migrationBuilder.CreateIndex(
                name: "IX_UserApiKey_Key",
                table: "UserApiKey",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserApiKey_UserId",
                table: "UserApiKey",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserApiModel_ModelId",
                table: "UserApiModel",
                column: "ModelId");

            migrationBuilder.CreateIndex(
                name: "IX_UserApiUsage_UsageId",
                table: "UserApiUsage",
                column: "UsageId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UserBalances_userId_key",
                table: "UserBalance",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserInitialConfig_InvitationCodeId",
                table: "UserInitialConfig",
                column: "InvitationCodeId");

            migrationBuilder.CreateIndex(
                name: "IX_UserInvitation_InvitationCodeId",
                table: "UserInvitation",
                column: "InvitationCodeId");

            migrationBuilder.CreateIndex(
                name: "IX_UserMcp_McpServerId",
                table: "UserMcp",
                column: "McpServerId");

            migrationBuilder.CreateIndex(
                name: "UX_UserMcp_User_Server",
                table: "UserMcp",
                columns: new[] { "UserId", "McpServerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserModel_UserId",
                table: "UserModel",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserModel2_ModelId",
                table: "UserModel",
                column: "ModelId");

            migrationBuilder.CreateIndex(
                name: "IX_ModelUsage_BalanceTransaction",
                table: "UserModelUsage",
                column: "BalanceTransactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ModelUsage_CreatedAt",
                table: "UserModelUsage",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ModelUsage_UsageTransaction",
                table: "UserModelUsage",
                column: "UsageTransactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserModelUsage_ClientInfoId",
                table: "UserModelUsage",
                column: "ClientInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_UserModelUsage_FinishReasonId",
                table: "UserModelUsage",
                column: "FinishReasonId");

            migrationBuilder.CreateIndex(
                name: "IX_UserModelUsage_ModelSnapshotId",
                table: "UserModelUsage",
                column: "ModelSnapshotId");

            migrationBuilder.CreateIndex(
                name: "IX_UserModelUsage_UserId",
                table: "UserModelUsage",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Chat_Message",
                table: "Chat",
                column: "LeafTurnId",
                principalTable: "ChatTurn",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Chat_UserId",
                table: "Chat");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatGroup_User",
                table: "ChatGroup");

            migrationBuilder.DropForeignKey(
                name: "FK_Chat_ChatGroup",
                table: "Chat");

            migrationBuilder.DropForeignKey(
                name: "FK_Chat_Message",
                table: "Chat");

            migrationBuilder.DropTable(
                name: "ChatConfigMcp");

            migrationBuilder.DropTable(
                name: "ChatDockerSession");

            migrationBuilder.DropTable(
                name: "ChatPresetSpan");

            migrationBuilder.DropTable(
                name: "ChatShare");

            migrationBuilder.DropTable(
                name: "ChatSpan");

            migrationBuilder.DropTable(
                name: "ChatTagChat");

            migrationBuilder.DropTable(
                name: "Config");

            migrationBuilder.DropTable(
                name: "FileImageInfo");

            migrationBuilder.DropTable(
                name: "KeycloakAttempt");

            migrationBuilder.DropTable(
                name: "LoginService");

            migrationBuilder.DropTable(
                name: "McpTool");

            migrationBuilder.DropTable(
                name: "ModelKey");

            migrationBuilder.DropTable(
                name: "ModelProviderOrder");

            migrationBuilder.DropTable(
                name: "PasswordAttempt");

            migrationBuilder.DropTable(
                name: "Prompt");

            migrationBuilder.DropTable(
                name: "RequestTracePayload");

            migrationBuilder.DropTable(
                name: "SmsAttempt");

            migrationBuilder.DropTable(
                name: "StepContentBlob");

            migrationBuilder.DropTable(
                name: "StepContentFile");

            migrationBuilder.DropTable(
                name: "StepContentText");

            migrationBuilder.DropTable(
                name: "StepContentThink");

            migrationBuilder.DropTable(
                name: "StepContentToolCall");

            migrationBuilder.DropTable(
                name: "StepContentToolCallResponse");

            migrationBuilder.DropTable(
                name: "UserApiCacheBody");

            migrationBuilder.DropTable(
                name: "UserApiCacheUsage");

            migrationBuilder.DropTable(
                name: "UserApiModel");

            migrationBuilder.DropTable(
                name: "UserApiUsage");

            migrationBuilder.DropTable(
                name: "UserBalance");

            migrationBuilder.DropTable(
                name: "UserConfig");

            migrationBuilder.DropTable(
                name: "UserInitialConfig");

            migrationBuilder.DropTable(
                name: "UserInvitation");

            migrationBuilder.DropTable(
                name: "UserMcp");

            migrationBuilder.DropTable(
                name: "UserModel");

            migrationBuilder.DropTable(
                name: "ChatPreset");

            migrationBuilder.DropTable(
                name: "ChatConfig");

            migrationBuilder.DropTable(
                name: "ChatTag");

            migrationBuilder.DropTable(
                name: "RequestTrace");

            migrationBuilder.DropTable(
                name: "SmsRecord");

            migrationBuilder.DropTable(
                name: "File");

            migrationBuilder.DropTable(
                name: "StepContent");

            migrationBuilder.DropTable(
                name: "UserApiCache");

            migrationBuilder.DropTable(
                name: "InvitationCode");

            migrationBuilder.DropTable(
                name: "McpServer");

            migrationBuilder.DropTable(
                name: "SmsStatus");

            migrationBuilder.DropTable(
                name: "SmsType");

            migrationBuilder.DropTable(
                name: "FileService");

            migrationBuilder.DropTable(
                name: "Step");

            migrationBuilder.DropTable(
                name: "Model");

            migrationBuilder.DropTable(
                name: "UserApiKey");

            migrationBuilder.DropTable(
                name: "UserModelUsage");

            migrationBuilder.DropTable(
                name: "ClientInfo");

            migrationBuilder.DropTable(
                name: "BalanceTransaction");

            migrationBuilder.DropTable(
                name: "UsageTransaction");

            migrationBuilder.DropTable(
                name: "FinishReason");

            migrationBuilder.DropTable(
                name: "ClientIP");

            migrationBuilder.DropTable(
                name: "ClientUserAgent");

            migrationBuilder.DropTable(
                name: "User");

            migrationBuilder.DropTable(
                name: "ChatGroup");

            migrationBuilder.DropTable(
                name: "ChatTurn");

            migrationBuilder.DropTable(
                name: "ChatConfigSnapshot");

            migrationBuilder.DropTable(
                name: "Chat");

            migrationBuilder.DropTable(
                name: "ModelSnapshot");

            migrationBuilder.DropTable(
                name: "ModelKeySnapshot");
        }
    }
}
