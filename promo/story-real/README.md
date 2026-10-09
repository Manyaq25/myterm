# Gerçek insanlı reklam (Synvia AI)

Hikâye: Can işleri unutur, müdür Mert bozulur ("Offff...") → arkadaşı Deniz Synvia AI'ı önerir → Can akşam dener →
ertesi sabah rapor hazırdır → Ayşe ile Emre şaşırır → "Sır değil... Synvia AI." → App Store + Google Play kapanışı.

- Sahneler: vidIQ (Veo 3.1 fast, 8 sn, 9:16, 720p, Türkçe sesli). İstemler aşağıda; her sahne 240 kredi.
- Grafik: `gfx.html` (uygulama ara bölümü, kapanış, altyazılar) → `render.js`.
- Birleştirme: `build.py` (kırpma, altyazı, müzik, ses seviyesi). Çıktı: `synvia-ai-reklam-gercek.mp4` (~50 sn, 1080x1920).

## Yeniden üretmek
1. Sahneleri `shots/s1.mp4 … s6.mp4`, müziği `shots/music.wav` olarak koy (vidIQ çıktısı; `vidiq_video_upload` ile alınan
   storage.googleapis.com bağlantısından indirilebilir, videogen.vidiq.com bu ortamda engelli).
2. `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node render.js caps caps.json build/caps`
3. `node render.js video app build/app.mp4` ve `node render.js video end build/end.mp4`
4. `python3 build.py`

Altyazı zamanları (`caps.json`) ses enerjisine göre ayarlandı; sahne değişirse yeniden kontrol edilmeli.

## Sahneler (9 Ekim 2026)
| # | Kim | Replik |
|---|---|---|
| s1b | Mert / Can / Mert | "Can, rapor nerede? Müşteri bekliyor!" / "Eyvah... unuttum." / "Offff..." |
| s2 | Can / Deniz | "Yine unuttum... Her şeyi unutuyorum." / "Synvia AI'yı dene. Söz verdiğin her işi o hatırlatıyor." |
| s3 | Can | "Vay... Hepsini kendisi çıkardı!" |
| s4a | Mert | (Can raporu uzatır) "Daha istememiştim bile!" |
| s4c | Can | "Dün hallettim." |
| s5b | Ayşe / Emre | "Can'a ne oldu? Hiçbir şeyi unutmuyor!" / "Hafızası bilgisayar gibi!" |
| s6 | Can | "Sır değil... Synvia AI." |

Karakterler her istemde aynı tarifle yazıldı (Can: 20'lerinin sonunda, koyu kahve kısa saç, hafif sakal, petrol mavisi gömlek;
Mert: 50'lerinin ortası, geriye taranmış gri saç, ince metal gözlük, lacivert takım, bordo kravat; Deniz: omuz hizası dalgalı
kestane saç, hardal sarısı kazak). Yüzler sahneden sahneye biraz değişebiliyor (referans görsel kullanılmadı).

## 2. tur düzeltmeleri (9 Ekim)
- s1b: müdürün "Offff"u şaşkın değil, belli belirsiz morali bozuk.
- s4 ikiye bölündü (s4a müdür, s4c Can): iki konuşmacı aynı sahnedeyken Veo replikleri karıştırıyordu.
  s4a'nın başındaki sahipsiz ses `build.py` içinde kısılıyor.
- s5b: Can arka planda masasında oturuyor (dosya kaybolma bozulması yok).
- s6: telefon ekranı yeşil (chroma) üretildi; `screen_replace.py` kare kare izleyip `screen.png`yi
  (`screen.html`: logo + "Synvia AI") yerleştiriyor: `python3 screen_replace.py shots/s6g.mp4 shots/s6.mp4`.
  OpenCV gerekir (`pip install opencv-python-headless`).
