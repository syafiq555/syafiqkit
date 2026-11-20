#!/bin/bash
# iOS Safari in the Xcode Simulator: the only local way to see Safari's toolbar (Playwright's WebKit draws none).
#   ios-safari-capture.sh open <url> [device-udid]   boot an iPhone simulator if needed, open <url> in Safari
#   ios-safari-capture.sh shot <file.png>             screenshot the booted simulator at device resolution
# Between shots, drive the Simulator window by hand or with CGEvents (terminal needs macOS Accessibility, Simulator
# in front): scroll-wheel events scroll the page, a drag collapses Safari's toolbar. See references/verification-traps.md.
set -euo pipefail
command -v xcrun >/dev/null || { echo "xcrun not found: install Xcode" >&2; exit 1; }
LAST="${TMPDIR:-/tmp}/ios-safari-capture.udid"
booted() { xcrun simctl list devices booted | grep -E '^ +iPhone' | grep -oE '[0-9A-F-]{36}' | head -1 || true; }
case "${1:-}" in
  open)
    URL=${2:?url}; UDID=${3:-$(booted)}
    if [ -z "$UDID" ]; then
      UDID=$(xcrun simctl list devices available | grep -E '^ +iPhone' | grep -oE '[0-9A-F-]{36}' | head -1 || true)
      [ -n "$UDID" ] || { echo "no iPhone simulator available" >&2; exit 1; }
    fi
    if ! xcrun simctl list devices booted | grep -q "$UDID"; then
      xcrun simctl boot "$UDID"
      open -a Simulator
    fi
    xcrun simctl bootstatus "$UDID" -b >/dev/null
    xcrun simctl openurl "$UDID" "$URL"
    echo "$UDID" >"$LAST"
    echo "opened $URL on $UDID"
    ;;
  shot)
    OUT=${2:?file.png}; mkdir -p "$(dirname "$OUT")"
    UDID=$(cat "$LAST" 2>/dev/null || booted)
    [ -n "$UDID" ] || { echo "no booted iPhone simulator: run 'open' first" >&2; exit 1; }
    xcrun simctl io "$UDID" screenshot "$OUT" >/dev/null
    echo "$OUT"
    ;;
  *) echo "usage: $0 open <url> [udid] | shot <file.png>" >&2; exit 2 ;;
esac
