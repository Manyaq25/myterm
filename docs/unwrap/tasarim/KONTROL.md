# Stitch tasarım kontrolü (18 Ekim 2026)

10 / 10 ekran geldi, hepsi Türkçe. Renk ve yazı kuralları: `DESIGN.md` (yazı tipi Plus Jakarta Sans; ana renk #ae2f34 / mercan #ff6b6b, mor #674bb5, yeşil #00b35c, zemin #fff8f8). Aşağıdaki düzeltmeler kodlarken yapılacak; Stitch'te yeniden üretmeye gerek yok.

## Tüm ekranlarda
- Yıl: "2024" / "2025" → 2026 (ya da yılsız).
- "IG / Instagram" geçen yerler → ilk sürümde yok; "WhatsApp & Telegram".
- "unwrap.app" alan adı bizim değil → sitemizin adresi (karar bekliyor).
- Ürün adı tutarsız: ödeme ekranında "Unwrap Pro", ayarlarda "Unwrap Plus" → tek ad (karar bekliyor).

## Ekran ekran
1. **Karşılama:** "T.C. Aşk ve Flört Bakanlığı" devlet adı taklidi (mağaza ve hukuk riski) → "Unwrap Aşk Akademisi". Uydurma sayılar ("%98 Uyum", "Bu hafta 38.410+ sohbet deşifre edildi") → kaldır (yeni uygulamada yanıltıcı; Apple kuralı). Karne fikri ve "Reklam yok. Jeton yok. Tek fiyat." çok iyi.
2. **Ana sayfa:** "En çok ses kaydı atan" kartı → sesli mesaj ilk sürümde yok, kaldır. Sağ üstteki tekrar eden "Ana Sayfa" yazısı → kaldır. "3 Günlük Seri" → ilk sürümde yok. "Kank…" kesilmesi → adlar sığacak şekilde.
3. **Dışa aktarma rehberi:** başlık "Export Rehberi" → "Dışa Aktarma Rehberi". İyi.
4. **İlişki türü:** başlık "Export Rehberi" → "Analiz Ayarları". **"Hiçbir veri buluta aktarılmaz" yanlış** (AI için seçilen mesajlar sunucuya gider) → "İstatistikler telefonunda hesaplanır. AI yorumu için seçilen mesajlar şifreli gönderilir, saklanmaz." "Sen hangisisin?" sorusu (1/2) ayrıca eklenecek.
5. **Ücretsiz kart:** çok iyi. Sadece alan adı.
6. **Sohbet karnesi:** "ÖZET 2024" → yıl düzelt. "Takdir Belgesi" damgası Zeynep'in "Trip" notunu kapatıyor → damga yeri. "Zeynep'e At" düğmesi güzel fikir.
7. **Yalan kartı:** "close" ve "ios_share" yazıları simge yazı tipi yüklenmediği için çıkmış (kodda simge olacak). "Tıbbi olarak kanıtlanmış…" → "Bilimsel olmayan ölçüm: 35 dakika 😄" gibi açık şaka.
8. **Ödeme ekranı:** üstteki çizim bozuk (kesik yazılar, boşta yeşil ok) → sade logo. "%41 Tasarruf" → doğrusu %40. "App Store'dan iptal" → Android'de "Google Play'den". Yıllık önceden seçili, X görünür, yenileme metni düğmenin üstünde: kurala uygun.
9. **AI Koç:** koç adı "Mila" güzel (karar bekliyor). Mikrofon düğmesi → sesli mesaj ilk sürümde yok, kaldır; resim ekleme (ekran görüntüsü) kalabilir. "Hangi sohbetle konuşuluyor" üstte: tam istediğimiz gibi.
10. **Ayarlar:** "Selin & Can · 47 sohbet analizi senkronize" → hesap/senkron yok, kaldır. "5.0 ⭐" puan ve "24s içinde yanıt" sözü → kaldır. "Haftalık ilişki özetleri" bildirimi → ilk sürümde yok. "WhatsApp ve Instagram dökümleri" → "WhatsApp ve Telegram". "v1.4.0 (2025)" → "1.0.0".

## Stitch'te olmayan, kodda tasarımla aynı stilde yapılacak ekranlar
"Sen hangisisin?" sorusu · sohbet okunuyor (yükleniyor) ekranı · tam rapor özet sayfası · ödeme sonrası teşekkür.

## Kullanıcı kararları (18 Ekim)
- Örnek sayılar tasarımda **özelliğin yeri** demek: sayaç ve benzeri alanlar kalır, gösterilen sayı gerçek veriden gelir. Örn. "Bu hafta X sohbet analiz edildi" sayacı sunucudaki gerçek toplamdan (yalnız sayı, içerik yok); "Uyum %", "14.280 mesaj" gibi alanlar kullanıcının kendi analizinden; Ayarlar'daki puan gerçek mağaza puanından ya da puan yokken gizli. Sayı henüz anlamlı değilse (ör. sayaç çok düşükse) alan gizlenir, uydurma sayı asla yazılmaz.
- Ücretli paketin adı: **Unwrap Pro** (Pro ve Plus ikisi de uygun bulundu; ödeme ekranındaki "Pro" seçildi, Ayarlar da "Pro" olacak).
- Koçun adı: **Mila**.
- Kartlarda alan adı yazılmayacak (yalnız "unwrap" logosu).
