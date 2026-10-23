"""Original music bed and sound effects for a motion clip.

Usage: python3 score.py cues.json out.wav [--sfx-only] [--track=music.wav]

--track replaces the generated bed with an already cut 48 kHz 16-bit track; the
sound effects, the voice and the dip under each voice line work as with the bed.
"""
import json
import os
import sys
import wave

import numpy as np

TRACK = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--track=')), None)
SFX_ONLY = '--sfx-only' in sys.argv or TRACK is not None
args = [a for a in sys.argv[1:] if a != '--sfx-only' and not a.startswith('--track=')]
if not args:
    sys.exit('usage: python3 score.py cues.json [out.wav] [--sfx-only] [--track=music.wav]')
with open(args[0]) as fh:
    cues = json.load(fh)
OUT = args[1] if len(args) > 1 else 'score_raw.wav'

SR = 48000
VOICE_DUCK = 0.35
DUR = float(cues.get('duration', 20))
BEAT = 60 / float(cues.get('bpm', 120))
N = int(SR * DUR)
rng = np.random.default_rng(7)
mix = np.zeros((N, 2))


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def place(start, sig, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i]
    left, right = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    mix[i : i + len(sig), 0] += sig * gain * left
    mix[i : i + len(sig), 1] += sig * gain * right


def music(start, sig, gain=1.0, pan=0.0):
    if not SFX_ONLY:
        place(start, sig, gain, pan)


def env(n, attack, release):
    e = np.ones(max(n, 0))
    a, r = min(int(attack * SR), len(e)), min(int(release * SR), len(e))
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[-r:] *= np.linspace(1, 0, r)
    return e


def tone(freq, length, harmonics=6, tilt=1.6, detune=0.0):
    t = np.arange(int(length * SR)) / SR
    out = np.zeros_like(t)
    for h in range(1, harmonics + 1):
        out += np.sin(2 * np.pi * freq * h * (1 + detune) * t + h) / h ** tilt
    return out


def pad(notes, length):
    out = sum(tone(hz(m), length, 5, 1.8, d) for m in notes for d in (-0.0025, 0.0025))
    t = np.arange(len(out)) / SR
    return out * env(len(out), 0.35, 0.5) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.5 * t))


def pluck(midi, length=0.45):
    n = int(length * SR)
    t = np.arange(n) / SR
    return tone(hz(midi), length, 4, 2.0) * np.exp(-t * 9) * env(n, 0.003, 0.05)


def bass(midi, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * hz(midi) * t) + 0.25 * np.sin(4 * np.pi * hz(midi) * t)
    return s * np.exp(-t * 2.5) * env(n, 0.005, 0.08)


def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 45 + 75 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)


def hat(length=0.05):
    n = int(length * SR)
    return np.diff(rng.standard_normal(n + 1)) * np.exp(-np.arange(n) / SR * 90)


def clap():
    n = int(0.18 * SR)
    noise = np.diff(rng.standard_normal(n + 1))
    t = np.arange(n) / SR
    bursts = sum(np.exp(-np.clip(t - d, 0, None) * 60) * (t >= d) for d in (0, 0.012, 0.024))
    return noise * bursts * 0.5


def whoosh(length, rising=True):
    n = max(int(length * SR), 1)
    noise = rng.standard_normal(n)
    k = np.linspace(40, 6, n) if rising else np.linspace(6, 40, n)
    smooth = np.zeros(n)
    acc = 0.0
    for i in range(n):
        acc += (noise[i] - acc) / k[i]
        smooth[i] = acc
    return smooth * np.sin(np.linspace(0, np.pi, n)) ** 2 * 3


def tap():
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1800 * t) * 0.6 + np.diff(rng.standard_normal(n + 1)) * 0.3) * np.exp(-t * 120)


def bell(midi, length=1.6):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    s = (np.sin(2 * np.pi * f * t)
         + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
         + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 12))
    return s * np.exp(-t * 2.8) * env(n, 0.002, 0.2)


BRIGHT_CHORDS = [
    (53, [57, 60, 64, 65]),
    (57, [57, 60, 64, 67]),
    (58, [58, 62, 65, 69]),
    (60, [60, 64, 67, 69]),
]
MOODS = {
    'bright': {'chords': BRIGHT_CHORDS, 'kick': 0.55, 'clap': 0.18, 'hat': 0.08, 'kick_every': 1,
               'hit_pad': [53, 57, 60, 64, 67], 'end_bass': 41, 'end_pad': [53, 60, 64, 67, 69, 72], 'end_arp': [65, 69, 72, 76]},
    'calm': {'chords': BRIGHT_CHORDS, 'kick': 0.3, 'clap': 0.0, 'hat': 0.04, 'kick_every': 2,
             'hit_pad': [53, 57, 60, 64, 67], 'end_bass': 41, 'end_pad': [53, 60, 64, 67, 69, 72], 'end_arp': [65, 69, 72, 76]},
    'dark': {'chords': [(50, [53, 57, 60, 62]), (58, [58, 62, 65, 69]), (55, [55, 58, 62, 65]), (57, [57, 62, 64, 67])],
             'kick': 0.6, 'clap': 0.14, 'hat': 0.06, 'kick_every': 1,
             'hit_pad': [50, 57, 60, 62, 65], 'end_bass': 38, 'end_pad': [50, 57, 60, 64, 65, 69], 'end_arp': [62, 65, 69, 72]},
}
mood_name = cues.get('mood') or 'bright'
if not isinstance(mood_name, str) or mood_name not in MOODS:
    sys.exit(f'mood must be one of {", ".join(MOODS)}, got {mood_name!r}')
