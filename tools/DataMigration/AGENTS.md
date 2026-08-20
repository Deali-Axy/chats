# AGENTS.md

给编码 Agent 的项目约定。人类说明见 `README.md`，不要把两份文档的内容互相复制。

## 这是什么

仓库内的一次性 / 可扩展 SQLite ETL 控制台。宿主是自研 mini host（`FluentConsoleApp` / `FluentConsoleBuilder`），**不是** `Microsoft.Extensions.Hosting`，也不是 ASP.NET。

目标框架 `net10.0`，nullable 与 implicit usings 已开启。

当前入口是 `EtlService`：用 Chats.BE 的 EF migrations 建一份空的 1.15 库，再把生产 1.11 结构的 SQLite 灌进去。不要用模板自带的 snake_case `AppDbContext` 碰 `Chats.DB` 表。

## 命令

优先用根目录 `Taskfile.yml`（需要 [Task](https://taskfile.dev/)）：

```bash
task --list
task build
task run
task watch
task publish
task docker:build
task ef:tools
task ef:migrate NAME=InitialCreate
task ef:update
```

没有 Task 时的等价命令：

```bash
dotnet build
dotnet run
dotnet ef migrations add InitialCreate -o .\src\Data\Migrations
dotnet ef database update
```

## 改哪里

| 要做的事 | 放这里 |
|---|---|
| 入口 / 调度 | `src/Services/EtlService.cs`（实现 `IService`） |
| 新的迁移 Job | `src/Jobs`，实现 `IEtlJob`，并在 `EtlService.CreateJob` 登记 |
| ATTACH / 同构表拷贝 / 序列 / FK 检查 | `src/Etl` |
| 路径与报告 | `src/Entities/EtlOptions.cs`、`EtlReport.cs`；YAML 节 `Etl` |
| JSON DTO | `src/Entities`，并在 `SourceGenerationContext` 注册 |

实现了 `IService` 的非抽象类会被自动 **Scoped** 注册。不要在 `Program.cs` 里再 `AddScoped<T>()`。

入口保持：`CreateBuilder` → `Build` → `Run<T>()`。换入口只改 `Run<T>` 的类型参数。

不要调用 `app.AddDefaultEFCoreIntegration()`。目标 schema 走 `EfSqliteSchema.RecreateAsync`（Chats.BE migrations）。源库只读 ATTACH，不要 in-place 改生产备份。

JSON 序列化走 `SourceGenerationContext`，不要改成无源生成的 `JsonSerializer.Serialize(obj)`。

## 不要改

- `src/Framework`：宿主启动、配置、日志、服务扫描。除非用户明确要求改脚手架。
- 配置基路径：必须是 `AppContext.BaseDirectory`。新增的 `appsettings.yaml` / `.env` 必须在 csproj 里 `CopyToOutputDirectory`。

## 技术栈约定

- 配置：YAML（`appsettings.yaml`）+ `.env`
- 日志：`ILogger<T>` + Serilog 文件 `logs/fluent-demo-logs.log`
- 返回值：`FluentResults.Result`
- HTTP：已引用 `Flurl.Http`
- 调试打印：Dumpify `.Dump()`
- EF：目标库使用 `Chats.DB` + Chats.BE migrations（Pascal 表名）。不要给生产/目标库开 snake_case

## 不要提交

`bin/`、`obj/`、`logs/`、`*.db`、运行产物 `output.json`
