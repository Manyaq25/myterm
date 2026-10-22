// Eşitlenen küçük profil: yalnız ad, avatar ve elle düzeltmeler.
// Sohbetler buraya ASLA gelmez (gizlilik sözü).
import { z } from 'zod';

import { k } from './redis';

export const PROFILE_MAX_BYTES = 8 * 1024;
const MAX_OVERRIDES = 30;
const Color = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const ProfileSchema = z.object({
  name: z.string().max(40).nullable(),
  // Emoji ya da hazır karakter; fotoğraflar telefonda kalır, buraya gelmez.
  // "kind" olmayan eski biçim (yalnız emoji) eski sürümler için kabul edilir.
  avatar: z
    .union([
      z.object({ kind: z.literal('emoji').optional(), emoji: z.string().max(8), color: Color }),
      z.object({ kind: z.literal('preset'), id: z.string().regex(/^[a-z0-9_-]{1,16}$/), color: Color }),
    ])
    .nullable(),
  overrides: z
    .record(z.string().max(80), z.string().max(80))
    .refine((o) => Object.keys(o).length <= MAX_OVERRIDES, 'too_many_overrides'),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const profileKey = (uid: string) => k('profil', uid);
