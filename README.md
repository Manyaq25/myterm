# Benim Yerime Takip Et

Verilen sözleri, beklenen işleri ve takip edilmesi gereken şeyleri otomatik
çıkaran ve zamanı geldiğinde hatırlatan bir mobil uygulama.

Expo (managed workflow) + React Native + TypeScript ile geliştiriliyor.

## Geliştirme

```
npm install
npm run start:tunnel
```

Telefonda **Expo Go** uygulamasıyla çıkan QR kodu tara.

## Test build'i (Expo Go üzerinden, kurulum gerektirmez)

GitHub reposunda Actions sekmesinden **EAS Update (Expo Go test link)**
workflow'unu elle çalıştır (`workflow_dispatch`). Çalışma bitince loglarda
Expo Go'da açılabilecek bir önizleme linki/QR kod verir.

## Bağımsız (standalone) build

**EAS Build (standalone install link)** workflow'u ile Android için doğrudan
kurulabilir bir `.apk` üretilebilir. iOS için fiziksel cihaza kurulum, Apple
Developer Program üyeliği gerektirir.
