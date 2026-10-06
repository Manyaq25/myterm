import { Platform } from 'react-native';
import * as Localization from 'expo-localization';
import i18n from '../i18n';

// Uygulamanın kullanıldığı başlıca ülkelerin telefon kodları. Yerel biçimde
// ("0151...", "0532...") yazılmış numaraya hangi kodun ekleneceğini telefonun
// bölge ayarından buluyoruz; bilinmeyen bölgede eskisi gibi Türkiye varsayılır.
const CALLING_CODES: Record<string, string> = {
  TR: '90', DE: '49', FR: '33', IT: '39', ES: '34', PT: '351', NL: '31', BE: '32', AT: '43', CH: '41',
  GB: '44', IE: '353', RU: '7', AZ: '994', US: '1', CA: '1', MX: '52', BR: '55', AR: '54', JP: '81',
  KR: '82', CN: '86', SA: '966', AE: '971', EG: '20', AU: '61',
};

function deviceCallingCode(): string {
  try {
    const region = Localization.getLocales()[0]?.regionCode?.toUpperCase();
    return (region && CALLING_CODES[region]) || '90';
  } catch {
    return '90';
  }
}

// wa.me ve tg:// numarayı ülke koduyla, boşluksuz/ayraçsız ister.
export function toInternationalDigits(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  const code = deviceCallingCode();
  // "05xx xxx xx xx" Türk cep numarası biçimi: yurt dışında yaşayan Türkçe
  // kullanıcıların rehberindeki numaralar da +90'la açılsın.
  if (/^05\d{9}$/.test(digits) && (code === '90' || i18n.language === 'tr')) return `90${digits.slice(1)}`;
  if (digits.startsWith('0')) return `${code}${digits.slice(1)}`;
  // Başında 0 olmadan yazılmış yerel numara (ör. "532 123 45 67", "555 123 4567").
  if (digits.length === 10 && (code === '90' || code === '1')) return `${code}${digits}`;
  return digits;
}

export function buildReminderMessage(followUpTitle: string): string {
  return `Merhaba, ${followUpTitle} konusunda...`;
}

// tel:/sms: URI'lerine yalnızca rakam ve öndeki "+" işaretinin geçmesini
// sağlıyor — phone alanı AI ile görsel/PDF'ten çıkarılmış olabileceğinden
// (kullanıcının kendi elle girdiği veri değil), boşluk dışında hiçbir
// karakteri filtrelemeden URI'ye gömmek ekstra parametre/segment
// enjeksiyonuna açık kapı bırakıyordu.
function sanitizePhoneForUri(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function buildContactLinks(phone: string, message?: string) {
  const sanitizedPhone = sanitizePhoneForUri(phone);
  const intlDigits = toInternationalDigits(phone);
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return {
    tel: `tel:${sanitizedPhone}`,
    // iOS "sms:<numara>&body=", Android "sms:<numara>?body=" bekliyor.
    sms: `sms:${sanitizedPhone}${message ? `${Platform.OS === 'ios' ? '&' : '?'}body=${encodedMessage}` : ''}`,
    whatsapp: `https://wa.me/${intlDigits}${message ? `?text=${encodedMessage}` : ''}`,
    telegramProbe: 'tg://resolve',
    telegram: `tg://resolve?phone=${intlDigits}`,
    whatsappProbe: Platform.OS === 'ios' ? 'whatsapp://app' : 'whatsapp://send',
  };
}
