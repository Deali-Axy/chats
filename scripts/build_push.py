#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本项目构建、打包、推送、部署脚本。

流程:
1. 发布后端到 dist
2. 构建前端并复制静态文件到 dist/wwwroot
3. 用 ASP.NET Core 10 runtime 镜像打包并推送
4. 生成 dist-docker/docker-compose.yaml 与 dist-docker/.env
5. 可选: SSH 到服务器更新 TAG 并重启 compose
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import threading
from pathlib import Path
from typing import Optional


# 默认配置
DEFAULTS = {
    "BACKEND_CSPROJ": "./src/BE/web/Chats.BE.csproj",
    "FRONTEND_DIR": "./src/FE",
    "DIST_DIR": "./dist",
    "DOCKERFILE": "./dist/Dockerfile",
    "IMAGE_NAME": "ayaka-chats",
    "CONTAINER_PORT": "8080",
    "EXPOSE_PORT": "5080",
    "PLATFORMS": "linux/amd64",
    "REGISTRIES": [
        {
            "TYPE": "private",  # dockerhub or private
            "URL": "ccr.ccs.tencentyun.com",
            "NAMESPACE": "deali",
            "IMAGE_NAME": "ayaka-chats",
        },
    ],
    "REMOTE_HOST": "deali.cn",
    "REMOTE_PROJECT_PATH": "/home/deali/projects/ayaka-chats2",
    "REMOTE_TAG_KEY": "APP_IMAGE_TAG",
    "ENABLED_DEPLOY": True,
    "ENABLE_DOCKER_PUSH": True,
}


class ProgressDisplay:
    def __init__(self):
        self.status_line = ""
        self.lock = threading.Lock()

    def set_status(self, status: str) -> None:
        with self.lock:
            sys.stdout.write("\r\033[K")
            self.status_line = status
            sys.stdout.write(self.status_line)
            sys.stdout.flush()

    def print_output(self, line: str) -> None:
        with self.lock:
            sys.stdout.write("\r\033[K")
            sys.stdout.write(line)
            sys.stdout.write(self.status_line)
            sys.stdout.flush()

    def finish_step(self, final_status: str) -> None:
        with self.lock:
            sys.stdout.write("\r\033[K")
            sys.stdout.write(final_status + "\n")
            sys.stdout.flush()
            self.status_line = ""


def get_config(key: str):
    return os.environ.get(key, DEFAULTS.get(key, ""))


def as_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def to_posix(path: Path) -> str:
    return path.as_posix()


