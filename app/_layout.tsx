import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Fraunces_500Medium, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DatabaseProvider } from '../src/db/DatabaseProvider';
import { initScreenshotSuggestions } from '../src/services/screenshotSuggestion';
import { checkAndApplyUpdate } from '../src/services/appUpdates';
import { AppLockGate } from '../src/components/AppLockGate';
import { fontFamily } from '../src/theme/typography';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

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

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DatabaseProvider>
          <AppLockGate>
            <Stack
              screenOptions={{
                headerTitleStyle: { fontWeight: '600', fontFamily: fontFamily.displaySemiBold },
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
