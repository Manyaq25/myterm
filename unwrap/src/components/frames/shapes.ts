// Çerçeve şekilleri için küçük yol (path) yardımcıları. Hepsi 200×200 alanda.

/** Mutlak M/L/C/Q/Z komutlu yolu kaydırıp büyütür (100×100 taban şekiller için). */
export function scalePath(d: string, x: number, y: number, k: number): string {
  let i = 0;
  return d.replace(/-?\d*\.?\d+/g, (n) => {
    const v = Number(n) * k + (i++ % 2 === 0 ? x : y);
    return String(Math.round(v * 10) / 10);
  });
}

// 100×100 tabanlı kalp (alt ucu 50,88)
const HEART = 'M50 88 C20 66 4 48 10 30 C15 14 38 10 50 28 C62 10 85 14 90 30 C96 48 80 66 50 88 Z';
/** Ortası (cx, cy), genişliği s olan kalp. */
export const heartPath = (cx: number, cy: number, s: number) => scalePath(HEART, cx - s / 2, cy - s / 2, s / 100);

/** Beş köşeli yıldız. */
export function starPath(cx: number, cy: number, R: number, r: number): string {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    return `${(cx + Math.cos(a) * rad).toFixed(1)} ${(cy + Math.sin(a) * rad).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
}

/** Döndürülmüş dikdörtgen (köşeler düz). */
export function rotRect(cx: number, cy: number, w: number, h: number, deg: number): string {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a), s = Math.sin(a);
  const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(
    ([x, y]) => `${(cx + x * c - y * s).toFixed(1)} ${(cy + x * s + y * c).toFixed(1)}`,
  );
  return `M${pts.join(' L')} Z`;
}

/** Döndürülmüş noktanın yeni yeri (polaroid altındaki süs için). */
export function rotPoint(cx: number, cy: number, dx: number, dy: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
}

/** Çember üstünde eşit aralıklı noktalar (çelenk süsleri için). */
export function ring(cx: number, cy: number, r: number, n: number, start = 0): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = start + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
}
