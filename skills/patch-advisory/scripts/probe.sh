#!/usr/bin/env bash
# Read-only probe for one piece of software on one host, piped over stdin:
#   remote <alias> "bash -s" < probe.sh            (defaults: nginx)
#   remote <alias> "SW=php CFG='' bash -s" < probe.sh
# SW   binary name to look for (nginx, php, node, openssl, redis-server ...)
# VER  flag that prints its version (default -v)
# CFG  optional: a command whose output shows whether the vulnerable feature is on,
#      run on the host and inside each container that has SW (default for nginx:
#      the effective config's listen/http2 lines)
SW=${SW:-nginx}
VER=${VER:--v}
if [ -z "${CFG+x}" ] && [ "$SW" = nginx ]; then
  CFG="{ o=\$(nginx -T 2>/dev/null); [ -n \"\$o\" ] && echo \"\$o\" || { echo 'FILES-NOT-EFFECTIVE:'; find -L /etc/nginx -type f \\( -name '*.conf' -o -path '*enabled*' \\) -exec cat {} + 2>/dev/null; }; } | grep -E '^[[:space:]]*(listen|http2)|FILES-NOT' | grep -v '#' | sort -u | tr '\n' '|'"
fi
S=""; [ "$(id -u)" != 0 ] && S="sudo -n"
echo "HOST $(hostname) $(hostname -I 2>/dev/null | awk '{print $1}') user=$(id -un) sudo=$($S true 2>/dev/null && echo yes || echo no)"
BIN=""
for b in "$(command -v "$SW" 2>/dev/null)" /usr/sbin/$SW /usr/local/sbin/$SW /usr/local/bin/$SW /usr/bin/$SW; do
  [ -n "$b" ] && [ -x "$b" ] && { BIN=${BIN:-$b}; echo "binary $b: $($b $VER 2>&1 | head -1)"; }
done > /tmp/.probe.$$; sort -u /tmp/.probe.$$; rm -f /tmp/.probe.$$
export PATH="$PATH:/usr/sbin:/usr/local/sbin"
command -v dpkg >/dev/null && dpkg -l "$SW" "$SW-*" 2>/dev/null | awk '/^ii/{print "pkg", $2, $3}'
command -v rpm >/dev/null && rpm -qa 2>/dev/null | grep -i "^$SW" | sed 's/^/pkg /'
ps -eo user,args | grep -E "[${SW:0:1}]${SW:1}" | grep -v probe | cut -c1-140 | sort -u | head -5 | sed 's/^/proc /'
[ -n "$CFG" ] && [ -n "$BIN" ] && echo "host-cfg: $(eval "$CFG" 2>/dev/null | cut -c1-400)"
for rt in podman docker; do
  command -v $rt >/dev/null || continue
  $S $rt ps --format '{{.Names}} {{.Image}}' 2>/dev/null | while read -r n i; do
    v=$($S $rt exec "$n" sh -c "command -v $SW >/dev/null && $SW $VER 2>&1 | head -1" 2>/dev/null)
    [ -z "$v" ] && continue
    echo "$rt:$n ($i): $v"
    [ -n "$CFG" ] && echo "  cfg: $($S $rt exec "$n" sh -c "$CFG" 2>/dev/null | cut -c1-400)"
  done
done
ss -ltnp 2>/dev/null | awk 'NR>1 && ($4 ~ /:(80|443)$/){print "listen", $4, $6}' | cut -c1-120 | sort -u
exit 0
