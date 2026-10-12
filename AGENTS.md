# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Derleme ve gönderim kuralı (kullanıcı kararı, 12 Ekim 2026)

- Derleme (`eas build`) ve test kanallarına gönderim (`eas submit`: TestFlight, Google Play dahili test) kullanıcıya sormadan yapılır; bitince kullanıcıya "test için hazır" denir.
- Mağazada canlıya alma (App Store "İncelemeye gönder", Google Play üretim) her zaman kullanıcıda kalır.
- Expo ücretsiz planının aylık derleme kotası gözetilir; gereksiz derleme yapılmaz, kotaya yaklaşınca kullanıcıya söylenir.
- Expo erişimi Claude ortamında network secret olarak tanımlı (`*.expo.dev`, Authorization: Bearer); anahtar sohbete yazılmaz.
