"""s6: Can'ın telefonundaki yeşil ekranı (chroma) screen.png ile değiştirir.
İki geçiş: önce her karede ekranın dört köşesi bulunur ve zaman içinde yumuşatılır (kayma/titreme olmasın),
sonra görüntü yerleştirilir. Görünen kenar gerçek yeşil alandan gelir; içerik hafif büyütülüp maskeyle kırpılır.
Hafif bulanıklık, kontrast düşürme, cam yansıması ve gren eklenir ki montaj gibi durmasın.
python3 screen_replace.py shots/s6g.mp4 shots/s6.mp4"""
import sys, subprocess
import cv2, numpy as np
src, out = sys.argv[1], sys.argv[2]
cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS); W = int(cap.get(3)); H = int(cap.get(4))
frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
def order(p):
    p = p.reshape(-1, 2).astype(np.float32); s = p.sum(1); d = np.diff(p, axis=1).ravel()
    return np.array([p[np.argmin(s)], p[np.argmin(d)], p[np.argmax(s)], p[np.argmax(d)]], np.float32)
def green_mask(f, lo=(40, 90, 70)):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    return cv2.inRange(hsv, lo, (85, 255, 255))
quads = []
for f in frames:
    m = cv2.morphologyEx(green_mask(f), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    q = None
    if cs:
        c = max(cs, key=cv2.contourArea)
        if cv2.contourArea(c) > 0.004 * W * H:
            q = order(cv2.boxPoints(cv2.minAreaRect(c)))
    quads.append(q)
# Eksik kareleri komşulardan doldur, sonra köşeleri zamanda Gauss ile yumuşat.
idx = [i for i, q in enumerate(quads) if q is not None]
Q = np.array([quads[i] if quads[i] is not None else quads[min(idx, key=lambda j: abs(j - i))] for i in range(len(quads))])
k = np.exp(-0.5 * (np.arange(-6, 7) / 2.2) ** 2); k /= k.sum()
pad = np.concatenate([np.repeat(Q[:1], 6, 0), Q, np.repeat(Q[-1:], 6, 0)])
Qs = np.array([np.tensordot(k, pad[i:i + 13], axes=(0, 0)) for i in range(len(Q))]).astype(np.float32)
scr = cv2.imread('screen.png'); sh, sw = scr.shape[:2]
# İçeriği maskeden biraz büyük yerleştir: kenarlar her zaman gerçek ekran sınırından gelsin.
grow = 0.04
srcq = np.float32([[-sw * grow, -sh * grow], [sw * (1 + grow), -sh * grow], [sw * (1 + grow), sh * (1 + grow)], [-sw * grow, sh * (1 + grow)]])
yy, xx = np.mgrid[0:sh, 0:sw]
glare = np.clip(1 - np.abs((xx / sw * 0.8 + yy / sh) - 0.5) / 0.45, 0, 1)[..., None] ** 2 * 16  # çapraz cam yansıması
scr_f = np.clip(scr.astype(np.float32) * 0.86 + 14 + glare, 0, 255).astype(np.uint8)
scr_f = cv2.GaussianBlur(scr_f, (0, 0), 1.1)
rng = np.random.default_rng(3)
ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
                       '-i', src, '-map', '0:v', '-map', '1:a?', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'copy', out],
                      stdin=subprocess.PIPE)
for f, q in zip(frames, Qs):
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]]), q)
    big = cv2.getPerspectiveTransform(np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]]), cv2.perspectiveTransform(srcq[None], M)[0].astype(np.float32))
    warped = cv2.warpPerspective(scr_f, big, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
    g = cv2.morphologyEx(green_mask(f, (35, 110, 90)), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    cs, _ = cv2.findContours(g, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    poly = np.zeros((H, W), np.uint8)
    if cs: cv2.drawContours(poly, [max(cs, key=cv2.contourArea)], -1, 255, -1)
    # Gömleğin yeşilimsi pikselleri bezel üzerinden ekrana bağlanmasın: yumuşatılmış dikdörtgenle sınırla.
    rect = np.zeros((H, W), np.uint8); cv2.fillConvexPoly(rect, np.round(q).astype(np.int32), 255)
    poly = cv2.bitwise_and(poly, cv2.erode(rect, np.ones((3, 3), np.uint8)))
    nong = cv2.bitwise_and(poly, cv2.bitwise_not(cv2.dilate(g, np.ones((3, 3), np.uint8))))
    n, lab, st, _ = cv2.connectedComponentsWithStats(nong)
    mask = poly.copy()
    for i in range(1, n):  # ekranın önüne giren parmak gibi büyük yeşil olmayan alanlar önde kalsın
        if st[i, cv2.CC_STAT_AREA] > 900: mask[lab == i] = 0
    mask = cv2.erode(mask, np.ones((3, 3), np.uint8))
    a = cv2.GaussianBlur(mask, (0, 0), 1.0).astype(np.float32)[..., None] / 255
    warped += rng.normal(0, 3.0, warped.shape).astype(np.float32)  # sahnedeki grenle uyum
    o = f * (1 - a) + warped * a
    o = np.clip(o, 0, 255).astype(np.uint8)
    # Yeşil saçağı temizle (despill): yeşil kanal, kırmızı ve mavinin büyüğünü geçmesin; açık gri çizgi kalmasın.
    near = cv2.dilate(poly, np.ones((25, 25), np.uint8)) > 0
    b, gch, r = o[..., 0].astype(np.int16), o[..., 1].astype(np.int16), o[..., 2].astype(np.int16)
    lim = np.maximum(b, r)
    fix = near & (gch > lim + 8)
    o[..., 1][fix] = lim[fix].astype(np.uint8)
    dark = near & (mask == 0) & (gch > lim + 40)  # bezel içindeki yoğun yeşil: siyaha yakın
    o[dark] = (o[dark] * 0.25).astype(np.uint8)
    ff.stdin.write(o.tobytes())
ff.stdin.close(); ff.wait()
print(f'frames {len(frames)}, detected {len(idx)}')
