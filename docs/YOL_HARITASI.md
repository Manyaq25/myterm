# Synvia AI — Yol Haritası ve Kararlar

Son güncelleme: 5 Ekim 2026 (yol haritası onaylandı)

## Kalıcı kurallar

- **Güncelleme notları:** Belirgin bir yenilik yoksa genel ifade kullanılır ("Performans ve kararlılık iyileştirmeleri yapıldı"). Düzeltilen hatalar tek tek sayılmaz.
- **Yerel modül içeren değişiklikler** asla yalnızca `eas update` ile gönderilmez; yeni build gerekir. Her güncellemeden önce paketin derlendiği kontrol edilir.
- **AI modeli düşürülmez:** Analiz kalitesi öncelikli. Maliyet başka yollarla düşürülür.
- **`eas update` yalnızca aynı sürüm numaralı build'lere gider** (runtime politikası `appVersion`, 1.1.0'dan beri). App Store'da hâlâ 1.0.x kullananlara acil bir JS düzeltmesi gerekirse, Sentry'den önceki son kod olan `b711a13` üzerine uygulanıp oradan gönderilir:
  `git checkout --detach b711a13` → `git cherry-pick --no-commit <düzeltme>` → `eas update ...` (Runtime: exposdk:54.0.0) → `git reset --hard` → `git checkout main`.
- **Public anahtarlar kodda:** RevenueCat SDK anahtarları ve sunucu adresi `src/config/publicConfig.ts` içinde varsayılan olarak tutulur. `eas update`, `eas.json`'daki `env` bölümünü okumaz; eksik kalırsa iPhone'da premium/satın alma çalışmaz (6 Ekim'de yaşandı ve düzeltildi).
- **Geliştirici premium'u:** Ayarlar → Destek kimliği kopyalanır → RevenueCat → Customers'ta aranır → Grant → premium → Lifetime.

## Onaylanan işler

### Faz 1 — Temel
- [x] **1a** AI hakkı ve premium kontrolü sunucuda (Upstash Redis + RevenueCat doğrulaması). Ücretsiz: ayda 6 istek, **AI Asistan dahil** (karar: tek sayaç). Cihaz kimliği silip yüklemede değişmez; IP başına dakikalık/günlük sınır; eski sürümler 20 Ekim 2026'ya kadar kimliksiz çalışır. Test: `backend/test/quota-e2e.js`.
  - Kalan: shared secret ve App Attest / Play Integrity (kötüye kullanım görülürse).
- [ ] **1b** Önbellek zaten kurulu (Opus 5 için en az 512 token, talimatlar bunun üstünde). Ölçüm başladı: Upstash'te `stats:YYYY-MM-DD` anahtarları (istek, girdi, çıktı, cache_write, cache_read). Birkaç gün sonra karar: önbelleği tut / ayarla / kaldır.
- [x] **1c** Hata raporlama (Sentry, AB bölgesi; org `aydinapp`, proje `react-native`). Yalnızca çökme/hata; ekran görüntüsü, oturum kaydı, kişisel veri, konsol kayıtları yok. 1.1.0 build'iyle gelir.
  - Runtime politikası `appVersion` oldu: `eas update` artık yalnızca aynı sürüm numaralı build'lere gider (yerel modül uyumsuzluğu kaynaklı çökmeler kökten önlendi).
  - Kalan: basit kullanım ölçümü (kaç kişi ilk çıkarımı yapıyor, premium ekranını görüyor vb.) — ayrı bir araç gerekir, sonra.

### Faz 2 — Hızlı kazanımlar
- [ ] **2b** Bildirimden "Tamamlandı / 1 saat ertele / Yarın".
- [ ] **3e** Mutlu anda Apple/Google değerlendirme penceresi (yeni build).

### Faz 3 — Gelir
- [ ] **3b** 7 gün ücretsiz deneme + indirimli yıllık plan (mağaza panellerinde ürün/teklif + premium ekranı).
- [ ] **3d** Ülkeye göre fiyat (yalnızca mağaza panelleri).
- [ ] **3c** Premium paketini yeni özelliklerle zenginleştirmek.
- [ ] **3f** Arkadaşını davet et (+3 AI hakkı) — 1a'dan sonra.
- [ ] **3a** Nazik ve tek seferlik öneriler (3b ve 3f hazır olduktan sonra):
  - İlk başarılı çıkarımdan sonra, kayıt bittikten sonra küçük bir kart: "Arkadaşını davet et (+3 hak)" ve "Premium'u 7 gün ücretsiz dene". Kapat (✕) tuşu var; kapatılınca bir daha gösterilmez. Kartın altında küçük bir not: "Bunu istediğin zaman Ayarlar'dan yapabilirsin."
  - Birkaç kullanımdan sonra (örn. 3. başarılı çıkarım) bir kez premium önerisi, kapat tuşuyla.
  - Her öneri yalnızca bir kez gösterilir (cihazda işaretlenir); her çıkarımdan sonra çıkmaz, reklam havası olmaz. Premium kullanıcılara gösterilmez. Çıkarım sırasında değil, işlem bittikten sonra gelir.
  - Hak dolunca çıkan "Premium'a Geç" penceresi olduğu gibi kalır.
  - Ayarlar'da kalıcı bölüm (yalnızca premium olmayanlara): "Premium'u 7 gün ücretsiz dene" ve "Arkadaşını davet et (+3 hak)". Kart kaçırılsa da kullanıcı istediği zaman ulaşır; kendiliğinden açılmaz. Premium olunca bölüm kaybolur.

### Faz 4 — Büyük özellikler
- [ ] **2d** Tekrarlayan takipler: Yeni Takip'te "Tekrarla" (her gün / hafta / ay), AI "her pazartesi" gibi ifadeleri algılar, tamamlanınca sonraki otomatik oluşur, kartta 🔁. Premium olabilir.
- [ ] **1e** Yedekleme — **B seçeneği seçildi:** telefonun kendi gece yedeğine (iCloud / Google) dahil olmak; hesap gerekmez.
  - Android: `allowBackup="true"` zaten açık. Veritabanının yedeğe girdiği ve geri yüklemede SecureStore'un sorun çıkarmadığı doğrulanacak (expo-secure-store eklentisi app.json'da yok, yedek kuralları eklenmemiş).
  - iOS: SQLite dosyasının iCloud yedeğine dahil olduğu doğrulanacak.
