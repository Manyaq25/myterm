import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ExtraReminderChoice } from '../services/smartReminders';
import { Button } from './Button';
import { useTheme, fontFamily, type ThemeColors } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  onChoose: (choice: ExtraReminderChoice) => void;
}

export function SmartReminderPrompt({ visible, title, onChoose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('smartReminderPrompt.title')}</Text>
          <Text style={styles.subtitle}>{t('smartReminderPrompt.subtitle', { title })}</Text>
          <View style={styles.option}>
            <Button
              variant="secondary"
              label={t('smartReminderPrompt.dayBefore')}
              onPress={() => onChoose('day_before')}
              accessibilityLabel={t('smartReminderPrompt.dayBefore')}
            />
          </View>
          <View style={styles.option}>
            <Button
              variant="secondary"
              label={t('smartReminderPrompt.morning')}
              onPress={() => onChoose('morning')}
              accessibilityLabel={t('smartReminderPrompt.morning')}
            />
          </View>
          <View style={styles.option}>
            <Button
              variant="secondary"
              label={t('smartReminderPrompt.both')}
              onPress={() => onChoose('both')}
              accessibilityLabel={t('smartReminderPrompt.both')}
            />
          </View>
          <Pressable
            style={styles.decline}
            onPress={() => onChoose('none')}
            accessibilityRole="button"
            accessibilityLabel={t('smartReminderPrompt.decline')}
          >
            <Text style={styles.declineText}>{t('smartReminderPrompt.decline')}</Text>
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
    option: { marginBottom: 8 },
    decline: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
    declineText: { color: colors.textMuted, fontSize: 14, fontFamily: fontFamily.bodySemiBold },
  });
}
