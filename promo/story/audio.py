# Hikâyeli reklamın müziği ve efektleri (numpy ile üretilir) → audio.wav
# Yardımcı sesler ../video/audio.py ile aynı.
import numpy as np, wave

SR = 44100
DUR = 42.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(5)

def add(sig, t0, gain=1.0, pan=0.0):
    i0 = int(t0 * SR)
    if i0 >= N: return
    sig = sig[:N - i0]
    l = gain * np.sqrt((1 - pan) / 2); r = gain * np.sqrt((1 + pan) / 2)
    L[i0:i0 + len(sig)] += sig * l
    R[i0:i0 + len(sig)] += sig * r

def tt(d): return np.arange(int(d * SR)) / SR
def hz(note):  # midi -> hz
    return 440.0 * 2 ** ((note - 69) / 12)

def env_ad(d, a, dec):
    t = tt(d); e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / dec)
    return t, e

def lowpass(x, alpha):  # alpha array or scalar in (0,1]
    y = np.zeros_like(x); s = 0.0
    al = np.broadcast_to(alpha, x.shape)
    for i in range(len(x)):
        s += al[i] * (x[i] - s); y[i] = s
    return y

# ---------- SFX ----------
def tap():
    t, e = env_ad(0.09, 0.001, 0.018)
    click = rng.standard_normal(len(t)) * np.exp(-t / 0.003)
    tok = np.sin(2 * np.pi * 1050 * t) * e
    return 0.55 * tok + 0.25 * np.diff(np.concatenate([[0], click]))

def whoosh(d=0.5, up=True):
    n = int(d * SR); x = rng.standard_normal(n)
    p = np.linspace(0, 1, n)
    alpha = (0.02 + 0.25 * (p if up else 1 - p)) ** 1.5
    y = lowpass(x, alpha)
    envl = np.sin(np.pi * p) ** 2
    return y * envl / (np.max(np.abs(y)) + 1e-9)

def buzz():
    t = tt(0.32); f = 160
    sig = sum(np.sin(2 * np.pi * f * k * t) / k for k in (1, 3, 5, 7))
    e = np.minimum(1, t / 0.01) * np.minimum(1, (0.32 - t) / 0.04) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t))
    return sig * e

def bell(notes, d=1.6, dec=0.6):
    t = tt(d); s = np.zeros_like(t)
    for n in notes:
        f = hz(n)
        s += np.sin(2 * np.pi * f * t) * np.exp(-t / dec)
        s += 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / (dec * 0.4))
        s += 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / (dec * 0.2))
    return s * np.minimum(1, t / 0.004)

def ding(n1=83, n2=88, gap=0.12):
    a = bell([n1], 0.9, 0.35); b = bell([n2], 1.1, 0.45)
    out = np.zeros(len(b) + int(gap * SR)); out[:len(a)] += a; out[int(gap * SR):int(gap * SR) + len(b)] += b
    return out

def boom(d=1.0):
    t = tt(d); f = 55 * np.exp(-t * 2.2) + 32
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.35) + 0.25 * lowpass(rng.standard_normal(len(t)), 0.05) * np.exp(-t / 0.12)

def riser(d=1.15):
    t = tt(d); p = t / d
    f = 180 + 900 * p ** 2
    ph = 2 * np.pi * np.cumsum(f) / SR
    n = lowpass(rng.standard_normal(len(t)), 0.02 + 0.3 * p ** 2)
    return (0.4 * np.sin(ph) + n / (np.max(np.abs(n)) + 1e-9)) * p ** 2

def heartbeat():
    t = tt(0.5); s = np.zeros_like(t)
    for off, g in ((0, 1.0), (0.17, 0.7)):
        tt2 = np.maximum(0, t - off)
        s += g * np.sin(2 * np.pi * (48 + 30 * np.exp(-tt2 * 30)) * tt2) * np.exp(-tt2 / 0.09) * (t >= off)
    return s

def pluck(note, d=0.6, dec=0.22):
    t = tt(d); f = hz(note)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.08) + 0.1 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.05)
    return s * np.minimum(1, t / 0.004) * np.exp(-t / dec)

def pad(notes, d):
    t = tt(d); s = np.zeros_like(t)
    for i, n in enumerate(notes):
        f = hz(n)
        s += np.sin(2 * np.pi * f * t + i) + 0.3 * np.sin(2 * np.pi * f * 2.003 * t) + 0.15 * np.sin(2 * np.pi * f * 0.5 * t)
    a = np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.5)
    return s * a / len(notes)

