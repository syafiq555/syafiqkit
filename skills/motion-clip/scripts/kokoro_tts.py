import json
import sys
import warnings

warnings.filterwarnings("ignore")

import numpy as np
import soundfile as sf
from kokoro import KPipeline

jobs = json.load(sys.stdin)
voice = jobs["voice"]
pipeline = KPipeline(lang_code=voice[0], repo_id="hexgrad/Kokoro-82M")
for line in jobs["lines"]:
    chunks = [audio for _, _, audio in pipeline(line["text"], voice=voice, speed=jobs["speed"]) if audio is not None]
    if not chunks:
        sys.exit(f"the voice produced no sound for: {line['text'][:60]}")
    sf.write(line["out"], np.concatenate(chunks), 24000, format="WAV")
    print(line["out"], flush=True)
