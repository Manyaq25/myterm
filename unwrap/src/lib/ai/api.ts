// Sunucuya ücretli istekler: kullanıcı kimliği + gerçek uygulama kanıtı ile.
import { lang, t } from '@/i18n';
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

/** Kullanıcıya gösterilecek sade açıklama (seçili dilde). */
export function errorText(e: unknown): string {
  const code = e instanceof ApiError ? e.code : 'network';
  switch (code) {
    case 'pro_required':
      return t('common.apiErrors.proRequired');
    case 'slow_down':
      return t('common.apiErrors.slowDown');
    case 'free_limit':
      return t('common.apiErrors.freeLimit');
    case 'daily_limit':
      return t('common.apiErrors.dailyLimit');
    case 'report_failed':
    case 'coach_refused':
      return t('common.apiErrors.noAnswer');
    case 'network':
      return t('common.apiErrors.network');
    default:
      return t('common.apiErrors.generic');
  }
}

export async function post<T>(path: string, body: unknown): Promise<T> {
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
  const { report } = await post<{ report: Report }>('/api/report', buildReportPayload(a, lang()));
  return report;
}

const CONTEXT_LIMIT = 38_000;

/** Mila'ya giden sohbet bağlamı (aynı sohbette aynı kalır, sunucuda önbelleğe alınır). */
export function coachContext(a: Analysis): string {
  return `${formatStats(a.stats)}\n\n${formatMessages(sampleMessages(a.messages))}`.slice(0, CONTEXT_LIMIT);
}

/** a = null: sohbet seçilmeden genel ilişki sorusu. */
export async function askCoach(
  a: Analysis | null,
  role: CoachRole | null,
  history: CoachTurn[],
): Promise<{ text: string; proRequired: boolean }> {
  const other = a ? (a.participants.find((p) => p !== a.me) ?? null) : null;
  const { text, proRequired } = await post<{ text: string; proRequired?: boolean }>('/api/coach', {
    lang: lang(),
    relation: a?.relation ?? 'diger',
    me: a?.me ?? null,
    other: a && a.participants.length <= 2 ? other : null,
    context: a ? coachContext(a) : '',
    role: a ? role : null,
    history: history.slice(-40).map(({ role: r, text }) => ({ role: r, text })),
  });
  return { text, proRequired: Boolean(proRequired) };
}

export type ReportKind = 'mila' | 'rapor';
export type ReportReason = 'saldirgan' | 'cinsel' | 'zararli' | 'yanlis' | 'diger';

/** Yapay zekâ içeriğini bildirir (yalnız yapay zekâ metni gider, sohbet gitmez). */
export async function reportContent(r: { kind: ReportKind; reason: ReportReason; text: string; note?: string }) {
  await post<{ ok: true }>('/api/bildir', { ...r, text: r.text.slice(0, 2000), note: r.note?.slice(0, 300), lang: lang() });
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

export type InviteInfo = { code: string; rewards: number; max: number; redeemed: boolean };
export type RedeemResult = { result: 'ok' | 'invalid' | 'own' | 'already'; inviterRewarded: boolean; gift?: boolean };
export type GiftCode = { code: string; redeemed: boolean };

export const inviteInfo = () => post<InviteInfo>('/api/davet', { action: 'code' });
export const redeemInvite = (code: string) => post<RedeemResult>('/api/davet', { action: 'redeem', code });
export const giftCodes = async () => (await post<{ gifts: GiftCode[] }>('/api/davet', { action: 'gifts' })).gifts;
