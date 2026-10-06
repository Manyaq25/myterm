# App Store başlık ve arama sonucu görselleri

App Store Connect → **Asset Library** (ve ürün sayfası → Header and Search Results) için.
Kaynak: `assets.html` (uygulamanın gerçek tasarımıyla çizilmiş arayüz, dile göre metin), `render.js`.

| Dosya | Nereye | Ölçü |
|---|---|---|
| `out/header-<dil>.png` | Product page header (görsel) | 3840×1646 (21:9) |
| `out/header-<dil>.mp4` | Product page header (video, 12 sn, sessiz döngü) | 3840×1646, 30 fps |
| `out/search-<dil>.png` | Search results (görsel) | 3840×2560 (3:2) |
| `out/search-<dil>.mp4` | Search results (video, 10 sn, sessiz döngü) | 3840×2560, 30 fps |

Kurallar (Apple): fiyat, web adresi, başka platform logosu, ödül ifadesi yok. Başlıkta önemli
içerik ortada ve üstte (iPhone kenarları kırpar, alta uygulama adı ve "Al" düğmesi biner).
Yüklemeden önce App Store Connect'teki önizleme aracıyla iPhone/iPad ve karanlık modda kontrol et.

## Yeniden üretme

```
cd ../video && npm install && cd ../store-assets
node render.js still header tr     # out/header-tr.png
node render.js video search en     # out/search-en.mp4
```

Yeni dil: `assets.html` içindeki `S` sözlüğüne dil ekle (başlık iki satırı geçerse kendiliğinden küçülür).
