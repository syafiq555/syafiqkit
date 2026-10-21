# Cutting a real track to the film {#real-track}

SKILL.md §5 covers the licence check. Once the user has downloaded the chosen track:

- **Tempo**: the track need not match `music.bpm`. Find its drop (an energy step in a per-50 ms RMS read) and start the cut so the drop lands on `device.enter`.
- **Mix**: keep the taps, whooshes and chimes with `python3 score.py cues.json sfx.wav --sfx-only`, then:

```
ffmpeg -ss <offset> -t <duration> -i track.mp3 -ar 48000 -ac 2 -af "afade=t=in:d=0.15,afade=t=out:st=<duration-1.5>:d=1.5" music.wav
ffmpeg -i music.wav -i sfx.wav -filter_complex "[1]volume=0.55[s];[0][s]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -y score.wav
```

`check` measures this `score.wav` like a generated one. Record the track, its page, the label check and the cut offset in the README.
