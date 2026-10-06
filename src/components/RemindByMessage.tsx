import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { TextField } from './TextField';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';
import { aiProvider, AIRequestError, type ReminderTone } from '../ai';
import { getPerson, updatePersonPhone } from '../db/queries';
import type { FollowUpWithPerson } from '../types';
import { buildContactLinks } from '../services/contact';
import { canPickFromContacts, pickPhoneNumbersFromContacts } from '../services/contactPicker';
import {
  AI_USAGE_FREE_LIMIT,
  hasAiUsageRemaining,
  markAiUsageLimitReached,
  recordAiUsage,
} from '../services/aiUsage';
import { useIsPremium } from '../services/subscription';
import { notifyDataChanged } from '../services/dataEvents';
import i18n from '../i18n';

type Step = 'phone' | 'compose';

const TONES: { key: ReminderTone; label: string }[] = [
  { key: 'friendly', label: 'remindMessage.toneFriendly' },
  { key: 'formal', label: 'remindMessage.toneFormal' },
  { key: 'short', label: 'remindMessage.toneShort' },
];

// iPhone'da kişi seçici, açık bir pencerenin üstünde güvenilir açılmıyor; önce
// pencere kapanıyor, kapanma animasyonu bitince seçici açılıyor.
const MODAL_CLOSE_DELAY_MS = 450;

function dueForMessage(dueAt: number | null): string | null {
  if (dueAt === null) return null;
  return new Date(dueAt).toLocaleDateString(i18n.language || 'tr', { weekday: 'long', day: 'numeric', month: 'long' });
}

/**
 * "Mesajla hatırlat": birinden beklenen bir şey için o kişiye gönderilecek
 * nazik mesajı AI yazar, kullanıcı WhatsApp/SMS'te görüp kendisi gönderir.
 * Kişinin numarası yoksa önce numara istenir (iPhone'da rehberden seçilebilir)
 * ve kişi kartına bir kez kaydedilir. Diğer AI özellikleri gibi aylık hakka
 * sayılır, premium'da sınırsız.
 */
