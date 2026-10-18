// Ödeme ekranı: RevenueCat bağlanınca doldurulacak (sonraki adım).
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors, space, type } from '@/theme';

export default function Pro() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={[type.headline, { color: colors.text }]}>Unwrap Pro</Text>
        <Text style={[type.body, { color: colors.textMuted }]}>Ödeme ekranı hazırlanıyor.</Text>
        <Button label="Geri dön" variant="ghost" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: space.lg, gap: space.md, justifyContent: 'center' },
});
