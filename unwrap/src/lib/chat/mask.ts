// Yapay zekâya gönderilecek metinden kişisel verileri çıkarır.
// (Sunucu da aynı maskeyi ikinci kez uygular.)

const RULES: [RegExp, string][] = [
  [/\bTR\d{2}(?:\s?\d{4}){5}\s?\d{2}\b/gi, '[IBAN]'],
  [/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, '[E-POSTA]'],
  [/(?:\+90[\s-]?|0)?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/g, '[TELEFON]'],
  [/\b\d{11}\b/g, '[KİMLİK NO]'],
  [/\b(?:\d{4}[\s-]?){3}\d{4}\b/g, '[KART NO]'],
  [/https?:\/\/\S+/g, '[BAĞLANTI]'],
];

export function maskPersonalData(text: string): string {
  return RULES.reduce((t, [re, label]) => t.replace(re, label), text);
}
