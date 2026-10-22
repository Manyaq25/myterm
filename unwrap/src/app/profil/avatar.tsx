// Avatar seçimi: hazır karakterler, emoji, kendi fotoğrafın ve çift/bestie çerçeveleri (Pro).
// Fotoğraflar yalnız telefonda durur; seçim "Kaydet" ile profile yazılır.
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarArt } from '@/components/avatars/AvatarArt';
import { AVATAR_PRESETS, type PresetGender } from '@/components/avatars/presets';
import { FrameArt } from '@/components/frames/FrameArt';
import { FRAMES, type FrameGroup } from '@/components/frames/frames';
import { DEFAULT_AVATAR, partnerSlot, ProfileAvatar, slotFor } from '@/components/ProfileAvatar';
import { BackButton, Button, Pill, Sticker, useTopInset } from '@/components/ui';
import { t } from '@/i18n';
import { saveProfile } from '@/lib/profile/account';
import type { Avatar, Frame } from '@/lib/profile/avatar';
import { cleanupPhotos, photoExists, pickPhoto } from '@/lib/profile/photo';
import { getProfile } from '@/lib/profile/store';
import { isPro } from '@/lib/purchases';
import { colors, fonts, radius, space, type } from '@/theme';

// Emoji: sunucu en çok 8 UTF-16 birimi kabul eder, birleşik emoji yok.
const EMOJIS = ['🙂', '😎', '🤩', '🥳', '😇', '🤓', '😏', '🥰', '😈', '👻', '👽', '🤖', '🦄', '🐱', '🐶', '🦊', '🐼', '🐸', '🐵', '🌸', '🌈', '🔥', '⭐', '💎'];
const AVATAR_COLORS = [colors.cardLilac, colors.cardPeach, colors.cardMint, colors.cardButter, colors.cardCoral, colors.lilac, colors.surfaceMid];

type Tab = 'characters' | 'emoji' | 'photo' | 'frames';
const TABS: { key: Tab; emoji: string }[] = [
  { key: 'characters', emoji: '🧑' },
  { key: 'emoji', emoji: '😎' },
  { key: 'photo', emoji: '📷' },
  { key: 'frames', emoji: '💞' },
];
type Filter = 'all' | PresetGender;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'all' },
  { key: 'f', label: 'female' },
  { key: 'm', label: 'male' },
  { key: 'n', label: 'neutral' },
];
const GROUPS: FrameGroup[] = ['love', 'friends'];

const isTab = (v: unknown): v is Tab => TABS.some((x) => x.key === v);

