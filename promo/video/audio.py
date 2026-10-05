import numpy as np, wave

SR = 44100
DUR = 44.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(3)

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

# ---------- Act A: tension ----------
t = tt(7.5); drone = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.4 * t) + 0.3 * np.sin(2 * np.pi * 110.5 * t))
drone *= np.minimum(1, t / 1.5) * (0.5 + 0.5 * t / 7.5) * np.minimum(1, (7.5 - t) / 0.3)
add(drone, 0.0, 0.10)
for k, bt in enumerate(np.arange(0.4, 6.9, 0.82)):
    add(heartbeat(), bt, 0.32 + 0.03 * k)
for nt in (0.75, 1.55, 2.35, 3.15):
    add(buzz(), nt, 0.16); add(buzz(), nt + 0.42, 0.11)
    add(bell([76], 0.5, 0.15), nt, 0.10)
add(riser(), 6.42, 0.22)
add(boom(), 7.55, 0.65)
add(bell([84, 88, 91, 96], 2.5, 0.9), 7.72, 0.16)

# ---------- music bed (110 bpm) ----------
BEAT = 60 / 110; BAR = BEAT * 4
CH = [[53, 57, 60, 64], [55, 59, 62, 64], [52, 55, 59, 62], [57, 60, 64, 67]]  # Fmaj7 G6 Em7 Am7
ARP = [0, 1, 2, 3, 2, 1, 3, 2]
start = 7.75; end = DUR
bar = 0; tb = start
while tb < end:
    c = CH[bar % 4]
    d = min(BAR + 0.5, end - tb)
    add(pad([n - 12 for n in c[:3]] + [c[3]], d), tb, 0.06)
    for i in range(8):
        tn = tb + i * BEAT / 2
        if tn >= end - 0.2: break
        n = c[ARP[i]] + 12
        add(pluck(n), tn, 0.075 if tb > 10.5 else 0.04, pan=(-0.35 if i % 2 else 0.35))
    if 27.4 <= tb < 35.0 or tb >= 38.2:
        for b in range(4):
            add(kick(), tb + b * BEAT, 0.22)
    bar += 1; tb += BAR

# ---------- taps & UI ----------
for at in (12.9, 14.3, 15.3, 16.6, 18.0, 22.6, 28.25, 30.15, 32.05, 33.95):
    add(tap(), at - 0.01, 0.55)
for w in (9.6, 13.05, 15.4, 20.4, 23.5, 27.05, 27.4, 29.3, 31.2, 33.1, 35.0):
    add(whoosh(0.5, True), w - 0.08, 0.16)
for w in (16.85, 37.85):
    add(whoosh(0.5, False), w - 0.05, 0.16)
# scan shimmer
t = tt(2.25); sh = sum(np.sin(2 * np.pi * f * t) for f in (1320, 1980, 2640)) * (0.5 + 0.5 * np.sin(2 * np.pi * 12 * t))
sh *= np.minimum(1, t / 0.2) * np.minimum(1, (2.25 - t) / 0.3)
add(sh, 18.1, 0.025)
for i, n in enumerate((79, 84, 88)):
    add(pluck(n, 0.5, 0.12), 20.85 + 0.3 * i, 0.16)
for i, n in enumerate((84, 88, 91, 96)):
    add(bell([n], 1.2, 0.4), 22.65 + 0.06 * i, 0.12)
add(ding(), 24.72, 0.22)
add(bell([81], 0.4, 0.08), 28.3, 0.12)  # rec start beep
for nt in (35.55, 36.25, 36.95):
    add(ding(79, 84), nt, 0.14)
add(boom(1.2), 38.1, 0.55)
add(bell([72, 76, 79, 84, 88], 3.0, 1.1), 38.22, 0.18)
t = tt(1.6); sp = sum(np.sin(2 * np.pi * f * t) for f in (2093, 2637, 3136)) * np.exp(-t / 0.5) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t))
add(sp, 39.05, 0.03)

# ---------- master ----------
mix = np.stack([L, R], 1)
fade = np.ones(N); fade[-int(1.2 * SR):] = np.linspace(1, 0, int(1.2 * SR))
mix *= fade[:, None]
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
mix /= np.max(np.abs(mix)) / 0.89
pcm = (mix * 32767).astype(np.int16)
with wave.open('audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', pcm.shape)
