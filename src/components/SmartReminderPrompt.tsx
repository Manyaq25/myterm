import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExtraReminderChoice } from '../services/smartReminders';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  onChoose: (choice: ExtraReminderChoice) => void;
}

export function SmartReminderPrompt({ visible, title, onChoose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Bu iş önemli görünüyor</Text>
          <Text style={styles.subtitle}>
            "{title}" için 1 gün önce ve/veya aynı gün sabah da hatırlatayım mı?
          </Text>
          <Pressable style={styles.option} onPress={() => onChoose('day_before')} accessibilityRole="button" accessibilityLabel="1 gün önce">
            <Text style={styles.optionText}>1 gün önce</Text>
          </Pressable>
          <Pressable style={styles.option} onPress={() => onChoose('morning')} accessibilityRole="button" accessibilityLabel="Aynı gün sabah">
            <Text style={styles.optionText}>Aynı gün sabah</Text>
          </Pressable>
          <Pressable style={styles.option} onPress={() => onChoose('both')} accessibilityRole="button" accessibilityLabel="İkisi de">
            <Text style={styles.optionText}>İkisi de</Text>
          </Pressable>
          <Pressable style={styles.decline} onPress={() => onChoose('none')} accessibilityRole="button" accessibilityLabel="Hayır, gerek yok">
            <Text style={styles.declineText}>Hayır, gerek yok</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
    },
    title: { fontSize: 17, fontFamily: fontFamily.bodyBold, color: colors.text, marginBottom: 6 },
    subtitle: { fontSize: 14, fontFamily: fontFamily.body, color: colors.textMuted, marginBottom: 18, lineHeight: 20 },
    option: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 8,
    },
    optionText: { color: colors.primary, fontSize: fontSize.base, fontFamily: fontFamily.bodySemiBold },
    decline: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
    declineText: { color: colors.textMuted, fontSize: 14, fontFamily: fontFamily.bodySemiBold },
  });
}
