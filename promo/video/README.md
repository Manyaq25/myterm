# Tanıtım videosu

Dikey (1080x1920) WhatsApp/Reels tanıtım videosunun kaynağı. Sahneler `index.html` içinde
`window.render(t)` zaman çizelgesiyle çizilir; Playwright her kareyi yakalayıp ffmpeg'e verir.

- `assets/` — uygulama ekran görüntüleri, ikon ve açılış ekranı
- `audio.py` — müzik ve efektleri numpy ile üretir (`audio.wav`)
- `render.js` — kareleri ve videoyu üretir

## Üretme

```
npm install
mkdir -p frames
node render.js preview 1.0 7.5        # seçilen anların önizleme kareleri (frames/)
python3 audio.py                      # audio.wav
node render.js full video_silent.mp4 30
ffmpeg -i video_silent.mp4 -i audio.wav -c:v copy -c:a aac -shortest synvia-ai-reklam.mp4
```

Güncelleme bekleyenler (yol haritasındaki işler bitince): kapanışta Google Play'in yayında
olduğunun gösterilmesi ve yeni özelliklerin eklenmesi.
