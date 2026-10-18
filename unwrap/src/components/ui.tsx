// Uygulama genelinde kullanılan küçük yapı taşları.
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius, space, type } from '@/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'dark' | 'coral' | 'ghost';
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'dark', icon, loading, disabled, style }: ButtonProps) {
  const bg = variant === 'dark' ? colors.black : variant === 'coral' ? colors.coral : colors.surfaceMid;
  const fg = variant === 'ghost' ? colors.text : colors.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
          {icon}
        </>
      )}
    </Pressable>
  );
}

export function Pill({ label, active, onPress, emoji }: { label: string; active?: boolean; onPress?: () => void; emoji?: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, { backgroundColor: active ? colors.lilac : colors.surfaceMid, borderColor: active ? colors.purple : 'transparent' }]}>
      {emoji ? <Text style={styles.pillEmoji}>{emoji}</Text> : null}
      <Text style={[type.label, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Note({ icon, title, text }: { icon: string; title: string; text?: string }) {
  return (
    <View style={styles.note}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[type.label, { color: colors.text }]}>{title}</Text>
        {text ? <Text style={[type.caption, { color: colors.textMuted }]}>{text}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  buttonText: { fontFamily: fonts.bold, fontSize: 17 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  pillEmoji: { fontSize: 18 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    shadowColor: '#AE2F34',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
  },
});
