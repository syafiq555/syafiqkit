import difflib
import json
import os
import re
import sys
import warnings

warnings.filterwarnings("ignore")

cues_path = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "cues.json")
out_path = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(cues_path), "assets/voice/words.json"))
base = os.path.dirname(cues_path)
with open(cues_path) as f:
    lines = json.load(f).get("voice") or []
if not lines:
    sys.exit("the cues have no voice lines: add voice: [{ at, text }] to the story, write the cues and run voice.mjs first")

try:
    import mlx_whisper

    model = os.environ.get("WHISPER_MODEL", "mlx-community/whisper-large-v3-turbo")

    def heard(path):
        result = mlx_whisper.transcribe(path, path_or_hf_repo=model, word_timestamps=True, language="en")
        return [(w["word"], w["start"], w["end"]) for s in result["segments"] for w in s.get("words", [])]
except ImportError:
    from faster_whisper import WhisperModel

    whisper = WhisperModel(os.environ.get("WHISPER_MODEL", "small"), compute_type="int8")

    def heard(path):
        segments, _ = whisper.transcribe(path, word_timestamps=True, language="en")
        return [(w.word, w.start, w.end) for s in segments for w in s.words]

norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())

result = []
for n, line in enumerate(lines, 1):
    path = os.path.join(base, line["file"])
    if not os.path.exists(path):
        sys.exit(f"line {n} has no voice file at {line['file']}: run voice.mjs first")
    said = heard(path)
    script = line["text"].split()
    times = [None] * len(script)
    matcher = difflib.SequenceMatcher(a=[norm(w) for w in script], b=[norm(w) for w, _, _ in said], autojunk=False)
    for block in matcher.get_matching_blocks():
        for k in range(block.size):
            _, start, end = said[block.b + k]
            times[block.a + k] = (start, end)
    matched = sum(t is not None for t in times)
    span = (said[0][1], said[-1][2]) if said else (0.0, 0.0)
    k = 0
    while k < len(times):
        if times[k] is not None:
            k += 1
            continue
        run_end = k
        while run_end < len(times) and times[run_end] is None:
            run_end += 1
        prev = times[k - 1][1] if k else span[0]
        nxt = times[run_end][0] if run_end < len(times) else span[1]
        step = max(0.0, nxt - prev) / (run_end - k)
        for j in range(k, run_end):
            times[j] = (prev + step * (j - k), prev + step * (j - k + 1))
        k = run_end
    words = [{"text": w, "start": round(line["at"] + s, 3), "end": round(line["at"] + e, 3)} for w, (s, e) in zip(script, times)]
    result.append({"at": line["at"], "text": line["text"], "words": words})
    if not words:
        print(f"{n:2}  no words in the script text, nothing to show")
        continue
    flag ="" if matched == len(script) else f"  (heard {matched} of {len(script)} words; the rest are placed between their neighbours, so check this line)"
    print(f"{n:2}  {words[0]['start']:.2f}-{words[-1]['end']:.2f} s  {len(script)} words{flag}")

os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, "w") as f:
    json.dump(result, f, indent=2)
    f.write("\n")
print(f"wrote {os.path.relpath(out_path, base)}")
