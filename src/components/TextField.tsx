import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  showCounter?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Stitch'in "Metin Giriş Alanı" referansına göre: üstte etiket, yuvarlak
 * kenarlıklı kutu, altında opsiyonel yardımcı metin + karakter sayacı.
 */
export function TextField({ label, helperText, showCounter, containerStyle, multiline, maxLength, value, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        maxLength={maxLength}
        value={value}
        {...rest}
      />
      {(helperText || (showCounter && maxLength)) && (
        <View style={styles.footer}>
          <Text style={styles.helperText}>{helperText}</Text>
          {showCounter && maxLength && (
            <Text style={styles.counter}>
              {(value?.length ?? 0)} / {maxLength}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    label: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.textMuted, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: fontSize.base,
      fontFamily: fontFamily.body,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    multiline: { minHeight: 100, textAlignVertical: 'top' },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
      paddingHorizontal: 2,
    },
    helperText: { flex: 1, fontSize: fontSize.caption, color: colors.textMuted, fontFamily: fontFamily.body },
    counter: { fontSize: fontSize.caption, color: colors.textMuted, fontFamily: fontFamily.bodyMedium },
  });
}
