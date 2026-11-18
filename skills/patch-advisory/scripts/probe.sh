#!/usr/bin/env bash
# Read-only probe, piped over stdin: remote <alias> "SW=nginx bash -s" < probe.sh
# SW software name (default nginx) · VER version flag (default -v) · CFG command showing the precondition
# (nginx default: effective listen/http2 lines; pass CFG= to skip). Writes nothing, restarts nothing.
SW=${SW:-nginx}
VER=${VER:--v}
if [ -z "${CFG+x}" ] && [ "$SW" = nginx ]; then
  CFG="{ o=\$(nginx -T 2>/dev/null </dev/null); [ -n \"\$o\" ] && echo \"\$o\" || { echo 'FILES-NOT-EFFECTIVE:'; find -L /etc/nginx -type f \\( -name '*.conf' -o -path '*enabled*' \\) -exec cat {} + 2>/dev/null; }; } | grep -E '^[[:space:]]*(listen|http2)|FILES-NOT' | sort -u | tr '\n' '|'"
fi
export PATH="$PATH:/usr/sbin:/usr/local/sbin"
S=""; SUDO=root
if [ "$(id -u)" != 0 ]; then
  if sudo -n true 2>/dev/null </dev/null; then S="sudo -n"; SUDO=yes; else SUDO=no; fi
fi
echo "HOST $(hostname) $(hostname -I 2>/dev/null | awk '{print $1}') user=$(id -un) sudo=$SUDO"

CANDS="$(command -v "$SW" 2>/dev/null) /usr/sbin/$SW /usr/local/sbin/$SW /usr/local/bin/$SW /usr/bin/$SW"
BIN=""
for b in $CANDS; do [ -x "$b" ] && { BIN=$b; break; }; done
for b in $CANDS; do [ -x "$b" ] && echo "binary $b: $("$b" $VER 2>&1 </dev/null | head -1)"; done | sort -u
command -v dpkg >/dev/null && dpkg -l "$SW*" 2>/dev/null | awk '/^ii/{print "pkg", $2, $3}'
command -v rpm >/dev/null && rpm -qa 2>/dev/null | grep -i "^$SW" | sed 's/^/pkg /'
ps -eo user,args 2>/dev/null | grep -E "[${SW:0:1}]${SW:1}" | grep -v -e 'bash -s' -e 'grep ' | cut -c1-140 | sort -u | head -8 | sed 's/^/proc /'
[ -n "$CFG" ] && [ -n "$BIN" ] && echo "host-cfg: $($S sh -c "$CFG" 2>/dev/null </dev/null | cut -c1-1500)"

seen=" "
for rt in podman docker; do
  command -v $rt >/dev/null || continue
  modes=plain; [ -n "$S" ] && modes="plain sudo"
  for m in $modes; do
    pre=""; [ "$m" = sudo ] && pre="$S"
    list=$($pre $rt ps --format '{{.Names}} {{.Image}}' 2>/dev/null </dev/null) || { [ "$modes" = plain ] && [ "$SUDO" = no ] && echo "$rt: cannot list containers (no access, no sudo)"; continue; }
    while read -r n i; do
      [ -z "$n" ] && continue
      case "$seen" in *" $rt:$n "*) continue ;; esac
      seen="$seen$rt:$n "
      v=$($pre $rt exec "$n" "$SW" $VER 2>&1 </dev/null) || continue
      echo "$rt:$n ($i): $(echo "$v" | head -1)"
      [ -n "$CFG" ] || continue
      c=$($pre $rt exec "$n" sh -c "$CFG" 2>/dev/null </dev/null) && echo "  cfg: $(echo "$c" | cut -c1-1500)" || echo "  cfg: unreadable (no shell in container)"
    done <<EOF
$list
EOF
  done
done
ss -ltnp 2>/dev/null | awk 'NR>1 && ($4 ~ /:(80|443)$/){print "listen", $4, $6}' | cut -c1-120 | sort -u
exit 0
