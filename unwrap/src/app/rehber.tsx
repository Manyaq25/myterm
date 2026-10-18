// Dışa aktarma rehberi: iPhone / Android / Telegram adımları.
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors, fonts, radius, space, type } from '@/theme';

type Tab = 'iphone' | 'android' | 'telegram';

const STEPS: Record<Tab, { title: string; text: string }[]> = {
  iphone: [
    { title: 'Sohbeti aç ve kişinin adına dokun', text: 'WhatsApp\'ta analiz etmek istediğin sohbete gir, en üstteki isme dokun.' },
    { title: 'En alta kaydır', text: 'Kişi bilgileri sayfasının en altına in.' },
    { title: '"Sohbeti Dışa Aktar"a dokun', text: 'Kırmızı yazılı seçeneklerin üstünde durur.' },
    { title: '"Medya Olmadan" seç', text: 'Fotoğraflara ihtiyacımız yok; dosya küçük olur, analiz hızlanır.' },
    { title: '"Dosyalara Kaydet", sonra Unwrap\'te "Dosya seç"', text: 'Paylaşım menüsünden Dosyalar\'a kaydet. Ardından buraya dönüp kaydettiğin .zip dosyasını seç.' },
  ],
  android: [
    { title: 'Sohbeti aç, sağ üstteki ⋮ menüsüne dokun', text: 'WhatsApp\'ta analiz etmek istediğin sohbete gir.' },
    { title: '"Diğer"e dokun', text: 'Menünün en altında durur.' },
    { title: '"Sohbeti dışa aktar"ı seç', text: '' },
    { title: '"Medya olmadan" seç', text: 'Dosya küçük olur, analiz hızlanır.' },
    { title: 'Dosyayı kaydet, sonra Unwrap\'te "Dosya seç"', text: 'Paylaşım menüsünden "Dosyalara kaydet" ya da Drive\'a kaydet; ardından .txt dosyasını seç.' },
  ],
  telegram: [
    { title: 'Bilgisayarda Telegram Desktop\'ı aç', text: 'Telegram\'ın telefon uygulaması sohbet dışa aktarmıyor; bu yalnızca bilgisayar uygulamasında var.' },
    { title: 'Sohbeti aç, sağ üstteki ⋮ menüsüne tıkla', text: '' },
    { title: '"Sohbet geçmişini dışa aktar"', text: 'Fotoğraf ve videoların işaretini kaldır.' },
    { title: 'Biçim olarak "JSON" seç', text: 'Ardından "Dışa aktar"a tıkla; result.json dosyası oluşur.' },
    { title: 'Dosyayı telefonuna gönder, Unwrap\'te "Dosya seç"', text: 'Kendine e-postayla ya da Drive ile gönder, sonra result.json dosyasını seç.' },
  ],
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'iphone', label: 'iPhone' },
  { id: 'android', label: 'Android' },
  { id: 'telegram', label: 'Telegram' },
];

export default function Rehber() {
  const [tab, setTab] = useState<Tab>('iphone');
  const [step, setStep] = useState(0);
  const steps = STEPS[tab];
  const current = steps[step];
  const last = step === steps.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>● DIŞA AKTARMA REHBERİ</Text>
        <Pressable accessibilityLabel="Kapat" onPress={() => router.back()} style={styles.close}>
          <X color={colors.text} size={20} />
        </Pressable>
      </View>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => {
              setTab(t.id);
              setStep(0);
            }}
            style={[styles.tab, tab === t.id && styles.tabActive]}>
            <Text style={[type.label, { color: tab === t.id ? '#fff' : colors.text }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.progress}>
          {steps.map((s, i) => (
            <View key={s.title} style={[styles.seg, i <= step && styles.segActive]} />
          ))}
          <Text style={styles.stepNo}>Adım {step + 1} / {steps.length}</Text>
        </View>
        <Text style={styles.title}>{current.title}</Text>
        {current.text ? <Text style={[type.body, { color: colors.textMuted }]}>{current.text}</Text> : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label={last ? 'Anladım' : 'Sonraki'}
          variant="coral"
          onPress={() => (last ? router.back() : setStep(step + 1))}
        />
        {step > 0 ? <Button label="Geri" variant="ghost" onPress={() => setStep(step - 1)} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: space.lg },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 1, color: colors.primary },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: space.lg, backgroundColor: colors.surfaceMid, borderRadius: radius.pill, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  tabActive: { backgroundColor: colors.black },
  body: { padding: space.lg, gap: space.md },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  seg: { width: 10, height: 6, borderRadius: 3, backgroundColor: colors.surfaceHigh },
  segActive: { width: 28, backgroundColor: colors.primary },
  stepNo: { ...type.label, color: colors.primary, marginLeft: 'auto' },
  title: { ...type.headline, color: colors.text },
  footer: { padding: space.lg, gap: space.sm },
});
