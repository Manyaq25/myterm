// Tek bir hikâye kartının görünümü (ekranda ve paylaşılan resimde aynı).
import { StyleSheet, Text, View } from 'react-native';

import { Sticker } from '@/components/ui';
import { t } from '@/i18n';
import type { Card } from '@/lib/cards/free';
import { colors, fonts, radius, space, type } from '@/theme';

const BAR_COLORS = [colors.primary, colors.purple, colors.green, colors.coral, colors.textMuted];

export function StoryCard({ card }: { card: Card }) {
  return (
    <View style={[styles.card, { backgroundColor: card.bg }]}>
      <View style={styles.brand}>
        <Text style={styles.brandText}>✦ unwrap</Text>
      </View>
      <Text style={styles.title}>{card.title}</Text>
      <View style={styles.body}>
        {card.kind === 'rows' && <Rows card={card} />}
        {card.kind === 'big' && (
          <View style={styles.bigBox}>
            <Text style={styles.big} adjustsFontSizeToFit numberOfLines={1}>
              {card.value}
            </Text>
            {card.unit ? <Text style={styles.bigUnit}>{card.unit}</Text> : null}
          </View>
        )}
        {card.kind === 'awards' && (
          <View style={{ gap: space.sm }}>
            {card.awards.map((a) => (
              <View key={a.title} style={styles.award}>
                <Text style={{ fontSize: 26 }}>{a.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[type.caption, { color: colors.textMuted }]}>{a.title}</Text>
                  <Text style={[type.title, { color: colors.text }]}>{a.name}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        {card.kind === 'karne' && (
          <View style={styles.karne}>
            <Sticker text={t('story.card.karneSticker')} rotate={8} bg={colors.surface} style={styles.karneSticker} />
            <View style={styles.karneRow}>
              <Text style={[styles.karneSubject]} />
              {card.names.map((n) => (
                <Text key={n} style={[styles.karneCell, type.label, { color: colors.text }]} numberOfLines={1}>
                  {n}
                </Text>
              ))}
            </View>
            {card.subjects.map((sub) => (
              <View key={sub.subject} style={styles.karneRow}>
                <Text style={[styles.karneSubject, type.body, { color: colors.text }]}>{sub.subject}</Text>
                {sub.grades.map((g, i) => (
                  <Text key={i} style={[styles.karneCell, styles.grade, { color: g == null ? colors.textMuted : g >= 4 ? colors.green : g <= 2 ? colors.primary : colors.text }]}>
                    {g ?? '–'}
                  </Text>
                ))}
              </View>
            ))}
            <Text style={[type.caption, { color: colors.textMuted, marginTop: space.sm }]}>
              {t('story.card.karneFootnote')}
            </Text>
          </View>
        )}
        {card.kind === 'list' && (
          <View style={{ gap: space.sm }}>
            {card.items.map((it, i) => (
              <View key={i} style={[styles.listRow, it.tint ? { backgroundColor: it.tint } : null]}>
                <Text style={{ fontSize: 22 }}>{it.emoji}</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.label, { color: colors.text }]}>{it.title}</Text>
                  {it.sub ? <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={3}>{it.sub}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}
        {card.kind === 'teaser' && (
          <View style={{ gap: space.sm }}>
            {card.items.map((item) => (
              <View key={item} style={styles.teaserRow}>
                <Text style={{ fontSize: 16 }}>🔒</Text>
                <Text style={[type.body, { color: colors.text, flex: 1 }]}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {'caption' in card ? <Text style={styles.caption}>{card.caption}</Text> : null}
    </View>
  );
}

function Rows({ card }: { card: Extract<Card, { kind: 'rows' }> }) {
  const max = Math.max(...card.rows.map((r) => Math.abs(r.value)), 1);
  const reverse = card.rows.every((r) => r.value <= 0); // süre kartında küçük = iyi
  return (
    <View style={{ gap: space.md }}>
      {card.rows.map((r, i) => {
        const width = reverse
          ? `${Math.max(12, (Math.abs(card.rows[0].value) / Math.max(Math.abs(r.value), 1)) * 100)}%`
          : `${Math.max(6, (Math.abs(r.value) / max) * 100)}%`;
        return (
          <View key={r.name} style={styles.row}>
            <View style={styles.rowHead}>
              <Text style={styles.rowName} numberOfLines={1}>
                {r.name}
              </Text>
              <Text style={[styles.rowValue, { color: BAR_COLORS[i % BAR_COLORS.length] }]}>
                {r.display}
                {card.unit && !r.note ? <Text style={styles.rowUnit}> {card.unit}</Text> : null}
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: width as `${number}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]} />
            </View>
            {r.note ? <Text style={[type.caption, { color: colors.textMuted }]}>{r.note}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.lg, padding: space.lg, paddingTop: space.xl, overflow: 'hidden' },
  brand: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  brandText: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  title: { ...type.headline, color: colors.text, marginTop: space.lg },
  body: { flex: 1, justifyContent: 'center', paddingVertical: space.lg },
  bigBox: { backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: radius.lg, padding: space.lg, alignItems: 'center' },
  big: { fontFamily: fonts.extrabold, fontSize: 80, color: colors.text, letterSpacing: -2 },
  bigUnit: { ...type.title, color: colors.textMuted },
  award: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: radius.md, padding: space.md },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: radius.md, padding: space.md },
  teaserRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: radius.md, padding: space.md },
  row: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: radius.md, padding: space.md, gap: 8 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm },
  rowName: { ...type.title, color: colors.text, flex: 1 },
  rowValue: { fontFamily: fonts.extrabold, fontSize: 30 },
  rowUnit: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
  track: { height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  karne: { backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: radius.lg, padding: space.md, paddingTop: space.lg },
  karneSticker: { position: 'absolute', top: -18, right: 8 },
  karneRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.12)' },
  karneSubject: { flex: 2 },
  karneCell: { flex: 1, textAlign: 'center' },
  grade: { fontFamily: fonts.extrabold, fontSize: 26 },
  caption: { ...type.title, fontFamily: fonts.semibold, color: colors.text, textAlign: 'center' },
});
