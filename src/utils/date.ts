import i18n from '../i18n';

export function formatDueDate(timestamp: number | null): string {
  if (timestamp === null) return i18n.t('dueDate.none');
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const locale = i18n.language || 'tr';
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (isToday) return i18n.t('dueDate.today', { time });
  if (isTomorrow) return i18n.t('dueDate.tomorrow', { time });
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${time}`;
}

export function isOverdue(timestamp: number | null): boolean {
  if (timestamp === null) return false;
  return timestamp < Date.now();
}

/** Bir kişi için "daha erken hatırlat" tercihi varsa hatırlatma zamanını öne çeker. */
export function applyReminderLead(dueAt: number, leadMinutes: number): number {
  if (!leadMinutes) return dueAt;
  return dueAt - leadMinutes * 60 * 1000;
}

/** Son tarihten bu yana kaç tam gün geçtiğini döner (gecikmemişse null). */
export function daysLate(dueAt: number | null): number | null {
  if (dueAt === null || dueAt >= Date.now()) return null;
  return Math.floor((Date.now() - dueAt) / (1000 * 60 * 60 * 24));
}
