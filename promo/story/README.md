# Hikâyeli reklam videosu

Dikey (1080x1920), yaklaşık 42 saniyelik çizgi film tarzı reklam. Sahneler `index.html` içinde
`window.render(t)` zaman çizelgesiyle çizilir; karakterler SVG (Can, Deniz, patron Mert, Ayşe, Emre).
Yazı tipleri, ikon ve Playwright `../video/` klasöründen kullanılır (önce orada `npm install`).

Senaryo:
1. **Kaos (0–6 sn):** Pazartesi sabahı Can'ın masasına bildirimler ve yapışkan notlar yağıyor.
2. **Unuttu (6–10,5):** Patron "Can, rapor nerede?" diye geliyor; Can "Unuttum…".
3. **Öneri (10,5–17):** Kahve köşesinde Deniz: "Synvia AI'ı duydun mu? Hadi ikimiz de indirelim!"
4. **İndirme (17–21):** Can iPhone'da App Store'dan, Deniz Android'de Google Play'den indiriyor.
5. **Nasıl çalışır (21–28,5):** Mesajın ekran görüntüsü → yapay zekâ 3 iş buluyor → zamanında bildirim.
6. **Bir hafta sonra (28,5–36,5):** Toplantıda her şey hazır; herkes Can'ın hafızasına şaşırıyor. "Sırrım bu 😉📱"
7. **Kapanış (36,5–42):** İkon, "Unuttuğun hiçbir şey kalmasın.", App Store + Google Play rozetleri, aydinapp.com.tr.

## Üretme

```
mkdir -p frames
node render.js preview 3 7.5 12 19 24 32 40      # önizleme kareleri (frames/)
python3 audio.py                                 # audio.wav
node render.js full story_silent.mp4 30
ffmpeg -i story_silent.mp4 -i audio.wav -c:v copy -c:a aac -shortest synvia-ai-hikaye-reklam.mp4
```
Tarayıcı yolu gerekirse: `CHROME_PATH=/opt/pw-browsers/... node render.js ...`

Not: Kapanışta Google Play rozeti var; uygulama Google Play'de yayına girmeden paylaşılmamalı.
