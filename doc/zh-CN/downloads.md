# 发布与构建

[English](../en-US/downloads.md) | **简体中文**

Ayaka Chats 的源码、版本发布和问题反馈均在 [Deali-Axy/chats](https://github.com/Deali-Axy/chats) 维护。

## 从源码运行

请按[快速开始](./quick-start.md)安装依赖并运行 `task dev`。

## 构建部署镜像

```bash
task deploy
```

该命令调用 `scripts/build_push.py`，默认镜像名为 `ayaka-chats`。镜像仓库、命名空间和远程部署参数可通过环境变量配置；详情请阅读脚本顶部的 `DEFAULTS`。

本项目不提供其他项目的 Docker 镜像或二进制下载链接。