- [ ] **2c** AI ile hatırlatma mesajı: rehber izni olmadan sistemin kişi seçicisiyle "Rehberden seç" (doğru kişiyi kullanıcı seçer, numara kişi kartına bir kez kaydedilir), AI mesaj yazar, WhatsApp hazır açılır. Yeni build gerekir.
  - Kişi seçici, "Galeriden seç" gibi çalışır: pencereyi telefon gösterir, uygulama rehberin tamamını görmez, yalnızca seçilen kişinin numarası gelir. Kurarken izin gerektirmediği iOS ve Android'de doğrulanacak.

### Faz 5 — Tanıtım
- [ ] **Tanıtım videosunu güncellemek** (kaynak: `promo/video/`):
  - Kapanışta Google Play'in de yayında olduğu gösterilecek ("Çok yakında" yerine).
  - Yol haritasındaki yeni özellikler videoya eklenecek (erteleme, bildirimden işlem, tekrarlayan takipler, AI ile hatırlatma mesajı, 7 gün ücretsiz deneme vb.).
  - Sitedeki "Google Play — Yakında" düğmesi de gerçek bağlantıyla değiştirilecek.

## Reddedilen / iptal edilenler
- **1b (ilk hali):** Ucuz modele geçmek — kalite riski.
- **1d:** Kademeli yayın (%10) ve ayrı test sürümü — iptal.
- **1e A / C:** Dosyaya yedek, hesap + sunucu eşitlemesi — B seçildi.
- **2a:** Paylaş menüsünden ekleme — birden fazla mesaj, kişi adı belirsizliği.
- **2e:** Takvim bağlantısı — uygulama tek başına yeterli olmalı.

## Bekleyen dış işler
- App Store 1.0.2 (12 dil + izin metinleri) incelemede.
- Google Play üretim erişimi başvurusu gönderildi; onay gelince Android üretim build'i ve sitedeki "Google Play — Yakında" düğmesinin güncellenmesi.
