#!/usr/bin/env bash
# web/ içindeki HTML'lerde kullanılan Tailwind sınıflarından web/assets/site.css üretir.
# HTML'de yeni bir sınıf kullandıktan sonra bunu çalıştırıp çıkan CSS'i de commit'le.
set -euo pipefail
cd "$(dirname "$0")"
npx --yes tailwindcss@3.4.17 -c tailwind.config.js -i input.css -o ../../web/assets/site.css --minify
