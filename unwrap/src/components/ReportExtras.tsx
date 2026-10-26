// Yapay zekâ raporunun paylaşmalık ek kartları: red/green flag, uyum yüzdesi,
// "kim daha çok seviyor?" düellosu, grup ödülleri ve eski sevgili analizi.
// Eski raporlarda bu alanlar yoktur; her kart kendi verisi yoksa hiç çizilmez.
import { StyleSheet, Text, View } from 'react-native';

import { Shareable } from '@/components/Shareable';
import { Sticker } from '@/components/ui';
import { t } from '@/i18n';
import type { Report, ReportAward, ReportCompatibility, ReportEx, ReportFlags, ReportLoveDuel } from '@/lib/ai/types';
import { colors, fonts, radius, space, type } from '@/theme';

export const clampScore = (n: number) => Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
export const duelWinner = (w: string) => (w.trim().toUpperCase() === 'DRAW' ? t('report.duel.draw') : w);

export function ReportExtras({ report }: { report: Report }) {
  return (
    <>
      {report.compatibility ? <CompatibilityCard c={report.compatibility} /> : null}
      {report.flags && (report.flags.red.length || report.flags.green.length) ? <FlagsCard f={report.flags} /> : null}
      {report.loveDuel?.rounds.length ? <DuelCard d={report.loveDuel} /> : null}
      {report.awards?.length ? <AwardsCard a={report.awards} /> : null}
      {report.ex ? <ExCard e={report.ex} /> : null}
    </>
  );
}

export function CompatibilityCard({ c }: { c: ReportCompatibility }) {
  const score = clampScore(c.score);
  return (
    <Shareable bg={colors.cardCoral}>
      <Sticker text={t('report.compat.sticker')} rotate={-5} bg={colors.surface} />
      <Text style={styles.big}>%{score}</Text>
      <Text style={styles.cardTitle}>{c.title}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${score}%`, backgroundColor: colors.primary }]} />
      </View>
      <View style={styles.pair}>
        <View style={[styles.box, { flex: 1 }]}>
          <Text style={styles.boxLabel}>{t('report.compat.best')}</Text>
          <Text style={[type.bodySm, { color: colors.text }]}>{c.best}</Text>
        </View>
        <View style={[styles.box, { flex: 1 }]}>
          <Text style={styles.boxLabel}>{t('report.compat.clash')}</Text>
          <Text style={[type.bodySm, { color: colors.text }]}>{c.clash}</Text>
        </View>
      </View>
      <Text style={[type.body, { color: colors.text }]}>{c.line}</Text>
    </Shareable>
  );
}

export function FlagsCard({ f }: { f: ReportFlags }) {
  return (
    <Shareable bg={colors.surface}>
      <Text style={styles.cardTitle}>{t('report.flags.title')}</Text>
      {f.red.map((x, i) => (
        <View key={`r${i}`} style={[styles.flag, { backgroundColor: colors.cardCoral }]}>
          <Text style={styles.flagTitle}>🚩 {x.title}</Text>
          <Text style={styles.quote}>“{x.quote}”</Text>
          <Text style={[type.caption, { color: colors.textMuted }]}>{x.author} · {x.date}</Text>
        </View>
      ))}
      {f.green.map((x, i) => (
        <View key={`g${i}`} style={[styles.flag, { backgroundColor: colors.cardMint }]}>
          <Text style={styles.flagTitle}>💚 {x.title}</Text>
          <Text style={styles.quote}>“{x.quote}”</Text>
          <Text style={[type.caption, { color: colors.textMuted }]}>{x.author} · {x.date}</Text>
        </View>
      ))}
      {f.verdict ? <Text style={[type.body, { color: colors.text }]}>{f.verdict}</Text> : null}
    </Shareable>
  );
}

export function DuelCard({ d }: { d: ReportLoveDuel }) {
  return (
    <Shareable bg={colors.cardLilac}>
      <Sticker text={t('report.duel.sticker')} rotate={6} bg={colors.cardButter} />
      <Text style={styles.cardTitle}>{t('report.duel.title')}</Text>
      {d.rounds.map((r, i) => (
        <View key={i} style={styles.round}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.label, { color: colors.text }]}>{r.label}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>{r.detail}</Text>
          </View>
          <Text style={styles.roundWinner} numberOfLines={1}>{duelWinner(r.winner)}</Text>
        </View>
      ))}
      <View style={styles.winnerBox}>
        <Text style={styles.boxLabel}>{t('report.duel.winner')}</Text>
        <Text style={styles.winner}>💘 {duelWinner(d.winner)}</Text>
      </View>
      <Text style={[type.body, { color: colors.text }]}>{d.line}</Text>
    </Shareable>
  );
}

export function AwardsCard({ a }: { a: ReportAward[] }) {
  return (
    <Shareable bg={colors.cardButter}>
      <Sticker text={t('report.awards.sticker')} rotate={-6} bg={colors.surface} />
      <Text style={styles.cardTitle}>{t('report.awards.title')}</Text>
      {a.map((x, i) => (
        <View key={i} style={styles.award}>
          <Text style={styles.awardEmoji}>{x.emoji}</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.label, { color: colors.text }]}>{x.title}</Text>
            <Text style={styles.awardName}>{x.name}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>{x.reason}</Text>
          </View>
        </View>
      ))}
    </Shareable>
  );
}

export function ExCard({ e }: { e: ReportEx }) {
  return (
    <Shareable bg={colors.cardPeach}>
      <Text style={styles.cardTitle}>{t('report.ex.title')}</Text>
      <Text style={[type.body, { color: colors.text }]}>{e.story}</Text>
      <View style={styles.box}>
        <Text style={styles.boxLabel}>{t('report.ex.turningPoint')}</Text>
        <Text style={styles.quote}>“{e.turningPoint.quote}”</Text>
        <Text style={[type.caption, { color: colors.textMuted }]}>{e.turningPoint.author} · {e.turningPoint.date}</Text>
        {e.turningPoint.note ? <Text style={[type.bodySm, { color: colors.text }]}>{e.turningPoint.note}</Text> : null}
      </View>
      <View style={styles.box}>
        <Text style={styles.boxLabel}>{t('report.ex.lesson')}</Text>
        <Text style={[type.bodySm, { color: colors.text }]}>{e.lesson}</Text>
      </View>
    </Shareable>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, color: colors.text },
  big: { fontFamily: fonts.extrabold, fontSize: 64, lineHeight: 70, color: colors.primary, letterSpacing: -2 },
  track: { height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.7)', overflow: 'hidden' },
  fill: { height: 14, borderRadius: 7 },
  pair: { flexDirection: 'row', gap: space.sm },
  box: { backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: radius.sm, padding: space.md, gap: 4 },
  boxLabel: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 1, color: colors.primary },
  flag: { borderRadius: radius.sm, padding: space.md, gap: 2 },
  flagTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.text },
  quote: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, color: colors.text },
  round: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: radius.sm, padding: space.md },
  roundWinner: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.purple, maxWidth: '40%' },
  winnerBox: { alignItems: 'center', gap: 2, paddingVertical: space.sm },
  winner: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.text },
  award: { flexDirection: 'row', gap: space.md, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: radius.sm, padding: space.md },
  awardEmoji: { fontSize: 34 },
  awardName: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.primary },
});
