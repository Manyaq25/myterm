import { useEffect, useState } from 'react';
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
import { AnimatedSplash } from '../src/components/AnimatedSplash';
import { fontFamily } from '../src/theme/typography';
import { languageReady } from '../src/i18n';
import { configureRevenueCat, subscriptionReady } from '../src/services/subscription';
import { useTranslation } from 'react-i18next';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showIntro, setShowIntro] = useState(true);
  const [i18nReady, setI18nReady] = useState(false);
  const [subReady, setSubReady] = useState(false);
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
    languageReady.then(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    void configureRevenueCat();
    subscriptionReady.then(() => setSubReady(true));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && i18nReady && subReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, i18nReady, subReady]);

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

  if ((!fontsLoaded && !fontError) || !i18nReady || !subReady) {
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
              <Stack.Screen name="takip/yeni" options={{ presentation: 'modal', title: t('stackTitles.yeniTakip') }} />
              <Stack.Screen name="takip/ai-cikar" options={{ presentation: 'modal', title: t('stackTitles.aiIleCikar') }} />
              <Stack.Screen name="takip/[id]" options={{ title: t('stackTitles.takipDetay') }} />
              <Stack.Screen name="kisi/[id]" options={{ title: t('stackTitles.kisiProfili') }} />
              <Stack.Screen name="gorunum/bekliyorum" options={{ title: t('stackTitles.neyiBekliyorum') }} />
              <Stack.Screen name="gorunum/soz-verdim" options={{ title: t('stackTitles.kimeSozVerdim') }} />
              <Stack.Screen name="asistan" options={{ presentation: 'modal', title: t('stackTitles.aiAsistan') }} />
              <Stack.Screen name="premium" options={{ presentation: 'modal', title: t('stackTitles.premium') }} />
            </Stack>
          </AppLockGate>
        </DatabaseProvider>
      </SafeAreaProvider>
      {showIntro && <AnimatedSplash onFinish={() => setShowIntro(false)} />}
    </GestureHandlerRootView>
  );
}
