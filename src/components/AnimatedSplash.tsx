import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
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

// Stitch'in açılış ekranı export'undan birebir örneklenen dikey gradyan
// (nane yeşili → sıcak krem). Native splash (app.json'daki expo-splash-screen)
// düz bir renk gösterebildiği için üst tonu (BG_LIGHT_TOP) kullanıyor —
// bu JS katmanı devraldığında düz renkten gradyana yumuşak geçiş oluyor.
const BG_LIGHT_TOP = '#C4EADF';
const BG_LIGHT_BOTTOM = '#FCF8ED';
const BG_DARK_TOP = '#0E1C1A';
const BG_DARK_BOTTOM = '#0B1614';

const ICON_LIGHT = require('../../assets/splash-icon.png');
const ICON_DARK = require('../../assets/splash-icon-dark.png');

export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
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
    <Animated.View pointerEvents="none" style={[styles.overlay, overlayStyle]}>
      <LinearGradient
        pointerEvents="none"
        colors={isDark ? [BG_DARK_TOP, BG_DARK_BOTTOM] : [BG_LIGHT_TOP, BG_LIGHT_BOTTOM]}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.Image source={isDark ? ICON_DARK : ICON_LIGHT} style={[styles.icon, iconStyle]} resizeMode="contain" />
      <Animated.View style={textStyle}>
        <Animated.Text style={[styles.wordmark, { color: colors.text }]}>Synvia AI</Animated.Text>
        <Animated.Text style={[styles.tagline, { color: colors.textMuted }]}>{t('splash.tagline')}</Animated.Text>
      </Animated.View>
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
    fontFamily: fontFamily.bodyExtraBold,
    fontSize: fontSize.displaySmall,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 6,
    fontFamily: fontFamily.body,
    fontSize: fontSize.small,
    textAlign: 'center',
  },
});
