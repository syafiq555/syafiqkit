# Cutting a real track to the film {#real-track}

**Licence first.** Pixabay Music's Content License allows commercial use with no credit and allows editing; its own summary page says so, and the YouTube Audio Library does not cover ads off YouTube. On each track page, look for "Content ID registered": such a track can be flagged or muted on Facebook, Instagram and YouTube, which matters for paid ads and Google Play but not WhatsApp status. Pixabay answers scripted downloads with 403, so the user downloads the file.

Once the user has downloaded the chosen track:

- **Tempo**: the track need not match `music.bpm`. Find its drop (an energy step in a per-50 ms RMS read) and start the cut so the drop lands on `device.enter`.
- **Mix**: cut the track, then let `score.py` lay the taps, whooshes, chimes and any voice over it, dipping the music under each voice line as it does the generated bed:

```
ffmpeg -ss <offset> -t <duration> -i track.mp3 -ar 48000 -ac 2 -af "afade=t=in:d=0.15,afade=t=out:st=<duration-1.5>:d=1.5" music.wav
python3 score.py cues.json score_raw.wav --track=music.wav
ffmpeg -i score_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -y score.wav
```

The track path is relative to where you run `score.py`. `check` measures this `score.wav` like a generated one. Record the track, its page, the label check and the cut offset in the README.

## Generated bed details {#generated-bed}

The bed runs at the story's `music.bpm` (120 by default, so 0.5 s per beat). `music.mood` sets its character: `bright` (default, upbeat), `calm` (half-time kick, no clap) or `dark` (minor chords), matched to the feeling in the brief.
