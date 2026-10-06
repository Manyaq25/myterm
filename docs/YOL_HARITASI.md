# Synvia AI — Yol Haritası ve Kararlar

Son güncelleme: 6 Ekim 2026 (1.1.1: kalan yerel modüller tek build'de)

## Kalıcı kurallar

- **Güncelleme notları:** Belirgin bir yenilik yoksa genel ifade kullanılır ("Performans ve kararlılık iyileştirmeleri yapıldı"). Düzeltilen hatalar tek tek sayılmaz.
- **Yerel modül içeren değişiklikler** asla yalnızca `eas update` ile gönderilmez; yeni build gerekir. Her güncellemeden önce paketin derlendiği kontrol edilir.
- **AI modeli düşürülmez:** Analiz kalitesi öncelikli. Maliyet başka yollarla düşürülür.
- **`eas update` yalnızca aynı sürüm numaralı build'lere gider** (runtime politikası `appVersion`, 1.1.0'dan beri). App Store'da hâlâ 1.0.x kullananlara acil bir JS düzeltmesi gerekirse, Sentry'den önceki son kod olan `b711a13` üzerine uygulanıp oradan gönderilir:
  `git checkout --detach b711a13` → `git cherry-pick --no-commit <düzeltme>` → `eas update ...` (Runtime: exposdk:54.0.0) → `git reset --hard` → `git checkout main`.
