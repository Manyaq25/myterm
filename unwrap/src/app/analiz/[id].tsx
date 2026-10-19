// Hikâye görüntüleyici: kartlar arasında dokunarak geçilir, her kart resim
// olarak paylaşılabilir.
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { Share2, X } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { StoryCard } from '@/components/StoryCard';
import { Button, useTopInset } from '@/components/ui';
import { buildFreeCards } from '@/lib/cards/free';
import { isPro } from '@/lib/purchases';
import { getAnalysis } from '@/lib/store';
import { colors, radius, space, type } from '@/theme';

export default function Hikaye() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const analysis = useMemo(() => getAnalysis(id), [id]);
  const cards = useMemo(() => (analysis ? buildFreeCards(analysis.stats, analysis.relation) : []), [analysis]);
  const [index, setIndex] = useState(0);
  const shot = useRef<View>(null);
  const topInset = useTopInset();

  if (!analysis || !cards.length) return null;
  const card = cards[index];
  const isTeaser = card.kind === 'teaser';

  const openFull = async () => {
    if (analysis.report || (await isPro())) router.push({ pathname: '/analiz/rapor/[id]', params: { id: analysis.id } });
    else router.push({ pathname: '/pro', params: { id: analysis.id } });
  };

  const go = (delta: number) => setIndex((i) => Math.min(cards.length - 1, Math.max(0, i + delta)));

  const share = async () => {
    try {
      const uri = await captureRef(shot, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Hikâyeyi paylaş' });
    } catch {
      Alert.alert('Paylaşılamadı', 'Kart resmi oluşturulamadı, tekrar dener misin?');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: topInset }]} edges={['bottom', 'left', 'right']}>
      <View style={styles.top}>
        <View style={styles.bars}>
          {cards.map((c, i) => (
            <View key={c.id} style={[styles.bar, i <= index && styles.barActive]} />
          ))}
        </View>
        <Pressable accessibilityLabel="Kapat" onPress={() => router.back()} style={styles.close}>
          <X color={colors.text} size={20} />
        </Pressable>
      </View>

      <View style={styles.stage}>
        <View ref={shot} collapsable={false} style={styles.shot}>
          <StoryCard card={card} />
        </View>
        {/* Sol / sağ dokunma alanları */}
        <Pressable style={[styles.tapZone, { left: 0 }]} onPress={() => go(-1)} accessibilityLabel="Önceki kart" />
        <Pressable style={[styles.tapZone, { right: 0 }]} onPress={() => go(1)} accessibilityLabel="Sonraki kart" />
      </View>

      <View style={styles.footer}>
        {isTeaser ? (
          <>
            <Button label="Tam raporu aç" variant="coral" onPress={openFull} />
            <Text style={styles.small}>Ücretsiz denemeyle başla · İstediğin an iptal</Text>
          </>
        ) : (
          <Button label="Hikâyeyi paylaş" onPress={share} icon={<Share2 color="#fff" size={20} />} />
        )}
        <Text style={styles.small}>Ücretsiz · {index + 1} / {cards.length}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingTop: space.sm },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceHigh },
  barActive: { backgroundColor: colors.primary },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  stage: { flex: 1, padding: space.md },
  shot: { flex: 1, borderRadius: radius.lg, overflow: 'hidden' },
  tapZone: { position: 'absolute', top: 0, bottom: 0, width: '35%' },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.sm },
  small: { ...type.caption, color: colors.textMuted, textAlign: 'center' },
});
