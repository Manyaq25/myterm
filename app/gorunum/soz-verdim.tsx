import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { listFollowUpsByType } from '../../src/db/queries';
import { PersonGroupedList } from '../../src/components/PersonGroupedList';
import { groupFollowUpsByPerson, type PersonGroup } from '../../src/utils/grouping';
import { SCREEN_BACKGROUND } from '../../src/constants/cardStyle';

export default function KimeSozVerdimScreen() {
  const db = useSQLiteContext();
  const [groups, setGroups] = useState<PersonGroup[]>([]);

  useFocusEffect(
    useCallback(() => {
      listFollowUpsByType(db, 'promise_made').then((items) => setGroups(groupFollowUpsByPerson(items)));
    }, [db])
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PersonGroupedList
        groups={groups}
        emptyTitle="Kimseye açık bir sözün yok"
        emptySubtitle="Birine verdiğin bir söz olduğunda burada kişi bazlı görünecek."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: SCREEN_BACKGROUND },
  content: { padding: 20, paddingBottom: 60, flexGrow: 1 },
});
