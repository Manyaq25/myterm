// Analiz ayarları: "Sen hangisisin?" ve "Bu kişi senin neyin?"
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton, Button, Note, Pill } from '@/components/ui';
import { t } from '@/i18n';
import { RELATIONS } from '@/lib/relations';
import { getAnalysis, updateAnalysis, type Relation } from '@/lib/store';
import { colors, fonts, space, type } from '@/theme';

export default function Kurulum() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const analysis = useMemo(() => getAnalysis(id), [id]);
  const isGroup = analysis?.relation === 'grup';
  const [step, setStep] = useState<1 | 2>(1);
  const [me, setMe] = useState<string | null>(null);
  const [relation, setRelation] = useState<Relation | null>(null);

  if (!analysis) return null;
  const totalSteps = isGroup ? 1 : 2;

  const finish = (rel: Relation | null) => {
    updateAnalysis(id, { me, relation: isGroup ? 'grup' : rel });
    router.replace({ pathname: '/analiz/[id]', params: { id } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <BackButton onPress={() => (step === 2 ? setStep(1) : router.back())} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{t('setup.eyebrow', { step, total: totalSteps })}</Text>
        {step === 1 ? (
          <>
            <Text style={styles.title}>{t('setup.meTitle')}</Text>
            <Text style={[type.body, { color: colors.textMuted }]}>
              {t('setup.meText')}
            </Text>
            <View style={styles.grid}>
              {analysis.participants.slice(0, 12).map((p) => (
                <Pill key={p} label={p} active={me === p} onPress={() => setMe(p)} />
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>{t('setup.relTitle')}</Text>
            <Text style={[type.body, { color: colors.textMuted }]}>
              {t('setup.relText')}
            </Text>
            <View style={styles.grid}>
              {RELATIONS.map((r) => (
                <Pill key={r.id} label={r.label} emoji={r.emoji} active={relation === r.id} onPress={() => setRelation(r.id)} />
              ))}
            </View>
          </>
        )}
        <Note icon="🔒" title={t('setup.privacyTitle')} text={t('setup.privacyText')} />
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label={t('setup.continue')}
          variant="coral"
          disabled={step === 1 ? !me : !relation}
          icon={<ArrowRight color="#fff" size={20} />}
          onPress={() => (step === 1 && !isGroup ? setStep(2) : finish(relation))}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  top: { paddingHorizontal: space.lg, paddingTop: space.sm },
  content: { padding: space.lg, gap: space.md },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 1, color: colors.primary },
  title: { ...type.headline, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginVertical: space.sm },
  footer: { padding: space.lg },
});
