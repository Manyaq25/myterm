import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme, hexToRgba } from '../theme';

interface Props {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 26;
const THUMB_SIZE = 22;
const THUMB_INSET = 2;

/**
 * Native Switch yerine sıfırdan kurulmuş, platforma göre değişmeyen bir
 * toggle — Stitch'in Ayarlar export'undaki düz iki-renkli (gri/teal)
 * tasarımla birebir eşleşiyor. Native Switch'in iki sorunu vardı: rengi
 * platforma göre marka dışı bir mavi/yeşile dönüyordu, ve Android'de
 * dokunma/gölge katmanı yuvarlak track'in etrafında köşeli bir "kutu"
 * artefaktı bırakıyordu.
 */
export function ThemedSwitch({ value, onValueChange, disabled, accessibilityLabel }: Props) {
  const { colors } = useTheme();

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(value ? colors.primary : hexToRgba(colors.text, 0.16), { duration: 180 }),
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value ? TRACK_WIDTH - THUMB_SIZE - THUMB_INSET : THUMB_INSET, { duration: 180 }) }],
  }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={disabled && styles.disabled}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  disabled: { opacity: 0.5 },
});
