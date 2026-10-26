// Hikâye görüntüleyici: kartlar arasında dokunarak geçilir, her kart Instagram /
// TikTok hikâyesi boyutunda (9:16) resim olarak paylaşılabilir. Rapor varsa
// yapay zekâ kartları da eklenir; "oynat" ile Wrapped gibi kendiliğinden akar.
import { router, useLocalSearchParams } from 'expo-router';
import { Pause, Play, Share2, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { shareView } from '@/components/Shareable';
import { StoryCard } from '@/components/StoryCard';
import { Button, useTopInset } from '@/components/ui';
import { t } from '@/i18n';
import { buildAiCards } from '@/lib/cards/ai';
import { buildFreeCards } from '@/lib/cards/free';
import { monthCard } from '@/lib/cards/month';
import { isPro } from '@/lib/purchases';
import { getAnalysis } from '@/lib/store';
import { colors, radius, space, type } from '@/theme';

const SLIDE_MS = 4500;
const STORY_SIZE = { width: 1080, height: 1920 };

export default function Hikaye() {
  const { id, oynat } = useLocalSearchParams<{ id: string; oynat?: string }>();
  const analysis = useMemo(() => getAnalysis(id), [id]);
  const cards = useMemo(() => {
    if (!analysis) return [];
    const free = buildFreeCards(analysis.stats, analysis.relation);
    // Aylık karşılaştırma: tanıtım kartından önce (yeterli mesaj yoksa çıkmaz).
    const month = monthCard(analysis.messages);
    if (month) free.splice(Math.max(0, free.length - 1), 0, month);
    // Rapor açıldıysa Pro tanıtım kartı yerine yapay zekâ kartları gelir.
    return analysis.report ? [...free.filter((c) => c.kind !== 'teaser'), ...buildAiCards(analysis.report)] : free;
  }, [analysis]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(oynat === '1');
  const shot = useRef<View>(null);
  const topInset = useTopInset();

  // Wrapped: kartlar kendiliğinden akar, sonda durur.
  useEffect(() => {
    if (!playing) return;
    if (index >= cards.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setIndex((i) => Math.min(cards.length - 1, i + 1)), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [playing, index, cards.length]);

  if (!analysis || !cards.length) return null;
  const card = cards[index];
  const isTeaser = card.kind === 'teaser';

  const openFull = async () => {
    if (analysis.report || (await isPro())) router.push({ pathname: '/analiz/rapor/[id]', params: { id: analysis.id } });
    else router.push({ pathname: '/pro', params: { id: analysis.id } });
  };

  const go = (delta: number) => setIndex((i) => Math.min(cards.length - 1, Math.max(0, i + delta)));

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: topInset }]} edges={['bottom', 'left', 'right']}>
      <View style={styles.top}>
        <View style={styles.bars}>
          {cards.map((c, i) => (
            <View key={c.id} style={[styles.bar, i <= index && styles.barActive]} />
          ))}
        </View>
        <Pressable
          accessibilityLabel={playing ? t('story.pause') : t('story.play')}
          onPress={() => {
            if (!playing && index >= cards.length - 1) setIndex(0);
            setPlaying((p) => !p);
          }}
          style={styles.close}
        >
          {playing ? <Pause color={colors.text} size={18} /> : <Play color={colors.text} size={18} />}
        </Pressable>
        <Pressable accessibilityLabel={t('story.viewer.close')} onPress={() => router.back()} style={styles.close}>
          <X color={colors.text} size={20} />
        </Pressable>
      </View>

      <View style={styles.stage}>
        <View ref={shot} collapsable={false} style={styles.shot}>
          <StoryCard card={card} />
        </View>
        {/* Sol / sağ dokunma alanları */}
        <Pressable style={[styles.tapZone, { left: 0 }]} onPress={() => go(-1)} accessibilityLabel={t('story.viewer.prev')} />
        <Pressable style={[styles.tapZone, { right: 0 }]} onPress={() => go(1)} accessibilityLabel={t('story.viewer.next')} />
      </View>

      <View style={styles.footer}>
        {isTeaser ? (
          <>
            <Button label={t('story.viewer.openFull')} variant="coral" onPress={openFull} />
            <Text style={styles.small}>{t('story.viewer.trialNote')}</Text>
          </>
        ) : (
          <Button
            label={t('story.viewer.share')}
            onPress={() => {
              setPlaying(false);
              shareView(shot, STORY_SIZE);
            }}
            icon={<Share2 color="#fff" size={20} />}
          />
        )}
        <Text style={styles.small}>
          {t(analysis.report ? 'story.counterAll' : 'story.viewer.counter', { index: index + 1, total: cards.length })}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingTop: space.sm },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceHigh },
  barActive: { backgroundColor: colors.primary },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  stage: { flex: 1, padding: space.md, alignItems: 'center', justifyContent: 'center' },
  // Hikâye oranı (9:16): paylaşılan resim 1080×1920 olur, bozulmaz.
  shot: { height: '100%', maxWidth: '100%', aspectRatio: 9 / 16, borderRadius: radius.lg, overflow: 'hidden' },
  tapZone: { position: 'absolute', top: 0, bottom: 0, width: '35%' },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.sm },
  small: { ...type.caption, color: colors.textMuted, textAlign: 'center' },
});
