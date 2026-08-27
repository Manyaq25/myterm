// Teşhis amaçlı bilinçli olarak aşırı kontrastlı değerler: kullanıcı
// önceki (daha ince) tonlarda kart ayrımını hiç göremediğini bildirdi.
// Bu, stilin hiç uygulanmadığı (bundle/cache sorunu) ile stilin
// uygulanıp da fark edilemeyecek kadar ince olduğunu birbirinden
// ayırt etmek için kasıtlı olarak abartılı.
export const CARD_SURFACE = {
  backgroundColor: '#ffffff',
  borderRadius: 16,
  padding: 16,
  borderWidth: 2,
  borderColor: '#64748b',
  shadowColor: '#000000',
  shadowOpacity: 0.25,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 6,
} as const;

export const CARD_MARGIN_BOTTOM = 14;

export const SCREEN_BACKGROUND = '#c7ccd6';
