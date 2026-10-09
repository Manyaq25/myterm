# Synvia AI — Yol Haritası ve Kararlar

Son güncelleme: 6 Ekim 2026 (1.1.1: kalan yerel modüller tek build'de)

## Kalıcı kurallar
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
- [ ] **Tanıtım videosunu güncellemek** (kaynak: `promo/video/`):
  - Kapanışta Google Play'in de yayında olduğu gösterilecek ("Çok yakında" yerine).
  - Yol haritasındaki yeni özellikler videoya eklenecek (erteleme, bildirimden işlem, tekrarlayan takipler, AI ile hatırlatma mesajı, 7 gün ücretsiz deneme vb.).
  - Sitedeki "Google Play — Yakında" düğmesi de gerçek bağlantıyla değiştirilecek (`web/assets/store.js` → `PLAY_URL`).

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
- **9 Ekim 2026: Android 1.1.1 (5) üretim incelemesine gönderildi** (yönetilen yayınlama açık; dahili testte de yayında). Ayrıntılar ve Play önerileri: `docs/magaza/google-play-yayin.md`.
- **Google Play üretim erişimi 8 Ekim 2026'da onaylandı.** Adımlar, sürüm notu, mağaza metni ve Android test listesi: `docs/magaza/google-play-yayin.md`. Karar: inceleme uzun sürebileceği için önce incelemeye gönderilecek ("Yönetilen yayınlama" açık, onaydan sonra elle yayın), test Android telefon temin edilince dahili testten yapılacak. Yayına girince sitedeki "Google Play — Yakında" düğmesi güncellenecek.
- **Karar (8 Ekim):** Widget ve Siri şimdilik bekliyor, ileride ayrı bir çalışmayla ele alınacak (Android yayınından bağımsız).
