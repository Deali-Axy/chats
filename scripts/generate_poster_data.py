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


def get_all_tags() -> list[str]:
    """获取所有 tag，按版本号降序排列。"""
    output = run_git("tag", "--sort=-v:refname", "-l")
    return [t for t in output.split("\n") if t.strip()]


def parse_version(tag: str) -> tuple[int, int, int]:
    """解析 tag 为 (major, minor, patch)。"""
    v = tag.lstrip("v")
    parts = v.split(".")
    major = int(parts[0]) if len(parts) > 0 else 0
    minor = int(parts[1]) if len(parts) > 1 else 0
    patch = int(parts[2]) if len(parts) > 2 else 0
    return major, minor, patch


def get_major_minor(version: str) -> str:
    """提取 major.minor 字符串，如 '1.13.1' → '1.13'。"""
    v = version.lstrip("v")
    parts = v.split(".")
    return f"{parts[0]}.{parts[1]}"


def find_latest_tag_for_major_minor(major_minor: str) -> str | None:
    """找到指定 major.minor 下的最新 tag（最大 patch 版本）。"""
    all_tags = get_all_tags()
    best = None
    best_patch = -1
    for tag in all_tags:
        try:
            mm = get_major_minor(tag)
            if mm == major_minor:
                _, _, patch = parse_version(tag)
                if patch > best_patch:
                    best_patch = patch
                    best = tag
        except (ValueError, IndexError):
            continue
    return best


def find_previous_major_minor_tag(current_major_minor: str) -> str | None:
    """找到上一个大版本的最新 tag。如 current='1.13' → 返回 '1.12.x' 的最新 tag。"""
    all_tags = get_all_tags()
    major, minor = current_major_minor.split(".")
    major, minor = int(major), int(minor)

    # 收集所有不同的 major.minor，降序排列
    seen = set()
    ordered_mm = []
    for tag in all_tags:
        try:
            mm = get_major_minor(tag)
            if mm not in seen:
                seen.add(mm)
                ordered_mm.append(mm)
        except (ValueError, IndexError):
            continue

    # 找到 current_major_minor 之后的下一个
    found = False
    for mm in ordered_mm:
        if mm == current_major_minor:
            found = True
            continue
        if found:
            # 找到上一个大版本，返回其最新 tag
            return find_latest_tag_for_major_minor(mm)

    return None


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
    parser.add_argument("version", nargs="?", help="版本号（如 1.13.1），不传则自动检测")
    parser.add_argument("--output", "-o", default="src/FE/data/release-poster.json", help="输出文件路径")
    parser.add_argument("--tagline", default="全新功能与体验优化", help="版本标语")
    args = parser.parse_args()

    # 确定版本号
    if args.version:
        version = args.version.lstrip("v")
    else:
        latest_tag = get_all_tags()[0] if get_all_tags() else "0.0.0"
        version = latest_tag.lstrip("v")

    # 提取 major.minor，找到当前大版本的最新 tag
    major_minor = get_major_minor(version)
    current_tag = find_latest_tag_for_major_minor(major_minor)
    if not current_tag:
        print(f"❌ 找不到 {major_minor}.x 的 tag")
        sys.exit(1)

    # 找到上一个大版本的最新 tag
    prev_tag = find_previous_major_minor_tag(major_minor)
    if not prev_tag:
        print(f"❌ 找不到 {major_minor} 之前的大版本 tag")
        sys.exit(1)

    print(f"📌 当前大版本: v{major_minor}.x → 最新 tag: {current_tag}")
    print(f"📎 上一个大版本: 最新 tag: {prev_tag}")
    print(f"📊 计算范围: {prev_tag}..{current_tag}")

    # 获取日期
    date = get_tag_date(current_tag)
    print(f"📅 日期: {date}")

    # 获取提交
    commits = get_commits(prev_tag, current_tag)
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