export function RemindByMessage({ item, autoStart }: { item: FollowUpWithPerson; autoStart?: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const router = useRouter();
  const isPremium = useIsPremium();

  const [phone, setPhone] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>('compose');
  const [phoneInput, setPhoneInput] = useState('');
  const [tone, setTone] = useState<ReminderTone>('friendly');
  const [message, setMessage] = useState('');
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsappAvailable, setWhatsappAvailable] = useState(false);
  const autoStarted = useRef(false);

  const personName = item.personName ?? '';
  const personId = item.personId;

  useEffect(() => {
    if (!personId) return;
    getPerson(db, personId).then((person) => setPhone(person?.phone ?? null));
  }, [db, personId]);

  useEffect(() => {
    if (!phone) return;
    Linking.canOpenURL(buildContactLinks(phone).whatsappProbe)
      .then(setWhatsappAvailable)
      .catch(() => setWhatsappAvailable(false));
  }, [phone]);

  function showLimitReached() {
    Alert.alert(t('aiUsage.limitReachedTitle'), t('aiUsage.limitReachedMessage', { limit: AI_USAGE_FREE_LIMIT }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('aiUsage.goPremiumButton'), onPress: () => router.push('/premium') },
    ]);
  }

  const write = useCallback(
    async (nextTone: ReminderTone) => {
      if (!isPremium && !(await hasAiUsageRemaining())) {
        setVisible(false);
        showLimitReached();
        return;
      }
      setTone(nextTone);
      setWriting(true);
      setError(null);
      try {
        const text = await aiProvider.writeReminderMessage({
          title: item.title,
          personName,
          note: item.detail,
          due: dueForMessage(item.dueAt),
          tone: nextTone,
        });
        if (!isPremium) await recordAiUsage();
        setMessage(text);
      } catch (e) {
        if (e instanceof AIRequestError && e.status === 402) {
          await markAiUsageLimitReached();
          setVisible(false);
          showLimitReached();
          return;
        }
        setError(t('remindMessage.error'));
      } finally {
        setWriting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPremium, item.title, item.detail, item.dueAt, personName]
  );

  function openCompose() {
    setStep('compose');
    setVisible(true);
    if (!message) void write(tone);
  }

  async function savePhone(number: string) {
    if (!personId) return;
    const trimmed = number.trim();
    await updatePersonPhone(db, personId, trimmed);
    setPhone(trimmed);
    notifyDataChanged();
  }

  async function pickFromContacts() {
    const result = await pickPhoneNumbersFromContacts();
    if (result.status === 'no_phone') {
      Alert.alert(t('remindMessage.noPhoneOnContact'));
      return;
    }
    if (result.status !== 'picked') return;
    const choose = async (number: string) => {
      await savePhone(number);
      openCompose();
    };
    if (result.numbers.length === 1) {
      await choose(result.numbers[0]);
      return;
    }
    Alert.alert(t('remindMessage.chooseNumberTitle'), undefined, [
      ...result.numbers.slice(0, 4).map((number) => ({ text: number, onPress: () => void choose(number) })),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  }

  function askForPhone() {
    if (canPickFromContacts()) {
      Alert.alert(t('remindMessage.phoneTitle'), t('remindMessage.phoneBody', { name: personName }), [
        { text: t('remindMessage.pickFromContacts'), onPress: () => void pickFromContacts() },
        {
          text: t('remindMessage.typeNumber'),
          onPress: () => {
            setPhoneInput('');
            setStep('phone');
            setVisible(true);
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
      return;
    }
    setPhoneInput('');
    setStep('phone');
    setVisible(true);
  }

  function start() {
    if (phone) openCompose();
    else askForPhone();
  }

  useEffect(() => {
    if (autoStart && !autoStarted.current && personId) {
      autoStarted.current = true;
      // Kişinin numarası okunana kadar bekle.
      getPerson(db, personId).then((person) => {
        if (person?.phone) {
          setPhone(person.phone);
          setStep('compose');
          setVisible(true);
          void write('friendly');
        } else {
          askForPhone();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, personId]);

  async function handlePhoneSubmit() {
    if (phoneInput.replace(/\D/g, '').length < 6) return;
    await savePhone(phoneInput);
    setStep('compose');
    if (!message) void write(tone);
  }

  function pickFromContactsFromModal() {
    setVisible(false);
    setTimeout(() => void pickFromContacts(), MODAL_CLOSE_DELAY_MS);
  }

  async function send(kind: 'whatsapp' | 'sms') {
    if (!phone || !message.trim()) return;
    const links = buildContactLinks(phone, message.trim());
    try {
      await Linking.openURL(kind === 'whatsapp' ? links.whatsapp : links.sms);
      setVisible(false);
    } catch {
      Alert.alert(t('common.error'), t('remindMessage.openError'));
    }
  }

  if (!personId || !personName) return null;

  return (
    <View>
      <Pressable
        style={styles.trigger}
        onPress={start}
        accessibilityRole="button"
        accessibilityLabel={t('remindMessage.button')}
        accessibilityHint={t('remindMessage.hint', { name: personName })}
      >
        <Text style={styles.triggerLabel}>{t('remindMessage.button')}</Text>
        <Text style={styles.triggerHint}>{t('remindMessage.hint', { name: personName })}</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {step === 'phone' ? (
                  <>
                    <Text style={styles.sheetTitle}>{t('remindMessage.phoneTitle')}</Text>
                    <Text style={styles.body}>{t('remindMessage.phoneBody', { name: personName })}</Text>
                    {canPickFromContacts() && (
                      <View style={styles.gapTop}>
                        <Button
                          variant="secondary"
                          label={t('remindMessage.pickFromContacts')}
                          onPress={pickFromContactsFromModal}
                        />
                      </View>
                    )}
                    <TextField
                      value={phoneInput}
                      onChangeText={setPhoneInput}
                      placeholder={t('remindMessage.phonePlaceholder')}
                      keyboardType="phone-pad"
                      autoFocus={!canPickFromContacts()}
                      containerStyle={styles.gapTop}
                      accessibilityLabel={t('remindMessage.typeNumber')}
                    />
                    <View style={styles.gapTop}>
                      <Button
                        label={t('remindMessage.savePhone')}
                        onPress={handlePhoneSubmit}
                        disabled={phoneInput.replace(/\D/g, '').length < 6}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.sheetTitle}>{t('remindMessage.composeTitle', { name: personName })}</Text>
                    <View style={styles.toneRow} accessibilityRole="radiogroup">
                      {TONES.map((option) => (
                        <Pressable
                          key={option.key}
                          style={[styles.toneChip, tone === option.key && styles.toneChipActive]}
                          onPress={() => tone !== option.key && !writing && void write(option.key)}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: tone === option.key, disabled: writing }}
                        >
                          <Text style={[styles.toneText, tone === option.key && styles.toneTextActive]}>
                            {t(option.label)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {writing ? (
                      <View style={styles.writing}>
                        <ActivityIndicator color={colors.primary} />
                        <Text style={styles.body}>{t('remindMessage.writing')}</Text>
                      </View>
                    ) : error ? (
                      <View style={styles.writing}>
                        <Text style={styles.error}>{error}</Text>
                        <Button variant="secondary" label={t('remindMessage.retry')} onPress={() => void write(tone)} />
                      </View>
                    ) : (
                      <TextInput
                        style={styles.messageInput}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        textAlignVertical="top"
                        accessibilityLabel={t('remindMessage.composeTitle', { name: personName })}
                      />
                    )}

                    <Text style={styles.footnote}>
                      {t('remindMessage.editHint')}
                      {!isPremium ? ` ${t('remindMessage.creditNote')}` : ''}
                    </Text>

                    <View style={styles.sendRow}>
                      {whatsappAvailable && (
                        <Pressable
                          style={[styles.sendButton, (writing || !message.trim()) && styles.disabled]}
                          onPress={() => void send('whatsapp')}
                          disabled={writing || !message.trim()}
                          accessibilityRole="button"
                          accessibilityLabel={t('remindMessage.sendWhatsApp')}
                        >
                          {/* WhatsApp marka yeşili */}
                          <FontAwesome5 name="whatsapp" size={18} color="#25D366" />
                          <Text style={styles.sendText}>{t('remindMessage.sendWhatsApp')}</Text>
                        </Pressable>
                      )}
                      <Pressable
                        style={[styles.sendButton, (writing || !message.trim()) && styles.disabled]}
                        onPress={() => void send('sms')}
                        disabled={writing || !message.trim()}
                        accessibilityRole="button"
                        accessibilityLabel={t('remindMessage.sendSms')}
                      >
                        <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
                        <Text style={styles.sendText}>{t('remindMessage.sendSms')}</Text>
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() => {
                        setPhoneInput(phone ?? '');
                        setStep('phone');
                      }}
                      accessibilityRole="button"
                      hitSlop={8}
                    >
                      <Text style={styles.link}>
                        {t('remindMessage.changeNumber')} · {phone}
                      </Text>
                    </Pressable>
                  </>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    trigger: {
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: colors.primaryContainer,
    },
    triggerLabel: { fontSize: fontSize.base, fontFamily: fontFamily.bodyBold, color: colors.onPrimaryContainer },
    triggerHint: {
      fontSize: fontSize.caption,
      fontFamily: fontFamily.body,
      color: colors.onPrimaryContainer,
      opacity: 0.8,
      marginTop: 4,
      lineHeight: 17,
    },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 34,
      maxHeight: '85%',
    },
    sheetTitle: { fontSize: fontSize.subtitle, fontFamily: fontFamily.bodyBold, color: colors.text, marginBottom: 8 },
    body: { fontSize: fontSize.small, fontFamily: fontFamily.body, color: colors.textMuted, lineHeight: 19 },
    gapTop: { marginTop: 14 },
    toneRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 12 },
    toneChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
    },
    toneChipActive: { backgroundColor: colors.primary },
    toneText: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.text },
    toneTextActive: { color: colors.onPrimary },
    writing: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 10 },
    error: { fontSize: fontSize.small, fontFamily: fontFamily.body, color: colors.danger },
    messageInput: {
      minHeight: 120,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      fontSize: fontSize.base,
      fontFamily: fontFamily.body,
      color: colors.text,
      backgroundColor: colors.background,
      lineHeight: 21,
    },
    footnote: { fontSize: fontSize.caption, fontFamily: fontFamily.body, color: colors.textMuted, marginTop: 8 },
    sendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
    sendButton: {
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: colors.surfaceAlt,
    },
    sendText: { fontSize: fontSize.small, fontFamily: fontFamily.bodyBold, color: colors.text },
    disabled: { opacity: 0.5 },
    link: {
      fontSize: fontSize.small,
      fontFamily: fontFamily.bodySemiBold,
      color: colors.primaryText,
      marginTop: 16,
      textAlign: 'center',
    },
  });
}
