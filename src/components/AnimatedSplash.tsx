import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, fontFamily, fontSize } from '../theme';

// Must match app.json's expo-splash-screen `backgroundColor` / `dark.backgroundColor` —
// the native splash hides straight into this overlay, so the colors need to line up
// exactly or the handoff will show a flash.
const BG_LIGHT = '#0E5C56';
const BG_DARK = '#0E1A18';

const ICON_LIGHT = require('../../assets/splash-icon.png');
const ICON_DARK = require('../../assets/splash-icon-dark.png');

export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(true);

  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.5);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(8);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    // By the time this mounts, the (unanimatable) native splash has already
    // been on screen for however long fonts took to load — often 1s+ on a
    // cold start on a real device. So this JS-driven sequence is kept short
    // and the icon's motion deliberately large, or it reads as more dead
    // time tacked onto an already-long wait rather than a distinct arrival.
    iconOpacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.ease) });
    iconScale.value = withSequence(
      withTiming(1.08, { duration: 340, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) })
    );

    textOpacity.value = withDelay(320, withTiming(1, { duration: 320, easing: Easing.out(Easing.ease) }));
    textTranslateY.value = withDelay(320, withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }));

    overlayOpacity.value = withDelay(
      780,
      withTiming(0, { duration: 220, easing: Easing.in(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(setVisible)(false);
          runOnJS(onFinish)();
        }
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { backgroundColor: isDark ? BG_DARK : BG_LIGHT }, overlayStyle]}
    >
      <Animated.Image source={isDark ? ICON_DARK : ICON_LIGHT} style={[styles.icon, iconStyle]} resizeMode="contain" />
      <Animated.Text style={[styles.wordmark, textStyle]}>Synvia AI</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 220,
    height: 220,
  },
  wordmark: {
    marginTop: 18,
    fontFamily: fontFamily.displayMedium,
    fontSize: fontSize.displaySmall,
    letterSpacing: 0.5,
    color: '#FDFDFC',
  },
});
