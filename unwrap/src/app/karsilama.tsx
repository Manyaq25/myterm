// Karşılama: 3 sayfa, her birinde örnek kart görseli. Bildirim izni ve puan
// isteği burada istenmez. Görsellerdeki değerler "örnek" diye etiketlidir.
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useRef, useState, type ReactNode } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton, Button, Sticker } from '@/components/ui';
import { t } from '@/i18n';
import { setOnboarded } from '@/lib/prefs';
import { colors, fonts, radius, space, type } from '@/theme';

type Page = { eyebrow: string; title: string; body: string; hero: () => ReactNode };

function Row({ icon, label, value, color = colors.text }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[type.label, { color: colors.text, flex: 1 }]}>{label}</Text>
      <Text style={[styles.rowValue, { color }]}>{value}</Text>
    </View>
  );
}

function Bubble({ text, mine, style }: { text: string; mine?: boolean; style?: object }) {
  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs, style]}>
      <Text style={[type.bodySm, { color: mine ? colors.onPrimary : colors.text }]}>{text}</Text>
    </View>
  );
}

const KarneHero = () => (
  <View style={styles.heroCard}>
    <Sticker text={t('onboarding.report.sticker')} rotate={8} bg={colors.cardButter} style={styles.stickerTopRight} />
    <Text style={styles.cardTitle}>{t('onboarding.report.title')}</Text>
    <View style={styles.grades}>
      {(
        [
          [t('onboarding.report.grades.interest'), '5', colors.primary],
          [t('onboarding.report.grades.speed'), '3', colors.purple],
          [t('onboarding.report.grades.humor'), '5', colors.green],
          [t('onboarding.report.grades.drama'), '2', colors.textMuted],
        ] as const
      ).map(
        ([label, grade, color]) => (
          <View key={label} style={styles.grade}>
            <Text style={[type.label, { color: colors.text }]}>{label}</Text>
            <Text style={[styles.gradeValue, { color }]}>{grade}</Text>
          </View>
        ),
      )}
    </View>
    <Row icon="⏱️" label={t('onboarding.report.avgReply')} value={t('onboarding.report.avgReplyValue')} />
    <Row icon="🌙" label={t('onboarding.report.philosophy')} value={t('onboarding.report.philosophyValue')} color={colors.purple} />
    <View style={styles.quote}>
      <Text style={[type.bodySm, { color: colors.text }]}>{t('onboarding.report.note')}</Text>
    </View>
  </View>
);

// Metinler seçili dile göre çizimde alınır.
const FUN = [
  ['liar', colors.cardCoral, -4],
  ['romantic', colors.cardPeach, 3],
  ['hints', colors.cardLilac, -2],
  ['desire', colors.cardButter, 5],
  ['manipulation', colors.lilac, -5],
  ['funniest', colors.cardMint, 2],
  ['silence', colors.cardLilac, -3],
  ['nightOwl', colors.cardPeach, 4],
] as const;

const FunHero = () => (
  <View style={styles.heroCard}>
    <Sticker text={t('onboarding.fun.sticker')} rotate={-7} bg={colors.cardMint} style={styles.stickerTopRight} />
    <Text style={styles.cardTitle}>{t('onboarding.fun.title')}</Text>
    <View style={styles.chips}>
      {FUN.map(([key, bg, r]) => (
        <Sticker key={key} text={t(`onboarding.fun.chips.${key}`)} rotate={r} bg={bg} />
      ))}
    </View>
  </View>
);

const EvidenceHero = () => (
  <View style={styles.heroCard}>
    <Sticker text={t('onboarding.evidence.sticker')} rotate={6} bg={colors.cardButter} style={styles.stickerTopRight} />
    <Text style={styles.cardTitle}>{t('onboarding.evidence.title')}</Text>
    <View style={{ gap: space.sm, marginTop: space.sm }}>
      <Bar label={t('onboarding.evidence.starter')} left={t('onboarding.evidence.you')} right={t('onboarding.evidence.them')} pct={72} />
    </View>
    <View style={styles.quote}>
      <Text style={[type.label, { color: colors.text }]}>{t('onboarding.evidence.quote')}</Text>
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('onboarding.evidence.quoteTime')}</Text>
      <Text style={[type.bodySm, { color: colors.text }]}>{t('onboarding.evidence.quoteNote')}</Text>
    </View>
  </View>
);

