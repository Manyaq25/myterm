import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import type { FollowUpWithPerson } from '../types';
import { FOLLOW_UP_TYPE_LABELS } from '../types';
import { formatDueDate, isOverdue } from '../utils/date';
import { TYPE_COLORS } from '../constants/typeColors';
import { CARD_MARGIN_BOTTOM, CARD_SURFACE } from '../constants/cardStyle';

interface Props {
  item: FollowUpWithPerson;
  onComplete?: () => void;
  onDelete?: () => void;
}

export function FollowUpCard({ item, onComplete, onDelete }: Props) {
  const router = useRouter();
  const swipeableRef = useRef<Swipeable>(null);
  // react-native-gesture-handler'ın Swipeable'ı, satırın yüksekliğini bir kez
  // ölçüp önbelleğe alıyor; çok satırlı başlıklarda metin sarmalanması geç
  // tamamlandığında bu ölçüm bayatlayıp aksiyon panelinin yüksekliği kartla
  // uyuşmuyor (bir sonraki karta taşıyor). Bunun yerine gerçek yüksekliği
  // kendimiz ölçüp aksiyon butonuna kesin (explicit) olarak veriyoruz.
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const overdue = isOverdue(item.dueAt) && item.status === 'open';
  const canComplete = onComplete && (item.status === 'open' || item.status === 'snoozed');

  const card = (
    <Pressable
      style={[styles.card, overdue && styles.cardOverdue]}
      onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
      onPress={() => router.push(`/takip/${item.id}`)}
    >
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: TYPE_COLORS[item.type] ?? '#666' }]}>
          <Text style={styles.badgeText}>{FOLLOW_UP_TYPE_LABELS[item.type]}</Text>
        </View>
        {item.dueAt !== null && (
          <Text style={[styles.due, overdue && styles.dueOverdue]}>{formatDueDate(item.dueAt)}</Text>
        )}
      </View>
      <Text style={styles.title}>{item.title}</Text>
      {item.personName && <Text style={styles.person}>👤 {item.personName}</Text>}
    </Pressable>
  );

  if (!canComplete && !onDelete) {
    return <View style={styles.wrapper}>{card}</View>;
  }

  return (
    <View style={styles.wrapper}>
      <Swipeable
        ref={swipeableRef}
        overshootLeft={false}
        overshootRight={false}
        renderLeftActions={
          canComplete
            ? () => (
                <View style={[styles.actionContainer, cardHeight ? { height: cardHeight } : null]}>
                  <Pressable
                    style={[styles.action, styles.completeAction]}
                    onPress={() => {
                      swipeableRef.current?.close();
                      onComplete?.();
                    }}
                  >
                    <Text style={styles.actionText}>✓ Tamamlandı</Text>
                  </Pressable>
                </View>
              )
            : undefined
        }
        renderRightActions={
          onDelete
            ? () => (
                <View style={[styles.actionContainer, cardHeight ? { height: cardHeight } : null]}>
                  <Pressable
                    style={[styles.action, styles.deleteAction]}
                    onPress={() => {
                      swipeableRef.current?.close();
                      onDelete?.();
                    }}
                  >
                    <Text style={styles.actionText}>Sil</Text>
                  </Pressable>
                </View>
              )
            : undefined
        }
      >
        {card}
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: CARD_MARGIN_BOTTOM },
  card: {
    ...CARD_SURFACE,
  },
  cardOverdue: {
    borderWidth: 1.5,
    borderColor: '#fca5a5',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  due: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  dueOverdue: {
    color: '#dc2626',
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
  },
  person: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 6,
  },
  actionContainer: {
    width: 96,
    overflow: 'hidden',
  },
  action: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  completeAction: { backgroundColor: '#16a34a', marginRight: 10 },
  deleteAction: { backgroundColor: '#dc2626', marginLeft: 10 },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
