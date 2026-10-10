// Yenilikler sayfası: /synvia/yenilikler/ (TR) ve /en/synvia/whats-new/ (EN).
// Şablon: changelog.template.html — üretmek için: tools/site/build.sh
// Üst menü ve alt bilgi metinleri Synvia sayfasından gelir (synvia.i18n.js).
// Kural: her madde uygulamayı hiç bilmeyen biri için, "bu ne, bana ne faydası var" diye yazılır.
// Yeni sürüm eklerken listenin en başına ekle ve önceki sürümdeki latest: true'yu kaldır.
const synvia = require('./synvia.i18n.js');

const SHARED = [
  'homePath', 'navBase', 'backHome', 'navHow', 'navFeatures', 'navFaq', 'navNews', 'navDownload', 'changelogPath',
  'supportHref', 'privacyHref', 'deleteHref', 'footerSupport', 'footerPrivacy', 'footerDelete', 'footerRights',
  'appStore', 'playSoon', 'playGet', 'androidSoon',
];
const pick = (t) => Object.fromEntries(SHARED.map((k) => [k, t[k]]));

module.exports = {
  tr: {
    ...pick(synvia.tr),
    navBase: '/synvia/',
    lang: 'tr',
    locale: 'tr_TR',
    path: '/synvia/yenilikler/',
    altLang: 'en',
    altPath: '/en/synvia/whats-new/',
    altLabel: 'English',
    ogImage: 'og.png',
    title: 'Synvia AI — Yenilikler',
    description: 'Synvia AI’a gelen yeni özellikler ve iyileştirmeler, sürüm sürüm.',
    ogTitle: 'Synvia AI — Yenilikler',
    ogDescription: 'Synvia AI’a gelen yeni özellikler: bildirimden hallet, karşı tarafa hatırlat, tekrar eden işler ve daha fazlası.',
    kicker: 'Yenilikler',
    pageHeading: 'Synvia AI’da neler yeni?',
    intro: 'Uygulamaya gelen yeni özellikler burada. Hepsini kullanmak için Synvia AI’ı App Store’dan ya da Google Play’den güncel tut.',
    latestBadge: 'En yeni',
    versionLabel: 'Sürüm',
    ctaTitle: 'Henüz denemedin mi?',
    ctaText: 'Ücretsiz indir, ilk işini bir dakikada ekle.',
    entries: [
      {
        version: '1.1',
        date: 'Ekim 2026',
        title: 'Hatırlatmaları uygulamayı açmadan hallet',
        latest: true,
        items: [
          ['🔔', 'Bildirimden hallet', 'Hatırlatma geldiğinde uygulamayı açmadan “Tamamlandı”, “1 saat ertele” ya da “Yarın” seçebilirsin.'],
          ['💬', 'Karşı tarafa hatırlat', 'Biri sana verdiği sözü unuttuysa yapay zekâ ona kibar bir hatırlatma mesajı yazar (samimi, resmi ya da kısa). Sen de WhatsApp veya SMS ile gönderirsin.'],
          ['📇', 'Rehberden seç', 'Kişinin telefon numarasını yazmak yerine telefon rehberinden seçebilirsin. Uygulama sadece seçtiğin kişiyi görür.'],
          ['🔁', 'Tekrar eden işler', 'Kira her ay, ilaç her gün… Bir kez kur; işi bitirdiğinde bir sonrakini uygulama kendisi oluşturur.'],
          ['🎁', 'Arkadaşını davet et', 'Davet kodunla uygulamaya katılan her arkadaşın için 3 ek yapay zekâ hakkı kazanırsın.'],
          ['🌍', 'Yapay zekâ senin dilinde', 'Uygulamayı hangi dilde kullanıyorsan yapay zekâ da sana o dilde cevap verir; sesli notlarında da dilini kendisi tanır.'],
          ['🤖', 'Asistan tam ekran', 'Yapay zekâ asistanı artık tam ekran açılıyor; cevaplar daha rahat okunuyor.'],
        ],
      },
      {
        version: '1.0.2',
        date: 'Ekim 2026',
        title: 'Saatler senin kontrolünde',
        items: [
          ['⏰', 'Hatırlatma saatini değiştir', 'Bir işi kaydettikten sonra da hatırlatma saatini istediğin zaman değiştirebilirsin.'],
          ['🕒', 'Saatler yazıldığı gibi', 'Yapay zekânın bulduğu saatler mesajda yazıldığı gibi korunur; beğenmezsen kaydetmeden önce düzeltebilirsin.'],
          ['📷', 'Daha iyi görsel okuma', 'Büyük ekran görüntüleri ve iPhone fotoğrafları (HEIC) artık sorunsuz okunuyor.'],
          ['🗣️', '12 dil', 'Uygulama Türkçe, İngilizce, Almanca, İspanyolca, Fransızca, İtalyanca, Portekizce, Rusça, Arapça, Japonca, Korece ve Çince kullanılabiliyor.'],
          ['🛠️', 'Daha sağlam', 'Çeşitli hatalar giderildi; uygulama daha hızlı ve kararlı.'],
        ],
      },
      {
        version: '1.0',
        date: 'Eylül 2026',
        title: 'Synvia AI App Store’da!',
        items: [
          ['✍️', 'Her yoldan ekle', 'İşlerini ve sözlerini yazarak, konuşarak, bir ekran görüntüsünden ya da PDF’ten ekle; içindekileri yapay zekâ bulsun.'],
          ['🗂️', 'Üç liste', 'Verdiğin sözler, başkalarından beklediklerin ve yapacağın işler ayrı ayrı görünür.'],
          ['🔔', 'Zamanında hatırlatma', 'Saati gelen ve geciken işler için bildirim alırsın.'],
          ['👥', 'Kişi sayfaları', 'Her kişiyle ilgili sözler ve işler tek sayfada; oradan tek dokunuşla arayabilir ya da mesaj atabilirsin.'],
          ['📸', 'Ekran görüntüsü önerisi', 'Ekran görüntüsü aldığında, içindeki işleri eklemek isteyip istemediğini soran bir bildirim gelir.'],
          ['🤖', 'Yapay zekâ asistanı', '“Bugün ne yapmam lazım?” gibi sorular sor, listene bakıp cevap versin.'],
        ],
      },
    ],
  },
  en: {
    ...pick(synvia.en),
    navBase: '/en/synvia/',
    lang: 'en',
    locale: 'en_US',
    path: '/en/synvia/whats-new/',
    altLang: 'tr',
    altPath: '/synvia/yenilikler/',
    altLabel: 'Türkçe',
    ogImage: 'og-en.png',
    title: 'Synvia AI — What’s new',
    description: 'New features and improvements in Synvia AI, version by version.',
    ogTitle: 'Synvia AI — What’s new',
    ogDescription: 'New in Synvia AI: act from notifications, nudge the other person, repeating tasks and more.',
    kicker: 'What’s new',
    pageHeading: 'What’s new in Synvia AI?',
    intro: 'Here’s everything new in the app. Keep Synvia AI updated from the App Store or Google Play to get it all.',
    latestBadge: 'Latest',
    versionLabel: 'Version',
    ctaTitle: 'Haven’t tried it yet?',
    ctaText: 'Download free and add your first task in a minute.',
    entries: [
      {
        version: '1.1',
        date: 'October 2026',
        title: 'Handle reminders without opening the app',
        latest: true,
        items: [
          ['🔔', 'Act from the notification', 'When a reminder arrives, choose “Done”, “Snooze 1 hour” or “Tomorrow” without opening the app.'],
          ['💬', 'Nudge the other person', 'If someone forgot what they promised you, AI writes a polite reminder (friendly, formal or short). You send it via WhatsApp or SMS.'],
          ['📇', 'Pick from contacts', 'Instead of typing a phone number, pick the person from your contacts. The app only sees the contact you choose.'],
          ['🔁', 'Repeating tasks', 'Rent every month, medicine every day… Set it once; when you finish one, the app creates the next.'],
          ['🎁', 'Invite a friend', 'Earn 3 extra AI uses for every friend who joins with your invite code.'],
          ['🌍', 'AI speaks your language', 'AI now answers in the language you use the app in, and recognizes the language of your voice notes on its own.'],
          ['🤖', 'Full-screen assistant', 'The AI assistant now opens full screen, so answers are easier to read.'],
        ],
      },
      {
        version: '1.0.2',
        date: 'October 2026',
        title: 'Times under your control',
        items: [
          ['⏰', 'Change the reminder time', 'You can change a task’s reminder time anytime, even after saving it.'],
          ['🕒', 'Times as written', 'Times found by AI are kept exactly as written in the message, and you can fix them before saving.'],
          ['📷', 'Better image reading', 'Large screenshots and iPhone photos (HEIC) are now read without problems.'],
          ['🗣️', '12 languages', 'The app is available in English, Turkish, German, Spanish, French, Italian, Portuguese, Russian, Arabic, Japanese, Korean and Chinese.'],
          ['🛠️', 'More reliable', 'Various bugs fixed; the app is faster and more stable.'],
        ],
      },
      {
        version: '1.0',
        date: 'September 2026',
        title: 'Synvia AI is on the App Store!',
        items: [
          ['✍️', 'Add it any way', 'Add your tasks and promises by typing, talking, or from a screenshot or a PDF; AI finds what’s inside.'],
          ['🗂️', 'Three lists', 'Promises you made, things you’re waiting for and tasks you need to do, each in its own list.'],
          ['🔔', 'On-time reminders', 'Get notified about tasks that are due or overdue.'],
          ['👥', 'Person pages', 'Everything about each person on one page; call or message them in one tap.'],
          ['📸', 'Screenshot suggestion', 'When you take a screenshot, a notification asks if you want to add the tasks in it.'],
          ['🤖', 'AI assistant', 'Ask things like “What do I need to do today?” and it answers from your list.'],
        ],
      },
    ],
  },
};
