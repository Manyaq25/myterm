// Karşılama: 3 sayfa. Bildirim izni ve puan isteği burada istenmez.
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { setOnboarded } from '@/lib/prefs';
import { colors, fonts, radius, space, type } from '@/theme';

type Page = { eyebrow: string; title: string; body: string; grades?: [string, string, string][] };

const PAGES: Page[] = [
  {
    eyebrow: '✨ MERAK EDİLENLER MASADA',
    title: 'Sohbetinin\nkarnesini al',
    body: 'WhatsApp veya Telegram sohbetini yükle, kim ne kadar ilgili, kim trip atıyor, hepsi ortaya çıksın.',
    grades: [['İlgi', '5', colors.primary], ['Hız', '3', colors.purple], ['Espri', '5', colors.green], ['Trip', '2', colors.textMuted]],
  },
  {
    eyebrow: '🔒 GİZLİLİK',
    title: 'İstatistiklerin\nbedava',
    body: 'Kim çok yazıyor, kim bekletiyor, en uzun sessizlik… Hepsi telefonunda hesaplanır, hesap açmana gerek yok.',
  },
  {
    eyebrow: '💸 DÜRÜST FİYAT',
    title: 'Tek paket,\nher şey dahil',
    body: 'Yapay zekâ analizi, kanıtlı eğlenceli kartlar ve koçun Mila tek pakette. Önce 7 gün ücretsiz dene.',
  },
];

export default function Karsilama() {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const list = useRef<FlatList<Page>>(null);

  const next = () => {
    if (page < PAGES.length - 1) {
      list.current?.scrollToIndex({ index: page + 1 });
      setPage(page + 1);
    } else {
      setOnboarded();
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
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
            <Text style={styles.eyebrow}>{item.eyebrow}</Text>
            <Text style={styles.title}>{item.title}</Text>
            {item.grades ? (
              <View style={styles.grades}>
                {item.grades.map(([label, grade, color]) => (
                  <View key={label} style={styles.grade}>
                    <Text style={[type.label, { color: colors.text }]}>{label}</Text>
                    <Text style={[styles.gradeValue, { color }]}>{grade}</Text>
                  </View>
                ))}
              </View>
            ) : null}
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
        <Text style={styles.small}>Reklam yok. Jeton yok. Tek fiyat.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, paddingHorizontal: space.lg, justifyContent: 'center', gap: space.md },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 1.5, color: colors.primary },
  title: { ...type.display, color: colors.text },
  body: { ...type.body, color: colors.textMuted },
  grades: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginVertical: space.sm },
  grade: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10 },
  gradeValue: { fontFamily: fonts.extrabold, fontSize: 20 },
  footer: { padding: space.lg, gap: space.md },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.outline },
  dotActive: { width: 24, backgroundColor: colors.primary },
  small: { ...type.bodySm, color: colors.textMuted, textAlign: 'center' },
});