def run_cmd(cmd: str, *, cwd: Optional[Path] = None, extra_env: Optional[dict[str, str]] = None) -> tuple[int, str, str]:
    print(f"执行命令: {cmd}")
    env = os.environ.copy()
    if extra_env:
        env.update(extra_env)

    completed = subprocess.run(
        cmd,
        shell=True,
        cwd=str(cwd) if cwd else None,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if completed.stdout:
        print(completed.stdout, end="")
    if completed.stderr:
        print(completed.stderr, end="", file=sys.stderr)
    if completed.returncode != 0:
        raise RuntimeError(f"命令执行失败({completed.returncode}): {cmd}")
    return completed.returncode, completed.stdout, completed.stderr


def get_version() -> str:
    try:
        _, tag, _ = run_cmd("git describe --tags --abbrev=0")
        tag = tag.strip()
        if tag:
            return tag
    except Exception:
        pass
    return "0.0.0-local"


def ensure_clean_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def build_backend(dist_dir: Path, version: str) -> None:
    csproj = Path(str(get_config("BACKEND_CSPROJ"))).resolve()
    # Git tags use the conventional `v` prefix, but MSBuild/NuGet Version
    # properties require a semantic version without that prefix.
    dotnet_version = version.removeprefix("v")
    run_cmd(
        " ".join(
            [
                "dotnet publish",
                to_posix(csproj),
                "-c Release",
                "-p:RestoreBuildInParallel=false",
                f"-o {to_posix(dist_dir.resolve())}",
                f"/p:Version={dotnet_version}",
                f"/p:AssemblyVersion={dotnet_version}",
                f"/p:FileVersion={dotnet_version}",
                f"/p:InformationalVersion={dotnet_version}",
            ]
        )
    )


def build_frontend(dist_dir: Path, version: str) -> None:
    fe_dir = Path(str(get_config("FRONTEND_DIR"))).resolve()
    run_cmd("pnpm install", cwd=fe_dir)
    # 构建前端时，明确设置 API_URL="" 以覆盖 .env.local 中的本地开发地址
    # 前后端同源部署时，前端直接访问 / 前缀的后端 API
    run_cmd("pnpm run build", cwd=fe_dir, extra_env={"FE_VERSION": version, "API_URL": ""})

    fe_out = fe_dir / "out"
    if not fe_out.exists():
        raise RuntimeError("前端构建完成但未找到 src/FE/out 目录")

    wwwroot = dist_dir / "wwwroot"
    if wwwroot.exists():
        shutil.rmtree(wwwroot)
    shutil.copytree(fe_out, wwwroot)


def write_runtime_dockerfile(dist_dir: Path) -> Path:
    dockerfile_path = Path(str(get_config("DOCKERFILE"))).resolve()
    dockerfile_path.parent.mkdir(parents=True, exist_ok=True)
    dockerfile_path.write_text(
        "\n".join(
            [
                "FROM mcr.microsoft.com/dotnet/aspnet:10.0",
                "WORKDIR /app",
                "COPY . /app",
                "ENV ASPNETCORE_URLS=http://+:8080",
                "EXPOSE 8080",
                'ENTRYPOINT ["dotnet", "Chats.BE.dll"]',
                "",
            ]
        ),
        encoding="utf-8",
    )
    return dockerfile_path


def build_local_image(version: str, dist_dir: Path, dockerfile_path: Path) -> str:
    image_name = str(get_config("IMAGE_NAME"))
    local_image = f"{image_name}:{version}"
    platform = str(get_config("PLATFORMS"))

    run_cmd(
        " ".join(
            [
                "docker build",
                f"--platform {platform}",
                f"-f {to_posix(dockerfile_path)}",
                f"-t {local_image}",
                to_posix(dist_dir.resolve()),
            ]
        )
    )
    return local_image


def registry_image(registry: dict, version: str) -> str:
    r_type = registry.get("TYPE", "")
    url = registry.get("URL", "")
    namespace = registry.get("NAMESPACE", "")
    image = registry.get("IMAGE_NAME", "")
    if r_type == "dockerhub":
        return f"{namespace}/{image}:{version}"
    return f"{url}/{namespace}/{image}:{version}"


def tag_and_push(local_image: str, version: str) -> str:
    registries = get_config("REGISTRIES")
    if not isinstance(registries, list) or not registries:
        raise RuntimeError("REGISTRIES 配置为空，无法推送")

    pushed = []
    for registry in registries:
        if not isinstance(registry, dict):
            continue
        remote = registry_image(registry, version)
        run_cmd(f"docker tag {local_image} {remote}")
        if as_bool(get_config("ENABLE_DOCKER_PUSH")):
            run_cmd(f"docker push {remote}")
        pushed.append(remote)
    if not pushed:
        raise RuntimeError("REGISTRIES 中未找到有效镜像仓库配置")
    return pushed[0]


def deploy_remote(version: str) -> None:
    host = str(get_config("REMOTE_HOST"))
    remote_path = str(get_config("REMOTE_PROJECT_PATH"))
    tag_key = str(get_config("REMOTE_TAG_KEY"))

    run_cmd(
        f"ssh {host} \"sed -i 's/^{tag_key}=.*/{tag_key}={version}/' {remote_path}/.env\""
    )
    run_cmd(
        f"ssh {host} \"cd {remote_path} && docker compose --env-file ./.env up -d --remove-orphans\""
    )


def main() -> None:
    progress = ProgressDisplay()
    version = get_version()

    dist_dir = Path(str(get_config("DIST_DIR"))).resolve()
    progress.set_status("清理并准备 dist 目录...")
    ensure_clean_dir(dist_dir)
    progress.finish_step(f"dist 就绪: {dist_dir}")

    progress.set_status("构建后端并发布到 dist...")
    build_backend(dist_dir, version)
    progress.finish_step("后端发布完成")

    progress.set_status("构建前端并复制到 dist/wwwroot...")
    build_frontend(dist_dir, version)
    progress.finish_step("前端构建完成并已复制到 dist/wwwroot")

    progress.set_status("生成运行时 Dockerfile 并构建镜像...")
    dockerfile_path = write_runtime_dockerfile(dist_dir)
    local_image = build_local_image(version, dist_dir, dockerfile_path)
    progress.finish_step(f"镜像构建完成: {local_image}")

    progress.set_status("推送镜像到仓库...")
    primary_image = tag_and_push(local_image, version)
    progress.finish_step(f"镜像推送完成: {primary_image}")

    if as_bool(get_config("ENABLED_DEPLOY")):
        progress.set_status("开始远程部署...")
        deploy_remote(version)
        progress.finish_step("远程部署完成")

    print("全部任务完成")


if __name__ == "__main__":
    main()
