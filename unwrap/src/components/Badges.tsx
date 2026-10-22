// Rozetler (Pro): avatar çevresindeki madalyalar, ad altındaki unvan ve tüm rozetlerin ızgarası.
// Ücretsiz kullanıcı rozetleri görür ama kilitli; dokununca Pro'ya gider (yönlendirme çağıranda).
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button } from '@/components/ui';
import { locale, t } from '@/i18n';
import { badgeTitleKey, rankBadges, type Badge, type Gender, type Tier } from '@/lib/profile/badges';
import { colors, fonts, radius, space, type } from '@/theme';

/** Seviye renkleri: madalya degradesi ve yazı rengi. */
export const TIER_COLORS: Record<Tier, { gradient: [string, string]; ink: string }> = {
  bronze: { gradient: ['#F3C29B', '#B8703F'], ink: '#6B3A17' },
  silver: { gradient: ['#F4F4F7', '#A7A9B4'], ink: '#4A4C57' },
  gold: { gradient: ['#FFE68A', '#E0A400'], ink: '#6E4F00' },
  legend: { gradient: ['#C8A6FF', '#FF6B9A'], ink: '#4B1F7A' },
};
const LOCKED: [string, string] = [colors.surfaceHigh, '#CFC4C5'];

export const badgeTitle = (b: Badge, gender: Gender) => t(badgeTitleKey(b, gender));
const badgeDesc = (b: Badge) => t(b.descKey, { target: b.progress.target.toLocaleString(locale()) });

function Medal({ emoji, tier, size, locked, style }: { emoji: string; tier: Tier | null; size: number; locked?: boolean; style?: StyleProp<ViewStyle> }) {
  const g = locked || !tier ? LOCKED : TIER_COLORS[tier].gradient;
  return (
    <LinearGradient
      colors={g}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.medal, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text style={{ fontSize: size * 0.5, opacity: locked ? 0.55 : 1 }}>{emoji}</Text>
    </LinearGradient>
  );
}

// Madalyaların avatar çevresindeki açıları (saat 12 = 0°, saat yönünde); ilk açı en iyi rozet.
const RING_ANGLES = [135, 45, 225, 315, 180];
const LOCKED_TEASE = 3;

/**
 * Avatarın çevresine dizilen madalyalar. Avatarla aynı boyutta bir kutunun içine
 * mutlak konumla oturur: <View style={{ width: size, height: size }}>{avatar}<BadgeRing … /></View>
 */
export function BadgeRing({ badges, size, isPro }: { badges: Badge[]; size: number; isPro: boolean }) {
  const medal = Math.max(22, Math.round(size * 0.3));
  const r = size / 2;
  const items: { key: string; emoji: string; tier: Tier | null; locked: boolean }[] = isPro
    ? rankBadges(badges).slice(0, RING_ANGLES.length).map((b) => ({ key: b.id, emoji: b.emoji, tier: b.tier, locked: false }))
    : Array.from({ length: LOCKED_TEASE }, (_, i) => ({ key: `kilit-${i}`, emoji: '🔒', tier: null, locked: true }));
  if (!items.length) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { width: size, height: size }]}>
      {items.map((it, i) => {
        const a = (RING_ANGLES[i] * Math.PI) / 180;
        const left = r + r * Math.sin(a) - medal / 2;
        const top = r - r * Math.cos(a) - medal / 2;
        return <Medal key={it.key} emoji={it.emoji} tier={it.tier} size={medal} locked={it.locked} style={[styles.ringMedal, { left, top }]} />;
      })}
    </View>
  );
}

/** Ad altındaki unvan hapı ("👑 Analiz Kraliçesi"); Pro değilse kilitli davet. */
export function BadgeTitle({ badge, gender, isPro, onPress }: { badge: Badge | null; gender: Gender; isPro: boolean; onPress?: () => void }) {
  const tier = isPro && badge ? TIER_COLORS[badge.tier] : null;
  const label = !isPro ? t('badges.lockedTitle') : badge ? `${badge.emoji} ${badgeTitle(badge, gender)}` : t('badges.noneYet');
  const body = <Text style={[styles.titleText, { color: tier?.ink ?? colors.textMuted }]} numberOfLines={1}>{label}</Text>;
  return (
    <Pressable accessibilityRole={onPress ? 'button' : 'text'} onPress={onPress} disabled={!onPress} style={styles.titleWrap}>
      {tier ? (
        <LinearGradient colors={tier.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.titlePill}>
          {body}
        </LinearGradient>
      ) : (
        <View style={[styles.titlePill, { backgroundColor: colors.surfaceMid }]}>{body}</View>
      )}
    </Pressable>
  );
}

