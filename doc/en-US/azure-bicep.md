# Azure Container Apps Deployment

**English** | [简体中文](../zh-CN/azure-bicep.md)

To deploy Ayaka Chats to Azure Container Apps, first build and publish an image with `task deploy`, then create a container app and persistent storage in Azure.

Mount persistent storage for the SQLite file and point `ConnectionStrings__ChatsDB` to that volume, for example `Data Source=/data/chats.db`. Also configure `ENCRYPTION_PASSWORD`, `FE_URL`, and the required model-provider credentials.

After deployment, confirm container restarts preserve `/data/chats.db` and change the default administrator password after the first sign-in.
