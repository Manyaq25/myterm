# Sohbet analizi model karşılaştırması

Tarih: 2026-10-16 · effort: medium

## Ölçümler

| Sohbet | Model | Girdi | Çıktı | Süre | Maliyet |
|---|---|---|---|---|---|
| 1-soguyan-flort.txt | Haiku 5.5 | 2552 | 2748 | 15.0 sn | $0.0016 |
| 1-soguyan-flort.txt | Sonnet 5.5 | 2552 | 1792 | 15.5 sn | $0.0230 |
| 2-kankalar-grubu.txt | Haiku 5.5 | 2651 | 2530 | 13.7 sn | $0.0015 |
| 2-kankalar-grubu.txt | Sonnet 5.5 | 2651 | 1839 | 17.6 sn | $0.0237 |
| 3-anne-ogul.txt | Haiku 5.5 | 2084 | 2382 | 12.9 sn | $0.0014 |
| 3-anne-ogul.txt | Sonnet 5.5 | 2084 | 1692 | 16.4 sn | $0.0211 |
| 4-ironik-kavga.txt | Haiku 5.5 | 2023 | 2681 | 14.2 sn | $0.0015 |
| 4-ironik-kavga.txt | Sonnet 5.5 | 2023 | 1588 | 15.8 sn | $0.0199 |
| 5-kanka-sevgisi.txt | Haiku 5.5 | 1931 | 2083 | 11.7 sn | $0.0012 |
| 5-kanka-sevgisi.txt | Sonnet 5.5 | 1931 | 1511 | 13.6 sn | $0.0190 |

## Analiz başına ortalama

| Model | Ort. çıktı token | Ort. süre | Bu testte $/analiz | Gerçek boyutta tahmini $/analiz (12000 girdi) | 300 analiz/ay |
|---|---|---|---|---|---|
| Haiku 5.5 | 2485 | 13.5 sn | $0.0015 | $0.0024 | $0.73 |
| Sonnet 5.5 | 1684 | 15.8 sn | $0.0213 | $0.0408 | $12.25 |

---

## 1-soguyan-flort.txt (41 mesaj)

### Haiku 5.5

_girdi 2552 · çıktı 2748 token · 15.0 sn · $0.0016 · end_turn_

## Kısa özet
Sohbetin başı sıcak ve enerjikti. 2-4 Ekim arasında Cumartesi planı kuruldu, sonra Zeynep'in cevapları kısalıp gecikmeye başladı. 15-16 Ekim'deki "Tamam." mesajı, konuşmanın bu noktada kapandığını veya Zeynep'in mesafe koyduğunu düşündürüyor, ama bunu kesin olarak bilemeyiz.

## Kim nasıl yazıyor
- **Emre:** Sohbeti 8 kez başlatmış, ortanca cevap süresi 1 dakika. Planları o öneriyor, ısrar eden ve ilgisini açıkça gösteren bir yazım tarzı var.
- **Zeynep:** Hiç sohbet başlatmamış, ortanca cevap süresi yaklaşık 166 dakika. Mesajları daha kısa (ortalama 4,6 kelime) ve cevapları genelde tek kelime ya da kısa cümle ("Olur", "Bakarım", "İdare eder").

## İlişki dinamiği
- **Sıcak başlangıç:** "Bugün kafede seni görünce çok sevindim" ve "Cumartesi bana uyar 🙌" gibi mesajlarda iki taraf da istekli görünüyor.
- **Ritim değişimi:** 4 Ekim'den sonra Zeynep'in cevapları kısalıyor: "Olur", "Evet güzeldi", "Bakarım". Emre'nin mesajları ise daha uzun ve plan odaklı kalıyor.
- **Tek yönlü plan kurma:** Sergi daveti ("Bu hafta sonu bir sergi var Pera'da") ve "Bu arada sergi pazar akşamına kadar açıkmış" mesajları Emre'den geliyor. Zeynep'in yanıtı "Bu hafta sonu olmayacak galiba" oluyor.
- **Hassas nokta:** "Biraz sessizsin bu aralar" ve "Sen ne zaman müsait olursan" mesajları Emre'nin ilgisini gösteriyor, ama ilgi ile baskı arasındaki çizgi burada ince. Zeynep'in "Tamam." cevabı bunun bir işareti olabilir.
- **Sohbet dengesi:** Emre'nin 25, Zeynep'in 16 mesajı var. Emre'nin ardı ardına gönderdiği mesajlar da sık görülüyor (ör. "Cumartesi çok güzeldi bence, teşekkürler 🙏" ardından "Tatlı da kahve kadar iyiymiş haha").

## Ton ve satır araları
- **"Tamam."** (16.10 10:05): Noktalı, tek kelimelik cevap. Önceki "Tamam" kullanımlarına göre daha soğuk okunabilir. Ama bu bir kapanış da olabilir, "tamam, sağ ol" gibi nazik bir kabul de.
- **"Çok komiksin ya :)"** (14.10 01:12): Gece yarısı gelen, gülen yüzle biten bir cevap. Hem sevgi hem mesafe taşıyabilir. Emre'nin "Neden ki" diye sorması, bu yorumun netleşmediğini gösteriyor.
- **"Bakarım, bu hafta biraz yoğunum"** (08.10): Açık bir "hayır" yerine ertelemeyi tercih ediyor. Bu, yakınlık için kapıyı tamamen kapatmak istemediğini ya da nazik kalmaya çalıştığını düşündürebilir.
- **"Yok ne kusuru, başka zaman 😊"** (12.10): Emre'nin nazik kabulü. Yine de bir sonraki mesajında ("Sen ne zaman müsait olursan") planı yeniden açması, konunun tamamen kapanmadığını gösteriyor.

