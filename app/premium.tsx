import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { PurchasesPackage } from 'react-native-purchases';
import { Button } from '../src/components/Button';
import {
  getCurrentOffering,
  getLastOfferingError,
  isRevenueCatConfigured,
  purchasePackage,
  restorePurchases,
  useIsPremium,
} from '../src/services/subscription';
import { useTheme, hexToRgba, fontFamily, fontSize, type ThemeColors } from '../src/theme';

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
  const [monthlyPkg, setMonthlyPkg] = useState<PurchasesPackage | null>(null);
  const [yearlyPkg, setYearlyPkg] = useState<PurchasesPackage | null>(null);
  const [fallbackPkg, setFallbackPkg] = useState<PurchasesPackage | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentOffering().then((offering) => {
      if (cancelled) return;
      setMonthlyPkg(offering?.monthly ?? null);
      setYearlyPkg(offering?.annual ?? null);
      setFallbackPkg(offering?.monthly ?? offering?.availablePackages[0] ?? null);
      setLoadingOffering(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pkg = (selectedPeriod === 'yearly' ? yearlyPkg : monthlyPkg) ?? fallbackPkg;

  const yearlySavingsPercent = useMemo(() => {
    if (!monthlyPkg || !yearlyPkg) return null;
    const monthlyCost = monthlyPkg.product.price * 12;
    const yearlyCost = yearlyPkg.product.price;
    if (monthlyCost <= 0 || yearlyCost >= monthlyCost) return null;
    return Math.round((1 - yearlyCost / monthlyCost) * 100);
  }, [monthlyPkg, yearlyPkg]);

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
                {monthlyPkg && yearlyPkg && (
                  <View style={styles.periodToggle}>
                    <Pressable
                      style={[styles.periodOption, selectedPeriod === 'monthly' && styles.periodOptionActive]}
                      onPress={() => setSelectedPeriod('monthly')}
                    >
                      <Text style={[styles.periodLabel, selectedPeriod === 'monthly' && styles.periodLabelActive]}>
                        {t('premium.planMonthly')}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.periodOption, selectedPeriod === 'yearly' && styles.periodOptionActive]}
                      onPress={() => setSelectedPeriod('yearly')}
                    >
                      <Text style={[styles.periodLabel, selectedPeriod === 'yearly' && styles.periodLabelActive]}>
                        {t('premium.planYearly')}
                      </Text>
                      {yearlySavingsPercent != null && yearlySavingsPercent > 0 && (
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsBadgeText}>
                            {t('premium.yearlySavings', { percent: yearlySavingsPercent })}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </View>
                )}
                <Text style={styles.price}>
                  {t(selectedPeriod === 'yearly' ? 'premium.priceSuffixYearly' : 'premium.priceSuffixMonthly', {
                    price: pkg.product.priceString,
                  })}
                </Text>
                <Button
                  label={purchasing ? t('premium.purchasing') : t('premium.subscribeButton')}
                  onPress={handlePurchase}
                  loading={purchasing}
                  disabled={purchasing}
                />
                <Text style={styles.disclosure}>{t('premium.disclosure')}</Text>
              </>
            ) : (
              <>
                <Text style={styles.hint}>{t('premium.offeringUnavailable')}</Text>
                <Text style={styles.devNotice}>debug: {getLastOfferingError() ?? 'no error captured'}</Text>
              </>
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
    periodToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      padding: 4,
      width: '100%',
      gap: 4,
    },
    periodOption: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
    },
    periodOptionActive: { backgroundColor: colors.surface },
    periodLabel: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.textMuted },
    periodLabelActive: { color: colors.text },
    savingsBadge: {
      backgroundColor: hexToRgba(colors.success, 0.15),
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginTop: 4,
    },
    savingsBadgeText: { fontSize: fontSize.caption, fontFamily: fontFamily.bodySemiBold, color: colors.success },
    price: { fontSize: fontSize.title, fontFamily: fontFamily.displaySemiBold, color: colors.text },
    disclosure: { fontSize: fontSize.caption, fontFamily: fontFamily.body, color: colors.textMuted, textAlign: 'center', lineHeight: 17 },
    hint: { fontSize: fontSize.small, fontFamily: fontFamily.body, color: colors.textMuted, textAlign: 'center' },
    devNotice: { fontSize: fontSize.caption, fontFamily: fontFamily.body, color: colors.gold, textAlign: 'center', marginTop: 16 },
  });
}
