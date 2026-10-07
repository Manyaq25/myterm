#!/usr/bin/env bash
# Sayfaları şablondan üretir, sonra web/ içindeki HTML'lerde kullanılan Tailwind sınıflarından web/assets/site.css üretir.
# HTML'de yeni bir sınıf kullandıktan ya da store.js'i değiştirdikten sonra bunu çalıştırıp
# çıkan dosyaları da commit'le (CSS/JS bağlantılarındaki sürüm etiketi burada güncellenir).
set -euo pipefail
cd "$(dirname "$0")"
node pages.js
npx --yes tailwindcss@3.4.17 -c tailwind.config.js -i input.css -o ../../web/assets/site.css --minify
node version-assets.js