## İlgi göstergesi
- **Emre: 8/10.** Sohbeti sürekli canlı tutuyor, plan öneriyor ve mesajlarında samimi bir dil var.
- **Zeynep: 4/10.** Başta sıcaktı ("Kesinlikle 😍", "Olur bence! 🙌"), ancak son haftada cevapları kısaldı ve daveti geri çevirdi.

## Ne yazabilirsin
1. Baskı hissettirmeden alan bırakan, dürüst bir mesaj:
   *"Son zamanlarda mesajlarım seni yoruyorsa söyle, rahat olurum. Bir şey olursa ve konuşmak istersen buradayım 🙂"*
2. Sıcaklığı koruyan, herhangi bir beklenti yaratmayan kısa bir not:
   *"Tamam, anlıyorum. Kafanı toplayınca bir kahve içmek istersen ne güzel olur, yoksa sorun değil."*

## Paylaşılabilir kart
- ☕ Filtre kahvesi kazandı, sergi kazanamadı.
- 🙃 "Tamam." yazan biri, sessizliğiyle bile konuşur.
- 📅 Plan yapmak kolay, takvimle uyuşmak zor.

### Sonnet 5.5

_girdi 2552 · çıktı 1792 token · 15.5 sn · $0.0230 · end_turn_

## Kısa özet
Sohbet ilk gün çok sıcak başlıyor: karşılıklı emoji, kahve, film ve cumartesi planı var. Sonrasında Zeynep'in cevapları kısalıyor ve gecikiyor, Emre ise ilgisini canlı tutmaya çalışıyor. Büyük ihtimalle Zeynep'in ilgisi azalmış ya da gerçekten yoğun. İstatistikler tek başına bunu kesin söylemiyor.

## Kim nasıl yazıyor
- **Emre:** 25 mesaj, ortalama 5,6 kelime, 6 emoji. Sohbeti 8 kez başlatmış, ortanca cevap süresi 1 dk. Ayrıca 7 kez cevapsız ard arda mesaj atmış; bu, yazdığı şeylerin sık sık karşılıksız kaldığını gösteriyor.
- **Zeynep:** 16 mesaj, ortalama 4,6 kelime, 4 emoji. Sohbeti hiç başlatmamış, ortanca cevap süresi 166 dk. İlk gün hızlı ve uzun yazarken sonra kısa ve geç yazmaya başlamış.

## İlişki dinamiği
- **İlk gün enerjisi:** "Selaaam 😄 ben de çok sevindimm" ve "Kesinlikle 😍 bir dahakine tatlısını da deneyelim" gibi mesajlar, o gün Zeynep'in de istekli olduğunu gösteriyor.
- **Cumartesi buluşması iyi geçmiş ama sonrası zayıf:** Emre "Cumartesi çok güzeldi bence, teşekkürler 🙏" diyor. Zeynep'in 2,5 saat sonraki cevabı ise "Evet güzeldi". Onay var ama karşılık olarak yeni bir şey eklemiyor, soru da sormuyor.
- **Planı Emre taşıyor:** Sergi önerisine "Bakarım, bu hafta biraz yoğunum", sonra "Bu hafta sonu olmayacak galiba, kusura bakma" cevabı geliyor. Zeynep nazik, ama kendi alternatif önerisi yok. Emre'nin "Sen ne zaman müsait olursan" demesi de topu tamamen ona bırakıyor.
- **Film unutulmuş gibi:** Zeynep "izleyince sana yazarım" demişti. Sonra "Yok daha fırsat olmadı" dedi ve konu bir daha açılmadı. Bu küçük bir detay, ama ilk günkü heyecanın düştüğüne işaret ediyor olabilir.
- **Emre yoklama yapıyor:** "Biraz sessizsin bu aralar" gibi mesajlar ilgiyi ölçme çabası gibi okunabilir. Zeynep'in "sadece kafam dolu" cevabı da yoğunluğa ya da mesafe koymaya işaret ediyor olabilir.

## Ton ve satır araları
- **"Tamam."** (son mesaj): Noktalı, tek kelimelik cevap genelde konuyu kapatan, mesafeli bir tondur. Burada yorgunluk ya da isteksizlik olabilir, ama sıcaklık yok.
- **"Çok komiksin ya :)"** (gece 01:12): Samimi görünüyor, ama Emre'nin "aklıma geldin" mesajına karşılık flört edici bir cevap da değil. Hafif ve belirsiz bir ton.
- **"İdare eder"** ve **"Evet güzeldi":** Kısa ve kapalı cevaplar. Karşı soruları ya da devam sorusu yok.
- **"Bakarım"** ve **"galiba":** Kibar ama bağlayıcı olmayan ifadeler. Bu ifadeler çoğu zaman net bir "evet" olmadığını gösterir.

## İlgi göstergesi
- **Emre: 8/10.** Hızlı cevap veriyor, sürekli sohbeti açıyor ve plan yapmaya çalışıyor.
- **Zeynep: 4/10.** Nazik kalıyor ve tamamen kapatmıyor, ama girişim, merak ve hız ilk günden sonra belirgin biçimde düşmüş.

## Ne yazabilirsin
- "Yoğun bir dönemdesin galiba, rahat ol. Sen hazır hissedince bir kahve içeriz, olmazsa da sorun değil 😊"
- "Perfect Days'i izlersen yorumunu merak ederim, ama hiç acelesi yok."

Bir süre mesaj sıklığını azaltmak ve cevabı ona bırakmak, baskı hissini azaltabilir.

## Paylaşılabilir kart
- ☕ Başlangıç: filtre kahve, tatlı planı, tam gaz
- 🎬 Perfect Days hâlâ listede, izlenmeyi bekliyor
- 📩 Emre: 25 mesaj, Zeynep: sessiz mod

---

## 2-kankalar-grubu.txt (41 mesaj)

