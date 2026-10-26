// Profil: avatar + ad, Apple hesabı, abonelik durumu ve "benim istatistiklerim".
// İstatistikler telefonda hesaplanır; boş değer uydurulmaz, "– –" gösterilir.
import * as AppleAuthentication from 'expo-apple-authentication';
import { router, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { Check, Share2, X } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Purchases from 'react-native-purchases';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { BadgeRing, BadgeTitle } from '@/components/Badges';
import { FRAME_SCALE, ProfileAvatar } from '@/components/ProfileAvatar';
import { Button, Card, Pill, Sticker, useTopInset } from '@/components/ui';
import { locale, t } from '@/i18n';
import { formatDuration } from '@/lib/chat/stats';
import { appleAvailable, deleteAccount, saveProfile, signIn, signOut } from '@/lib/profile/account';
import { getActivity, bump } from '@/lib/profile/activity';
import { GENDERS, type Gender } from '@/lib/profile/avatar';
import { bestBadge, computeBadges, type Badge } from '@/lib/profile/badges';
import { computeMyStats, type Moment, type MyStats } from '@/lib/profile/stats';
import { DEFAULT_SHARE_KEYS, getAccount, getProfile, writeProfile, type Account, type Profile } from '@/lib/profile/store';
import { hasPro, initPurchases, managementUrl } from '@/lib/purchases';
import { getAnalysis, listAnalyses, type Analysis } from '@/lib/store';
import { colors, fonts, radius, space, type } from '@/theme';

// Avatar seçimi /profil/avatar ekranında; burada yalnız çizilir (ProfileAvatar).
const AVATAR_SIZE = 104;
const GENDER_EMOJI: Record<Gender, string> = { kadin: '👩', erkek: '👨', notr: '🧑' };
const TILE_BGS = [colors.cardPeach, colors.cardLilac, colors.cardMint, colors.cardButter, colors.cardCoral, colors.surface];
// Paylaşım kartı: en çok 8 kutu, 4 zemin rengi, sabit genişlikte çizilip önizlemede küçültülür.
const SHARE_MAX = 8;
const SHARE_COLORS: string[] = [colors.cardLilac, colors.cardPeach, colors.cardMint, colors.cardButter];
const CARD_W = 360;

const NONE = () => t('profile.none');
const num = (n: number) => n.toLocaleString(locale());
const pct = (n: number | null) => (n == null ? null : t('profile.percent', { n: num(n) }));

// "2024-05-12" yerel gün olarak, diğerleri ISO olarak okunur.
function fmtDate(s: string | null): string | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
}

const fmtHour = (h: number | null) =>
  h == null ? null : new Date(2000, 0, 1, h).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });

type Tile = { key: string; emoji: string; title: string; value: string | null; sub?: string | null; wide?: boolean };

const momentSub = (m: Moment | null) => (m ? [m.text ? `“${m.text}”` : null, m.chat].filter(Boolean).join(' · ') : null);

