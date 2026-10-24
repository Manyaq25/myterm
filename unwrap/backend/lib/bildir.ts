// İçerik bildirimi (Google Play yapay zekâ içeriği politikası): kullanıcı
// saldırgan/yanlış yapay zekâ çıktısını işaretler. Yalnız yapay zekâ metni gelir.
import { z } from 'zod';

import { maskPersonalData } from './mask';
import { k, redis } from './redis';
import { LangSchema } from './report';

export const BILDIRIM_MAX = 2000;

export const BildirSchema = z.object({
  kind: z.enum(['mila', 'rapor']),
  reason: z.enum(['saldirgan', 'cinsel', 'zararli', 'yanlis', 'diger']),
  text: z.string().trim().min(1).max(2000),
  note: z.string().max(300).optional(),
  lang: LangSchema,
});
export type Bildir = z.infer<typeof BildirSchema>;

/** Kişisel veriyi maskeleyip listeye ekler; en yeni 2000 kayıt tutulur. */
export async function saveBildirim(b: Bildir) {
  const entry = {
    at: new Date().toISOString(),
    kind: b.kind,
    reason: b.reason,
    text: maskPersonalData(b.text),
    note: b.note ? maskPersonalData(b.note) : '',
    lang: b.lang,
  };
  const key = k('bildirim');
  await redis().pipeline().lpush(key, JSON.stringify(entry)).ltrim(key, 0, BILDIRIM_MAX - 1).exec();
}
