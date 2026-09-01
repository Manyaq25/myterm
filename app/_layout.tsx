import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DatabaseProvider } from '../src/db/DatabaseProvider';
import { initScreenshotSuggestions } from '../src/services/screenshotSuggestion';
import { checkAndApplyUpdate } from '../src/services/appUpdates';
import { AppLockGate } from '../src/components/AppLockGate';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    void checkAndApplyUpdate();
    void initScreenshotSuggestions();

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.kind === 'screenshot-suggestion') {
        router.push('/takip/ai-cikar?mode=image&autoScreenshot=1');
      }
    });
    return () => subscription.remove();
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DatabaseProvider>
          <AppLockGate>
            <Stack
              screenOptions={{
                headerTitleStyle: { fontWeight: '600' },
                headerBackButtonDisplayMode: 'minimal',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="onboarding"
                options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
              />
              <Stack.Screen name="takip/yeni" options={{ presentation: 'modal', title: 'Yeni Takip' }} />
              <Stack.Screen name="takip/ai-cikar" options={{ presentation: 'modal', title: 'AI ile Çıkar' }} />
              <Stack.Screen name="takip/[id]" options={{ title: 'Takip Detayı' }} />
              <Stack.Screen name="kisi/[id]" options={{ title: 'Kişi Profili' }} />
              <Stack.Screen name="gorunum/bekliyorum" options={{ title: 'Neyi Bekliyorum?' }} />
              <Stack.Screen name="gorunum/soz-verdim" options={{ title: 'Kime Söz Verdim?' }} />
              <Stack.Screen name="asistan" options={{ presentation: 'modal', title: 'AI Asistan' }} />
            </Stack>
          </AppLockGate>
        </DatabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
