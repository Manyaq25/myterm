# Google Play: ilk üretim yayını (1.1.1)

8 Ekim 2026: Google Play üretim erişimi onaylandı (com.manyaq25.benimyerimetakipet).
Son Android derlemesi 1.0.0 (3), 18 Eylül'de yapıldı; kapalı teste elle yüklendi.

## Durum (9 Ekim 2026)
- Derleme **1.1.1 (5)** (EAS `fb9e0a69…`, commit e331fd2). 4 numaralı derleme iptal edildi: Play Console "Ön plan hizmeti izinleri" beyanı istiyordu; sebebi expo-audio'nun manifestine eklediği FOREGROUND_SERVICE_MEDIA_PLAYBACK ve iki hizmetti. Eski eklenti bunları etkisiz biçimde süzüyordu, artık `tools:node="remove"` ile kaldırılıyor. Yüklenen paketin izin listesinde artık yok. "Beyanı başlat"a basılmadı; yeni sürümle uyarının kalkması bekleniyor.
- Yönetilen yayınlama açıldı.
- Veri güvenliği güncellendi: kilitlenme günlükleri + teşhisler (Sentry; Analiz, zorunlu), cihaz kimliği (Android ID; uygulama işlevselliği + güvenlik, isteğe bağlı), kullanıcı tarafından oluşturulan diğer içerik (kısa süreli). Videolar çıkarıldı. Hizmet sağlayıcılara (Anthropic, RevenueCat, Sentry) giden veriler "paylaşılmıyor" olarak işaretlendi → mağazada "Üçüncü taraflarla veri paylaşımı yok". Veri silme bağlantısı site sayfası oldu.
- Gizlilik politikası adresi `https://aydinapp.com.tr/apps/synvia-ai/privacy-policy.html` oldu (eski backend sayfası Eylül'den kalmaydı).
- Dahili test: 5 (1.1.1) yayında, test listesi "rıza" (test telefonu arkadaşa ait: rizasimsek05@gmail.com). Katılma bağlantısı: Dahili test → Test kullanıcıları → "Bağlantıyı kopyala".
- Üretim (ilk deneme): 5 (1.1.1) gönderilirken ön kontrol "Fotoğraf ve video izinleri" sorunu buldu (READ_MEDIA_IMAGES/VIDEO). Taslak silindi.
- **Derleme 1.1.1 (6)** (EAS `b9c9b4af…`, commit 53a1f7f): Android'de geniş galeri izinleri `plugins/withoutBroadMediaPermissions.js` ile kaldırıldı; görsel sistem fotoğraf seçicisiyle alınıyor, ekran görüntüsü önerisi yalnızca iPhone'da (Android'de ayar gizli). Dahili teste yüklendi ama orada **taslak** kalmıştı (9 Ekim 16:25'te fark edildi; Rıza'ya 5 kurulmuştu, Ayarlar'da "Görsel önerileri" görünüyordu), üretim taslağı 6 ile yeniden oluşturuldu; 5 değişiklik (sürüm, ülkeler ×2, gizlilik, veri güvenliği) **9 Ekim'de incelemeye gönderildi**; ön kontroller sorun bulmadı ("İncelenmekte olan değişiklikler"). Onaydan sonra Yayın özeti → "Değişiklikleri yayınla" ile elle yayınlanacak (önce test).

## Play Console önerileri (engelleyici değil, sonra)
- DEX kod optimizasyonu (R8/küçültme kapalı): son tarih Şubat 2027. Açılınca eşleme (mapping) dosyası da yüklenmeli; sürüm ekranındaki "kod gösterme dosyası yok" uyarısı da o zaman kalkar.
- Android 15 uçtan uca ekran: desteği kaldırılan API/parametreler.
- Büyük ekranlar: yön ve yeniden boyutlandırma kısıtlamaları (Android 16'da yok sayılacak).
- İzinlerde SYSTEM_ALERT_WINDOW var; hangi kütüphaneden geldiği incelenip gereksizse kaldırılabilir.

## Sıra

Google'ın incelemesi uzun sürebileceği için **önce incelemeye gönderiyoruz, testi bu arada yapıyoruz.** "Yönetilen yayınlama" açık olursa onay gelse bile uygulama kendiliğinden yayına girmez. Biz "Yayınla" diyene kadar bekler (Apple'daki "Pending Developer Release" gibi).

### 1. Android derlemesi
- EAS → `production` profili, Android, `main` dalından. Komut: `eas build --platform android --profile production`
- Yaklaşık 15–20 dakika sürer. Bitince Expo sayfasında **.aab** dosyası çıkar ("Download" düğmesi).
- İlk kez derlenen `modules/phone-picker` (Kotlin) bu adımda kontrol edilir. Derleme hata verirse düzeltip tekrar başlatılır.

### 2. Yönetilen yayınlamayı aç
Play Console → Synvia AI → sol menü **Yayınlama genel bakışı** → **Yönetilen yayınlama** → Aç.

### 3. Önce dahili teste yükle (telefon gelince kurmak için)
1. **Test edin ve yayınlayın → Test → Dahili test → Yeni sürüm oluştur**
2. .aab dosyasını sürükle.
3. Sürüm notu (aşağıda) → **Sonraki → Kaydet ve yayınla**
4. Testçiler sekmesinde kendi e-postan ekli olsun. Dahili test genelde dakikalar içinde açılır.

### 4. Aynı derlemeyi üretime gönder
1. **Test edin ve yayınlayın → Üretim → Yeni sürüm oluştur**
2. **Kitaplıktan ekle** → az önce yüklenen 1.1.1 (4) → Ekle. Dosyayı tekrar yüklemeye gerek yok.
3. Sürüm notu (aşağıda).
4. **Ülkeler/bölgeler** sekmesi: bütün ülkeler (ya da kapalı testtekiler).
5. **Sonraki → Kaydet → İncelemeye gönder**
6. Yönetilen yayınlama açık olduğu için onay gelince **Yayınlama genel bakışı → Değişiklikleri yayınla** düğmesine basılana kadar bekler.

### 5. Göndermeden önce kontrol (Uygulama içeriği / Politika)
- **Veri güvenliği:** 1.1.0'dan beri Sentry hata raporu gidiyor. "Uygulama bilgileri ve performansı → Kilitlenme günlükleri" ve "Tanılama" *toplanıyor* olarak işaretli olmalı (amaç: Uygulama işlevselliği; paylaşılmaz; şifreli aktarılır). Kapalı test bundan önceyse güncellenmeli. Ayrıca AI'a gönderilen içerik (fotoğraf, ses, dosya) ve cihaz kimliği önceki beyanla aynı kalmalı.
- **Fotoğraf ve video izinleri beyanı** istenirse: ekran görüntüsü önerisi uygulamanın ana özelliği. Kullanıcı ekran görüntüsü aldığında, onu takip maddesine çevirmeyi önermek için son görsele erişiliyor. Yalnızca fotoğraf izni var, video yok.
- **Rehber:** Android'de rehber izni yok. Numara, sistemin "telefon numarası seç" ekranıyla geliyor.
- Mağaza sayfası metinleri aşağıda. Apple'a özel "Terms of Use (EULA)" satırı Play'e yazılmaz.

## Sürüm notu (Sürüm notları kutusu, 500 karakter)
```
<tr-TR>
Performans ve kararlılık iyileştirmeleri yapıldı.
</tr-TR>
<en-US>
Performance and stability improvements.
</en-US>
```

## Mağaza sayfası (Ana mağaza girişi)
Uygulama adı: `Synvia AI`

**Kısa açıklama (80):**
- TR: `Ekran görüntüsü, sesli not ya da PDF ver; sözlerini ve işlerini AI hatırlatsın.`
- EN: `Share a screenshot, voice note or PDF; AI tracks your promises and reminds you.`

**Tam açıklama (4000):** `app-store-metinleri.md` içindeki Description'ın aynısı, sondaki "Terms of Use (EULA)" satırı hariç. Diğer diller de oradan alınır.

## Android test listesi (telefon gelince, dahili testten kurulur)
1. **Açılış ve dil:** Uygulama açılıyor, telefonun dilinde. Ayarlar'da sürüm "Synvia AI — v1.1.1" yazıyor.
2. **Ekran görüntüsünden ekle:** Bir sohbet ekran görüntüsü seç → işler bulunuyor → kaydet.
3. **Sesli not ve PDF:** Kısa bir sesli not ve bir PDF dene. İkisi de iş çıkarıyor.
4. **Bildirim düğmeleri:** 2 dakika sonrası için bir hatırlatma kur. Bildirim gelince "1 saat ertele" ve "Tamamlandı" çalışıyor.
5. **Fotoğraf seçici (Android):** "Ekran görüntüsü" düğmesi ve Görsel sekmesi izin istemeden Android'in fotoğraf seçicisini açıyor; Ayarlar'da "Ekran görüntüsü önerisi" görünmüyor.
5b. **Rehberden seç (Android'e özel):** "Birinden beklediğim" bir takipte "Mesajla hatırlat" → "Rehberden seç". **İzin sormadan** numara seçme ekranı açılıyor, seçilen numara geliyor. Mesaj WhatsApp/SMS'te açılıyor.
6. **Ekran görüntüsü önerisi:** İzin verdikten sonra telefonla ekran görüntüsü al. "Takip listesine ekleyelim mi?" bildirimi geliyor.
7. **Premium ekranı:** Fiyatlar Google Play'den geliyor (TL). Satın alma penceresi açılıyor; satın almadan kapat.
8. **Davet:** Ayarlar → Arkadaşını davet et → paylaşım metni ve aydinapp.com.tr/synvia/ bağlantısı.

## İnceleme süresi
Google'ın açıkladığı süre çoğu uygulama için birkaç saat ile 3 gün arası. Bazı durumlarda 7 gün veya daha uzun sürebiliyor, özellikle yeni hesapların ilk üretim yayınında. Apple'dan daha öngörülemez. Bu yüzden önce gönderip testi beklerken yapıyoruz.

## Yayına girince
- Sitede `web/assets/store.js` → `PLAY_URL = 'https://play.google.com/store/apps/details?id=com.manyaq25.benimyerimetakipet'`, sonra `tools/site/build.sh`, sonra main'e push.
- Yol haritası: video işleri (Faz 5) başlayabilir.
