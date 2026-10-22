// Profil fotoğrafları: galeriden seçilir, uygulamanın belge klasörüne kopyalanır.
// Yalnız telefonda durur; sunucuya asla yüklenmez.
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import type { Profile } from './store';

const photoDir = () => new Directory(Paths.document, 'profil-foto');

export const photoFile = (name: string) => new File(photoDir(), name);
export const photoUri = (name: string) => photoFile(name).uri;

export function photoExists(name: string): boolean {
  try {
    return photoFile(name).exists;
  } catch {
    return false;
  }
}

/**
 * Galeriden kare kırpılmış bir fotoğraf seçtirir ve kopyalar.
 * Dosya adını döner; vazgeçilirse null, hata olursa fırlatır.
 */
export async function pickPhoto(prefix: 'ben' | 'es'): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  const asset = res.canceled ? null : res.assets?.[0];
  if (!asset) return null;
  const ext = /\.(jpe?g|png|webp|heic)$/i.exec(asset.uri)?.[1]?.toLowerCase() ?? 'jpg';
  const name = `${prefix}-${Date.now()}.${ext}`;
  const dir = photoDir();
  if (!dir.exists) dir.create({ idempotent: true });
  new File(asset.uri).copy(photoFile(name));
  return name;
}

/** Profilde artık kullanılmayan fotoğrafları siler (seçilip vazgeçilenler dahil). */
export function cleanupPhotos(p: Pick<Profile, 'avatar' | 'frame'>) {
  try {
    const dir = photoDir();
    if (!dir.exists) return;
    const keep = new Set([p.avatar?.kind === 'photo' ? p.avatar.file : null, p.frame?.partnerFile ?? null]);
    for (const item of dir.list()) if (item instanceof File && !keep.has(item.name)) item.delete();
  } catch {
    // silinemezse sonraki kayıtta denenir
  }
}
