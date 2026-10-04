import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { listFollowUpsByType } from '../../src/db/queries';
import { PersonGroupedList } from '../../src/components/PersonGroupedList';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { groupFollowUpsByPerson, type PersonGroup } from '../../src/utils/grouping';
import { useTheme, type ThemeColors } from '../../src/theme';

export default function NeyiBekliyorumScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const [groups, setGroups] = useState<PersonGroup[]>([]);

  useFocusEffect(
    useCallback(() => {
      listFollowUpsByType(db, 'waiting_on').then((items) => setGroups(groupFollowUpsByPerson(items)));
    }, [db])
  );

  return (
    <View style={styles.root}>
    <ScreenHeader title={t('stackTitles.neyiBekliyorum')} />
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PersonGroupedList
        groups={groups}
        emptyTitle={t('bekliyorum.emptyTitle')}
        emptySubtitle={t('bekliyorum.emptySubtitle')}
      />
    </ScrollView>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    screen: { backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 60, flexGrow: 1 },
  });
}