/** Tüm rozetler: kazanılanlar renkli, diğerleri soluk ve ilerleme çubuklu. */
export function BadgeGrid({ badges, gender, isPro, onLockedPress }: { badges: Badge[]; gender: Gender; isPro: boolean; onLockedPress: () => void }) {
  const [open, setOpen] = useState<Badge | null>(null);
  return (
    <View style={styles.grid}>
      {badges.map((b) => {
        const pct = b.progress.target ? Math.min(1, b.progress.value / b.progress.target) : 0;
        const title = badgeTitle(b, gender);
        return (
          <Pressable
            key={b.id}
            accessibilityRole="button"
            accessibilityLabel={isPro ? title : `${title}, ${t('badges.locked')}`}
            onPress={() => (isPro ? setOpen(b) : onLockedPress())}
            style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.8 : 1 }]}>
            <View>
              <Medal emoji={b.emoji} tier={b.tier} size={56} locked={!b.earned} />
              {!isPro ? (
                <View style={styles.lockBadge}>
                  <Text style={{ fontSize: 12 }}>🔒</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.cellTitle, !b.earned && { color: colors.textMuted }]} numberOfLines={2}>{title}</Text>
            {b.earned ? (
              <Text style={[styles.cellTier, { color: TIER_COLORS[b.tier].ink }]}>{t(`badges.tiers.${b.tier}`)}</Text>
            ) : (
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(pct * 100)}%` }]} />
              </View>
            )}
          </Pressable>
        );
      })}
      <BadgeDetail badge={open} gender={gender} onClose={() => setOpen(null)} />
    </View>
  );
}

function BadgeDetail({ badge, gender, onClose }: { badge: Badge | null; gender: Gender; onClose: () => void }) {
  return (
    <Modal visible={!!badge} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('badges.close')}>
        {badge ? (
          <Pressable style={styles.detail} onPress={() => {}}>
            <Medal emoji={badge.emoji} tier={badge.tier} size={96} locked={!badge.earned} />
            <Text style={[type.title, { color: colors.text, textAlign: 'center' }]}>{badgeTitle(badge, gender)}</Text>
            <Text style={[styles.cellTier, { color: TIER_COLORS[badge.tier].ink }]}>{t(`badges.tiers.${badge.tier}`)}</Text>
            <Text style={[type.bodySm, { color: colors.textMuted, textAlign: 'center' }]}>{badgeDesc(badge)}</Text>
            {badge.earned ? (
              <Text style={[type.label, { color: colors.green }]}>✓ {t('badges.earned')}</Text>
            ) : (
              <View style={{ alignSelf: 'stretch', gap: 6 }}>
                <View style={[styles.track, { height: 8 }]}>
                  <View style={[styles.fill, { width: `${Math.round((badge.progress.value / badge.progress.target) * 100)}%` }]} />
                </View>
                <Text style={[type.caption, { color: colors.textMuted, textAlign: 'center' }]}>
                  {t('badges.progress', { value: badge.progress.value.toLocaleString(locale()), target: badge.progress.target.toLocaleString(locale()) })}
                </Text>
              </View>
            )}
            <Button label={t('badges.close')} variant="ghost" onPress={onClose} style={{ alignSelf: 'stretch' }} />
          </Pressable>
        ) : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  medal: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  ringMedal: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  titleWrap: { alignSelf: 'center', maxWidth: '100%' },
  titlePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill },
  titleText: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.md },
  cell: {
    width: '31%',
    alignItems: 'center',
    gap: 6,
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  lockBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellTitle: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 17, color: colors.text, textAlign: 'center' },
  cellTier: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  track: { alignSelf: 'stretch', height: 6, marginHorizontal: space.sm, borderRadius: 3, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.coral },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  detail: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: space.lg,
  },
});
