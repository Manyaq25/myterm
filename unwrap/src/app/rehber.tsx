// Dışa aktarma rehberi: iPhone / Android / Telegram adımları.
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GuideArt, type Art } from '@/components/GuideArt';
import { BackButton, Button } from '@/components/ui';
import { t } from '@/i18n';
import { colors, fonts, radius, space, type } from '@/theme';

type Tab = 'iphone' | 'android' | 'telegram';
type Step = { title: string; text: string; art: Art };

// Adımlar seçili dilde kurulur; menü adları WhatsApp / Telegram'da görünenle aynı.
function buildSteps(): Record<Tab, Step[]> {
  const g = (k: string) => t(`guide.${k}`);
  const name = g('name');
  return {
    iphone: [
      { title: g('iphone.s1.title'), text: g('iphone.s1.text'), art: { kind: 'chat', tap: 'name' } },
      {
        title: g('iphone.s2.title'),
        text: g('iphone.s2.text'),
        art: { kind: 'list', header: `${name} ✨`, rows: [{ label: g('ios.media') }, { label: g('ios.starred') }, { label: g('ios.notifications') }], scrollHint: true },
      },
      {
        title: g('iphone.s3.title'),
        text: g('iphone.s3.text'),
        art: {
          kind: 'list',
          rows: [
            { label: g('ios.export'), hl: true },
            { label: g('ios.clear') },
            { label: t('guide.ios.block', { name }), danger: true },
            { label: t('guide.ios.report', { name }), danger: true },
          ],
        },
      },
      { title: g('iphone.s4.title'), text: g('iphone.s4.text'), art: { kind: 'sheet', title: g('ios.sheetTitle'), options: [g('ios.attach'), g('ios.without')], hl: 1 } },
      {
        title: g('iphone.s5.title'),
        text: g('iphone.s5.text'),
        art: { kind: 'share', apps: [{ label: g('ios.messages'), icon: '💬' }, { label: 'Unwrap', icon: 'unwrap', hl: true }, { label: g('ios.mail'), icon: '✉️' }, { label: g('ios.files'), icon: '🗂️' }] },
      },
    ],
    android: [
      { title: g('android.s1.title'), text: g('android.s1.text'), art: { kind: 'chat', tap: 'menu' } },
      { title: g('android.s2.title'), text: g('android.s2.text'), art: { kind: 'list', rows: [{ label: g('droid.viewContact') }, { label: g('droid.search') }, { label: g('droid.mute') }, { label: g('droid.more'), hl: true }] } },
      { title: g('android.s3.title'), text: '', art: { kind: 'list', rows: [{ label: g('droid.report') }, { label: g('droid.block') }, { label: g('droid.clear') }, { label: g('droid.export'), hl: true }] } },
      { title: g('android.s4.title'), text: g('android.s4.text'), art: { kind: 'sheet', title: g('droid.dialogTitle'), options: [g('droid.without'), g('droid.include')], hl: 0 } },
      {
        title: g('android.s5.title'),
        text: g('android.s5.text'),
        art: { kind: 'share', apps: [{ label: g('droid.files'), icon: '🗂️', hl: true }, { label: 'Drive', icon: '☁️' }, { label: 'Gmail', icon: '✉️' }] },
      },
    ],
    telegram: [
      { title: g('telegram.s1.title'), text: g('telegram.s1.text'), art: { kind: 'desktop', title: 'Telegram Desktop' } },
      { title: g('telegram.s2.title'), text: '', art: { kind: 'desktop', title: 'Telegram Desktop', rows: [g('tg.mute'), g('tg.search'), g('tg.export')], hl: 2 } },
      { title: g('telegram.s3.title'), text: g('telegram.s3.text'), art: { kind: 'desktop', title: g('tg.settings'), rows: [`☐ ${g('tg.photos')}`, `☐ ${g('tg.videos')}`, `☐ ${g('tg.voice')}`] } },
      { title: g('telegram.s4.title'), text: g('telegram.s4.text'), art: { kind: 'desktop', title: g('tg.format'), rows: [g('tg.html'), g('tg.json')], hl: 1 } },
      {
        title: g('telegram.s5.title'),
        text: g('telegram.s5.text'),
        art: { kind: 'share', apps: [{ label: g('ios.mail'), icon: '✉️' }, { label: 'Drive', icon: '☁️' }, { label: 'Unwrap', icon: 'unwrap', hl: true }] },
      },
    ],
  };
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'iphone', label: 'iPhone' },
  { id: 'android', label: 'Android' },
  { id: 'telegram', label: 'Telegram' },
];

export default function Rehber() {
  const [tab, setTab] = useState<Tab>('iphone');
  const [step, setStep] = useState(0);
  const steps = buildSteps()[tab];
  const current = steps[step];
  const last = step === steps.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BackButton onPress={() => (step > 0 ? setStep(step - 1) : router.back())} />
        <Text style={[styles.eyebrow, { flex: 1 }]}>{t('guide.eyebrow')}</Text>
        <Pressable accessibilityLabel={t('guide.close')} onPress={() => router.back()} style={styles.close}>
          <X color={colors.text} size={20} />
        </Pressable>
      </View>
      <View style={styles.tabs}>
        {TABS.map((tb) => (
          <Pressable
            key={tb.id}
            onPress={() => {
              setTab(tb.id);
              setStep(0);
            }}
            style={[styles.tab, tab === tb.id && styles.tabActive]}>
            <Text style={[type.label, { color: tab === tb.id ? '#fff' : colors.text }]}>{tb.label}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.progress}>
          {steps.map((s, i) => (
            <View key={s.title} style={[styles.seg, i <= step && styles.segActive]} />
          ))}
          <Text style={styles.stepNo}>{t('guide.stepOf', { step: step + 1, total: steps.length })}</Text>
        </View>
        <Text style={styles.title}>{current.title}</Text>
        {current.text ? <Text style={[type.body, { color: colors.textMuted }]}>{current.text}</Text> : null}
        <View style={{ marginTop: space.sm }}>
          <GuideArt art={current.art} />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label={last ? t('guide.gotIt') : t('guide.next')}
          variant="coral"
          onPress={() => (last ? router.back() : setStep(step + 1))}
        />
        {step > 0 ? <Button label={t('guide.back')} variant="ghost" onPress={() => setStep(step - 1)} /> : null}
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
