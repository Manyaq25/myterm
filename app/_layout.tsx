import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DatabaseProvider } from '../src/db/DatabaseProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DatabaseProvider>
          <Stack screenOptions={{ headerTitleStyle: { fontWeight: '600' } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="takip/yeni" options={{ presentation: 'modal', title: 'Yeni Takip' }} />
            <Stack.Screen name="takip/ai-cikar" options={{ presentation: 'modal', title: 'AI ile Çıkar' }} />
            <Stack.Screen name="takip/[id]" options={{ title: 'Takip Detayı' }} />
          </Stack>
        </DatabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
