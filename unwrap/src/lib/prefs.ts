// Küçük tercih bayrakları (karşılama görüldü mü vb.).
// Uygulama klasöründe dosya olarak tutulur: iPhone'un anahtar zinciri uygulama
// silinince de kaldığı için, yeniden yüklemede karşılama yine gösterilsin diye.
import { File, Paths } from 'expo-file-system';

const onboardedFile = () => new File(Paths.document, '.karsilama-goruldu');

export const hasOnboarded = () => onboardedFile().exists;
export function setOnboarded() {
  const f = onboardedFile();
  if (!f.exists) f.create();
}
