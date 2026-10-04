import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';
import { Button } from './Button';

interface Props {
  visible: boolean;
  /** Seçici açıldığında gösterilecek başlangıç değeri. */
  initialValue: Date;
  title?: string;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

/**
 * Tarih + saat seçici. iOS'ta alttan açılan bir sayfada tek bir spinner,
 * Android'de sistemin önce tarih sonra saat diyaloğu. AI ile Çıkar'daki
 * adaylar ve Takip Detayı'ndaki hatırlatma zamanı aynı bileşeni kullanıyor.
 */
export function DateTimeSheet({ visible, initialValue, title, onConfirm, onCancel }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(initialValue);
  const [androidStage, setAndroidStage] = useState<'date' | 'time' | null>(null);

  useEffect(() => {
    if (!visible) {
      setAndroidStage(null);
      return;
    }
    setValue(initialValue);
    if (Platform.OS === 'android') setAndroidStage('date');
    // Yalnızca açılışta başlangıç değerini alıyoruz; açıkken dışarıdan gelen
    // yeni Date nesneleri kullanıcının seçimini sıfırlamasın.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (Platform.OS === 'ios') {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
        <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel={t('common.cancel')} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {title ? (
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          ) : null}
          <DateTimePicker
            value={value}
            mode="datetime"
            display="spinner"
            locale={i18n.language}
            onChange={(_, selected) => {
              if (selected) setValue(selected);
            }}
          />
          <Button label={t('yeni.datePickerDone')} onPress={() => onConfirm(value)} />
        </View>
      </Modal>
    );
  }

  if (!visible) return null;
  if (androidStage === 'date') {
    return (
      <DateTimePicker
        value={value}
        mode="date"
        onChange={(event, selected) => {
          if (event.type !== 'set' || !selected) {
            setAndroidStage(null);
            onCancel();
            return;
          }
          const combined = new Date(selected);
          combined.setHours(value.getHours(), value.getMinutes(), 0, 0);
          setValue(combined);
          setAndroidStage('time');
        }}
      />
    );
  }
  if (androidStage === 'time') {
    return (
      <DateTimePicker
        value={value}
        mode="time"
        onChange={(event, selected) => {
          setAndroidStage(null);
          if (event.type !== 'set' || !selected) {
            onCancel();
            return;
          }
          const combined = new Date(value);
          combined.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
          onConfirm(combined);
        }}
      />
    );
  }
  return null;
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 18,
      gap: 8,
    },
    title: { fontSize: fontSize.base, fontFamily: fontFamily.displaySemiBold, color: colors.text, textAlign: 'center' },
  });
}
