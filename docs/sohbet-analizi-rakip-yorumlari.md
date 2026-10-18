# Sohbet analizi: rakip yorumları (ilk tur)

Tarih: 16 Ekim 2026. Kaynak: web araması sonuçları. Mağaza sayfaları (apps.apple.com, play.google.com, itunes.apple.com) bu ortamın ağ ayarında kapalı olduğu için yorumlar doğrudan çekilemedi; puanlar ve alıntılar arama özetlerinden geliyor, canlı sayfadan doğrulanmalı.

Not: Depoda "Narya" adı geçmiyor. Narya, Google Play'de 11,7 bin puanlı mevcut bir sohbet özeti uygulaması olarak çıktı, bu yüzden onu ana rakip olarak ele aldım. Depodaki fikir notu: `docs/YENI_UYGULAMA_FIKIRLERI.md` bölüm 2.

## Narya'nın olumsuz yorumları

Google Play: "Narya: Wrapped Chat Recap" (`com.modernist.whatwrapped`), 4,4 puan, ~11,7 bin yorum. App Store: "NARYA: Wrapped & AI Coach" (id6740577449), 4,2 puan, 272 puan. mwm.ai toplayıcısı App Store için 638 yorumdan 1,9/5 gösteriyor (otomatik özet olabilir, dikkatli okunmalı).

**Google Play**
- Ya öde ya reklam izle; çok reklam izledikten sonra analiz yeniden kilitleniyor, ardından abonelik dayatılıyor. "Zaman kaybı."
- Ödeme ekranı, uzun süren dışa aktarma ve analiz beklemesinden **sonra** çıkıyor.
- Ücretsiz sonuçlar yüzeysel.
- Veri kaygısı: "Kaldırmadan önce ayarlardan verini sil." Mağaza açıklaması cihazda analiz diyor, veri güvenliği bölümü üçüncü taraflarla paylaşım yazıyor.

**App Store**
- Abonelik iptali, beklenmedik ücret ve işlenmeyen iade şikâyetleri; reddedilen iade sonrası "dolandırıcılık" diyen kullanıcı.
- Para ödedikten sonra fotoğraf veya dosya yüklenemedi, uygulama çalışmadı.
- iMessage desteklenmiyor; kullanıcı bunu ödedikten sonra öğrenmiş.
- Hem abonelik hem jeton paketi var, kafa karıştırıyor. Otomatik yenileme bitişten 3 gün önce.
- AI doğruluğuna güvensizlik.
- Geliştiricinin cevabı: "Her analizin gerçek AI maliyeti var, ücretsiz olamaz."

## Seçilen rakipler

| Uygulama | Mağaza | Puan | Yorum sayısı |
|---|---|---|---|
| Narya: Wrapped Chat Recap (`com.modernist.whatwrapped`) | Google Play | 4,4 | ~11,7 bin, 500 bin+ indirme |
| NARYA: Wrapped & AI Coach (id6740577449) | App Store | 4,2 | 272 |
| The Cringe: Chat Wrapped | App Store / Google Play | 3,6 / 4,4 | 102 / ~3,9 bin |
| ChatScope: Message Wrapped (GESoft) | Google Play | 4,8 | 957 |
| ChatScope: Message Analysis (Gizem Şahin) | App Store | 4,5 | 122 |
| ChatRewind AI | App Store | 2,5 | 15 |
| Flört Uzmanı: AI Sohbet Analiz (TR) | App Store | 3,9 | 18 |
| Aynen AI: İlişki Analizleri (TR) | App Store | bilinmiyor | az |
| Peersona: Message Analyzer (TR, Bizera) | App Store | yorum bulunamadı | Nisan 2026'da çıktı |

## Tekrarlayan şikâyetler

