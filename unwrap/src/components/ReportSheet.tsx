// Yapay zekâ içeriğini bildirme penceresi (Mila cevabı veya rapor).
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { t } from '@/i18n';
import { errorText, reportContent, type ReportKind, type ReportReason } from '@/lib/ai/api';
import { colors, radius, space, type } from '@/theme';
import { Button, Pill } from './ui';

const REASONS: ReportReason[] = ['saldirgan', 'cinsel', 'zararli', 'yanlis', 'diger'];

/** text = null: pencere kapalı. Yalnız yapay zekâ metni gönderilir. */
export function ReportSheet({ kind, text, onClose }: { kind: ReportKind; text: string | null; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const reset = () => {
    setReason(null);
    setNote('');
    setSending(false);
  };

  const send = async () => {
    if (!reason || !text) return;
    setSending(true);
    try {
      await reportContent({ kind, reason, text, note: note.trim() || undefined });
      onClose();
      Alert.alert(t('common.report.thanksTitle'), t('common.report.thanksText'));
    } catch (e) {
      Alert.alert(t('common.report.title'), errorText(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={text !== null} transparent animationType="slide" onShow={reset} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.cancel')} />
        <View style={styles.sheet}>
          <Text style={[type.title, { color: colors.text }]}>{t('common.report.title')}</Text>
          <Text style={[type.bodySm, { color: colors.textMuted }]}>{t('common.report.subtitle')}</Text>
          <View style={styles.reasons}>
            {REASONS.map((r) => (
              <Pill key={r} label={t(`common.report.reasons.${r}`)} active={r === reason} onPress={() => setReason(r)} />
            ))}
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('common.report.notePlaceholder')}
            placeholderTextColor={colors.textMuted}
            maxLength={300}
            multiline
            style={styles.input}
          />
          <Button label={t('common.report.send')} onPress={send} loading={sending} disabled={!reason} />
          <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg, paddingBottom: space.xl, gap: space.md },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  input: { ...type.body, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 12, minHeight: 72, textAlignVertical: 'top' },
});
