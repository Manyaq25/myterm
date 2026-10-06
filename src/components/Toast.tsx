import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';

type Listener = (message: string) => void;

const listeners = new Set<Listener>();

/** Ekranın üstünde kısa süreli, dokunmayı engellemeyen bir bilgi mesajı gösterir. */
export function showToast(message: string): void {
  for (const listener of listeners) listener(message);
}

const VISIBLE_MS = 2500;

export function ToastHost() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const listener: Listener = (next) => {
      setMessage(next);
      if (hideTimer) clearTimeout(hideTimer);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      hideTimer = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => {
          // Kaybolurken yeni bir mesaj geldiyse animasyon yarıda kesilir; o mesajı silme.
          if (finished) setMessage(null);
        });
      }, VISIBLE_MS);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [opacity]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.container, { top: insets.top + 12, opacity }]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 16,
      right: 16,
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: colors.text,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    text: {
      color: colors.background,
      fontFamily: fontFamily.bodySemiBold,
      fontSize: fontSize.small,
      textAlign: 'center',
    },
  });
}
