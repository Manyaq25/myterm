// Bir sohbet dosyasını okuyup yeni analiz olarak kaydeder. "Dosya seç" ve
// WhatsApp paylaşım menüsünden gelen dosya aynı yoldan geçer.
import { t } from '@/i18n';
import { bump } from '../profile/activity';
import { newId, saveAnalysis } from '../store';
import { loadChatFile } from './load';
import { computeStats } from './stats';

// Hata kodu → metin anahtarı (metin o anki dilde okunur).
const IMPORT_ERRORS: Record<string, string> = {
  EMPTY_CHAT: 'common.importErrors.emptyChat',
  NO_CHAT_IN_ZIP: 'common.importErrors.noChatInZip',
};

export const importErrorText = (e: unknown) => t(IMPORT_ERRORS[e instanceof Error ? e.message : ''] ?? 'common.importErrors.fallback');

/** Dosyayı okur, analizi kaydeder ve kimliğini döner. */
export async function importChatFile(uri: string, name?: string): Promise<string> {
  const chat = await loadChatFile(uri, name);
  const stats = computeStats(chat);
  const id = newId();
  const isGroup = chat.participants.length > 2;
  saveAnalysis({
    id,
    createdAt: new Date().toISOString(),
    title: isGroup ? t('common.groupTitle', { count: chat.participants.length }) : chat.participants.join(' & '),
    source: chat.source,
    participants: chat.participants,
    me: null,
    relation: isGroup ? 'grup' : null,
    stats,
    messages: chat.messages,
  });
  bump('analysis_created');
  return id;
}