function statTiles(s: MyStats): Tile[] {
  return [
    { key: 'chats', emoji: '💬', title: t('profile.stats.chats'), value: num(s.chats) },
    { key: 'messages', emoji: '📨', title: t('profile.stats.messages'), value: num(s.messages) },
    {
      key: 'topPerson', emoji: '👑', title: t('profile.stats.topPerson'), value: s.topPerson?.name ?? null,
      sub: s.topPerson ? t('profile.stats.topPersonSub', { count: num(s.topPerson.messages) }) : null,
    },
    {
      key: 'favoriteWord', emoji: '🗣️', title: t('profile.stats.favoriteWord'), value: s.favoriteWord?.word ?? null,
      sub: s.favoriteWord ? t('profile.stats.timesSub', { count: num(s.favoriteWord.count) }) : null,
    },
    {
      key: 'favoriteEmoji', emoji: '💖', title: t('profile.stats.favoriteEmoji'), value: s.favoriteEmoji?.emoji ?? null,
      sub: s.favoriteEmoji ? t('profile.stats.timesSub', { count: num(s.favoriteEmoji.count) }) : null,
    },
    { key: 'laughs', emoji: '😂', title: t('profile.stats.laughs'), value: num(s.laughs) },
    { key: 'happiestMoment', emoji: '🌞', title: t('profile.stats.happiest'), value: fmtDate(s.happiestMoment?.date ?? null), sub: momentSub(s.happiestMoment), wide: true },
    { key: 'mostEmotionalDay', emoji: '🥹', title: t('profile.stats.emotional'), value: fmtDate(s.mostEmotionalDay?.date ?? null), sub: momentSub(s.mostEmotionalDay), wide: true },
    { key: 'ghosting', emoji: '👻', title: t('profile.stats.ghosting'), value: s.ghosting ? formatDuration(s.ghosting.ms) : null, sub: s.ghosting?.chat ?? null },
    { key: 'medianReply', emoji: '⏱️', title: t('profile.stats.reply'), value: s.medianReplyMs == null ? null : formatDuration(s.medianReplyMs) },
    { key: 'nightOwl', emoji: '🦉', title: t('profile.stats.nightOwl'), value: pct(s.nightOwlPct) },
    { key: 'doubleTexts', emoji: '📲', title: t('profile.stats.doubleTexts'), value: num(s.doubleTexts) },
    { key: 'initiation', emoji: '🚀', title: t('profile.stats.initiation'), value: pct(s.initiationPct) },
    {
      key: 'longestMessage', emoji: '📜', title: t('profile.stats.longest'),
      value: s.longestMessageWords == null ? null : t('profile.stats.words', { count: num(s.longestMessageWords) }),
    },
    { key: 'busiestHour', emoji: '⏰', title: t('profile.stats.busiestHour'), value: fmtHour(s.busiestHour) },
    { key: 'firstMessage', emoji: '🐣', title: t('profile.stats.firstMessage'), value: fmtDate(s.firstMessageDate) },
  ];
}

function aiTiles(s: MyStats): Tile[] {
  // Aynı kart farklı sohbetlerde olabilir; anahtar sohbeti de içerir (sunucu sınırı 80).
  const rows: Tile[] = s.ai.map((a) => ({ key: `ai.${a.key}.${a.chat}`.slice(0, 80), emoji: '🤖', title: a.title, value: a.display, sub: a.chat }));
  if (s.karneAvg != null) rows.push({ key: 'karneAvg', emoji: '📝', title: t('profile.ai.karne'), value: num(s.karneAvg) });
  return rows;
}

type Sub = { pro: boolean; plan: string | null; line: string | null };

async function loadSub(): Promise<Sub> {
  if (!(await initPurchases())) return { pro: false, plan: null, line: null };
  try {
    const info = await Purchases.getCustomerInfo();
    if (!hasPro(info)) return { pro: false, plan: null, line: null };
    const ent = Object.values(info.entitlements.active)[0];
    const id = ent.productIdentifier.toLowerCase();
    const plan = t(id.includes('year') || id.includes('annual') ? 'profile.sub.yearly' : 'profile.sub.monthly');
    const date = ent.expirationDate ? new Date(ent.expirationDate).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }) : null;
    const line = !date
      ? null
      : ent.periodType === 'TRIAL'
        ? t('profile.sub.trialEnds', { date })
        : t(ent.willRenew ? 'profile.sub.renews' : 'profile.sub.expires', { date });
    return { pro: true, plan, line };
  } catch {
    return { pro: false, plan: null, line: null };
  }
}

