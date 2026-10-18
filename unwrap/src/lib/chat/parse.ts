// Sohbet dışa aktarma dosyalarını ortak bir mesaj listesine çevirir.
// Desteklenenler:
//   WhatsApp Android: "02.10.2026 20:14 - Ad: mesaj" (ayrıca 2/10/26, 8:14 PM)
//   WhatsApp iPhone:  "[02.10.2026 20:14:12] Ad: mesaj" (.zip içindeki _chat.txt)
//   Telegram Desktop: result.json
// Her şey telefonda çalışır; hiçbir şey sunucuya gitmez.

export type Message = {
  time: Date;
  author: string;
  text: string;
  media: boolean;
};

export type ParsedChat = {
  source: 'whatsapp' | 'telegram';
  messages: Message[];
  participants: string[];
};

// Görünmez yön işaretleri ve boşluk benzeri karakterler
const INVISIBLE = /[‎‏‪-‮⁦-⁩﻿]/g;

const MEDIA_MARKERS = [
  'medya dahil edilmedi',
  'media omitted',
  'dahil edilmedi',
  'omitted',
  '<attached:',
  'dosya ekli',
  'file attached',
];

const isMedia = (text: string) => {
  const t = text.toLowerCase();
  return MEDIA_MARKERS.some((m) => t.includes(m));
};

// Tarih kısmı: 02.10.2026 | 2/10/26 | 2026-10-02 ; saat: 20:14 | 20:14:12 | 8:14 PM
const LINE = new RegExp(
  String.raw`^\[?(\d{1,4})[./-](\d{1,2})[./-](\d{1,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?\]?\s*(?:-\s*)?([^:]{1,60}?):\s?(.*)$`,
);
// Yazarı olmayan sistem satırı ("Mesajlar uçtan uca şifrelidir" gibi)
const SYSTEM_LINE = new RegExp(String.raw`^\[?(\d{1,4})[./-](\d{1,2})[./-](\d{1,4}),?\s+\d{1,2}:\d{2}`);

type RawLine = { a: number; b: number; c: number; h: number; m: number; s: number; ampm?: string; author: string; text: string };

export function parseWhatsApp(content: string): ParsedChat {
  const raws: RawLine[] = [];
  let last: RawLine | null = null;
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(INVISIBLE, '');
    const m = line.match(LINE);
    if (m) {
      last = {
        a: +m[1], b: +m[2], c: +m[3], h: +m[4], m: +m[5], s: m[6] ? +m[6] : 0,
        ampm: m[7]?.toLowerCase(), author: m[8].trim(), text: m[9],
      };
      raws.push(last);
    } else if (SYSTEM_LINE.test(line)) {
      last = null; // sistem mesajı: alma, ardından gelen satırları da ekleme
    } else if (last && line.trim()) {
      last.text += '\n' + line;
    }
  }

  // Gün mü önce, ay mı? Herhangi bir satırda ilk sayı 12'den büyükse gün önce;
  // ikinci sayı 12'den büyükse ay önce. Belirsizse Türkiye düzeni (gün önce).
  const yearFirst = raws.some((r) => r.a > 31);
  let dayFirst = true;
  if (!yearFirst) {
    if (raws.some((r) => r.b > 12)) dayFirst = false;
    if (raws.some((r) => r.a > 12)) dayFirst = true;
  }

  const messages: Message[] = raws.map((r) => {
    let year: number, month: number, day: number;
    if (yearFirst) [year, month, day] = [r.a, r.b, r.c];
    else if (dayFirst) [day, month, year] = [r.a, r.b, r.c];
    else [month, day, year] = [r.a, r.b, r.c];
    if (year < 100) year += 2000;
    let hour = r.h;
    if (r.ampm === 'pm' && hour < 12) hour += 12;
    if (r.ampm === 'am' && hour === 12) hour = 0;
    const text = r.text.trim();
    return { time: new Date(year, month - 1, day, hour, r.m, r.s), author: r.author, text, media: isMedia(text) };
  });

  return { source: 'whatsapp', messages, participants: participantsOf(messages) };
}

type TelegramText = string | { type?: string; text: string };
type TelegramExport = {
  messages?: { type?: string; date?: string; from?: string | null; text?: TelegramText | TelegramText[]; media_type?: string; photo?: string; file?: string }[];
};

export function parseTelegram(content: string): ParsedChat {
  const data = JSON.parse(content) as TelegramExport;
  const messages: Message[] = [];
  for (const msg of data.messages ?? []) {
    if (msg.type !== 'message' || !msg.from || !msg.date) continue;
    const parts = Array.isArray(msg.text) ? msg.text : [msg.text ?? ''];
    const text = parts.map((p) => (typeof p === 'string' ? p : p.text)).join('').trim();
    const media = !text && Boolean(msg.media_type || msg.photo || msg.file);
    messages.push({ time: new Date(msg.date), author: msg.from, text, media });
  }
  return { source: 'telegram', messages, participants: participantsOf(messages) };
}

/** Dosya içeriğine bakarak doğru ayrıştırıcıyı seçer. */
export function parseChat(content: string): ParsedChat {
  const trimmed = content.trimStart();
  const chat = trimmed.startsWith('{') ? parseTelegram(trimmed) : parseWhatsApp(content);
  if (chat.messages.length === 0) throw new Error('EMPTY_CHAT');
  return chat;
}

function participantsOf(messages: Message[]): string[] {
  const counts = new Map<string, number>();
  for (const m of messages) counts.set(m.author, (counts.get(m.author) ?? 0) + 1);
  return [...counts.entries()].sort((x, y) => y[1] - x[1]).map(([name]) => name);
}
