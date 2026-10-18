// Analiz ayarları: "Sen hangisisin?" ve "Bu kişi senin neyin?"
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Note, Pill } from '@/components/ui';
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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>● ANALİZ AYARLARI · {step} / {totalSteps}</Text>
        {step === 1 ? (
          <>
            <Text style={styles.title}>Bu sohbette sen hangisisin?</Text>
            <Text style={[type.body, { color: colors.textMuted }]}>
              Önerileri ve “ne yazmalı” kısmını senin açından hazırlayacağız.
            </Text>
            <View style={styles.grid}>
              {analysis.participants.slice(0, 12).map((p) => (
                <Pill key={p} label={p} active={me === p} onPress={() => setMe(p)} />
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Bu kişi senin neyin?</Text>
            <Text style={[type.body, { color: colors.textMuted }]}>
              Kartların dilini ve yorumların tonunu buna göre ayarlayacağız.
            </Text>
            <View style={styles.grid}>
              {RELATIONS.map((r) => (
                <Pill key={r.id} label={r.label} emoji={r.emoji} active={relation === r.id} onPress={() => setRelation(r.id)} />
              ))}
            </View>
          </>
        )}
        <Note icon="🔒" title="İstatistikler telefonunda hesaplanır." text="Yapay zekâ yorumu için seçilen mesajlar şifreli gönderilir ve saklanmaz." />
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="Devam et"
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
  content: { padding: space.lg, gap: space.md },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 1, color: colors.primary },
  title: { ...type.headline, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginVertical: space.sm },
  footer: { padding: space.lg },
});
