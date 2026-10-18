import { Redirect, Tabs } from 'expo-router';
import { Home, MessageCircleHeart, Settings } from 'lucide-react-native';

import { hasOnboarded } from '@/lib/prefs';
import { colors, fonts } from '@/theme';

export default function TabsLayout() {
  if (!hasOnboarded()) return <Redirect href="/karsilama" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 12 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.surfaceHigh },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Ana Sayfa', tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} />
      <Tabs.Screen name="koc" options={{ title: 'Koç', tabBarIcon: ({ color }) => <MessageCircleHeart color={color} size={22} /> }} />
      <Tabs.Screen name="ayarlar" options={{ title: 'Ayarlar', tabBarIcon: ({ color }) => <Settings color={color} size={22} /> }} />
    </Tabs>
  );
}
