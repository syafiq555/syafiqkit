# Voice, spoken-word captions and backgrounds

## The local tools {#local-tools}

The free local tools (a natural voice, word timing for captions, depth maps for backgrounds) live in one folder outside the clip, `~/.local/share/motion-clip/venv` (`MOTION_CLIP_HOME` moves it). `sh scripts/setup-local.sh` installs all three, or name parts (`voice`, `captions`, `depth`). It needs Python 3.10 to 3.12 (the voice model does not install on 3.13 or later) and, for the voice, `espeak-ng`, and it prints the Python path the other scripts use (`PY` in the skill). Measured on an M4: about 1.5 GB installed, plus models fetched on first use (word timing about 1.6 GB, voice and depth under 0.5 GB together). Check free disk first, and install only the parts the brief needs. On Apple Silicon the word timing uses MLX Whisper; elsewhere it falls back to faster-whisper.

## Voice-over in the story {#voice-over}

Add `voice: [{ at: 2.6, text: '...' }]` to the story, then generate the lines between `cues` and `score.py`. A word the voice misreads (a brand like `CRP45`, an acronym) gets a `say` beside `text` (`say: 'C R P 45'`): the voice speaks `say` and the subtitles show `text`, never the spelled-out form.

```
node render.mjs cues 1080 1920 cues.json
node voice.mjs cues.json
$PY words.py cues.json          # only with subtitles: true
```

Provider, files and timing are in [#voice](#voice) and [#voice-timing](#voice-timing).

## Voice providers {#voice}

- **Kokoro** (default once installed): a free natural voice running on the machine, Apache-2.0 weights, nothing leaves the laptop. `VOICE` picks the voice (`af_heart` by default; the first letter is the accent, `a` American, `b` British, and `af_`/`am_` are female and male) and `VOICE_SPEED` its pace. At the default 1 it speaks about 4 words a second, too fast to read along with; `VOICE_SPEED=0.8` brought the Autorentic lines to about 3 (measured 2026-10-21), so start there when `subtitles` is on. It can stress a brand name oddly, so the user listens to it before release.
- **A script in a language Kokoro has no voice for** (Malay among them) must not go to Kokoro: an English voice reading it sounds fake to native ears, and its English speech recognition mis-times the subtitles. Measured 27/11/2026 for Malay: Microsoft's ms-MY neural voices through the free `edge-tts` tool and Mesolitica's open Malaysian TTS (runs on Apple Silicon after its codec's hard-coded `.cuda()` calls are pointed at `mps`) both failed the native listener; `edge-tts` output and Mesolitica's model carry no confirmed commercial licence, and ElevenLabs' free plan refuses its library voices (the Malay ones included) through the API, so its Malay voices need a paid plan. Ask before spending turns on free voices: the realistic routes are a human recording, a paid native voice, or English voice-over with the native-language text on screen (where the audience code-mixes).
- **`say`** (macOS, when Kokoro is not installed): proves the wiring and the music dip, never the timing or the release. A real voice speaks at another pace, so after switching, run `voice.mjs` again and re-time.
- **Paid**: only with `VOICE_PROVIDER=elevenlabs` or `openai` and `ELEVENLABS_API_KEY` or `OPENAI_API_KEY`. A key alone never triggers a paid run, because many people have one set for other work. Before the first paid run, tell the user the script text goes to that service and ask whether the copy is cleared to share; an unreleased launch may not be. `VOICE`, `VOICE_MODEL` and `VOICE_STYLE` (OpenAI's speaking instructions) override. Both paid paths follow each provider's documented API and have not been run with a real key: on the first real run, make one line (`VOICE_LINES=1 node voice.mjs cues.json`) and have the user listen before generating the rest.
- With none of these and no paid voice agreed, deliver without voice, say so, and offer the setup or a service.

## Spoken-word captions {#subtitles}

Set `subtitles: true` in the story (or `{ words, size, y, color, highlight, background }`) and, after `voice.mjs`, run `$PY words.py cues.json`. It listens to each voice file, lines the heard words up with the script, and writes `assets/voice/words.json`, so the words keep the script's own spelling and take the voice's timing. A line with a `say` is lined up on what was said and then shown as its `text`: a word spoken as several (`CRP45` said as "C R P 45") takes their whole span. The film shows them three at a time in a pill near the bottom (under the text column in square and widescreen), each lighting up as it is said. The pill is dark (`ink`) with light words (`surface`, lighting up in `accentSoft`) and sized to its words, so it reads as a caption over any picture or page. A pill in the page's own colour vanishes on a light page and leaves the words floating on a blank frame, which a reviewer reads as a missing caption box (27/11/2026, on the Autorentic week 2 films); keep `background` in contrast with what sits behind it.

It prints how many words it heard per line. Words it did not hear are placed between their neighbours, so watch that line in the draft. Run it again whenever a voice file changes, since the timing belongs to that recording. Until `words.json` exists the film renders without them and logs a warning, so `cues`, `board` and the voice can come first; `check` fails while it is missing, older than any voice file, or written for different voice text, so stale captions cannot ship.

Feeds autoplay muted, so a voice-over film carries its words on screen: `subtitles: true` in the story, then `$PY words.py cues.json` after every voice change, which times each word to the recording. With subtitles on, keep headline `captions` short and different from the spoken words; without them, each caption matches its line.

## Generated backgrounds {#images}

`node image.mjs assets/screens/bg_city.png "<prompt>" 1080 1920` uses Cloudflare Workers AI's free daily allowance of 10,000 Neurons, resetting 00:00 UTC. The default model, FLUX.2 Klein 4B (Apache-2.0 weights), costs about 313 Neurons for a 1088x1920 still, so about 30 vertical stills a day; `IMAGE_MODEL=flux-1-schnell` takes no size and gives about 100 square ones. Sizes snap to multiples of 16 between 256 and 1920, and the film crops to fill. It needs `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (a token from the "Workers AI" template under My Profile, API Tokens). The prompt goes to Cloudflare, so ask before sending unreleased product names. A re-run with the same prompt, size and `IMAGE_SEED` reuses the file; change the seed for another take. Say in the README which pictures are generated. When it is unset or spent, fall back to stock and say so.

## Backdrops in the story {#backdrops}

`backdrops: [{ name, from, to, depth, dim, dimColor, zoom, drift, strength, fade }]` fill the whole frame behind everything else, with a slow push-in (`zoom`, default `[1.04, 1.14]`). A backdrop starting at 0 or ending at the film's end does not fade at that edge.

With `depth: true` the picture moves in depth, near things sliding against far ones, from a map made once by `$PY depth.py assets/screens/bg_city.png` (written beside it as `bg_city.depth.png`). It uses Depth Anything V2 Small, the only commercially licensed size: Base, Large and Giant are CC-BY-NC-4.0. A depth map pulls thin edges apart when pushed hard, so keep the default `strength` (0.05) unless a still shows it holds. The depth effect needs WebGL; where the browser has none, the backdrop draws flat and the render logs it.

`dim` (default 0.3) lays the page colour, or `dimColor`, over the picture so text stays readable. Text over a dark backdrop needs a light `color` on its hook lines.

## Voice timing {#voice-timing}

`voice.mjs` prints each line's start and end. It warns when a line runs into the next one, outlasts the caption it starts under, or runs past the end of the film. Move the line or shorten its words; the voice sets the pace and the picture follows. `score.py` lowers the music under each line and puts the voice on top.

Lines are cached in `assets/voice/` and remade only when the text, voice or `VOICE_SPEED` changes, so a re-run doesn't pay twice. A later retime means rewriting the cues and re-rendering what they touched, since the music hits come from the same cues.
