import * as Sentry from '@sentry/react-native';

// DSN gizli değil: yalnızca bu projeye hata raporu göndermeye yarar.
// Sentry → aydinapp → react-native → Client Keys (DSN) ile aynı olmalı. 7 Ekim'e kadar
// var olmayan eski bir projenin adresi duruyordu ve hiçbir rapor Sentry'ye ulaşmıyordu.
const SENTRY_DSN = 'https://ca574e265c4d04e8ae0ec68d0e84a05d@o4512203970379776.ingest.de.sentry.io/4512203992268880';

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
