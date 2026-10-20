#!/usr/bin/env python3
"""Тесты хука reviewer_guard.py. Запуск: python3 .claude/hooks/tests/test_reviewer_guard.py
Каждый случай: (описание, tool_name, tool_input, ожидаемый код выхода).
"""
import json
import os
import subprocess
import sys

ROOT = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
HOOK = os.path.join(ROOT, ".claude", "hooks", "reviewer_guard.py")
B, W = "Bash", "Write"

CASES = [
    # Разрешено
    ("отчёт в reports/reviews", W, {"file_path": f"{ROOT}/reports/reviews/x.md"}, 0),
    ("копия в review_runs", W, {"file_path": "analysis/review_runs/run1/a.R"}, 0),
    ("ls и cat", B, {"command": "ls -la docs && cat CLAUDE.md"}, 0),
    ("grep со словами git commit", B, {"command": 'grep -rn "git commit" docs'}, 0),
    ("grep с | в кавычках", B, {"command": 'grep -E "a|b" CLAUDE.md | wc -l'}, 0),
    ("git diff/log/status", B, {"command": "git status --short && git log -1 && git diff HEAD"}, 0),
    ("Rscript из review_runs", B, {"command": "Rscript analysis/review_runs/run1/a.R"}, 0),
    ("python3 -I из review_runs", B, {"command": "python3 -I analysis/review_runs/run1/a.py > analysis/review_runs/run1/log.txt 2>&1"}, 0),
    ("cp в review_runs", B, {"command": "cp analysis/main.R analysis/review_runs/run1/"}, 0),
    ("mkdir в review_runs", B, {"command": "mkdir -p analysis/review_runs/run1"}, 0),
    ("pdftotext в stdout", B, {"command": "pdftotext sources/a.pdf - | head"}, 0),
    ("id (проба активности хука)", B, {"command": "id"}, 0),
    ("python3 -I -B из review_runs", B, {"command": "python3 -I -B analysis/review_runs/run1/a.py"}, 0),
    ("Rscript --vanilla из review_runs", B, {"command": "Rscript --vanilla analysis/review_runs/run1/a.R"}, 0),
    ("вывод в /dev/null", B, {"command": "ls data 2>/dev/null"}, 0),
    # Запрещено: Write/Edit
    ("Write в manuscript", W, {"file_path": f"{ROOT}/manuscript/ch1.md"}, 2),
    ("Write через ../", W, {"file_path": f"{ROOT}/reports/reviews/../../manuscript/a.md"}, 2),
    ("Edit", "Edit", {"file_path": f"{ROOT}/reports/reviews/x.md"}, 2),
    ("NotebookEdit", "NotebookEdit", {"notebook_path": "a.ipynb"}, 2),
    # Запрещено: запись через Bash (обходы из проверки 2026-10-20)
    ("echo >", B, {"command": "echo x > CLAUDE.md"}, 2),
    ("cp /dev/null", B, {"command": "cp /dev/null CLAUDE.md"}, 2),
    ("tee", B, {"command": "echo x | tee docs/HQ_RULES.md"}, 2),
    ("python -c", B, {"command": "python3 -c \"open('CLAUDE.md','w')\""}, 2),
    ("perl -pi", B, {"command": "perl -pi -e s/a/b/ CLAUDE.md"}, 2),
    ("dd", B, {"command": "dd if=/dev/null of=CLAUDE.md"}, 2),
    ("install", B, {"command": "install /dev/null CLAUDE.md"}, 2),
    ("ln -sf", B, {"command": "ln -sf /dev/null CLAUDE.md"}, 2),
    ("перезапись хука", B, {"command": "cat > .claude/hooks/reviewer_guard.py"}, 2),
    ("sed -e -i", B, {"command": "sed -e s/a/b/ -i CLAUDE.md"}, 2),
    ("sed -E -i", B, {"command": "sed -E -i s/a/b/ CLAUDE.md"}, 2),
    ("/bin/rm", B, {"command": "/bin/rm CLAUDE.md"}, 2),
    ("sudo rm", B, {"command": "sudo rm CLAUDE.md"}, 2),
    ("env rm", B, {"command": "env rm CLAUDE.md"}, 2),
    ("\\rm", B, {"command": "\\rm CLAUDE.md"}, 2),
    ("(rm)", B, {"command": "(rm CLAUDE.md)"}, 2),
    ("$(rm)", B, {"command": "echo $(rm CLAUDE.md)"}, 2),
    ("rm после перевода строки", B, {"command": "ls\nrm CLAUDE.md"}, 2),
    ("xargs rm", B, {"command": "ls | xargs rm"}, 2),
    ("find -delete", B, {"command": "find . -name x -delete"}, 2),
    ("find -exec", B, {"command": "find . -exec rm {} ;"}, 2),
    ("unlink", B, {"command": "unlink CLAUDE.md"}, 2),
    ("bash -c", B, {"command": "bash -c \"rm CLAUDE.md\""}, 2),
    ("git -C commit", B, {"command": "git -C . commit -m x"}, 2),
    ("git -c push", B, {"command": "git -c a=b push"}, 2),
    ("git add", B, {"command": "git add ."}, 2),
    ("git branch -D", B, {"command": "git branch -D x"}, 2),
    ("git tag -f", B, {"command": "git tag -f v1"}, 2),
    ("git update-ref", B, {"command": "git update-ref -d HEAD"}, 2),
    ("git cherry-pick", B, {"command": "git cherry-pick abc"}, 2),
    ("git revert", B, {"command": "git revert HEAD"}, 2),
    ("git pull", B, {"command": "git pull"}, 2),
    ("git config", B, {"command": "git config user.name x"}, 2),
    ("cp в data/raw", B, {"command": "cp x data/raw/a.csv"}, 2),
    ("tee в data/raw", B, {"command": "tee data/raw/a.csv"}, 2),
    ("cp -t", B, {"command": "cp -t manuscript analysis/review_runs/a"}, 2),
    ("Rscript вне review_runs", B, {"command": "Rscript analysis/main.R"}, 2),
    ("Rscript -e", B, {"command": "Rscript -e \"file.remove('CLAUDE.md')\""}, 2),
    ("python3 -m", B, {"command": "python3 -m shutil"}, 2),
    ("переменная окружения перед командой", B, {"command": "X=1 rm CLAUDE.md"}, 2),
    ("перенаправление после >&", B, {"command": "ls >& CLAUDE.md"}, 2),
    ("pdftotext в чужой файл", B, {"command": "pdftotext a.pdf CLAUDE.md"}, 2),
    ("awk", B, {"command": "awk 'BEGIN{system(\"rm x\")}'"}, 2),
    # Обходы из проверки агентом independent-reviewer 2026-10-20
    ("sort -o", B, {"command": "sort -o CLAUDE.md /dev/null"}, 2),
    ("sort --output", B, {"command": "sort --output=CLAUDE.md /dev/null"}, 2),
    ("sort --compress-program", B, {"command": "sort --compress-program=x.sh CLAUDE.md"}, 2),
    ("uniq IN OUT", B, {"command": "uniq /dev/null CLAUDE.md"}, 2),
    ("tree -o", B, {"command": "tree -o CLAUDE.md"}, 2),
    ("xxd IN OUT", B, {"command": "xxd /dev/null CLAUDE.md"}, 2),
    ("xxd -r", B, {"command": "xxd -r /dev/null CLAUDE.md"}, 2),
    ("git diff --output", B, {"command": "git diff --output=CLAUDE.md"}, 2),
    ("git log --output", B, {"command": "git log -1 --output=CLAUDE.md"}, 2),
    ("git grep -O", B, {"command": "git grep -Orm -e probe -- manuscript"}, 2),
    ("git diff --ext-diff", B, {"command": "git diff --ext-diff"}, 2),
    ("rg --pre", B, {"command": "rg --pre rm probe manuscript"}, 2),
    ("1<>", B, {"command": "echo x 1<> CLAUDE.md"}, 2),
    ("cat <>", B, {"command": "cat <> manuscript/__new.md"}, 2),
    ("python3 -Ic", B, {"command": "python3 -Ic 'import os#/../analysis/review_runs/x'"}, 2),
    ("python3 -Ec", B, {"command": "python3 -Ec 'x#/../analysis/review_runs/x'"}, 2),
    ("python3 -Bc", B, {"command": "python3 -Bc 'x#/../analysis/review_runs/x'"}, 2),
    ("python3 -Im", B, {"command": "python3 -Im shutil"}, 2),
    ("Rscript --expr", B, {"command": "Rscript --expr=1"}, 2),
    ("программа по пути из review_runs", B, {"command": "analysis/review_runs/b/cat -c x"}, 2),
    ("программа по относительному пути", B, {"command": "./cat x"}, 2),
    ("cp -s", B, {"command": "cp -s CLAUDE.md analysis/review_runs/l"}, 2),
    ("cp -l", B, {"command": "cp -l CLAUDE.md analysis/review_runs/h"}, 2),
    ("cp --link", B, {"command": "cp --link CLAUDE.md analysis/review_runs/h"}, 2),
    ("date -s", B, {"command": "date -s 2000-01-01"}, 2),
    # Фильтр по агенту
    ("другой агент не ограничивается", "OTHER", {"command": "rm x"}, 0),
    ("главная беседа не ограничивается", "MAIN", {"command": "rm x"}, 0),
    # Сбои разбора
    ("command не строка", B, {"command": ["rm", "CLAUDE.md"]}, 2),
    ("незакрытая кавычка", B, {"command": "echo \"x"}, 2),
]


def run(tool, tool_input, raw=None):
    data = {"tool_name": tool, "tool_input": tool_input, "cwd": ROOT, "agent_type": "independent-reviewer"}
    if tool == "OTHER":
        data.update(tool_name="Bash", agent_type="data-statistician")
    elif tool == "MAIN":
        data["tool_name"] = "Bash"
        del data["agent_type"]
    payload = raw if raw is not None else json.dumps(data)
    env = dict(os.environ, CLAUDE_PROJECT_DIR=ROOT)
    return subprocess.run([sys.executable, HOOK], input=payload, text=True, capture_output=True, env=env).returncode


def main():
    failed = 0
    for name, tool, tool_input, expected in CASES:
        code = run(tool, tool_input)
        ok = code == expected
        failed += not ok
        print(f"{'OK  ' if ok else 'FAIL'} {expected}->{code} {name}")
    code = run(None, None, raw="{not json")
    failed += code != 2
    print(f"{'OK  ' if code == 2 else 'FAIL'} 2->{code} некорректный JSON")
    print(f"\nИтого: {len(CASES) + 1} случаев, ошибок: {failed}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
