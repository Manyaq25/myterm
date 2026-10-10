// İndirme butonları. Google Play'de yayına girince PLAY_URL'yi doldur ve tools/site/build.sh'ı çalıştır:
// "Yakında" kutuları indirme butonuna dönüşür, Android'den gelenlerin "indir" linkleri Google Play'e gider.
(function () {
  var PLAY_URL = 'https://play.google.com/store/apps/details?id=com.manyaq25.benimyerimetakipet';
  var android = /android/i.test(navigator.userAgent);

  document.querySelectorAll('[data-play-btn]').forEach(function (play) {
    if (PLAY_URL) {
      play.href = PLAY_URL;
      play.target = '_blank';
      play.rel = 'noopener noreferrer';
      play.removeAttribute('aria-disabled');
      play.removeAttribute('title');
      play.classList.remove('cursor-not-allowed', 'select-none', 'text-on-surface-variant');
      play.classList.add('text-on-surface', 'hover:bg-surface-container-high');
      var label = play.querySelector('[data-play-label]');
      if (label && play.dataset.getLabel) label.textContent = play.dataset.getLabel;
    }
    // Android ziyaretçisi: Google Play kutusunu App Store'un önüne al
    if (android) play.parentNode.insertBefore(play, play.parentNode.firstChild);
  });

  if (!android) return;
  document.querySelectorAll('[data-store-link]').forEach(function (a) {
    if (PLAY_URL) { a.href = PLAY_URL; return; }
    a.href = a.dataset.androidHref || '#';
    a.removeAttribute('target');
    var label = a.querySelector('[data-store-label]');
    if (label && a.dataset.androidLabel) label.textContent = a.dataset.androidLabel;
  });
})();
