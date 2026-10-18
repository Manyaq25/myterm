# Yeni uygulama için Claude bağlam dosyası (aydinapp)

> Bu dosyayı yeni bir uygulamaya başlayan Claude oturumu **ilk iş olarak** okur.
> Amaç: Hesapların, servislerin ve kuralların zaten kurulu olduğunu bilmen; kullanıcıdan
> gereksiz üyelik, kod veya anahtar istemeden işi **kendin** yürütmen.
> Son güncelleme: 18 Ekim 2026 (Synvia AI 1.2.0 iki mağazada yayında).

## 1. Kim, nasıl konuşulur
- Sahip: **İbrahim Aydın** (bireysel geliştirici, "aydinapp"). Teknik değil; her zaman **Türkçe, sade, adım adım** anlat.
- Ara mesajlar kısa olsun; aynı şeyi tekrar etme. Bitince "ne yaptım, ne kaldı" özeti ver.
- Kullanıcıdan bir şey istemen gerekiyorsa tek adım ver, tam adresi ve düğme adını yaz; ekran görüntüsüyle devam edilir.
- Kişisel bir telefon/hesap adımı tarif etmeden önce **kimin hesabı / cihazı** olduğunu sor.

## 2. İşi kim yapar
- **İşi sen yaparsın:** kod, derleme, test kanalına gönderme, mağaza metinleri/görselleri, site sayfaları, notlar.
- **Derleme (`eas build`) ve test kanalına gönderme (TestFlight, Google Play dahili test) sormadan yapılır**; bitince "test için hazır" denir.
- **Her zaman kullanıcıda kalanlar:** mağazada canlıya alma (App Store "Submit for Review" / "Release", Play üretim yayını ve "Yayınla"), **fiyatlar**, para harcatan her karar.
- Expo ücretsiz planının aylık derleme kotası gözetilir (iOS ~15/ay; 1 Kasım'da sıfırlanır). Gereksiz derleme yok; kotaya yaklaşınca söyle.
- Gizli bilgiler (şifre, token, anahtar) **asla sohbete yazdırılmaz, dosyaya/depoya yazılmaz.** Aşağıdaki "Anahtarlar nerede" bölümündeki yerlerde zaten duruyor.

## 3. Hazır olan hesaplar ve servisler

| Servis | Ne için | Durum / bilinmesi gerekenler |
|---|---|---|
| **Apple Developer** | iOS yayını | Aktif, ücretli üyelik. Team ID `G2T885G2XY`. Ücretli uygulama sözleşmesi, banka ve vergi tamam. |
| **App Store Connect** | iOS uygulama kayıtları, TestFlight, mağaza sayfası | Aktif. API anahtarı "Claude Magaza" (App Manager), Issuer `3da2f4bd-3acd-404f-8748-c7e43756dd8d`. **Yeni uygulama kaydını ("New App") Apple API ile açmak mümkün değil**; kullanıcı App Store Connect'te tek seferlik açar (bundle ID'yi EAS önceden oluşturabilir). |
| **Google Play Console** | Android yayını | Aktif. Synvia için **üretim erişimi onaylandı** (12 kişi / 14 gün kapalı test yapıldı). Yeni uygulamada bu şartın tekrar istenip istenmediğini Play Console panosu gösterir; isteniyorsa kapalı test en başta başlatılır. Ödeme profili (bireysel, "İBRAHİM AYDIN") ve %15 programı tamam. Yeni uygulama kaydı Play Console'da kullanıcı tarafından açılır (API yok). |
| **Google Cloud** | Play API, RevenueCat bildirimleri | Proje `synvia-ai`. Hizmet hesapları: `eas-submit` (Play'e yükleme + "Mağaza varlığını yönet"), `revenuecat@synvia-ai.iam.gserviceaccount.com`. Pub/Sub konusu `projects/synvia-ai/topics/Play-Store-Notifications`. Yeni uygulamaya Play Console'dan aynı hizmet hesabına izin vermek yeterli. |
| **GitHub** | Kod, otomasyon | Depo **`Manyaq25/myterm`** (Synvia + site burada). Çalışma dalı + `main`. GitHub MCP araçlarıyla iş akışları tetiklenir. |
| **Expo / EAS** | Derleme, mağazaya gönderme, OTA | Hesap **`aydinapp`** (ücretsiz plan). Bu Claude ortamında **network secret** olarak tanımlı: `EXPO_TOKEN=dummy npx eas-cli ...` ve GraphQL'de `Authorization: Bearer dummy` çalışır (gerçek anahtar ağ katmanında eklenir). Expo MCP bağlantısı da var (`build_run`, `build_submit`, `build_info`...). |
| **Vercel** | Site ve Synvia sunucusu | Site `aydinapp.com.tr` → depodaki `web/` klasörü, `main`'den otomatik yayın. Synvia sunucusu `backend/` (adres `https://backend-five-dun-77.vercel.app`), `deploy-backend.yml` ile yayınlanır. |
| **Alan adı** | aydinapp.com.tr | Natro'da. **Natro'daki A kaydına ve Google TXT kaydına dokunma.** |
| **Anthropic API (Claude)** | Uygulama içi yapay zekâ | Anahtar GitHub Secrets'ta (`ANTHROPIC_API_KEY`), Vercel'e iş akışıyla aktarılır. Sunucuda model `claude-opus-5`. Anahtar asla uygulamaya gömülmez. |
| **OpenAI API** | Sesli notu yazıya çevirme (Whisper) | Anahtar GitHub Secrets'ta (`OPENAI_API_KEY`). |
| **Upstash Redis** | Kullanım hakları, kötüye kullanım sınırı, maliyet ölçümü | Vercel entegrasyonuyla kurulu (Vercel → Storage → Open in Upstash). Değişkenler `KV_REST_API_*`. Ölçüm anahtarları `stats:YYYY-MM-DD`. |
| **RevenueCat** | Abonelikler (iki mağaza tek yerde) | Synvia projesi kurulu; Google RTDN bağlı ("Connected"). Yeni uygulama için RevenueCat'te yeni bir uygulama/proje açılır. |
| **Sentry** | Çökme/hata raporu | Org `aydinapp` (AB bölgesi), Synvia projesi `react-native`. Sentry MCP bağlantısı var. Kişisel veri, ekran görüntüsü, oturum kaydı toplanmaz. |
| **Google Search Console / Vercel Analytics** | Site görünürlüğü, çerezsiz sayaç | Kurulu. |
| **Sonar (claude.ai bağlayıcısı)** | Mağaza anahtar kelime ve rakip analizi | Bağlayıcı var ama oturumda yeniden yetki isteyebiliyor; ücretsiz kota günde ~5 kelime. Yorum çekmek kredi ister. |

## 4. Anahtarlar nerede (değerler değil, yerleri)
- **GitHub → `Manyaq25/myterm` → Settings → Secrets → Actions:** `EXPO_TOKEN`, `VERCEL_TOKEN`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `APP_SHARED_SECRET`, `PLAY_SERVICE_ACCOUNT_JSON`, `ASC_KEY_ID`, `ASC_KEY_P8`.
  Bu değerleri Claude okuyamaz; sadece iş akışları kullanır. **Yeni uygulamayı aynı depoda tutarsan hepsi hazır kullanılır**; ayrı bir depoya geçersen kullanıcının bunları yeni depoya bir kez eklemesi gerekir.
- **Claude ortamı network secret:** `*.expo.dev` için Expo anahtarı.
- **claude.ai bağlayıcıları:** GitHub, Expo, Sentry, Sonar (oturum açılırken yüklenir).

## 5. Hazır otomasyonlar (GitHub Actions, `actions_run_trigger` ile)
- `eas-build.yml`: platform + profil seç, istersen bitince test kanalına gönder.
- `eas-update.yml`: OTA güncelleme (mesaj + kanal).
- `deploy-backend.yml`: sunucuyu Vercel'e yayınlar, gizli anahtarları Vercel ortamına aktarır.
- `app-store.yml` (`tools/store/asc.py`): `check` | `offers` | `prepare <sürüm> <derleme> [--no-screenshots]` (sürüm açar, derlemeyi bağlar, "Yenilikler" ve 6.9" görselleri yükler; incelemeye göndermez).
- `play-screenshots.yml` (`tools/store/play_screenshots.py`): Play mağaza sayfaları, görseller, web sitesi adresi (önce `dry_run`).
- `expo-check.yml`: Expo anahtarı geçerli mi, derleme yapmadan kontrol.

## 6. Bilinen tuzaklar (öğrenilmiş dersler)
- **Bu bulut ortamının vekil sunucusu `api.appstoreconnect.apple.com`'u engeller.** Yeni bundle ID / profil isteyen iOS derlemeleri Expo sunucusunda başlatılır (Expo MCP `build_run`, gitRef `main`). App Store Connect API işleri GitHub Actions'ta çalışır.
- Mağaza ve bazı dış siteler bu ortamdan doğrudan açılamaz; gerekirse GitHub Actions veya kullanıcının ekran görüntüsü kullanılır.
- **App Store görselleri:** yüklemeden önce "View All Sizes in Media Manager"; 6.9" (1320×2868) ve 6.3" (1206×2622) ikisi de güncellenir. Play için 1080×1920.
- **Yerel (native) modül değişikliği** asla sadece OTA ile gönderilmez; yeni derleme gerekir. OTA yalnızca aynı sürüm numaralı derlemelere gider (`runtimeVersion: appVersion`).
- `eas update`, `eas.json` içindeki `env`'i okumaz; herkese açık anahtarlar (RevenueCat SDK, sunucu adresi) kodda varsayılan olarak tutulur.
- Expo SDK 54'te kalınıyor (güncelleme ertelendi; Apple/Google zorunluluğu gelince adım adım).

## 7. Ürün ilkeleri (kullanıcı kararları)
- **REKLAM YOK.** Para tarafı çok net: sürpriz ücret yok, jeton karmaşası yok, kolay iptal, ödeyen özgürce kullanır (arka planda görünmeyen adil kullanım sınırı olabilir).
- Hesap açtırmadan çalışmak, veriyi telefonda tutmak tercih edilir; gizlilik iddiası mağaza veri formuyla birebir aynı olmalı.
- Metinler uygulamayı hiç bilmeyen biri için yazılır; iç terim kullanılmaz. 12 dil hedeflenir (tr, en, de, fr, es, it, pt, ru, ar, ja, ko, zh).
- Yapay zekâ kalitesi öncelikli; maliyet ölçülür (Upstash), birim maliyet ve fiyat zarar etmeyecek şekilde hesaplanır.
- Site: her uygulama için `web/apps/<uygulama>/` altında gizlilik, destek, veri silme sayfaları (TR + `web/en/...`), koyu tasarım (`web/assets/legal.css`).

## 8. Kullanıcının yapması gereken (gerçekten kaçınılmaz) birkaç şey
Sadece zamanı gelince, tek tek iste:
1. App Store Connect'te yeni uygulama kaydı (gerekirse) ve ilk "Submit for Review".
2. Play Console'da yeni uygulama kaydı, içerik/veri güvenliği formlarındaki beyanlar ve "Yayınla".
3. RevenueCat'te yeni uygulama ve mağaza ürünlerinin fiyatları (fiyat kararı kullanıcının).
4. Para harcatan her şey (ör. reklam, ücretli plan).

## 9. Okunacak diğer dosyalar
- `docs/YOL_HARITASI.md` — Synvia'nın tüm kararları ve geçmişi.
- `docs/YENI_UYGULAMA_FIKIRLERI.md`, `docs/sohbet-analizi-rakip-yorumlari.md` — yeni uygulama fikirleri, talep kontrolü, rakip analizi, maliyet tahmini.
- `AGENTS.md` / `CLAUDE.md` — depo kuralları (Expo sürüm belgeleri, derleme/gönderim kuralı).
