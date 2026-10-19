// Dışarıdan gelen bağlantılar. WhatsApp'ta "Sohbeti Dışa Aktar" → Unwrap seçilince
// iOS dosyayı file:// adresiyle açar; onu içe aktarma ekranına yönlendiririz.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (/^(file|content):\/\//i.test(path)) return `/aktar?uri=${encodeURIComponent(path)}`;
  } catch {
    // yönlendirme hatası uygulamayı çökertmesin
  }
  return path;
}
