// Haftalık meydan okuma: her hafta bir konu (#UnwrapChallenge). Konu yılın
// haftasından seçilir, herkes aynı hafta aynı konuyu görür; sunucu gerekmez.
export const CHALLENGES = [
  'kiskanc', 'romantik', 'ozur', 'gecCevap', 'emoji', 'komik',
  'gece', 'ilkMesaj', 'ozlem', 'trip', 'tatli', 'iltifat',
] as const;
export type Challenge = (typeof CHALLENGES)[number];

/** ISO hafta numarası (Pazartesi başlar). */
export function isoWeek(d = new Date()): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export const challengeOfWeek = (d = new Date()): Challenge => CHALLENGES[isoWeek(d) % CHALLENGES.length];
