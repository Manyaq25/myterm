# Synvia AI — Yol Haritası ve Kararlar

Son güncelleme: 5 Ekim 2026 (yol haritası onaylandı)

## Kalıcı kurallar

- **Güncelleme notları:** Belirgin bir yenilik yoksa genel ifade kullanılır ("Performans ve kararlılık iyileştirmeleri yapıldı"). Düzeltilen hatalar tek tek sayılmaz.
- **Yerel modül içeren değişiklikler** asla yalnızca `eas update` ile gönderilmez; yeni build gerekir. Her güncellemeden önce paketin derlendiği kontrol edilir.
- **AI modeli düşürülmez:** Analiz kalitesi öncelikli. Maliyet başka yollarla düşürülür.

## Onaylanan işler

### Faz 1 — Temel
- [ ] **1a** AI hakkı ve premium kontrolünü sunucuya taşımak (silip yükleyince hak sıfırlanmasın, sunucuya dışarıdan istek atılamasın). Ertelenen güvenlik düzeltmeleriyle birlikte.
- [ ] **1b** Sabit talimatları önbelleğe alarak maliyeti düşürmek (kalite aynı kalır). Önce çıkarım başına gerçek maliyet ölçülecek.
- [ ] **1c** Hata raporlama (Sentry) ve basit kullanım ölçümü. Yeni build gerekir; kullanıcının Sentry hesabı açması gerekir.

### Faz 2 — Hızlı kazanımlar
- [ ] **2b** Bildirimden "Tamamlandı / 1 saat ertele / Yarın".
- [ ] **3e** Mutlu anda Apple/Google değerlendirme penceresi (yeni build).

### Faz 3 — Gelir
- [ ] **3b** 7 gün ücretsiz deneme + indirimli yıllık plan (mağaza panellerinde ürün/teklif + premium ekranı).
- [ ] **3d** Ülkeye göre fiyat (yalnızca mağaza panelleri).
- [ ] **3c** Premium paketini yeni özelliklerle zenginleştirmek.
- [ ] **3a** Nazik ve tek seferlik öneriler (3b ve 3f hazır olduktan sonra):
  - İlk başarılı çıkarımdan sonra, kayıt bittikten sonra küçük bir kart: "Arkadaşını davet et (+3 hak)" ve "Premium'u 7 gün ücretsiz dene". Kapat (✕) tuşu var; kapatılınca bir daha gösterilmez.
  - Birkaç kullanımdan sonra (örn. 3. başarılı çıkarım) bir kez premium önerisi, kapat tuşuyla.
  - Her öneri yalnızca bir kez gösterilir (cihazda işaretlenir); her çıkarımdan sonra çıkmaz, reklam havası olmaz. Premium kullanıcılara gösterilmez. Çıkarım sırasında değil, işlem bittikten sonra gelir.
  - Hak dolunca çıkan "Premium'a Geç" penceresi olduğu gibi kalır.

### Faz 4 — Büyük özellikler
- [ ] **2d** Tekrarlayan takipler: Yeni Takip'te "Tekrarla" (her gün / hafta / ay), AI "her pazartesi" gibi ifadeleri algılar, tamamlanınca sonraki otomatik oluşur, kartta 🔁. Premium olabilir.
- [ ] **1e** Yedekleme — **B seçeneği seçildi:** telefonun kendi gece yedeğine (iCloud / Google) dahil olmak; hesap gerekmez.
  - Android: `allowBackup="true"` zaten açık. Veritabanının yedeğe girdiği ve geri yüklemede SecureStore'un sorun çıkarmadığı doğrulanacak (expo-secure-store eklentisi app.json'da yok, yedek kuralları eklenmemiş).
  - iOS: SQLite dosyasının iCloud yedeğine dahil olduğu doğrulanacak.
- [ ] **2c** AI ile hatırlatma mesajı: rehber izni olmadan sistemin kişi seçicisiyle "Rehberden seç" (doğru kişiyi kullanıcı seçer, numara kişi kartına bir kez kaydedilir), AI mesaj yazar, WhatsApp hazır açılır. Yeni build gerekir.
  - Kişi seçici, "Galeriden seç" gibi çalışır: pencereyi telefon gösterir, uygulama rehberin tamamını görmez, yalnızca seçilen kişinin numarası gelir. Kurarken izin gerektirmediği iOS ve Android'de doğrulanacak.
- [ ] **3f** Arkadaşını davet et (+3 AI hakkı) — 1a'dan sonra.

## Reddedilen / iptal edilenler
- **1b (ilk hali):** Ucuz modele geçmek — kalite riski.
- **1d:** Kademeli yayın (%10) ve ayrı test sürümü — iptal.
- **1e A / C:** Dosyaya yedek, hesap + sunucu eşitlemesi — B seçildi.
- **2a:** Paylaş menüsünden ekleme — birden fazla mesaj, kişi adı belirsizliği.
- **2e:** Takvim bağlantısı — uygulama tek başına yeterli olmalı.

## Bekleyen dış işler
- App Store 1.0.2 (12 dil + izin metinleri) incelemede.
- Google Play üretim erişimi başvurusu gönderildi; onay gelince Android üretim build'i ve sitedeki "Google Play — Yakında" düğmesinin güncellenmesi.
