import { Tabs } from 'expo-router';
import { Home, ListChecks, Settings } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { fontFamily } from '../../src/theme/typography';
import { BottomTabBar } from '../../src/components/BottomTabBar';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontFamily: fontFamily.displaySemiBold, color: colors.text },
        headerTintColor: colors.primary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          headerTitle: 'Neyi Unuttum?',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="takipler"
        options={{
          title: 'Takipler',
          tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="ayarlar"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
