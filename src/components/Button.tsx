import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { fontFamily, fontSize, letterSpacing } from '../theme/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'ghostDanger' | 'dangerTonal';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
} & Omit<PressableProps, 'onPress' | 'style' | 'children'>;

/**
 * Paylaşılan buton bileşeni — Stitch "Kinetic Luster" spesifikasyonuna göre:
 * primary aksiyon dikey gradyan + üst spekular vurgu + teal parlama gölgesi
 * taşır, ikincil aksiyon donuk camsı (frosted glass) bir yüzey kullanır.
 */
export function Button({ label, onPress, variant = 'primary', disabled, loading, icon, onFocus, onBlur, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const isDisabled = disabled || loading;

  const textColor: Record<ButtonVariant, string> = {
    primary: colors.onPrimary,
    secondary: colors.primaryText,
    success: colors.onPrimaryContainer,
    ghostDanger: colors.danger,
    dangerTonal: colors.danger,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && [styles.glow, { shadowColor: colors.primary }],
        variant === 'success' && { backgroundColor: colors.primaryContainer },
        variant === 'dangerTonal' && { backgroundColor: colors.dangerContainer },
        variant === 'secondary' && {
          backgroundColor: colors.glassBg,
          borderWidth: 1.5,
          borderColor: colors.glassBorder,
        },
        variant === 'ghostDanger' && styles.ghost,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      {...rest}
    >
      {variant === 'primary' && (
        <LinearGradient
          pointerEvents="none"
          colors={[lighten(colors.primary), colors.primary]}
          style={[StyleSheet.absoluteFillObject, styles.roundedFill]}
        />
      )}
      {variant === 'primary' && (
        // Üst spekular vurgu — camsı/tactile butonun "top inset highlight" hissi
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
          style={styles.specular}
        />
      )}
      {/* Klavye ile odaklanıldığında gösterilen halka — dokunmatik dokunuşlarda
          değil, gerçek focus olayında (harici klavye, TV kumandası, web'de Tab)
          tetiklenir. */}
      {focused && !isDisabled && (
        <View pointerEvents="none" style={[styles.focusRing, variant === 'ghostDanger' && styles.focusRingGhost, { borderColor: colors.primary }]} />
      )}
      {loading ? (
        <ActivityIndicator color={textColor[variant]} />
      ) : (
        <View style={styles.labelRow}>
          {icon}
          <Text style={[styles.label, { color: textColor[variant] }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

function lighten(hex: string): string {
  const clean = hex.replace('#', '');
  const r = Math.min(255, parseInt(clean.substring(0, 2), 16) + 24);
  const g = Math.min(255, parseInt(clean.substring(2, 4), 16) + 24);
  const b = Math.min(255, parseInt(clean.substring(4, 6), 16) + 24);
  return `rgb(${r}, ${g}, ${b})`;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    shadowOpacity: 0.38,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  roundedFill: {
    borderRadius: 16,
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: fontFamily.label,
    fontSize: fontSize.button,
    letterSpacing: letterSpacing.label,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.94,
  },
  focusRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    borderWidth: 2,
  },
  focusRingGhost: {
    borderRadius: 10,
  },
});
