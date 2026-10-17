# Sohbet analizi model karşılaştırması

Tarih: 2026-10-17 · ayarlar: claude-haiku-5-5:high,claude-sonnet-5-5:low

## Ölçümler

| Sohbet | Model | Girdi | Çıktı | Süre | Maliyet |
|---|---|---|---|---|---|
| 1-soguyan-flort.txt | Haiku 5.5 (high) | 2552 | 4180 | 22.5 sn | $0.0023 |
| 1-soguyan-flort.txt | Sonnet 5.5 (low) | 2552 | 1620 | 14.5 sn | $0.0213 |
| 2-kankalar-grubu.txt | Haiku 5.5 (high) | 2651 | 3953 | 20.7 sn | $0.0022 |
| 2-kankalar-grubu.txt | Sonnet 5.5 (low) | 2651 | 1762 | 16.2 sn | $0.0229 |
| 3-anne-ogul.txt | Haiku 5.5 (high) | 2084 | 3331 | 17.6 sn | $0.0019 |
| 3-anne-ogul.txt | Sonnet 5.5 (low) | 2084 | 1504 | 14.7 sn | $0.0192 |
| 4-ironik-kavga.txt | Haiku 5.5 (high) | 2023 | 5971 | 27.7 sn | $0.0032 |
| 4-ironik-kavga.txt | Sonnet 5.5 (low) | 2023 | 1597 | 13.7 sn | $0.0200 |
| 5-kanka-sevgisi.txt | Haiku 5.5 (high) | 1931 | 2684 | 15.1 sn | $0.0015 |
| 5-kanka-sevgisi.txt | Sonnet 5.5 (low) | 1931 | 1402 | 12.4 sn | $0.0179 |

## Analiz başına ortalama

| Model | Ort. çıktı token | Ort. süre | Bu testte $/analiz | Gerçek boyutta tahmini $/analiz (12000 girdi) | 300 analiz/ay |
|---|---|---|---|---|---|
| Haiku 5.5 (high) | 4024 | 20.7 sn | $0.0022 | $0.0032 | $0.96 |
| Sonnet 5.5 (low) | 1577 | 14.3 sn | $0.0203 | $0.0398 | $11.93 |

---

## 1-soguyan-flort.txt (41 mesaj)

### Haiku 5.5 (high)

_girdi 2552 · çıktı 4180 token · 22.5 sn · $0.0023 · end_turn_

## Kısa özet
Sohbetin başı sıcaktı: kafe buluşması, plan ve ortak bir film önerisi vardı. Son bir haftada Zeynep'in yanıtları kısaldı, plan tekrar ertelendi ve konuşma "Tamam." ile bitti. Bu tablo, Zeynep'in şu an mesafe koymak ya da yoğun bir dönemden geçmek istediğine işaret ediyor olabilir. Yine de kesin bir sonuç çıkarmak için erken.

## Kim nasıl yazıyor
- **Emre:** 25 mesaj, 8 kez sohbeti başlatmış. Ortanca yanıt süresi 1 dakika, ortalama 5,6 kelime. Sohbetin ilk yarısında da sonunda da daha çok çaba gösteren taraf.
- **Zeynep:** 16 mesaj, hiç sohbet başlatmamış. Ortanca yanıt süresi 166 dakika (yaklaşık 2,8 saat). Ortalama 4,6 kelime. İlk gün coşkulu ("bayıldım", "😍"), sonra kısa ve düz yanıtlar ("Olur", "Evet güzeldi", "Tamam.").

