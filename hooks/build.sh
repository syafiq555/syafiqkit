#!/bin/sh
# Joins hooks/src/**/*.js into hooks/register.js, the single file the host loads.
# core/constants.js goes first (other fragments build values from it at load time), mod.js last
# (it holds `register`), the rest in sorted path order.
# Run after editing anything under hooks/src/. Pass --check to fail instead of writing when register.js is stale.
set -e
dir=$(cd "$(dirname "$0")" && pwd)
tmp=$(mktemp)
first=1
join() {
	[ "$first" = 1 ] || echo >> "$tmp"
	cat "$1" >> "$tmp"
	first=0
}
join "$dir/src/core/constants.js"
for f in $(find "$dir/src" -name '*.js' | LC_ALL=C sort); do
	case "$f" in */core/constants.js | */src/mod.js) continue ;; esac
	join "$f"
done
join "$dir/src/mod.js"
if [ "$1" = "--check" ]; then
	cmp -s "$tmp" "$dir/register.js" && rm -f "$tmp" && exit 0
	rm -f "$tmp"
	echo "hooks/register.js is stale: run hooks/build.sh" >&2
	exit 1
fi
mv "$tmp" "$dir/register.js"
