#!/bin/bash
# Usage: watcher.sh run|install|uninstall|kick|test-alert|report|status <name>
set -u
umask 077

ROOT="${WATCHERS_HOME:-$HOME/.claude/watchers}"
CLAUDE_BIN="${CLAUDE_BIN:-$HOME/.local/bin/claude}"
TELEGRAM_ENV="${TELEGRAM_ENV:-$HOME/.claude/channels/telegram/.env}"
LABEL_PREFIX="syafiqkit.watcher"
export PATH="$HOME/.local/bin:$HOME/.bun/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

cmd="${1:-}"
NAME="${2:-}"

die() { echo "watcher: $*" >&2; exit 64; }

if [ "$cmd" = "status" ] && [ -z "$NAME" ]; then
  for d in "$ROOT"/*/; do
    [ -f "$d/job.env" ] || continue
    n=$(basename "$d")
    loaded=no
    launchctl print "gui/$(id -u)/$LABEL_PREFIX.$n" >/dev/null 2>&1 && loaded=yes
    held=no; [ -s "$d/unsent.txt" ] && held=yes
    printf '%s\tscheduled=%s\tfailures=%s\tunsent_alert=%s\tlast: %s\n' "$n" "$loaded" "$(cat "$d/fails" 2>/dev/null || echo 0)" "$held" "$(tail -1 "$d/run.log" 2>/dev/null)"
  done
  exit 0
fi

[ -n "$NAME" ] || die "usage: watcher.sh run|install|uninstall|kick|test-alert|report|status <name>"
case "$NAME" in *[!A-Za-z0-9._-]*) die "job name may use letters, digits, dot, dash, underscore" ;; esac

JOB="$ROOT/$NAME"
LABEL="$LABEL_PREFIX.$NAME"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
[ -f "$JOB/job.env" ] || die "no job at $JOB (job.env missing)"

PROJECT_DIR="" MODEL="sonnet" GATE_MODEL="haiku" ALLOWED_TOOLS="" SKILL="" DAYS="1-7" HOURS="0-23"
INTERVAL_MIN="10" ALERT="telegram" TELEGRAM_CHAT_ID="" NTFY_TOPIC="" NTFY_SERVER="https://ntfy.sh"
MAX_BUDGET_USD="1" HEARTBEAT="daily" FAIL_ALERT_AFTER="2" RUN_TIMEOUT_MIN="15"
# shellcheck disable=SC1091
. "$JOB/job.env"

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$JOB/run.log"; }

in_spec() {
  local v=$1 part lo hi
  local IFS=','
  for part in $2; do
    case $part in
      *-*) lo=${part%-*}; hi=${part#*-}; [ "$v" -ge "$lo" ] && [ "$v" -le "$hi" ] && return 0 ;;
      *) [ "$v" -eq "$part" ] && return 0 ;;
    esac
  done
  return 1
}

send() {
  local msg="[$NAME] $1" token resp code
  case "$ALERT" in
    telegram)
      token=$(sed -n 's/^TELEGRAM_BOT_TOKEN=//p' "$TELEGRAM_ENV" 2>/dev/null | head -1 | tr -d '"'"'"' \r')
      [ -n "$token" ] || { log "send failed: no TELEGRAM_BOT_TOKEN in $TELEGRAM_ENV"; return 1; }
      [ -n "$TELEGRAM_CHAT_ID" ] || { log "send failed: TELEGRAM_CHAT_ID not set"; return 1; }
      resp=$(curl -sS --max-time 20 -K - --data-urlencode "chat_id=$TELEGRAM_CHAT_ID" --data-urlencode "text=$msg" 2>&1 <<<"url = \"https://api.telegram.org/bot$token/sendMessage\"")
      if printf '%s' "$resp" | jq -e '.ok == true' >/dev/null 2>&1; then return 0; fi
      log "send failed: $(printf '%s' "$resp" | jq -r '.description // empty' 2>/dev/null || printf '%s' "$resp" | head -c 200)"
      return 1 ;;
    ntfy)
      [ -n "$NTFY_TOPIC" ] || { log "send failed: NTFY_TOPIC not set"; return 1; }
      code=$(curl -sS --max-time 20 -o /dev/null -w '%{http_code}' -H "Title: $NAME" --data-binary "$msg" "$NTFY_SERVER/$NTFY_TOPIC" 2>>"$JOB/run.log")
      case "$code" in 2*) return 0 ;; esac
      log "send failed: ntfy HTTP $code"
      return 1 ;;
    *) log "send failed: unknown ALERT=$ALERT"; return 1 ;;
  esac
}

DENIED_TOOLS="Skill,Agent,Edit,Write,NotebookEdit,Bash(git * --output*),Bash(git *--output=*)"

skill_file() {
  local name=${SKILL##*:} plugin="" dir
  case "$SKILL" in *:*) plugin=${SKILL%%:*} ;; esac
  if [ -z "$plugin" ]; then
    for dir in "$PROJECT_DIR/.claude/skills" "$HOME/.claude/skills"; do
      [ -f "$dir/$name/SKILL.md" ] && { echo "$dir/$name/SKILL.md"; return 0; }
    done
  fi
  jq -r '.. | .installPath? // empty' "$HOME/.claude/plugins/installed_plugins.json" 2>/dev/null | while IFS= read -r dir; do
    if [ -n "$plugin" ]; then
      case "$dir" in
        */"$plugin") ;;
        */"$plugin"/[!/]*) case "${dir##*/"$plugin"/}" in */*) continue ;; esac ;;
        *) continue ;;
      esac
    fi
    [ -f "$dir/skills/$name/SKILL.md" ] && { echo "$dir/skills/$name/SKILL.md"; break; }
  done
}

migrate_skill_job() {
  local steps="remove Skill from ALLOWED_TOOLS, add Read and SKILL=<name> to job.env, drop any 'invoke the Skill tool' wording from prompt.md, then install again. The old schedule keeps running until then"
  local found="$SKILL" candidate resolved="" part entries=() kept=""
  local IFS_OLD=$IFS
  IFS=',' read -r -d '' -a entries < <(printf '%s' "${ALLOWED_TOOLS//$'\n'/,}")
  IFS=$IFS_OLD
  for part in "${entries[@]}"; do
    part="${part#"${part%%[![:space:]]*}"}"; part="${part%"${part##*[![:space:]]}"}"
    local opens=${part//[^(]/} closes=${part//[^)]/}
    [ ${#opens} = ${#closes} ] || die "ALLOWED_TOOLS has a pattern with unbalanced brackets or a comma inside them (near: $part), which can't be rewritten safely, so it can't be migrated for you: $steps"
    case "$part" in '') ;; Skill) ;; Skill\(*) candidate=${part#Skill(}; resolved="$resolved${candidate%)}"$'\n' ;; *) kept="${kept:+$kept,}$part" ;; esac
  done
  case ",$kept," in *,Read,*) ;; *) kept="${kept:+$kept,}Read" ;; esac
  if [ -z "$found" ]; then
    local explicit=$resolved line
    if [ -n "$explicit" ]; then
      while IFS= read -r line; do
        [ -n "$line" ] || continue
        SKILL=$line
        [ -n "$(skill_file)" ] || die "ALLOWED_TOOLS names Skill($line), which is not an installed skill, so it can't be migrated for you: set SKILL=<name> in job.env and install again"
      done <<< "$explicit"
      resolved=$(printf '%s' "$explicit" | awk 'NF && !seen[$0]++')
    else
      resolved=$(grep -i -E 'skill|invoke|run|use' "$JOB/prompt.md" | grep -v -i -E "never|don't|do not|not use|avoid" | grep -oE '[A-Za-z0-9_]+[:-][A-Za-z0-9_:-]+' | sed 's/[:-]*$//' | awk '!seen[$0]++' | while IFS= read -r line; do
        SKILL=$line; [ -n "$(skill_file)" ] && echo "$line"
      done)
    fi
    SKILL=""
    [ -n "$resolved" ] || die "ALLOWED_TOOLS holds Skill and neither a Skill(<name>) entry nor a hyphenated or plugin:name skill in prompt.md is installed, so it can't be migrated for you: $steps"
    [ "$(printf '%s\n' "$resolved" | wc -l | tr -d ' ')" = 1 ] || die "ALLOWED_TOOLS or prompt.md names several installed skills ($(printf '%s' "$resolved" | paste -sd, -)), so it can't pick one: set SKILL=<name> in job.env and install again"
    found=$resolved
  fi
  SKILL=$found
  [ -n "$(skill_file)" ] || die "SKILL=$found is not an installed skill, so the job can't be migrated; job.env is unchanged: set SKILL=<name> to an installed skill and install again"
  SKILL=""
  cp "$JOB/job.env" "$JOB/job.env.pre-migrate"
  {
    printf '\n# Moved off the Skill tool by install (1.496.0). These two lines override the ones above: change tools or the skill here. Old file: job.env.pre-migrate\n'
    printf 'ALLOWED_TOOLS=%q\n' "$kept"
    printf 'SKILL=%q\n' "$found"
  } >> "$JOB/job.env"
  local check
  check=$(set +u; ALLOWED_TOOLS="" SKILL=""; . "$JOB/job.env" >/dev/null 2>&1 && printf '%s\n%s' "$ALLOWED_TOOLS" "$SKILL")
  if [ "$check" != "$kept"$'\n'"$found" ]; then
    cp "$JOB/job.env.pre-migrate" "$JOB/job.env"
    die "migration wrote a job.env that did not load back as expected, so job.env was restored unchanged: $steps"
  fi
  echo "Migrated $NAME: ALLOWED_TOOLS=$kept, SKILL=$found (old file: job.env.pre-migrate). prompt.md is unchanged; each run is told the Skill tool is off and to Read the skill file."
  grep -n -i -E 'skill tool|invoke /|Skill\(' "$JOB/prompt.md" | sed 's/^/  prompt.md still says: /'
  log "migrated: Skill removed, SKILL=$found"
  ALLOWED_TOOLS=$kept SKILL=$found
}

run_claude() {
  local model=$1 prompt_file=$2 schema=$3 contract=$4 out=$5 state
  state=$(cat "$JOB/state.json" 2>/dev/null)
  [ -n "$state" ] || state='{}'
  local pid watchdog rc limit
  {
    cat "$prompt_file"
    printf '\n\n---\nUnattended run by a scheduled watcher (job "%s"). Nobody is at the terminal, so never ask a question, never write to a shared document and never send a message yourself: the watcher sends whatever you return. %s\n\nState saved by the previous run (an empty object means this is the first run):\n%s\n' "$NAME" "$contract" "$state"
  } > "$JOB/.prompt.txt"
  rm -f "$out" "$JOB/.timedout"
  cd "$PROJECT_DIR" || return 1
  local no_tools=()
  [ "${NO_TOOLS:-}" = 1 ] && no_tools=(--tools "" --strict-mcp-config)
  "$CLAUDE_BIN" -p --model "$model" --output-format json ${no_tools[@]+"${no_tools[@]}"} \
    --json-schema "$schema" --permission-mode default --permission-prompts none --allowedTools="$ALLOWED_TOOLS" --disallowedTools="$DENIED_TOOLS" \
    --max-budget-usd "$MAX_BUDGET_USD" --no-session-persistence < "$JOB/.prompt.txt" > "$out" 2>>"$JOB/run.log" &
  pid=$!
  limit="${RUN_TIMEOUT_SEC:-$((RUN_TIMEOUT_MIN * 60))}"
  ( sleep "$limit"; kill -0 "$pid" 2>/dev/null && { echo "$limit" > "$JOB/.timedout"; kill -TERM "$pid"; sleep 10; kill -KILL "$pid"; } ) >/dev/null 2>&1 &
  watchdog=$!
  { wait "$pid"; rc=$?; pkill -P "$watchdog"; kill "$watchdog"; wait "$watchdog"; } 2>/dev/null
  return "$rc"
}

record_failure() {
  local reason=$1 detail=${2:-} n
  n=$(( $(cat "$JOB/fails" 2>/dev/null || echo 0) + 1 ))
  echo "$n" > "$JOB/fails"
  log "FAIL ($n in a row): $reason${detail:+ | $detail}"
  if [ "$n" -eq "$FAIL_ALERT_AFTER" ]; then
    send "The watcher itself is failing ($n runs in a row): $reason. Details in $JOB/run.log" || true
  fi
}

check_result() {
  local out=$1
  if [ -f "$JOB/.timedout" ]; then
    local limit
    limit=$(cat "$JOB/.timedout" 2>/dev/null)
    rm -f "$JOB/.timedout"
    record_failure "claude ran longer than ${limit:-$((RUN_TIMEOUT_MIN * 60))} seconds and was stopped"
    return 1
  fi
  if ! jq -e . "$out" >/dev/null 2>&1; then
    record_failure "claude returned no JSON (exit $2)" "$(tail -c 300 "$JOB/run.log" | tr '\n' ' ')"
    return 1
  fi
  if [ "$(jq -r '.is_error' "$out")" = "true" ] || ! jq -e '.structured_output' "$out" >/dev/null 2>&1; then
    local short
    short="claude reported $(jq -r 'if (.subtype // "success") == "success" then "an error" else .subtype end' "$out")"
    jq -r '.result // ""' "$out" | grep -qi 'auth\|login\|credential\|401' && short="$short (looks like a login problem)"
    record_failure "$short" "$(jq -r '(.result // "") | tostring | .[0:300]' "$out")"
    return 1
  fi
  return 0
}

do_run() {
  local dow hour gate_out main_out cost msg last prev force=0
  dow=$(date +%u); hour=$((10#$(date +%H)))
  if [ "${3:-}" = "--now" ] || [ -f "$JOB/.force" ]; then
    force=1
  elif ! { in_spec "$dow" "$DAYS" && in_spec "$hour" "$HOURS"; }; then
    [ -t 2 ] && echo "watcher: outside DAYS=$DAYS HOURS=$HOURS, nothing run (use: run $NAME --now)" >&2
    exit 0
  fi

  if ! mkdir "$JOB/.lock" 2>/dev/null; then
    if [ -n "$(find "$JOB/.lock" -maxdepth 0 -mmin +60 2>/dev/null)" ]; then
      rmdir "$JOB/.lock" 2>/dev/null; mkdir "$JOB/.lock" 2>/dev/null || exit 0
      log "removed a lock older than 60 minutes"
    else
      [ "$force" = 1 ] && rm -f "$JOB/.force"
      log "skipped: previous run still going"; exit 0
    fi
  fi
  trap 'rmdir "$JOB/.lock" 2>/dev/null' EXIT
  [ "$force" = 1 ] && rm -f "$JOB/.force"

  [ -d "$PROJECT_DIR" ] || { record_failure "project folder $PROJECT_DIR is missing"; exit 1; }
  [ -x "$CLAUDE_BIN" ] || { record_failure "claude not found at $CLAUDE_BIN"; exit 1; }

  if [ -s "$JOB/unsent.txt" ]; then
    if send "$(cat "$JOB/unsent.txt") (held from an earlier check)"; then
      rm -f "$JOB/unsent.txt"
    fi
  fi

  local skill_note="" path
  if [ -n "$SKILL" ]; then
    path=$(skill_file)
    [ -n "$path" ] || { record_failure "skill $SKILL not found in the project, ~/.claude/skills or an installed plugin"; exit 1; }
    skill_note="Read the skill file $path with the Read tool and follow its unattended-run instructions (paths it names are relative to its folder); the Skill tool is off in this run. "
  fi

  if [ -f "$JOB/gate.md" ]; then
    gate_out="$JOB/.gate.json"
    run_claude "$GATE_MODEL" "$JOB/gate.md" \
      '{"type":"object","properties":{"changed":{"type":"boolean"},"state":{"type":"object"}},"required":["changed","state"]}' \
      'Return changed=true when anything might need the full check (including any read that failed, or no earlier value to compare with), and state: the previous state updated with what you just read.' \
      "$gate_out"
    check_result "$gate_out" $? || exit 1
    if [ "$(jq -r '.structured_output.changed' "$gate_out")" != "true" ]; then
      prev=$(cat "$JOB/state.json" 2>/dev/null)
      [ -n "$prev" ] || prev='{}'
      jq --argjson prev "$prev" '($prev // {}) * (.structured_output.state // {})' "$gate_out" > "$JOB/state.json.tmp" 2>/dev/null \
        || jq '.structured_output.state' "$gate_out" > "$JOB/state.json.tmp"
      mv "$JOB/state.json.tmp" "$JOB/state.json"
      cost=$(jq -r '.total_cost_usd // 0' "$gate_out")
      log "quiet (gate, \$$cost)"
      after_success
      exit 0
    fi
  fi

  main_out="$JOB/.main.json"
  run_claude "$MODEL" "$JOB/prompt.md" \
    '{"type":"object","properties":{"alert":{"type":"boolean"},"message":{"type":"string"},"state":{"type":"object"}},"required":["alert","message","state"]}' \
    "$skill_note"'Return alert=true only when something needs the user now; message: the alert text, short and plain, naming the item and who acted, never quoting other people'"'"'s text or personal details (it goes to a third-party chat service); empty when alert is false; state: the full state the next run should start from, so it can tell new from already reported.' \
    "$main_out"
  check_result "$main_out" $? || exit 1

  jq '.structured_output.state' "$main_out" > "$JOB/state.json.tmp" && mv "$JOB/state.json.tmp" "$JOB/state.json"
  cost=$(jq -r '.total_cost_usd // 0' "$main_out")
  if [ "$(jq -r '.structured_output.alert' "$main_out")" = "true" ]; then
    msg=$(jq -r '.structured_output.message' "$main_out")
    [ -n "$msg" ] || msg="Something needs you (the check gave no details; see $JOB/run.log)."
    if send "$msg"; then
      log "ALERT sent (\$$cost): $msg"
    else
      case "$(cat "$JOB/unsent.txt" 2>/dev/null)" in
        *"$msg"*) ;;
        *) if [ ! -s "$JOB/unsent.txt" ]; then printf '%s' "$msg" > "$JOB/unsent.txt"
           elif [ "$(wc -c < "$JOB/unsent.txt")" -lt 3000 ]; then printf '\n%s' "$msg" >> "$JOB/unsent.txt"
           else log "unsent.txt is full, dropped: $msg"; fi ;;
      esac
      log "ALERT held for retry (\$$cost): $msg"
    fi
  else
    log "quiet (\$$cost)"
  fi
  after_success
}

after_success() {
  local n today
  n=$(cat "$JOB/fails" 2>/dev/null || echo 0)
  if [ "$n" -ge "$FAIL_ALERT_AFTER" ]; then
    send "Working again after $n failed runs." || true
  fi
  rm -f "$JOB/fails"
  today=$(date +%F)
  if [ "$HEARTBEAT" = "daily" ] && [ "$(cat "$JOB/heartbeat" 2>/dev/null)" != "$today" ]; then
    send "Watching today, first check OK at $(date +%H:%M). Silence after this means nothing needed you. To stop: ask Claude to stop the $NAME watcher, or run: bash ~/.claude/watchers/bin/watcher.sh uninstall $NAME" && echo "$today" > "$JOB/heartbeat"
  fi
  return 0
}

do_report() {
  [ -s "$JOB/state.json" ] || die "no saved state yet: run $NAME --now first"
  [ -x "$CLAUDE_BIN" ] || die "claude not found at $CLAUDE_BIN"
  [ -d "$PROJECT_DIR" ] || die "PROJECT_DIR $PROJECT_DIR does not exist"
  local out="$JOB/.report.json" last_full last_any msg cost
  last_full=$(grep -E ' (quiet|ALERT)' "$JOB/run.log" 2>/dev/null | grep -v 'gate' | tail -1 | cut -c1-16)
  last_any=$(grep -E ' (quiet|ALERT)' "$JOB/run.log" 2>/dev/null | tail -1 | cut -c1-16)
  {
    cat "$JOB/prompt.md"
    printf '\n\n---\nThis is NOT a check. Do not read any sheet, file or tool. The user asked for a status summary now, built only from the state below, which the watcher saved after its checks. Last full check: %s. Last check of any kind: %s (a gate run only confirms nothing changed). Use the check above only to understand what each state key means. Say nothing about the state itself (baselines, keys, what was carried forward): only what it says about the work. Where you cannot tell what a value means, leave it out rather than guess.\n' "${last_full:-unknown}" "${last_any:-unknown}"
    [ -f "$JOB/report.md" ] && { printf '\nHow to read this job'"'"'s state:\n'; cat "$JOB/report.md"; }
  } > "$JOB/.report-prompt.md"
  local fails_before rc
  fails_before=$(cat "$JOB/fails" 2>/dev/null)
  NO_TOOLS=1 ALLOWED_TOOLS="" run_claude "$GATE_MODEL" "$JOB/.report-prompt.md" \
    '{"type":"object","properties":{"message":{"type":"string"}},"required":["message"]}' \
    'Return message: a plain status summary for a phone, under 900 characters, one short line per item: what is open and whose turn it is, counts rather than lists where a list runs long, the time of the last full check, and a last line saying whether anything needs the user. Never quote other people'"'"'s text or personal details (it goes to a third-party chat service).' \
    "$out"
  rc=$?
  if ! FAIL_ALERT_AFTER=0 check_result "$out" "$rc"; then
    if [ -n "$fails_before" ]; then echo "$fails_before" > "$JOB/fails"; else rm -f "$JOB/fails"; fi
    echo "report failed; see $JOB/run.log" >&2; exit 1
  fi
  msg=$(jq -r '.structured_output.message // empty' "$out")
  cost=$(jq -r '.total_cost_usd // 0' "$out")
  [ -n "$msg" ] || die "the summary came back empty; see $out"
  if send "Status: $msg"; then log "report sent (\$$cost)"; echo "sent"
  else echo "send failed; see $JOB/run.log" >&2; exit 1; fi
}

do_install() {
  [ -d "$PROJECT_DIR" ] || die "PROJECT_DIR $PROJECT_DIR does not exist"
  [ -f "$JOB/prompt.md" ] || die "$JOB/prompt.md missing"
  [ -n "$ALLOWED_TOOLS" ] || die "ALLOWED_TOOLS is empty; name the tools the check needs"
  local tools=",${ALLOWED_TOOLS//[[:space:]]/},"
  case "$tools" in *,Skill,*|*,Skill\(*) migrate_skill_job; tools=",${ALLOWED_TOOLS//[[:space:]]/}," ;; esac
  if [ -n "$SKILL" ]; then
    case "$tools" in *,Read,*) ;; *) die "SKILL is set, so ALLOWED_TOOLS needs a plain Read (a scoped Read(...) may not reach the skill's file)" ;; esac
    [ -n "$(skill_file)" ] || die "skill $SKILL not found in $PROJECT_DIR/.claude/skills, ~/.claude/skills or an installed plugin"
  fi
  [ -x "$CLAUDE_BIN" ] || die "claude not found at $CLAUDE_BIN"
  case "$INTERVAL_MIN" in ''|*[!0-9]*) die "INTERVAL_MIN must be whole minutes" ;; esac
  mkdir -p "$ROOT/bin" "$HOME/Library/LaunchAgents"
  src="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
  if [ "$src" = "$ROOT/bin/watcher.sh" ]; then
    echo "script not refreshed: run install from the plugin's copy (skills/headless-watch/scripts/watcher.sh) to update it"
  elif cmp -s "$src" "$ROOT/bin/watcher.sh"; then
    echo "script unchanged"
  else
    cp "$src" "$ROOT/bin/watcher.sh" && echo "script updated from $src"
  fi
  chmod 700 "$ROOT/bin/watcher.sh"
  if [ "$INTERVAL_MIN" -ge 1 ] && [ "$INTERVAL_MIN" -le 60 ] && [ $((60 % INTERVAL_MIN)) -eq 0 ]; then
    schedule="<key>StartCalendarInterval</key>
  <array>"
    m=0
    while [ "$m" -lt 60 ]; do
      schedule="$schedule<dict><key>Minute</key><integer>$m</integer></dict>"
      m=$((m + INTERVAL_MIN))
    done
    schedule="$schedule</array>"
  else
    schedule="<key>StartInterval</key><integer>$((INTERVAL_MIN * 60))</integer>"
  fi
  cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>$ROOT/bin/watcher.sh</string><string>run</string><string>$NAME</string></array>
  $schedule
  <key>RunAtLoad</key><false/>
  <key>ProcessType</key><string>Background</string>
  <key>StandardOutPath</key><string>$JOB/launchd.log</string>
  <key>StandardErrorPath</key><string>$JOB/launchd.log</string>
</dict>
</plist>
EOF
  plutil -lint "$PLIST" >/dev/null || die "plist failed to validate: $PLIST"
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
  launchctl bootstrap "gui/$(id -u)" "$PLIST" || die "launchctl bootstrap failed"
  echo "installed $LABEL: every $INTERVAL_MIN min, days $DAYS, hours $HOURS"
}

case "$cmd" in
  run) do_run "$@" ;;
  install) do_install ;;
  uninstall)
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
    rm -f "$PLIST"
    echo "removed $LABEL (job folder $JOB kept)" ;;
  kick)
    touch "$JOB/.force"
    if launchctl kickstart -k "gui/$(id -u)/$LABEL"; then echo "started $LABEL now; see $JOB/run.log"
    else rm -f "$JOB/.force"; echo "not started: is $LABEL installed? (watcher.sh install $NAME)" >&2; exit 1; fi ;;
  test-alert) send "Test alert: this is where the watcher's alerts will arrive." && echo "sent" || { echo "send failed; see $JOB/run.log"; exit 1; } ;;
  report) do_report ;;
  status) printf 'scheduled: %s\nfailures: %s\nunsent alert held: %s\n' "$(launchctl print "gui/$(id -u)/$LABEL" >/dev/null 2>&1 && echo yes || echo no)" "$(cat "$JOB/fails" 2>/dev/null || echo 0)" "$([ -s "$JOB/unsent.txt" ] && echo yes || echo no)"; tail -5 "$JOB/run.log" 2>/dev/null ;;
  *) die "unknown command $cmd" ;;
esac
