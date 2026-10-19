// Dışa aktarma rehberi: iPhone / Android / Telegram adımları.
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GuideArt, type Art } from '@/components/GuideArt';
import { BackButton, Button } from '@/components/ui';
import { colors, fonts, radius, space, type } from '@/theme';

type Tab = 'iphone' | 'android' | 'telegram';
type Step = { title: string; text: string; art: Art };

const STEPS: Record<Tab, Step[]> = {
  iphone: [
    { title: 'Sohbeti aç ve kişinin adına dokun', text: 'WhatsApp\'ta analiz etmek istediğin sohbete gir, en üstteki isme dokun.', art: { kind: 'chat', tap: 'name' } },
    {
      title: 'En alta kaydır',
      text: 'Kişi bilgileri sayfasının en altına in.',
      art: { kind: 'list', header: 'Ece ✨', rows: [{ label: 'Medya, Bağlantılar ve Belgeler' }, { label: 'Yıldızlı Mesajlar' }, { label: 'Bildirimler' }], scrollHint: true },
    },
    {
      title: '"Sohbeti Dışa Aktar"a dokun',
      text: 'Kırmızı yazılı seçeneklerin hemen üstünde durur.',
      art: { kind: 'list', rows: [{ label: 'Sohbeti Dışa Aktar', hl: true }, { label: 'Sohbeti Temizle' }, { label: 'Kişiyi Engelle', danger: true }, { label: 'Kişiyi Şikayet Et', danger: true }] },
    },
    { title: '"Medya Olmadan" seç', text: 'Fotoğraflara ihtiyacımız yok; dosya küçük olur, analiz hızlanır.', art: { kind: 'sheet', title: 'Medya eklemek sohbet dökümünü büyütür', options: ['Medya Ekle', 'Medya Olmadan'], hl: 1 } },
    {
      title: 'Paylaşım menüsünde Unwrap\'i seç',
      text: 'Sohbet doğrudan Unwrap\'te açılır. Listede yoksa sağa kaydırıp "Diğer"e dokun ya da "Dosyalara Kaydet" deyip burada "Dosya seç"e bas.',
      art: { kind: 'share', apps: [{ label: 'Mesajlar', icon: '💬' }, { label: 'Unwrap', icon: 'unwrap', hl: true }, { label: 'Mail', icon: '✉️' }, { label: 'Dosyalar', icon: '🗂️' }] },
    },
  ],
  android: [
    { title: 'Sohbeti aç, sağ üstteki ⋮ menüsüne dokun', text: 'WhatsApp\'ta analiz etmek istediğin sohbete gir.', art: { kind: 'chat', tap: 'menu' } },
    { title: '"Diğer"e dokun', text: 'Menünün en altında durur.', art: { kind: 'list', rows: [{ label: 'Kişiyi görüntüle' }, { label: 'Ara' }, { label: 'Sessize al' }, { label: 'Diğer', hl: true }] } },
    { title: '"Sohbeti dışa aktar"ı seç', text: '', art: { kind: 'list', rows: [{ label: 'Şikayet et' }, { label: 'Engelle' }, { label: 'Sohbeti temizle' }, { label: 'Sohbeti dışa aktar', hl: true }] } },
    { title: '"Medya olmadan" seç', text: 'Dosya küçük olur, analiz hızlanır.', art: { kind: 'sheet', title: 'Sohbet dışa aktarılsın mı?', options: ['Medya olmadan', 'Medyayı dahil et'], hl: 0 } },
    {
      title: 'Dosyayı kaydet, sonra Unwrap\'te "Dosya seç"',
      text: 'Paylaşım menüsünden "Dosyalara kaydet" ya da Drive\'ı seç; ardından Unwrap\'e dönüp .txt dosyasını seç.',
      art: { kind: 'share', apps: [{ label: 'Dosyalar', icon: '🗂️', hl: true }, { label: 'Drive', icon: '☁️' }, { label: 'Gmail', icon: '✉️' }] },
    },
  ],
  telegram: [
    { title: 'Bilgisayarda Telegram Desktop\'ı aç', text: 'Telegram\'ın telefon uygulaması sohbet dışa aktarmıyor; bu yalnızca bilgisayar uygulamasında var.', art: { kind: 'desktop', title: 'Telegram Desktop' } },
    { title: 'Sohbeti aç, sağ üstteki ⋮ menüsüne tıkla', text: '', art: { kind: 'desktop', title: 'Telegram Desktop', rows: ['Sessize al', 'Ara', 'Sohbet geçmişini dışa aktar'], hl: 2 } },
    { title: '"Sohbet geçmişini dışa aktar"', text: 'Fotoğraf ve videoların işaretini kaldır.', art: { kind: 'desktop', title: 'Dışa aktarma ayarları', rows: ['☐ Fotoğraflar', '☐ Videolar', '☐ Sesli mesajlar'] } },
    { title: 'Biçim olarak "JSON" seç', text: 'Ardından "Dışa aktar"a tıkla; result.json dosyası oluşur.', art: { kind: 'desktop', title: 'Biçim', rows: ['İnsan tarafından okunabilir HTML', 'Makine tarafından okunabilir JSON'], hl: 1 } },
    {
      title: 'Dosyayı telefonuna gönder, Unwrap\'te "Dosya seç"',
      text: 'Kendine e-postayla ya da Drive ile gönder, sonra result.json dosyasını seç.',
      art: { kind: 'share', apps: [{ label: 'Mail', icon: '✉️' }, { label: 'Drive', icon: '☁️' }, { label: 'Unwrap', icon: 'unwrap', hl: true }] },
    },
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
        <BackButton onPress={() => (step > 0 ? setStep(step - 1) : router.back())} />
        <Text style={[styles.eyebrow, { flex: 1 }]}>● DIŞA AKTARMA REHBERİ</Text>
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
        <View style={{ marginTop: space.sm }}>
          <GuideArt art={current.art} />
        </View>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
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