1. **Paywall sonradan çıkıyor.** Narya: "Sohbeti dışa aktarıp analizi bekledikten sonra ödeme istiyor." Kullanıcı emeği boşa gidiyor hissi.
2. **Reklam izle, sonra yine kilitli.** Narya: "Ya öde ya reklam izle, çok reklam izledikten sonra her şey yeniden kilitleniyor."
3. **Ücretlendirme ve iptal sorunları.** Narya için bir toplayıcı sitede 1,9/5 (638 yorum) ve iptal, beklenmedik ücret, iade şikâyetleri. ChatScope (Play): tekrar tekrar ücret çekme suçlaması. Aynen AI: "birkaç kez ücret çekildi, premium'a erişemedim". ChatRewind: "premium aldım ama kredi istiyor".
4. **WhatsApp dışa aktarma çalışmıyor.** The Cringe'in son yorumlarının çoğu dışa aktarmanın başarısız olduğunu söylüyor.
5. **Gizlilik güvensizliği.** Narya cihazda analiz diyor ama veri güvenliği bölümünde üçüncü taraflarla paylaşım yazıyor; bir kullanıcı "kaldırmadan önce ayarlardan verini sil" uyarısı yapmış. Başka bir analiz uygulamasında "veri saklanmıyor iddiası yanıltıcı, en azından sunucuda kısa süre duruyor" yorumu var.
6. **Zayıf AI cevapları (Türkçe rakipler).** Flört Uzmanı: "piyasadaki benzerlerine göre çok dandik", "cevaplar anlamsız, zaman kaybı".
7. **Ücretsiz sonuç çok yüzeysel / bilgiler görsellerin arkasında gizli.**

## Övülenler

- Konsept eğlenceli, paylaşılabilir "wrapped" özeti seviliyor; "ilişkiyi anlamaya yardımcı oluyor".
- Narya geliştiricisi ücreti "her analizin gerçek AI maliyeti var" diye savunuyor; kullanıcılar ücretin kendisinden çok şeffaf olmamasına kızıyor.

## Bizim için çıkarımlar

- Ücretsiz katmanda gerçek bir sonuç (cihazda istatistik: kim çok yazıyor, cevap süreleri) göster; AI yorumunu ücretli yap ve bunu dışa aktarmadan **önce** söyle.
- Kredi + abonelik karışımı yapma; tek, net fiyat ve kolay iptal.
- Dışa aktarma rehberini adım adım ve hata mesajlarıyla ver; ekran görüntüsü yolunu yedek olarak sun.
- Gizlilik iddiası veri güvenliği formuyla birebir tutmalı; "verilerimi sil" düğmesi görünür olsun.
- Türkçe AI kalitesi asıl fark: Türk rakiplerin en büyük zayıflığı bu.

## Sonraki adım

Gerçek yorum metinlerini (özellikle 1–3 yıldız) toplu çekmek için mağaza adreslerine ağ izni gerekiyor.

## Kaynaklar

- https://play.google.com/store/apps/details?id=com.modernist.whatwrapped
- https://apps.apple.com/us/app/narya-wrapped-ai-coach/id6740577449
- https://www.appbrain.com/app/narya-wrapped-chat-recap/com.modernist.whatwrapped
- https://aipure.ai/products/narya
- https://apps.apple.com/mx/app/6766070732?l=en-GB&see-all=reviews&platform=iphone
- https://play.google.com/store/apps/details?id=com.whatsappwrapper.chatanalyzer.chatscope
- https://apps.apple.com/us/app/chatscope-message-analysis/id6745802989
- https://apps.apple.com/us/app/chatrewind-ai-chat-wrapped/id6740853496
- https://apps.apple.com/tr/app/fl%C3%B6rt-uzman%C4%B1-ai-sohbet-analiz/id6761316258?see-all=reviews&platform=ipad
- https://apps.apple.com/tr/app/aynen-ai-i-li%C5%9Fki-analizleri/id6740404126?l=tr
- https://mwm.ai/apps/app/6759302247
- https://play.google.com/store/apps/details?id=dev.scarinci.chatanalyzer
- https://play.google.com/store/apps/details?id=chat.analysis.ai

## İkinci tur (16 Ekim): Narya ayrıntıları ve Şikayetvar
Kaynak yine web araması parçaları; mağaza ve Şikayetvar sayfaları doğrudan açılamadı.

