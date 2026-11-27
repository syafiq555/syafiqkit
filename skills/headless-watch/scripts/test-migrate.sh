#!/bin/bash
# Runs watcher.sh install against pre-1.494.0 job shapes in a throwaway HOME with fake launchctl and claude.
# Usage: bash test-migrate.sh   (exit 0 when every case behaves)
set -u
SCRIPT="$(cd "$(dirname "$0")" && pwd)/watcher.sh"
T=$(mktemp -d "${TMPDIR:-/tmp}/watcher-migrate.XXXXXX")
trap 'rm -rf "$T"' EXIT
unset WATCHERS_HOME CLAUDE_BIN TELEGRAM_ENV
export HOME=$T
mkdir -p "$T/.local/bin" "$T/proj" "$T/.claude/watchers"
for s in watch-sheets other-skill done check; do mkdir -p "$T/.claude/skills/$s"; echo x > "$T/.claude/skills/$s/SKILL.md"; done
printf '#!/bin/sh\nexit 0\n' > "$T/.local/bin/launchctl"
printf '#!/bin/sh\nexit 0\n' > "$T/.local/bin/claude"
chmod +x "$T/.local/bin/launchctl" "$T/.local/bin/claude"
fails=0

job() {
  local name=$1 tools_line=$2 prompt=$3 extra=${4:-}
  mkdir -p "$T/.claude/watchers/$name"
  printf 'PROJECT_DIR="%s"\nTELEGRAM_CHAT_ID="1"\n%s\n%s\n' "$T/proj" "$tools_line" "$extra" > "$T/.claude/watchers/$name/job.env"
  printf '%s\n' "$prompt" > "$T/.claude/watchers/$name/prompt.md"
}

# expect <job> <ALLOWED_TOOLS after> <SKILL after> [text the output must contain]
expect() {
  local name=$1 want_tools=$2 want_skill=$3 want_text=${4:-} dir="$T/.claude/watchers/$1" before out got ok=yes
  before=$(cat "$dir/job.env")
  out=$(/bin/bash "$SCRIPT" install "$name" 2>&1)
  got=$(cd "$T/proj" && set +u && ALLOWED_TOOLS="" SKILL="" && . "$dir/job.env" 2>/dev/null && printf '%s|%s' "$ALLOWED_TOOLS" "$SKILL")
  [ "$got" = "$want_tools|$want_skill" ] || ok=no
  [ -z "$want_text" ] || case "$out" in *"$want_text"*) ;; *) ok=no ;; esac
  if [ -z "$want_skill" ] && [ "$(cat "$dir/job.env")" != "$before" ]; then ok=no; got="$got (job.env changed on a refusal)"; fi
  if [ "$ok" = yes ]; then echo "ok   $name"; else echo "FAIL $name: got [$got] want [$want_tools|$want_skill] text [$want_text]"; echo "$out" | sed 's/^/     /'; fails=$((fails + 1)); fi
}

job bare 'ALLOWED_TOOLS="Skill,mcp__x"' 'Use the Skill tool to run watch-sheets, then compare rows.'
expect bare 'mcp__x,Read' 'watch-sheets' 'prompt.md still says: 1:Use the Skill tool'
job colon 'ALLOWED_TOOLS="Skill"' 'Use watch-sheets: do one check.'
expect colon 'Read' 'watch-sheets'
job explicit 'ALLOWED_TOOLS="Skill(watch-sheets),Read"' 'Check rows.'
expect explicit 'Read' 'watch-sheets'
job explicitwins 'ALLOWED_TOOLS="Skill(watch-sheets)"' 'Then hand off to other-skill.'
expect explicitwins 'Read' 'watch-sheets'
job scopedread 'ALLOWED_TOOLS="Skill(watch-sheets),Read(/x/*)"' 'x'
expect scopedread 'Read(/x/*),Read' 'watch-sheets'
job spaces 'ALLOWED_TOOLS="Skill,Bash(git log *),Read(/x/*)"' 'Run watch-sheets.'
expect spaces 'Bash(git log *),Read(/x/*),Read' 'watch-sheets'
job multiline 'ALLOWED_TOOLS="mcp__a__b,
 Skill(watch-sheets),Read"' 'Check rows.'
expect multiline 'mcp__a__b,Read' 'watch-sheets'
job quoting "ALLOWED_TOOLS='Skill(watch-sheets),Bash(echo \"hi \$HOME\"),Bash(grep a\\|b)'" 'x'
expect quoting 'Bash(echo "hi $HOME"),Bash(grep a\|b),Read' 'watch-sheets'
job preset 'ALLOWED_TOOLS="Skill"' 'Use the Skill tool.' 'SKILL="watch-sheets"'
expect preset 'Read' 'watch-sheets'
job plainword 'ALLOWED_TOOLS="Skill"' 'Invoke the Skill tool. When you are done, stop. Run the check.'
expect plainword 'Skill' '' 'neither a Skill(<name>) entry'
job twoskills 'ALLOWED_TOOLS="Skill"' 'Use watch-sheets and other-skill.'
expect twoskills 'Skill' '' 'names several installed skills'
job twoexplicit 'ALLOWED_TOOLS="Skill(watch-sheets),Skill(other-skill)"' 'x'
expect twoexplicit 'Skill(watch-sheets),Skill(other-skill)' '' 'names several installed skills'
job unknownexplicit 'ALLOWED_TOOLS="Skill(nonexistent)"' 'Run watch-sheets.'
expect unknownexplicit 'Skill(nonexistent)' '' 'Skill(nonexistent), which is not an installed skill'
job star 'ALLOWED_TOOLS="Skill(*)"' 'x'
expect star 'Skill(*)' '' 'not an installed skill'
job commainparens 'ALLOWED_TOOLS="Skill(watch-sheets),Bash(echo a, b),Read"' 'x'
expect commainparens 'Skill(watch-sheets),Bash(echo a, b),Read' '' 'a comma inside them'
job negated 'ALLOWED_TOOLS="Skill,mcp__x"' 'Check the tracker. Never touch other-skill output.'
expect negated 'Skill,mcp__x' '' 'neither a Skill(<name>) entry'
job negatedplususe 'ALLOWED_TOOLS="Skill"' 'Use the Skill tool to run watch-sheets.
Do not use other-skill here.'
expect negatedplususe 'Read' 'watch-sheets'
job presetgone 'ALLOWED_TOOLS="Skill"' 'x' 'SKILL="gone"'
expect presetgone 'Skill' 'gone' 'job.env is unchanged'
[ ! -e "$T/.claude/watchers/presetgone/job.env.pre-migrate" ] || { echo "FAIL presetgone: job.env.pre-migrate written on a refusal"; fails=$((fails + 1)); }

[ "$fails" = 0 ] && echo "all cases pass" || { echo "$fails case(s) failed"; exit 1; }
