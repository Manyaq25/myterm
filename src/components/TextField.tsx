import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { useTheme, hexToRgba, fontFamily, fontSize, type ThemeColors } from '../theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  showCounter?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * "Kinetic Luster" input alanı spesifikasyonuna göre: donuk camsı zemin
 * (rgba beyaz %60), üstte etiket, altında opsiyonel yardımcı metin +
 * karakter sayacı. Odaklanıldığında zemin opak beyaza döner, kenarlık marka
 * tealine geçer ve etrafında yumuşak bir "ring bloom" parlaması belirir.
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
    label: { fontSize: fontSize.caption, fontFamily: fontFamily.label, color: hexToRgba(colors.text, 0.7), marginBottom: 6 },
    input: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: fontSize.base,
      fontFamily: fontFamily.body,
      color: colors.text,
      backgroundColor: hexToRgba(colors.surface, 0.6),
    },
    inputFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
      elevation: 2,
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
