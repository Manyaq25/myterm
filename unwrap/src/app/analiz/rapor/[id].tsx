// Yapay zekâ raporu (Pro): kanıtlı kartlar, karne, ton, cevap önerileri ve
// kapanış kartı. Rapor bir kez üretilir ve telefonda saklanır.
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { MessageCircleHeart, Share2, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { Button, Card, Sticker, useTopInset } from '@/components/ui';
import { ApiError, errorText, requestReport } from '@/lib/ai/api';
import type { Report, ReportCard } from '@/lib/ai/types';
import { isPro } from '@/lib/purchases';
import { getAnalysis, updateAnalysis } from '@/lib/store';
import { colors, fonts, radius, space, type } from '@/theme';

const BAR_COLORS = [colors.coral, colors.purple, colors.green, colors.primary];
const CARD_BG = [colors.cardPeach, colors.cardLilac, colors.cardButter, colors.cardCoral];
const FUN = new Set(['yalan', 'manipulatif', 'arzu']);

export default function Rapor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const analysis = useMemo(() => getAnalysis(id), [id]);
  const [report, setReport] = useState<Report | undefined>(analysis?.report);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const topInset = useTopInset();

  const generate = useCallback(async () => {
    if (!analysis) return;
    setError(null);
    setLoading(true);
    try {
      if (!(await isPro())) {
        router.replace({ pathname: '/pro', params: { id } });
        return;
      }
      const r = await requestReport(analysis);
      updateAnalysis(analysis.id, { report: r });
      setReport(r);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'pro_required') router.replace({ pathname: '/pro', params: { id } });
      else setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [analysis, id]);

  useEffect(() => {
    if (!report) generate();
  }, [report, generate]);

  if (!analysis) return null;

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: topInset }]} edges={['bottom', 'left', 'right']}>
      <View style={styles.top}>
        <Text style={styles.heading} numberOfLines={1}>{analysis.title}</Text>
        <Pressable accessibilityLabel="Kapat" onPress={() => router.back()} style={styles.close} hitSlop={12}>
          <X color={colors.text} size={20} />
        </Pressable>
      </View>

      {!report ? (
        <View style={styles.center}>
          {loading ? (
            <>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[type.title, { color: colors.text, textAlign: 'center' }]}>Sohbetin okunuyor…</Text>
              <Text style={[type.bodySm, { color: colors.textMuted, textAlign: 'center' }]}>
                Kanıtları tek tek topluyoruz. Bu yaklaşık yarım dakika sürer.
              </Text>
            </>
          ) : error ? (
            <>
              <Text style={[type.body, { color: colors.text, textAlign: 'center' }]}>{error}</Text>
              <Button label="Tekrar dene" onPress={generate} />
            </>
          ) : null}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <Text style={styles.section}>ÖZET</Text>
            <Text style={[type.body, { color: colors.text }]}>{report.summary}</Text>
          </Card>

          {report.cards.map((c, i) => (
            <AiCard key={`${c.key}-${i}`} card={c} bg={CARD_BG[i % CARD_BG.length]} />
          ))}

          <Karne report={report} />

          {report.tone.length ? (
            <Card>
              <Text style={styles.section}>TON ANALİZİ</Text>
              {report.tone.map((t, i) => (
                <View key={i} style={styles.tone}>
                  <Text style={styles.quote}>“{t.quote}”</Text>
                  <Text style={[type.caption, { color: colors.textMuted }]}>{t.author}</Text>
                  <Text style={[type.bodySm, { color: colors.text }]}>{t.meaning}</Text>
                </View>
              ))}
            </Card>
          ) : null}

          {report.replies.length ? (
            <Card>
              <Text style={styles.section}>NE YAZABİLİRSİN?</Text>
              {report.replies.map((r, i) => (
                <View key={i} style={styles.reply}>
                  <Text style={[type.body, { color: colors.text }]}>{r}</Text>
                </View>
              ))}
            </Card>
          ) : null}

          <Shareable bg={colors.cardMint}>
            <Text style={styles.finaleTitle}>{report.finale.title}</Text>
            <Text style={[type.body, { color: colors.text }]}>{report.finale.text}</Text>
          </Shareable>

          <Button
            label="Bu sohbeti Mila’ya sor"
            variant="coral"
            icon={<MessageCircleHeart color="#fff" size={20} />}
            onPress={() => router.push({ pathname: '/koc', params: { id: analysis.id } })}
          />
          <Text style={styles.disclaimer}>
            Yorumlar yapay zekâ tahminidir, kesin hüküm değildir. “Yalan”, “manipülatif” ve “arzu” kartları eğlence içindir.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/** Paylaşılabilir kart: içeriği resim olarak dışa aktarılır. */
function Shareable({ bg, children }: { bg: string; children: ReactNode }) {
  const ref = useRef<View>(null);
  const share = async () => {
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Kartı paylaş' });
    } catch {
      Alert.alert('Paylaşılamadı', 'Kart resmi oluşturulamadı, tekrar dener misin?');
    }
  };
  return (
    <View>
      <View ref={ref} collapsable={false} style={[styles.shareable, { backgroundColor: bg }]}>
        {children}
        <Text style={styles.brand}>Unwrap</Text>
      </View>
      <Pressable onPress={share} style={styles.shareBtn} accessibilityLabel="Kartı paylaş">
        <Share2 color={colors.text} size={16} />
        <Text style={[type.label, { color: colors.text }]}>Paylaş</Text>
      </Pressable>
    </View>
  );
}

