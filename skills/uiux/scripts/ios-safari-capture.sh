#!/bin/bash
# iOS Safari in the Xcode Simulator: the only local way to see Safari's toolbar (Playwright's WebKit draws none).
#   ios-safari-capture.sh open <url> [device-udid]   boot an iPhone simulator if needed, open <url> in Safari
#   ios-safari-capture.sh shot <file.png>             screenshot the booted simulator at device resolution
# Driving it (the terminal app needs macOS Accessibility; each command brings Simulator to the front):
#   ios-safari-capture.sh scroll <pixels>             scroll the page (negative = down); the toolbar stays expanded
#   ios-safari-capture.sh collapse                    drag up mid-screen: collapses Safari's toolbar (wait ~1s after a tap)
#   ios-safari-capture.sh tap <x> <y>                 click at macOS screen coordinates (see `window`)
#   ios-safari-capture.sh type <text>                 type into the focused field
#   ios-safari-capture.sh window                      print the Simulator window's screen position and size
set -euo pipefail
command -v xcrun >/dev/null || { echo "xcrun not found: install Xcode" >&2; exit 1; }
LAST="${TMPDIR:-/tmp}/ios-safari-capture.udid"
DRIVER="${XDG_CACHE_HOME:-$HOME/.cache}/syafiqkit/sim-drive"
booted() { xcrun simctl list devices booted | grep -E '^ +iPhone' | grep -oE '[0-9A-F-]{36}' | head -1 || true; }
front() { osascript -e 'tell application "Simulator" to activate' >/dev/null; sleep 0.3; }
bounds() { osascript -e 'tell application "System Events" to tell process "Simulator" to get {position, size} of window 1' | tr -d ' '; }
driver() {
  if [ ! -x "$DRIVER" ]; then
    mkdir -p "$(dirname "$DRIVER")"
    cat >"$DRIVER.swift" <<'SWIFT'
import Foundation
import CoreGraphics
let a = CommandLine.arguments
let n = a.dropFirst(2).compactMap { Double($0) }
func post(_ t: CGEventType, _ p: CGPoint) {
  CGEvent(mouseEventSource: nil, mouseType: t, mouseCursorPosition: p, mouseButton: .left)?.post(tap: .cghidEventTap)
}
switch a[1] {
case "tap":
  let p = CGPoint(x: n[0], y: n[1]); post(.mouseMoved, p); usleep(50000); post(.leftMouseDown, p); usleep(80000); post(.leftMouseUp, p)
case "drag":
  let s = CGPoint(x: n[0], y: n[1]), e = CGPoint(x: n[2], y: n[3])
  post(.mouseMoved, s); usleep(50000); post(.leftMouseDown, s)
  for i in 1...25 { let f = Double(i) / 25; post(.leftMouseDragged, CGPoint(x: s.x + (e.x - s.x) * f, y: s.y + (e.y - s.y) * f)); usleep(16000) }
  usleep(100000); post(.leftMouseUp, e)
case "scroll":
  post(.mouseMoved, CGPoint(x: n[0], y: n[1])); usleep(50000)
  let step: Int32 = n[2] < 0 ? -15 : 15
  for _ in 0..<max(1, Int(abs(n[2]) / 15)) { CGEvent(scrollWheelEvent2Source: nil, units: .pixel, wheelCount: 1, wheel1: step, wheel2: 0, wheel3: 0)?.post(tap: .cghidEventTap); usleep(16000) }
default: exit(2)
}
SWIFT
    swiftc -O "$DRIVER.swift" -o "$DRIVER" || { echo "could not build the CGEvent driver (needs swiftc from Xcode)" >&2; exit 1; }
  fi
  "$DRIVER" "$@"
}
centre() { IFS=, read -r X Y W H <<<"$(bounds)"; CX=$((X + W / 2)); CY=$((Y + H / 2)); }
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
    HERD_CA="$HOME/Library/Application Support/Herd/config/valet/CA/LaravelValetCASelfSigned.pem"
    case "$URL" in https://*.test*) [ -f "$HERD_CA" ] && xcrun simctl keychain "$UDID" add-root-cert "$HERD_CA" ;; esac
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
  window) front; bounds ;;
  scroll) front; centre; driver scroll "$CX" "$CY" "${2:?pixels}" ;;
  collapse) front; centre; driver drag "$CX" $((CY + H / 6)) "$CX" $((CY - H / 4)) ;;
  tap) front; driver tap "${2:?x}" "${3:?y}" ;;
  type) front; osascript -e "tell application \"System Events\" to keystroke \"${2:?text}\"" ;;
  *) echo "usage: $0 open <url> [udid] | shot <file.png> | scroll <px> | collapse | tap <x> <y> | type <text> | window" >&2; exit 2 ;;
esac
