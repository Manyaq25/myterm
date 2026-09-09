import { useMemo, useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { markOnboardingSeen } from '../src/services/onboarding';
import { Button } from '../src/components/Button';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  icon: string;
  text: string;
}

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const router = useRouter();
  const { t } = useTranslation();
  const SLIDES: Slide[] = [
    { icon: '🧭', text: t('onboarding.slide1') },
    { icon: '🎙️ 📝 🖼️ 📄', text: t('onboarding.slide2') },
    { icon: '🔒', text: t('onboarding.slide3') },
  ];
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const totalSlides = SLIDES.length + 1;
  const isLast = index === totalSlides - 1;

  async function finish() {
    await markOnboardingSeen();
    router.back();
  }

  function goToIndex(next: number) {
    scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    setIndex(next);
  }

  function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setIndex(next);
  }

  return (
    <SafeAreaView style={styles.container}>
      {!isLast && (
        <Pressable style={styles.skipButton} onPress={finish}>
          <Text style={styles.skipButtonText}>{t('onboarding.skip')}</Text>
        </Pressable>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <Text style={styles.icon}>{slide.icon}</Text>
            <Text style={styles.text}>{slide.text}</Text>
          </View>
        ))}
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
          <Text style={styles.icon}>👋</Text>
          <Text style={styles.title}>Synvia AI</Text>
          <Text style={styles.text}>{t('onboarding.welcomeText')}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        {isLast ? (
          <Button label={t('onboarding.start')} onPress={finish} variant="primary" />
        ) : (
          <Button label={t('onboarding.next')} onPress={() => goToIndex(index + 1)} variant="primary" />
        )}
      </View>
    </SafeAreaView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    skipButton: { position: 'absolute', top: 12, right: 20, zIndex: 1, padding: 8 },
    skipButtonText: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.textMuted },
    slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
    icon: { fontSize: 48, marginBottom: 24 },
    title: { fontSize: fontSize.title, fontFamily: fontFamily.displaySemiBold, color: colors.text, marginBottom: 10, textAlign: 'center' },
    text: { fontSize: fontSize.subtitle, fontFamily: fontFamily.displaySemiBold, color: colors.text, textAlign: 'center', lineHeight: 26 },
    footer: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.surfaceAlt },
    dotActive: { backgroundColor: colors.primary, width: 18 },
  });
}
