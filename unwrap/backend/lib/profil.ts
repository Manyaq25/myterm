// Eşitlenen küçük profil: yalnız ad, avatar ve elle düzeltmeler.
// Sohbetler buraya ASLA gelmez (gizlilik sözü).
import { z } from 'zod';

import { k } from './redis';

export const PROFILE_MAX_BYTES = 8 * 1024;
const MAX_OVERRIDES = 30;

export const ProfileSchema = z.object({
  name: z.string().max(40).nullable(),
  avatar: z
    .object({
      emoji: z.string().max(8),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    })
    .nullable(),
  overrides: z
    .record(z.string().max(80), z.string().max(80))
    .refine((o) => Object.keys(o).length <= MAX_OVERRIDES, 'too_many_overrides'),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const profileKey = (uid: string) => k('profil', uid);
