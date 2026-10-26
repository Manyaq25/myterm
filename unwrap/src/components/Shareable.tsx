// Paylaşılabilir kart: içeriği resim olarak dışa aktarılır (rapor ve hikâye ekranları).
import * as Sharing from 'expo-sharing';
import { Share2 } from 'lucide-react-native';
import { useRef, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { t } from '@/i18n';
import { bump } from '@/lib/profile/activity';
import { colors, fonts, radius, space, type } from '@/theme';

export async function shareView(ref: React.RefObject<View | null>, size?: { width: number; height: number }) {
  try {
    const uri = await captureRef(ref, { format: 'png', quality: 1, ...(size ?? {}) });
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('report.shareDialog') });
    bump('card_shared');
  } catch {
    Alert.alert(t('report.shareFailTitle'), t('report.shareFailBody'));
  }
}

export function Shareable({ bg, children, style }: { bg: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const ref = useRef<View>(null);
  return (
    <View>
      <View ref={ref} collapsable={false} style={[styles.shareable, { backgroundColor: bg }, style]}>
        {children}
        <Text style={styles.brand}>Unwrap</Text>
      </View>
      <Pressable onPress={() => shareView(ref)} style={styles.shareBtn} accessibilityLabel={t('report.shareLabel')}>
        <Share2 color={colors.text} size={16} />
        <Text style={[type.label, { color: colors.text }]}>{t('report.share')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shareable: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  brand: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.textMuted, alignSelf: 'flex-end' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingVertical: space.sm, paddingHorizontal: space.md },
});
