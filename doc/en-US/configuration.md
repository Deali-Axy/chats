# Configuration

**English** | [简体中文](../zh-CN/configuration.md)

Ayaka Chats follows the standard .NET configuration precedence: command-line arguments, environment variables, then `appsettings.json`.

| Setting | Default | Purpose |
|---|---|---|
| `FE_URL` | `http://localhost:3001` | Frontend URL for CORS |
| `DBType` | `sqlite` | Only `sqlite` is accepted |
| `ConnectionStrings__ChatsDB` | `Data Source=./AppData/chats.db` | SQLite database location |
| `ENCRYPTION_PASSWORD` | Example value | Replace with a random value in production |
| `ASPNETCORE_URLS` | Application default | Backend listener address |
| `CodeInterpreter__DefaultImage` | See `appsettings.json` | Code Interpreter container image |

Example:

```bash
export FE_URL=https://chat.example.com
export ConnectionStrings__ChatsDB='Data Source=/data/chats.db'
export ENCRYPTION_PASSWORD='replace-with-a-long-random-secret'
```

Nested environment settings use double underscores, for example `ConnectionStrings__ChatsDB`. Never commit secrets; .NET user secrets are recommended for local development.
