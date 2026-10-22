// Profil avatarının tek çizim noktası: emoji, hazır karakter, fotoğraf ya da çift çerçevesi.
// Profil başlığı, düzenleme penceresi ve paylaşım kartı hepsi bunu kullanır.
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { AvatarArt } from '@/components/avatars/AvatarArt';
import { FrameArt, type SlotContent } from '@/components/frames/FrameArt';
import { getFrame } from '@/components/frames/frames';
import type { Avatar } from '@/lib/profile/avatar';
import { photoExists, photoUri } from '@/lib/profile/photo';
import type { Profile } from '@/lib/profile/store';
import { colors } from '@/theme';

export const DEFAULT_AVATAR: Avatar = { kind: 'emoji', emoji: '🙂', color: colors.cardLilac };
/** Çerçevede eşin/bestinin fotoğrafı yokken silüet zemini */
export const PARTNER_BG = colors.cardPeach;
/** Çerçeveler daireden geniş durur; aynı boyutta daha büyük çizilir. */
export const FRAME_SCALE = 1.25;

/** Avatarı çerçeve yuvasına konacak içeriğe çevirir (fotoğraf silindiyse emojiye düşer). */
export function slotFor(a: Avatar | null): SlotContent {
  const av = a ?? DEFAULT_AVATAR;
  if (av.kind === 'photo') {
    return photoExists(av.file) ? { type: 'photo', uri: photoUri(av.file), color: av.color } : { type: 'emoji', emoji: '🙂', color: av.color };
  }
  if (av.kind === 'preset') return { type: 'preset', id: av.id, color: av.color };
  return { type: 'emoji', emoji: av.emoji, color: av.color };
}

export function partnerSlot(file: string | null): SlotContent {
  return file && photoExists(file) ? { type: 'photo', uri: photoUri(file), color: PARTNER_BG } : { type: 'silhouette', color: PARTNER_BG };
}

/** Yalnız avatar (çerçevesiz), yuvarlak. */
export function AvatarCircle({ avatar, size }: { avatar: Avatar | null; size: number }) {
  const c = slotFor(avatar);
  const round = { width: size, height: size, borderRadius: size / 2, backgroundColor: c.color };
  return (
    <View style={[styles.circle, round]}>
      {c.type === 'photo' ? (
        <Image source={{ uri: c.uri }} style={{ width: size, height: size }} contentFit="cover" />
      ) : c.type === 'preset' ? (
        <AvatarArt id={c.id} size={size} />
      ) : (
        <Text style={{ fontSize: size * 0.54 }}>{c.type === 'emoji' ? c.emoji : '🙂'}</Text>
      )}
    </View>
  );
}

/**
 * Profilin avatarı; çerçeve seçiliyse iki kişilik çerçeve (size × FRAME_SCALE).
 * noFrame: çerçeveyi gizle (Pro bittiyse ya da yalnız avatar gerekiyorsa).
 */
export function ProfileAvatar({ profile, size, noFrame }: { profile: Pick<Profile, 'avatar' | 'frame'>; size: number; noFrame?: boolean }) {
  if (profile.frame && !noFrame && getFrame(profile.frame.id)) {
    return <FrameArt id={profile.frame.id} size={Math.round(size * FRAME_SCALE)} self={slotFor(profile.avatar)} partner={partnerSlot(profile.frame.partnerFile)} />;
  }
  return <AvatarCircle avatar={profile.avatar} size={size} />;
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
