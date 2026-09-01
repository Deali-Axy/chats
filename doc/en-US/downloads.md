# Releases and Builds

**English** | [简体中文](../zh-CN/downloads.md)

Ayaka Chats source code, releases, and issue tracking are maintained at [Deali-Axy/chats](https://github.com/Deali-Axy/chats).

## Run from source

Follow the [Quick Start](./quick-start.md) to install dependencies and run `task dev`.

## Build a deployment image

```bash
task deploy
```

This calls `scripts/build_push.py`; the default image name is `ayaka-chats`. Configure the registry, namespace, and remote deployment settings through environment variables; see `DEFAULTS` at the top of the script.

This project does not publish Docker images or binary download links for other projects.
