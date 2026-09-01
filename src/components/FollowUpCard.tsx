import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import type { FollowUpWithPerson } from '../types';
import { FOLLOW_UP_TYPE_LABELS } from '../types';
import { formatDueDate, isOverdue } from '../utils/date';
import { CARD_MARGIN_BOTTOM, getCardSurface } from '../constants/cardStyle';
import { useTheme, getTypeColor, fontFamily, fontSize, type ThemeColors } from '../theme';

interface Props {
  item: FollowUpWithPerson;
  onComplete?: () => void;
  onDelete?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function FollowUpCard({ item, onComplete, onDelete, selectionMode, selected, onToggleSelect }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
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

  const accessibilityLabel = [
    FOLLOW_UP_TYPE_LABELS[item.type],
    item.title,
    item.personName ? `Kişi: ${item.personName}` : null,
    item.dueAt !== null
      ? overdue
        ? `Gecikmiş, son tarih ${formatDueDate(item.dueAt)}`
        : `Son tarih ${formatDueDate(item.dueAt)}`
      : null,
  ]
    .filter(Boolean)
    .join('. ');

  // VoiceOver kullanıcıları Swipeable'ın kaydırma jestini kolayca
  // keşfedemeyebilir/gerçekleştiremeyebilir — aynı aksiyonları özel
  // erişilebilirlik eylemleri (rotor) olarak da sunuyoruz.
  const accessibilityActions = [
    ...(canComplete ? [{ name: 'complete', label: 'Tamamlandı olarak işaretle' }] : []),
    ...(onDelete ? [{ name: 'delete', label: 'Sil' }] : []),
  ];

  function handleAccessibilityAction(event: { nativeEvent: { actionName: string } }) {
    if (event.nativeEvent.actionName === 'complete') onComplete?.();
    if (event.nativeEvent.actionName === 'delete') onDelete?.();
  }

  const cardBody = (
    <>
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: getTypeColor(item.type, colors) }]}>
          <Text style={styles.badgeText}>{FOLLOW_UP_TYPE_LABELS[item.type]}</Text>
        </View>
        {item.dueAt !== null && (
          <Text style={[styles.due, overdue && styles.dueOverdue]}>{formatDueDate(item.dueAt)}</Text>
        )}
      </View>
      <Text style={styles.title}>{item.title}</Text>
      {item.personName && <Text style={styles.person}>👤 {item.personName}</Text>}
    </>
  );

  const card = (
    <Pressable
      style={[styles.card, overdue && styles.cardOverdue]}
      onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
      onPress={() => (selectionMode ? onToggleSelect?.() : router.push(`/takip/${item.id}`))}
      accessibilityRole={selectionMode ? 'checkbox' : 'button'}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={selectionMode ? undefined : 'Detayları görmek için dokun'}
      accessibilityState={selectionMode ? { checked: !!selected } : undefined}
      accessibilityActions={selectionMode ? undefined : accessibilityActions}
      onAccessibilityAction={selectionMode ? undefined : handleAccessibilityAction}
    >
      {selectionMode ? (
        <View style={styles.selectableRow}>
          <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
            {selected && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>{cardBody}</View>
        </View>
      ) : (
        cardBody
      )}
    </Pressable>
  );

  if (selectionMode || (!canComplete && !onDelete)) {
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
                    accessibilityRole="button"
                    accessibilityLabel="Tamamlandı olarak işaretle"
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
                    accessibilityRole="button"
                    accessibilityLabel="Sil"
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

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: { marginBottom: CARD_MARGIN_BOTTOM },
    card: {
      ...getCardSurface(colors),
    },
    cardOverdue: {
      borderWidth: 1.5,
      borderColor: colors.danger,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    selectableRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    checkboxMark: { color: colors.onPrimary, fontSize: fontSize.small, fontFamily: fontFamily.bodyBold },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    badgeText: {
      color: colors.onPrimary,
      fontSize: fontSize.caption,
      fontFamily: fontFamily.bodyBold,
    },
    due: {
      fontSize: fontSize.caption,
      color: colors.textMuted,
      fontFamily: fontFamily.bodySemiBold,
    },
    dueOverdue: {
      color: colors.danger,
      fontFamily: fontFamily.bodyBold,
    },
    title: {
      fontSize: fontSize.subtitle,
      fontFamily: fontFamily.bodyBold,
      color: colors.text,
      lineHeight: 22,
    },
    person: {
      fontSize: fontSize.small,
      color: colors.textMuted,
      marginTop: 6,
      fontFamily: fontFamily.body,
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
    completeAction: { backgroundColor: colors.success, marginRight: 10 },
    deleteAction: { backgroundColor: colors.danger, marginLeft: 10 },
    actionText: { color: colors.onPrimary, fontSize: fontSize.small, fontFamily: fontFamily.bodyBold },
  });
}
