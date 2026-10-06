import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RECURRENCES, type Recurrence } from '../types';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';

/** "Tekrarla: Yok / Her gün / Her hafta / Her ay" seçimi. */
export function RecurrencePicker({
  value,
  onChange,
}: {
  value: Recurrence | null;
  onChange: (value: Recurrence | null) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  const options: (Recurrence | null)[] = [null, ...RECURRENCES];

  return (
    <View>
      <Text style={styles.label} nativeID="label-recurrence">
        🔁 {t('recurrence.label')}
      </Text>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabelledBy="label-recurrence">
        {options.map((option) => {
          const active = value === option;
          const label = t(`recurrence.${option ?? 'none'}`);
          return (
            <Pressable
              key={option ?? 'none'}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(option)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={label}
              hitSlop={4}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      {value && <Text style={styles.hint}>{t('recurrence.hint')}</Text>}
    </View>
  );
}

/** Kartlarda ve listede gösterilen kısa etiket, ör. "🔁 Her hafta". */
export function recurrenceLabel(value: Recurrence | null, t: (key: string) => string): string | null {
  return value ? `🔁 ${t(`recurrence.${value}`)}` : null;
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    label: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.text, marginBottom: 8 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.surfaceAlt },
    chipActive: { backgroundColor: colors.primary },
    chipText: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.text },
    chipTextActive: { color: colors.onPrimary },
    hint: { fontSize: fontSize.caption, fontFamily: fontFamily.body, color: colors.textMuted, marginTop: 6 },
  });
}
