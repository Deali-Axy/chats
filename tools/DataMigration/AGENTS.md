# AGENTS.md

给编码 Agent 的项目约定。人类说明见 `README.md`，不要把两份文档的内容互相复制。

## 这是什么

.NET 10 控制台应用。宿主是自研 mini host（`FluentConsoleApp` / `FluentConsoleBuilder`），**不是** `Microsoft.Extensions.Hosting`，也不是 ASP.NET。

目标框架 `net10.0`，nullable 与 implicit usings 已开启。

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
| 业务逻辑 | `src/Services`，实现 `IService`（`Task<Result> Run()`） |
| 强类型配置 | `src/Entities/AppSettings.cs`，对应 `appsettings.yaml` 的 `AppSettings` |
| JSON DTO | `src/Entities`，并在 `SourceGenerationContext` 注册 |
| EF 实体 | `src/Data/Models` |
| EF Fluent 配置 | `src/Data/Config` |
| 工具方法 | `src/Utilities` |

实现了 `IService` 的非抽象类会被自动 **Scoped** 注册。不要在 `Program.cs` 里再 `AddScoped<T>()`。

入口保持：`CreateBuilder` → `Build` → `Run<T>()`。换入口只改 `Run<T>` 的类型参数。

启用数据库时在 `Build()` 之后调用 `app.AddDefaultEFCoreIntegration()`。不要再注册一份默认 `AppDbContext`，除非用户要换数据库。

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
- EF：默认 SQLite + snake_case 命名，按需开启

## 不要提交

`bin/`、`obj/`、`logs/`、`*.db`、运行产物 `output.json`
