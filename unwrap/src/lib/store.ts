// Analizler yalnız bu telefonda saklanır (uygulamanın belge klasörü).
// Hesap yok, bulut yok; "Tüm analizleri sil" bu klasörü boşaltır.
import { Directory, File, Paths } from 'expo-file-system';

import type { CoachRole, CoachTurn, Report } from './ai/types';
import type { Message } from './chat/parse';
import type { ChatStats } from './chat/stats';

export type Relation = 'sevgili' | 'es' | 'flort' | 'eski' | 'arkadas' | 'aile' | 'is' | 'grup' | 'diger';

export type Analysis = {
  id: string;
  createdAt: string;
  title: string;
  source: 'whatsapp' | 'telegram';
  participants: string[];
  me: string | null;
  relation: Relation | null;
  stats: ChatStats;
  messages: Message[];
  /** Yapay zekâ raporu (Pro); bir kez üretilir, telefonda saklanır. */
  report?: Report;
  /** Mila ile bu sohbet hakkındaki konuşma. */
  coach?: { role: CoachRole | null; history: CoachTurn[] };
};

export type AnalysisSummary = Pick<Analysis, 'id' | 'createdAt' | 'title' | 'relation' | 'participants'> & {
  totalMessages: number;
};

const dir = () => {
  const d = new Directory(Paths.document, 'analizler');
  if (!d.exists) d.create({ intermediates: true });
  return d;
};

const fileFor = (id: string) => new File(dir(), `${id}.json`);

// Tarihler JSON'da metin olarak durur; okurken Date'e çevrilir.
const DATE_KEYS = new Set(['time', 'firstMessage', 'lastMessage', 'at']);
const revive = (key: string, value: unknown) =>
  DATE_KEYS.has(key) && typeof value === 'string' ? new Date(value) : value;

export function saveAnalysis(a: Analysis) {
  const f = fileFor(a.id);
  if (!f.exists) f.create();
  f.write(JSON.stringify(a));
}

export function getAnalysis(id: string): Analysis | null {
  const f = fileFor(id);
  if (!f.exists) return null;
  return JSON.parse(f.textSync(), revive) as Analysis;
}

export function listAnalyses(): AnalysisSummary[] {
  const out: AnalysisSummary[] = [];
  for (const entry of dir().list()) {
    if (!(entry instanceof File) || !entry.name.endsWith('.json')) continue;
    try {
      const a = JSON.parse(entry.textSync(), revive) as Analysis;
      out.push({
        id: a.id, createdAt: a.createdAt, title: a.title, relation: a.relation,
        participants: a.participants, totalMessages: a.stats.totalMessages,
      });
    } catch {
      // bozuk dosyayı atla
    }
  }
  return out.sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}

export function updateAnalysis(id: string, patch: Partial<Analysis>) {
  const a = getAnalysis(id);
  if (a) saveAnalysis({ ...a, ...patch });
}

// Sohbet seçmeden Mila ile yapılan genel konuşma.
const generalCoachFile = () => new File(Paths.document, 'koc-genel.json');

export function getGeneralCoach(): CoachTurn[] {
  const f = generalCoachFile();
  if (!f.exists) return [];
  try {
    return JSON.parse(f.textSync()) as CoachTurn[];
  } catch {
    return [];
  }
}

export function saveGeneralCoach(history: CoachTurn[]) {
  const f = generalCoachFile();
  if (!f.exists) f.create();
  f.write(JSON.stringify(history));
}

/** Mila konuşmalarını siler; sohbetler ve raporlar kalır. */
export function deleteCoachHistory() {
  for (const { id } of listAnalyses()) updateAnalysis(id, { coach: undefined });
  const f = generalCoachFile();
  if (f.exists) f.delete();
}

export function deleteAllAnalyses() {
  const d = dir();
  if (d.exists) d.delete();
  const f = generalCoachFile();
  if (f.exists) f.delete();
}

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
