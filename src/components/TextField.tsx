import { useMemo, useState } from 'react';
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
 * Odaklanıldığında kenarlık, "Klavye Odak Göstergeleri" spesifikasyonundaki
 * marka tealine ve 2px kalınlığa geçer.
 */
export function TextField({
  label,
  helperText,
  showCounter,
  containerStyle,
  multiline,
  maxLength,
  value,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, multiline && styles.multiline, focused && styles.inputFocused]}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        maxLength={maxLength}
        value={value}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
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
    inputFocused: {
      borderWidth: 2,
      borderColor: colors.primary,
      // Kalınlaşan kenarlık iç dolguyu 1px kaydırmasın diye telafi.
      paddingHorizontal: 13,
      paddingVertical: 11,
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