## İlişki dinamiği
- **Çaba dengesizliği:** Sohbeti Emre başlatıyor (8'e 0). 15 Ekim'deki "Selam, iyi misin?" mesajı da bu dengeyi gösteriyor.
- **Planlar ertelenmiş:** Cumartesi buluşması gerçekleşmiş ("Cumartesi çok güzeldi bence" / "Evet güzeldi"). Sergi davetine ise "Bakarım, bu hafta biraz yoğunum" ve sonrasında "Bu hafta sonu olmayacak galiba" yanıtı geldi.
- **Ton değişimi:** 2 Ekim'de "Bu arada geçen anlattığın film neydi? Listeme ekleyeceğim" diye soran Zeynep, 5 Ekim'den sonra daha çok kapanış cümleleri kurmaya başlamış ("Yok daha fırsat olmadı").
- **Emre'nin nazik kalması:** "Olsun acele yok", "Yok ne kusuru, başka zaman 😊", "Sen ne zaman müsait olursan" gibi cevaplar açık kapı bırakıyor ve baskı kurmuyor. Bu, sohbetin sağlıklı kalmasına yardımcı oluyor.
- **Ortak zemin hâlâ var:** Kahve, film ve "Çok komiksin ya :)" gibi küçük anlar, bağın tamamen kopmadığını ama sıcaklığın azaldığını gösteriyor.

## Ton ve satır araları
- **"Tamam." (16 Ekim 10:05):** Noktalı tek kelime, "istersen konuşabiliriz" teklifine açık bir yanıt gelmemesi. Kapanış, sadece kabul ya da kısa bir "anladım" da olabilir. Ama kendiliğinden bir açılma sinyali değil.
- **"Evet güzeldi" (7 Ekim 23:47):** Emre'nin "teşekkürler 🙏" mesajından yaklaşık 2,5 saat sonra, emojisiz ve tek satır bir yanıt. Samimi ama mesafeli bir cevap.
- **"Çok komiksin ya :)" (14 Ekim 01:12):** İltifat gibi görünse de gülen yüz ve "ya" ile yumuşatılmış. Hoşlanma da olabilir, nazik bir geçiştirme de.
- **"kusura bakma" (12 Ekim):** Zeynep'in özür dilemesi, reddi kibar yapmak istediğini gösteriyor. Bu da ilgisiz olduğu anlamına gelmeyebilir; sadece bu hafta uygun olmadığı anlamına gelebilir.

## İlgi göstergesi
- **Emre: 7/10.** Düzenli, sıcak ve sabırlı yazıyor. Yanıt süreleri çok kısa, bu da ilgisini net gösteriyor.
- **Zeynep: 3/10.** Başlangıçtaki coşkusu ve son dönemdeki kısa, ertelemeli yanıtları, ilginin azaldığını ya da şu an başka şeylere odaklandığını düşündürüyor. "Kafam dolu" dediği için kişisel bir yoğunluk da olabilir.

## Ne yazabilirsin
1. **Alan bırakan, kapatan nazik mesaj:**
   > "Tamam, anlaşıldı Zeynep. Yoğun dönemin geçsin, sorun yok. Bir ihtiyacın olursa ya da sadece konuşmak istersen buradayım 🙂"

2. **Açık ve net olmayı tercih edersen (isteğe bağlı):**
   > "Son zamanlarda biraz fazla mı yazdım? Açıkça söyleyebilirsin, bir sorun olmaz. Ne hissettiğini bilmek isterim."

İkinci seçenek netlik sağlar, ama cevap olumsuz gelirse bu konuşmayı kapatmaya hazır olmak gerekir. Birinci seçenek ise daha az baskı yaratır.

## Paylaşılabilir kart
- ☕ Kahve kazandı, sohbet biraz soğudu.
- 😅 Bazen en iyi cevap "Tamam." olur.
- 🎬 Perfect Days listede, izleme durumu şimdilik muallakta.

### Sonnet 5.5 (low)

_girdi 2552 · çıktı 1620 token · 14.5 sn · $0.0213 · end_turn_

## Kısa özet
İlk gün karşılıklı, sıcak ve emojili bir başlangıç var; sonrasında tablo değişiyor. Emre sohbeti canlı tutmaya çalışırken Zeynep'in cevapları kısalıyor ve gecikiyor. Büyük ihtimalle ilgi soğuyor ya da Zeynep'in kafası başka yerde, ama tek bir sohbetten kesin sonuç çıkmaz.

## Kim nasıl yazıyor
- **Emre:** 25 mesaj, ortalama 5,6 kelime, 8 kez sohbeti başlatmış, ortanca cevap süresi 1 dk. Hızlı, istekli ve 7 kez cevapsız art arda mesaj atmış.
- **Zeynep:** 16 mesaj, ortalama 4,6 kelime, sohbeti hiç başlatmamış, ortanca cevap süresi 166 dk. Cevap veriyor ama inisiyatif almıyor.

## İlişki dinamiği
- **İlk gün dengeliydi:** "Selaaam 😄 ben de çok sevindimm" ve "bir dahakine tatlısını da deneyelim" Zeynep'in de o gün hevesli olduğunu gösteriyor.
- **Plan yapan hep Emre:** Cumartesi buluşması dışında önerilerin (sergi, tekrar görüşme) hepsi Emre'den geliyor, Zeynep'ten karşı öneri yok.
- **Buluşma sonrası ivme düşüyor:** Emre "Cumartesi çok güzeldi bence, teşekkürler 🙏" yazdı, Zeynep 3 saat sonra sadece "Evet güzeldi" dedi. Aynı coşkuyu paylaşmamış görünüyor.
- **Nazik geri çekilme:** "Bakarım, bu hafta biraz yoğunum" ve "Bu hafta sonu olmayacak galiba, kusura bakma" yumuşak ret gibi okunabilir. Gerçekten yoğun olma ihtimali de var.
- **Film detayı:** "Eklendi ✅ izleyince sana yazarım" demişti, sonra "Yok daha fırsat olmadı" dedi ve konu kapandı. Başta ilgisi vardı, sonra bağ zayıfladı.

## Ton ve satır araları
- **"Evet güzeldi":** Kısa ve emojisiz. Nazik bir onay olabilir ama karşılık vermeyen bir tonu var.
- **"İdare eder":** Sohbeti uzatmayan bir cevap. Yorgunluk ya da isteksizlik olabilir.
- **"Çok komiksin ya :)" (01:12):** Gece yazılmış, tek bir gülümseme var. Hem sıcak hem mesafeli okunabilir, belirsiz bir mesaj. Emre'nin "aklıma geldin" mesajına karşılık flört ya da kibar geçiştirme olabilir.
- **"Tamam.":** Noktalı, tek kelimelik. Emre'nin "istersen konuşabiliriz" teklifine verilen bu cevap büyük ihtimalle konuyu kapatıyor ve bir süre alan istiyor.

## İlgi göstergesi
- **Emre: 9/10.** Hızlı cevap, sürekli girişim ve plan önerileriyle ilgisi çok net.
- **Zeynep: 3/10.** İlk gün sıcaktı, sonrasında inisiyatif yok ve cevaplar kısa. Yine de cevap vermeyi sürdürüyor, kapıyı tamamen kapatmış değil.

## Ne yazabilirsin
- "Tamam, sana alan bırakıyorum. Canın isteyince yazarsın, kahve de sergi de bekler 😊"
- Zeynep yazarsa: "Perfect Days'i izlersen nasıl buldun, merak ediyorum" gibi baskısız bir mesaj uygun olur.

Birkaç gün hiç mesaj atmamak da iyi bir hamle olabilir. Son 7 art arda mesaj biraz yoğun duruyor, Zeynep'in yazması için boşluk bırakmak işe yarayabilir.

## Paylaşılabilir kart
- ☕ Kahve efsaneydi, tempo biraz uyudu.
- 📈 Emre: 1 dk cevap. Zeynep: 166 dk. Hız farkı büyük.
- 🎬 Perfect Days listede, sakin bir bekleyiş sürüyor.

---

## 2-kankalar-grubu.txt (41 mesaj)

### Haiku 5.5 (high)

_girdi 2651 · çıktı 3953 token · 20.7 sn · $0.0022 · end_turn_

## Kısa özet
Bu grup, halı saha maçı etrafında dönen, şakalaşmaya açık ve genel olarak samimi bir sohbet. Burak organizasyonu üstleniyor, Can enerjisini yüksek tutuyor, Deniz ve Mert ise katılım ve ödeme konusunda geride kalıyor. Sohbet bir sitemle başlayıp kahkahayla kapanıyor.

## Kim nasıl yazıyor
- **Burak:** 15 mesajla en çok yazan kişi. Sohbeti o başlattı, ortanca cevap süresi 1 dakika. Kısa ve net cümleler kuruyor: *"Sahayı ayırttım, kapora da verdim, kişi başı 250."*
- **Can:** 10 mesaj, ama 12 emojiyle grubun en renkli sesi. Hızlı cevap veriyor ve şakayı canlı tutuyor: *"Büyük ihtimal = gelmiycem 😂"*
- **Deniz:** 7 mesaj, hiç emoji yok, ortanca cevap süresi yaklaşık 162 dakika. Sabah saatlerinde yazıyor. Kısa ve sade cevaplar veriyor: *"Akşam atarım."*
- **Mert:** 9 mesaj, ortanca cevap süresi yaklaşık 145 dakika. Çoğunlukla akşam ve gece yazıyor. Belirsiz ifadeler kullanıyor: *"Büyük ihtimal gelirim."*

## İlişki dinamiği
1. **Burak fiilen organizatör.** Maçı ilk o açtı, ödeme ve yer bilgisini o paylaştı, hatırlatmaları da o yapıyor: *"Deniz Mert hatırlatma 🙃"*
2. **Ödeme ve katılım konusunda tekrar eden bir kalıp var.** Deniz ve Mert'in cevapları gecikince Burak'ın takibi artıyor: *"Mert?"* Bu, grupta ortak bir sürtüşme noktası gibi duruyor.
3. **Mert, şakaların merkezinde ama bu rahat bir şaka.** Can'ın *"Mert yine yaptı yapacağını"* ifadesi ve Mert'in *"Sus lan 😂"* cevabı, karşılıklı takılmanın normal kabul edildiğini gösteriyor.
4. **Grubun bağı güçlü.** Maç sonrası mesajlarda *"Maç efsaneydi ⚽️"*, *"Haftaya kesin 😂😂😂"* gibi ifadeler var. Sitemler sonrasında bile sohbet neşeli bir yerde kapanıyor.

## Ton ve satır araları
- **"Mert kardeşim 4 kişiyiz sen gelmezsen maç olmuyor"**: Samimi bir baskı. "Kardeşim" hitabı kırgınlıktan çok takım ruhunu gösteriyor.
- **"Ciddi misin ya 😐"**: Burak'ın hayal kırıklığı. Emoji (😐) öfkeden çok "yine mi" hissi veriyor.
- **"Parayı da kuzenim verir bari"**: Yarı şaka, yarı sitem. "Bari" kelimesi burada Mert'e küçük bir takılma. Mesajın sonunda Burak'ın "sen önce parayı at da 😂" demesi, bunun ciddi bir kavga olmadığını gösteriyor.
- **"Eyvallah 🙏"**: Kapanış mesajı. Burak'ın Mert'in ödemesine verdiği kısa ve sıcak cevap, meseleyi tatlıya bağlıyor.

## İlgi göstergesi
- **Burak: 9/10.** Organizasyonu üstleniyor ve hem yer hem ödeme konusunda en çok emeği olan kişi.
- **Can: 8/10.** Her planda hızlı cevap veriyor ve grubu canlı tutuyor.
- **Deniz: 6/10.** Katılmak istediği belli (*"Kesin geliyorum bu sefer"*), ama zamanlama ve ödeme konusunda geride kalıyor.
- **Mert: 5/10.** İlgisiz görünmüyor (*"Kaçırmışım ya 😔 haftaya kesin"*), ancak belirsiz cevapları ve geç dönüşleri nedeniyle katılımı tahmin etmek zor.

*Bu puanlar yalnızca bu sohbetteki mesaj örüntülerine dayanıyor. Kişilerin genel ilgisini ya da karakterini yansıtmayabilir.*

## Ne yazabilirsin
1. *"Haftaya cuma saat 9, kapora bende. Kişi başı 250'yi çarşamba akşamına kadar atarsanız rezervasyonu kesinleştiririm 👍"*
2. *"Mert, Deniz, bu sefer kim kesin? Sayıyı netleştirelim de sahayı buna göre ayırtayım 😅"*

## Paylaşılabilir kart
- ⚽ Halı saha: 4 kişi, 1 kuzen, 3 gol. Efsane gece! 😎
- 😂 "Büyük ihtimal" da, "haftaya kesin" de bu grubun resmi sloganı.
- 🙏 Kapora ödendi, moral yüksek. Sıradaki maça kadar herkes hazır olsun!

### Sonnet 5.5 (low)

_girdi 2651 · çıktı 1762 token · 16.2 sn · $0.0229 · end_turn_

## Kısa özet
Bu, halı saha etrafında dönen, şakayla karışık ama sıcak bir arkadaş grubu. Burak organizatör, Can neşe ve destek tarafı, Deniz ile Mert ise "büyük ihtimal" modunda ama sonunda yine de dönüş yapıyorlar. Sert görünen laflar ("Sus lan", "Klasik 😂") büyük ihtimalle samimi takılma.

## Kim nasıl yazıyor
- **Burak (15 mesaj):** Sohbeti tek başına başlatan kişi (1/1), ayarlayan ve takip eden taraf. Kısa, net mesajlar (ort. 5,3 kelime) ve 1 dk ortanca cevap süresi var.
- **Can (10 mesaj):** En çok emojili kişi (12). 1 dk'da cevap veriyor, hızlı ve enerjik. "Ben varım kanka 🔥", "Attım kanka ✅" ile hep ilk atlayan.
- **Deniz (7 mesaj):** Hiç emoji yok, ortanca cevap süresi 162 dk. Sabah aktif (09:00), işle iç içe bir ritmi var gibi.
- **Mert (9 mesaj):** Ortanca cevap süresi 145 dk, akşam geç saatlerde beliriyor (21:00). Mesajları genelde "bakarız", "büyük ihtimal" gibi kesin olmayan ifadelerle dolu.

## İlişki dinamiği
- **Burak = grubun motoru:** Yer, saat, kapora, IBAN, hatırlatma hep ondan. "Deniz Mert hatırlatma 🙃" ve "Mert?" mesajları takibi onun üstlendiğini gösteriyor.
- **Can = Burak'ın yan kuvveti:** Burak'ın dediklerine şakayla destek veriyor: "Büyük ihtimal = gelmiycem 😂". Dalga geçiyor ama kimseyi gerçekten kırmıyor gibi.
- **Mert = grubun "belki" adamı:** Hem Can hem Burak ona takılıyor. "Sus lan 😂" cevabı ve sonrasında "Kaçırmışım ya 😔 haftaya kesin" ona kızılmadığını, kendisinin de oyunu oynadığını düşündürüyor.
- **Deniz = gecikmeli ama sorumlu:** "Her hafta bakıcam diyon gelmiyon" iğnesine "Yaa bu sefer ciddi bakıcam" diyor, ve ödemeyi ertesi sabah yapıyor.
- **Burak'ın sabrı var ama sınırlı:** "Ciddi misin ya 😐" biraz hayal kırıklığını gösteriyor. Hemen çözüm üretip kuzenini çağırması pratik zekâ. Maç sonrası "Söylemiştim 😎" ile de keyfi yerinde.

## Ton ve satır araları
- **"Ciddi misin ya 😐"** (Burak): Gece yarısı gelen son dakika iptalinden sonra şakanın altında hafif bir sinir olabilir.
- **"Parayı da kuzenim verir bari"**: Espri gibi ama biraz da "bu sefer ödeme işini bana bırakma" mesajı taşıyor olabilir.
- **"Mert sen önce parayı at da 😂"**: Gülen yüzle gelen yumuşak bir iğneleme. Ödeme konusu hâlâ aklında.
- **"Eyvallah 🙏"**: Final mesajı sıcak. Konu kapanmış, ortam yumuşamış görünüyor.

## İlgi göstergesi
- **Burak: 9/10**, organizasyonu üstlenip takip eden kişi, ilgisi çok yüksek.
- **Can: 9/10**, hızlı cevap, bol emoji ve her mesajda grupla etkileşimde.
- **Deniz: 6/10**, katılıyor ve ödemeyi yapıyor, ama geç cevaplıyor ve emoji kullanmıyor; bu daha çok iş temposu ve yazım tarzı olabilir.
- **Mert: 5/10**, grupta olmak istiyor gibi (özür, "haftaya kesin"), ama bağlılığı belirsiz kalıyor.

## Ne yazabilirsin
- "Mert, haftaya için şimdiden yer ayırıyorum, 'büyük ihtimal' yok, ya var ya yok 😄 Ne dersin?"
- "Kuzen kadroya kalıcı girdi bence, Deniz sen de bu hafta saat 9'a hazır ol 😎"

## Paylaşılabilir kart
- ⚽ Organizatör: Burak, kuzen: transfer yıldızı
- 😂 "Büyük ihtimal" = Mert dilinde "bakarız"
- 🔥 Can: grubun en hızlı emoji makinesi

---

## 3-anne-ogul.txt (27 mesaj)

### Haiku 5.5 (high)

_girdi 2084 · çıktı 3331 token · 17.6 sn · $0.0019 · end_turn_

## Kısa özet
Sohbet, bir annenin sevgisiyle oğlunun mesafeli ama sıcak kalma çabası arasında geçiyor. Annen sohbetlerin çoğunu başlatıyor ve her mesajda bağ kurmaya çalışıyor. Sen ise geç cevap veriyorsun, ama babanın sağlığı gibi önemli konularda hızla ve ilgiyle dönüyorsun. Son gün "geliyorum" demen, aranızdaki sıcaklığın hâlâ güçlü olduğunu gösteriyor.

## Kim nasıl yazıyor
- **Annem:** 16 mesaj, ortalama 5,8 kelime. Sohbetleri 2 kez başlatmış ve 3 emoji kullanmış ("😊", "😍", "❤️"). Cevapları genelde 1 dakika içinde geliyor.
- **Kerem:** 11 mesaj, ortalama 4,5 kelime. Hiç sohbet başlatmamışsın. Ortanca cevap süren 9 dakika, yani hızlısın ama her mesajına anında dönmüyorsun.

## İlişki dinamiği
- **Sohbeti annen yürütüyor:** Konuşmaların çoğu onun mesajıyla açılıyor ("Günaydın oğlum, kahvaltı yaptın mı"). Bu, ona kendini duyulmuş hissettirmek için bir yol olabilir.
- **Suçluluk ve sevgi iç içe:** "Biz alıştık" ve "Uzun zamandır aramıyorsun zaten" gibi cümleler, hafif bir sitem taşıyor olabilir. Yine de "Seni üzmek istemedim" ve "Montunu da al" gibi ifadeler sevgiden geliyor.
- **Önemli konularda hızlı dönüş:** Babanın tansiyonu haberinde 21:40'ta, yani haberden yaklaşık 2,5 saat sonra cevap verdin ve hemen "Yarın arıyorum babamı" dedin. Ertesi gün de sözünü tutup babanla konuştun. Bu, ailene olan ilginin somut bir örneği.
- **Davet ve kararsızlık döngüsü:** Pazar yemeği konusunda "gelecek hafta gelirim", sonra "Pazar geliyorum" dedin. Annen önce "işin varsa gelme" dedi, sen de "Anne 😂 geliyorum dedim" diye cevapladın. Burada bir gerilim var, ama ikiniz de bunu şakayla hafifletiyor.
- **Açık iletişim talebi:** "Anne böyle şeyleri hemen söyle lütfen" cümlen, sağlıkla ilgili haberlerin nasıl iletilmesini istediğini açıkça ifade ediyor. Annen de bu isteği anlamış görünüyor.

## Ton ve satır araları
- **"Sen bilirsin"** (14:21): Noktalı ve kısa. Burada kırgınlık veya kabullenme olabilir. Bağlamda, gelmediğin için hafif bir sitem gibi okunuyor.
- **"Ne?? Neden şimdi söylüyorsun"** (21:40): Sert değil, şaşkınlık ve endişe ifadesi. Sen de sağlık haberlerinde bunu hızlıca hissettiğini gösteriyorsun.
- **"Ama zahmet olmasın sana, işin varsa gelme"** (20:17): Bu, Türk annelerinde sık görülen bir ifade. Gerçek bir "gelme" olmayabilir. Büyük ihtimalle "gelmek istediğini biliyorum ama yükün olmasını istemiyorum" anlamına geliyor.
- **"Anne 😂 geliyorum dedim"** (20:18): Gülen yüzle biten bu cevap, sevgi dolu ve oyuncu bir karşılık. Sert olmadan sınır koymak için iyi bir örnek.

## İlgi göstergesi
- **Annem: 8/10.** Sohbetleri başlatıyor, bağ kuran ve duygusal mesajlar yazıyor. Sarma gibi küçük detaylarla sevgisini gösteriyor.
- **Kerem: 6/10.** Önemli haberlere hızlı ve samimi tepki veriyorsun, sözünü tutuyorsun. Rutin mesajlarda ise daha geç dönüyorsun.

## Ne yazabilirsin
1. "Anne, babamın durumunu anlattığın için sağ ol. Bundan sonra böyle şeyleri bana hemen yaz, merak ediyorum. Pazar için saat kaçta gelmemi istersin?"
2. "Sarmaya bayılırım, Pazar geliyorum! Montumu unutmam 😄 Proje de bir gün beklesin."

## Paylaşılabilir kart
- "Anne 😂 geliyorum dedim" → Pazar planı kesinleşti, sarma hazırlansın.
- Proje beklesin, sarma beklemesin. 🫔
- Telefon açıldı, sevgi açıldı, montun da unutulmasın. ❤️

### Sonnet 5.5 (low)

_girdi 2084 · çıktı 1504 token · 14.7 sn · $0.0192 · end_turn_

## Kısa özet
Anne-oğul arasında sıcak ama biraz "ince sızılı" bir sohbet var. Annen üstü kapalı özlemini ve kırgınlığını dolaylı cümlelerle anlatıyor, sen de babanın tansiyonu haberinden sonra harekete geçip hem babanı aramışsın hem de pazara gelmeye karar vermişsin. Sohbet sonunda hava epey yumuşuyor.

## Kim nasıl yazıyor
- **Annem:** 16 mesajla sohbeti o taşıyor, ortalama 5,8 kelime ve çoğu kısa, art arda gelen mesajlar. Sohbeti 2 kez o başlatmış, cevapları ortanca 1 dakika. Duygularını emoji ve ufak iğnelerle veriyor.
- **Kerem:** 11 mesaj, ortalama 4,5 kelime, sohbeti hiç başlatmamış. Ortanca cevap süresi 9 dk; ilk cevap (09:30 → 12:47) uzun sürmüş, ama babanın haberinden sonra hızlanıp canlanmışsın.

## İlişki dinamiği
- **Özlem dolaylı söyleniyor:** "Teyzen de seni sordu zaten, ben de bilmiyorum dedim" ve "Biz alıştık" büyük ihtimalle "seni özledik" demenin kırgın bir yolu.
- **Koruma refleksi:** "Seni üzmek istemedim" cümlesi, annenin kötü haberi seni yormamak için sakladığına işaret ediyor. Sen de "böyle şeyleri hemen söyle" diyerek net bir sınır koymuşsun, bu sağlıklı bir konuşma.
- **Dönüm noktası:** 08.10 akşamı. Babanın haberinden sonra ton değişiyor, "Yarın arıyorum babamı" ile ilgi hemen eyleme dönüyor.
- **Sıcak final:** "Pazar geliyorum anne, proje beklesin" sonrası annenin "Gerçekten mi? 😍" cevabı ve emoji sayısındaki artış sevincini açıkça gösteriyor.
- **Ufak bir ayrıntı:** "Uzun zamandır aramıyorsun zaten" cümlesi hafif bir sitem, ama babanın seni yarım saat anlatmasıyla birlikte düşününce arka planda sevgi ağır basıyor.

## Ton ve satır araları
- **"Sen bilirsin"** (05.10): Annelerin klasiği; büyük ihtimalle "gelmeni isterim ama baskı yapmayayım" demek.
- **"Saat 12 olmuş ama neyse"**: Hafif takılma. Muhtemelen şikâyetten çok şefkatli bir dürtme.
- **"Ama zahmet olmasın sana, işin varsa gelme"**: Sevinç içinde bile kendini geri çekme refleksi. Senin "geliyorum dedim" cevabın tam da duyması gereken şeydi.
- **"Montunu da al hava soğuyacak"**: Türk annesinden "seni seviyorum" demenin bir başka hali. 😄

## İlgi göstergesi
- **Annem: 9/10**, çünkü sohbeti başlatan, hızlı cevaplayan ve duygusunu en açık gösteren taraf o.
- **Kerem: 8/10**, ilk günlerde mesafeli görünsen de sonradan hızlı ve içten karşılık vermişsin, 9 dk cevap süresi de bunu destekliyor.

## Ne yazabilirsin
- "Anne, pazar sarmayı iple çekiyorum. Bir şey lazımsa yolda alırım, söyle 😊"
- "Sana da babama da daha sık yazacağım, söz. Sen de bir şey olursa hemen haber ver olur mu?"

## Paylaşılabilir kart
- 🧣 "Montunu al" = "Seni seviyorum" (anne dili sözlüğü)
- 🥬 Proje beklesin, sarma beklemez.
- 📞 Sohbeti başlatma skoru: Anne 2, Kerem 0. Bu hafta sıra sende!

---

## 4-ironik-kavga.txt (23 mesaj)

### Haiku 5.5 (high)

_girdi 2023 · çıktı 5971 token · 27.7 sn · $0.0032 · end_turn_

## Kısa özet
Geç kalma yüzünden başlayan gerginlik, ironik cevaplarla bir süre büyüdü. Ozan'ın söz verip zamanında gelmesi ve akşamın sıcak bitmesi onarım yönünde işaret veriyor. Ama toplantı konusu hâlâ açık, hafta sonuna ertelendi. Bu yorum yalnızca tek bir akşamlık 23 mesaja dayanıyor.

## Kim nasıl yazıyor
- **Selin:** Kısa ve keskin cümleler kuruyor (ortalama 5,3 kelime). "Peki", "Tamam" gibi kapanışlar ve ironi kullanıyor. Yumuşadığı anlarda 🙂, 😄 ve ❤️ ekliyor.
- **Ozan:** Daha uzun ve açıklayıcı yazıyor (ortalama 6,2 kelime). Savunmadan özre, sonra telafiye geçiyor. Sohbeti o başlatmadı, ama 11 mesajla tartışmaya aktif katıldı.

## İlişki dinamiği
- **Geç kalma, sitem ve açıklama:** Sohbet "Neredesin? 7'de buluşacaktık" ile başlıyor. Ozan'ın "müdür son dakika toplantı koydu" açıklamasına Selin "müdürün de hep perşembe akşamları toplantı koyuyor zaten" diye karşılık veriyor.
- **Tekrar eden örüntü hissi:** "Bilmiyorum Ozan, her seferinde söz" ve "geçen ay da aynısını yaşadık" ifadeleri, kırgınlığın yalnızca bu akşamla sınırlı olmayabileceğini düşündürüyor.
- **Telafi ve şartlı kabul:** Ozan "8:15'te oradayım söz" diyor. Selin "Peki" yanıtını veriyor ama sınırını da koyuyor: "Bir dakika geç kalırsan gidiyorum 🙂".
- **Sıcaklığın geri dönüşü:** "Vay, bir dakika erkencisin. Mucize 😄" ve "Bu akşam güzeldi" mesajları, akşamın havasının yumuşadığını gösteriyor.
- **Açık kalan konu:** Konuşmayı Ozan iki kez önerdi. Selin ilk seferinde "Konuşacak bir şey yok" dedi, akşam sonunda ise "gerçekten konuşmamız lazım" diye geri döndü.

## Ton ve satır araları
- **"Harika" / "Gerçekten çok harikasın" (18:41):** Büyük ihtimalle ironik. Hayal kırıklığını dolaylı biçimde dile getiriyor.
- **"Aynen öyle canım" (18:44):** Hitap tatlı ama cümle iğneleyici. Tartışmayı kapatmak ister gibi bir tonu var.
- **"Peki" + "Bir dakika geç kalırsan gidiyorum 🙂" (19:15):** Kırgınlığı kabul ediyor ama sınır çiziyor. Gülen yüz burada yumuşatmadan çok "yarı şaka, yarı uyarı" anlamı taşıyor.
- **"Ama gerçekten bu toplantı meselesini konuşmamız lazım" (23:20):** Akşam iyi geçmiş olsa da mesele hâlâ önemli. "Gerçekten" kelimesi bunu vurguluyor.

## İlgi göstergesi
- **Selin: 7/10.** Buluşmaya gelip akşamı sıcak bir mesajla kapatması ilgisini gösteriyor. Ama ironik üslup ve konuşma talebi kırgınlığın sürdüğünü düşündürüyor.
- **Ozan: 8/10.** Kırgınlığa rağmen rezervasyonu korumaya çalışması, özür dilemesi ve "güzelim ❤️" demesi yakınlık çabasını gösteriyor.

## Ne yazabilirsin
1. "Bu akşam için gerçekten özür dilerim, seni beklerken yaşattığım hayal kırıklığını anlıyorum. Hafta sonu sakince konuşalım mı? Cumartesi öğlen müsait misin?"
2. "Bu akşam güzeldi, teşekkür ederim. Toplantı meselesini de konuşmak istiyorum. Bundan sonra bir değişiklik olursa sana önceden haber vereceğim."

## Paylaşılabilir kart
- "8:15'te kapıdaydı, mucize resmen gerçekleşti 🎉"
- "Kırmızı şarap sözü verildi 🍷 Kadehler hazır!"
- "Toplantı konusu hafta sonuna ertelendi 📅"

### Sonnet 5.5 (low)

_girdi 2023 · çıktı 1597 token · 13.7 sn · $0.0200 · end_turn_

## Kısa özet
Sohbet kızgın ve iğneleyici başlıyor, ama Ozan'ın özür dileyip somut bir plan sunmasıyla yumuşuyor. Akşam büyük ihtimalle güzel geçmiş ve ikili sonunda "❤️" ile barışmış görünüyor. Geriye tek açık konu kalıyor: tekrar eden geç kalma ve toplantı meselesi.

## Kim nasıl yazıyor
- **Selin:** 12 mesaj, ortalama 5,3 kelime. Kısa ve keskin yazıyor ("Harika", "Peki"). Konuşmayı o başlatmış, medyan cevap süresi 1 dk. Hem kırgınlığı hem ilgiyi hızlı tepkisinden okuyabiliyoruz.
- **Ozan:** 11 mesaj, ortalama 6,2 kelime. Biraz daha uzun ve açıklayıcı yazıyor ("müdür son dakika toplantı koydu"). Savunmayla başlıyor, sonra "Haklısın" diyerek sorumluluk alıyor.

## İlişki dinamiği
- **Hızlı tırmanma, hızlı yatışma:** 18:41'deki iğnelemeden 19:16'daki "Anlaştık 😅" mesajına kadar yaklaşık 35 dakika geçmiş. Bu, ilişkinin kavgayı uzatmadan toparlayabildiğine işaret ediyor.
- **Tekrar eden bir kalıp var:** Ozan "geçen ay da aynısını yaşadık" diyor, Selin de "her seferinde söz" diyor. İkisi de bunun ilk olmadığını kabul ediyor.
- **Ozan dönüm noktası yaratıyor:** "Haklısın. Bu sefer telefonu kapatıp çıkıyorum" mesajı Selin'in sertliğini düşürüyor. Karşılığında "Peki" ve ardından şartlı ama yumuşak bir mesaj geliyor.
- **Söz tutulmuş:** Ozan 20:14'te "Kapıdayım" yazıyor, yani 8:15'ten bir dakika erken. Selin de bunu "Mucize 😄" diyerek takdir ediyor.
- **Konu kapanmamış:** Selin gece 23:20'de "gerçekten konuşmamız lazım" diyor. Güzel akşam sorunu silmemiş. Ozan'ın "ben de rahatsızım" demesi ise ikisinin aynı tarafta olduğunu gösteriyor.

## Ton ve satır araları
- **"Harika" / "Gerçekten çok harikasın":** Açıkça ironi. Hayal kırıklığı ve kırgınlık işareti.
- **"Aynen öyle canım":** "Canım" burada sevgi değil, iğneleme gibi duruyor. Sohbetin en soğuk anlarından biri.
- **"Konuşacak bir şey yok. Ben eve dönüyorum":** Noktalı ve kesin. Muhtemelen "konuşmak istiyorum ama dinlenmediğimi hissediyorum" anlamına geliyor.
- **"Bir dakika geç kalırsan gidiyorum 🙂":** Gülen yüz burada hem şaka hem de gerçek bir sınır gibi okunuyor.

## İlgi göstergesi
- **Selin: 8/10.** Kızgın olsa da hızlı cevap veriyor, buluşmaya geliyor ve sonunda "❤️" yazıyor.
- **Ozan: 8/10.** Savunmadan özre geçiyor, restoranı iptal etmiyor, zamanında geliyor ve konuşmaya kendisi de açık.

## Ne yazabilirsin
- "Dün akşam için teşekkür ederim, geldiğin için çok mutlu oldum. Cumartesi öğleden sonra sakin bir yerde toplantı meselesini baştan sona konuşalım mı?"
- "Bu konuyu geçiştirmek istemiyorum. Cumartesiye kadar iş saatleri için bir plan düşüneyim, birlikte bakarız."

## Paylaşılabilir kart
- 🕗 "8:15'te geliyorum" dedi, 8:14'te geldi.
- 🍷 Kavga 35 dakika sürdü, şarap akşamı kurtardı.
- 📅 Sıradaki görev: hafta sonu toplantısı (müdürsüz).

---

## 5-kanka-sevgisi.txt (21 mesaj)

### Haiku 5.5 (high)

_girdi 1931 · çıktı 2684 token · 15.1 sn · $0.0015 · end_turn_

## Kısa özet
Sohbet kısa ama sıcak: iki gündür görüşemeyen iki arkadaş, şakayla başlayan bir "neredesin?" mesajından sonra kahve, tez ve kutlamayla ilerliyor. Üç gün içinde 21 mesajlık bu yazışmada karşılıklı espri ve destek var. Örneklem küçük olduğu için yorumlar kesin değil, eğilim olarak okunmalı.

## Kim nasıl yazıyor
- **Ece:** 11 mesaj, emojiyi daha sık kullanıyor (13). Sohbeti başlatan kişi o ve buluşma planını da o kuruyor ("akşam kahve?").
- **Damla:** 10 mesaj, daha kısa ve kendi halini espriyle anlatan cümleler kuruyor (ortalama 5,5 kelime). Emoji sayısı 7. Teşekkür ve minnet ifadeleri onda daha belirgin ("Sensiz ne yapardım bilmiyorum cidden").

## İlişki dinamiği
- **Mesaj dengesi neredeyse eşit:** 11'e 10. Yani sohbetin yükü iki tarafta da var; biri diğerini sürekli takip etmiyor.
- **Şakayla gelen özlem:** "Kızım nerdesin ölü müsün 😤" ve "Hain seni, iki gündür ses yok" gibi mesajlar aslında "seni özledim" anlamına geliyor.
- **Destek ve kutlama:** "Söyledim sana inek 💕" ve "AAAAA kız sen bir dahisin 😭🎉 gurur duydum" gibi cevaplar, Ece'nin Damla'nın başarısını gerçekten önemsediğini gösteriyor.
- **Mizahla telafi:** Damla'nın "Biliyorum ben bir pisliğim 😭" cevabı kendini suçlayan bir şaka. Ece'nin "Aynen öylesin 😂" yanıtı da onu tatlıca yumuşatıyor. Bu, iki tarafın birbirinin şakasını anladığını gösteriyor.
- **Ortak plan ve geri dönüş:** "Tezi bitir de bana yemek ısmarla" ve "Ücretimi bekliyorum, faiziyle 💸😂" ifadeleri, ilişkinin ileriye dönük şakalarla devam ettiğini gösteriyor.

## Ton ve satır araları
- **"Ben de seni öldürürüm, seç birini 🔪😂"** → Sert görünen ama tamamen şaka. Emoji ve bağlam tehdit değil, sevgi dili olduğunu gösteriyor.
- **"Yazmazsan bozuşuruz 😤❤️"** → Küsme taklidi, aslında "unutma bizi" mesajı. Kalp emojisi bunu yumuşatıyor.
- **"Ölmedim maalesef 😂"** → "Maalesef" kelimesi burada ironik bir şaka. Damla'nın kendi gecikmesine dair mahcubiyetini hafifletiyor.
- **"Ücretimi bekliyorum, faiziyle 💸😂"** → Kutlamanın ardından gelen tatlı bir talep. Kimse ciddiye almıyor, o yüzden sıcak bir kapanış oluyor.

## İlgi göstergesi
- **Ece: 9/10.** Sohbeti o başlatıyor, buluşma öneriyor ve Damla'nın başarısını kendi başarısı gibi kutluyor.
- **Damla: 8/10.** Yanıtları hızlı ve sıcak, minnettarlığını açıkça belirtiyor. Sohbeti ilk başlatmadı ama katılımı yüksek.

## Ne yazabilirsin
1. "Tamam kahve benden olsun bu sefer 🎉 Teşekkür kısmını da bekliyorum, unutmadım 😄"
2. "Ücretini nakit mi taksitle mi ödeyeyim, faiz pazarlığına açığım 💸😂"

## Paylaşılabilir kart
- "Tezi bitti, kahve terapisi işe yaradı ☕🎉"
- "Ücret faizli, teşekkür adına yazılacak 😂"
- "Hain değil, dahi çıktı 😭❤️"

### Sonnet 5.5 (low)

_girdi 1931 · çıktı 1402 token · 12.4 sn · $0.0179 · end_turn_

## Kısa özet
İki yakın arkadaş arasında sıcak, esprili ve karşılıklı bir sohbet var. Sert görünen sözler ("hain", "pisliğim", "öldürürüm") büyük ihtimalle samimi şaka. Arkasında ciddi bir gerginlik değil, özlem ve destek görünüyor.

## Kim nasıl yazıyor
- **Ece:** 11 mesaj, ortalama 6 kelime ve 13 emoji ile biraz daha ifadeli. Sohbeti o başlatmış, cevapları da yaklaşık 1 dk içinde gelmiş.
- **Damla:** 10 mesaj, ortalama 5,5 kelime, 7 emoji. Kısa ve tempolu yazıyor, Ece'ye çabuk karşılık veriyor (ortanca cevap süresi 1 dk).

## İlişki dinamiği
- **Özlem sert şakayla söyleniyor:** "Hain seni, iki gündür ses yok" ve "ölü müsün 😤" alttan alta "seni özledim" anlamına geliyor olabilir.
- **Şaka karşılıklı:** Damla "Ben bir pisliğim 😭" diye kendi kendine takılıyor, Ece de "Ben de seni öldürürüm 🔪😂" diye karşılık veriyor. İkisi de gülen emojiyle yazmış, tehdit değil oyun gibi duruyor.
- **Ece'nin ısrarı işe yarıyor:** Damla önce "danışmanım beni öldürür" diyor, birkaç mesaj sonra "7'de Moda?" diye kabul ediyor. Ece'nin ısrarı büyük ihtimalle iyi niyetli bir çekiş.
- **Duygusal destek var:** "Sensiz ne yapardım bilmiyorum cidden" ve "Söyledim sana inek 💕" arasında şakanın altında gerçek bir minnet ve şefkat görünüyor.
- **Sevinç paylaşılıyor:** Tez haberini ilk Ece'ye vermesi, Damla için onun önemli biri olduğuna işaret ediyor.

## Ton ve satır araları
- **"Geç kalıyosun salak":** Muhtemelen alışılmış bir takılma. "Yine" demesi, bunun eski bir huy olduğunu ve sevgiyle söylendiğini düşündürüyor.
- **"Yazmazsan bozuşuruz 😤❤️":** Tehdit gibi başlayıp kalple bitiyor, yani oyunbaz. Teşekkür kısmında adının geçmesini gerçekten önemsiyor olabilir.
- **"Ücretimi bekliyorum, faiziyle 💸😂":** Yemek ısmarlama sözünü tatlı bir şekilde hatırlatıyor. Şaka olsa da buluşma fikrini canlı tutuyor.

## İlgi göstergesi
- **Ece: 9/10.** İlk mesajı atıyor, buluşma teklif ediyor ve başarıya içtenlikle sevinip "gurur duydum" diyor.
- **Damla: 9/10.** Hızlı cevap veriyor, "çok iyi geldi" ve "sensiz ne yapardım" diyerek minnetini açıkça gösteriyor.

## Ne yazabilirsin
- "Tez bitti sayılır, sözümü unutmadım. Cumartesi yemek benden, istediğin yeri seç 🥳"
- "Teşekkür kısmında adın en başta olacak, baskıya girmeden itiraz hakkın yok 😂❤️"

## Paylaşılabilir kart
- ☕ Kahve terapisi: tez onaylandı, vaka kapandı.
- 🔪😂 "Seç birini": danışman mı Ece mi? Damla akıllıca Ece'yi seçti.
- 💸 Faizli yemek borcu işlemeye başladı.
