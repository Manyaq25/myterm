# Kazanç Bildirim Botu

Bir veya birden fazla (yasal) sitenin "son kazananlar" akışını izleyip,
belirlediğin tutarın üzerindeki kazançları Telegram'a anlık mesaj olarak
düşüren basit bir izleyici.

## Nasıl çalışır

```
[Site verisi] --(periyodik kontrol)--> [main.py] --(eşik + tekrar filtresi)--> [Telegram Bot API]
```

Her site kendi "adapter"ına sahiptir (`adapters/` klasörü), çünkü her sitenin
veriyi sunma şekli farklıdır (JSON API, HTML, vs.). Yeni bir site eklemek
istediğinde mevcut adapter'lardan birini kopyalayıp o siteye göre düzenlersin.

## Kurulum

1. Bağımlılıkları kur:
   ```
   pip install -r requirements.txt
   ```

2. Telegram bot oluştur:
   - Telegram'da **@BotFather**'a git, `/newbot` yaz, adını belirle.
   - Sana bir **token** verecek, bunu not al.
   - Botunla sohbeti başlatmak için Telegram'da botunu bul ve `/start` yaz.
   - `chat_id`'ni öğrenmek için tarayıcıda şu adrese git (token'ı kendi
     token'ınla değiştir): `https://api.telegram.org/bot<TOKEN>/getUpdates`
     ve dönen JSON içindeki `"chat":{"id": ...}` değerine bak.

3. `.env.example` dosyasını `.env` olarak kopyala ve token/chat_id'ni gir.

4. `config.example.yaml` dosyasını `config.yaml` olarak kopyala, izlemek
   istediğin site(ler)i, eşik tutarlarını ve kontrol sıklığını gir.

5. **Veri kaynağını bul** (en kritik adım): Tarayıcıda hedef sayfayı aç,
   F12 (Geliştirici Araçları) > **Network** sekmesine geç, "kazananlar"
   bölümü yenilendiğinde hangi isteğin gittiğine bak:
   - **Fetch/XHR** sekmesinde bir JSON isteği görüyorsan → `adapters/example_api.py`
     dosyasını kopyalayıp o endpoint'in alan adlarına göre düzenle.
   - **WS** (WebSocket) sekmesinde bağlantı görüyorsan → websocket tabanlı
     bir adapter yazman gerekir (bu şablon henüz eklenmedi, ihtiyaç olursa
     ekleyebiliriz).
   - Hiçbiri yoksa veri sadece HTML içinde → `adapters/example_html.py`
     dosyasını kopyalayıp CSS seçicilerini sitenin gerçek yapısına göre
     düzenle.

6. `config.yaml` içindeki `adapter:` alanını yeni adapter dosyanın adıyla
   eşleştir (örn. `adapters/site_a.py` yazdıysan `adapter: site_a`).

7. Çalıştır:
   ```
   python main.py
   ```

## Notlar

- `seen_wins.json`, aynı kazancı tekrar tekrar bildirmemek için görülen
  kayıtları tutar.
- Script'in aralıksız çalışması için (7/24 bildirim alman için) bir VPS'te
  `systemd` servisi ya da `screen`/`tmux` içinde arka planda çalıştırman
  gerekir; sadece bilgisayarını açık tutman da yeterlidir.
