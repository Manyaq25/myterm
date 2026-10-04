import { requireOptionalNativeModule } from 'expo';
import * as FileSystem from 'expo-file-system/legacy';
import type * as ImageManipulatorModule from 'expo-image-manipulator';

type Manipulator = typeof ImageManipulatorModule;

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

// Vercel ~4.5MB'ın üzerindeki istek gövdelerini reddediyor; payı bırakıyoruz.
export const MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_LONG_EDGE = 2400;

let cachedManipulator: Manipulator | null | undefined;

// expo-image-manipulator yerel bir modül ve 1.0.1 build'iyle geliyor. Bu JS
// anlık güncellemeyle (EAS Update) modülün olmadığı eski build'lere de
// ulaştığı için önce yerel modülün varlığını kontrol ediyoruz; yoksa görsel
// olduğu gibi gönderilir (backend yine JPEG'e çeviriyor).
//
// Kontrol şart: Metro, olay işleyicisinden geç yüklenen bir modülün açılışta
// fırlattığı hatayı çağırana iletmiyor, ErrorUtils.reportFatalError ile
// ölümcül hata sayıyor — try/catch onu yakalayamıyor ve yayın build'inde
// uygulama kapanıyor.
function loadManipulator(): Manipulator | null {
  if (cachedManipulator !== undefined) return cachedManipulator;
  if (!requireOptionalNativeModule('ExpoImageManipulator')) {
    cachedManipulator = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedManipulator = require('expo-image-manipulator') as Manipulator;
  } catch {
    cachedManipulator = null;
  }
  return cachedManipulator;
}

/**
 * Görseli yüklemeye hazırlar: mümkünse uzun kenarı küçültüp JPEG'e çevirir.
 * Fotoğraflı duvar kağıdına sahip PNG ekran görüntüleri sıkıştırılmadan
 * birkaç MB olabiliyor ve yükleme sınırını aşıyordu.
 */
export async function prepareImageForUpload(image: PickedImage): Promise<string> {
  const manipulator = loadManipulator();
  if (!manipulator) return image.uri;
  try {
    let context = manipulator.ImageManipulator.manipulate(image.uri);
    if (Math.max(image.width, image.height) > MAX_LONG_EDGE) {
      context =
        image.width >= image.height
          ? context.resize({ width: MAX_LONG_EDGE })
          : context.resize({ height: MAX_LONG_EDGE });
    }
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ compress: 0.85, format: manipulator.SaveFormat.JPEG });
    return saved.uri;
  } catch {
    return image.uri;
  }
}

export async function getFileSize(uri: string): Promise<number | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? info.size : null;
  } catch {
    return null;
  }
}
