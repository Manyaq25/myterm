# Sohbet analizi: model testi (16 Ekim 2026)

Ham çıktılar: `tools/sohbet-test/sonuc/rapor-1.md`. Doğru cevap listesi: `tools/sohbet-test/beklenenler.md`. Ayar: her iki model `effort: medium`, aynı sistem istemi, istatistikler telefonda hesaplanmış gibi hazır verildi, IBAN maskelendi.

## Maliyet ve hız

| | Haiku 5.5 | Sonnet 5.5 |
|---|---|---|
| Ortalama süre | 13,5 sn | 15,8 sn |
| Ortalama çıktı | ~2.500 token | ~1.700 token |
| Gerçek boyutta analiz (~12 bin token girdi) | ~0,0024 $ (~0,11 ₺) | ~0,041 $ (~1,80 ₺) |
| 300 analiz/ay | ~0,73 $ | ~12,25 $ |
| Net gelir ~2,4 $/ay (150 ₺) içinde başa baş | ~1.000 analiz | ~58 analiz |

## Kalite puanı (beklenen bulgular, 30 madde)

| Sohbet | Haiku 5.5 | Sonnet 5.5 |
|---|---|---|
| 1. Soğuyan flört | 4/6 | 5/6 |
| 2. Kankalar grubu | 5,5/6 (paylaşım kartında yanlış bilgi) | 6/6 |
| 3. Anne – oğul | 5,5/6 | 6/6 |
| 4. İronik kavga | 5/5 | 5/5 |
| 5. Kanka sevgisi | 4/4 (+ küçük hata: "tezini bitiren") | 4/4 |
| **Toplam** | **~24/27 (%89)** | **~26/27 (%96)** |

İkisi de temel işi yapıyor: ironiyi ("harikasın", "aynen öyle canım"), pasif-agresif anne dilini ("sen bilirsin", "biz alıştık") ve sevgi dolu argoyu ("hain", "öldürürüm") doğru okudu. Hiçbiri yersiz alarm vermedi, IBAN'ı tekrarlamadı.

**Farklar:**
- Sonnet ince ayrıntıyı daha iyi yakalıyor: "Mert?" tek kelimesindeki sabırsızlık, Zeynep'in hiç soru sormaması ve karşı öneri getirmemesi, "müdürün de hep perşembe akşamları toplantı koyuyor" iğnesi.
- Sonnet'in Türkçesi daha doğal ve eğlenceli: "'Montunu al' = Türkçede 'seni seviyorum'un resmî versiyonu", "Kadro: 1 organizatör, 1 neşe kaynağı, 2 'bakarız'".
- Haiku kararsız kalıyor: "Tamam." için "nazik bir kabul de olabilir" diyor; Sonnet net "konuyu kapatan, mesafeli" diyor.
- Haiku'nun küçük olgu hataları var. En önemlisi paylaşım kartında: "0 kesin 'geliyorum'" ve "Mert'in parayı atmasını hâlâ bekliyoruz" yazmış, oysa maç oynanmış ve Mert parayı atmış. Paylaşılan kartta yanlış bilgi, kullanıcının gözünde en görünür hata türü. Ayrıca bir yerde "Annen her sabah günaydın diyor" (sohbette bir kez geçiyor) gibi abartıyor.
- Haiku'nun bazı cümleleri çeviri kokuyor ("sana iyi ki geldim dedirtecek bir şeyler").

## Sonuç
- Kalite farkı var ama büyük değil; Haiku "iyi", Sonnet "çok iyi".
- 300 analizlik gizli sınır yalnız Haiku ile kârlı. Sonnet ile ayda ~58 analizden sonra zarar başlıyor.
- Gerçekçi kullanım: çoğu kişi ayda birkaç sohbet analiz eder. Ayda 10 Sonnet analizi ~0,41 $ eder, gelirin altında kalır.

## Seçenekler (karar kullanıcıda)
1. **Hep Haiku:** en ucuz, sınır derdi yok; kalite biraz düşük, olgu hatası riski var.
2. **Karma (önerim):** asıl rapor ve paylaşım kartı Sonnet; takip soruları ("ne cevap vereyim", "şu mesaj ne demek") Haiku. Ayda belirli sayıda (ör. 40) Sonnet raporundan sonra raporlar da Haiku ile devam eder; kullanım sınırsız kalır, bu durum kullanım koşullarında "adil kullanım" olarak yazılır.
3. **Hep Sonnet:** en iyi kalite; adil kullanım sınırı 300 değil ~50 rapor/ay olmalı.

## Maliyeti düşürmek için sonraki deneme
- Sonnet'i `effort: low` ile denemek (çıktı tokenı azalır).
- AI'a giden mesaj sayısını ~400'den ~250'ye indirmek (girdi maliyeti Sonnet'te asıl kalem).
- Haiku'yu `effort: high` ile denemek (olgu hataları azalıyor mu).
Bu üç deneme birlikte ~0,5 $ tutar.