- **Public anahtarlar kodda:** RevenueCat SDK anahtarları ve sunucu adresi `src/config/publicConfig.ts` içinde varsayılan olarak tutulur. `eas update`, `eas.json`'daki `env` bölümünü okumaz; eksik kalırsa iPhone'da premium/satın alma çalışmaz (6 Ekim'de yaşandı ve düzeltildi).
- **Geliştirici premium'u:** Ayarlar → Destek kimliği kopyalanır → RevenueCat → Customers'ta aranır → Grant → premium → Lifetime.

## 1.1.1 build'i — yerel hazırlık
Kalan özelliklerin ihtiyaç duyduğu yerel parçalar tek build'e kondu; özelliklerin kendisi sonradan `eas update` ile gelir:
- `expo-store-review` (3e değerlendirme penceresi).
- `expo-contacts` (2c "Rehberden seç"). iOS'ta sistem seçicisi izin istemez; izin metni 12 dilde eklendi. Android'de rehber izinleri şimdilik kapalı (READ/WRITE_CONTACTS engelli).
- Android yedek kuralları (1e-B): her şey yedeklenir, yalnızca SecureStore hariç (`plugins/withAndroidBackupRules.js`).
- 1.1.0 (14) incelemeye gönderilmez; mağazaya 1.1.1 gider.

## Onaylanan işler

### Faz 1 — Temel
- [x] **1a** AI hakkı ve premium kontrolü sunucuda (Upstash Redis + RevenueCat doğrulaması). Ücretsiz: ayda 6 istek, **AI Asistan dahil** (karar: tek sayaç). Cihaz kimliği silip yüklemede değişmez; IP başına dakikalık/günlük sınır; eski sürümler 20 Ekim 2026'ya kadar kimliksiz çalışır. Test: `backend/test/quota-e2e.js`.
  - Kalan: shared secret ve App Attest / Play Integrity (kötüye kullanım görülürse).
- [ ] **1b** Önbellek zaten kurulu (Opus 5 için en az 512 token, talimatlar bunun üstünde). Ölçüm başladı: Upstash'te `stats:YYYY-MM-DD` anahtarları (istek, girdi, çıktı, cache_write, cache_read). Birkaç gün sonra karar: önbelleği tut / ayarla / kaldır.
- [x] **1c** Hata raporlama (Sentry, AB bölgesi; org `aydinapp`, proje `react-native`). Yalnızca çökme/hata; ekran görüntüsü, oturum kaydı, kişisel veri, konsol kayıtları yok. 1.1.0 build'iyle gelir.
  - Runtime politikası `appVersion` oldu: `eas update` artık yalnızca aynı sürüm numaralı build'lere gider (yerel modül uyumsuzluğu kaynaklı çökmeler kökten önlendi).
  - Kalan: basit kullanım ölçümü (kaç kişi ilk çıkarımı yapıyor, premium ekranını görüyor vb.) — ayrı bir araç gerekir, sonra.

### Faz 2 — Hızlı kazanımlar
- [x] **2b** Bildirimden "Tamamlandı / 1 saat ertele / Yarın" (kod hazır, yayın: 1.1.1 onayından sonra `eas update`).
  - Düğmeler uygulamayı açar (uygulama kapalıyken arka plan düğmeleri işlenmiyor). Ertele yalnızca hatırlatmayı kaydırır; Yarın takibi yarına aynı saate taşır. Günlük toplu bildirimde düğme yok.
  - Bildirime dokununca takibin detayı açılır. Bildirim metinleri artık 12 dilde (önceden hep Türkçeydi).
  - Eski hatırlatmalar ilk açılışta bir kez yeniden kurulur ki onlarda da düğme çıksın.
- [x] **3e** Değerlendirme penceresi (kod hazır, yayın: 2b ile birlikte). Kullanıcı 3 takibi kendisi tamamladığında, ilk kullanımdan en az 2 gün sonra, 120 günde en fazla bir kez sistem penceresi istenir. 3a'daki premium önerisiyle çakışmaz (o çıkarıma bağlı).

- [x] **Dil düzeltmesi** (yol haritası dışı, 6 Ekim): AI çıktıları her dilde Türkçeydi. Artık başlık/not, asistan cevabı ve sesli not deşifresi uygulama dilinde (`X-App-Language`). Sunucu yayında; uygulama tarafı 2b ile aynı `eas update`'te.

### Faz 3 — Gelir
- [ ] **3b** 7 gün ücretsiz deneme + indirimli yıllık plan.
  - [x] Premium ekranı: deneme tanımlıysa ve kullanıcı uygunsa "7 gün ücretsiz, ardından ₺X / ay" + "Ücretsiz denemeyi başlat". Uygunluk belirsizse gösterilmez.
  - [ ] Mağaza panelleri: App Store Connect'te aylık ve yıllık aboneliğe "Introductory Offer → Free, 1 week"; Play Console'da temel plana 7 günlük ücretsiz deneme teklifi (yeni müşteriler).
  - **Ertelendi (6 Ekim, kullanıcı kararı):** Fiyat ve deneme ayarları uygulama yoğun kullanılmaya başlayınca yapılacak. Kararlaştırılan fiyatlar: Türkiye ₺99/ay, ₺799/yıl; diğer ülkeler $1.99/ay, $15.99/yıl (Apple diğer ülkelere kendisi çevirir). Ücretsiz 6 hak/ay deneme varken de kalır (deneme tek seferlik, kart ister).
- [ ] **3d** Ülkeye göre fiyat: 3b'deki iki fiyat bölgesiyle aynı karar, aynı zamanda yapılacak. Not: AI maliyeti dolar, gelir yerel para; Premium sınırsız olduğu için 1b ölçümüyle kullanıcı başı maliyete bakılıp gerekirse cömert bir adil kullanım sınırı konacak.
- [ ] **3c** Premium paketini yeni özelliklerle zenginleştirmek.
- [x] **3f** Arkadaşını davet et (kod hazır; sunucu yayında, uygulama 2b ile aynı `eas update`'te).
  - Yalnızca davet eden kazanır (+3 AI hakkı, en fazla 10 davet = 30 hak). Davet edilen ödül almaz; kendi kodunu paylaşarak kazanabilir.
  - Ayarlar → "Arkadaşını davet et": kod, davet sayısı, ek hak, "Davet et" (paylaşım metni + aydinapp.com.tr). "Davet kodu gir" satırı herkese açık, cihaz başına bir kez.
  - Ek haklar aylık hak bitince kullanılır, ay geçince silinmez. Kötüye kullanıma karşı: kendi kodu girilemez, IP başına günde 5 kod girişi.
  - Sunucu: `/api/referral` (status / redeem), Redis anahtarları `ref:*`, `bonus:*`. Gizlilik politikasına "Arkadaşını Davet Et" bölümü eklendi (sitenin yayınlanması gerekiyor).
- [ ] **3a** Nazik ve tek seferlik öneriler (3b ve 3f hazır olduktan sonra):
  - İlk başarılı çıkarımdan sonra, kayıt bittikten sonra küçük bir kart: "Arkadaşını davet et (+3 hak)" ve "Premium'u 7 gün ücretsiz dene". Kapat (✕) tuşu var; kapatılınca bir daha gösterilmez. Kartın altında küçük bir not: "Bunu istediğin zaman Ayarlar'dan yapabilirsin."
  - Birkaç kullanımdan sonra (örn. 3. başarılı çıkarım) bir kez premium önerisi, kapat tuşuyla.
  - Her öneri yalnızca bir kez gösterilir (cihazda işaretlenir); her çıkarımdan sonra çıkmaz, reklam havası olmaz. Premium kullanıcılara gösterilmez. Çıkarım sırasında değil, işlem bittikten sonra gelir.
  - Hak dolunca çıkan "Premium'a Geç" penceresi olduğu gibi kalır.
  - Ayarlar'da kalıcı bölüm (yalnızca premium olmayanlara): "Premium'u 7 gün ücretsiz dene" ve "Arkadaşını davet et (+3 hak)". Kart kaçırılsa da kullanıcı istediği zaman ulaşır; kendiliğinden açılmaz. Premium olunca bölüm kaybolur.

### Faz 4 — Büyük özellikler
- [ ] **2d** Tekrarlayan takipler: Yeni Takip'te "Tekrarla" (her gün / hafta / ay), AI "her pazartesi" gibi ifadeleri algılar, tamamlanınca sonraki otomatik oluşur, kartta 🔁. Premium olabilir.
- [ ] **1e** Yedekleme — **B seçeneği seçildi:** telefonun kendi gece yedeğine (iCloud / Google) dahil olmak; hesap gerekmez.
  - Android: yedek kuralları 1.1.1'de eklendi (veritabanı dahil, SecureStore hariç). Gerçek cihazda yedekten geri yükleme denenecek.
  - iOS: SQLite dosyasının iCloud yedeğine dahil olduğu doğrulanacak.
- [ ] **2c** AI ile hatırlatma mesajı: rehber izni olmadan sistemin kişi seçicisiyle "Rehberden seç" (doğru kişiyi kullanıcı seçer, numara kişi kartına bir kez kaydedilir), AI mesaj yazar, WhatsApp hazır açılır. Yeni build gerekir.
  - Kişi seçici, "Galeriden seç" gibi çalışır: pencereyi telefon gösterir, uygulama rehberin tamamını görmez, yalnızca seçilen kişinin numarası gelir. iOS'ta izin gerekmiyor (doğrulandı). Android'de expo-contacts seçilen kişiyi okumak için READ_CONTACTS istiyor; Android tarafı izinsiz bir seçiciyle (telefon numarası seçme ekranı) ya da izinle ayrıca tasarlanacak — Android üretim build'i zaten yeni yapılacak.

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
- App Store 1.1.1 (15) 6 Ekim 2026'da incelemeye gönderildi.
- Mağaza sayfası 16 dilde (metinler: `docs/magaza/app-store-metinleri.md`): tr, en-US/GB/CA/AU, de, fr, it, es-MX/ES, pt-BR/PT, ru, ar, ja, ko, zh-Hans, nl. Ana dil Türkçe kaldı (kullanıcı kararı); İngilizceye geçmek için önce English (U.S.) ekran görüntüleri gerekir.
- Google Play üretim erişimi başvurusu gönderildi; onay gelince Android üretim build'i ve sitedeki "Google Play — Yakında" düğmesinin güncellenmesi.