### Haiku 5.5

_girdi 2651 · çıktı 2530 token · 13.7 sn · $0.0015 · end_turn_

## Kısa özet
Grup, halı saha maçı etrafında dönen, şakalaşmanın eksik olmadığı bir sohbet. Burak organizasyonu üstlenen kişi gibi duruyor, Can en hızlı ve en enerjik katılımcı. Mert ve Deniz'in geç kalma ve "bakıcam" konusundaki tekrarları ise sohbetin esprili ama biraz yorucu tarafını oluşturuyor.

## Kim nasıl yazıyor
- **Burak:** En çok mesajı yazan (15) ve sohbeti başlatan kişi. Ortanca cevap süresi 1 dakika, yani organizasyonu sıkı takip ediyor.
- **Can:** En çok emoji kullanan (12) ve en hızlı tepki veren kişi. Espri yapıp moral veriyor (*"Kesin 💪"*).
- **Deniz:** Kısa ve emojisiz yazıyor (0 emoji). Ortanca cevap süresi 162 dakika, yani cevapları genelde gecikmeli.
- **Mert:** 9 mesajla aktif, ama ortanca cevap süresi 145 dakika. Mesajları çoğunlukla son dakikaya kalıyor.

## İlişki dinamiği
- **Şakalaşma düzeni:** *"Mert kardeşim 4 kişiyiz sen gelmezsen maç olmuyor"* gibi takılmalar grupta sürekli dönüyor ve genelde karşılıklı gülümsemeyle karşılanıyor.
- **Tekrarlanan erteleme:** *"Deniz her hafta bakıcam diyon gelmiyon ama"* ve *"Akşam atarım"* → *"Pardon unuttum şimdi atıyorum"* gibi mesajlar, Deniz ve Mert'in katılım ve ödeme konusunda benzer bir kalıbı olduğunu gösteriyor.
- **Sorumluluğun Burak'ta toplanması:** Burak hatırlatma, ödeme ve rezervasyon işlerini üstleniyor. *"Deniz Mert hatırlatma 🙃"* mesajı bu yükü de yansıtıyor.
- **Ortak bir mizah dili:** *"Mert yine yaptı yapacağını"* ve *"Klasik 😂"* gibi ifadeler, bu erteleme durumunu grubun birlikte güldüğü bir konu hâline getirmiş.

## Ton ve satır araları
- **"Büyük ihtimal = gelmiycem 😂"** (Can → Mert): Gülen yüz ve "Sus lan 😂" cevabı, bunun takılma olduğunu gösteriyor. Samimi bir alay.
- **"Ciddi misin ya 😐"** (Burak → Mert): Yüz ifadesi sabırsızlığı andırıyor ama gerginlik çok yüksek değil. Muhtemelen hayal kırıklığını hafiflettiği bir tepki.
- **"Tamam ben kuzenimi çağırıyorum o zaman"** (Burak): Ciddi bir tehdit değil, Mert'i dürten bir espri. Devamında *"Parayı da kuzenim verir bari"* ifadesi bunu teyit ediyor.
- **"Söylemiştim 😎"** (Burak): Kendi yorumunu hafif bir övünmeyle kutluyor. Sohbetin neşeli tarafını yansıtıyor.

## İlgi göstergesi
- **Burak: 8/10.** Organizasyonu üstleniyor, hızlı cevap veriyor ve grubu bir arada tutuyor.
- **Can: 8/10.** Enerjik, katılımcı ve moral veren bir tavrı var.
- **Deniz: 5/10.** Ortak plana ilgisi var, ama cevapları gecikiyor ve "bakıcam" ifadesinin sıklığı kararsızlık izlenimi bırakıyor.
- **Mert: 5/10.** Sohbete katılıyor ve şakalaşmaya açık, ama katılım konusunda belirsiz kalıyor. Gerçek ilgisi büyük ihtimalle orta düzeyde.

Bu puanlar yalnızca mesaj içeriğine ve istatistiklere dayanıyor. Kişilerin gerçek duygu ve niyetleri hakkında kesin bir yargı değil.

