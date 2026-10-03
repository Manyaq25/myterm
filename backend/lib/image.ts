import sharp from 'sharp';

// Claude yüksek çözünürlüklü modellerde uzun kenarı 2576 px'e kadar işliyor;
// sohbet ekran görüntülerindeki küçük yazılar okunaklı kalsın diye buna yakın
// tutup boyutu ve gecikmeyi düşürmek için JPEG'e çeviriyoruz.
const MAX_LONG_EDGE = 2400;
const JPEG_QUALITY = 85;

export class UnsupportedImageError extends Error {}

type DetectedFormat = 'jpeg' | 'png' | 'gif' | 'webp' | 'heic' | 'avif' | 'tiff' | 'unknown';

/** İstemcinin bildirdiği türe güvenmeden, dosyanın ilk baytlarından biçimi belirler. */
export function detectImageFormat(buf: Buffer): DetectedFormat {
  if (buf.length < 12) return 'unknown';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.subarray(0, 4).toString('ascii') === 'GIF8') return 'gif';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if ((buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2a) || (buf[0] === 0x4d && buf[1] === 0x4d && buf[3] === 0x2a)) {
    return 'tiff';
  }
  if (buf.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = buf.subarray(8, 12).toString('ascii');
    if (brand === 'avif' || brand === 'avis') return 'avif';
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1', 'heif'].includes(brand)) return 'heic';
  }
  return 'unknown';
}

/**
 * Gelen görseli (JPEG, PNG, GIF, WebP, HEIC, AVIF, TIFF) EXIF yönüne göre
 * döndürüp küçülterek JPEG'e çevirir. iPhone fotoğrafları HEIC geldiği ve
 * fotoğraflı duvar kağıdına sahip ekran görüntüleri çok büyük PNG'ler
 * olduğu için analiz bu noktada başarısız oluyordu.
 */
export async function normalizeImage(buf: Buffer): Promise<{ base64: string; mediaType: 'image/jpeg' }> {
  const format = detectImageFormat(buf);
  if (format === 'unknown') throw new UnsupportedImageError('unknown_format');

  let pipeline: ReturnType<typeof sharp>;
  try {
    if (format === 'heic') {
      // HEIC çözücü büyük bir WASM paketi; diğer isteklerin soğuk başlangıcını
      // yavaşlatmasın diye yalnızca gerektiğinde yükleniyor.
      const { default: heicDecode } = await import('heic-decode');
      const { width, height, data } = await heicDecode({ buffer: buf });
      pipeline = sharp(Buffer.from(data.buffer, data.byteOffset, data.byteLength), {
        raw: { width, height, channels: 4 },
      });
    } else {
      pipeline = sharp(buf, { animated: false }).rotate();
    }
    const out = await pipeline
      .resize({ width: MAX_LONG_EDGE, height: MAX_LONG_EDGE, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
    return { base64: out.toString('base64'), mediaType: 'image/jpeg' };
  } catch (error) {
    throw new UnsupportedImageError((error as Error).message);
  }
}
