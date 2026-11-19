#!/usr/bin/env python3
import json
import os
import re
import shlex
import subprocess
import sys

OPERATORS = {";", "&&", "||", "|", "&", "(", ")", "|&", ";;"}
REDIRECTS = {">", ">>", ">|", "&>", "&>>"}
PREFIX_WORDS = {"command", "sudo", "nohup", "exec", "time", "env", "xargs", "caffeinate"}
SAFE_PREFIXES = ("/tmp/", "/private/tmp/", "/dev/", "/var/folders/", "/private/var/folders/")
PYTHON_WRITE = re.compile(r"write_text\(|write_bytes\(|\.write\(|open\([^)]*['\"][wax]\+?b?['\"]")
QUOTED = re.compile(r"['\"]([^'\"\n]+)['\"]")
PATH_LIKE = re.compile(r"^[\w.~/-]+$")

MESSAGE = (
    "Blocked a shell write to {target} ({how}). Change a repo file with the Edit tool, "
    "or Write for a brand-new file: Edit refuses a missing or repeated anchor and shows a diff, "
    "a shell write does neither. Formatters (pint, vp fmt, wayfinder:generate) and writes to "
    "/tmp or gitignored paths are not affected."
)
WRITE_MESSAGE = (
    "Blocked Write over {target}, a file git already tracks. From a subagent, change an existing "
    "file with the Edit tool (several Edits, or replace_all), so the change shows as a diff "
    "against what was there."
)


def run_git(args, cwd):
    try:
        return subprocess.run(["git", "-C", cwd, *args], capture_output=True, text=True, timeout=3)
    except (OSError, subprocess.SubprocessError):
        return None


def absolute(path, cwd):
    path = os.path.expanduser(path)
    return os.path.normpath(path if os.path.isabs(path) else os.path.join(cwd, path))


def repo_path(path, cwd):
    full = absolute(path, cwd)
    if full == "/dev/null" or full.startswith(SAFE_PREFIXES):
        return None
    folder = os.path.dirname(full)
    while folder and not os.path.isdir(folder):
        folder = os.path.dirname(folder)
    if not folder or folder == "/":
        return None
    inside = run_git(["rev-parse", "--is-inside-work-tree"], folder)
    if inside is None or inside.stdout.strip() != "true":
        return None
    ignored = run_git(["check-ignore", "-q", os.path.relpath(full, folder)], folder)
    if ignored is not None and ignored.returncode == 0:
        return None
    return full


def tracked(path, cwd):
    full = absolute(path, cwd)
    if not os.path.isfile(full):
        return False
    result = run_git(["ls-files", "--error-unmatch", os.path.basename(full)], os.path.dirname(full))
    return result is not None and result.returncode == 0


def strip_heredocs(command):
    kept, lines, i = [], command.split("\n"), 0
    while i < len(lines):
        kept.append(lines[i])
        match = re.search(r"<<-?\s*['\"]?([A-Za-z_][A-Za-z0-9_]*)['\"]?", lines[i])
        i += 1
        if match:
            while i < len(lines) and lines[i].strip() != match.group(1):
                i += 1
            i += 1
    return "\n".join(kept)


def tokens(command):
    lexer = shlex.shlex(command.replace("\n", " ; "), posix=True, punctuation_chars=";&|()<>")
    lexer.whitespace_split = True
    try:
        return list(lexer)
    except ValueError:
        return []


def segments(words):
    current = []
    for word in words:
        if word in OPERATORS:
            if current:
                yield current
            current = []
        else:
            current.append(word)
    if current:
        yield current


def program(segment):
    for index, word in enumerate(segment):
        if "=" in word and not word.startswith("-") and index == 0:
            continue
        if word in PREFIX_WORDS:
            continue
        return index, os.path.basename(word)
    return None, None


def in_place_flag(name, flags):
    if name in ("sed", "gsed"):
        return any(f == "--in-place" or f.startswith("--in-place=") or re.match(r"^-[A-Za-z]*i", f) for f in flags)
    if name == "perl":
        return any(re.match(r"^-[A-Za-z]*i", f) for f in flags)
    return False


def bash_violation(command, cwd):
    words = tokens(strip_heredocs(command))
    for i, word in enumerate(words):
        if word in REDIRECTS and i + 1 < len(words):
            target = words[i + 1]
            if target.startswith("&") or target in OPERATORS or target in REDIRECTS:
                continue
            if repo_path(target, cwd):
                return target, f"a {word} redirect"
    for segment in segments(words):
        start, name = program(segment)
        if start is None:
            continue
        args = segment[start + 1:]
        if name == "tee":
            for arg in args:
                if not arg.startswith("-") and repo_path(arg, cwd):
                    return arg, "tee"
        if name in ("sed", "gsed", "perl") and in_place_flag(name, [a for a in args if a.startswith("-")]):
            for arg in args:
                if not arg.startswith("-") and os.path.isfile(absolute(arg, cwd)) and repo_path(arg, cwd):
                    return arg, f"{name} in-place edit"
    if re.search(r"(^|[\s;&|(])python3?(\s|$)", command) and PYTHON_WRITE.search(command):
        for literal in QUOTED.findall(command):
            looks_like_file = "/" in literal or re.search(r"\.\w{1,6}$", literal)
            if PATH_LIKE.match(literal) and looks_like_file and repo_path(literal, cwd):
                return literal, "a Python file write"
    return None


def main():
    try:
        event = json.load(sys.stdin)
    except (ValueError, OSError):
        return 0
    tool = event.get("tool_name")
    data = event.get("tool_input") or {}
    cwd = event.get("cwd") or os.getcwd()
    try:
        if tool == "Bash":
            found = bash_violation(data.get("command") or "", cwd)
            if found:
                print(MESSAGE.format(target=found[0], how=found[1]), file=sys.stderr)
                return 2
        if tool == "Write" and event.get("agent_id"):
            target = data.get("file_path") or ""
            if target and tracked(target, cwd) and repo_path(target, cwd):
                print(WRITE_MESSAGE.format(target=target), file=sys.stderr)
                return 2
    except Exception:
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
