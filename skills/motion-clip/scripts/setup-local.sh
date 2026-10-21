#!/bin/sh
set -eu

home="${MOTION_CLIP_HOME:-$HOME/.local/share/motion-clip}"
venv="$home/venv"
parts="${*:-voice captions depth}"

py=""
for candidate in python3.12 python3.11 python3.10 /opt/homebrew/bin/python3.12 /opt/homebrew/bin/python3.11 /opt/homebrew/bin/python3.10; do
  if command -v "$candidate" >/dev/null 2>&1; then py="$(command -v "$candidate")"; break; fi
done
if [ -z "$py" ]; then
  echo "needs Python 3.10 to 3.12 (the voice model does not install on 3.13 or later): on macOS 'brew install python@3.12', on Debian or Ubuntu 'apt install python3.12-venv' (or uv: 'uv python install 3.12')" >&2
  exit 1
fi

if [ ! -x "$venv/bin/python" ]; then
  echo "making $venv with $py" >&2
  mkdir -p "$home"
  "$py" -m venv "$venv"
fi
pip() { "$venv/bin/python" -m pip "$@"; }
pip install --quiet --upgrade pip

apple_silicon=no
[ "$(uname -s)" = Darwin ] && [ "$(uname -m)" = arm64 ] && apple_silicon=yes

for part in $parts; do
  case "$part" in
    voice)
      command -v espeak-ng >/dev/null 2>&1 || { echo "the voice needs espeak-ng: on macOS run 'brew install espeak-ng', on Debian or Ubuntu 'apt install espeak-ng'" >&2; exit 1; }
      pip install --quiet "kokoro>=0.9" soundfile
      "$venv/bin/python" -m spacy download en_core_web_sm >/dev/null 2>&1 || true
      ;;
    captions)
      if [ "$apple_silicon" = yes ]; then pip install --quiet mlx-whisper; else pip install --quiet faster-whisper; fi
      ;;
    depth)
      if [ "$(uname -s)" = Darwin ]; then pip install --quiet torch; else pip install --quiet torch --index-url https://download.pytorch.org/whl/cpu; fi
      pip install --quiet transformers pillow
      ;;
    *)
      echo "unknown part '$part': choose from voice, captions, depth" >&2
      exit 1
      ;;
  esac
  echo "installed: $part" >&2
done

echo "$venv/bin/python"
