# Unwrap (sohbet analizi): rakip yorumları (ilk tur)

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
