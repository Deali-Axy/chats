#!/usr/bin/env python3
"""
从 git 提交历史生成版本更新海报数据。

用法:
    python scripts/generate_poster_data.py              # 自动检测最新 tag
    python scripts/generate_poster_data.py 1.13.0       # 指定版本
    python scripts/generate_poster_data.py --version 1.13.0 --output src/FE/data/release-poster.json
"""

import argparse
import json
import os
import re
import subprocess
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

# Windows 控制台 UTF-8 支持
if sys.platform == "win32":
    os.system("chcp 65001 >nul 2>&1")
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# 分类映射：conventional commit type → poster category
TYPE_MAP = {
    "feat": "features",
    "fix": "bugFixes",
    "refactor": "uiImprovements",
    "style": "uiImprovements",
    "chore": "otherUpdates",
    "build": "otherUpdates",
    "perf": "otherUpdates",
    "ci": "otherUpdates",
    "docs": None,  # 跳过纯文档提交
}

# 跳过的提交模式（merge commit、纯文档/二维码更新等）
SKIP_PATTERNS = [
    r"^Merge\s",
    r"^merge:",
    r"^update\s+wechat.*qr",
    r"^fix\(docs\):.*qr",
    r"^add\s+.*release\s+notes",
    r"^WIP\s",
    r"^index\s+on\s",
]

# 用于合并相似提交的关键词分组
FEATURE_GROUPS = {
    "临时聊天": ["临时聊天", "临时对话", "temp.*chat", "ephemeral"],
    "搜索功能": ["搜索", "search"],
    "侧边栏": ["侧边栏", "sidebar", "Sidebar"],
    "模型定价": ["模型定价", "model.*price"],
    "代码块": ["代码块", "codeblock", "CodeBlock"],
    "海报": ["poster", "海报"],
    "登录": ["登录", "login"],
    "包管理": ["pnpm", "npm", "包管理"],
    "构建": ["构建", "build", "TypeScript"],
}


def run_git(*args: str) -> str:
    """运行 git 命令并返回输出。"""
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        check=True,
        encoding="utf-8",
        errors="replace",
    )
    return (result.stdout or "").strip()


def get_latest_tag() -> str:
    """获取最新的 git tag。"""
    return run_git("tag", "--sort=-creatordate", "--sort=-v:refname", "-l").split("\n")[0]


def get_previous_tag(current: str) -> str:
    """获取当前 tag 之前的上一个 tag。"""
    tags = run_git("tag", "--sort=-creatordate", "--sort=-v:refname", "-l").split("\n")
    found = False
    for tag in tags:
        if tag == current:
            found = True
            continue
        if found and tag:
            return tag
    # fallback: 用当前 tag 之前的第一个 commit
    return run_git("rev-list", "--max-parents=0", "HEAD")


def get_tag_date(tag: str) -> str:
    """获取 tag 的创建日期，格式 YYYY-MM-DD。"""
    try:
        date_str = run_git("log", "-1", "--format=%ai", tag)
        return date_str.split(" ")[0]
    except subprocess.CalledProcessError:
        return datetime.now().strftime("%Y-%m-%d")


def get_commits(from_ref: str, to_ref: str) -> list[dict]:
    """获取两个 ref 之间的提交列表。"""
    log_format = "%H|%s|%an|%ai"
    try:
        output = run_git("log", f"{from_ref}..{to_ref}", f"--format={log_format}")
    except subprocess.CalledProcessError:
        return []

    if not output:
        return []

    commits = []
    for line in output.split("\n"):
        if not line.strip():
            continue
        parts = line.split("|", 3)
        if len(parts) < 4:
            continue
        hash_val, subject, author, date = parts
        commits.append({
            "hash": hash_val[:8],
            "subject": subject.strip(),
            "author": author.strip(),
            "date": date.strip(),
        })
    return commits


def should_skip(subject: str) -> bool:
    """判断是否跳过该提交。"""
    for pattern in SKIP_PATTERNS:
        if re.search(pattern, subject, re.IGNORECASE):
            return True
    return False


def parse_commit(subject: str) -> tuple[str | None, str, str]:
    """
    解析 conventional commit 格式。
    返回 (type, scope, description)。
    """
    # 匹配 type(scope): description 或 type: description
    m = re.match(r"^(\w+)(?:\(([^)]*)\))?\s*:\s*(.+)$", subject)
    if m:
        commit_type = m.group(1).lower()
        scope = m.group(2) or ""
        description = m.group(3).strip()
        return commit_type, scope, description

    # 非 conventional 格式，归类为 otherUpdates
    return None, "", subject.strip()


