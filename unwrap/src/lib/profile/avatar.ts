// Avatar ve çerçeve biçimi (saf işlevler; testte de çalışır).
// Fotoğraflar yalnız telefonda durur, sunucuya asla gitmez.

export type Avatar =
  | { kind: 'emoji'; emoji: string; color: string }
  | { kind: 'preset'; id: string; color: string }
  | { kind: 'photo'; file: string; color: string };

/** Çift/bestie çerçevesi: yalnız telefonda (sunucuya gitmez). */
export type Frame = { id: string; partnerFile: string | null };

/** Hitap: rozet unvanlarında ("Kralı/Kraliçesi") kullanılır. */
export type Gender = 'kadin' | 'erkek' | 'notr';
export const GENDERS: Gender[] = ['kadin', 'erkek', 'notr'];

/** Sunucunun kabul ettiği biçim (fotoğraf yok). */
export type ServerAvatar = { kind: 'emoji'; emoji: string; color: string } | { kind: 'preset'; id: string; color: string };

const HEX = /^#[0-9A-Fa-f]{6}$/;
// Sunucu sınırları: emoji ≤8, hazır avatar kimliği ≤16 UTF-16 birimi.
const LIMIT = { emoji: 8, id: 16 };
const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
// Dosya adı yalnız bizim verdiğimiz biçimde olabilir (klasör dışına çıkamaz).
const SAFE_FILE = /^[\w.-]{1,80}$/;

/**
 * Kayıtlı ya da sunucudan gelen avatarı okur. Eski {emoji, color} biçimi
 * 'emoji' türüne çevrilir; tanınmayan biçimde null döner.
 */
export function parseAvatar(a: unknown, allowPhoto = true): Avatar | null {
  if (!a || typeof a !== 'object') return null;
  const o = a as Record<string, unknown>;
  const color = str(o.color) ? o.color : '#E9E1FF';
  const kind = o.kind ?? (str(o.emoji) ? 'emoji' : null);
  if (kind === 'emoji' && str(o.emoji) && o.emoji.length <= LIMIT.emoji) return { kind, emoji: o.emoji, color };
  if (kind === 'preset' && str(o.id) && o.id.length <= LIMIT.id) return { kind, id: o.id, color };
  if (kind === 'photo' && allowPhoto && str(o.file) && SAFE_FILE.test(o.file)) return { kind, file: o.file, color };
  return null;
}

export function parseFrame(f: unknown): Frame | null {
  if (!f || typeof f !== 'object') return null;
  const o = f as Record<string, unknown>;
  if (!str(o.id)) return null;
  return { id: o.id, partnerFile: str(o.partnerFile) && SAFE_FILE.test(o.partnerFile) ? o.partnerFile : null };
}

export const parseGender = (g: unknown): Gender => (GENDERS.includes(g as Gender) ? (g as Gender) : 'notr');

/** Sunucuya giden avatar: fotoğraf hiç gönderilmez (null), renk #RRGGBB olmalı. */
export function avatarForServer(a: Avatar | null): ServerAvatar | null {
  if (!a || a.kind === 'photo' || !HEX.test(a.color)) return null;
  if (a.kind === 'emoji') return a.emoji.length <= LIMIT.emoji ? { kind: 'emoji', emoji: a.emoji, color: a.color } : null;
  return a.id.length <= LIMIT.id ? { kind: 'preset', id: a.id, color: a.color } : null;
}
