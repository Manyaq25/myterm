import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus, StyleSheet, Text, View } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { authenticate, isAppLockEnabled } from '../services/appLock';
import { Button } from './Button';
import { useTheme, fontFamily, type ThemeColors } from '../theme';

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const enabled = await isAppLockEnabled();
      if (enabled && mounted) {
        setLocked(true);
        lockedRef.current = true;
        void tryUnlock();
      }
      if (mounted) setReady(true);
    })();

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      mounted = false;
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAppStateChange(nextState: AppStateStatus) {
    const prevState = appState.current;
    appState.current = nextState;
    const enabled = await isAppLockEnabled();
    if (!enabled) return;

    if (nextState === 'background') {
      setLocked(true);
      lockedRef.current = true;
      void ScreenCapture.enableAppSwitcherProtectionAsync().catch(() => {});
    } else if (nextState === 'active' && prevState !== 'active' && lockedRef.current) {
      void tryUnlock();
    }
  }

  async function tryUnlock() {
    const success = await authenticate();
    void ScreenCapture.disableAppSwitcherProtectionAsync().catch(() => {});
    if (success) {
      setLocked(false);
      lockedRef.current = false;
    }
  }

  if (!ready) return null;

  return (
    <>
      {children}
      {locked && (
        <View style={styles.overlay}>
          <Text style={styles.icon}>🔒</Text>
          <Text style={styles.title}>Uygulama Kilitli</Text>
          <Text style={styles.subtitle}>Devam etmek için kimliğini doğrula.</Text>
          <Button label="Kilidi Aç" onPress={tryUnlock} variant="primary" />
        </View>
      )}
    </>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    icon: { fontSize: 48, marginBottom: 16 },
    title: { fontSize: 20, fontFamily: fontFamily.bodyBold, color: colors.onPrimary, marginBottom: 6 },
    // textMuted açık/koyu modda kendi zemin rengiyle (colors.background/surface)
    // kontrast için tasarlandı — burada zemin colors.text (ters çevrilmiş bir
    // overlay) olduğundan textMuted neredeyse görünmez olurdu. onPrimary +
    // opacity ile aynı ters-kontrast mantığını koruyoruz.
    subtitle: { fontSize: 14, fontFamily: fontFamily.body, color: colors.onPrimary, opacity: 0.75, marginBottom: 28 },
  });
}
