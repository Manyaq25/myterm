# Mağaza ekran görüntüleri

Kaynak: `raw/` (iPhone 16 Pro Max'ten alınmış ham görüntüler, kurgusal demo verisi),
`shots.html` (çerçeve + başlık tasarımı; başlıklar `SHOTS`, el yazısı notlar ve oklar `NOTES` içinde), `render.js`.

| Klasör | Nereye | Ölçü |
|---|---|---|
| `out/appstore/tr-01..08.png` | App Store Connect → iPhone 6.9" | 1320×2868 |
| `out/play/tr-01..08.png` | Play Console → Ana mağaza girişi → Telefon ekran görüntüleri | 1080×1920 (9:16) |

Telefon çerçevesi markasız; üstteki operatör/saat çubuğu kırpılıp sade bir "9:41 + pil" çubuğu çizilir,
bu yüzden aynı iPhone görüntüleri Google Play için de kullanılabilir. Bildirim (kilit ekranı) görüntüsü
platforma göre farklı göründüğü için sete konmadı.

## Yeniden üretme

```
(cd ../video && npm install)   # Playwright + Plus Jakarta Sans (store-assets ile ortak)
npm install                     # Caveat el yazısı fontu
node render.js tr
```
