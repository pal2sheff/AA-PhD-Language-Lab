#!/usr/bin/env python3
"""PreToolUse-хук агента independent-reviewer (список разрешённого).

Write разрешён только в reports/reviews/ и analysis/review_runs/. Edit и NotebookEdit запрещены.
Bash: каждая команда в цепочке должна входить в список разрешённых программ чтения;
перенаправление вывода допускается только в разрешённые каталоги или /dev/null;
python3 и Rscript запускают только файлы из analysis/review_runs/.
Любая ошибка разбора блокирует действие (код 2).

Ограничение: скрипт из analysis/review_runs/ технически может открыть любой файл.
Поэтому главная беседа сверяет состояние репозитория до и после проверки
(.claude/hooks/repo_snapshot.sh). Хуки агента работают только при вызове
субагента independent-reviewer и только в доверенной рабочей папке.
"""
import json
import os
import shlex
import sys

ALLOWED_DIRS = ("reports/reviews", "analysis/review_runs")
READ_ONLY = {
    "ls", "cat", "head", "tail", "wc", "grep", "rg", "diff", "cmp", "sort", "uniq",
    "cut", "tr", "nl", "pwd", "stat", "file", "md5sum", "sha256sum", "echo", "printf",
    "true", "test", "[", "basename", "dirname", "realpath", "date", "which", "jq",
    "pdfinfo", "column", "comm", "join", "paste", "fold", "od", "xxd", "tree", "du",
}
GIT_READ = {"status", "diff", "log", "show", "rev-parse", "ls-files", "blame", "grep", "cat-file", "show-ref"}
FIND_FORBIDDEN = {"-delete", "-exec", "-execdir", "-ok", "-okdir", "-fprint", "-fprint0", "-fprintf", "-fls"}
SEPARATORS = {";", "&&", "||", "|", "&", "(", ")", ";;", "|&"}
REDIRECTS = {">", ">>", ">|", "&>", "&>>", ">&"}


class Blocked(Exception):
    pass


def in_allowed(path, root, cwd):
    real = os.path.realpath(os.path.join(cwd, path))
    return any(real.startswith(os.path.join(root, d) + os.sep) for d in ALLOWED_DIRS)


def check_segment(words, root, cwd):
    if not words:
        return
    prog, args = os.path.basename(words[0]), words[1:]
    if prog in READ_ONLY:
        return
    if prog == "git":
        if not args or args[0] not in GIT_READ:
            raise Blocked("разрешены только читающие команды git без глобальных опций")
        return
    if prog == "find":
        if FIND_FORBIDDEN.intersection(args):
            raise Blocked("find с -delete/-exec/-fprint запрещён")
        return
    if prog == "pdftotext":
        if not args or not (args[-1] == "-" or in_allowed(args[-1], root, cwd)):
            raise Blocked("pdftotext: вывод только в '-' или в analysis/review_runs/")
        return
    if prog == "mkdir":
        paths = [a for a in args if not a.startswith("-")]
        if not paths or not all(in_allowed(p, root, cwd) for p in paths):
            raise Blocked("mkdir только внутри разрешённых каталогов")
        return
    if prog == "cp":
        paths = [a for a in args if not a.startswith("-")]
        if len(paths) < 2 or not in_allowed(paths[-1], root, cwd) or "-t" in args or any(a.startswith("--target") for a in args):
            raise Blocked("cp только с копированием в analysis/review_runs/ или reports/reviews/")
        return
    if prog in ("python3", "python", "Rscript"):
        script = None
        for a in args:
            if a in ("-c", "-e", "-m") or a.startswith(("-c", "-e", "-m")) and len(a) > 2 and not a.startswith("--"):
                raise Blocked(f"{prog}: выполнение кода из строки или модуля запрещено")
            if not a.startswith("-"):
                script = a
                break
        if not script or not in_allowed(script, root, cwd):
            raise Blocked(f"{prog}: запуск только скриптов из analysis/review_runs/")
        return
    raise Blocked(f"программа '{prog}' не входит в список разрешённых")


def check_bash(cmd, root, cwd):
    if "\n" in cmd or "\r" in cmd:
        raise Blocked("многострочные команды запрещены")
    if "$(" in cmd or "`" in cmd or "<(" in cmd or ">(" in cmd:
        raise Blocked("подстановка команд запрещена")
    lex = shlex.shlex(cmd, posix=True, punctuation_chars=True)
    lex.whitespace_split = True
    tokens = list(lex)
    words, i = [], 0
    while i < len(tokens):
        t = tokens[i]
        if t in SEPARATORS:
            check_segment(words, root, cwd)
            words = []
        elif t in REDIRECTS or (t.endswith(">") and set(t) <= set("0123456789&>|")):
            target = tokens[i + 1] if i + 1 < len(tokens) else ""
            if not (target == "/dev/null" or target.isdigit() or in_allowed(target, root, cwd)):
                raise Blocked("перенаправление вывода только в разрешённые каталоги или /dev/null")
            i += 1
        elif t in ("<", "<<", "<<<"):
            i += 1
        else:
            words.append(t)
        i += 1
    check_segment(words, root, cwd)


def main():
    data = json.load(sys.stdin)
    tool = data.get("tool_name", "")
    tool_input = data.get("tool_input") or {}
    root = os.path.realpath(os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or ".")
    cwd = os.path.realpath(data.get("cwd") or root)

    if tool in ("Edit", "NotebookEdit"):
        raise Blocked("правка файлов запрещена; верните замечания главной беседе")
    if tool == "Write":
        path = tool_input.get("file_path")
        if not isinstance(path, str) or not in_allowed(path, root, cwd):
            raise Blocked("запись разрешена только в reports/reviews/ и analysis/review_runs/")
    if tool == "Bash":
        cmd = tool_input.get("command")
        if not isinstance(cmd, str):
            raise Blocked("некорректная команда")
        check_bash(cmd, root, cwd)


if __name__ == "__main__":
    try:
        main()
    except Blocked as e:
        print(f"independent-reviewer: {e}. Оригинал не изменяется; работайте с копиями в analysis/review_runs/.", file=sys.stderr)
        sys.exit(2)
    except Exception as e:  # любая ошибка разбора блокирует действие
        print(f"independent-reviewer: хук не смог разобрать вызов ({type(e).__name__}); действие заблокировано.", file=sys.stderr)
        sys.exit(2)
    sys.exit(0)
