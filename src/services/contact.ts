import { Platform } from 'react-native';

// wa.me ve tg:// numarayı ülke koduyla, boşluksuz/ayraçsız ister. Uygulama
// Türkiye pazarı için (yerel "0XXX..." formatı yaygın), başındaki 0'ı 90
// ülke koduyla değiştiriyoruz; zaten 90 ile başlıyorsa dokunmuyoruz.
export function toInternationalDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return `90${digits.slice(1)}`;
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
