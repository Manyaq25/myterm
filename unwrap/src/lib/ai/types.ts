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

export type CoachRole = 'eski' | 'sevgili' | 'hoslandigim' | 'hayalimdeki';
export type CoachTurn = { role: 'user' | 'assistant'; text: string };