def kick():
    t = tt(0.35); f = 45 + 90 * np.exp(-t * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)


def pop():
    t, e = env_ad(0.12, 0.002, 0.03)
    return np.sin(2 * np.pi * (520 + 900 * np.exp(-t * 40)) * t) * e

# ---------- 1. kaos (0–10.5) ----------
t = tt(10.5); drone = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.4 * t) + 0.3 * np.sin(2 * np.pi * 110.5 * t))
drone *= np.minimum(1, t / 1.2) * np.minimum(1, (10.5 - t) / 0.4)
add(drone, 0.0, 0.09)
for k, bt in enumerate(np.arange(0.3, 10.2, 0.78)):
    add(heartbeat(), bt, 0.26 + 0.02 * min(k, 8))
for nt in (0.8, 1.5, 2.2, 2.9, 3.6):
    add(buzz(), nt, 0.13); add(bell([76], 0.5, 0.15), nt, 0.08)
for st in (1.2, 1.9, 2.6, 3.3):
    add(pop(), st, 0.25)
add(whoosh(0.5, True), 6.0, 0.16)
add(boom(1.2), 6.6, 0.6); add(riser(0.5), 6.15, 0.12)
for i, n in enumerate((67, 65, 63, 60)):  # "unuttum…" inen notalar
    add(pluck(n, 0.7, 0.3), 8.55 + 0.22 * i, 0.16)
add(pop(), 6.5, 0.22); add(pop(), 8.5, 0.22)

# ---------- müzik (10.5–42, 112 bpm) ----------
BEAT = 60 / 112; BAR = BEAT * 4
CH = [[53, 57, 60, 64], [55, 59, 62, 66], [57, 60, 64, 67], [52, 55, 59, 62]]
ARP = [0, 1, 2, 3, 2, 1, 3, 2]
tb = 10.5; bar = 0
while tb < DUR:
    c = CH[bar % 4]; d = min(BAR + 0.5, DUR - tb)
    add(pad([n - 12 for n in c[:3]] + [c[3]], d), tb, 0.055)
    for i in range(8):
        tn = tb + i * BEAT / 2
        if tn >= DUR - 0.2: break
        add(pluck(c[ARP[i]] + 12), tn, 0.07 if tb > 16.9 else 0.045, pan=(-0.35 if i % 2 else 0.35))
    if tb >= 16.9:
        for b in range(4): add(kick(), tb + b * BEAT, 0.2)
    bar += 1; tb += BAR

# ---------- 2-6. olaylar ----------
for w in (10.5, 17.0, 21.0, 28.5, 36.5):
    add(whoosh(0.5, True), w - 0.25, 0.16)
for b in (11.2, 13.5, 14.6, 31.6, 32.4, 34.2):
    add(pop(), b, 0.24)
for tp in (18.1, 18.35):
    add(tap(), tp, 0.5)
add(riser(1.4), 18.3, 0.08)
add(ding(), 19.65, 0.18); add(ding(79, 84), 19.85, 0.15)
sh_t = tt(1.4); sh = sum(np.sin(2 * np.pi * f * sh_t) for f in (1320, 1980, 2640)) * (0.5 + 0.5 * np.sin(2 * np.pi * 12 * sh_t))
sh *= np.minimum(1, sh_t / 0.2) * np.minimum(1, (1.4 - sh_t) / 0.3)
add(sh, 22.1, 0.025)
for i, n in enumerate((79, 84, 88)):
    add(pluck(n, 0.5, 0.12), 23.9 + 0.25 * i, 0.16)
add(ding(), 25.2, 0.22)
for i, at in enumerate((29.4, 30.05, 30.7)):
    add(bell([84 + 2 * i], 0.8, 0.3), at, 0.14)
add(riser(0.9), 30.7, 0.12); add(boom(1.0), 31.55, 0.45)
add(bell([88, 91, 96], 1.2, 0.4), 34.25, 0.1)
add(boom(1.2), 36.55, 0.5)
add(bell([72, 76, 79, 84, 88], 3.0, 1.1), 36.7, 0.18)

mix = np.stack([L, R], 1)
fade = np.ones(N); fade[-int(1.2 * SR):] = np.linspace(1, 0, int(1.2 * SR))
mix *= fade[:, None]
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
mix /= np.max(np.abs(mix)) / 0.89
pcm = (mix * 32767).astype(np.int16)
with wave.open('audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', pcm.shape)
