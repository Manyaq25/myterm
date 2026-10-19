// Bir sohbet dosyasını okuyup yeni analiz olarak kaydeder. "Dosya seç" ve
// WhatsApp paylaşım menüsünden gelen dosya aynı yoldan geçer.
import { newId, saveAnalysis } from '../store';
import { loadChatFile } from './load';
import { computeStats } from './stats';

export const IMPORT_ERRORS: Record<string, string> = {
  EMPTY_CHAT: 'Bu dosyada sohbet mesajı bulamadık. WhatsApp\'ta "Sohbeti dışa aktar" ile alınan dosyayı seçtiğinden emin ol.',
  NO_CHAT_IN_ZIP: 'ZIP dosyasının içinde sohbet bulamadık.',
};
export const IMPORT_FALLBACK = 'Bu dosyayı okuyamadık. Rehberdeki adımlarla yeniden dışa aktarmayı dene.';

export const importErrorText = (e: unknown) => IMPORT_ERRORS[e instanceof Error ? e.message : ''] ?? IMPORT_FALLBACK;

/** Dosyayı okur, analizi kaydeder ve kimliğini döner. */
export async function importChatFile(uri: string, name?: string): Promise<string> {
  const chat = await loadChatFile(uri, name);
  const stats = computeStats(chat);
  const id = newId();
  const isGroup = chat.participants.length > 2;
  saveAnalysis({
    id,
    createdAt: new Date().toISOString(),
    title: isGroup ? `${chat.participants.length} kişilik grup` : chat.participants.join(' & '),
    source: chat.source,
    participants: chat.participants,
    me: null,
    relation: isGroup ? 'grup' : null,
    stats,
    messages: chat.messages,
  });
  return id;
}
