# Backend — AI extraction

Vercel serverless function'ları: `POST /api/extract` (metin),
`POST /api/transcribe` (sesli not), `POST /api/extract-image` (görsel/ekran
görüntüsü) ve `POST /api/assistant` (mevcut takip verisi üzerinde doğal
dille soru-cevap, salt okunur).

API anahtarları yalnızca burada, sunucu tarafında tutulur — mobil
uygulamaya asla gömülmez.

## POST /api/extract

```
POST /api/extract
Content-Type: application/json
X-App-Secret: <APP_SHARED_SECRET ayarlıysa>

{ "text": "Ahmete yarın teklifi göndereceğim, ayrıca ondan geçen haftaki raporu bekliyorum." }
```

## Yanıt

```json
{
  "candidates": [
    {
      "title": "Ahmete teklifi gönder",
      "type": "promise_made",
      "personName": "Ahmet",
      "dueAtISO": "2026-08-15T09:00:00.000Z",
      "confidence": 0.9,
      "note": null
    },
    {
      "title": "Ahmetten geçen haftaki raporu al",
      "type": "waiting_on",
      "personName": "Ahmet",
      "dueAtISO": null,
      "confidence": 0.75,
      "note": null
    }
  ]
}
```

## POST /api/transcribe

Ses dosyasını (m4a) OpenAI Whisper ile Türkçe metne çevirir, ardından aynı
extraction pipeline'ını çalıştırır.

```
POST /api/transcribe
Content-Type: audio/m4a
X-App-Secret: <APP_SHARED_SECRET ayarlıysa>

<ham ses baytları>
```

Yanıt: `{ "transcript": "...", "candidates": [...] }` (candidates şeması
`/api/extract` ile aynı).

## POST /api/extract-image

Bir görseli (ekran görüntüsü, fotoğraf) Claude'un vision özelliğiyle
doğrudan analiz eder — OCR yok, ayrı bir model/anahtar gerekmez, aynı
`ANTHROPIC_API_KEY` kullanılır.

```
POST /api/extract-image
Content-Type: application/json
X-App-Secret: <APP_SHARED_SECRET ayarlıysa>

{ "imageBase64": "<base64>", "mediaType": "image/jpeg" }
```

`mediaType`: `image/jpeg` | `image/png` | `image/webp` | `image/gif`.
Base64 payload en fazla ~7MB (yaklaşık 5MB ham görsel).

Yanıt: `{ "candidates": [...] }` (şema `/api/extract` ile aynı).

## POST /api/assistant

Kullanıcının var olan takip verisi üzerinde doğal dille soru sorup özet/analiz
almasını sağlar. Yeni veri kaydetmez — salt okunur bir sorgu. Client, güncel
takip listesini düz metin olarak `context` alanında gönderir.

```
POST /api/assistant
Content-Type: application/json
X-App-Secret: <APP_SHARED_SECRET ayarlıysa>

{ "question": "Bugün ne yapacağım?", "context": "- [Yapılacak iş] Faturayı öde | ..." }
```

`question` en fazla 500, `context` en fazla ~20000 karakter.

Yanıt: `{ "answer": "..." }`.

## Ortam değişkenleri

`.env.example` dosyasına bak. `ANTHROPIC_API_KEY` zorunlu. `OPENAI_API_KEY`
yalnızca `/api/transcribe` için gerekli. `APP_SHARED_SECRET`'i üretimde
mutlaka ayarla — bkz. `.env.example`'daki uyarı.

## Kötüye kullanım koruması

Her uç nokta, IP başına dakikada ~20 isteği aşan istemcileri `429` ile
reddeden basit, bellek-içi bir hız sınırlayıcı kullanıyor (`lib/rateLimit.ts`).
Bu best-effort bir koruma: serverless fonksiyon birden fazla instance'a
ölçeklenirse her biri kendi sayacına sahip olur ve cold start'ta sıfırlanır.
Kalıcı/dağıtık bir sınırlama gerekiyorsa (ör. Upstash Redis ile) bu dosya
değiştirilerek eklenebilir.

## Yerel test

```
npm install
npx vercel dev
```
