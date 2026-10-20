// Karşılama: 3 sayfa, her birinde örnek kart görseli. Bildirim izni ve puan
// isteği burada istenmez. Görsellerdeki değerler "örnek" diye etiketlidir.
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useRef, useState, type ReactNode } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton, Button, Sticker } from '@/components/ui';
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
    <Sticker text="🏅 TAKDİR BELGESİ" rotate={8} bg={colors.cardButter} style={styles.stickerTopRight} />
    <Text style={styles.cardTitle}>Sohbet Karnesi</Text>
    <View style={styles.grades}>
      {([['İlgi', '5', colors.primary], ['Hız', '3', colors.purple], ['Espri', '5', colors.green], ['Trip', '2', colors.textMuted]] as const).map(
        ([label, grade, color]) => (
          <View key={label} style={styles.grade}>
            <Text style={[type.label, { color: colors.text }]}>{label}</Text>
            <Text style={[styles.gradeValue, { color }]}>{grade}</Text>
          </View>
        ),
      )}
    </View>
    <Row icon="⏱️" label="Ortalama cevap" value="2 dk" />
    <Row icon="🌙" label="02:00 sonrası felsefe" value="Aşırı yüksek" color={colors.purple} />
    <View style={styles.quote}>
      <Text style={[type.bodySm, { color: colors.text }]}>💬 Bilirkişi notu: “Trip seviyesi zararsız dozda.”</Text>
    </View>
  </View>
);

const FUN = [
  ['🤥 Kim daha çok yalan söylüyor?', colors.cardCoral, -4],
  ['💘 Kim daha romantik?', colors.cardPeach, 3],
  ['🙄 İmalı mesajlar', colors.cardLilac, -2],
  ['🔥 Arzu ölçer', colors.cardButter, 5],
  ['🕵️ Manipülasyon radarı', colors.lilac, -5],
  ['😂 En komik mesaj', colors.cardMint, 2],
  ['👻 En uzun sessizlik', colors.cardLilac, -3],
  ['🦉 Gece kuşu kim?', colors.cardPeach, 4],
] as const;

const FunHero = () => (
  <View style={styles.heroCard}>
    <Sticker text="👀 SIRLAR ÇÖZÜLÜYOR" rotate={-7} bg={colors.cardMint} style={styles.stickerTopRight} />
    <Text style={styles.cardTitle}>Kim daha çok…?</Text>
    <View style={styles.chips}>
      {FUN.map(([t, bg, r]) => (
        <Sticker key={t} text={t} rotate={r} bg={bg} />
      ))}
    </View>
  </View>
);

const EvidenceHero = () => (
  <View style={styles.heroCard}>
    <Sticker text="🔍 KANITLI" rotate={6} bg={colors.cardButter} style={styles.stickerTopRight} />
    <Text style={styles.cardTitle}>Kim daha çok çabalıyor?</Text>
    <View style={{ gap: space.sm, marginTop: space.sm }}>
      <Bar label="Sohbeti kim başlatıyor?" left="Sen" right="O" pct={72} />
    </View>
    <View style={styles.quote}>
      <Text style={[type.label, { color: colors.text }]}>“Tamam.”</Text>
      <Text style={[type.caption, { color: colors.textMuted }]}>16.10 · 23:48</Text>
      <Text style={[type.bodySm, { color: colors.text }]}>Noktalı “Tamam.” Türkçede pek iyiye işaret değil 😬</Text>
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
        <Text style={[type.caption, { color: colors.textMuted }]}>{left} %{pct}</Text>
        <Text style={[type.caption, { color: colors.textMuted }]}>{right} %{100 - pct}</Text>
      </View>
    </View>
  );
}

const MilaHero = () => (
  <View style={styles.heroCard}>
    <Sticker text="💬 AI KOÇ" rotate={7} bg={colors.lilac} style={styles.stickerTopRight} />
    <Text style={styles.cardTitle}>Sor ya da rol yaptır</Text>
    <View style={{ gap: space.sm, marginTop: space.sm }}>
      <Bubble mine text="Bana ilgisi var mı? 🤔" />
      <Bubble text="Sohbeti sen başlatıyorsun ama o da uzun cevaplar yazıyor; bu iyi bir işaret olabilir 💬" />
      <Bubble mine text="Sevgilim gibi cevap ver, barışmayı prova edelim 💘" />
    </View>
  </View>
);

const PAGES: Page[] = [
  {
    eyebrow: '✨ MERAK EDİLENLER MASADA',
    title: 'Sohbetinin\nkarnesini al',
    body: 'WhatsApp veya Telegram sohbetini yükle; kim ne kadar ilgili, kim trip atıyor, hepsi ortaya çıksın.',
    hero: KarneHero,
  },
  {
    eyebrow: '🤫 SATIR ARALARI',
    title: 'Sohbetinde\nneler saklı?',
    body: 'Yalan ölçer, romantiklik, imalı mesajlar, arzu ölçer, manipülasyon radarı ve daha fazlası. Arkadaşlarınla paylaşmalık kartlar.',
    hero: FunHero,
  },
  {
    eyebrow: '🔍 KANITIYLA',
    title: 'Laf değil,\nalıntı',
    body: 'Her yorumun altında sohbetinden gerçek mesaj, tarihiyle birlikte. Kim çabalıyor, kim bekletiyor, kim soğudu; görerek anla.',
    hero: EvidenceHero,
  },
  {
    eyebrow: '💬 MİLA',
    title: 'Ne yazacağını\nbilemedin mi?',
    body: 'Mila sohbetini okur, sana özel cevap önerir. İstersen sevgilin, crush’ın ya da eski sevgilin gibi konuşup prova ettirir.',
    hero: MilaHero,
  },
];

export default function Karsilama() {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const list = useRef<FlatList<Page>>(null);

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
        <Button label={page === PAGES.length - 1 ? 'Başla' : 'Devam'} onPress={next} icon={<ArrowRight color="#fff" size={20} />} />
        <Text style={[styles.small, page !== PAGES.length - 1 && { opacity: 0 }]}>
          Reklam yok. Jeton yok. Tüm özellikler tek pakette.
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
