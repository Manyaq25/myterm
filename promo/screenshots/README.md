# Mağaza ekran görüntüleri

## Türkçe (tr)
Kaynak: `raw/` (iPhone 16 Pro Max'ten alınmış ham görüntüler, kurgusal demo verisi).
Başlıklar `shots.html` içindeki `SHOTS`, el yazısı notlar `NOTES` içinde.

## Diğer diller (en, de, fr, es, it, pt, ru, ar, ja, ko, zh)
Ekranlar uygulamanın **web sürümünden** çekilir; her dilde gerçek arayüz görünür (`raw-web/<dil>/`).
- `web/content.js`: dil başına kurgusal demo veriler, başlıklar ve not metinleri
- `web/build-web.sh`: uygulamanın geçici web derlemesi (node_modules/metro/kaynak dosyalara geçici yama yapar, sonra geri alır)
- `web/serve.js <dist>`: derlemeyi 8099 portunda gerekli başlıklarla sunar (SQLite için)
- `web/capture.js <dil>`: 8 ekranı çeker, notların konumunu ekrandaki öğelerden ölçer (`raw-web/<dil>/notes.js`)
- `web/make-i18n.js`: başlık/not metinlerini `web/i18n.js`'e yazar

Korece/Çince/Arapça için sistemde Noto Sans KR/SC/Arabic yazı tipleri gerekir (`~/.fonts`).

## Çıktılar
| Klasör | Nereye | Ölçü |
|---|---|---|
| `out/appstore/<dil>-NN.png` | App Store Connect → iPhone 6.9" | 1320×2868 |
| `out/appstore-6.3/<dil>-NN.png` | App Store Connect → iPhone (medium display) | 1206×2622 |
| `out/play/<dil>-NN.png` | Play Console → Telefon ekran görüntüleri | 1080×1920 |

App Store dil eşlemesi: en → English (U.S./U.K./Canada/Australia), es → Spanish (Mexico/Spain),
pt → Portuguese (Brazil/Portugal), zh → Chinese (Simplified), nl (Dutch) → en görselleri.

## Yeniden üretme
```
(cd ../video && npm install)        # Playwright + Plus Jakarta Sans
npm install                          # Caveat el yazısı fontu
node render.js tr                    # Türkçe
# diğer diller:
npm --prefix ../.. install --no-save react-native-web@~0.21.0
bash web/build-web.sh && node web/serve.js $TMPDIR/synvia-web/webdist &
node web/capture.js en && node web/make-i18n.js && node render.js en
```

Not: Rusça için uygulama yazı tipine Kiril harfi yok; capture.js Noto Sans'ı `/_fonts` üzerinden ekler
(woff dosyalarını derleme klasörünün `_fonts/` alt klasörüne kopyala).
