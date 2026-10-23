# Cutting a real track to the film {#real-track}

SKILL.md §5 covers the licence check. Once the user has downloaded the chosen track:

- **Tempo**: the track need not match `music.bpm`. Find its drop (an energy step in a per-50 ms RMS read) and start the cut so the drop lands on `device.enter`.
- **Mix**: cut the track, then let `score.py` lay the taps, whooshes, chimes and any voice over it, dipping the music under each voice line as it does the generated bed:

```
ffmpeg -ss <offset> -t <duration> -i track.mp3 -ar 48000 -ac 2 -af "afade=t=in:d=0.15,afade=t=out:st=<duration-1.5>:d=1.5" music.wav
python3 score.py cues.json score_raw.wav --track=music.wav
ffmpeg -i score_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -y score.wav
```

The track path is relative to where you run `score.py`. `check` measures this `score.wav` like a generated one. Record the track, its page, the label check and the cut offset in the README.
