#!/bin/sh
plugin_root=${1%/}
versions_dir=$(/usr/bin/dirname "$plugin_root")

case "$versions_dir" in
  */plugins/cache/syafiqkit/syafiqkit)
    /usr/bin/find "$versions_dir" -mindepth 2 -maxdepth 2 -type f -name .orphaned_at -mtime +7 2>/dev/null |
      while IFS= read -r marker; do
        case "$marker" in
          "$versions_dir"/*/.orphaned_at) ;;
          *) continue ;;
        esac
        old_version=$(/usr/bin/dirname "$marker")
        [ "$old_version" != "$plugin_root" ] || continue
        /bin/rm -rf -- "$old_version"
      done
    ;;
esac

[ -n "$HOME" ] || exit 0
cache="$HOME/.claude/doc-pane-cache"
[ -d "$cache" ] || exit 0

/usr/bin/find "$cache/typeset" -maxdepth 1 -name '*.ok' -mtime +7 2>/dev/null |
  while IFS= read -r done_marker; do
    key=${done_marker%.ok}
    /bin/rm -f -- "$done_marker" "$key".json "$key"-*.png
  done

/usr/bin/find "$cache/typeset" -maxdepth 1 \( -name '*.png' -o -name '*.json' \) -mtime +7 2>/dev/null |
  while IFS= read -r stray; do
    stem=${stray%.*}
    stem=${stem%-[0-9]*}
    [ -e "$stem.ok" ] || /bin/rm -f -- "$stray"
  done
/usr/bin/find "$cache/answers" -maxdepth 1 -type f -mtime +7 -delete 2>/dev/null
/usr/bin/find "$cache" -maxdepth 1 -name '*.jpg' -mtime +7 -delete 2>/dev/null

exit 0
