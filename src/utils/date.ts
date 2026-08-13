export function formatDueDate(timestamp: number | null): string {
  if (timestamp === null) return 'Tarih yok';
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Bugün, ${time}`;
  if (isTomorrow) return `Yarın, ${time}`;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${time}`;
}

export function isOverdue(timestamp: number | null): boolean {
  if (timestamp === null) return false;
  return timestamp < Date.now();
}
