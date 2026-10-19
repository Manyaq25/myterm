// Ana sayfa: sohbet yükle + geçmiş analizler.
import * as DocumentPicker from 'expo-document-picker';
import { router, useFocusEffect } from 'expo-router';
import { BookOpen, Plus } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Pill } from '@/components/ui';
import { weeklyCount } from '@/lib/ai/api';
import { importChatFile, importErrorText } from '@/lib/chat/import';
import { relationLabel } from '@/lib/relations';
import { listAnalyses, type AnalysisSummary, type Relation } from '@/lib/store';
import { colors, fonts, radius, space, type } from '@/theme';

const FILTERS: { id: 'hepsi' | Relation; label: string; emoji: string }[] = [
  { id: 'hepsi', label: 'Hepsi', emoji: '✨' },
  { id: 'sevgili', label: 'İlişki', emoji: '💖' },
  { id: 'arkadas', label: 'Arkadaş', emoji: '🤝' },
  { id: 'aile', label: 'Aile', emoji: '🏡' },
  { id: 'grup', label: 'Grup', emoji: '⚡' },
];
const ROMANTIC: Relation[] = ['sevgili', 'es', 'flort', 'eski'];


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
      Alert.alert('Dosya okunamadı', importErrorText(e));
    } finally {
      setBusy(false);
    }
  };

  const shown = items.filter((a) =>
    filter === 'hepsi' ? true : filter === 'sevgili' ? ROMANTIC.includes(a.relation as Relation) : a.relation === filter,
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>✦ Unwrap</Text>

        <View style={styles.hero}>
          <Text style={styles.badge}>✨ Yapay Zekâ Destekli</Text>
          <Text style={styles.heroTitle}>Bir sohbet yükle</Text>
          <Text style={[type.body, { color: colors.textMuted }]}>
            WhatsApp veya Telegram sohbetini aktar, tüm gerçekler tatlı dille açılsın.
          </Text>
          <Button label="Dosya seç" variant="coral" loading={busy} onPress={pick} icon={<Plus color="#fff" size={20} />} />
          <Pressable onPress={() => router.push('/rehber')} style={styles.guideLink}>
            <BookOpen color={colors.primary} size={16} />
            <Text style={[type.label, { color: colors.primary }]}>Sohbet nasıl dışa aktarılır?</Text>
          </Pressable>
          <Text style={styles.privacy}>🔒 İstatistikler telefonunda hesaplanır. Sohbetin sunucularda saklanmaz.</Text>
        </View>

        <Text style={styles.counter}>Bu hafta {weekly == null ? '– –' : weekly.toLocaleString('tr-TR')} sohbet analiz edildi</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {FILTERS.map((f) => (
            <Pill key={f.id} label={f.label} emoji={f.emoji} active={filter === f.id} onPress={() => setFilter(f.id)} />
          ))}
        </ScrollView>

        <Text style={styles.section}>Analizlerin</Text>
        {shown.length === 0 ? (
          <Card>
            <Text style={[type.body, { color: colors.textMuted }]}>
              Henüz analiz yok. İlk sohbetini yükle, kartların birkaç saniyede hazır olsun.
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
                    {relationLabel(a.relation)} · {new Date(a.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} ·{' '}
                    {a.totalMessages.toLocaleString('tr-TR')} mesaj
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
  hero: { backgroundColor: colors.cardPeach, borderRadius: radius.lg, padding: space.lg, gap: space.md },
  badge: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  heroTitle: { ...type.headline, color: colors.text },
  guideLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  privacy: { ...type.caption, color: colors.textMuted, textAlign: 'center' },
  counter: { ...type.label, color: colors.textMuted, textAlign: 'center' },
  section: { ...type.title, color: colors.text, marginTop: space.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.cardCoral, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.primary },
});
