// Ana sayfa: sohbet yükle + geçmiş analizler.
import * as DocumentPicker from 'expo-document-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Pill, Sticker } from '@/components/ui';
import { locale, t } from '@/i18n';
import { weeklyCount } from '@/lib/ai/api';
import { importChatFile, importErrorText } from '@/lib/chat/import';
import { isRomantic, relationLabel } from '@/lib/relations';
import { listAnalyses, type AnalysisSummary, type Relation } from '@/lib/store';
import { colors, fonts, radius, space, type } from '@/theme';

// Filtreler: metin seçili dile göre, her çizimde kurulur.
const filters = (): { id: 'hepsi' | Relation; label: string; emoji: string }[] => [
  { id: 'hepsi', label: t('home.filters.hepsi'), emoji: '✨' },
  { id: 'sevgili', label: t('home.filters.sevgili'), emoji: '💖' },
  { id: 'arkadas', label: t('home.filters.arkadas'), emoji: '🤝' },
  { id: 'aile', label: t('home.filters.aile'), emoji: '🏡' },
  { id: 'grup', label: t('home.filters.grup'), emoji: '⚡' },
];


export default function Home() {
  const [items, setItems] = useState<AnalysisSummary[]>([]);
  const [filter, setFilter] = useState<'hepsi' | Relation>('hepsi');
  const [busy, setBusy] = useState(false);
  const [weekly, setWeekly] = useState<number | null>(null);

  useEffect(() => {
    weeklyCount().then(setWeekly);
  }, []);

  useFocusEffect(useCallback(() => setItems(listAnalyses()), []));

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (res.canceled) return;
    const asset = res.assets[0];
    setBusy(true);
    try {
      const id = await importChatFile(asset.uri, asset.name);
      router.push({ pathname: '/analiz/kurulum', params: { id } });
    } catch (e) {
      Alert.alert(t('home.readError'), importErrorText(e));
    } finally {
      setBusy(false);
    }
  };

  const shown = items.filter((a) =>
    filter === 'hepsi' ? true : filter === 'sevgili' ? isRomantic(a.relation) : filter === 'arkadas' ? a.relation === 'arkadas' || a.relation === 'bestie' : a.relation === filter,
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>✦ Unwrap</Text>

        <Text style={styles.heroTitle}>{t('home.title')}</Text>
        <View style={styles.tiles}>
          <Pressable onPress={() => router.push('/rehber')} style={[styles.tile, { backgroundColor: colors.cardMint }]}>
            <Sticker text={t('home.easiest')} rotate={-6} bg={colors.surface} style={styles.tileSticker} />
            <Text style={styles.tileEmoji}>💬</Text>
            <Text style={styles.tileTitle}>{t('home.waTitle')}</Text>
            <Text style={styles.tileText}>{t('home.waText')}</Text>
          </Pressable>
          <Pressable onPress={pick} disabled={busy} style={[styles.tile, { backgroundColor: colors.cardLilac }]}>
            <Text style={styles.tileEmoji}>{busy ? '⏳' : '📂'}</Text>
            <Text style={styles.tileTitle}>{busy ? t('home.opening') : t('home.pickFile')}</Text>
            <Text style={styles.tileText}>{t('home.pickText')}</Text>
          </Pressable>
        </View>
        <Text style={styles.privacy}>{t('home.privacy')}</Text>

        <Text style={styles.counter}>{t('home.weekly', { count: weekly == null ? '– –' : weekly.toLocaleString(locale()) })}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {filters().map((f) => (
            <Pill key={f.id} label={f.label} emoji={f.emoji} active={filter === f.id} onPress={() => setFilter(f.id)} />
          ))}
        </ScrollView>

        <Text style={styles.section}>{t('home.section')}</Text>
        {shown.length === 0 ? (
          <Card>
            <Text style={[type.body, { color: colors.textMuted }]}>
              {t('home.empty')}
            </Text>
          </Card>
        ) : (
          shown.map((a) => (
            <Pressable key={a.id} onPress={() => router.push({ pathname: '/analiz/[id]', params: { id: a.id } })}>
              <Card style={styles.item}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{a.title.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[type.title, { color: colors.text }]} numberOfLines={1}>
                    {a.title}
                  </Text>
                  <Text style={[type.caption, { color: colors.textMuted }]}>
                    {relationLabel(a.relation)} · {new Date(a.createdAt).toLocaleDateString(locale(), { day: 'numeric', month: 'long' })} ·{' '}
                    {t('home.messages', { count: a.totalMessages.toLocaleString(locale()) })}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl },
  logo: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.text },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, borderRadius: radius.lg, padding: space.md, gap: 6, minHeight: 150 },
  tileSticker: { position: 'absolute', top: -10, right: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tileEmoji: { fontSize: 28 },
  tileTitle: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.text },
  tileText: { ...type.caption, color: colors.textMuted },
  heroTitle: { ...type.headline, color: colors.text },
  privacy: { ...type.caption, color: colors.textMuted, textAlign: 'center' },
  counter: { ...type.label, color: colors.textMuted, textAlign: 'center' },
  section: { ...type.title, color: colors.text, marginTop: space.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.cardCoral, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.primary },
});
