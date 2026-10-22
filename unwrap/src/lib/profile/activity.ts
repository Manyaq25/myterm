// Uygulamanın açıldığı günler ve etkinlik sayaçları (rozetler için).
// Yalnız bu telefonda, küçük bir JSON dosyasında durur; sunucuya gitmez.
import { File, Paths } from 'expo-file-system';

import { emptyActivity, normalizeActivity, withBump, withOpenDay, type Activity, type ActivityEvent } from './days';

export type { Activity, ActivityEvent } from './days';

const activityFile = () => new File(Paths.document, 'etkinlik.json');

function read(): Activity {
  try {
    const f = activityFile();
    return f.exists ? normalizeActivity(JSON.parse(f.textSync())) : emptyActivity();
  } catch {
    return emptyActivity();
  }
}

function write(a: Activity) {
  try {
    const f = activityFile();
    if (!f.exists) f.create();
    f.write(JSON.stringify(a));
  } catch {
    // rozet kaydı uygulamayı asla durdurmaz
  }
}

export const getActivity = (): Activity => read();

/** Bugünü kullanım günü olarak kaydeder (gün başına bir kez yazar). */
export function recordOpen(now = new Date()) {
  const a = read();
  const next = withOpenDay(a, now);
  if (next !== a) write(next);
}

export function bump(event: ActivityEvent) {
  write(withBump(read(), event));
}
