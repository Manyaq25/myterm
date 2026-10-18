// Analizler yalnız bu telefonda saklanır (uygulamanın belge klasörü).
// Hesap yok, bulut yok; "Tüm analizleri sil" bu klasörü boşaltır.
import { Directory, File, Paths } from 'expo-file-system';

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

export function deleteAllAnalyses() {
  const d = dir();
  if (d.exists) d.delete();
}

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
