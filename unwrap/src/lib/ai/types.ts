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
};

export type CoachRole =
  | 'sevgili' | 'es' | 'nisanli' | 'flort' | 'crush' | 'situationship' | 'eski'
  | 'bestie' | 'arkadas' | 'aile' | 'hayalimdeki' | 'hoslandigim';
/** pro: Mila bu sorunun Pro'ya özel olduğunu söyledi (ödeme düğmesi gösterilir). */
export type CoachTurn = { role: 'user' | 'assistant'; text: string; pro?: boolean };
