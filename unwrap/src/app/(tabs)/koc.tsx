// Mila (AI koç) sekmesi: sunucu bağlanınca doldurulacak (sonraki adım).
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import { colors, fonts, space, type } from '@/theme';

export default function Koc() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Mila</Text>
        <Card>
          <Text style={[type.body, { color: colors.textMuted }]}>
            Mila, yüklediğin sohbetlerden birini seçip onun hakkında konuşur. Önce Ana Sayfa’dan bir sohbet yükle.
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.md },
  title: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.text },
});
