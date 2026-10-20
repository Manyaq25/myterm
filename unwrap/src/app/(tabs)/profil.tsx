// Profil: avatar + ad, Apple hesabı, abonelik durumu ve "benim istatistiklerim".
// İstatistikler telefonda hesaplanır; boş değer uydurulmaz, "– –" gösterilir.
import * as AppleAuthentication from 'expo-apple-authentication';
import { router, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { Share2 } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Purchases from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { Button, Card, Sticker } from '@/components/ui';
import { locale, t } from '@/i18n';
import { formatDuration } from '@/lib/chat/stats';
import { appleAvailable, deleteAccount, saveProfile, signIn, signOut } from '@/lib/profile/account';
import { computeMyStats, type Moment, type MyStats } from '@/lib/profile/stats';
import { getAccount, getProfile, type Account, type Profile } from '@/lib/profile/store';
import { hasPro, initPurchases, managementUrl } from '@/lib/purchases';
import { getAnalysis, listAnalyses, type Analysis } from '@/lib/store';
import { colors, fonts, radius, space, type } from '@/theme';

// Avatar seçenekleri: sunucu en çok 8 UTF-16 birimi kabul eder, birleşik emoji yok.
const EMOJIS = ['🙂', '😎', '🤩', '🥳', '😇', '🤓', '😏', '🥰', '😈', '👻', '👽', '🤖', '🦄', '🐱', '🐶', '🦊', '🐼', '🐸', '🐵', '🌸', '🌈', '🔥', '⭐', '💎'];
const AVATAR_COLORS = [colors.cardLilac, colors.cardPeach, colors.cardMint, colors.cardButter, colors.cardCoral, colors.lilac];
const DEFAULT_AVATAR = { emoji: '🙂', color: colors.cardLilac };
const TILE_BGS = [colors.cardPeach, colors.cardLilac, colors.cardMint, colors.cardButter, colors.cardCoral, colors.surface];

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
  const rows: Tile[] = s.ai.map((a) => ({ key: `ai.${a.key}`, emoji: '🤖', title: a.title, value: a.display, sub: a.chat }));
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
  const [editing, setEditing] = useState(false);
  const [overrideTile, setOverrideTile] = useState<Tile | null>(null);
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
        const all = listAnalyses()
          .map((a) => getAnalysis(a.id))
          .filter((a): a is Analysis => !!a);
        const mine = all.some((a) => !!a.me);
        setHasMe(mine);
        setStats(mine ? computeMyStats(all) : null);
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

  const avatar = profile.avatar ?? DEFAULT_AVATAR;
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
            <View style={[styles.bigAvatar, { backgroundColor: avatar.color }]}>
              <Text style={styles.bigAvatarEmoji}>{avatar.emoji}</Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>✏️ {t('profile.tapToEdit')}</Text>
          </Card>
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
            <ShareCard avatar={avatar} name={name} tiles={tiles.filter((x) => ['chats', 'messages', 'favoriteWord', 'favoriteEmoji'].includes(x.key))} shown={shown} />

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

/** Paylaşılabilir profil kartı (avatar, ad, 4 öne çıkan sayı). */
function ShareCard({ avatar, name, tiles, shown }: { avatar: { emoji: string; color: string }; name: string; tiles: Tile[]; shown: (tile: Tile) => string }) {
  const ref = useRef<View>(null);
  const share = async () => {
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('profile.share.dialog') });
    } catch {
      Alert.alert(t('profile.share.failTitle'), t('profile.share.failText'));
    }
  };
  return (
    <View>
      <View ref={ref} collapsable={false} style={styles.shareable}>
        <View style={styles.shareHead}>
          <View style={[styles.smallAvatar, { backgroundColor: avatar.color }]}>
            <Text style={{ fontSize: 30 }}>{avatar.emoji}</Text>
          </View>
          <Text style={[styles.name, { flex: 1 }]} numberOfLines={1}>{name}</Text>
        </View>
        <View style={styles.shareGrid}>
          {tiles.map((tile) => (
            <View key={tile.key} style={styles.shareCell}>
              <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
                {shown(tile)}
              </Text>
              <Text style={styles.tileSub} numberOfLines={1}>
                {tile.title}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.brand}>✦ Unwrap</Text>
      </View>
      <Pressable onPress={share} style={styles.shareBtn} accessibilityRole="button">
        <Share2 color={colors.text} size={16} />
        <Text style={[type.label, { color: colors.text }]}>{t('profile.share.button')}</Text>
      </Pressable>
    </View>
  );
}

function EditProfile({ visible, profile, onClose, onSave }: { visible: boolean; profile: Profile; onClose: () => void; onSave: (p: Profile) => void }) {
  const [name, setName] = useState(profile.name ?? '');
  const [emoji, setEmoji] = useState(profile.avatar?.emoji ?? DEFAULT_AVATAR.emoji);
  const [color, setColor] = useState(profile.avatar?.color ?? DEFAULT_AVATAR.color);

  // Her açılışta kayıtlı değerlerle başla.
  const onShow = () => {
    setName(profile.name ?? '');
    setEmoji(profile.avatar?.emoji ?? DEFAULT_AVATAR.emoji);
    setColor(profile.avatar?.color ?? DEFAULT_AVATAR.color);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onShow={onShow} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('profile.override.close')} />
        <View style={styles.sheet}>
          <Text style={[type.title, { color: colors.text }]}>{t('profile.edit.title')}</Text>
          <View style={[styles.bigAvatar, { backgroundColor: color, alignSelf: 'center' }]}>
            <Text style={styles.bigAvatarEmoji}>{emoji}</Text>
          </View>
          <Text style={styles.label}>{t('profile.edit.nameLabel')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('profile.edit.namePlaceholder')}
            placeholderTextColor={colors.textMuted}
            maxLength={40}
            style={styles.input}
          />
          <Text style={styles.label}>{t('profile.edit.emojiLabel')}</Text>
          <View style={styles.emojiGrid}>
            {EMOJIS.map((e) => (
              <Pressable key={e} onPress={() => setEmoji(e)} accessibilityRole="button" accessibilityState={{ selected: e === emoji }} style={[styles.emojiCell, e === emoji && styles.selected]}>
                <Text style={{ fontSize: 24 }}>{e}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>{t('profile.edit.colorLabel')}</Text>
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} accessibilityRole="button" accessibilityState={{ selected: c === color }} style={[styles.swatch, { backgroundColor: c }, c === color && styles.selected]} />
            ))}
          </View>
          <Button label={t('profile.edit.save')} onPress={() => onSave({ ...profile, name: name.trim() || null, avatar: { emoji, color } })} />
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
  bigAvatar: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  bigAvatarEmoji: { fontSize: 56 },
  smallAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
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
  shareable: { borderRadius: radius.lg, padding: space.lg, gap: space.md, backgroundColor: colors.cardLilac },
  shareHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  shareGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.sm },
  shareCell: { width: '48%', backgroundColor: colors.surface, borderRadius: radius.md, padding: space.md },
  brand: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.primary, alignSelf: 'flex-end' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingVertical: space.sm, paddingHorizontal: space.md },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg, paddingBottom: space.xl, gap: space.md },
  label: { ...type.label, color: colors.textMuted },
  input: { ...type.body, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 12 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  emojiCell: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 2, borderColor: 'transparent' },
  colorRow: { flexDirection: 'row', gap: space.md },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  selected: { borderColor: colors.purple },
});
