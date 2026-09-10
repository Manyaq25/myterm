import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
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
// Açıkken beyaz topuzun üzerinde beliren küçük tikli rozet — Stitch
// mockup'ında marka tealinden ayrı, sabit bir mavi.
const CHECK_BADGE_COLOR = '#3B82F6';

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
  // hexToRgba düz bir JS fonksiyonu — worklet olarak işaretli değil, bu yüzden
  // useAnimatedStyle'ın (UI thread'de çalışan) içinde değil, burada (JS
  // thread'de) önceden hesaplanıp worklet'e sadece hazır bir renk dizesi
  // veriliyor.
  const offColor = hexToRgba(colors.text, 0.16);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(value ? colors.primary : offColor, { duration: 180 }),
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value ? TRACK_WIDTH - THUMB_SIZE - THUMB_INSET : THUMB_INSET, { duration: 180 }) }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(value ? 1 : 0, { duration: 180 }),
    transform: [{ scale: withTiming(value ? 1 : 0.5, { duration: 180 }) }],
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
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <Animated.View style={[styles.checkBadge, badgeStyle]}>
            <View style={styles.checkBadgeInner}>
              <Check color="#FFFFFF" size={6} strokeWidth={4} />
            </View>
          </Animated.View>
        </Animated.View>
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
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  checkBadgeInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: CHECK_BADGE_COLOR,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
});
