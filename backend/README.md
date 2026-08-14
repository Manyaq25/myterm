# Backend — AI extraction

Tek endpoint'lik Vercel serverless function: `POST /api/extract`.

Anthropic API anahtarı yalnızca burada, sunucu tarafında tutulur — mobil
uygulamaya asla gömülmez.

## İstek

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

## Ortam değişkenleri

`.env.example` dosyasına bak. `ANTHROPIC_API_KEY` zorunlu.

## Yerel test

```
npm install
npx vercel dev
```