function Bar({ label, left, right, pct }: { label: string; left: string; right: string; pct: number }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={[type.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <View style={styles.barLegend}>
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('onboarding.evidence.share', { name: left, pct })}</Text>
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('onboarding.evidence.share', { name: right, pct: 100 - pct })}</Text>
      </View>
    </View>
  );
}

const MilaHero = () => (
  <View style={styles.heroCard}>
    <Sticker text={t('onboarding.mila.sticker')} rotate={7} bg={colors.lilac} style={styles.stickerTopRight} />
    <Text style={styles.cardTitle}>{t('onboarding.mila.title')}</Text>
    <View style={{ gap: space.sm, marginTop: space.sm }}>
      <Bubble mine text={t('onboarding.mila.ask')} />
      <Bubble text={t('onboarding.mila.answer')} />
      <Bubble mine text={t('onboarding.mila.roleplay')} />
    </View>
  </View>
);

// Sayfalar çizimde kurulur ki metin seçili dili izlesin.
const HEROES = { report: KarneHero, fun: FunHero, evidence: EvidenceHero, mila: MilaHero } as const;
const pages = (): Page[] =>
  (Object.keys(HEROES) as (keyof typeof HEROES)[]).map((k) => ({
    eyebrow: t(`onboarding.pages.${k}.eyebrow`),
    title: t(`onboarding.pages.${k}.title`),
    body: t(`onboarding.pages.${k}.body`),
    hero: HEROES[k],
  }));

export default function Karsilama() {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const list = useRef<FlatList<Page>>(null);
  const PAGES = pages();

  const goTo = (i: number) => {
    list.current?.scrollToIndex({ index: i });
    setPage(i);
  };

  const next = () => {
    if (page < PAGES.length - 1) goTo(page + 1);
    else {
      setOnboarded();
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>{page > 0 ? <BackButton onPress={() => goTo(page - 1)} /> : <View style={{ height: 40 }} />}</View>
      <FlatList
        ref={list}
        data={PAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.title}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.page, { width }]}>
            <item.hero />
            <Text style={styles.eyebrow}>{item.eyebrow}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.dots}>
          {PAGES.map((p, i) => (
            <View key={p.title} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <Button label={page === PAGES.length - 1 ? t('onboarding.start') : t('onboarding.next')} onPress={next} icon={<ArrowRight color="#fff" size={20} />} />
        <Text style={[styles.small, page !== PAGES.length - 1 && { opacity: 0 }]}>
          {t('onboarding.footnote')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  top: { paddingHorizontal: space.lg, paddingTop: space.sm },
  page: { flex: 1, paddingHorizontal: space.lg, justifyContent: 'center', gap: space.sm },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 1.5, color: colors.primary, marginTop: space.md },
  title: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 40, letterSpacing: -1, color: colors.text },
  body: { ...type.body, color: colors.textMuted },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.xs,
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  stickerTopRight: { position: 'absolute', top: -14, right: 12, zIndex: 2 },
  cardKicker: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 1.2, color: colors.textMuted },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  grades: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginVertical: space.sm },
  grade: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceLow, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  gradeValue: { fontFamily: fonts.extrabold, fontSize: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surfaceLow, borderRadius: radius.sm, padding: space.sm, marginTop: 6 },
  rowIcon: { fontSize: 18 },
  rowValue: { fontFamily: fonts.extrabold, fontSize: 14 },
  quote: { backgroundColor: colors.surfaceMid, borderRadius: radius.sm, padding: space.sm, marginTop: 6 },
  track: { height: 12, borderRadius: 6, backgroundColor: colors.lilac, overflow: 'hidden' },
  fill: { height: 12, borderRadius: 6, backgroundColor: colors.coral },
  barLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  bubble: { maxWidth: '85%', borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 12 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.surfaceMid, borderBottomLeftRadius: 6 },
  footer: { padding: space.lg, gap: space.md },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.outline },
  dotActive: { width: 24, backgroundColor: colors.primary },
  small: { ...type.bodySm, color: colors.textMuted, textAlign: 'center' },
});