export default function Profil() {
  const [profile, setProfile] = useState<Profile>(getProfile);
  const [account, setAccount] = useState<Account | null>(null);
  const [apple, setApple] = useState(false);
  const [sub, setSub] = useState<Sub | null>(null);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [hasMe, setHasMe] = useState<boolean | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [editing, setEditing] = useState(false);
  const [overrideTile, setOverrideTile] = useState<Tile | null>(null);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);

  const refreshAccount = useCallback(() => {
    setProfile(getProfile());
    getAccount().then(setAccount);
    loadSub().then(setSub);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshAccount();
      appleAvailable().then(setApple);
      // Çok sohbette hesap uzun sürebilir: ekran çizildikten sonra başla.
      const timer = setTimeout(() => {
        const list = listAnalyses();
        const all = list.map((a) => getAnalysis(a.id)).filter((a): a is Analysis => !!a);
        const mine = all.some((a) => !!a.me);
        const my = mine ? computeMyStats(all) : null;
        setHasMe(mine);
        setStats(my);
        // Rozetler: ilişki türüne göre analiz sayısı da gerekir.
        const relationCounts: Record<string, number> = {};
        for (const a of list) if (a.relation) relationCounts[a.relation] = (relationCounts[a.relation] ?? 0) + 1;
        setBadges(computeBadges({ activity: getActivity(), stats: my, analysesCount: list.length, relationCounts, gender: getProfile().gender }));
      }, 50);
      return () => clearTimeout(timer);
    }, [refreshAccount]),
  );

  const update = (p: Profile) => {
    setProfile(p);
    saveProfile(p);
  };

  const setOverride = (key: string, value: string | null) => {
    const overrides = { ...profile.overrides };
    if (value) overrides[key] = value;
    else delete overrides[key];
    update({ ...profile, overrides });
  };

  const doSignIn = async () => {
    setBusy(true);
    try {
      await signIn();
    } catch {
      Alert.alert(t('profile.account.signInFailTitle'), t('profile.account.signInFailText'));
    } finally {
      setBusy(false);
      refreshAccount();
    }
  };

  const confirmSignOut = () =>
    Alert.alert(t('profile.account.signOutConfirmTitle'), t('profile.account.signOutConfirmText'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.account.signOut'), onPress: () => signOut().finally(refreshAccount) },
    ]);

  const confirmDelete = () =>
    Alert.alert(t('profile.account.deleteConfirmTitle'), t('profile.account.deleteConfirmText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.account.deleteConfirm'),
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteAccount();
            Alert.alert(t('profile.account.deletedTitle'), t('profile.account.deletedText'));
          } catch {
            Alert.alert(t('profile.account.deleteFailTitle'), t('profile.account.deleteFailText'));
          } finally {
            setBusy(false);
            refreshAccount();
          }
        },
      },
    ]);

  const manage = async () => WebBrowser.openBrowserAsync(await managementUrl());

  const pro = !!sub?.pro;
  // Çerçeve Pro: abonelik bittiyse yalnız avatar görünür (çerçeve kayıtlı kalır).
  const shownProfile = sub && !sub.pro ? { ...profile, frame: null } : profile;
  const avatarBox = shownProfile.frame ? Math.round(AVATAR_SIZE * FRAME_SCALE) : AVATAR_SIZE;
  const openFrames = () => router.push({ pathname: '/profil/avatar', params: { tab: 'frames' } });
  const name = profile.name || t('profile.noName');
  const shown = (tile: Tile) => profile.overrides[tile.key] ?? tile.value ?? NONE();

  const tiles = stats ? statTiles(stats) : [];
  const ai = stats ? aiTiles(stats) : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('profile.title')}</Text>

        {/* Avatar + ad */}
        <Pressable onPress={() => setEditing(true)} accessibilityRole="button" accessibilityHint={t('profile.tapToEdit')}>
          <Card style={styles.header}>
            <View style={{ width: avatarBox, height: avatarBox, alignItems: 'center', justifyContent: 'center' }}>
              <ProfileAvatar profile={shownProfile} size={AVATAR_SIZE} />
              {/* ROZETLER */}
              <BadgeRing badges={badges} size={avatarBox} isPro={pro} />
            </View>
            <Pressable onPress={openFrames} accessibilityRole="button" hitSlop={6} style={({ pressed }) => [styles.framePill, { opacity: pressed ? 0.8 : 1 }]}>
              <Text style={[type.caption, { fontFamily: fonts.bold, color: colors.primary }]}>
                {t(shownProfile.frame ? 'profile.frames.change' : 'profile.frames.add')}
                {pro ? '' : ' 🔒'}
              </Text>
            </Pressable>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <BadgeTitle badge={bestBadge(badges)} gender={profile.gender} isPro={pro} onPress={() => router.push('/profil/rozetler')} />
            {/* Hitap seçilmediyse: unvanlar (Kraliçe/Kral) için seçtir; seçince kaybolur. */}
            {!profile.genderSet ? (
              <View style={styles.genderAsk}>
                <Text style={[type.label, { color: colors.text, textAlign: 'center' }]}>👑 {t('profile.gender.ask')}</Text>
                <View style={[styles.genderRow, { justifyContent: 'center' }]}>
                  {GENDERS.map((g) => (
                    <Pill key={g} emoji={GENDER_EMOJI[g]} label={t(`profile.gender.${g}`)} onPress={() => update({ ...profile, gender: g, genderSet: true })} />
                  ))}
                </View>
              </View>
            ) : null}
            <Text style={[type.caption, { color: colors.textMuted }]}>✏️ {t('profile.tapToEdit')}</Text>
          </Card>
        </Pressable>

        {/* Rozetler ekranı */}
        <Pressable onPress={() => router.push('/profil/rozetler')} accessibilityRole="button" style={({ pressed }) => [styles.shareOpen, { backgroundColor: colors.cardButter, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={{ fontSize: 20 }}>🏅</Text>
          <View style={{ flex: 1 }}>
            <Text style={[type.label, { color: colors.text }]}>{t('badges.screenTitle')}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>
              {t('badges.earnedCount', { earned: badges.filter((b) => b.earned).length, total: badges.length })}
            </Text>
          </View>
        </Pressable>

        {/* Arkadaşını getir */}
        <Pressable onPress={() => router.push('/davet')} accessibilityRole="button" style={({ pressed }) => [styles.shareOpen, { backgroundColor: colors.cardLilac, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={{ fontSize: 20 }}>🎁</Text>
          <View style={{ flex: 1 }}>
            <Text style={[type.label, { color: colors.text }]}>{t('invite.rowTitle')}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>{t('invite.rowNote')}</Text>
          </View>
        </Pressable>

        {/* Hesap: Apple girişi yalnız destekleyen cihazda */}
        {account || apple ? (
          <>
            <Text style={styles.section}>{t('profile.account.section')}</Text>
            <Card style={{ gap: space.sm }}>
              {account ? (
                <>
                  <Text style={[type.title, { color: colors.text }]}>{t('profile.account.signedIn')}</Text>
                  <Text style={[type.bodySm, { color: colors.textMuted }]}>{t('profile.account.signedInNote')}</Text>
                  <Button label={t('profile.account.signOut')} variant="ghost" onPress={confirmSignOut} disabled={busy} />
                  <Pressable onPress={confirmDelete} disabled={busy} accessibilityRole="button" style={styles.dangerLink}>
                    <Text style={[type.label, { color: colors.primary }]}>{t('profile.account.delete')}</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  {busy ? (
                    <ActivityIndicator color={colors.primary} style={{ height: 50 }} />
                  ) : (
                    <AppleAuthentication.AppleAuthenticationButton
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                      cornerRadius={radius.pill}
                      style={styles.appleButton}
                      onPress={doSignIn}
                    />
                  )}
                  <Text style={[type.caption, { color: colors.textMuted }]}>{t('profile.account.note')}</Text>
                </>
              )}
            </Card>
          </>
        ) : null}

        {/* Abonelik */}
        <Text style={styles.section}>{t('profile.sub.section')}</Text>
        <Card style={{ gap: space.sm }}>
          {!sub ? (
            <ActivityIndicator color={colors.primary} />
          ) : sub.pro ? (
            <>
              <Text style={[type.title, { color: colors.text }]}>✦ {t('profile.sub.pro')}</Text>
              {sub.plan ? <Text style={[type.body, { color: colors.text }]}>{sub.plan}</Text> : null}
              {sub.line ? <Text style={[type.bodySm, { color: colors.textMuted }]}>{sub.line}</Text> : null}
              <Button label={t('profile.sub.manage')} variant="ghost" onPress={manage} />
            </>
          ) : (
            <>
              <Text style={[type.title, { color: colors.text }]}>{t('profile.sub.free')}</Text>
              <Text style={[type.bodySm, { color: colors.textMuted }]}>{t('profile.sub.freeNote')}</Text>
              <Button label={t('profile.sub.goPro')} variant="coral" onPress={() => router.push('/pro')} />
            </>
          )}
        </Card>

        {/* Benim istatistiklerim */}
        <Text style={styles.heading}>{t('profile.stats.section')}</Text>
        {hasMe === null ? (
          <Card style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[type.bodySm, { color: colors.textMuted }]}>{t('profile.stats.loading')}</Text>
          </Card>
        ) : !hasMe || !stats ? (
          <Card style={{ gap: space.sm, alignItems: 'center' }}>
            <Text style={{ fontSize: 40 }}>🪞</Text>
            <Text style={[type.title, { color: colors.text, textAlign: 'center' }]}>{t('profile.empty.title')}</Text>
            <Text style={[type.bodySm, { color: colors.textMuted, textAlign: 'center' }]}>{t('profile.empty.text')}</Text>
            <Button label={t('profile.empty.button')} onPress={() => router.navigate('/')} style={{ alignSelf: 'stretch' }} />
          </Card>
        ) : (
          <>
            <Pressable onPress={() => setSharing(true)} accessibilityRole="button" style={({ pressed }) => [styles.shareOpen, { opacity: pressed ? 0.85 : 1 }]}>
              <Share2 color={colors.text} size={20} />
              <View style={{ flex: 1 }}>
                <Text style={[type.label, { color: colors.text }]}>{t('profile.share.button')}</Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>{t('profile.share.buttonNote')}</Text>
              </View>
            </Pressable>

            <View style={styles.grid}>
              {tiles.map((tile, i) => (
                <StatTile key={tile.key} tile={tile} index={i} value={shown(tile)} edited={tile.key in profile.overrides} onPress={() => setOverrideTile(tile)} />
              ))}
            </View>

            <Text style={styles.heading}>{t('profile.ai.section')}</Text>
            {ai.length ? (
              <View style={styles.grid}>
                {ai.map((tile, i) => (
                  <StatTile key={tile.key} tile={{ ...tile, wide: true }} index={i + 2} value={shown(tile)} edited={tile.key in profile.overrides} onPress={() => setOverrideTile(tile)} />
                ))}
              </View>
            ) : sub?.pro ? (
              <Card>
                <Text style={[type.bodySm, { color: colors.textMuted }]}>🤖 {t('profile.ai.emptyNote')}</Text>
              </Card>
            ) : (
              <View style={styles.grid}>
                {(['lies', 'manipulation', 'desire', 'karne'] as const).map((k, i) => (
                  <Pressable key={k} onPress={() => router.push('/pro')} accessibilityRole="button" style={[styles.tile, styles.locked, { backgroundColor: TILE_BGS[(i + 1) % TILE_BGS.length] }]}>
                    <Sticker text="🔒" rotate={i % 2 ? 6 : -6} style={styles.tileSticker} />
                    <Text style={styles.tileTitle}>{t(`profile.ai.${k}`)}</Text>
                    <Text style={styles.tileValue}>{NONE()}</Text>
                    <Text style={styles.tileSub}>{t('profile.ai.locked')}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <EditProfile
        visible={editing}
        profile={profile}
        onClose={() => setEditing(false)}
        onSave={(p) => {
          update(p);
          setEditing(false);
        }}
      />
      <ShareBuilder
        visible={sharing}
        profile={profile}
        avatarProfile={shownProfile}
        name={name}
        tiles={[...tiles, ...ai]}
        onClose={() => setSharing(false)}
        onChange={(p) => {
          // Kart seçimi yalnız yerel dosyaya yazılır, sunucuya gitmez.
          setProfile(p);
          writeProfile(p);
        }}
      />
      <OverrideSheet
        tile={overrideTile}
        current={overrideTile ? profile.overrides[overrideTile.key] ?? '' : ''}
        onClose={() => setOverrideTile(null)}
        onSave={(v) => {
          if (overrideTile) setOverride(overrideTile.key, v);
          setOverrideTile(null);
        }}
      />
    </SafeAreaView>
  );
}

function StatTile({ tile, index, value, edited, onPress }: { tile: Tile; index: number; value: string; edited: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.tile, tile.wide && styles.wide, { backgroundColor: TILE_BGS[index % TILE_BGS.length], opacity: pressed ? 0.85 : 1 }]}>
      <Sticker text={tile.emoji} rotate={index % 2 ? 7 : -7} style={styles.tileSticker} />
      <Text style={styles.tileTitle}>{tile.title}</Text>
      <Text style={styles.tileValue} numberOfLines={tile.wide ? 2 : 1} adjustsFontSizeToFit>
        {value}
      </Text>
      {!edited && tile.sub ? (
        <Text style={styles.tileSub} numberOfLines={3}>
          {tile.sub}
        </Text>
      ) : null}
      {edited ? <Text style={styles.tileSub}>✏️ {t('profile.stats.edited')}</Text> : null}
    </Pressable>
  );
}

/** Paylaşılabilir profil kartı: avatar, ad, seçilen kutular (en çok 8) ve marka. */
function ShareCardView({ avatarProfile, name, tiles, shown, bg }: { avatarProfile: Pick<Profile, 'avatar' | 'frame'>; name: string; tiles: Tile[]; shown: (tile: Tile) => string | null; bg: string }) {
  // Tek sayıda kutuda sonuncusu tam genişlik olur, boşluk kalmaz.
  const odd = tiles.length % 2 === 1;
  return (
    <View style={[styles.shareable, { backgroundColor: bg }]}>
      <View style={styles.shareHead}>
        <ProfileAvatar profile={avatarProfile} size={56} />
        <Text style={[styles.name, { flex: 1 }]} numberOfLines={1}>{name}</Text>
      </View>
      <View style={styles.shareGrid}>
        {tiles.map((tile, i) => (
          <View key={tile.key} style={[styles.shareCell, odd && i === tiles.length - 1 && styles.wide]}>
            <Text style={styles.shareValue} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
              {shown(tile)}
            </Text>
            <Text style={styles.tileSub} numberOfLines={2}>
              {tile.emoji} {tile.title}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.brand}>✦ Unwrap</Text>
    </View>
  );
}

/**
 * "Kartını oluştur": üstte canlı önizleme, altta seçilebilir istatistikler.
 * Değeri olmayan (null) kutu listede yok; karta uydurma değer girmez.
 * Seçim ve renk yalnız telefonda saklanır.
 */
function ShareBuilder({ visible, profile, avatarProfile, name, tiles, onClose, onChange }: {
  visible: boolean;
  profile: Profile;
  avatarProfile: Pick<Profile, 'avatar' | 'frame'>;
  name: string;
  tiles: Tile[];
  onClose: () => void;
  onChange: (p: Profile) => void;
}) {
  const topInset = useTopInset();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const ref = useRef<View>(null);
  const [cardH, setCardH] = useState(CARD_W * 1.25);
  const [busy, setBusy] = useState(false);

  const shown = (tile: Tile) => profile.overrides[tile.key] ?? tile.value;
  // Aynı anahtar bir kez (yapay zekâ kutularında en yeni analiz kalır).
  const seen = new Set<string>();
  const options = tiles.filter((tile) => {
    if (seen.has(tile.key) || shown(tile) == null) return false;
    seen.add(tile.key);
    return true;
  });

  // Kayıtlı seçimdeki kutular artık yoksa varsayılana dön; bilerek boşaltılmışsa boş kalır.
  let keys = profile.shareKeys.filter((k) => seen.has(k));
  if (!keys.length && profile.shareKeys.length) keys = DEFAULT_SHARE_KEYS.filter((k) => seen.has(k));
  const selected = new Set(keys.slice(0, SHARE_MAX));
  const picked = options.filter((tile) => selected.has(tile.key));
  const full = picked.length >= SHARE_MAX;
  const bg = profile.shareColor && SHARE_COLORS.includes(profile.shareColor) ? profile.shareColor : SHARE_COLORS[0];

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else if (!full) next.add(key);
    onChange({ ...profile, shareKeys: options.map((o) => o.key).filter((k) => next.has(k)) });
  };

  // Kart sabit genişlikte çizilir, önizlemede ekrana sığacak kadar küçültülür.
  const scale = Math.min(1, (width - space.lg * 2) / CARD_W, (height * 0.4) / cardH);

  const share = async () => {
    setBusy(true);
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('profile.share.dialog') });
      bump('profile_shared');
    } catch {
      Alert.alert(t('profile.share.failTitle'), t('profile.share.failText'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.builder, { paddingTop: topInset, paddingBottom: insets.bottom || space.md }]}>
        <View style={styles.builderTop}>
          <Text style={styles.builderTitle} numberOfLines={1}>{t('profile.share.title')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('profile.share.close')} onPress={onClose} style={styles.close} hitSlop={12}>
            <X color={colors.text} size={20} />
          </Pressable>
        </View>

        <View style={styles.preview}>
          <View style={{ width: CARD_W * scale, height: cardH * scale }}>
            <View style={{ position: 'absolute', top: 0, left: 0, width: CARD_W, transform: [{ scale }], transformOrigin: 'left top' }}>
              {/* Yalnız bu görünüm resme dönüşür */}
              <View ref={ref} collapsable={false} onLayout={(e) => setCardH(e.nativeEvent.layout.height)}>
                <ShareCardView avatarProfile={avatarProfile} name={name} tiles={picked} shown={shown} bg={bg} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.builderBar}>
          <Text style={[type.label, { color: full ? colors.primary : colors.textMuted, flex: 1 }]} numberOfLines={1}>
            {t('profile.share.count', { n: picked.length, max: SHARE_MAX })}
            {full ? ` · ${t('profile.share.max', { max: SHARE_MAX })}` : ''}
          </Text>
          {SHARE_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => onChange({ ...profile, shareColor: c })}
              accessibilityRole="button"
              accessibilityLabel={t('profile.share.color')}
              accessibilityState={{ selected: c === bg }}
              hitSlop={6}
              style={[styles.smallSwatch, { backgroundColor: c }, c === bg && styles.selected]}
            />
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.pickList}>
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('profile.share.pick', { max: SHARE_MAX })}</Text>
          {options.map((tile) => {
            const on = selected.has(tile.key);
            const off = !on && full;
            return (
              <Pressable
                key={tile.key}
                onPress={() => toggle(tile.key)}
                disabled={off}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on, disabled: off }}
                style={[styles.pickRow, off && { opacity: 0.45 }]}>
                <Text style={{ fontSize: 22 }}>{tile.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1}>{tile.title}</Text>
                  <Text style={[type.label, { color: colors.text }]} numberOfLines={1}>
                    {tile.key in profile.overrides ? '✏️ ' : ''}
                    {shown(tile)}
                  </Text>
                </View>
                <View style={[styles.box, on && styles.boxOn]}>{on ? <Check color={colors.onPrimary} size={16} strokeWidth={3} /> : null}</View>
              </Pressable>
            );
          })}
        </ScrollView>

        {!picked.length ? <Text style={[type.caption, { color: colors.primary, textAlign: 'center', paddingTop: space.sm }]}>{t('profile.share.min')}</Text> : null}
        <View style={styles.builderButtons}>
          <Button label={t('profile.share.cancel')} variant="ghost" onPress={onClose} style={{ flex: 1 }} />
          <Button label={t('profile.share.share')} onPress={share} disabled={!picked.length} loading={busy} style={{ flex: 1 }} />
        </View>
      </View>
    </Modal>
  );
}

function EditProfile({ visible, profile, onClose, onSave }: { visible: boolean; profile: Profile; onClose: () => void; onSave: (p: Profile) => void }) {
  const [name, setName] = useState(profile.name ?? '');
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [genderTouched, setGenderTouched] = useState(false);

  // Her açılışta kayıtlı değerlerle başla.
  const onShow = () => {
    setName(profile.name ?? '');
    setGender(profile.gender);
    setGenderTouched(false);
  };
  const draft = (): Profile => ({ ...profile, name: name.trim() || null, gender, genderSet: profile.genderSet || genderTouched });

  // Avatar ayrı ekranda seçilir; yazılan ad kaybolmasın diye önce kaydedilir.
  const changeAvatar = () => {
    onSave(draft());
    router.push('/profil/avatar');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onShow={onShow} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('profile.override.close')} />
        <View style={styles.sheet}>
          <Text style={[type.title, { color: colors.text }]}>{t('profile.edit.title')}</Text>
          <Pressable onPress={changeAvatar} accessibilityRole="button" accessibilityLabel={t('profile.avatar.change')} style={{ alignSelf: 'center', alignItems: 'center', gap: space.sm }}>
            <ProfileAvatar profile={profile} size={AVATAR_SIZE} noFrame />
            <Text style={[type.label, { color: colors.purple }]}>✏️ {t('profile.avatar.change')}</Text>
          </Pressable>
          <Text style={styles.label}>{t('profile.edit.nameLabel')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('profile.edit.namePlaceholder')}
            placeholderTextColor={colors.textMuted}
            maxLength={40}
            style={styles.input}
          />
          <Text style={styles.label}>{t('profile.gender.label')}</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => (
              <Pill key={g} emoji={GENDER_EMOJI[g]} label={t(`profile.gender.${g}`)} active={g === gender} onPress={() => { setGender(g); setGenderTouched(true); }} />
            ))}
          </View>
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('profile.gender.note')}</Text>
          <Button label={t('profile.edit.save')} onPress={() => onSave(draft())} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function OverrideSheet({ tile, current, onClose, onSave }: { tile: Tile | null; current: string; onClose: () => void; onSave: (v: string | null) => void }) {
  const [text, setText] = useState(current);
  return (
    <Modal visible={!!tile} transparent animationType="slide" onShow={() => setText(current)} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('profile.override.close')} />
        {tile ? (
          <View style={styles.sheet}>
            <Text style={[type.title, { color: colors.text }]}>
              {tile.emoji} {tile.title}
            </Text>
            <Text style={[type.bodySm, { color: colors.textMuted }]}>{t('profile.override.autoValue', { value: tile.value ?? NONE() })}</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('profile.override.placeholder')}
              placeholderTextColor={colors.textMuted}
              maxLength={80}
              autoFocus
              style={styles.input}
            />
            <Button label={t('profile.override.save')} onPress={() => onSave(text.trim() || null)} />
            {current ? <Button label={t('profile.override.auto')} variant="ghost" onPress={() => onSave(null)} /> : null}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl },
  title: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.text },
  section: { fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1, color: colors.primary, marginTop: space.md },
  heading: { ...type.title, color: colors.text, marginTop: space.md },
  header: { alignItems: 'center', gap: space.sm },
  framePill: { backgroundColor: colors.cardPeach, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5, marginTop: -2 },
  name: { ...type.headline, color: colors.text },
  appleButton: { height: 50, width: '100%' },
  dangerLink: { alignSelf: 'center', paddingVertical: space.sm },
  loading: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.lg, paddingTop: space.sm },
  tile: { width: '48%', borderRadius: radius.lg, padding: space.md, paddingTop: space.lg, gap: 4, minHeight: 120 },
  wide: { width: '100%' },
  locked: { opacity: 0.45 },
  tileSticker: { position: 'absolute', top: -12, end: 10, paddingHorizontal: 8, paddingVertical: 4 },
  tileTitle: { ...type.caption, fontFamily: fonts.bold, color: colors.textMuted },
  tileValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  tileSub: { ...type.caption, color: colors.textMuted },
  shareOpen: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.cardLilac, borderRadius: radius.lg, padding: space.md },
  // Paylaşım kartı (portre, en az 4:5)
  shareable: { width: CARD_W, minHeight: CARD_W * 1.25, borderRadius: radius.lg, padding: space.lg, gap: space.md, justifyContent: 'space-between' },
  shareHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  shareGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.sm },
  shareCell: { width: '48%', minHeight: 84, backgroundColor: colors.surface, borderRadius: radius.md, padding: space.md, gap: 4, justifyContent: 'center' },
  shareValue: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  brand: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.primary, alignSelf: 'flex-end' },
  // Kart oluşturma ekranı
  builder: { flex: 1, backgroundColor: colors.background },
  builderTop: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm },
  builderTitle: { flex: 1, fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  preview: { alignItems: 'center', paddingHorizontal: space.lg, paddingBottom: space.sm },
  builderBar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm },
  smallSwatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  pickList: { paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.sm },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: space.md },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.purple, borderColor: colors.purple },
  builderButtons: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingTop: space.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg, paddingBottom: space.xl, gap: space.md },
  label: { ...type.label, color: colors.textMuted },
  input: { ...type.body, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 12 },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  genderAsk: { alignSelf: 'stretch', gap: space.sm, backgroundColor: colors.cardButter, borderRadius: radius.md, padding: space.md, marginTop: space.xs },
  selected: { borderColor: colors.purple },
});