- Geliştirici: Modernist Yazılım (Türk). App Store TR: 4,1 puan, ~2,4 bin değerlendirme; mwm.ai'deki 638 yazılı yorumun ortalaması 1,9 (puan yüksek, yazılı yorumlar çoğunlukla olumsuz).
- Şikâyetlerin neredeyse hepsi para tarafında; AI kalitesi şikâyeti az.
- Ücretsiz sürüm yalnızca 3 bilgi gösteriyor; "kişisel verini alıp sonuç için abonelik istiyor".
- Google Play'de her dokunuşta reklam; reklamla açılan içerik sonra yeniden kilitleniyor ("etik değil").
- Güncellemeden sonra VIP üyeler jeton sistemine geçirilmiş, ödenen hak boşa çıkmış.
- Şikayetvar: tek seferlik sanılan satın alma haftalık aboneliğe dönmüş; beklenenden yüksek çekim; uygulamada iptal düğmesi yok; destek yalnız e-posta, yanıt yok; 260 TL, 320 TL ve 1.299 TL (yıllık) için iade alınamamış.
- Haftalık fiyat yüksek bulunuyor; tek bir rapora ödenen para değmiyor deniyor.
- Küçük teknik sorunlar: satın aldıktan sonra dosya/fotoğraf kabul etmeme, kaydırılamayan kesik metin.
- Geliştirici yanıtları kalıp: "her analizin maliyeti var", puan güncelleme ricası.

