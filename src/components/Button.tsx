import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { useTheme } from '../theme';
import { fontFamily, fontSize } from '../theme/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'ghostDanger';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
} & Omit<PressableProps, 'onPress' | 'style' | 'children'>;

/**
 * Paylaşılan buton bileşeni. Birincil (dolu) ve ikincil/tehlikeli (çerçeveli
 * ya da düz metin) aksiyonlar görsel olarak net ayrışsın diye tek yerden
 * yönetiliyor — ekranlar artık kendi buton stillerini tekrar tanımlamıyor.
 */
export function Button({ label, onPress, variant = 'primary', disabled, loading, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const textColor: Record<ButtonVariant, string> = {
    primary: colors.onPrimary,
    secondary: colors.primary,
    success: colors.onPrimary,
    ghostDanger: colors.danger,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'success' && { backgroundColor: colors.primarySoft },
        variant === 'secondary' && {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primarySoft,
          paddingVertical: 13.5,
        },
        variant === 'ghostDanger' && styles.ghost,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} />
      ) : (
        <Text style={[styles.label, { color: textColor[variant] }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.button,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