function AiCard({ card, bg }: { card: ReportCard; bg: string }) {
  const isPercent = card.people.some((p) => p.display.includes('%'));
  const max = Math.max(1, ...card.people.map((p) => p.value));
  return (
    <Shareable bg={bg}>
      <Text style={styles.cardTitle}>{card.title}</Text>
      {FUN.has(card.key) ? <Sticker text="😜 EĞLENCE AMAÇLI" rotate={-5} bg={colors.lilac} style={{ marginTop: -space.xs }} /> : null}
      <View style={{ gap: space.sm }}>
        {card.people.map((p, i) => (
          <View key={p.name} style={{ gap: 4 }}>
            <View style={styles.rowHead}>
              <Text style={[type.label, { color: colors.text }]}>{p.name}</Text>
              <Text style={[type.label, { color: colors.text }]}>{p.display}</Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.min(100, isPercent ? p.value : (p.value / max) * 100)}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
      <Text style={[type.body, { color: colors.text }]}>{card.caption}</Text>
      {card.evidence.map((e, i) => (
        <View key={i} style={styles.evidence}>
          <Text style={styles.quote}>“{e.quote}”</Text>
          <Text style={[type.caption, { color: colors.textMuted }]}>
            {e.author} · {e.date}
          </Text>
          {e.note ? <Text style={[type.bodySm, { color: colors.text }]}>{e.note}</Text> : null}
        </View>
      ))}
    </Shareable>
  );
}

function Karne({ report }: { report: Report }) {
  const names = report.karne.subjects[0]?.grades.map((g) => g.name) ?? [];
  if (!names.length) return null;
  return (
    <Shareable bg={colors.surface}>
      <Sticker text="🏅 TAKDİR BELGESİ" rotate={7} bg={colors.cardButter} style={{ position: 'absolute', top: -12, right: 16, zIndex: 2 }} />
      <Text style={styles.cardTitle}>Sohbet Karnesi</Text>
      <View style={styles.karneRow}>
        <Text style={[styles.karneCell, styles.karneSubject]} />
        {names.map((n) => (
          <Text key={n} style={[styles.karneCell, type.label, { color: colors.text }]} numberOfLines={1}>
            {n}
          </Text>
        ))}
      </View>
      {report.karne.subjects.map((s) => (
        <View key={s.subject} style={styles.karneRow}>
          <Text style={[styles.karneCell, styles.karneSubject, type.bodySm, { color: colors.text }]}>{s.subject}</Text>
          {names.map((n) => {
            const g = s.grades.find((x) => x.name === n)?.grade;
            return (
              <Text key={n} style={[styles.karneCell, styles.grade, { color: g != null && g >= 4 ? colors.green : g != null && g <= 2 ? colors.primary : colors.text }]}>
                {g ?? '–'}
              </Text>
            );
          })}
        </View>
      ))}
      <Text style={[type.bodySm, { color: colors.textMuted }]}>Öğretmen görüşü: {report.karne.teacherNote}</Text>
    </Shareable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.sm },
  heading: { flex: 1, fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xl },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl },
  section: { fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1, color: colors.primary, marginBottom: space.sm },
  shareable: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  brand: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.textMuted, alignSelf: 'flex-end' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingVertical: space.sm, paddingHorizontal: space.md },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, color: colors.text },
  fun: { ...type.caption, color: colors.purple, marginTop: -space.sm },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.7)', overflow: 'hidden' },
  fill: { height: 12, borderRadius: 6 },
  evidence: { backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: radius.sm, padding: space.md, gap: 2 },
  quote: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, color: colors.text },
  tone: { gap: 2, marginBottom: space.md },
  reply: { backgroundColor: colors.surfaceLow, borderRadius: radius.sm, padding: space.md, marginBottom: space.sm },
  finaleTitle: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 32, color: colors.text },
  karneRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.surfaceHigh, paddingVertical: 6 },
  karneCell: { flex: 1, textAlign: 'center' },
  karneSubject: { flex: 2, textAlign: 'left' },
  grade: { fontFamily: fonts.extrabold, fontSize: 20 },
  disclaimer: { ...type.caption, color: colors.textMuted, textAlign: 'center' },
});
