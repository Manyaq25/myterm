# Yeni mobil uygulama: hesaplar ve servisler (adım adım kurulum promptu)

Aşağıdaki metni yeni uygulamanın sohbetine ilk mesaj olarak yapıştır.

---

Bir mobil uygulamayı (iPhone + Android) mağazalara çıkaracağız. Uygulama Claude Code ile yazıldı; yapay zekâ bağlı ve çalışıyor, sunucu Expo'da (EAS) çalışıyor; bu kısımlar hazır. Kullanacağımız hesaplar ve servisler aşağıda, öncelik sırasıyla. Bizi bu listeye göre **adım adım** yönlendir:

- Her seferinde **tek bir adım** ver. Ben "tamam" deyince sıradakine geç.
- Her adımda: nereye gireceğimi (tam adres), hangi düğmeye basacağımı ve neyi seçeceğimi yaz. Takılırsam ekran görüntüsü atarım.
- Başlamadan önce hangi hesapların zaten açık olduğunu sor; hazır olan adımları atla.
- **Hangi hesabın kime ait olacağını** sor (benim mi, arkadaşımın mı, şirket mi).
- Ücretli bir adımda önce tutarı söyle, onay iste.
- Şifre, anahtar, token gibi gizli bilgileri **asla sohbete yazdırma**. Nereye kaydedileceğini söyle (ör. GitHub Secrets, Expo ortam değişkenleri).
- Uzun süren onayları (Apple, Google doğrulaması, 14 günlük test) en başta başlat ki beklerken diğer işleri yapalım.
- Her zaman Türkçe, sade ve kısa anlat.

## Faz 0 — Uzun süren hesaplar (ilk gün başlat)
1. **Apple Developer Program**: iPhone uygulaması yayınlamak için zorunlu ücretli üyelik (yıllık ~99 $). Onay birkaç gün sürebilir.
2. **Google Play Console**: Android uygulaması yayınlamak için geliştirici hesabı (tek seferlik ~25 $). Kimlik doğrulaması gerekir. Yeni kişisel hesaplarda üretime çıkmadan önce **en az 12 kişiyle 14 gün kapalı test** şartı var; bu yüzden erken başlanmalı.
3. **Alan adı (domain)**: Uygulamanın sitesi için (ör. Natro). Mağazalar gizlilik politikası ve destek sayfası adresi ister.

## Faz 1 — Geliştirme altyapısı
4. **GitHub**: Kodun saklandığı depo; otomatik işler (GitHub Actions) ve gizli anahtarlar (Secrets) burada.
5. **Expo / EAS**: Uygulamayı derleyen (build), mağazalara gönderen (submit) ve küçük güncellemeleri mağazaya uğramadan yollayan (OTA) servis. Ücretsiz planda aylık derleme kotası var.

## Faz 2 — Site ve ek servisler (sunucu Expo'da hazır)
6. **Site barındırma (ör. Vercel)**: Alan adındaki web sitesi; mağazaların istediği gizlilik/destek/veri silme sayfaları burada yayınlanır, GitHub'dan otomatik güncellenir.
7. **Upstash Redis** (isteğe bağlı): Ücretsiz kullanım haklarını sayar, kötüye kullanımı sınırlar, AI maliyetini ölçer.

## Faz 3 — Para (uygulama ücretliyse)
8. **App Store Connect → Business (Sözleşmeler, banka, vergi)**: Apple'ın para ödeyebilmesi için ücretli uygulama sözleşmesi, banka hesabı ve vergi formları.
9. **Play Console → Ödeme profili**: Google'ın para ödeyebilmesi için satıcı hesabı; ayrıca **%15 komisyon programına** katılım.
10. **RevenueCat**: İki mağazadaki abonelikleri tek yerden yönetir; uygulama "bu kişi Premium mu?" sorusunu buradan sorar.
11. **Google Cloud (hizmet hesabı + Pub/Sub)**: RevenueCat'in ve otomasyonların Google Play verisine erişmesi, aboneliklerin anında bildirilmesi (RTDN) için.

## Faz 4 — Kalite
12. **Sentry**: Uygulama çökünce veya hata verince haber verir (kişisel veri toplamadan).

## Faz 5 — Yayın
13. **Site: gizlilik politikası, destek, veri silme sayfaları**: Mağazaların zorunlu istediği sayfalar (6. adımdaki sitede yayınlanır).
14. **App Store Connect**: iPhone uygulamasının kaydı, mağaza sayfası (açıklama, ekran görüntüleri, yaş derecelendirmesi, gizlilik formu), **TestFlight** ile test ve incelemeye gönderme.
15. **Play Console (mağaza sayfası ve sürümler)**: Android mağaza sayfası, veri güvenliği formu, dahili/kapalı test ve üretime gönderme.
16. **App Store Connect API anahtarı + Play hizmet hesabı (GitHub Secrets)**: Ekran görüntüsü, açıklama ve sürüm notlarını Claude'un otomatik yükleyebilmesi için (isteğe bağlı ama çok zaman kazandırır).

## Faz 6 — Büyüme ve ölçüm
17. **Google Search Console**: Sitenin Google'da çıkması için siteyi Google'a tanıtır.
18. **Vercel Analytics**: Sitede çerezsiz, basit ziyaretçi sayacı.
19. **Sonar**: Mağaza anahtar kelimeleri, rakip analizi ve rakip yorumları (ASO). İsteğe bağlı, kredi ile çalışır.

İlk adımdan başla: önce hesapların kime ait olacağını sor, sonra Faz 0'daki ilk eksik adımı anlat.
