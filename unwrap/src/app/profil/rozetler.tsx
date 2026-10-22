// Rozetler ekranı: tüm rozetler, kazanılanlar renkli. Rozetler Pro; ücretsiz kullanıcı
// hepsini kilitli görür, dokununca Pro'ya gider.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BadgeGrid, BadgeTitle } from '@/components/Badges';
import { BackButton, Button, useTopInset } from '@/components/ui';
import { t } from '@/i18n';
import { getActivity } from '@/lib/profile/activity';
import { bestBadge, computeBadges, toGender, type Badge, type Gender } from '@/lib/profile/badges';
import { computeMyStats } from '@/lib/profile/stats';
import { getProfile } from '@/lib/profile/store';
import { isPro } from '@/lib/purchases';
import { getAnalysis, listAnalyses, type Analysis } from '@/lib/store';
import { colors, radius, space, type } from '@/theme';

function loadBadges(gender: Gender): Badge[] {
  const list = listAnalyses();
  const relationCounts: Record<string, number> = {};
  for (const a of list) if (a.relation) relationCounts[a.relation] = (relationCounts[a.relation] ?? 0) + 1;
  const all = list.map((a) => getAnalysis(a.id)).filter((a): a is Analysis => !!a);
  const stats = all.some((a) => !!a.me) ? computeMyStats(all) : null;
  return computeBadges({ activity: getActivity(), stats, analysesCount: list.length, relationCounts, gender });
}

export default function Rozetler() {
  const topInset = useTopInset();
  const [badges, setBadges] = useState<Badge[] | null>(null);
  const [pro, setPro] = useState(false);
  // Cinsiyet alanı profile yeni ekleniyor; yoksa nötr.
  const [gender, setGender] = useState<Gender>('notr');

  useFocusEffect(
    useCallback(() => {
      isPro().then(setPro);
      const g = toGender((getProfile() as { gender?: string }).gender ?? 'notr');
      setGender(g);
      // Çok sohbette hesap uzun sürebilir: ekran çizildikten sonra başla.
      const timer = setTimeout(() => setBadges(loadBadges(g)), 50);
      return () => clearTimeout(timer);
    }, []),
  );

  const goPro = () => router.push('/pro');
  const earned = badges?.filter((b) => b.earned).length ?? 0;

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: topInset }]} edges={['bottom', 'left', 'right']}>
      <View style={styles.top}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[type.headline, { color: colors.text }]}>{t('badges.screenTitle')}</Text>
        {badges ? (
          <>
            <Text style={[type.label, { color: colors.textMuted }]}>
              {t('badges.earnedCount', { earned, total: badges.length })}
            </Text>
            <Text style={[type.bodySm, { color: colors.textMuted }]}>{t('badges.lead')}</Text>
            <View style={{ alignItems: 'flex-start' }}>
              <BadgeTitle badge={bestBadge(badges)} gender={gender} isPro={pro} onPress={pro ? undefined : goPro} />
            </View>
            {!pro ? (
              <View style={styles.pro}>
                <Text style={[type.bodySm, { color: colors.text }]}>{t('badges.proNote')}</Text>
                <Button label={t('badges.unlock')} variant="coral" onPress={goPro} />
              </View>
            ) : null}
            <BadgeGrid badges={badges} gender={gender} isPro={pro} onLockedPress={goPro} />
          </>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[type.bodySm, { color: colors.textMuted }]}>{t('badges.loading')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  top: { paddingHorizontal: space.lg, paddingVertical: space.sm },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.md },
  pro: { backgroundColor: colors.cardButter, borderRadius: radius.md, padding: space.md, gap: space.sm },
  loading: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
});
