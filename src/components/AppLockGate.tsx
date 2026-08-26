import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { authenticate, isAppLockEnabled } from '../services/appLock';

export function AppLockGate({ children }: { children: React.ReactNode }) {
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
          <Pressable style={styles.button} onPress={tryUnlock}>
            <Text style={styles.buttonText}>Kilidi Aç</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#9ca3af', marginBottom: 28 },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
