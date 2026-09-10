import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/theme';
import { fontFamily } from '../../src/theme/typography';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      // Alt navigasyon artık kök layout'ta global (BottomTabBar) render
      // ediliyor — Yeni Takip / AI ile Çıkar gibi push ekranlarında da
      // kaybolmasın diye. Bu yerleşik tab bar bastırılıyor.
      tabBar={() => null}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontFamily: fontFamily.displaySemiBold, color: colors.text },
        headerTintColor: colors.primary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="takipler"
        options={{
          title: t('tabs.takipler'),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="ayarlar"
        options={{
          title: t('tabs.ayarlar'),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
