# DataMigration

基于 flu-cli 脚手架的 .NET 10 控制台应用：依赖注入、YAML 配置、日志、可选 EF Core，用法接近 Web 应用。

## 要求

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Task](https://taskfile.dev/)（可选，用来跑 `Taskfile.yml` 里的命令）

## 快速开始

```bash
task
# 或
dotnet run
```

常用任务：`task --list`、`task build`、`task run`、`task watch`、`task publish`。

入口在 `src/Program.cs`：

```csharp
var builder = FluentConsoleApp.CreateBuilder(args);
var app = builder.Build();
await app.Run<MainService>();
```

## 目录结构

```
DataMigration
├─ src
│  ├─ Utilities      通用工具、JSON 源生成上下文
│  ├─ Services       业务逻辑（实现 IService 会自动注册）
│  ├─ Framework      宿主核心，一般不要改
│  ├─ Entities       强类型配置、输出对象
│  ├─ Data           EF Core 实体、Fluent 配置、DbContext（可选）
│  └─ Program.cs
├─ appsettings.yaml
├─ .env
├─ Dockerfile
├─ Taskfile.yml      常用命令（build / run / ef / docker）
├─ AGENTS.md         给 AI Agent 的项目约定
└─ DataMigration.csproj
```

## 添加业务

1. 在 `src/Services` 新建类，实现 `IService`（`Task<Result> Run()`）。
2. 需要作为入口时，在 `Program.cs` 调用 `await app.Run<YourService>()`。
3. 不必手动 `AddScoped`：实现了 `IService` 的非抽象类会被扫描并按 Scoped 注册。

## 配置

- `appsettings.yaml`：应用配置（含 `AppSettings`、`Logging`、连接字符串）。
- `.env`：本地密钥和环境变量。
- 两者都从程序输出目录加载（`AppContext.BaseDirectory`），csproj 里已设置为复制到输出目录。
- 强类型绑定：`src/Entities/AppSettings.cs` ↔ YAML 中的 `AppSettings` 节。

## 可选：EF Core

默认关闭。在 `Program.cs` 的 `Build()` 之后加上：

```csharp
app.AddDefaultEFCoreIntegration();
```

默认 SQLite，连接字符串在 `appsettings.yaml` 的 `ConnectionStrings:SQLite`。

```bash
task ef:tools
task ef:migrate
task ef:migrate NAME=AddSomething
task ef:update
```

实体放 `src/Data/Models`，表结构用 Fluent 配置写在 `src/Data/Config`。换数据库时改 `Program.cs` 里的 `AddDbContext`，并同步 `AppDesignTimeDbContextFactory`。

## Docker

```bash
task docker:build
task docker:run
```
