// Profil ekranındaki "benim istatistiklerim": kayıtlı tüm analizlerden, telefonda hesaplanır.
// Saf modül (React Native ve i18n yok); Node testlerinde de çalışır.
import type { Analysis } from '../store';

export type Moment = { date: string; text: string | null; chat: string };
export type AiStat = { key: string; title: string; display: string; value: number; chat: string };
export type MyStats = {
  chats: number;
  messages: number;
  topPerson: { name: string; messages: number } | null;
  favoriteWord: { word: string; count: number } | null;
  favoriteEmoji: { emoji: string; count: number } | null;
  happiestMoment: Moment | null;
  mostEmotionalDay: Moment | null;
  ghosting: { ms: number; chat: string } | null;
  medianReplyMs: number | null;
  nightOwlPct: number | null;
  doubleTexts: number;
  initiationPct: number | null;
  laughs: number;
  longestMessageWords: number | null;
  busiestHour: number | null;
  firstMessageDate: string | null;
  ai: AiStat[];
  karneAvg: number | null;
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
/** Bundan uzun sessizlik "ghosting" değil, sohbetin bitmesi sayılır. */
const MAX_GHOST_GAP = 60 * DAY;
/** Cevap süresi stats.ts ile aynı sınırı kullanır. */
const MAX_REPLY_GAP = 48 * HOUR;
const MIN_SIGNALS = 3;
const LONG_MESSAGE_WORDS = 40;

const EMOJI = /\p{Extended_Pictographic}/gu;
// stats.ts'teki kahkaha kalıbının kopyası (o dosya dil dosyası yüklediği için içe aktarılmaz).
const LAUGH = /(😂|🤣|😆|😹|(?<!\p{L})(?:a?ha(?:ha)+h?|he(?:he)+|ks(?:ks)+k?|sj(?:sj)+|js(?:js)+|ja(?:ja)+|je(?:je)+|k{4,}|rs(?:rs)+|lol|lmao|asdf\p{L}*|ahah\p{L}*|xd+|mdr|ptdr|wk(?:wk)+|х[аa](?:х[аa])+|а?ха(?:ха)+|ه{3,}|خخخ+)(?!\p{L}))/giu;
// Kahkaha emojileri LAUGH ile sayıldığı için burada yok.
const HAPPY_EMOJI = new Set([...'😊😁😄😃😀☺😍🥰😘❤💕💖💗💞🥳🎉😻🤩']);
const EMOTIONAL_EMOJI = new Set([...'❤💔😢😭🥺💕🥹😔😞🫶']);
const URL = /(?:https?:\/\/|www\.)\S+/giu;
const WORD = /\p{L}+/gu;
const STOPWORDS = new Set([
  'bir', 'ben', 'sen', 'için', 'ama', 'çok', 'var', 'yok', 'gibi', 'daha', 'şey', 'bunu', 'şimdi', 'ile',
  'the', 'and', 'you', 'that', 'this', 'with', 'for', 'are', 'was', 'but', 'not', 'have', 'just',
]);

const pad = (n: number) => String(n).padStart(2, '0');
/** Yerel tarih: YYYY-AA-GG */
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
const trim140 = (text: string) => (text.length > 140 ? `${text.slice(0, 139).trimEnd()}…` : text);

function tokens(text: string): string[] {
  const out: string[] = [];
  for (const w of text.replace(URL, ' ').toLocaleLowerCase().match(WORD) ?? []) {
    if (w.length >= 3 && !STOPWORDS.has(w)) out.push(w);
  }
  return out;
}

// Gün başına sinyal toplamı ve o günün öne çıkan mesajı
type DayBest = { signals: number; best: string | null; bestScore: number; chat: string; date: string };

function addSignal(map: Map<string, DayBest>, chat: string, date: string, signals: number, text: string, score: number) {
  const key = `${chat}\u0000${date}`;
  let d = map.get(key);
  if (!d) {
    d = { signals: 0, best: null, bestScore: 0, chat, date };
    map.set(key, d);
  }
  d.signals += signals;
  if (score > d.bestScore) {
    d.bestScore = score;
    d.best = text;
  }
}

function bestDay(map: Map<string, DayBest>): Moment | null {
  let top: DayBest | null = null;
  for (const d of map.values()) if (!top || d.signals > top.signals) top = d;
  if (!top || top.signals < MIN_SIGNALS) return null;
  return { date: top.date, text: top.best ? trim140(top.best.trim()) : null, chat: top.chat };
}

export function computeMyStats(analyses: Analysis[]): MyStats {
  const mine = analyses.filter((a) => a.me);

  let messages = 0;
  let night = 0;
  let longest: number | null = null;
  let first: Date | null = null;
  const hours = new Array<number>(24).fill(0);
  const myWords = new Map<string, number>();
  const otherWords = new Map<string, number>();
  const emojis = new Map<string, number>();
  const happy = new Map<string, DayBest>();
  const emotional = new Map<string, DayBest>();
  const replies: number[] = [];
  let ghosting: MyStats['ghosting'] = null;
  let topPerson: MyStats['topPerson'] = null;
  let doubleTexts = 0;
  let laughs = 0;
  let myInit = 0;
  let allInit = 0;

  for (const a of mine) {
    const me = a.me!;
    const chat = a.title;

    // Birebir sohbette en çok konuşulan kişi
    if (a.participants.length <= 2) {
      const other = a.participants.find((p) => p !== me);
      if (other && (!topPerson || a.stats.totalMessages > topPerson.messages)) {
        topPerson = { name: other, messages: a.stats.totalMessages };
      }
    }
    for (const p of a.stats.people) {
      allInit += p.initiations;
      if (p.name === me) {
        myInit += p.initiations;
        doubleTexts += p.doubleTexts;
        laughs += p.laughs;
      }
    }

    // Sohbet başına tek geçiş
    const msgs = a.messages;
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];
      if (m.author !== me) {
        if (!m.media) for (const w of tokens(m.text)) otherWords.set(w, (otherWords.get(w) ?? 0) + 1);
        continue;
      }

      messages++;
      const hour = m.time.getHours();
      hours[hour]++;
      if (hour < 5) night++;
      if (!first || m.time < first) first = m.time;

      // Başkası yazdı, ben cevap verdim
      const prev = msgs[i - 1];
      if (prev && prev.author !== me) {
        const gap = m.time.getTime() - prev.time.getTime();
        if (gap >= 0 && gap <= MAX_REPLY_GAP) replies.push(gap);
        if (gap < MAX_GHOST_GAP && (!ghosting || gap > ghosting.ms)) ghosting = { ms: gap, chat };
      }

      if (m.media) continue;
      const words = wordCount(m.text);
      if (longest == null || words > longest) longest = words;
      for (const w of tokens(m.text)) myWords.set(w, (myWords.get(w) ?? 0) + 1);

      let happySignals = (m.text.match(LAUGH) ?? []).length;
      let emoSignals = words >= LONG_MESSAGE_WORDS ? 2 : 0;
      for (const e of m.text.match(EMOJI) ?? []) {
        emojis.set(e, (emojis.get(e) ?? 0) + 1);
        if (HAPPY_EMOJI.has(e)) happySignals++;
        if (EMOTIONAL_EMOJI.has(e)) emoSignals++;
      }
      const date = localDate(m.time);
      if (happySignals) addSignal(happy, chat, date, happySignals, m.text, happySignals);
      // Duygusal günün metni o günkü en uzun mesajım; sinyalsiz mesaj da aday olur.
      addSignal(emotional, chat, date, emoSignals, m.text, words);
    }
  }

  // İmza kelime: bende sık, başkalarında seyrek
  let favoriteWord: MyStats['favoriteWord'] = null;
  let bestScore = -1;
  for (const [word, count] of myWords) {
    if (count < 3) continue;
    const score = count / ((otherWords.get(word) ?? 0) + 2);
    if (score > bestScore || (score === bestScore && favoriteWord && count > favoriteWord.count)) {
      bestScore = score;
      favoriteWord = { word, count };
    }
  }

  let favoriteEmoji: MyStats['favoriteEmoji'] = null;
  for (const [e, count] of emojis) {
    if (!favoriteEmoji || count > favoriteEmoji.count) favoriteEmoji = { emoji: e, count };
  }
  // Kalp, varyasyon seçicisiyle renkli görünsün
  if (favoriteEmoji?.emoji === '❤') favoriteEmoji.emoji = '❤️';

  replies.sort((x, y) => x - y);
  const busiest = Math.max(...hours);

  // Yapay zekâ raporlarındaki benim satırlarım (en yeni analiz önce)
  const ai: AiStat[] = [];
  const grades: number[] = [];
  const byNewest = [...mine].sort((x, y) => y.createdAt.localeCompare(x.createdAt));
  for (const a of byNewest) {
    if (!a.report) continue;
    for (const card of a.report.cards) {
      const row = card.people.find((p) => p.name === a.me);
      if (row) ai.push({ key: card.key, title: card.title, display: row.display, value: row.value, chat: a.title });
    }
    for (const s of a.report.karne?.subjects ?? []) {
      for (const g of s.grades) if (g.name === a.me && Number.isFinite(g.grade)) grades.push(g.grade);
    }
  }

  return {
    chats: mine.length,
    messages,
    topPerson,
    favoriteWord,
    favoriteEmoji,
    happiestMoment: bestDay(happy),
    mostEmotionalDay: bestDay(emotional),
    ghosting: ghosting && ghosting.ms > HOUR ? ghosting : null,
    medianReplyMs: replies.length >= 5 ? replies[Math.floor(replies.length / 2)] : null,
    nightOwlPct: messages >= 20 ? Math.round((night / messages) * 100) : null,
    doubleTexts,
    initiationPct: allInit ? Math.round((myInit / allInit) * 100) : null,
    laughs,
    longestMessageWords: longest,
    busiestHour: messages ? hours.indexOf(busiest) : null,
    firstMessageDate: first ? first.toISOString() : null,
    ai,
    karneAvg: grades.length ? Math.round((grades.reduce((n, g) => n + g, 0) / grades.length) * 10) / 10 : null,
  };
}