MOOD = MOODS[mood_name]
CHORDS = MOOD['chords']
ending = min(max(float(cues.get('ending', DUR - 2.85)), 0.0), DUR - 0.3)
groove_start, groove_end = cues.get('groove', [2.0, DUR - 6])
groove_end = min(groove_end, ending)
bar_len = 4 * BEAT

bar = 0
while bar * bar_len < ending - 0.1:
    start = bar * bar_len
    root, notes = CHORDS[bar % 4]
    music(start, pad(notes, min(bar_len + 0.4, ending - start + 0.4)), 0.05)
    if groove_start <= start < groove_end:
        for b in range(4):
            music(start + b * BEAT, bass(root - 12, BEAT * 0.95), 0.35)
    arp = notes + [notes[1] + 12]
    if start < groove_end:
        for step in range(8):
            if start < groove_start and step % 2:
                continue
            music(start + step * BEAT / 2, pluck(arp[step % len(arp)] + 12), 0.09, 0.35 if step % 2 else -0.35)
    bar += 1

for b in range(int(groove_end / BEAT)):
    t = b * BEAT
    if t >= groove_start:
        if b % MOOD['kick_every'] == 0:
            music(t, kick(), MOOD['kick'])
        music(t + BEAT / 2, hat(), MOOD['hat'], 0.2)
        if b % 2 and MOOD['clap']:
            music(t, clap(), MOOD['clap'])
    elif t >= cues.get('hats_from', groove_start):
        music(t + BEAT / 2, hat(), 0.05, 0.2)

if 'ticks' in cues:
    tk = cues['ticks']
    for i in range(tk.get('count', 0)):
        place(tk.get('from', 0) + i * tk.get('every', 0.05), pluck(72 + (i % 5) * 2, 0.2), 0.06, (i % 5 - 2) * 0.3)

if 'hit' in cues:
    music(cues['hit'], kick(), 0.5)
    music(cues['hit'], pad(MOOD['hit_pad'], 1.3), 0.05)

tail = max(DUR - ending, 0.1)
music(ending, bass(MOOD['end_bass'], tail - 0.05), 0.4)
music(ending, pad(MOOD['end_pad'], tail - 0.05), 0.06)
for k, m in enumerate(MOOD['end_arp']):
    music(ending + k * BEAT / 2, pluck(m + 12, 1.2), 0.08, (k - 1.5) * 0.3)
place(ending, bell(89, min(2.4, tail)), 0.07)

if 'intro_bell' in cues:
    place(cues['intro_bell'], bell(84, 1.0), 0.05)
for at in cues.get('taps', []):
    place(at, tap(), 0.25)
for w in cues.get('whooshes', []):
    place(w['at'], whoosh(w.get('length', 0.4), w.get('rising', True)), w.get('gain', 0.08), w.get('pan', 0.0))
for c in cues.get('chimes', []):
    place(c['at'], bell(c['note'], c.get('length', 1.6)), c.get('gain', 0.1), c.get('pan', 0.0))

if TRACK:
    with wave.open(TRACK) as w:
        if w.getframerate() != SR or w.getsampwidth() != 2:
            sys.exit(f'{TRACK} must be 48 kHz 16-bit: cut it with ffmpeg -ar 48000 -ac 2')
        data = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
        data = data.reshape(-1, w.getnchannels())
        if data.shape[1] == 1:
            data = np.repeat(data, 2, axis=1)
    data = data[:N, :2]
    tpeak = np.max(np.abs(data)) if len(data) else 0.0
    if tpeak > 0:
        mix[: len(data)] += data / tpeak * 0.8

fade = min(int(1.2 * SR), N)
if fade:
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
peak = np.max(np.abs(mix)) if N else 0.0
if peak > 0:
    mix /= peak / 0.89

voice_lines = cues.get('voice', [])
if voice_lines:
    base = os.path.dirname(os.path.abspath(args[0]))
    duck = np.ones(N)
    voice = np.zeros(N)
    ramp_in, ramp_out = int(0.12 * SR), int(0.3 * SR)
    for line in voice_lines:
        path = os.path.join(base, line['file'])
        if not os.path.exists(path):
            sys.exit(f'voice file missing, run voice.mjs first: {path}')
        with wave.open(path) as w:
            if w.getframerate() != SR or w.getsampwidth() != 2:
                sys.exit(f'{path} must be 48 kHz 16-bit; write it with voice.mjs')
            data = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
            if w.getnchannels() > 1:
                data = data.reshape(-1, w.getnchannels()).mean(axis=1)
        i = int(line['at'] * SR)
        if i >= N or i < 0:
            continue
        data = data[: N - i]
        voice[i : i + len(data)] += data
        shape = np.ones(N)
        a, b = max(i - ramp_in, 0), min(i + len(data), N)
        shape[a:b] = VOICE_DUCK
        shape[a:i] = np.linspace(1, VOICE_DUCK, i - a)
        release = min(ramp_out, N - b)
        shape[b : b + release] = np.linspace(VOICE_DUCK, 1, release)
        duck = np.minimum(duck, shape)
    vpeak = np.max(np.abs(voice))
    if vpeak > 0:
        mix = mix * duck[:, None] + (voice / vpeak * 0.85)[:, None]
        peak = np.max(np.abs(mix))
        if peak > 0.89:
            mix /= peak / 0.89

with wave.open(OUT, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', OUT)
