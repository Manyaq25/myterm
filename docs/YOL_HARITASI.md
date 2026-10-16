# Synvia AI — Yol Haritası ve Kararlar

Son güncelleme: 6 Ekim 2026 (1.1.1: kalan yerel modüller tek build'de)

## Kalıcı kurallar
- **Mağaza görselleri (14 Ekim dersi):** App Store'a görsel yüklerken önce "View All Sizes in Media Manager" ile tüm boyutlara bakılır; "Using Existing Assets" yazan bölüm başka bir boyuttan alıyor demektir. Büyük ekran (6.9", 1320×2868) ve orta ekran (6.3", 1206×2622) ikisi de güncellenir; kullanıcının telefonu 16 Pro Max (büyük ekran). 1.1.2'de sadece orta ekran güncellendi, 6.9" bir sonraki sürümde.
- **Yeni kullanıcı gözüyle yaz (7 Ekim):** Site, mağaza ve uygulama metinleri uygulamayı hiç bilmeyen biri için yazılır. Kısaltma ve iç terim kullanılmaz ("takip maddesi", "çıkarım", "içgörü", geliştirici terimleri); her özellik "bu ne, bana ne faydası var" sorusunu örnekle cevaplar.

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

- [x] **Dil düzeltmesi** (yol haritası dışı, 6 Ekim): Tarih gösterimi ("Bugün, 10:00") de her dilde Türkçeydi, düzeltildi. AI çıktıları her dilde Türkçeydi. Artık başlık/not, asistan cevabı ve sesli not deşifresi uygulama dilinde (`X-App-Language`). Sunucu yayında; uygulama tarafı 2b ile aynı `eas update`'te.

### Faz 3 — Gelir
- [ ] **3b** 7 gün ücretsiz deneme + indirimli yıllık plan.
  - [x] Premium ekranı: deneme tanımlıysa ve kullanıcı uygunsa "7 gün ücretsiz, ardından ₺X / ay" + "Ücretsiz denemeyi başlat". Uygunluk belirsizse gösterilmez.
  - [ ] Mağaza panelleri: App Store Connect'te aylık ve yıllık aboneliğe "Introductory Offer → Free, 1 week"; Play Console'da temel plana 7 günlük ücretsiz deneme teklifi (yeni müşteriler).
  - **Ertelendi (6 Ekim, kullanıcı kararı):** Fiyat ve deneme ayarları uygulama yoğun kullanılmaya başlayınca yapılacak. Kararlaştırılan fiyatlar: Türkiye ₺99/ay, ₺799/yıl; diğer ülkeler $1.99/ay, $15.99/yıl (Apple diğer ülkelere kendisi çevirir). Ücretsiz 6 hak/ay deneme varken de kalır (deneme tek seferlik, kart ister).
- [ ] **3d** Ülkeye göre fiyat: 3b'deki iki fiyat bölgesiyle aynı karar, aynı zamanda yapılacak. Not: AI maliyeti dolar, gelir yerel para; Premium sınırsız olduğu için 1b ölçümüyle kullanıcı başı maliyete bakılıp gerekirse cömert bir adil kullanım sınırı konacak.
- [x] **3c** Premium: AI kullanımı (çıkarım + asistan + Mesajla hatırlat) ücretsizde 6/ay, premium'da sınırsız; tekrarlayan takipler ücretsiz (AI maliyeti yok). Premium tablosu ve "hak doldu" uyarısı buna göre güncellendi (uyarı davetle ek hak kazanmayı da anlatıyor).
- [x] **3f** Arkadaşını davet et (kod hazır; sunucu yayında, uygulama 2b ile aynı `eas update`'te).
  - Yalnızca davet eden kazanır (+3 AI hakkı, en fazla 10 davet = 30 hak). Davet edilen ödül almaz; kendi kodunu paylaşarak kazanabilir.
  - Ayarlar → "Arkadaşını davet et": kod, davet sayısı, ek hak, "Davet et" (paylaşım metni + uygulama diline göre aydinapp.com.tr/synvia/ veya /en/synvia/). "Davet kodu gir" satırı herkese açık, cihaz başına bir kez.
  - Ek haklar aylık hak bitince kullanılır, ay geçince silinmez. Kötüye kullanıma karşı: kendi kodu girilemez, IP başına günde 5 kod girişi.
  - Sunucu: `/api/referral` (status / redeem), Redis anahtarları `ref:*`, `bonus:*`. Gizlilik politikasına "Arkadaşını Davet Et" bölümü eklendi (sitenin yayınlanması gerekiyor).
- [x] **3a** Nazik ve tek seferlik öneriler (kod hazır, aynı `eas update`'te). Deneme seçeneği mağazada deneme tanımlanınca kendiliğinden görünür:
  - İlk başarılı çıkarımdan sonra, kayıt bittikten sonra küçük bir kart: "Arkadaşını davet et (+3 hak)" ve "Premium'u 7 gün ücretsiz dene". Kapat (✕) tuşu var; kapatılınca bir daha gösterilmez. Kartın altında küçük bir not: "Bunu istediğin zaman Ayarlar'dan yapabilirsin."
  - Birkaç kullanımdan sonra (örn. 3. başarılı çıkarım) bir kez premium önerisi, kapat tuşuyla.
  - Her öneri yalnızca bir kez gösterilir (cihazda işaretlenir); her çıkarımdan sonra çıkmaz, reklam havası olmaz. Premium kullanıcılara gösterilmez. Çıkarım sırasında değil, işlem bittikten sonra gelir.
  - Hak dolunca çıkan "Premium'a Geç" penceresi olduğu gibi kalır.
  - Ayarlar'da kalıcı bölüm (yalnızca premium olmayanlara): "Premium'u 7 gün ücretsiz dene" ve "Arkadaşını davet et (+3 hak)". Kart kaçırılsa da kullanıcı istediği zaman ulaşır; kendiliğinden açılmaz. Premium olunca bölüm kaybolur.

### Faz 4 — Büyük özellikler
- [x] **2d** Tekrarlayan takipler (kod hazır; sunucu yayında, uygulama aynı `eas update`'te). Ücretsiz.
  - Yeni Takip'te tarih seçilince "🔁 Tekrarla: Yok / Her gün / Her hafta / Her ay"; takip detayından değiştirilebilir; kartta 🔁.
  - Tamamlanınca (uygulamadan veya bildirim düğmesinden) bir sonraki aynı saatle oluşur, hatırlatması kurulur; geç tamamlanırsa kaçırılan tarihler atlanır.
  - AI "her pazartesi", "her ayın 5'i" gibi ifadeleri tanır (`recurrence` alanı; eski sürümler yok sayar).
  - Bilinen sınır: ayın 29–31'ine kurulan aylık takip kısa bir aydan sonra o ayın son gününe kayar.
  - Veritabanı: `follow_ups.recurrence` sütunu (eski kurulumlara açılışta eklenir).

- [x] **1e** Yedekleme — **B seçeneği:** telefonun kendi gece yedeği (iCloud / Google), hesap gerekmez.
  - iOS: veritabanı `Documents/SQLite` içinde; iCloud yedeğine kendiliğinden giriyor (kodla doğrulandı).
  - Android: 1.1.1'deki kurallarla veritabanı yedekte, SecureStore hariç.
  - Geri yüklemede planlı bildirimler gelmediği için uygulama açılışta eksik hatırlatmaları yeniden kuruyor (bildirim izni varsa).
  - Kalan: gerçek bir telefonda yedekten geri yükleme denemesi (fırsat olunca).

- [x] **2c** "💬 Mesajla hatırlat" (kod hazır; sunucu yayında, uygulama aynı `eas update`'te).
  - Yalnızca "birinden beklediğim" takiplerde, kişi atanmışsa: takip detayında düğme; kişi kartındaki gecikmiş satırlarda kısayol.
  - Numara yoksa önce istenir: iPhone'da sistem kişi seçicisi (izin gerekmez) veya elle; kişi kartına bir kez kaydedilir. Kişi kartında numara düzenlerken de "Rehberden seç" var.
  - AI mesajı uygulama dilinde yazar; ton: Samimi / Resmi / Kısa; gönderilmeden düzenlenebilir; WhatsApp veya SMS açılır, gönderme kullanıcıda.
  - AI hakkına sayılır (ücretsiz 6/ay, premium sınırsız). Sunucu: `/api/reminder-message`, ölçüm anahtarı `reminder`.
  - Android: kendi yerel modülümüz `modules/phone-picker` sistemin "telefon numarası seç" ekranını açıyor; rehber izni gerekmiyor, yalnızca seçilen numara geliyor. Yeni Android build'iyle gelir (modül yoksa elle numara). Kotlin kodu bu ortamda derlenemedi; ilk Android build'inde derleme kontrol edilecek.
  - Telefon numarası artık telefonun bölgesine göre ülke koduyla tamamlanıyor (önceden hep +90 varsayılıyordu).

### Faz 5 — Tanıtım
- **Karar (7 Ekim):** Bütün video işleri, uygulama hem iOS'ta hem Android'de (Google Play üretimde) yayınlandıktan sonra başlayacak:
  - App Store ön izleme videoları (gerçek ekran kaydı şart; özellik başına kısa kayıtları kullanıcı telefonla çeker, kurgu/metin/ölçü bizde).
  - Özel ürün sayfaları (Custom Product Pages): 📸 Ekran görüntüsü, 🎙️ Sesli not, 📄 PDF, 💬 Mesajla hatırlat; her birine anahtar kelime ve derin bağlantı.
  - Sosyal medya için özellik videoları (dikey, 15–20 sn; `promo/video` sistemiyle).
  - Hazır olanlar: başlık ve arama sonucu görsel/videoları (TR/EN) `promo/store-assets/out/`; yeni özellikler yayına girdikten sonra Asset Library'ye yüklenecek, diğer 10 dil istenirse eklenecek.
  - A/B testi (Product Page Optimization): trafik artınca.
- **Bekliyor (6 Ekim):** Video, yeni özellikler telefonlara gidip test edildikten ve Google Play üretim onayı geldikten sonra güncellenecek; yeni ekranların gerçek görüntüleri (bildirim düğmeleri, Mesajla hatırlat, tekrarlayan takip, davet) telefondan alınacak.
- [x] **Videolar (9–10 Ekim):** Tanıtım videosu güncellendi (`promo/video/`, 49,7 sn, iki mağaza kapanışı); çizgi film reklam (`promo/story/`); **gerçek insanlı sesli reklam** (`promo/story-real/`, ~50 sn, vidIQ/Veo, kullanıcı onayladı). Paylaşım: Google Play yayına girince.
- [x] **Tanıtım videosunu güncellemek** (kaynak: `promo/video/`; 10 Ekim: Google Play yayında, site düğmesi güncellendi):
  - Kapanışta Google Play'in de yayında olduğu gösterilecek ("Çok yakında" yerine).
  - Yol haritasındaki yeni özellikler videoya eklenecek (erteleme, bildirimden işlem, tekrarlayan takipler, AI ile hatırlatma mesajı, 7 gün ücretsiz deneme vb.).
  - Sitedeki "Google Play — Yakında" düğmesi de gerçek bağlantıyla değiştirilecek (`web/assets/store.js` → `PLAY_URL`).

- **Karar (10 Ekim):** Mağaza ekran görüntüleri ve kalan küçük işler 12 Ekim'den sonra. Kurumsal e-posta, uygulama sayfası/sosyal medya hesabı (belki yalnızca X/Twitter) uygulama tutarsa ya da uygulama sayısı artarsa. Reklam: önce 2–3 hafta organik veri (indirme, 7 gün sonra kullanmaya devam eden oranı, Premium'a geçiş), sonra küçük bütçeli ölçülebilir deneme (Apple Search Ads / Google uygulama kampanyası; Google Ads'in 17 Eylül'deki 8.000 TL kredi teklifinin şartlarına bakılacak). YouTube/sosyal medya reklamı bu tür bir araç için pahalı ve niyeti düşük; en son.

- **Fikir (10 Ekim, kullanıcı): Akıllı saat.** Bildirimler ve "Tamamlandı / 1 saat ertele / Yarın" düğmeleri (bildirim kategorisi) saatte zaten görünmeli; önce gerçek saatte doğrulanacak. Gerçek saat uygulaması React Native/Expo ile yapılamaz: Apple Watch için Swift/SwiftUI watchOS hedefi (Expo config plugin + WatchConnectivity ile telefondaki SQLite verisini paylaşma), Wear OS için ayrı Kotlin uygulaması. Önerilen sıra: Widget (App Group/paylaşılan veri altyapısı) → Siri/App Intents → Apple Watch mini uygulama (bugünün listesi, tamamla, sesle ekle, kadran komplikasyonu; WidgetKit kodu ortak) → Wear OS (Android kullanım verisine göre).

- **Yapılacak (12 Ekim'den sonra): Derleme ve gönderimi Claude'un yapabilmesi için tek seferlik kurulum** (bilgisayarda `git pull` + `eas build` köprüsü kalksın):
  Durum (12 Ekim): 1 ✅ bağlandı; 2 ✅ Claude ortamında **Network secret** olarak eklendi (ad: Expo, `*.expo.dev`, Authorization: Bearer). Ortam değişkeni olarak eklenmez, herkese görünür. Yeni oturumda test edilecek. 3 ✅ App Store Connect API anahtarı zaten Expo'da ([Expo] EAS Submit, 3DXS6K8R9U). 4 ✅ Google hizmet hesabı `eas-submit@synvia-ai.iam.gserviceaccount.com` (yalnızca test kanalları izni; üretime yayınlama yok) Expo'ya yüklendi; eas.json `submit.production.android.track = internal`. 5 ✅ Karar A: derleme ve test gönderimi sormadan (kural AGENTS.md'de).
- **Mağaza işlerini Claude'a devretme (12 Ekim kararı, bilgisayar açılınca tek seferde kurulacak):** Kullanıcı mağaza işlerinin de bende olmasını istiyor; sabah ikiye bölünmesi tekrar iş çıkardı, bu sefer hepsi birden. Yol: anahtarlar GitHub gizli değişkeni, işler GitHub Actions (elle başlatılır, önce deneme modu).
  - Kapsam: Play ekran görüntüleri/metinler/sürüm notları/test taslakları; App Store ekran görüntüleri/açıklama/anahtar kelimeler/Yenilikler/sürüm taslağı. Canlıya yayınlama ve fiyatlar kullanıcıda kalır.
  - Kullanıcı adımları: (1) Play Console'da `eas-submit` hesabına "Mağaza varlığını yönet" izni; (2) App Store Connect'te yeni API anahtarı (App Manager), .p8 indir; (3) GitHub'a gizli değişkenler: `PLAY_SERVICE_ACCOUNT_JSON`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`.
  - Kullanıcı açık onay verecek ("kur"); iş akışı eklemeyi otomatik güvenlik kontrolü onaysız engelledi.
  - İlk iş: `promo/screenshots/out/play` görsellerini Play'e yüklemek (out/play depoya eklenecek).
  1. expo.dev → proje → GitHub: depoyu bağla (Expo MCP `build_run` "No repository found" hatası bundandı).
  2. expo.dev → Access tokens → yeni anahtar → Claude ortamı (Edit → Network secrets / ortam değişkeni) `EXPO_TOKEN`. Sohbete yazılmaz.
  3. App Store Connect → Kullanıcılar ve Erişim → Entegrasyonlar → Anahtarlar (App Manager) → .p8 dosyası expo.dev kimlik bilgilerine (EAS Submit → TestFlight).
  4. Google Play hizmet hesabı, sürüm yayınlama izniyle → JSON expo.dev'e (EAS Submit → dahili test).
  5. İzin kuralı kararı: derleme/test gönderimi sormadan mı, yoksa her seferinde sorarak mı (EAS ücretsiz kota). Mağazada son "Yayınla/İncelemeye gönder" kullanıcıda kalır.
  Yeni uygulamalarda bu kurulum en başta yapılır.

### Site (aydinapp.com.tr)
Vercel'de, `main`'e push edilince yayına girer (Root Directory: `web`). Kaynak araçları `tools/site/` (README yerine dosya başlarındaki notlar):
- `build.sh`: sayfaları şablondan üretir (`home.*` → `web/index.html`, `web/en/`; `synvia.*` → `web/synvia/`, `web/en/synvia/`; `changelog.*` → yenilikler sayfaları; ortak menü/alt bilgi `partials/`) ve `web/assets/site.css`'i derler. HTML'de yeni Tailwind sınıfı kullanınca çalıştırılmalı.
- `render.js`: link önizleme görselleri (`og.png`, `og-en.png`) ve `apple-touch-icon.png`.
- [x] 1. aşama (7 Ekim, yayında): WhatsApp/iMessage önizlemesi, iPhone App Store şeridi, ilk ekranda indirme butonu, Android'de Google Play öne alınır, CDN'siz hazır CSS ve yerel fontlar, robots/sitemap/404.
- [x] 2. aşama (7 Ekim): `/synvia/` (TR) ve `/en/synvia/` (EN) tanıtım sayfası: üç tür takip, nasıl çalışır, özellikler, kişi kartları, gizlilik, Ücretsiz/Premium, SSS. Davet linki bu sayfaya gidiyor (OTA ile).
- [x] Güvenlik ve hız (7 Ekim): `web/vercel.json` güvenlik başlıkları (CSP: yalnızca kendi dosyalarımız; dış betik eklenecekse buraya izin yazılmalı) ve önbellek süreleri; CSS/JS bağlantılarında içerik özetiyle sürüm etiketi (`version-assets.js`); ikon 945 KB PNG yerine 1–3 KB WebP. Lighthouse (mobil): hız 73 → 99, erişilebilirlik/en iyi uygulamalar/SEO 100.
- [x] Yenilikler sayfası (7 Ekim): `/synvia/yenilikler/` ve `/en/synvia/whats-new/`. Her yeni sürümde `tools/site/changelog.i18n.js` listesinin başına iki dilde madde eklenir (önceki `latest: true` kaldırılır), sonra `build.sh`. Kullanıcı kararıyla 1.1 maddeleri OTA'dan önce yayınlandı.
- [ ] Kurumsal e-posta (destek@aydinapp.com.tr) — **ertelendi (7 Ekim), kullanım artınca.** Seçilen yol: Natro e-posta (~$0,99/ay) + Natro'dan Gmail'e otomatik yönlendirme + Gmail'de "farklı adresten gönder" (SMTP). Gmail'in POP ile mail çekme özelliği 2026'da kalktığı için yönlendirme kullanılacak. Kurulunca site, mağaza ve uygulamadaki adresler güncellenecek.
- [x] Google Search Console (7 Ekim): Alan adı mülkü, Natro DNS'te TXT doğrulama kaydı (silinmemeli), sitemap.xml gönderildi → Başarılı, 12 sayfa.
- [ ] www.aydinapp.com.tr Natro'nun yönlendirme servisine gidiyor (CNAME redirect.natrocdn.com); Vercel'e bağlanıp kök adrese yönlendirilmeli.
- [x] Yeni ana sayfa (9 Ekim, yayında): kaydırmayla oynayan tasarım (parçacıklı A açılışı, "nasıl çalışır" hikâyesi: mesaj → yapay zekâ → kart → bildirim, dört yol, yatay özellik galerisi, uygulamalar vitrini, daire açılarak gelen hakkımda, dev "aydinapp" kapanışı). TR/EN: `tools/site/home.template.html` + `home.i18n.js`; stil `web/assets/home.css`, hareket `web/assets/home.js` (CSP gereği ayrı dosyalar, `version-assets.js` sürüm etiketi ekler). Lighthouse mobil: hız 96, erişilebilirlik 95, SEO 100. Prototip: `design/v2/`. Synvia, Yenilikler ve yasal sayfalar şimdilik eski tasarımda; sırayla yeni dile geçirilebilir.
- [x] Ziyaretçi sayacı (7 Ekim): Vercel Web Analytics (Hobby, ücretsiz; ayda 50.000 ölçüm, 30 gün geçmiş, özel olay sayımı yok). Vercel'de proje adı `myterm`. Gizlilik politikasına "Web Sitesi" bölümü eklendi.
- [ ] İngilizce sayfa için İngilizce ekran görüntüleri (şimdilik Türkçe görüntüler kullanılıyor); yeni özellik ekranları telefondan alınınca sayfaya eklenecek.
- [x] Gizlilik/destek/veri silme sayfalarının İngilizcesi (`web/en/apps/synvia-ai/`, 7 Ekim). Gizlilik politikasına rehber erişimi ve "Mesajla hatırlat"ın yapay zekâya gönderdikleri eklendi. Bu sayfalar şablonsuz; değişiklik iki dilde elle yapılır.

## 1.1.1 onayından sonra: tek `eas update` ve test listesi (7 Ekim: yapıldı, 7/7 geçti)
`git pull` → `eas update --branch production --message "Performans ve kararlılık iyileştirmeleri"` (yalnızca 1.1.1 build'lerine gider). Telefonda:
1. Bildirim düğmeleri: Tamamlandı / 1 saat ertele / Yarın; bildirime dokununca detay açılıyor.
2. AI dil: uygulamayı İngilizceye alıp metin çıkarımı ve asistan → İngilizce cevap; tarih "Today, 10:00".
3. Davet: Ayarlar → kod, Davet et (paylaşım metnindeki link /synvia/ sayfasını açmalı), başka cihazdan kod girme → davet edene +3.
4. Mesajla hatırlat: numarasız kişide Rehberden seç → mesaj → WhatsApp/SMS.
5. Tekrarlayan takip: Her gün kur, tamamla → yarına yenisi; kartta 🔁.
6. İlk çıkarımdan sonra öneri kartı; ✕ ile kapanıyor, bir daha çıkmıyor.
7. Değerlendirme penceresi: 3 tamamlama + 2 gün (TestFlight'ta Apple pencereyi göstermeyebilir).

## Ölçüm (1b)
Upstash → Data Browser → `stats:YYYY-MM-DD` anahtarları: `*:requests`, `*:input`, `*:output`, `*:cache_read`, `*:cache_write` (rotalar: text, image, pdf, voice, assistant, reminder). Birkaç günlük değerlerle önbellek kararı ve kullanıcı başı maliyet hesabı yapılacak.

## Reddedilen / iptal edilenler
- **1b (ilk hali):** Ucuz modele geçmek — kalite riski.
- **1d:** Kademeli yayın (%10) ve ayrı test sürümü — iptal.
- **1e A / C:** Dosyaya yedek, hesap + sunucu eşitlemesi — B seçildi.
- **2a:** Paylaş menüsünden ekleme — birden fazla mesaj, kişi adı belirsizliği.
- **2e:** Takvim bağlantısı — uygulama tek başına yeterli olmalı.

## Bekleyen dış işler
- **Sentry düzeltmesi (7 Ekim):** Uygulamadaki DSN var olmayan eski bir Sentry projesini gösteriyordu; hiçbir rapor ulaşmıyordu ("0 hata" bu yüzdendi). Doğru DSN (`react-native` projesi) konuldu ve OTA ile gönderildi. **Doğrulandı:** Ayarlar'da sürüm yazısına (artık gerçek sürümü gösteriyor, eskiden "v0.1 (MVP)" yazıyordu) art arda 7 dokunuş deneme raporu gönderir; REACT-NATIVE-1 olarak Sentry'ye ulaştı. Rapor hattını test etmek gerektiğinde aynı yöntem kullanılır.
- **Widget ve Siri (7 Ekim):** Kodu hazır (`targets/widget`, `targets/siri`, `src/services/widget.ts`) ama 17 Eylül'den beri build'de yok (`@bacons/apple-targets` eklentisi app.json'dan çıkarıldı; EAS, Apple Developer Portal'da eklenti bundle ID'lerini oluştururken 403 alıyordu). Premium tablosundan, siteden ve mağaza metinlerinden çıkarıldı. Geri getirmek için: bundle ID'leri (`….TakipWidget`, `….TakipSiri`) portalda elle oluşturup App Group'u bağlamak, eklentiyi geri eklemek, yeni native build. Gelince Premium satırı ve metinler geri eklenecek.
- **Karar (7 Ekim):** Widget ve Siri, Android üretim build'iyle birlikte geri getirilecek (portalda iki bundle ID'yi kullanıcı oluşturacak).
- **App Store 1.1.1 (15) 7 Ekim 2026'da onaylandı** ("Pending Developer Release"). Önce `eas update --branch production` gönderildi, TestFlight 1.1.1'de 7 maddelik test geçti, ardından "Release This Version".
- Mağaza açıklaması güncellendi (widget/Siri satırı çıktı, `docs/magaza/app-store-metinleri.md`); açıklama ancak bir sonraki sürüm hazırlanırken App Store Connect'te değiştirilebilir.
- Mağaza sayfası 16 dilde (metinler: `docs/magaza/app-store-metinleri.md`): tr, en-US/GB/CA/AU, de, fr, it, es-MX/ES, pt-BR/PT, ru, ar, ja, ko, zh-Hans, nl. Ana dil Türkçe kaldı (kullanıcı kararı); İngilizceye geçmek için önce English (U.S.) ekran görüntüleri gerekir.
- Android üretim build'i (`eas build --platform android --profile production`): telefon numarası seçici modülünü içerecek. İlk build'de derlemenin geçtiği ve "Rehberden seç"in izin istemeden çalıştığı kontrol edilecek.
- **9 Ekim 2026: Android 1.1.1 (6) üretim incelemesine gönderildi** (5 numaralı derleme fotoğraf izni yüzünden geri çekildi) (yönetilen yayınlama açık; dahili testte de yayında). Ayrıntılar ve Play önerileri: `docs/magaza/google-play-yayin.md`.
- **Google Play üretim erişimi 8 Ekim 2026'da onaylandı.** Adımlar, sürüm notu, mağaza metni ve Android test listesi: `docs/magaza/google-play-yayin.md`. Karar: inceleme uzun sürebileceği için önce incelemeye gönderilecek ("Yönetilen yayınlama" açık, onaydan sonra elle yayın), test Android telefon temin edilince dahili testten yapılacak. Yayına girince sitedeki "Google Play — Yakında" düğmesi güncellenecek.
- **Karar (8 Ekim):** Widget ve Siri şimdilik bekliyor, ileride ayrı bir çalışmayla ele alınacak (Android yayınından bağımsız).

## 1.1.2 (13 Ekim) — açılış çökmesi düzeltmesi
- Sentry REACT-NATIVE-2: iOS'ta açılıştan ~6 sn sonra çökme. Sebep: OTA indirilince `Updates.reloadAsync()` ile anında yeniden başlatma → expo-modules-core `SharedObjectRegistry.clear` çöküşü. Anında yeniden başlatma kaldırıldı; güncelleme bir sonraki açılışta devreye girer.
- iOS build 16 TestFlight'a, Android dahili teste gönderildi (Claude, karar A; Expo network secret ilk kez çalıştı, `EXPO_TOKEN=dummy` ile). Canlıya alma kullanıcıda.
- Not: Bu tür hatalar için 1.1.1 kullanıcılarına OTA gönderilmedi; eski kod yine anında yeniden başlatacağından risk taşır.
- 13 Ekim: Play'de 1.1.2 üretim + yeni telefon ekran görüntüleri (play/ 1080x1920) incelemeye gönderildi. Yönetilen yayınlama açık: onaydan sonra Yayın özeti → "Yayınla" kullanıcı tarafından basılmalı. App Store'da 1.1.2'ye 1206x2622 görseller yüklendi (iPhone medium display bölümü 1320x2868 kabul etmiyor).
- Onay gelince yapılacak: siteyi güncelle (Yenilikler sayfasına 1.1.2 "hata düzeltmeleri ve kararlılık", gerekirse yeni ekran görüntüleri); Play mağaza ayarlarındaki web sitesi adresini aydinapp.com.tr destek sayfasıyla değiştirmeyi öner.

## Diğer dillerin mağaza görselleri (13 Ekim)
- 11 dil (en, de, fr, es, it, pt, ru, ar, ja, ko, zh) uygulamanın web sürümünden gerçek arayüzle çekildi: `promo/screenshots/` (README'de adımlar).
- App Store'da 1.1.2 incelemede olduğu için görseller bir sonraki sürümde yüklenecek (mağaza işleri kurulumu yapılırsa Claude yükler). nl (Hollandaca) → en görselleri.
- Fark edilen arayüz sorunu: Almanca/Rusça gibi uzun dillerde alt menüdeki sekme yazıları ("Smart hinzufügen", "Умное добавление") üst üste biniyor; ayrıca bazı tür etiketleri ("Versprochen, das ich gegeben habe") kartlarda tarihi sıkıştırıyor. Kısa etiket ya da tek satır kısaltma ile düzeltilecek.
- 14 Ekim: App Store 1.1.2 onaylandı ve kullanıcı yayınladı ("Release This Version"). Google Play 1.1.2 de yayında. Yeni dil görselleri bir sonraki sürümde yüklenecek.
- 14 Ekim: Kullanıcı yeni Apple Developer sözleşmesini ve Paid Applications Schedule'ı onayladı (son tarih 13 Kasım'dı).
- Bekleyenler (Apple): Nisan 2027'den itibaren iPhone Duo ekran görüntüleri zorunlu (iOS 27.1 SDK ile); bir sonraki sürümde yaş derecelendirmesindeki yeni sosyal medya sorularına "Hayır" cevabı (uygulamada sosyal özellik yok).
- 15 Ekim: Mağaza işleri devri (Google tarafı) kuruldu: `eas-submit` hizmet hesabına "Mağaza varlığını yönet" izni, GitHub gizli değişkeni `PLAY_SERVICE_ACCOUNT_JSON`, iş akışı `.github/workflows/play-screenshots.yml` (Claude GitHub üzerinden elle tetikler, önce deneme). Play'de mağaza sayfası yalnızca Türkçeydi; 14 dil sayfası (store/play-listings.json, App Store metinlerinden) ve dil başına 8 görsel (store/play-screenshots/) yüklenip incelemeye gönderildi. Onaydan sonra Yayın özeti → Yayınla kullanıcıda. Apple tarafı (ASC API anahtarı) henüz kurulmadı.
- 15 Ekim: Uzun dillerde (de/ru/pt) alt menü yazılarının üst üste binmesi ve kart rozetinin tarihi sıkıştırması düzeltildi (BottomTabBar, TypeBadge, FollowUpCard; de/ru "Akıllı Ekle" kısaltıldı). Bir sonraki sürümle çıkacak.
- 15 Ekim: Play web sitesi adresi `aydinapp.com.tr/destek` (var olmayan sayfa) → `aydinapp.com.tr/apps/synvia-ai/support.html` olarak değiştirildi, incelemeye gitti.
- 15 Ekim: Apple tarafı da kuruldu: App Store Connect API anahtarı "Claude Magaza" (App Manager), GitHub gizli değişkenleri `ASC_KEY_ID`, `ASC_KEY_P8`; iş akışı `.github/workflows/app-store.yml` + `tools/store/asc.py` (şimdilik `check`, salt okunur). Kontrol sonucu: 18 dil var; yalnızca tr'nin kendi görselleri var (APP_IPHONE_67 eski, APP_IPHONE_61 yeni), diğer 17 dil Türkçe görselleri gösteriyor. Bir sonraki sürümde (sürüm "Prepare for Submission" iken) tüm dillere APP_IPHONE_67 (1320×2868) ve APP_IPHONE_61 (1206×2622) yüklenecek; yükleme komutu o zaman yazılacak. İncelemeye gönderme kullanıcıda.

## 1.2.0 — Ana ekran widget'ı (Premium) (15 Ekim)
- Widget geri geldi (yalnızca widget; Siri sonra): `targets/widget/TakipWidget.swift` (küçük + orta boy), veri `src/services/widget.ts` (App Group'a JSON metin, 12 dilde etiketler), Premium değilse kilitli tanıtım görünümü → `benim-yerime-takip-et://premium`. Premium tablosunda iPhone'da "Ana ekran widget'ı" satırı.
- **Önemli bulgu:** Eylül'deki ve bugünkü "Apple 403" hatası Apple'dan değil, Claude'un bulut ortamındaki vekil sunucunun api.appstoreconnect.apple.com'u engellemesinden. Yeni bundle ID / profil gerektiren iOS derlemeleri Expo sunucusunda başlatılır (Expo MCP `build_run`, gitRef main, submitProfile production). GitHub'daki `EXPO_TOKEN` gizli değişkeni eski/yetkisiz (eas-build.yml çalışmıyor).
- iOS 1.2.0 (18) Expo sunucusunda derlendi ve TestFlight'a gönderildi. Android 1.2.0 henüz derlenmedi (widget yok; yalnızca menü düzeltmesi).
- Yayın öncesi yapılacaklar: TestFlight'ta widget testi (Premium ve ücretsiz), App Store görselleri 18 dil × 2 boyut (asc.py'ye yükleme komutu), "Yenilikler" metni, yaş derecelendirmesi sosyal medya soruları, site/mağaza metinlerine widget satırı.
- 16 Ekim: Widget tasarımı yenilendi (iOS 1.2.0 (20): soluk logo, renkli sol panel, iki satırlık başlıklar, galeri 12 dilde). Logo filigranı kullanıcıya göre şimdilik yeterli; ileride biraz daha belirgin yapılabilir (opacity 0.16 → ~0.3).
- 16 Ekim: `asc.py prepare 1.2.0 20` çalıştırıldı: App Store'da 1.2.0 oluşturuldu, derleme 20 bağlandı, 18 dilde Yenilikler + APP_IPHONE_67 görselleri yüklendi. Kullanıcı: yaş derecelendirmesi sosyal medya soruları (No) + Submit for Review.
- Android 1.2.0 derlendi (widget yok, yalnızca menü düzeltmesi). Android widget ayrı yazılmalı (Jetpack Glance/RemoteViews); Android test telefonu gerekiyor — sonraya.
- Site Yenilikler 1.2 girdisi yalnızca dalda (commit 383c130); App Store onayından sonra main'e alınacak.
- 16 Ekim: Kullanıcı iOS 1.2.0'ı incelemeye gönderdi (yaş derecelendirmesi zaten tamam, 4+). Android 1.2.0 (8) üretime alındı, 15 dilde sürüm notu ile incelemeye gönderildi. Onaylar gelince: iki mağazada Yayınla (kullanıcı), site Yenilikler 1.2 girdisini main'e al.
