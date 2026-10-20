// Paylaşım menüsünden gelen sohbet dosyasını içe aktarır.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import { importChatFile, importErrorText } from '@/lib/chat/import';
import { setOnboarded } from '@/lib/prefs';
import { colors, space, type } from '@/theme';

export default function Aktar() {
  const { uri } = useLocalSearchParams<{ uri: string }>();

  useEffect(() => {
    if (!uri) {
      router.replace('/');
      return;
    }
    const name = decodeURIComponent(uri.split('/').pop() ?? '');
    importChatFile(uri, name)
      .then((id) => {
        setOnboarded();
        router.replace({ pathname: '/analiz/kurulum', params: { id } });
      })
      .catch((e) => {
        Alert.alert(t('common.importing.failedTitle'), importErrorText(e));
        router.replace('/');
      });
  }, [uri]);

  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={[type.title, { color: colors.text }]}>{t('common.importing.opening')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, backgroundColor: colors.background },
});
