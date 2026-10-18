# Unwrap – ilk sürüm kapsamı (taslak, 18 Ekim 2026)

Kararların kaynağı: `docs/YENI_UYGULAMA_FIKIRLERI.md`, rakip incelemesi `docs/sohbet-analizi-rakip-yorumlari.md`, model testi `docs/sohbet-analizi-model-testi.md`.

## 1. Ürün tek cümlede
WhatsApp / Telegram sohbetini (ya da ekran görüntüsünü) yükle → telefonda istatistik + eğlenceli kartlar (ücretsiz) → yapay zekâ ile derin analiz, kanıtlı eğlence kartları ve AI Koç (ücretli, tek paket).

**Mağaza adı:** Unwrap: Sohbet Analizi · **Alt başlık:** İlişki analizi, sohbet karnesi · **Yaş:** 18+

## 2. Para (karar kullanıcıda; rakamlar öneri)
- Tek paket, her şey dahil: reklam yok, jeton yok, ek paket yok.
- Ücretsiz deneme (7 gün) → **aylık ₺139,99** veya **yıllık ₺999,99** (aynı içerik).
- Ödeme ekranı, kullanıcı ücretsiz sonucunu gördükten **sonra** çıkar; görünür kapatma (X); "otomatik yenilenir, istediğin an iptal" düğmenin hemen üstünde.
- Apple/Google penceresindeki ürün adı ödeme ekranıyla aynı ("Unwrap – Aylık"). İptal edene indirim oyunu yok.
- Arka planda adil kullanım: ayda ~40–50 Sonnet raporundan sonra raporlar Haiku ile sürer (kullanıcıya kilit gösterilmez).

## 3. Ekranlar (ilk sürüm)
1. **Karşılama (3 kart, kaydırmalı):** "Sohbetinin karnesini al" · "İstatistiklerin bedava, telefonunda hesaplanır" · "Reklam yok, jeton yok, tek fiyat". Bildirim izni burada istenmez.
2. **Ana sayfa:** büyük "Sohbet yükle" düğmesi; analiz türleri: İlişki, Arkadaş, Aile, Grup, Yıl Özeti (Aralık'ta "2026 Özeti"); geçmiş analizler listesi.
3. **Dışa aktarma rehberi:** 5 adım, resimli, Türkçe WhatsApp görselleri; iPhone / Android / Telegram sekmeleri; "Ekran görüntüsü ile yükle" yedek yolu; sık hata ve çözümleri.
4. **İçe aktarma:** dosya paylaşımla gelir (Paylaş → Unwrap) veya dosya seç. Telefonda işlenir: "Sohbetin telefonunda okunuyor…".
5. **Kurulum soruları (2 adım, düğmeli):** "Bu sohbette sen hangisisin?" · "Bu kişi senin neyin?" (Sevgili / Eş / Flört / Eski sevgili / Arkadaş / Aile / İş / Diğer).
6. **Ücretsiz sonuç (hikâye kartları):** telefonda hesaplanan her şey (bkz. 4.1) + 1 AI ön izleme kartı. Her kartta "Hikâyeyi paylaş".
7. **Ödeme ekranı:** tek paket, aylık/yıllık seçimi, maddeler, "7 gün ücretsiz", X.
8. **Tam rapor (hikâye kartları + özet sayfası):** AI kartları (bkz. 4.2), "Sohbet Karnesi" kartı, final kartı; altta "Bu sohbet hakkında koça sor".
9. **AI Koç:** üstte hangi sohbetle konuşulduğu yazar; hazır sorular (kategorili); serbest yazı; rol yapma; seans sonu not + 👍/👎.
10. **Ayarlar:** Aboneliği yönet (Apple/Google sayfası), geri yükle, verilerimi sil (analizler / koç), gizlilik, şartlar, destek, dil.

## 4. Kartlar
### 4.1 Ücretsiz (telefonda, AI'sız)
Kim daha çok yazıyor · Sohbeti kim başlatıyor · Ortalama cevap süresi (birim açık: dk/sa) · Kaç gün konuştunuz · En aktif saat / gece kuşu · En çok kullanılan emoji · Ortalama kelime · Kaç kez güldünüz (😂, haha, ksksks…) · Rekorlar: en uzun sessizlik (ghosting), en hızlı cevap, en çok art arda mesaj · "Aynen" / "tamam." sayacı · Grup ödülleri (organizatör, emoji makinesi, gece kuşu, sessiz izleyici).

### 4.2 Ücretli (AI, her kartta 1–2 örnek mesaj + "eğlence amaçlıdır")
İlgi göstergesi · Kim daha romantik · Kim daha çok çabalıyor · Kim daha çok "seni seviyorum / özledim" diyor · Sevgi sözcükleri · Kim daha çok özür diliyor · İmalı / iğneleyici mesajlar · Kim daha çok yalan söylüyor (eğlence) · Kim daha manipülatif (eğlence) · Kim daha baskın · Arzu (sevgili/eş türünde) · En çok güldüğünüz mesaj (tarihli alıntı) · Ton ve satır araları ("Tamam.", "Sen bilirsin") · Ne yazmalı (2 öneri) · Sohbet Karnesi (ilgi 5, hız 3, espri 5, trip 2) · Final: "Bu ilişki nereye gider?".
- Kartların dili ilişki türüne göre değişir (arkadaşta "romantik" ve "arzu" yerine "kanka sadakati" gibi kartlar).
- Sayılar makul ve kanıtlı; AI kart için örnek mesajı seçer.

## 5. AI Koç
- Her zaman bir analizin içinden açılır; analizdeki gerçek sayı ve alıntıları kullanır; uydurma istatistik vermez.
- Hazır soru kategorileri: Ne yazmalıyım · İlgi ve yakınlık · Güven ve sadakat (aldatma soruları dahil) · Kavga ve barışma · Ayrılık ve unutma · Kendimi anlamak.
- Rol yapma: eski sevgili / sevgili / hoşlandığım kişi / hayalimdeki kişi; romantik ve sıcak olabilir, açık cinsel içerik üretmez.
- Model: rapor Sonnet 5.5 (effort low), koç Haiku 5.5; sohbet önbellekte tutulur (prompt caching).

## 6. Gizlilik
- İstatistik telefonda; AI için seçilen mesajlar sunucuya şifreli gider, işlenir, saklanmaz. IBAN, telefon, e-posta maskelenir.
- Hesap açmak gerekmez. İzleme/reklam aracı yok; yalnız kişisel veri toplamayan Sentry.
- Gizlilik metni ile mağaza veri formu birebir aynı.

## 7. Teknik (Synvia altyapısı)
Expo SDK 54 + expo-router · RevenueCat (tek "entitlement", aylık/yıllık ürün) · sunucu: mevcut Vercel backend'e `/api/unwrap/*` uçları + Upstash ile kullanım sayacı · Anthropic API · 12 dil hedefi, ilk sürüm Türkçe + İngilizce · site: `web/apps/unwrap/`.

## 8. İlk sürümde yok (sonra)
Yıl Özeti (Aralık'ta gelir) · Instagram DM içe aktarma · sesli mesaj analizi · widget.

## 9. Tasarım (Google Stitch)
Ekran komutları: `docs/unwrap/STITCH_KOMUTLARI.md`. Kullanıcı Stitch'te üretir, beğendiklerini ekran görüntüsü / dışa aktarım olarak gönderir; kod Expo'da yazılır, Stitch HTML'i görsel rehber olarak kullanılır.
