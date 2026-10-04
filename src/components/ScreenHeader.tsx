import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme, fontFamily, fontSize, letterSpacing, type ThemeColors } from '../theme';

/**
 * Geri gider; geçmiş yoksa (ör. bildirimden ya da derin bağlantıyla
 * açıldıysa) ana sayfaya döner.
 */
export function useSafeBack(): () => void {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
}

/**
 * Native stack başlığı yerine kullanılan başlık. iOS'ta sistem başlığındaki
 * geri tuşu, aynı ekrana ikinci kez girildiğinde dokunuşlara yanıt vermez
 * hale gelebiliyordu; kendi tuşumuz bu sorundan etkilenmiyor. Kullanan
 * ekranın Stack.Screen ayarında headerShown: false olmalı.
 */
export function ScreenHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const goBack = useSafeBack();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Pressable
        onPress={goBack}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        hitSlop={8}
      >
        <ArrowLeft color={colors.text} size={20} strokeWidth={2.2} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.glassBorder,
      backgroundColor: colors.background,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glassBg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    title: {
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 8,
      fontSize: fontSize.title,
      fontFamily: fontFamily.bodyBold,
      color: colors.text,
      letterSpacing: letterSpacing.title,
    },
    spacer: { width: 40, height: 40 },
  });
}
