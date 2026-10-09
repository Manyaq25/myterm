"""Gerçek insanlı reklamı birleştirir: sahneler (shots/s1..s6.mp4) + grafik bölümler (build/app.mp4, build/end.mp4)
+ altyazılar (build/caps/*.png, caps.json) + müzik (shots/music.wav) -> synvia-ai-reklam-gercek.mp4"""
import json, subprocess, os
B = 'build'
# (kaynak, başlangıç, süre)
SEGS = [('s1b', 0.0, 2.4), ('s1can', 0.0, 2.5), ('s1off', 0.1, 2.9),
        ('s2can', 1.0, 3.0), ('s2deniz', 0.9, 5.4), ('s3', 0.8, 6.2), ('app', 0, 5.0),
        ('s4a', 0.6, 3.8), ('s4c', 0.0, 3.6), ('s5b', 0.0, 5.6), ('s6', 0.8, 5.6), ('end', 0, 5.5)]
# s6'nın kendi sesinde ritim (bas davul) var: alçak frekansları kesiyoruz.
AUDIO = {'s6': 'highpass=f=260,',
         # s4a'nın başında kime ait olduğu belli olmayan bir ses var: replikten önce kısıyoruz.
         's4a': "volume='if(lt(t,2.3)+gt(t,3.75),0.08,1)':eval=frame,"}
caps = json.load(open('caps.json'))
# Bazı sahnelerde üstte/altta siyah bant var (cropdetect): kırpıp dikey kareyi dolduruyoruz.
BARS = {'s2': (1056, 112), 's3': (1092, 94), 's5': (1058, 102), 's5b': (1054, 112), 's4a': (1074, 98), 's1can': (1104, 88), 's2deniz': (1084, 98), 's2can': (1080, 100)}
def run(cmd): subprocess.run(cmd, check=True)
parts = []
for name, ss, dur in SEGS:
    out = f'{B}/seg_{name}.mp4'
    if name in ('app', 'end'):
        run(['ffmpeg', '-v', 'error', '-y', '-i', f'{B}/{name}.mp4', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
             '-t', str(dur), '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30',
             '-c:a', 'aac', '-b:a', '192k', out])
    else:
        mine = [(i, c) for i, c in enumerate(caps) if c['seg'] == name]
        inputs = ['-ss', str(ss), '-t', str(dur), '-i', f'shots/{name}.mp4']
        for i, _ in mine: inputs += ['-i', f'{B}/caps/cap{i:02d}.png']
        crop = ''
        if name in BARS:
            h, y = BARS[name]
            crop = f'crop=720:{h-6}:0:{y+3},scale=-2:1920:flags=lanczos,crop=1080:1920,'
        fc = f'[0:v]{crop}scale=1080:1920:flags=lanczos,setsar=1,eq=saturation=1.05[v0]'
        last = 'v0'
        for k, (i, c) in enumerate(mine):
            a, b = c['a'] - ss, c['b'] - ss
            fc += f';[{last}][{k+1}:v]overlay=0:0:enable=\'between(t,{max(a,0):.2f},{b:.2f})\'[v{k+1}]'
            last = f'v{k+1}'
        fc += f';[0:a]{AUDIO.get(name, "")}aresample=48000,afade=t=in:d=0.05,afade=t=out:st={dur-0.12:.2f}:d=0.12[a]'
        run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', fc, '-map', f'[{last}]', '-map', '[a]',
             '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-ac', '2', out])
    parts.append(out)
open(f'{B}/list.txt', 'w').write(''.join(f"file '{os.path.basename(p)}'\n" for p in parts))
run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'{B}/list.txt', '-c', 'copy', f'{B}/cut.mp4'])
# Müzik: diyaloglar boyunca alçak, uygulama ve kapanış bölümlerinde yükselir.
t = 0; marks = {}
for name, ss, dur in SEGS: marks[name] = (t, t + dur); t += dur
total = t
a0, a1 = marks['app']; e0, _ = marks['end']
vol = (f"if(between(t,{a0-0.4:.2f},{a1+0.3:.2f}),0.55,if(gte(t,{e0-0.3:.2f}),0.6,0.13))")
fc = (f"[1:a]atrim=0:{total:.2f},volume='{vol}':eval=frame,afade=t=in:d=1.0,afade=t=out:st={total-1.6:.2f}:d=1.6[m];"
      f"[0:a]volume=1.15[d];[d][m]amix=inputs=2:duration=first:normalize=0,volume=0.8,alimiter=limit=0.9[a]")
run(['ffmpeg', '-v', 'error', '-y', '-i', f'{B}/cut.mp4', '-i', 'shots/music.wav', '-filter_complex', fc,
     '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
     'synvia-ai-reklam-gercek.mp4'])
print('total', round(total, 2), marks)
