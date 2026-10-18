// Seçilen dosyayı okur: .txt, .json (Telegram) veya iPhone'un verdiği .zip.
import { File } from 'expo-file-system';
import { strFromU8, unzipSync } from 'fflate';

import { parseChat, type ParsedChat } from './parse';

export async function loadChatFile(uri: string, name?: string): Promise<ParsedChat> {
  const file = new File(uri);
  const lower = (name ?? uri).toLowerCase();
  if (lower.endsWith('.zip')) {
    const entries = unzipSync(await file.bytes(), {
      filter: (f) => /\.(txt|json)$/i.test(f.name) && !f.name.startsWith('__MACOSX'),
    });
    const names = Object.keys(entries);
    // iPhone: "_chat.txt"; yoksa ilk metin dosyası
    const chosen = names.find((n) => /_chat\.txt$/i.test(n)) ?? names[0];
    if (!chosen) throw new Error('NO_CHAT_IN_ZIP');
    return parseChat(strFromU8(entries[chosen]));
  }
  return parseChat(await file.text());
}
