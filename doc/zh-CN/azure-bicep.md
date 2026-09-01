# Azure Container Apps 部署

[English](../en-US/azure-bicep.md) | **简体中文**

如需在 Azure Container Apps 部署 Ayaka Chats，请先使用 `task deploy` 构建并推送镜像，再在 Azure 中创建容器应用和持久化存储。

为 SQLite 文件配置持久卷，并将 `ConnectionStrings__ChatsDB` 指向卷内路径，例如 `Data Source=/data/chats.db`。同时配置 `ENCRYPTION_PASSWORD`、`FE_URL` 和必要的模型服务凭据。

部署后确认容器重启不会丢失 `/data/chats.db`，并在首次登录后修改默认管理员密码。
