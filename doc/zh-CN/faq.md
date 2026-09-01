# 常见问题

[English](../en-US/faq.md) | **简体中文**

## 如何修改端口？

通过 `ASPNETCORE_URLS` 或 `--urls` 指定监听地址：

```bash
ASPNETCORE_URLS=http://+:5000 dotnet run --project src/BE/web/Chats.BE.csproj
```

## 能否使用 SQL Server 或 PostgreSQL？

不能。Ayaka Chats 仅支持 SQLite。请将 `DBType` 保持为 `sqlite`，并使用 `ConnectionStrings__ChatsDB` 配置 SQLite 文件路径。

## 数据库如何升级？

本项目 1.12+ 的数据库会在后端启动时自动应用 EF Core migrations。1.11 及更早的 SQLite 数据库请使用 [`tools/DataMigration`](../../tools/DataMigration/README.md)。

## 忘记管理员密码怎么办？

请在操作前备份 `AppData/chats.db`，再通过数据库重置密码；若是可丢弃的全新实例，也可以删除数据库文件后重新初始化。

## 如何反馈问题？

请在 [Ayaka Chats Issues](https://github.com/Deali-Axy/chats/issues) 提交可复现步骤、版本号和必要的脱敏日志。