def find_group_key(description: str) -> str | None:
    """根据描述找到分组关键词。"""
    for key, patterns in FEATURE_GROUPS.items():
        for pattern in patterns:
            if re.search(pattern, description, re.IGNORECASE):
                return key
    return None


def categorize_commits(commits: list[dict]) -> dict:
    """将提交分类为海报数据结构。"""
    # 按分组收集
    grouped_features = defaultdict(list)
    grouped_ui = defaultdict(list)
    bug_fixes = []
    grouped_other = defaultdict(list)
    ungrouped_features = []
    ungrouped_ui = []
    ungrouped_other = []

    for commit in commits:
        subject = commit["subject"]
        if should_skip(subject):
            continue

        commit_type, scope, description = parse_commit(subject)
        category = TYPE_MAP.get(commit_type) if commit_type else "otherUpdates"

        if category is None:
            continue  # 跳过 docs

        group_key = find_group_key(description)

        if category == "features":
            if group_key:
                grouped_features[group_key].append(description)
            else:
                ungrouped_features.append(description)
        elif category == "bugFixes":
            bug_fixes.append(description)
        elif category == "uiImprovements":
            if group_key:
                grouped_ui[group_key].append(description)
            else:
                ungrouped_ui.append(description)
        elif category == "otherUpdates":
            if group_key:
                grouped_other[group_key].append(description)
            else:
                ungrouped_other.append(description)

    # 构建 features 列表
    features = []
    for key, descs in grouped_features.items():
        # 取最详细的描述
        best = max(descs, key=len) if descs else key
        features.append({"title": key, "description": best})
    for desc in ungrouped_features:
        # 尝试提取标题（取冒号前或前20字）
        title = desc[:20] + "..." if len(desc) > 20 else desc
        features.append({"title": title, "description": desc})

    # 构建 uiImprovements 列表
    ui_improvements = []
    for key, descs in grouped_ui.items():
        best = max(descs, key=len) if descs else key
        ui_improvements.append({"title": key, "description": best})
    for desc in ungrouped_ui:
        title = desc[:20] + "..." if len(desc) > 20 else desc
        ui_improvements.append({"title": title, "description": desc})

    # 构建 bugFixes 列表（去重相似的）
    unique_fixes = []
    seen_fix_keys = set()
    for fix in bug_fixes:
        group_key = find_group_key(fix)
        if group_key and group_key in seen_fix_keys:
            continue
        if group_key:
            seen_fix_keys.add(group_key)
        unique_fixes.append(fix)

    # 构建 otherUpdates 列表
    other_updates = []
    for key, descs in grouped_other.items():
        best = max(descs, key=len) if descs else key
        other_updates.append({"title": key, "description": best})
    for desc in ungrouped_other:
        title = desc[:20] + "..." if len(desc) > 20 else desc
        other_updates.append({"title": title, "description": desc})

    return {
        "features": features,
        "uiImprovements": ui_improvements,
        "bugFixes": unique_fixes,
        "otherUpdates": other_updates,
    }


def main():
    parser = argparse.ArgumentParser(description="从 git 历史生成海报数据")
    parser.add_argument("version", nargs="?", help="版本号（如 1.13.0），不传则自动检测")
    parser.add_argument("--output", "-o", default="src/FE/data/release-poster.json", help="输出文件路径")
    parser.add_argument("--tagline", default="全新功能与体验优化", help="版本标语")
    args = parser.parse_args()

    # 确定版本
    if args.version:
        version = args.version.lstrip("v")
        tag = args.version if args.version.startswith("v") else args.version
    else:
        tag = get_latest_tag()
        version = tag.lstrip("v")

    print(f"📌 版本: v{version} (tag: {tag})")

    # 获取上一个 tag
    prev_tag = get_previous_tag(tag)
    print(f"📎 上一个 tag: {prev_tag}")

    # 获取日期
    date = get_tag_date(tag)
    print(f"📅 日期: {date}")

    # 获取提交
    commits = get_commits(prev_tag, tag)
    print(f"📝 提交数量: {len(commits)}")

    if not commits:
        print("⚠️  没有找到提交，使用空数据")

    # 分类
    categorized = categorize_commits(commits)

    # 构建输出
    poster_data = {
        "version": version,
        "date": date,
        "tagline": args.tagline,
        **categorized,
    }

    # 输出统计
    print(f"✨ 新功能: {len(categorized['features'])}")
    print(f"🎨 UI 改进: {len(categorized['uiImprovements'])}")
    print(f"🐛 Bug 修复: {len(categorized['bugFixes'])}")
    print(f"📦 其他更新: {len(categorized['otherUpdates'])}")

    # 写入文件
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(poster_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n✅ 已生成: {output_path}")


if __name__ == "__main__":
    main()
