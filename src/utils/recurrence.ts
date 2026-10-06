import type { Recurrence } from '../types';

function addPeriod(date: Date, recurrence: Recurrence, anchorDay: number): Date {
  const next = new Date(date);
  if (recurrence === 'daily') {
    next.setDate(next.getDate() + 1);
  } else if (recurrence === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else {
    // Ayın 31'i gibi günler kısa aylarda o ayın son gününe düşer, sonra yine 31'e döner.
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(anchorDay, daysInMonth));
  }
  return next;
}

/**
 * Tekrarlayan bir takibin bir sonraki tarihi: en az bir dönem ileri alınır;
 * geç tamamlandıysa kaçırılan tarihler atlanıp gelecekteki ilk tarih seçilir.
 * Saat aynı kalır.
 */
export function nextOccurrence(dueAt: number, recurrence: Recurrence, now = Date.now()): number {
  const anchorDay = new Date(dueAt).getDate();
  let next = addPeriod(new Date(dueAt), recurrence, anchorDay);
  // Güvenlik sınırı: çok eski bir tarihte bile döngü uzamasın.
  for (let i = 0; next.getTime() <= now && i < 1000; i++) {
    next = addPeriod(next, recurrence, anchorDay);
  }
  return next.getTime();
}
