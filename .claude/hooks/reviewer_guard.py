#!/usr/bin/env python3
"""PreToolUse-хук агента independent-reviewer.

Write разрешён только в reports/reviews/ и analysis/review_runs/.
Bash: блокируются команды, меняющие историю Git или удаляющие/перемещающие файлы.
Это не песочница: скрипт на Python или R, запущенный через Bash, технически
может открыть любой файл. Поэтому после проверки главная беседа сверяет git status.
"""
import json
import os
import re
import sys

ALLOWED_DIRS = ("reports/reviews", "analysis/review_runs")
BASH_BLOCK = re.compile(
    r"(^|[;&|]\s*)(rm|mv|chmod|chown|truncate|shred)\b"
    r"|\bgit\s+(commit|push|reset|checkout|restore|clean|rm|mv|stash|rebase|merge|switch|apply)\b"
    r"|\bsed\s+(-[a-zA-Z]*i|--in-place)"
    r"|>\s*\S*data/raw/"
)


def block(msg):
    print(msg, file=sys.stderr)
    sys.exit(2)


def main():
    data = json.load(sys.stdin)
    tool = data.get("tool_name", "")
    tool_input = data.get("tool_input", {}) or {}
    root = os.path.realpath(os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd", "."))

    if tool in ("Write", "Edit", "NotebookEdit"):
        path = tool_input.get("file_path") or tool_input.get("notebook_path") or ""
        real = os.path.realpath(os.path.join(root, path))
        if tool == "Write" and any(real.startswith(os.path.join(root, d) + os.sep) for d in ALLOWED_DIRS):
            sys.exit(0)
        block("independent-reviewer: запись разрешена только в reports/reviews/ и analysis/review_runs/. "
              "Оригинал не изменяется; верните замечания главной беседе.")

    if tool == "Bash":
        cmd = tool_input.get("command", "")
        if BASH_BLOCK.search(cmd):
            block("independent-reviewer: команда может изменить или удалить файлы либо историю Git и заблокирована. "
                  "Работайте с копиями в analysis/review_runs/.")
    sys.exit(0)


if __name__ == "__main__":
    main()
