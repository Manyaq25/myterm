# Backend — AI extraction

Vercel serverless function'ları: `POST /api/extract` (metin) ve
`POST /api/transcribe` (sesli not).

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

## Ortam değişkenleri

`.env.example` dosyasına bak. `ANTHROPIC_API_KEY` zorunlu. `OPENAI_API_KEY`
yalnızca `/api/transcribe` için gerekli.

## Yerel test

```
npm install
npx vercel dev
```
