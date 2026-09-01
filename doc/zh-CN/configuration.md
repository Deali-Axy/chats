# 配置说明

[English](../en-US/configuration.md) | **简体中文**

Ayaka Chats 使用标准 .NET 配置优先级：命令行参数、环境变量、`appsettings.json`。

| 配置 | 默认值 | 说明 |
|---|---|---|
| `FE_URL` | `http://localhost:3001` | 前端地址，用于 CORS |
| `DBType` | `sqlite` | 仅接受 `sqlite` |
| `ConnectionStrings__ChatsDB` | `Data Source=./AppData/chats.db` | SQLite 数据库位置 |
| `ENCRYPTION_PASSWORD` | 示例值 | 生产环境必须替换为随机字符串 |
| `ASPNETCORE_URLS` | 应用默认值 | 后端监听地址 |
| `CodeInterpreter__DefaultImage` | 见 `appsettings.json` | 代码解释器容器镜像 |

示例：

```bash
export FE_URL=https://chat.example.com
export ConnectionStrings__ChatsDB='Data Source=/data/chats.db'
export ENCRYPTION_PASSWORD='replace-with-a-long-random-secret'
```

环境变量中的嵌套配置使用双下划线，例如 `ConnectionStrings__ChatsDB`。不要将密钥提交到仓库；本地开发建议使用 .NET user secrets。
