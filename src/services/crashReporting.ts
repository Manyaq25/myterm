import * as Sentry from '@sentry/react-native';

// DSN gizli değil: yalnızca bu projeye hata raporu göndermeye yarar.
const SENTRY_DSN = 'https://d2fa22531ccfca32659cf0da1faf606e@o4512203970379776.ingest.de.sentry.io/4512203983880272';

/**
 * Yalnızca çökme ve hata raporu: performans izleme, oturum kaydı, ekran
 * görüntüsü ve kişisel veri kapalı. Ekranda kişi adları ve takipler olduğu
 * için ekran görüntüsü/görünüm ağacı eklenmez; konsol kayıtları da kullanıcı
 * içeriği barındırabileceği için rapora iliştirilmez. Veriler Sentry'nin AB
 * (Almanya) bölgesinde tutulur.
 */
export function initCrashReporting(): void {
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !__DEV__,
    environment: __DEV__ ? 'development' : 'production',
    sendDefaultPii: false,
    tracesSampleRate: 0,
    attachScreenshot: false,
    attachViewHierarchy: false,
    beforeBreadcrumb(breadcrumb) {
      return breadcrumb.category === 'console' ? null : breadcrumb;
    },
  });
}

export const wrapWithCrashReporting = Sentry.wrap;
