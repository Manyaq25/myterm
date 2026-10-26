// Ödeme ekranı. Kural: sürpriz yok. Fiyat mağazadan gelir (uydurma yok),
// deneme ve otomatik yenileme düğmenin hemen üstünde yazar, kapatma (X)
// her zaman görünür.
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Check, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { t } from '@/i18n';
import { config } from '@/lib/config';
import { buy, getPlans, restore, type Plans } from '@/lib/purchases';
import { colors, fonts, radius, space, type } from '@/theme';

// Metinler çizimde alınır ki seçili dili izlesin.
const features = () => (['evidence', 'report', 'fun', 'mila', 'allInOne'] as const).map((k) => t(`paywall.features.${k}`));

/** Ücretsiz deneme süresi (gün). Mağazada tanımlı değilse null. */
function trialDays(pkg: PurchasesPackage): number | null {
  const p = pkg.product;
  if (p.introPrice && p.introPrice.price === 0) {
    const n = p.introPrice.periodNumberOfUnits;
    const unit = p.introPrice.periodUnit;
    return unit === 'DAY' ? n : unit === 'WEEK' ? n * 7 : unit === 'MONTH' ? n * 30 : null;
  }
  const free = p.defaultOption?.freePhase?.billingPeriod;
  if (free) return free.unit === 'DAY' ? free.value : free.unit === 'WEEK' ? free.value * 7 : null;
  return null;
}

export default function Pro() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [plans, setPlans] = useState<Plans | null>(null);
  const [selected, setSelected] = useState<'yearly' | 'monthly' | 'lifetime'>('yearly');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPlans()
      .then((p) => {
        setPlans(p);
        if (!p.yearly) setSelected('monthly');
      })
      .catch(() => setPlans({ monthly: null, yearly: null, lifetime: null }));
  }, []);

  const done = () => {
    if (id) router.replace({ pathname: '/analiz/rapor/[id]', params: { id } });
    else router.back();
  };

  const pkg = plans ? (selected === 'yearly' ? plans.yearly : selected === 'lifetime' ? plans.lifetime ?? null : plans.monthly) : null;
  const lifetime = selected === 'lifetime';
  const trial = pkg && selected !== 'lifetime' ? trialDays(pkg) : null;
  const monthly = plans?.monthly?.product.price;
  const yearly = plans?.yearly?.product.price;
  // Yıllık indirim, gerçek mağaza fiyatlarından hesaplanır.
  const saving = monthly && yearly ? Math.round((1 - yearly / (monthly * 12)) * 100) : 0;

  const purchase = async () => {
    if (!pkg) return;
    setBusy(true);
    try {
      if (await buy(pkg)) done();
    } catch {
      Alert.alert(t('paywall.errors.purchaseTitle'), t('paywall.errors.purchaseBody'));
    } finally {
      setBusy(false);
    }
  };

  const restorePurchases = async () => {
    setBusy(true);
    try {
      if (await restore()) done();
      else Alert.alert(t('paywall.errors.notFoundTitle'), t('paywall.errors.notFoundBody'));
    } catch {
      Alert.alert(t('paywall.errors.restoreTitle'), t('paywall.errors.restoreBody'));
    } finally {
      setBusy(false);
    }
  };

  const period = t(selected === 'yearly' ? 'paywall.period.year' : 'paywall.period.month');
  const disclosure = pkg
    ? lifetime
      ? t('paywall.lifetimeDisclosure', { price: pkg.product.priceString })
      : trial
      ? t('paywall.trialDisclosure', { days: trial, price: pkg.product.priceString, period })
      : t('paywall.disclosure', { price: pkg.product.priceString, period })
    : '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable accessibilityLabel={t('paywall.close')} onPress={() => router.back()} style={styles.close} hitSlop={12}>
          <X color={colors.text} size={22} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Unwrap Pro</Text>
        <Text style={[type.body, { color: colors.textMuted }]}>{t('paywall.subtitle')}</Text>

        <View style={styles.features}>
          {features().map((f) => (
            <View key={f} style={styles.feature}>
              <View style={styles.check}>
                <Check color={colors.onPrimary} size={14} strokeWidth={3} />
              </View>
              <Text style={[type.bodySm, { color: colors.text, flex: 1 }]}>{f}</Text>
            </View>
          ))}
        </View>

        {!plans ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: space.lg }} />
        ) : !plans.monthly && !plans.yearly ? (
          <Text style={[type.body, styles.unavailable]}>
            {t('paywall.unavailable')}
          </Text>
        ) : (
          <View style={{ gap: space.sm }}>
            {plans.yearly ? (
              <PlanRow
                active={selected === 'yearly'}
                onPress={() => setSelected('yearly')}
                title={t('paywall.yearly')}
                price={t('paywall.pricePer', { price: plans.yearly.product.priceString, period: t('paywall.period.year') })}
                badge={saving > 0 ? t('paywall.saving', { pct: saving }) : undefined}
              />
            ) : null}
            {plans.monthly ? (
              <PlanRow
                active={selected === 'monthly'}
                onPress={() => setSelected('monthly')}
                title={t('paywall.monthly')}
                price={t('paywall.pricePer', { price: plans.monthly.product.priceString, period: t('paywall.period.month') })}
              />
            ) : null}
            {plans.lifetime ? (
              <PlanRow
                active={lifetime}
                onPress={() => setSelected('lifetime')}
                title={t('paywall.lifetime')}
                price={t('paywall.lifetimePrice', { price: plans.lifetime.product.priceString })}
                badge={t('paywall.lifetimeBadge')}
              />
            ) : null}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {disclosure ? <Text style={styles.disclosure}>{disclosure}</Text> : null}
        <Button
          label={lifetime ? t('paywall.buyLifetime') : trial ? t('paywall.startTrial', { days: trial }) : t('paywall.subscribe')}
          variant="coral"
          onPress={purchase}
          loading={busy}
          disabled={!pkg}
        />
        <View style={styles.links}>
          <Text style={styles.link} onPress={restorePurchases}>{t('paywall.restore')}</Text>
          <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(config.termsUrl)}>{t('paywall.terms')}</Text>
          {config.privacyUrl ? (
            <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(config.privacyUrl)}>{t('paywall.privacy')}</Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function PlanRow({ active, onPress, title, price, badge }: { active: boolean; onPress: () => void; title: string; price: string; badge?: string }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.plan, active && styles.planActive]}>
      <View style={[styles.radio, active && styles.radioActive]} />
      <View style={{ flex: 1 }}>
        <Text style={[type.title, { color: colors.text }]}>{title}</Text>
        <Text style={[type.bodySm, { color: colors.textMuted }]}>{price}</Text>
      </View>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.md, paddingTop: space.sm },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, gap: space.md },
  title: { fontFamily: fonts.extrabold, fontSize: 34, color: colors.text, letterSpacing: -1 },
  features: { gap: space.sm, marginVertical: space.sm },
  feature: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  unavailable: { color: colors.textMuted, textAlign: 'center', marginTop: space.lg },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surfaceHigh,
  },
  planActive: { borderColor: colors.primary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.outline },
  radioActive: { borderColor: colors.primary, borderWidth: 7 },
  badge: { ...type.label, color: colors.onPrimary, backgroundColor: colors.purple, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, overflow: 'hidden' },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.sm },
  disclosure: { ...type.caption, color: colors.textMuted, textAlign: 'center' },
  links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', columnGap: space.md, rowGap: space.xs },
  link: { ...type.caption, color: colors.textMuted, textDecorationLine: 'underline', paddingVertical: space.xs },
});
