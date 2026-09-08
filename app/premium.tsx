import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { PurchasesPackage } from 'react-native-purchases';
import { Button } from '../src/components/Button';
import {
  getCurrentOffering,
  isRevenueCatConfigured,
  purchasePackage,
  restorePurchases,
  useIsPremium,
} from '../src/services/subscription';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../src/theme';

interface ComparisonRow {
  key: string;
  free: boolean;
  premium: boolean;
}

const ROWS: ComparisonRow[] = [
  { key: 'manualTracking', free: true, premium: true },
  { key: 'aiExtractionLimited', free: true, premium: false },
  { key: 'aiExtractionUnlimited', free: false, premium: true },
  { key: 'smartReminders', free: false, premium: true },
  { key: 'personInsights', free: false, premium: true },
  { key: 'widgetSiri', free: false, premium: true },
];

export default function PremiumScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const router = useRouter();
  const { t } = useTranslation();
  const isPremium = useIsPremium();

  const [loadingOffering, setLoadingOffering] = useState(true);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentOffering().then((offering) => {
      if (cancelled) return;
      setPkg(offering?.monthly ?? offering?.availablePackages[0] ?? null);
      setLoadingOffering(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePurchase() {
    if (!pkg || purchasing) return;
    setPurchasing(true);
    try {
      const result = await purchasePackage(pkg);
      if (result.ok) {
        router.back();
      } else if (!result.userCancelled) {
        Alert.alert(t('common.error'), t('premium.purchaseError'));
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    if (restoring) return;
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      Alert.alert(
        restored ? t('premium.restoreSuccessTitle') : t('premium.restoreNoneTitle'),
        restored ? t('premium.restoreSuccessMessage') : t('premium.restoreNoneMessage')
      );
      if (restored) router.back();
    } finally {
      setRestoring(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.icon}>✨</Text>
      <Text style={styles.title}>{t('premium.title')}</Text>
      <Text style={styles.subtitle}>{t('premium.subtitle')}</Text>

      {isPremium ? (
        <View style={styles.activeBox}>
          <Text style={styles.activeText}>{t('premium.alreadyActive')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, styles.featureCol]} />
              <Text style={styles.tableHeaderCell}>{t('premium.freeColumn')}</Text>
              <Text style={styles.tableHeaderCell}>{t('premium.premiumColumn')}</Text>
            </View>
            {ROWS.map((row) => (
              <View key={row.key} style={styles.tableRow}>
                <Text style={[styles.tableFeature, styles.featureCol]}>{t(`premium.feature.${row.key}`)}</Text>
                <Text style={styles.tableCell}>{row.free ? '✓' : '—'}</Text>
                <Text style={styles.tableCell}>{row.premium ? '✓' : '—'}</Text>
              </View>
            ))}
          </View>

          <View style={styles.purchaseBox}>
            {loadingOffering ? (
              <ActivityIndicator color={colors.primary} />
            ) : pkg ? (
              <>
                <Text style={styles.price}>{t('premium.priceSuffix', { price: pkg.product.priceString })}</Text>
                <Button
                  label={purchasing ? t('premium.purchasing') : t('premium.subscribeButton')}
                  onPress={handlePurchase}
                  loading={purchasing}
                  disabled={purchasing}
                />
                <Text style={styles.disclosure}>{t('premium.disclosure')}</Text>
              </>
            ) : (
              <Text style={styles.hint}>{t('premium.offeringUnavailable')}</Text>
            )}
          </View>

          <Button
            label={restoring ? t('premium.restoring') : t('premium.restoreButton')}
            onPress={handleRestore}
            variant="secondary"
            loading={restoring}
            disabled={restoring}
          />

          {!isRevenueCatConfigured && __DEV__ && (
            <Text style={styles.devNotice}>{t('premium.devKeyMissingNotice')}</Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingBottom: 48, alignItems: 'center' },
    icon: { fontSize: 40, marginBottom: 8 },
    title: { fontSize: fontSize.title, fontFamily: fontFamily.displaySemiBold, color: colors.text, marginBottom: 6, textAlign: 'center' },
    subtitle: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.body,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 21,
    },
    activeBox: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      padding: 18,
      width: '100%',
    },
    activeText: { fontSize: fontSize.base, fontFamily: fontFamily.bodySemiBold, color: colors.success, textAlign: 'center' },
    table: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 24,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceAlt,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    tableHeaderCell: {
      flex: 1,
      fontSize: fontSize.caption,
      fontFamily: fontFamily.bodyBold,
      color: colors.textMuted,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    featureCol: { flex: 2.4, textAlign: 'left' },
    tableFeature: { fontSize: fontSize.small, fontFamily: fontFamily.body, color: colors.text },
    tableCell: { flex: 1, fontSize: fontSize.base, fontFamily: fontFamily.bodySemiBold, color: colors.text, textAlign: 'center' },
    purchaseBox: { width: '100%', alignItems: 'center', marginBottom: 16, gap: 12 },
    price: { fontSize: fontSize.title, fontFamily: fontFamily.displaySemiBold, color: colors.text },
    disclosure: { fontSize: fontSize.caption, fontFamily: fontFamily.body, color: colors.textMuted, textAlign: 'center', lineHeight: 17 },
    hint: { fontSize: fontSize.small, fontFamily: fontFamily.body, color: colors.textMuted, textAlign: 'center' },
    devNotice: { fontSize: fontSize.caption, fontFamily: fontFamily.body, color: colors.gold, textAlign: 'center', marginTop: 16 },
  });
}
