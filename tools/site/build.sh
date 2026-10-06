#!/usr/bin/env bash
# Synvia sayfalarını şablondan üretir, sonra web/ içindeki HTML'lerde kullanılan Tailwind sınıflarından web/assets/site.css üretir.
# HTML'de yeni bir sınıf kullandıktan sonra bunu çalıştırıp çıkan CSS'i de commit'le.
set -euo pipefail
cd "$(dirname "$0")"
node pages.js
npx --yes tailwindcss@3.4.17 -c tailwind.config.js -i input.css -o ../../web/assets/site.css --minify
