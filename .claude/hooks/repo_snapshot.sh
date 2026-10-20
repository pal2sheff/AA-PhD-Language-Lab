#!/usr/bin/env bash
# Отпечаток состояния проекта для сверки до и после независимой проверки.
# Использование: .claude/hooks/repo_snapshot.sh > /tmp/before.txt ; ... ; .claude/hooks/repo_snapshot.sh | diff /tmp/before.txt -
# Учитывает HEAD, все ссылки (ветки, теги), git config, рабочее дерево с игнорируемыми файлами
# и контрольные суммы всех файлов проекта, кроме .git и рабочих каталогов проверяющего.
set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"
echo "HEAD $(git rev-parse HEAD)"
git show-ref
git config --local --list
git status --porcelain --ignored --untracked-files=all | grep -v -e ' reports/reviews/' -e ' analysis/review_runs/' || true
find . -path ./.git -prune -o -path ./reports/reviews -prune -o -path ./analysis/review_runs -prune -o -type f -print0 \
  | sort -z | xargs -0 sha256sum