## Ne yazabilirsin
- **Grup için (esprili hatırlatma):** *"Beyler cuma saat 9 için kapora ödendi, kişi başı 250 TL. Atmayanlar hem Mert'e hem Deniz'e selam söylesin 😄"* (Not: Son cümleyi, Mert ve Deniz'in kendilerine şaka olarak alabileceği bir dille kullanabilirsin.)
- **Mert'e özel:** *"Mert, ne zaman gelirsin sana sorayım, ama bu sefer kuzen değil sen oynayacaksın 😂"*

## Paylaşılabilir kart
- ⚽ 41 mesaj, 1 kapora, 4 kişi, 0 kesin "geliyorum" (şimdilik)
- 🕘 Burak 1 dakikada cevap verirken Mert'in "akşam atıcam" dediği akşam hâlâ bekliyoruz
- 🏃 Kuzen maçı kurtarmaya hazır, ama Mert hâlâ kendini kanıtlayabilir

### Sonnet 5.5

_girdi 2651 · çıktı 1839 token · 17.6 sn · $0.0237 · end_turn_

## Kısa özet
Bu grup, halı saha organizasyonu etrafında dönen samimi bir kanka grubu. Burak organizatör, Can neşe ve hızlı destek, Deniz ile Mert ise "gelirim, atarım" diyip geciktiren ikili. Sert görünen laflar (“Sus lan”, “Klasik 😂”) büyük ihtimalle yıllanmış takılma.

## Kim nasıl yazıyor
- **Burak:** 15 mesajla en çok yazan, tek sohbet başlatan kişi (1/1). Cevap süresi 1 dk, yani grubu elinde tutan organizatör.
- **Can:** 10 mesaj, 12 emoji ile en "renkli" kişi. Hiç sohbet başlatmıyor ama 1 dk'da cevap veriyor; hep anında orada.
- **Deniz:** 7 mesaj, 0 emoji, ortanca cevap süresi 162 dk. Kısa, sakin, sabah ağırlıklı (en aktif saat 9:00) bir tarzı var.
- **Mert:** 9 mesaj, 3 emoji, ortanca cevap 145 dk. Gece geç saatlerde beliriyor (21:00 ve 23:58 mesajları).

## İlişki dinamiği
- **Organizatör ve takılan ekip:** Burak sahayı ayırıyor, kaporayı veriyor, hatırlatıyor. "Deniz Mert hatırlatma 🙃" tipik bir "nazik ama bıktım" dürtmesi.
- **Mert'in "büyük ihtimal" geleneği:** Can'ın "Büyük ihtimal = gelmiycem 😂" esprisi ve Mert'in "Sus lan 😂" cevabı, bunun grupta bilinen bir şaka olduğunu gösteriyor. Mert de kendiyle dalga geçilmesine açık görünüyor.
- **Deniz'de güven biraz yıpranmış ama sıcak:** "Her hafta bakıcam diyon gelmiyon ama" iğneleme içeriyor, ancak Deniz "Yaa bu sefer ciddi" diye gülerek karşılık verince ortam gergin değil. Sonra "Kesin geliyorum bu sefer" ile sözünü pekiştirdi.
- **Burak'ın sabrı sınırda olabilir:** Mert'in 23:58'deki "söz veremiyorum" mesajına "Ciddi misin ya 😐" demesi bu gruptaki en net hayal kırıklığı anı. Yine de çözüm üretip kuzenini çağırdı, kavga çıkarmadı.
- **Para konusu ince bir gerilim noktası:** Burak, Mert'e "Mert?" diye tek kelimeyle yazdı, sonra maç sonrası "önce parayı at da 😂" dedi. Şakayla söylenmiş ama arkasında gerçek bir beklenti var gibi.

## Ton ve satır araları
- **"Mert?"** (11.10 12:30): Tek kelime ve soru işareti, kibar bir "nerede paran?" demek olabilir. Burak'ın o an biraz sabırsızlandığına işaret ediyor.
- **"Deniz Mert hatırlatma 🙃":** Ters gülen yüz genelde hafif ironi taşır. Sitem var ama takılma tonunda.
- **"Ciddi misin ya 😐":** Şakanın biraz azaldığı an. Burak'ın asıl rahatsızlığı büyük ihtimalle son dakika belirsizliği.
- **"Attım abi tamam 😅":** Mert'in mahcup ama barışçıl cevabı; Burak'ın "Eyvallah 🙏" yanıtı da meseleyi tatlıya bağlıyor.

## İlgi göstergesi
- **Burak: 9/10:** Organizasyonu sırtlıyor, herkesi tek tek takip ediyor; gruba yatırımı yüksek.
- **Can: 9/10:** Her mesaja anında dönüyor, bol emojiyle ortamı canlı tutuyor.
- **Deniz: 6/10:** Geç cevap veriyor ve emoji kullanmıyor ama sorulduğunda katılıyor, ödemeyi de yaptı.
- **Mert: 6/10:** Gecikmeli ve kaçamak, ama esprilere katılıyor ve sonunda parayı gönderdi; grubu önemsiyor gibi görünüyor.

## Ne yazabilirsin
- "Haftaya saat 9, aynı yer. Mert, bu sefer 'büyük ihtimal' değil, evet/hayır istiyorum 😄"
- "Kuzen kadroya kalıcı girdi mi, yoksa Mert'e son bir şans mı verelim? 😂"

## Paylaşılabilir kart
- ⚽ Kadro: 1 organizatör, 1 neşe kaynağı, 2 "bakarız"
- 🏆 Haftanın transferi: Burak'ın kuzeni (3 gol!)
- 📅 Mert'in "büyük ihtimal"i hâlâ resmî olarak "belki"

---

## 3-anne-ogul.txt (27 mesaj)

### Haiku 5.5

_girdi 2084 · çıktı 2382 token · 12.9 sn · $0.0014 · end_turn_

## Kısa özet
Bu sohbet, sıcak ama biraz suçluluk duygusu taşıyan bir anne-oğul ilişkisi gösteriyor. Annen sohbeti genelde o başlatıyor ve hızlı cevap veriyor. Sen daha ağır yazıyor ve cevapların biraz gecikiyor, ama 9 Ekim'deki mesajlarda sıcaklık ve isteklilik açıkça artıyor.

## Kim nasıl yazıyor
- **Annem:** 16 mesaj, ortalama 5,8 kelime, 2 kez sohbeti başlatmış. Ortanca cevap süresi yaklaşık 1 dakika, yani çok hızlı dönüyor. Sık sık "oğlum" diye hitap ediyor ve kalp, gülen yüz gibi duygusal emojiler kullanıyor.
- **Sen (Kerem):** 11 mesaj, ortalama 4,5 kelime. Sohbeti hiç başlatmamışsın. Ortanca cevap süren yaklaşık 9 dakika. Kısa ve net yazıyorsun, zaman zaman "Anne 😂" gibi şakacı bir tonla.

## İlişki dinamiği
- **Sohbeti kim açıyor:** Annen her sabah "Günaydın oğlum" diyerek sohbeti başlatıyor. Bu, sürekli bağ kurma isteğinin göstergesi olabilir.
- **Davet ve mesafe:** "Pazar yemeğe geliyor musun?" sorusuna "Bu pazar zor anne" cevabını verdin. Annen de "Sen bilirsin" ve "Biz alıştık" diyerek hafif bir kırgınlık gösterdi.
- **Sağlık haberi:** Babanın durumunu sana geç söylemesi sende tepki yarattı ("Neden şimdi söylüyorsun"). Annen seni üzmemek için bunu sakladığını anlattı. Sen de hemen babanı aramaya karar verdin. Bu, aile içinde ilgili olduğunu gösteriyor.
- **Barışma ve sıcaklık:** Babanla konuşmanın ardından iletişim belirgin biçimde yumuşadı. "Pazar geliyorum anne" dedin ve annen "Sarma yaparım, sen seversin" diyerek karşılık verdi.
- **Suçluluk ve geri adım:** "Uzun zamandır aramıyorsun zaten" ve "işin varsa gelme" gibi ifadeler, suçluluk ile sevgi arasında gidip gelen bir dil kullandığını düşündürüyor. Ama sonunda "Montunu da al" diyerek ilgisini yine gösterdi.

## Ton ve satır araları
- **"Sen bilirsin"** (14:21): Noktalı ve kısa. Kırgınlık ya da küskünlük içerebilir. Ama sonraki mesajda "Teyzen de seni sordu" diye devam etmesi, bunun ağır bir suçlama olmadığını gösteriyor.
- **"Ne?? Neden şimdi söylüyorsun"** (08.10 21:40): Sana ani bir endişe ve biraz da tepki geldiğini gösteriyor. Hemen ardından "Doktora gittiniz mi" diye sorman, asıl kaygının babanın sağlığı olduğunu gösteriyor.
- **"Ara, sevinir. Uzun zamandır aramıyorsun zaten"**: Hafif bir suçlama içeriyor, ama "sevinir" kelimesi bunu yumuşatıyor. Büyük ihtimalle özlemin dile gelmiş hali.
- **"Anne 😂 geliyorum dedim"**: Gülen yüz ve şakacı bir tonla yazmışsın. Bu, annene karşı rahat ve sevecen bir üslup kullandığını gösteriyor.

## İlgi göstergesi
- **Annem: 8/10.** Sohbeti sürekli o açıyor, hızlı cevap veriyor ve duygusal ifadeler kullanıyor. Ailesini önemsediği açıkça görülüyor.
- **Kerem: 6/10.** Cevapları geç ve kısa olsa da, babanı arama kararı ve pazar gelme kararı ilgisinin ve bağlılığının güçlü olduğunu gösteriyor.

## Ne yazabilirsin
1. "Anne, pazar için ne getireyim? Bir şey almak ister misin?"
2. "Babamla ilgili haber için teşekkür ederim, sık sık yazmaya çalışırım. Bu hafta bir telefon da ederim."

## Paylaşılabilir kart
- 🥟 Anne sarma hazırlıyor, Kerem montunu almayı unutmuyor
- 📞 Babayla konuşuldu, telefon yarım saat sürdü
- 😂 "Geliyorum dedim" = pazar planı kesinleşti

### Sonnet 5.5

_girdi 2084 · çıktı 1692 token · 16.4 sn · $0.0211 · end_turn_

## Kısa özet
Sohbet sıcak ve sevgi dolu; annenin ilgisi ve biraz da "kırgın ama belli etmeyen" annelik dili öne çıkıyor. İlk günlerde mesafeli bir hava var, ama babanın tansiyonu haberiyle ilişki yumuşuyor ve sohbet "Pazar geliyorum" ile mutlu bitiyor. 🙂

## Kim nasıl yazıyor
- **Annem:** 16 mesaj, ortalama 5,8 kelime. Sohbeti 2 kez o başlatmış, ortanca cevap süresi 1 dk; yani mesajlara neredeyse anında dönüyor. Kısa, art arda mesajlar atıyor.
- **Kerem:** 11 mesaj, ortalama 4,5 kelime. Sohbeti hiç başlatmamış, ortanca cevap süresi 9 dk. İlk cevap 09:30'daki mesaja 12:47'de gelmiş, ama ilerleyen günlerde ve akşam saatlerinde daha hızlı ve canlı yazmış.

## İlişki dinamiği
- **Anne ilgiyi başlatıyor, Kerem karşılık veriyor.** Sohbeti başlatma 2'ye 0; "Günaydın oğlum, kahvaltı yaptın mı" klasik bir anne ilgisi.
- **Davete yumuşak baskı var.** "Teyzen de seni sordu zaten, ben de bilmiyorum dedim" büyük ihtimalle "seni özledik" demenin dolaylı yolu.
- **Babanın tansiyonu kırılma noktası.** Anne "Seni üzmek istemedim" diyerek haberi geciktirmiş, Kerem de "Anne böyle şeyleri hemen söyle lütfen" diye karşılık vermiş. Burada çatışmadan çok endişe ve koruma refleksi var.
- **Kerem harekete geçiyor.** "Yarın arıyorum babamı" dedi, ertesi gün aradı ve "Babamla konuştum, iyiymiş" diye haber verdi. Bu, ilişkiyi onaran asıl adım gibi duruyor.
- **Son bölüm çok sıcak.** "Pazar geliyorum anne, proje beklesin" sonrası emojiler artıyor (anne 😍 ❤️, Kerem 😄 😂) ve ton belirgin şekilde yumuşuyor.

## Ton ve satır araları
- **"Sen bilirsin"**: Annelerde sık görülen ifade; "gelmeni isterdim ama baskı yapmayacağım" anlamına gelebilir. Tam bir vazgeçmişlik değil, daha çok kırgınlık ve beklenti karışımı.
- **"Biz alıştık"**: Hafif sitem gibi duruyor; alıştıklarını söylerken aslında özlemi ve eksikliği hissettiriyor olabilir.
- **"Uzun zamandır aramıyorsun zaten"**: Doğrudan bir eleştiri ama endişenin hemen ardından geldiği için azarlamadan çok bir hatırlatma gibi.
- **"Ama zahmet olmasın sana, işin varsa gelme"**: Sarma sözünden hemen sonra geliyor; büyük ihtimalle sevincini saklamaya çalışan, şefkatli bir geri adım. Kerem de "Anne 😂 geliyorum dedim" diyerek bunu doğru okumuş.

## İlgi göstergesi
- **Annem: 10/10**: Hızlı cevap, günlük sorular, yemek planı ve "Montunu da al" gibi ayrıntılarla ilgisi çok belli.
- **Kerem: 8/10**: Başta biraz geç ve kısa kalmış, ama haber sonrası hızlanması, babasını araması ve son mesajlardaki neşesi güçlü bir yakınlık gösteriyor.

## Ne yazabilirsin
- "Anne, sarmaya ekstra yer ayır, aç geliyorum 😄 Ayrıca bundan sonra bir şey olursa beni ilk sen ara, söz ben de daha sık arayacağım."
- "Günaydın anne, bu sefer kahvaltıyı saat 9'da yaptım, rekor 😂 Akşam müsaitsen sesli konuşalım mı?"

## Paylaşılabilir kart
- 🥬 Pazar menüsü: sarma. Mazeret: iptal.
- 🧥 "Montunu al" = Türkçede "seni seviyorum"un resmi versiyonu.
- 📞 Anne 1 dakikada cevap veriyor, Kerem 9 dakikada. Pazar günü berabere kalacak.

---

## 4-ironik-kavga.txt (23 mesaj)

### Haiku 5.5

_girdi 2023 · çıktı 2681 token · 14.2 sn · $0.0015 · end_turn_

## Kısa özet
Akşamın başı bir geç kalma yüzünden gergin geçmiş, ama sohbet sıcak bir "iyi geceler" ile bitmiş. Selin'in iğneleyici ifadeleri konuşmanın yükünü taşıyor, Ozan ise özür ve uzlaşma yolunu seçmiş. Konu hâlâ açık: hafta sonu konuşulacak.

## Kim nasıl yazıyor
- **Selin:** Mesajları daha kısa (ort. 5,3 kelime) ama sayıca önde (12 mesaj). Sohbeti o başlatmış ve kırgınlığını noktalı, kısa cümlelerle ifade etmiş.
- **Ozan:** Biraz daha uzun cümleler kurmuş (ort. 6,2 kelime) ve özür, açıklama, söz verme gibi "onarıcı" mesajları çoğunlukla o yazmış. Emojileri yumuşatıcı kullanmış (😅).

## İlişki dinamiği
- **Gerginlik ve onarım döngüsü:** "Ya çok pardon iş uzadı" ile başlayan özür, "Bilerek yapmıyorum" savunmasıyla ve Selin'in "Aynen öyle canım" cevabıyla sertleşiyor. Ardından Ozan "Bak geçen ay da aynısını yaşadık" diyerek kalıplaşan bir sorunu gündeme getiriyor.
- **Ozan'ın sorumluluk alma çabası:** "Restoranı iptal etmeyeyim, 8:15'te oradayım söz" ve "Bu sefer telefonu kapatıp çıkıyorum" mesajları, iş yerinden gelen baskıyla ilgili bir çıkış arayışı gibi okunuyor.
- **Selin'in sınır koyma:** "Bir dakika geç kalırsan gidiyorum 🙂" cümlesi şakaya benzese de net bir sınır. Ardından gelen "Vay, bir dakika erkencisin. Mucize 😄" ise hem takılma hem de sıcaklık taşıyor.
- **Akşamın ikinci yarısı:** "Bu akşam güzeldi" ve "❤️" kullanımları, sorunun ilişkiden çok bir tekrarlayan konu olduğunu ve ikisinin de bağı önemsediğini gösteriyor.

## Ton ve satır araları
- **"Harika" / "Gerçekten çok harikasın" (18:41):** Ironi açık. Selin'in kırgınlığını doğrudan değil, iğneleyerek ifade ettiği anlaşılıyor.
- **"Hiçbir şey demek değil. Aynen öyle canım" (18:44):** Kapanış tonu. Kelimeler yumuşak ama anlam sert; büyük ihtimalle konuşmayı kapatmak istiyor.
- **"Peki" ve "8:15. Bir dakika geç kalırsan gidiyorum 🙂" (19:15):** Kabul etmiş ama şartlı. Gülen yüz, sınırı tamamen sertleştirmek istemediğini gösteriyor.
- **"Tamam ❤️ iyi geceler" (23:21):** Konuşmanın ertelendiğini ama soğuk bitmediğini işaret ediyor.

## İlgi göstergesi
- **Selin: 7/10.** Kırgın olsa da restorana gelmiş, akşamı "güzel" bulmuş ve kalp emojisiyle bitirmiş. Ancak yüzeyde iğneleyici kalması, yakınlığın şimdilik kırılgan olduğunu düşündürüyor.
- **Ozan: 8/10.** Erken gelmesi, söz vermesi ve açıkça "rahatsızım bundan" demesi, ilişkiye önem verdiğini gösteriyor.

## Ne yazabilirsin
1. "Haklısın, geç kalmamalıydım. Hafta sonu oturup bu toplantı meselesini gerçekten konuşalım. Cumartesi öğlen uygun mu?"
2. "Bu akşam için teşekkürler, sana iyi ki geldim dedirtecek bir şeyler yapmaya çalışacağım 😊 Müdüre de sınır koymam gerektiğini düşünüyorum, bunu birlikte konuşalım."

## Paylaşılabilir kart
- "Erken gelmek mucize mi, yoksa bir ilişkinin yeni sayfası mı? 😄"
- "Kırmızı şarap ısmarlanınca tartışma bile tatlıya bağlanır 🍷"
- "Hafta sonu toplantısı: konu müdür, ama aslında sadece bir kahve molası 😅"

### Sonnet 5.5

_girdi 2023 · çıktı 1588 token · 15.8 sn · $0.0199 · end_turn_

## Kısa özet
Sohbet iğneleyici bir gerginlikle başlıyor, ama Ozan'ın net bir söz vermesi ve gerçekten zamanında gelmesiyle yumuşuyor. Akşam güzel bitmiş; yine de "toplantı meselesi" büyük ihtimalle tekrarlayan bir konu ve hafta sonuna ertelendi.

## Kim nasıl yazıyor
- **Selin:** 12 mesaj, ortalama 5,3 kelime. Sohbeti o başlatmış. Kısa, keskin cümleler kullanıyor ("Harika", "Peki"). Öfkeliyken ve rahatlayınca emoji tonu değişiyor (🙂 → 😄 → ❤️).
- **Ozan:** 11 mesaj, ortalama 6,2 kelime. Daha açıklayıcı yazıyor, savunma ve çözüm önerisi ağırlıklı ("müdür son dakika toplantı koydu", "8:15'te oradayım söz"). İkisinin de ortanca cevap süresi 1 dk, yani tartışma boyunca ikisi de ekrandaymış.

## İlişki dinamiği
- **Gecikme tetikledi, birikmişlik büyüttü:** Selin'in "müdürün de hep perşembe akşamları toplantı koyuyor zaten" demesi, bunun ilk kez yaşanmadığını gösteriyor. Ozan da "geçen ay da aynısını yaşadık" diyerek bunu kabul ediyor.
- **Ozan telafi modunda:** "Haklısın" ve "telefonu kapatıp çıkıyorum" cümleleri savunmadan sorumluluk almaya geçişe işaret ediyor.
- **Selin'in güveni koşullu:** "Her seferinde söz" ve "Bir dakika geç kalırsan gidiyorum" sözleri, güvenin zedelendiğini ama ilişkiye hâlâ şans verildiğini düşündürüyor.
- **Gerilim espriyle çözüldü:** Ozan "Kapıdayım" yazdığında Selin "Vay, bir dakika erkencisin. Mucize 😄" diyor. Bu, büyük ihtimalle barışmanın ilk işareti.
- **Konu kapanmadı:** Selin gece 23:20'de bile "konuşmamız lazım" diyor, Ozan da "ben de rahatsızım bundan" ile hemfikir. İkisi de sorunu görüyor.

## Ton ve satır araları
- **"Harika" / "Gerçekten çok harikasın":** Açık ironi. Hayal kırıklığı ve kırgınlık işareti.
- **"Aynen öyle canım":** "Canım" burada sevgi değil, iğneleme. Selin konuşmayı kapatmak istiyor olabilir.
- **"Konuşacak bir şey yok.":** Noktalı ve kesin. Büyük ihtimalle tersine, çok şey var ama şu an konuşmak istemiyor.
- **"Peki" + "🙂":** Şartlı bir uzlaşma. Gülen yüz burada hafif bir uyarı gibi duruyor.

## İlgi göstergesi
- **Selin: 8/10.** Kızgın olmasına rağmen akşamı iptal etmedi, geldi ve sonunda "❤️" yazdı.
- **Ozan: 8/10.** Hızlı yanıt verdi, söz verdi, şarabı ısmarlamayı önerdi ve konuyu hafta sonuna taşıyarak ciddiye aldığını gösterdi.

## Ne yazabilirsin
- "Bu akşam için teşekkürler, sabırlı olduğun için de. Hafta sonu için cumartesi öğleden sonra uygun mu? Bu sefer plan yapıp ne değişebileceğini konuşalım."
- "Toplantı konusunu savunma yapmadan dinlemek istiyorum. Sana nasıl hissettirdiğini de anlat, ben de neler yapabileceğimi düşüneyim."

## Paylaşılabilir kart
- 🕗 "8:15, bir dakika geç kalırsan gidiyorum" modu: tamamlandı, mucize gerçekleşti.
- 🍷 Kırmızı şarap barış anlaşmasına ek madde oldu.
- 📅 Sıradaki görev: Hafta sonu toplantısı. Bu sefer müdürsüz.

---

## 5-kanka-sevgisi.txt (21 mesaj)

### Haiku 5.5

_girdi 1931 · çıktı 2083 token · 11.7 sn · $0.0012 · end_turn_

## Kısa özet
Bu sohbet, tezini bitiren bir arkadaşı kutlayan sıcak ve eğlenceli bir yazışma. İkiniz de hızlı cevap veriyor, şakalaşma dili çok samimi ve birbirinize destek olduğunuz belli.

## Kim nasıl yazıyor
- **Ece:** 11 mesaj, 13 emoji. Sohbeti o başlattı ve akşam planını o kurdu. Enerjik, şakacı ve sıcak bir üslubu var.
- **Damla:** 10 mesaj, 7 emoji. Kısa ve samimi yazıyor. Duygusunu "Sensiz ne yapardım bilmiyorum cidden" gibi açık cümlelerle de gösteriyor.

## İlişki dinamiği
- **Karşılıklı şaka dili:** "Hain seni" ve "Ben de seni öldürürüm, seç birini 🔪😂" gibi sert görünen ifadeler tamamen samimiyet içinde kullanılmış. Kimse alınmamış.
- **Destek ve teşekkür:** "Abi çok iyi geldi ya resmen kafam açıldı" ve "Söyledim sana inek 💕" alışverişi, Ece'nin Damla için yanında olduğunu gösteriyor.
- **Karşılıklı gurur:** "AAAAA kız sen bir dahisin 😭🎉 gurur duydum" mesajı, sevincin iki yönlü paylaşıldığını gösteriyor.
- **Hızlı iletişim:** İkiniz de ortanca 1 dakikada cevap veriyorsunuz. Bu, sohbetin canlı ve birbirinize açık olduğunu gösteriyor.
- **Esprili borç takibi:** "Ücretimi bekliyorum, faiziyle 💸😂" gibi şakalar, aralarındaki yakınlığın bir göstergesi.

## Ton ve satır araları
- **"Aynen öylesin 😂"**: Damla'nın "pisliğim" demesine verilen takılma cevabı. Gülen yüz işareti ile birlikte samimi bir alay olarak okunuyor.
- **"Yazmazsan bozuşuruz 😤❤️"**: Şaka içinde bir istek. Kırgınlıktan çok sevgiden gelen bir "unutma" uyarısı.
- **"Yok artık, danışmanım beni öldürür"**: Stres anını hafifletme çabası. Damla bu cümleyle durumunu esprili biçimde paylaşıyor.
- **"Bu kız benim 😍"**: Ece'nin Damla'ya duyduğu sahiplenici sevgiyi gösteren, sıcak bir ifade.

## İlgi göstergesi
- **Ece: 9/10.** Akşam planını kurup geç kalan arkadaşını takılsa da yanında olmayı seçmesi, yakınlığın yüksek olduğunu gösteriyor.
- **Damla: 8/10.** "Sensiz ne yapardım bilmiyorum cidden" ve kutlama mesajlarında sevgisini açıkça belli ediyor.

## Ne yazabilirsin
1. "Sen olmasan tez de bitmezdi, akşam kahve benden! ☕😂"
2. "Teşekkür kısmı hazır, adını büyük harflerle yazıyorum 😂❤️"

## Paylaşılabilir kart
- "Tez bitti, kahve terapisi işe yaradı ☕🎉"
- "Ücret faiziyle ödenecek 💸😂"
- "Sensiz ne yapardım, bilmiyorum cidden 💕"

### Sonnet 5.5

_girdi 1931 · çıktı 1511 token · 13.6 sn · $0.0190 · end_turn_

## Kısa özet
Bu sohbet, iki arkadaş arasında sıcak ve şakacı bir yakınlık gösteriyor. "Hain", "salak", "öldürürüm" gibi sert görünen ifadeler büyük ihtimalle samimiyetin dili. Arkasında özlem, destek ve tez stresinden sonra gelen bir sevinç var. Not: sohbet sadece 21 mesajlık kısa bir kesit, yorumlar buna göre okunmalı.

## Kim nasıl yazıyor
- **Ece:** 11 mesajla biraz daha konuşkan, ortalama 6 kelime ve 13 emoji. Sohbeti açan da o; tek başlatma onda.
- **Damla:** 10 mesaj, ortalama 5,5 kelime, 7 emoji. Sohbeti başlatmamış ama her mesaja hızlı dönmüş. İki tarafın da ortanca cevap süresi 1 dk.

## İlişki dinamiği
- **Özlem şakayla geliyor:** Ece'nin "Kızım nerdesin ölü müsün 😤" ve "Hain seni, iki gündür ses yok" mesajları kızgınlıktan çok "seni özledim"e işaret ediyor.
- **Kendini ağır eleştiren Damla'ya şaka:** "Biliyorum ben bir pisliğim 😭" gibi abartılı özeleştiriye Ece "Aynen öylesin 😂" diyerek karşılık veriyor. Emojiler ve Damla'nın hemen "Hahahaha" demesi bunun oyun olduğunu gösteriyor.
- **Ece planı kurtarıyor:** Damla "danışmanım beni öldürür" derken Ece "Ben de seni öldürürüm, seç birini 🔪😂" diyor. Damla 1 dakika içinde "7'de Moda?" diye cevap veriyor. Ece'nin ısrarı işe yaramış görünüyor.
- **Karşılıklı minnet:** Damla "Sensiz ne yapardım bilmiyorum cidden" diyor. Bu, şaka havasının dışına çıkan nadir bir açık duygu ifadesi.
- **Sevinci paylaşıyorlar:** 13.10'da onay haberi geliyor ve Ece hemen "gurur duydum" diyor. Damla da başarıda arkadaşının payını anıyor.

## Ton ve satır araları
- **"Geç kalıyosun salak":** Büyük ihtimalle sevgiyle söylenmiş bir sitem. Damla'nın "5 dk 🏃‍♀️" cevabı rahat ve alışılmış bir ilişkiye işaret ediyor.
- **"Yazmazsan bozuşuruz 😤❤️":** Tehdit kılıklı bir sevgi gösterisi. Kırmızı kalp de bunu pekiştiriyor.
- **"Ücretimi bekliyorum, faiziyle 💸😂":** Yemek ısmarlama şakasının devamı. Önceki konuşmayı hatırlamış olması ilginin sürdüğünü gösteriyor.
- **"Bu kız benim 😍":** Plana evet denmesinin sevincini yansıtıyor.

## İlgi göstergesi
- **Ece: 9/10.** Sohbeti başlatıyor, ısrar ediyor, buluşmayı kurtarıyor ve sevinci büyük karşılıyor.
- **Damla: 9/10.** Hızlı cevaplıyor, "sensiz ne yapardım" diyebiliyor ve başarısını ilk Ece'yle paylaşıyor.

## Ne yazabilirsin
- "Tez bitti, söz verdiğim yemek borcu hâlâ geçerli. Cumartesi akşamı senin seçtiğin yer, kaçış yok 😄"
- "Teşekkür kısmına adını en başa yazıyorum, faiz de cabası 💸❤️"

## Paylaşılabilir kart
- 🔪😂 "Öldürürüm" diyen ama kahveyle barışan ikili
- ☕ Tez stresine en iyi ilaç: Moda'da bir kahve
- 💸 Ece'nin faizli yemek borcu başladı
