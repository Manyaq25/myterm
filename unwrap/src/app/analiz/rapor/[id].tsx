// Yapay zekâ raporu (Pro): kanıtlı kartlar, karne, ton, cevap önerileri ve
// kapanış kartı. Rapor bir kez üretilir ve telefonda saklanır.
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { MessageCircleHeart, Share2, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { ReportSheet } from '@/components/ReportSheet';
import { Button, Card, Sticker, useTopInset } from '@/components/ui';
import { t } from '@/i18n';
import { ApiError, errorText, requestReport } from '@/lib/ai/api';
import type { Report, ReportCard } from '@/lib/ai/types';
import { bump } from '@/lib/profile/activity';
import { isPro } from '@/lib/purchases';
import { getAnalysis, updateAnalysis } from '@/lib/store';
import { colors, fonts, radius, space, type } from '@/theme';

const BAR_COLORS = [colors.coral, colors.purple, colors.green, colors.primary];
const CARD_BG = [colors.cardPeach, colors.cardLilac, colors.cardButter, colors.cardCoral];
const FUN = new Set(['yalan', 'manipulatif', 'arzu']);

// Bildirime yalnız yapay zekâ metni gider (özet + kart başlık/açıklamaları; alıntılar sohbetten olduğu için gitmez).
const reportText = (r: Report) => [r.summary, ...r.cards.map((c) => `${c.title}: ${c.caption}`)].join('\n').slice(0, 2000);

export default function Rapor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const analysis = useMemo(() => getAnalysis(id), [id]);
  const [report, setReport] = useState<Report | undefined>(analysis?.report);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const topInset = useTopInset();
  const [reporting, setReporting] = useState<string | null>(null);

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

  // Rozet sayacı: rapor ekranda göründü
  useEffect(() => {
    if (report) bump('report_opened');
  }, [report]);

  if (!analysis) return null;

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: topInset }]} edges={['bottom', 'left', 'right']}>
      <View style={styles.top}>
        <Text style={styles.heading} numberOfLines={1}>{analysis.title}</Text>
        <Pressable accessibilityLabel={t('report.close')} onPress={() => router.back()} style={styles.close} hitSlop={12}>
          <X color={colors.text} size={20} />
        </Pressable>
      </View>

      {!report ? (
        <View style={styles.center}>
          {loading ? (
            <>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[type.title, { color: colors.text, textAlign: 'center' }]}>{t('report.loadingTitle')}</Text>
              <Text style={[type.bodySm, { color: colors.textMuted, textAlign: 'center' }]}>
                {t('report.loadingBody')}
              </Text>
            </>
          ) : error ? (
            <>
              <Text style={[type.body, { color: colors.text, textAlign: 'center' }]}>{error}</Text>
              <Button label={t('report.retry')} onPress={generate} />
            </>
          ) : null}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <Text style={styles.section}>{t('report.summary')}</Text>
            <Text style={[type.body, { color: colors.text }]}>{report.summary}</Text>
          </Card>

          {report.cards.map((c, i) => (
            <AiCard key={`${c.key}-${i}`} card={c} bg={CARD_BG[i % CARD_BG.length]} />
          ))}

          <Karne report={report} />

          {report.tone.length ? (
            <Card>
              <Text style={styles.section}>{t('report.tone')}</Text>
              {report.tone.map((tn, i) => (
                <View key={i} style={styles.tone}>
                  <Text style={styles.quote}>“{tn.quote}”</Text>
                  <Text style={[type.caption, { color: colors.textMuted }]}>{tn.author}</Text>
                  <Text style={[type.bodySm, { color: colors.text }]}>{tn.meaning}</Text>
                </View>
              ))}
            </Card>
          ) : null}

          {report.replies.length ? (
            <Card>
              <Text style={styles.section}>{t('report.replies')}</Text>
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
            label={t('report.askMila')}
            variant="coral"
            icon={<MessageCircleHeart color="#fff" size={20} />}
            onPress={() => router.push({ pathname: '/koc', params: { id: analysis.id } })}
          />
          <Text style={styles.disclaimer}>
            {t('report.disclaimer')}
          </Text>
          <Pressable onPress={() => setReporting(reportText(report))} accessibilityRole="button" hitSlop={8} style={styles.flag}>
            <Text style={[type.caption, { color: colors.textMuted }]}>⚑ {t('common.report.action')}</Text>
          </Pressable>
        </ScrollView>
      )}
      <ReportSheet kind="rapor" text={reporting} onClose={() => setReporting(null)} />
    </SafeAreaView>
  );
}

/** Paylaşılabilir kart: içeriği resim olarak dışa aktarılır. */
function Shareable({ bg, children }: { bg: string; children: ReactNode }) {
  const ref = useRef<View>(null);
  const share = async () => {
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('report.shareDialog') });
      bump('card_shared');
    } catch {
      Alert.alert(t('report.shareFailTitle'), t('report.shareFailBody'));
    }
  };
  return (
    <View>
      <View ref={ref} collapsable={false} style={[styles.shareable, { backgroundColor: bg }]}>
        {children}
        <Text style={styles.brand}>Unwrap</Text>
      </View>
      <Pressable onPress={share} style={styles.shareBtn} accessibilityLabel={t('report.shareLabel')}>
        <Share2 color={colors.text} size={16} />
        <Text style={[type.label, { color: colors.text }]}>{t('report.share')}</Text>
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
      {FUN.has(card.key) ? <Sticker text={t('report.funSticker')} rotate={-5} bg={colors.lilac} style={{ marginTop: -space.xs }} /> : null}
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
      <Sticker text={t('report.karneSticker')} rotate={7} bg={colors.cardButter} style={{ position: 'absolute', top: -12, right: 16, zIndex: 2 }} />
      <Text style={styles.cardTitle}>{t('report.karneTitle')}</Text>
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
      <Text style={[type.bodySm, { color: colors.textMuted }]}>{t('report.teacherNote', { note: report.karne.teacherNote })}</Text>
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
  flag: { alignSelf: 'center', paddingVertical: space.xs },
});
