"""s6: Can'ın telefonundaki yeşil ekranı (chroma) screen.png ile değiştirir, kare kare izler.
python3 screen_replace.py shots/s6_green.mp4 shots/s6.mp4"""
import sys, subprocess
import cv2, numpy as np
src, out = sys.argv[1], sys.argv[2]
cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS); W = int(cap.get(3)); H = int(cap.get(4))
scr = cv2.imread('screen.png')
sh, sw = scr.shape[:2]
ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
                       '-i', src, '-map', '0:v', '-map', '1:a?', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'copy', out],
                      stdin=subprocess.PIPE)
def order(p):
    p = p.reshape(4, 2).astype(np.float32); s = p.sum(1); d = np.diff(p, axis=1).ravel()
    return np.array([p[np.argmin(s)], p[np.argmin(d)], p[np.argmax(s)], p[np.argmax(d)]], np.float32)
prev = None; n = 0; found = 0
while True:
    ok, f = cap.read()
    if not ok: break
    n += 1
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    m = cv2.inRange(hsv, (40, 90, 70), (85, 255, 255))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    quad = None
    if cs:
        c = max(cs, key=cv2.contourArea)
        if cv2.contourArea(c) > 0.004 * W * H:
            a = cv2.approxPolyDP(cv2.convexHull(c), 0.02 * cv2.arcLength(c, True), True)
            quad = order(a) if len(a) == 4 else order(cv2.boxPoints(cv2.minAreaRect(c)))
    if quad is not None:
        found += 1
        if prev is not None and np.abs(quad - prev).max() < 25: quad = 0.6 * quad + 0.4 * prev  # titremeyi yumuşat
        prev = quad
        M = cv2.getPerspectiveTransform(np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]]), quad)
        warped = cv2.warpPerspective(scr, M, (W, H), flags=cv2.INTER_LINEAR)
        # Yeşil pikseller + izlenen dörtgen: parmak gibi yeşil olmayan şeyler önde kalır.
        poly = np.zeros((H, W), np.uint8); cv2.fillConvexPoly(poly, quad.astype(np.int32), 255)
        green = cv2.inRange(hsv, (35, 60, 50), (90, 255, 255))
        mask = cv2.bitwise_and(cv2.dilate(green, np.ones((5, 5), np.uint8)), poly)
        mask = cv2.GaussianBlur(mask, (5, 5), 0).astype(np.float32)[..., None] / 255
        # Sahnenin ışığına uydur: ekran biraz daha loş ve sıcak.
        warped = np.clip(warped.astype(np.float32) * np.array([0.88, 0.93, 0.98]), 0, 255)
        f = (f * (1 - mask) + warped * mask).astype(np.uint8)
    # Kalan yeşil saçakları gri yap (spill).
    hsv2 = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    sp = cv2.inRange(hsv2, (40, 120, 80), (85, 255, 255)) > 0
    f[sp] = cv2.cvtColor(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)[sp]
    ff.stdin.write(f.tobytes())
ff.stdin.close(); ff.wait()
print(f'frames {n}, screen found in {found}')