**Ek dersler:** ana ürün tek seferlik rapor olabilir ("1 sohbet raporu = X ₺", abonelik isteğe bağlı ve açık); satın alınmış haklara güncellemeyle dokunulmaz; uygulama içinde "Aboneliği yönet" bağlantısı ve hızlı destek (Şikayetvar sicili Türkiye'de önemli); gizlilik cümlesi ödeme ekranının yanında.

Ek kaynaklar: https://www.sikayetvar.com/narya-wrapped-ai-koc · https://mwm.ai/apps/narya-wrapped-ai-coach/6740577449 · https://apps.apple.com/tr/app/narya-wrapped-ai-ko%C3%A7/id6740577449?l=tr

## Narya fiyatları (17 Ekim 2026, App Store TR, arama sonucundan; canlı sayfadan doğrulanmalı)
| Paket | Haftalık | Aylık | Yıllık |
|---|---|---|---|
| Premium | ₺79,99 | ₺139,99 | ₺999,99 |
| VIP Sohbet Paketi | ₺199,99 | ₺159,99 | ₺1.299,99 |
| VIP Mega Sohbet Paket | ₺249,99 | – | – |

Jeton: 200 = ₺49,99 · 500 = ₺99,99 · 1000 = ₺169,99. Toplam 10 farklı ürün; haftalık VIP aylığa vurulunca ~₺860. Şikayetvar'da haftalık ₺64,99 kesinti ve beklenmeyen ₺259 çekim bildirimleri var.
Not: Bizim önerimiz aylık ~₺150, Narya Premium aylıktan (₺139,99) biraz pahalı; "daha ucuz" ilkesi için fiyat yeniden düşünülmeli.

### Narya paketlerinin farkı (17 Ekim, arama sonucu)
Resmî bir karşılaştırma bulunamadı; mağaza sayfaları yalnızca paket adlarını ve fiyatlarını veriyor.
- Bilinen: Google Play'de geliştirici "abone olarak tüm Wrapped'lere sınırsız erişim" diyor → Premium büyük ihtimalle raporların (Wrapped) kilidini açıyor.
- Bilinen: Uygulamada bir "AI İlişki Koçu" sohbeti var; "VIP Sohbet Paketi" adı büyük ihtimalle bu koçla yazışmayı kapsıyor (tahmin).
- "VIP Mega Sohbet Paket" yalnızca haftalık; adından daha fazla koç mesajı içerdiği tahmin ediliyor, içeriği yazılı değil.
- Jeton ayrı satılıyor ve ne aldığı yazmıyor; bir App Store yorumu "VIP üyelik jetonsuz işe yaramıyor, güncellemeden sonra jeton istendi" diyor.
- Kesin içerik için uygulamayı indirip satın almadan ödeme ekranına bakmak gerekiyor.

### Narya'nın özellikleri (17 Ekim, mağaza açıklamalarından; görseller görülemedi)
- AI "ilişki analisti": duygu kalıpları, cevap hızı, sohbeti kimin yönettiği.
- "Bağ Endeksi" (Connection Index) ve paylaşılabilir raporlar ("Wrapped").
- Kim daha çok yazıyor; ghosting ve art arda mesaj (double texting).
- Kim daha çok "seni özledim" / "seni seviyorum" diyor.
- Olası manipülasyon ve pasif-agresiflik işaretleri.
- Grup sohbeti Wrapped: grup dinamiği ve roller (App Store açıklaması; bazı ikincil kaynaklar yalnız birebir sohbet diyor).
- AI İlişki Koçu: kırmızı bayraklar, duygusal dengesizlik, iletişim sorunları üzerine sohbet.
- "Analiz çoğunlukla cihazda" iddiası (veri güvenliği formunda üçüncü tarafla paylaşım yazıyor).
Kaynaklar: https://play.google.com/store/apps/details?id=com.modernist.whatwrapped · https://whatswrappedapp.com/ · https://apps.apple.com/us/app/narya-wrapped-chat-recap/id6740577449

## Narya uygulama içi inceleme (18 Ekim 2026, kullanıcının iPhone ekran görüntüleri, satın alma yapılmadı)
**Akış:**
1. Açılış: "Tüm dünyada 10+ milyon kullanıcı".
2. Bildirim izni ilk saniyede (hiçbir değer göstermeden).
3. Hikâye tarzı 6 tanıtım kartı: İlişki Özeti ("Aşk hikâyenizi gözden geçirin"), İlişki Koçu ("Aşkınızı iyileştirin"), Sadece Sana Özel, Sohbet Özeti, Grup Sohbeti Özeti ("Grubunun enerjisini keşfet"), 2025 Özeti (yıl sonu, Wrapped mantığı). Alt metin hep aynı: "Duygusal örüntüleri, olumsuz sinyalleri ve gizli dinamikleri keşfedin." Devam = şartları kabul.
4. App Store puan isteği, hiçbir şey kullanılmadan (mağaza puanı yüksek, yazılı yorumlar düşük: büyük ihtimalle bu yüzden).
5. 5 adımlı resimli WhatsApp dışa aktarma rehberi (sohbeti aç → başlığa tıkla → en alta kaydır → "Sohbeti dışa aktar" → "Medyayı ekleme" → paylaşımda Narya). WhatsApp'ı doğrudan açıyor. Paylaşım menüsünde eski ad "WhatWrapped". İyi yapılmış.
6. Her adımda: "Verilerin cihazında kalır ve bizimle hiçbir zaman paylaşılmaz." (AI sunucudaysa çelişkili; mağaza veri formunda üçüncü tarafla paylaşım yazıyor.)
7. Ödeme ekranı **hiçbir sonuç göstermeden**: başlık "Bir Şeyler Tuhaf Geliyor! Hissediyorsun ama açıklayamıyorsun" (korku dili). Yalnız iki seçenek: **Haftalık ₺249,99** ("₺35,71/günlük") ve **Yıllık ₺1.299,99** ("₺3,56/günlük", "%85 İNDİRİM", varsayılan seçili). Aylık yok, ücretsiz deneme yazmıyor, görünür kapatma (X) yok.
8. Ana sayfa: 2025 Özet ("Yeni"), İlişki Özeti, Grup Sohbeti Özeti, Sohbet Özeti (hepsi "2025" etiketli) ve bir kart daha (büyük ihtimalle Koç). Ödeme ekranı ana sayfada tekrar açılıyor.
- Premium / VIP / Mega adları ödeme ekranında hiç geçmiyor; kullanıcı neyi aldığını göremiyor. Haftalık ₺249,99 = mağazadaki "VIP Mega" fiyatı, yıllık ₺1.299,99 = "Yıllık VIP".
- İçerik güncel değil: Ekim 2026'da hâlâ "2025" etiketi ve "Yeni" yazıyor.

**Bizim için:**
- Önce değer, sonra ödeme: ücretsiz istatistik + bir kart, ödeme ekranı sonra; merak dili, görünür X.
- Bildirim izni ve puan isteği doğru anda (ilk rapordan sonra).
- Dışa aktarma rehberi en az onunki kadar iyi; Android ve Telegram adımları da.
- Ürünler: İlişki, Sohbet, Grup, Yıl Özeti ve Koç; hepsi tek pakette. Aralıkta güncel "2026 Özeti".
- Fiyat kıyası: Narya'nın görünen kısa seçeneği haftalık ₺249,99 (~₺1.000/ay); yıllığı ~₺108/ay.
- Kullanıcı gözlemi (18 Ekim): ödeme yapmadan içerik görülemiyor; dışa aktarma sonrası da analizden önce abonelik istenmesi bekleniyor (yorumlardaki "dışa aktarıp bekledikten sonra ödeme istiyor" şikâyetiyle uyumlu). Ücretsiz önizleme varsa da birkaç bilgiden ibaret. Unwrap farkı: istatistik ve ilk kart ödeme olmadan gösterilir.

## Narya şartlar ve gizlilik metni (18 Ekim, arama özetinden; whatwrapped.com bu ortamdan açılamadı)
- Şartlar: https://whatwrapped.com/termsandconditions · Gizlilik (ayrı alan adı): https://whatswrappedapp.com/privacypolicy
- İade: yalnız sitesinden alınan satın almalarda 30 gün içinde, "gerçek kullanım" kanıtıyla (ör. Wrapped tamamlamak ya da 7 gün üst üste kullanım). "Fikrimi değiştirdim" ve "aboneliği / otomatik yenilemeyi bilmiyordum" gerekçeleri reddediliyor. App Store / Google Play alımları mağaza politikasına tabi. Açılmış içerik iade edilmiyor; diğer her şey "kesin satış".
- Gizlilik çelişkisi: şartlar "analiz cihazda, sohbet verisi sunucumuza hiç ulaşmaz, AI özellikleri aksi belirtilmedikçe cihazda" diyor; gizlilik politikası ise "anonimleştirilmiş bazı veriler üçüncü taraf AI işleme servislerine gidebilir" diyor ve izleme araçları listeliyor: Firebase / Google Analytics, Amplitude, AppsFlyer. Mağaza veri formları da uygulama etkinliği ve cihaz kimliğinin üçüncü taraflarla paylaşıldığını yazıyor.

**Bizim için:**
- Gizlilik metni tek ve doğru: "İstatistik telefonda hesaplanır. AI yorumu için seçilen mesajlar şifreli olarak sunucumuza gider, yapay zekâ sağlayıcısında işlenir, saklanmaz." Mağaza formu birebir aynı.
- Reklam/izleme aracı yok (AppsFlyer, Amplitude yok); yalnız kişisel veri toplamayan hata raporu (Sentry, Synvia'daki gibi).
- İade ve iptal sade: uygulama içinde "Aboneliği yönet" ve Apple / Google iade sayfasına doğrudan bağlantı; "otomatik yenilenir" bilgisi ödeme düğmesinin hemen üstünde, büyük harfle.
- Gizlilik politikası (https://whatwrapped.com/privacypolicy, arama özeti; tam metin açılamadı, aynısı gibi görünen kopya whatswrappedapp.com'da): sohbet dosyası "tamamen cihazda işlenir, dış sunucuya yüklenmez" ama "anonimleştirilmiş bazı veriler üçüncü taraf AI servislerine gidebilir". Toplanan: cihaz türü, işletim sistemi, kullanım istatistikleri. Araçlar: Qonversion (abonelik), Firebase / Google Analytics, Amplitude, AppsFlyer. App Store etiketi: izleme amaçlı tanımlayıcılar, kullanıcı ve cihaz kimliği, kullanım ve çökme verisi. Saklama süresi yazmıyor.
- Şartlarda: App Store iade talebinde uygulama içi kullanım bilgisi Apple'a gönderilebiliyor (Apple'ın "tüketim bilgisi" yolu; geliştirici "kullandı" bilgisiyle iadeye karşı çıkabiliyor). Bizde yapılmaz.

## Narya İlişki Özeti: ücretsiz ve kilitli kartlar (18 Ekim, kullanıcının denemesi; kişi adları yazılmadı)
Hikâye tarzı ~20 kart; her kartın altında "Hikâyeyi Paylaş" (Instagram Hikâye, WhatsApp, Facebook, X).

**Ücretsiz (3 kart):**
1. "Konuşmayı en çok kim başlatıyor?": isim + "20 defa sohbeti başlatan taraf olmuş 👏".
2. "Birbirinize olan ilgi seviyeniz nedir?": iki çubuk, %64 ve %31 (toplam 100 değil). "Mesaj yoğunluğu, emoji kullanımı ve sohbeti sürdürme çabası incelenerek hesaplandı."
3. "Ortalama ne kadar sürede yanıt veriyorsunuz?": 20 sn ve 19 sn. Altında hazır metin: "Opps, birileri zamanlamada biraz daha çaba göstermeli galiba! 🤭" (1 saniyelik fark için anlamsız; metin veriye göre değişmiyor).

**Kilitli ("Tüm kilitleri aç 🔑", "İlişki Özetini Gör 👀"):** Kim daha manipülatif? · Kim daha baskın? · Kim daha çok "seni seviyorum" demiş? · Kim kaç defa yalan söylemiş? · Kim daha romantik? · Kim ne kadar çabalamış? · Kim kaç defa imalı mesaj göndermiş? · Kim kaç defa özür dilemiş? · En çok hangi konudan konuşuyorsunuz? · En çok kullandığınız sevgi sözcükleri · Kaç gün konuştunuz? · Birbirinize söylediğiniz ilk sevgi cümlesi · Ortalama kaç kelime kullanıyorsunuz? · Birlikte kaç defa gülmüşsünüz? · Birbirinizi ne kadar arzuluyorsunuz? · Favori sevgi emojiniz · En çok güldüğünüz mesaj. Toplam 20 kart: 3 ücretsiz, 17 kilitli. Kilitlilerin yaklaşık yarısı (kelime, gülme, emoji, gün sayısı) telefonda AI'sız hesaplanabilir.

**Gözlemler:**
- Sohbet arkadaş/iş arkadaşı sohbeti olduğu hâlde her kart kalpli ve "aşk" çerçeveli; ilişki türüne uyum yok.
- "Kaç gün konuştunuz?" gibi telefonda saniyede hesaplanan basit sayılar bile kilitli (ödeme baskısı).
- "Kim kaç defa yalan söylemiş?", "Kim daha manipülatif?" gibi kartlar AI'ın gerçekten bilemeyeceği, kişiyi suçlayan iddialar; paylaşılınca kırıcı ve riskli.
- Hazır espri metinleri veriye uymuyor (19 sn / 20 sn için "biraz daha çaba").

**Unwrap için:**
- Önce ilişki türünü sor/anla (sevgili, arkadaş, aile, iş, grup) ve kartların dilini ona göre seç.
- Telefonda hesaplanan bütün sayılar ücretsiz: kim başlatıyor, cevap süresi, kaç gün, en aktif saat, emoji, kelime, rekorlar. Ücretli olan AI yorumu (ton, imalar, özürler, konular, ilk sevgi cümlesi, "ne yazmalı").
- Suçlayıcı kart yok: "yalan", "manipülatif" yerine "Kim daha çok özür diliyor?", "İmalı mesajlar (eğlence amaçlı)", "Kim sohbeti daha çok taşıyor?" gibi yumuşak, kanıtlı (alıntılı) kartlar.
- Yüzdeler toplamı 100; espri metni veriye göre yazılır (AI ya da kurallı şablon).
- Ana sayfa ve Apple ödeme penceresi (18 Ekim): Narya ekranında yalnız "Haftalık ₺249,99" yazan seçenek, Apple penceresinde **"Haftalık VIP Mega Sohbet Paket – 249,99 TL/hafta, abonelik"** olarak çıkıyor; yani en pahalı haftalık paket sunuluyor, mağazadaki haftalık Premium ₺79,99 hiç gösterilmiyor. Ana sayfada ayrıca "Narya Premium'u dene" düğmesi ve "Premium Özet'ler – Daha derin içgörüler ve AI analizlerinin kilidini aç" bölümü var (ödeme sonrası bile ayrı katman olabilir; "VIP aldım ama kilitli" şikâyetlerinin kaynağı olabilir). Premium Grup Sohbeti Özeti tanıtımı: "Baskın, dedikoducu, sinsi, drama kraliçesi, yönlendirici… Şimdi ortaya çıkma zamanı."
- Unwrap için: Apple penceresindeki ürün adı ödeme ekranıyla birebir aynı ("Unwrap – Aylık"); ödeme sonrası kilit kalmaz; grup ödülleri olumlu (Organizatör, Neşe kaynağı, Emoji makinesi, Gece kuşu), suçlayıcı etiket yok.

## Narya uygulama yapısı ve AI Koç (18 Ekim, kullanıcı ekran görüntüleri)
- Alt sekmeler: Ana Sayfa · Özetler · AI Koç · Ayarlar.
- Özetler: 2025 / Grup / İlişki / Sohbet (+ ile yeni); geçmiş listesi; her yeni özette 5 adımlı rehber baştan (görseller İngilizce WhatsApp).
- Premium özet tanıtımları: Sohbet "Ghostlananlar, emojiler, küfürler, kelimeler, sohbet serileri"; İlişki "Manipülasyon, sevgi, kontrol, aşk, güç… Bakalım kim ne yaptı?"; Grup "Baskın, dedikoducu, sinsi, drama kraliçesi…".
- AI İlişki Koçu: sekmeler Hızlı Başlangıç / Olumsuz Sinyal / Sohbet Notları; "Herhangi bir şey sor" kutusu. Hazır sorular kategorili: Genel (eğlenilecek mi evlenilecek mi, toksik ilişki, sağlıklı ilişki, nasıl tavlarım), AI Sohbet Asistanı (DM'den ne yazayım, sohbet tıkandı), Yakınlık ve İlgi Eksikliği (kaygılı bağlanma, mesajları kısa ve soğuk), Güven ve Sadakat (telefonunu gizliyor, aldatıyor mu, arkadaşlarıyla tatil), AI Rol Yapma (eski sevgili / partner / hoşlandığım kişi / hayalimdeki kişi gibi davran), İletişim, Krizler ve Ayrılıklar (onu nasıl unuturum, fazla mı büyütüyorum), Cinsellik ve Arzu, Çaba ve Eşitlik.
- Koç açılışı: "Ben senin ilişki koçun Narya… Özetindeki önemli sinyalleri (red flag) inceledim" ve kullanıcıya iki katılımcıdan hangisi olduğunu seçtiriyor. Çıkışta "Bu sohbeti sonlandırmak istediğine emin misin?".
- Ayarlar: "Premium Üyesin" satırı, puanlama isteği, şartlar, gizlilik, destek (e-posta; telefon ve uygulama bilgisi şifreli bir blokla ekleniyor), "Tüm Özet verilerini sil", "Tüm İlişki Koçu verilerini sil". Abonelik yönetimi / iptal bağlantısı yok.

**Unwrap için:** koç tek pakete dahil; hazır sorular kategorili ve doğal Türkçe; rol yapma ilk sürümde yok; aldatma / sadakat sorularında kesin hüküm yok, sakin ve yönlendirici dil; koç özetin bağlamını kullanır ve kullanıcının hangi taraf olduğunu başta bir kez sorar (analizde de kullanılır); Ayarlar'da "Aboneliği yönet" ve veri silme düğmeleri.
- Narya'nın Apple abonelik ayarlarında görünen tüm planları ("VIP Chat Group", 18 Ekim): Aylık VIP Sohbet Paketi ₺159,99 · Haftalık VIP Sohbet Paketi ₺199,99 · Haftalık VIP Mega Sohbet Paket ₺249,99 · Yıllık Premium Abonelik ₺999,99 · Yıllık VIP Sohbet Paketi ₺1.299,99. Aylık seçenek uygulama içi ödeme ekranında hiç gösterilmiyor (yalnız haftalık Mega + yıllık VIP). Kullanıcı test sırasında haftalık Mega'yı başlattı ve iptal etti (süre 25 Ekim'de doluyor); bu süre içinde ücretli içerik rakip incelemesi için görülebilir.

## Narya ücretli içerik incelemesi (18 Ekim, kullanıcı aboneliği iptal ettikten sonra süre dolana kadar; kişi adları yazılmadı)
**İptal sonrası geri kazanma teklifi:** "%92 İNDİRİM – Premium erişimini kaybetme: ~~₺199,99~~ ₺24,99/haftalık, alacağın en düşük fiyat".

**Ücretli İlişki Özeti kartları (gerçek eş sohbeti, 374 gün):** Kim daha manipülatif (66/34, "İkna sanatı mı, tatlı oyunlar mı? 😈") · Kim daha baskın (tek isim, "%61 oranla sözü geçen taraf") · Kim daha çok "seni seviyorum" (14/12) · Kim kaç defa yalan (20/6, "tutarsız ifadeler ve tekrar eden kalıplar") · Kim daha romantik (56/44) · Kim ne kadar çabalamış (51/49) · İmalı mesaj (173/140) · Özür (43/21) · Konu ("Duygusal Yakınlık") · Sevgi sözcükleri (seviyorum, canım, karım / kocam, canım, özledim) · Kaç gün (374, "4 mevsimlik hikâye") · Ortalama kelime (4/3) · Gülme (343) · Arzu (4/10, "alevlendirmenin zamanı 🪵😅") · Favori sevgi emojisi (😘 ×11) · En çok güldüğünüz mesaj (tarihli gerçek alıntı) · Final: "Bu ilişkinin sonu nereye gider?" (AI çizimi + "Kelimelerde Kaybolmak" başlığı).
- Kanıt yok: yalan / imalı / manipülatif sayılarının hiçbirinde örnek mesaj yok; 173 imalı mesaj gibi sayılar kelime taraması izlenimi veriyor.
- Hazır metinler veriyle çelişiyor: cevap süresi iki tarafta da "3s" (birim belirsiz) ama "birileri çaba göstermeli".
- İyi yanlar: sevgi sözcükleri doğru, tarihli gerçek alıntı kartı, final kartı ve "4 mevsim" gibi sıcak cümleler paylaşılmaya çok uygun; renkli, sade tasarım.

**AI Koç (ücretli):**
- Seans başında ilişki türünü butonla soruyor (Partner / Eş / Platonik / Arkadaş / Eski Sevgili / Diğer), sonra çoktan seçmeli sorularla ilerliyor; serbest yazı da var.
- Genel, terapi kalıbı cümleler; uydurma istatistik ("güven %70'in üzerindeyse mutluluk ciddi artıyor").
- **Kendi verisiyle çelişiyor:** koç "seni seviyorum nadiren söyleniyor, taraflardan biri çaba koymada eksik" dedi; oysa özet kartları 14/12 ve 51/49 gösteriyordu. Koç yanlış sohbete bağlıydı (önce yüklenen asker arkadaşı sohbeti) ve o arkadaş sohbeti için "5 olumsuz sinyal" çıkarmış: yüksek sayıda yalan, tek taraflı üstünlük, çaba eksikliği, düşük ilgi, nadiren "seni seviyorum". İlişki türünü bilmediği için arkadaşlık sohbetini sevgili gibi yargılıyor.
- Rol yapma (eski sevgili, "sıcak ve samimi"): akıcı ve duygusal; seans sonunda başlıklı "Sohbet Notu" özeti, "Tüm sohbeti gör", paylaş ve 👍/👎 geri bildirim. "Verileriniz anonimleştirilir, kullanıcı bazlı bilgi tutulmaz" yazıyor.

**Unwrap için:**
- İlişki türü analizin en başında sorulur; kartlar, sinyaller ve koç buna göre çalışır (arkadaşa "seni seviyorum az" denmez).
- Koç ve kartlar aynı hesaplanmış veriyi kullanır; çelişki olmaz. Koç rakam söylerken kartlardaki gerçek sayıyı ve örnek mesajı kullanır, uydurma istatistik vermez.
- Eğlence kartları (yalan, manipülatif, arzu dahil) kalır ama her birinde 1–2 örnek mesaj ve "eğlence amaçlı" notu; sayılar makul (AI seçer, kelime taraması değil).
- Alacağımız iyi fikirler: tarihli "en komik mesaj" kartı, "4 mevsim" gibi sıcak final, "Bu ilişki nereye gider?" final kartı, seans sonu not + geri bildirim, ilişki türü butonları.
