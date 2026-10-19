// Sunucuya ücretli istekler: kullanıcı kimliği + gerçek uygulama kanıtı ile.
import type { Analysis } from '../store';
import { config } from '../config';
import { bodyHash, integrityHeaders } from '../integrity';
import { appUserId } from '../purchases';
import { buildReportPayload, formatMessages, formatStats, sampleMessages } from './request';
import type { CoachRole, CoachTurn, Report } from './types';

export class ApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
  }
}

/** Kullanıcıya gösterilecek sade Türkçe açıklama. */
export function errorText(e: unknown): string {
  const code = e instanceof ApiError ? e.code : 'network';
  switch (code) {
    case 'pro_required':
      return 'Bu özellik Unwrap Pro ile açılıyor.';
    case 'slow_down':
      return 'Çok hızlı gidiyoruz, bir dakika sonra tekrar dener misin?';
    case 'daily_limit':
      return 'Bugünlük sınır doldu, yarın tekrar deneyebilirsin.';
    case 'report_failed':
    case 'coach_refused':
      return 'Bu sohbet için cevap üretemedik. Farklı bir soru dener misin?';
    case 'network':
      return 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dener misin?';
    default:
      return 'Bir şeyler ters gitti, birazdan tekrar dener misin?';
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const userId = await appUserId();
  if (!userId) throw new ApiError('pro_required', 402);
  const raw = JSON.stringify(body);
  const headers = {
    'Content-Type': 'application/json',
    'x-app-user-id': userId,
    ...(await integrityHeaders(userId, await bodyHash(raw))),
  };
  let res: Response;
  try {
    res = await fetch(`${config.apiUrl}${path}`, { method: 'POST', headers, body: raw });
  } catch {
    throw new ApiError('network', 0);
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new ApiError(data.error ?? 'server_error', res.status);
  return data;
}

export async function requestReport(a: Analysis): Promise<Report> {
  const { report } = await post<{ report: Report }>('/api/report', buildReportPayload(a));
  return report;
}

const CONTEXT_LIMIT = 38_000;

/** Mila'ya giden sohbet bağlamı (aynı sohbette aynı kalır, sunucuda önbelleğe alınır). */
export function coachContext(a: Analysis): string {
  return `${formatStats(a.stats)}\n\n${formatMessages(sampleMessages(a.messages))}`.slice(0, CONTEXT_LIMIT);
}

/** a = null: sohbet seçilmeden genel ilişki sorusu. */
export async function askCoach(a: Analysis | null, role: CoachRole | null, history: CoachTurn[]): Promise<string> {
  const other = a ? (a.participants.find((p) => p !== a.me) ?? null) : null;
  const { text } = await post<{ text: string }>('/api/coach', {
    relation: a?.relation ?? 'diger',
    me: a?.me ?? null,
    other: a && a.participants.length <= 2 ? other : null,
    context: a ? coachContext(a) : '',
    role: a ? role : null,
    history: history.slice(-40),
  });
  return text;
}

/** "Bu hafta X sohbet analiz edildi" — sayı henüz anlamlı değilse null. */
export async function weeklyCount(): Promise<number | null> {
  try {
    const res = await fetch(`${config.apiUrl}/api/counter`);
    const data = (await res.json()) as { thisWeek: number | null };
    return typeof data.thisWeek === 'number' ? data.thisWeek : null;
  } catch {
    return null;
  }
}