export default function AvatarPicker() {
  const topInset = useTopInset();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(isTab(params.tab) ? params.tab : 'characters');
  const [filter, setFilter] = useState<Filter>('all');
  const [avatar, setAvatar] = useState<Avatar>(() => getProfile().avatar ?? DEFAULT_AVATAR);
  const [frame, setFrame] = useState<Frame | null>(() => getProfile().frame);
  const [pro, setPro] = useState(false);
  const [picking, setPicking] = useState(false);

  // Pro'dan dönünce kilitler açılsın
  useFocusEffect(
    useCallback(() => {
      isPro().then(setPro);
    }, []),
  );
  // Seçilip kaydedilmeyen fotoğraflar çıkışta silinir.
  useEffect(() => () => cleanupPhotos(getProfile()), []);

  const inner = width - space.lg * 2;
  const charCell = Math.floor((inner - space.sm * 3) / 4);
  const frameCell = Math.floor((inner - space.sm * 2) / 3);
  const color = avatar.color;
  const photoFile = avatar.kind === 'photo' ? avatar.file : null;

  const pick = async (who: 'ben' | 'es') => {
    setPicking(true);
    try {
      const file = await pickPhoto(who);
      if (!file) return;
      if (who === 'ben') setAvatar({ kind: 'photo', file, color });
      else if (frame) setFrame({ ...frame, partnerFile: file });
    } catch {
      Alert.alert(t('profile.avatar.photoFailTitle'), t('profile.avatar.photoFailText'));
    } finally {
      setPicking(false);
    }
  };

  const chooseFrame = (id: string | null) => {
    if (!id) return setFrame(null);
    if (!pro) return router.push('/pro');
    setFrame({ id, partnerFile: frame?.partnerFile ?? null });
  };

  const save = () => {
    // Pro değilken çerçeve değiştirilemez; kayıtlı olan olduğu gibi kalır.
    const saved = getProfile();
    const p = { ...saved, avatar, frame: pro ? frame : saved.frame };
    saveProfile(p);
    cleanupPhotos(p);
    router.back();
  };

  const self = slotFor(avatar);
  const partner = partnerSlot(frame?.partnerFile ?? null);

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: topInset }]} edges={['bottom', 'left', 'right']}>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title} numberOfLines={1}>{t('profile.avatar.title')}</Text>
      </View>

      <View style={styles.preview}>
        <ProfileAvatar profile={{ avatar, frame: pro ? frame : null }} size={112} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.tabs}>
        {TABS.map((x) => (
          <Pill key={x.key} emoji={x.emoji} label={t(`profile.avatar.tabs.${x.key}`)} active={tab === x.key} onPress={() => setTab(x.key)} />
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {tab !== 'frames' ? (
          <>
            <Text style={styles.label}>{t('profile.avatar.colorLabel')}</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setAvatar({ ...avatar, color: c })}
                  accessibilityRole="button"
                  accessibilityLabel={t('profile.avatar.colorLabel')}
                  accessibilityState={{ selected: c === color }}
                  style={[styles.swatch, { backgroundColor: c }, c === color && styles.selected]}
                />
              ))}
            </View>
          </>
        ) : null}

        {tab === 'characters' ? (
          <>
            <View style={styles.chips}>
              {FILTERS.map((f) => (
                <Pill key={f.key} label={t(`profile.avatar.filter.${f.label}`)} active={filter === f.key} onPress={() => setFilter(f.key)} />
              ))}
            </View>
            <View style={styles.grid}>
              {AVATAR_PRESETS.filter((p) => filter === 'all' || p.gender === filter).map((p, i) => {
                const on = avatar.kind === 'preset' && avatar.id === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setAvatar({ kind: 'preset', id: p.id, color })}
                    accessibilityRole="button"
                    accessibilityLabel={t('profile.avatar.character', { n: i + 1 })}
                    accessibilityState={{ selected: on }}
                    style={[styles.cell, { width: charCell, height: charCell, borderRadius: charCell / 2 }, on && styles.selected]}>
                    <AvatarArt id={p.id} size={charCell - 4} bg={color} />
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {tab === 'emoji' ? (
          <View style={styles.grid}>
            {EMOJIS.map((e) => {
              const on = avatar.kind === 'emoji' && avatar.emoji === e;
              return (
                <Pressable
                  key={e}
                  onPress={() => setAvatar({ kind: 'emoji', emoji: e, color })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[styles.cell, { width: charCell, height: charCell, borderRadius: charCell / 2, backgroundColor: color }, on && styles.selected]}>
                  <Text style={{ fontSize: charCell * 0.5 }}>{e}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {tab === 'photo' ? (
          <View style={styles.box}>
            <Text style={[type.title, { color: colors.text }]}>📷 {t('profile.avatar.photoTitle')}</Text>
            <Text style={[type.bodySm, { color: colors.textMuted }]}>🔒 {t('profile.avatar.photoNote')}</Text>
            <Button
              label={t(photoFile && photoExists(photoFile) ? 'profile.avatar.photoChange' : 'profile.avatar.photoPick')}
              onPress={() => pick('ben')}
              loading={picking}
            />
          </View>
        ) : null}

        {tab === 'frames' ? (
          <>
            <View style={styles.box}>
              <Text style={[type.title, { color: colors.text }]}>{t('profile.frames.title')}</Text>
              <Text style={[type.bodySm, { color: colors.textMuted }]}>{t('profile.frames.note')}</Text>
              {!pro ? (
                <Pressable onPress={() => router.push('/pro')} accessibilityRole="button">
                  <Text style={[type.label, { color: colors.primary }]}>✦ {t('profile.frames.proNote')}</Text>
                </Pressable>
              ) : null}
            </View>

            {/* İkinci kişinin fotoğrafı (yalnız Pro ve çerçeve seçiliyken) */}
            {pro && frame ? (
              <View style={styles.box}>
                <Text style={[type.label, { color: colors.text }]}>{t('profile.frames.partnerTitle')}</Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>🔒 {t('profile.frames.partnerNote')}</Text>
                <Button
                  label={t(frame.partnerFile ? 'profile.frames.partnerChange' : 'profile.frames.partnerPick')}
                  onPress={() => pick('es')}
                  loading={picking}
                />
                {frame.partnerFile ? (
                  <Button label={t('profile.frames.partnerRemove')} variant="ghost" onPress={() => setFrame({ ...frame, partnerFile: null })} />
                ) : null}
              </View>
            ) : null}

            <Pressable
              onPress={() => chooseFrame(null)}
              accessibilityRole="button"
              accessibilityState={{ selected: !frame }}
              style={[styles.noFrame, !frame && styles.selected]}>
              <Text style={[type.label, { color: colors.text }]}>⭕ {t('profile.frames.none')}</Text>
            </Pressable>

            {GROUPS.map((g) => (
              <View key={g} style={{ gap: space.sm }}>
                <Text style={styles.group}>{t(`profile.frames.${g}`)}</Text>
                <View style={styles.grid}>
                  {FRAMES.filter((f) => f.group === g).map((f, i) => {
                    const on = pro && frame?.id === f.id;
                    return (
                      <Pressable
                        key={f.id}
                        onPress={() => chooseFrame(f.id)}
                        accessibilityRole="button"
                        accessibilityLabel={t(`profile.frames.items.${f.id}`)}
                        accessibilityState={{ selected: on }}
                        style={[styles.frameCell, { width: frameCell }, on && styles.selected]}>
                        <FrameArt id={f.id} size={frameCell - 12} self={self} partner={partner} />
                        <Text style={styles.frameName} numberOfLines={1}>
                          {f.emoji} {t(`profile.frames.items.${f.id}`)}
                        </Text>
                        {!pro ? <Sticker text={t('profile.frames.pro')} rotate={i % 2 ? 6 : -6} style={styles.lock} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

      <View style={styles.bottom}>
        <Button label={t('profile.avatar.save')} onPress={save} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm },
  title: { flex: 1, fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  preview: { alignItems: 'center', justifyContent: 'center', height: 150 },
  tabs: { paddingHorizontal: space.lg, paddingBottom: space.sm, gap: space.sm },
  content: { padding: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: space.xl },
  label: { ...type.label, color: colors.textMuted },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  selected: { borderColor: colors.purple },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cell: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  box: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  noFrame: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.md, borderWidth: 2, borderColor: 'transparent' },
  group: { ...type.title, color: colors.text, marginTop: space.sm },
  frameCell: { alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: 6, borderWidth: 2, borderColor: 'transparent' },
  frameName: { ...type.caption, fontFamily: fonts.bold, color: colors.text, paddingHorizontal: 4 },
  lock: { position: 'absolute', top: -8, end: -4, paddingHorizontal: 8, paddingVertical: 3 },
  bottom: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.sm },
});
