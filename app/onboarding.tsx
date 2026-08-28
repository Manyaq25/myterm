import { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { markOnboardingSeen } from '../src/services/onboarding';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  icon: string;
  text: string;
}

const SLIDES: Slide[] = [
  { icon: '🧭', text: 'Unutman gerekenleri değil, unutmaman gerekenleri takip eder.' },
  { icon: '🎙️ 📝 🖼️ 📄', text: 'Sesinden, notlarından, ekran görüntülerinden ve belgelerinden takip çıkarabilir.' },
  { icon: '🔒', text: 'Kontrol sende. AI hiçbir şeyi iznin olmadan takip etmek zorunda değil.' },
];

export default function OnboardingScreen() {
  const router = useRouter();
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
          <Text style={styles.skipButtonText}>Atla</Text>
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
          <Text style={styles.title}>Benim Yerime Takip Et</Text>
          <Text style={styles.text}>Hazırsan başlayabiliriz.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        {isLast ? (
          <Pressable style={styles.primaryButton} onPress={finish}>
            <Text style={styles.primaryButtonText}>Başlayalım</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.primaryButton} onPress={() => goToIndex(index + 1)}>
            <Text style={styles.primaryButtonText}>İleri</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  skipButton: { position: 'absolute', top: 12, right: 20, zIndex: 1, padding: 8 },
  skipButtonText: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  icon: { fontSize: 48, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 10, textAlign: 'center' },
  text: { fontSize: 18, fontWeight: '600', color: '#111827', textAlign: 'center', lineHeight: 26 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e5e7eb' },
  dotActive: { backgroundColor: '#2563eb', width: 18 },
  primaryButton: { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
