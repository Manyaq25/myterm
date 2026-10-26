// Sunucunun döndürdüğü raporun biçimi (unwrap/backend/lib/report.ts ReportSchema ile aynı).
export type ReportPerson = { name: string; value: number; display: string };
export type ReportEvidence = { author: string; quote: string; date: string; note: string };
export type ReportCard = { key: string; title: string; people: ReportPerson[]; evidence: ReportEvidence[]; caption: string };

export type Report = {
  summary: string;
  cards: ReportCard[];
  karne: { subjects: { subject: string; grades: { name: string; grade: number }[] }[]; teacherNote: string };
  tone: { quote: string; author: string; meaning: string }[];
  replies: string[];
  finale: { title: string; text: string };
  // Paylaşmalık ek kartlar (eski raporlarda yok; ilişki türüne uymayan null gelir)
  flags?: ReportFlags | null;
  compatibility?: ReportCompatibility | null;
  loveDuel?: ReportLoveDuel | null;
  awards?: ReportAward[] | null;
  ex?: ReportEx | null;
};

export type ReportFlag = { title: string; author: string; quote: string; date: string };
export type ReportFlags = { red: ReportFlag[]; green: ReportFlag[]; verdict: string };
export type ReportCompatibility = { score: number; title: string; best: string; clash: string; line: string };
/** winner: katılımcı adı ya da berabere için "DRAW". */
export type ReportLoveDuel = { rounds: { label: string; winner: string; detail: string }[]; winner: string; line: string };
export type ReportAward = { emoji: string; title: string; name: string; reason: string };
export type ReportEx = { story: string; turningPoint: ReportEvidence; lesson: string };

export type CoachRole =
  | 'sevgili' | 'es' | 'nisanli' | 'flort' | 'crush' | 'situationship' | 'eski'
  | 'bestie' | 'arkadas' | 'aile' | 'hayalimdeki' | 'hoslandigim' | 'hakem';
/** pro: Mila bu sorunun Pro'ya özel olduğunu söyledi (ödeme düğmesi gösterilir). */
export type CoachTurn = { role: 'user' | 'assistant'; text: string; pro?: boolean };
