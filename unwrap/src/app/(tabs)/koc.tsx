// Mila (AI koç): seçilen sohbet hakkında konuşur. Rol yapma modunda sohbetteki
// kişinin üslubuyla cevap verir (yalnız iki kişilik sohbetlerde).
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Pill } from '@/components/ui';
import { ApiError, askCoach, errorText } from '@/lib/ai/api';
import type { CoachRole, CoachTurn } from '@/lib/ai/types';
import { bump } from '@/lib/profile/activity';
import { isPro } from '@/lib/purchases';
import { t } from '@/i18n';
import { RELATIONS, isRomantic } from '@/lib/relations';
import {
  getAnalysis,
  getGeneralCoach,
  listAnalyses,
  saveGeneralCoach,
  updateAnalysis,
  type Analysis,
  type AnalysisSummary,
} from '@/lib/store';
import { colors, fonts, radius, space, type } from '@/theme';

// Rol yapma: analiz kurulumundaki ilişki türlerinin hepsi (+ hayalimdeki).
// Etiketler dile göre değiştiği için çizim anında kurulur.
const roles = (): { id: CoachRole | null; label: string; emoji: string }[] => [
  { id: null, label: t('coach.roleCoach'), emoji: '💬' },
  ...RELATIONS.filter((r) => r.id !== 'is' && r.id !== 'diger').map((r) => ({ id: r.id as CoachRole, label: r.label, emoji: r.emoji })),
  { id: 'hayalimdeki', label: t('coach.roleDream'), emoji: '✨' },
];

type Starter = { q: string; pro?: boolean };
type Mode = 'general' | 'romantic' | 'group' | 'other';

// Kategori emojileri; etiketler coach.categories.<id>.
const CAT_EMOJI: Record<string, string> = {
  top: '⭐',
  flirt: '💘',
  trust: '🔍',
  cold: '🧊',
  write: '💬',
  fight: '⚡',
  toxic: '🧠',
  future: '💍',
  social: '👯',
  interest: '💞',
  dynamics: '📊',
  vibes: '😂',
};

// Kategori → soru anahtarları (coach.starters.<mod>.<kategori>.<anahtar>).
const SETS: Record<Mode, Record<string, string[]>> = {
  general: {
    flirt: ['firstMessage', 'firstDate', 'interested', 'mixedSignals', 'textFirst', 'askOut', 'friendZone', 'afterDate'],
    trust: ['cheating', 'hidesPhone', 'lying', 'ex', 'deletesChats', 'jealous', 'trustAgain'],
    cold: ['coldLately', 'lateReply', 'ghosted', 'seen', 'shortReplies', 'stuck', 'winBack'],
    write: ['apology', 'compliment', 'birthday', 'flirty', 'missYou', 'afterGhost', 'boundary', 'goodnight'],
    fight: ['makeUp', 'whoWrong', 'sameFight', 'silent', 'firstStep', 'calm'],
    toxic: ['loveBombing', 'manipulating', 'gaslighting', 'redFlags', 'controlling', 'guilt', 'toxic'],
    future: ['breakUp', 'whereGoing', 'serious', 'moveIn', 'marriage', 'longDistance', 'howToEnd'],
    social: ['friendDistant', 'friendTension', 'goodFriend', 'leftOut', 'parents', 'familyBoundary'],
  },
  romantic: {
    interest: ['interested', 'whoCares', 'effort', 'lastCare', 'initiates'],
    trust: ['hiding', 'cheating', 'contradictions'],
    cold: ['change', 'sinceWhen', 'replyTime', 'stuck'],
    write: ['whatToWrite', 'replyLast', 'warmUp'],
    fight: ['fights', 'whoApologizes'],
    toxic: ['redFlags', 'manipulation', 'whoHurts'],
    future: ['whereGoing', 'serious'],
  },
  group: {
    dynamics: ['carries', 'supports', 'ignored', 'leftOut'],
    vibes: ['funniest', 'closest', 'mood'],
    fight: ['falloutRift', 'tension'],
    write: ['smooth', 'plan'],
  },
  other: {
    dynamics: ['howGoing', 'effort', 'initiates', 'lastCare'],
    cold: ['distance', 'change'],
    fight: ['tension', 'triggers', 'fix'],
    toxic: ['redFlags', 'oneSided'],
    write: ['whatToWrite', 'replyLast'],
  },
};

// Genel modun "Popüler" sekmesi: önce ücretsiz 6 soru, sonra birkaç Pro vitrin sorusu.
const FREE = ['flirt.firstMessage', 'flirt.firstDate', 'fight.makeUp', 'write.apology', 'write.compliment', 'write.birthday'];
const HIGHLIGHTS = ['flirt.interested', 'cold.lateReply', 'trust.cheating', 'toxic.loveBombing', 'future.breakUp'];

// pro: true olanlar ücretsiz sürümde soluk ve kilitli görünür. Seçili sohbete
// özel sorular sohbeti okumayı gerektirir; hepsi Pro.
function starterGroups(a: Analysis | null): { id: string; items: Starter[] }[] {
  const mode: Mode = !a ? 'general' : a.participants.length > 2 ? 'group' : isRomantic(a.relation) ? 'romantic' : 'other';
  const item = (path: string): Starter => ({
    q: t(`coach.starters.${mode}.${path}`),
    pro: mode !== 'general' || !FREE.includes(path),
  });
  const groups = Object.entries(SETS[mode]).map(([id, keys]) => ({ id, items: keys.map((k) => item(`${id}.${k}`)) }));
  return mode === 'general' ? [{ id: 'top', items: [...FREE, ...HIGHLIGHTS].map(item) }, ...groups] : groups;
}

export default function Koc() {
  const params = useLocalSearchParams<{ id?: string }>();
  const [list, setList] = useState<AnalysisSummary[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [role, setRole] = useState<CoachRole | null>(null);
  const [history, setHistory] = useState<CoachTurn[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [general, setGeneral] = useState(false);
  const [pro, setPro] = useState(false);
  const [cat, setCat] = useState<string | null>(null);
  const listRef = useRef<FlatList<CoachTurn>>(null);

  /** 'genel' = sohbet seçmeden Mila ile konuşma. */
  const select = useCallback((id: string) => {
    setCat(null);
    if (id === 'genel') {
      setGeneral(true);
      setAnalysis(null);
      setRole(null);
      setHistory(getGeneralCoach());
      return;
    }
    const a = getAnalysis(id);
    setGeneral(false);
    setAnalysis(a);
    setRole(a?.coach?.role ?? null);
    setHistory(a?.coach?.history ?? []);
  }, []);

  // Rapordan "Mila'ya sor" ile gelindiyse o sohbet bir kez seçilir.
  const handledParam = useRef<string | undefined>(undefined);
  const currentId = analysis?.id;
  useFocusEffect(
    useCallback(() => {
      isPro().then(setPro);
      const all = listAnalyses();
      setList(all);
      if (!all.length) return select('genel');
      const fromParam = params.id && params.id !== handledParam.current && all.some((x) => x.id === params.id);
      if (fromParam) {
        handledParam.current = params.id;
        select(params.id!);
      } else if (!general && (!currentId || !all.some((x) => x.id === currentId))) select(all[0].id);
    }, [params.id, currentId, general, select]),
  );

  const save = (a: Analysis | null, r: CoachRole | null, h: CoachTurn[]) =>
    a ? updateAnalysis(a.id, { coach: { role: r, history: h } }) : saveGeneralCoach(h);

  const changeRole = (r: CoachRole | null) => {
    if (!analysis || r === role) return;
    const apply = () => {
      setRole(r);
      setHistory([]);
      save(analysis, r, []);
    };
    if (history.length)
      Alert.alert(t('coach.newChatTitle'), t('coach.newChatBody'), [
        { text: t('coach.cancel'), style: 'cancel' },
        { text: t('coach.start'), onPress: apply },
      ]);
    else apply();
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || sending) return;
    const next: CoachTurn[] = [...history, { role: 'user', text: q }];
    setHistory(next);
    setInput('');
    setSending(true);
    try {
      const answer = await askCoach(analysis, role, next);
      const done: CoachTurn[] = [...next, { role: 'assistant', text: answer.text, pro: answer.proRequired || undefined }];
      setHistory(done);
      save(analysis, role, done);
      bump('mila_question');
    } catch (e) {
      setHistory(history);
      setInput(q);
      if (e instanceof ApiError && (e.code === 'pro_required' || e.code === 'free_limit')) {
        if (e.code === 'free_limit') Alert.alert(t('coach.freeLimitTitle'), errorText(e));
        router.push('/pro');
      }
      else Alert.alert(t('coach.errorTitle'), errorText(e));
    } finally {
      setSending(false);
    }
  };

  const oneToOne = analysis ? analysis.participants.length <= 2 : false;
  const other = analysis?.participants.find((p) => p !== analysis.me);
  const groups = starterGroups(analysis);
  const shown = groups.find((g) => g.id === cat) ?? groups[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('coach.title')}</Text>
          {list.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Pill label={t('coach.generalChip')} emoji="💬" active={general} onPress={() => select('genel')} />
              {list.map((a) => (
                <Pill key={a.id} label={a.title} active={a.id === analysis?.id} onPress={() => select(a.id)} />
              ))}
            </ScrollView>
          ) : null}
          {analysis && oneToOne ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {roles().map((r) => (
                <View key={r.label} style={r.id && !pro ? styles.locked : undefined}>
                  <Pill
                    label={r.label}
                    emoji={r.id && !pro ? '🔒' : r.emoji}
                    active={r.id === role}
                    onPress={() => (r.id && !pro ? router.push('/pro') : changeRole(r.id))}
                  />
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>

          <FlatList
            ref={listRef}
            data={history}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={{ gap: space.md }}>
                <Card>
                  <Text style={[type.body, { color: colors.text }]}>
                    {!analysis
                      ? t('coach.introGeneral')
                      : role
                        ? t('coach.introRole', { name: other ?? t('coach.otherPerson') })
                        : t('coach.introChat', { title: analysis.title })}
                  </Text>
                </Card>
                {!role ? (
                  <View style={{ gap: space.sm }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                      {groups.map((g) => (
                        <Pill
                          key={g.id}
                          label={t(`coach.categories.${g.id}`)}
                          emoji={CAT_EMOJI[g.id]}
                          active={g.id === shown.id}
                          onPress={() => setCat(g.id)}
                        />
                      ))}
                    </ScrollView>
                    <View style={styles.starters}>
                      {shown.items.map((s) => {
                        const locked = s.pro && !pro;
                        return (
                          <View key={s.q} style={locked && styles.locked}>
                            <Pill label={s.q} emoji={locked ? '🔒' : undefined} onPress={() => (locked ? router.push('/pro') : send(s.q))} />
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.role === 'user' ? styles.mine : styles.theirs]}>
                <Text style={[type.body, { color: item.role === 'user' ? colors.onPrimary : colors.text }]}>{item.text}</Text>
                {item.pro && !pro ? (
                  <Pressable onPress={() => router.push('/pro')} style={styles.proCta}>
                    <Text style={[type.label, { color: colors.onPrimary }]}>{t('coach.unlockAnswer')}</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
            ListFooterComponent={sending ? <ActivityIndicator color={colors.primary} style={{ marginTop: space.sm }} /> : null}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={role ? t('coach.placeholderRole') : t('coach.placeholderAsk')}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={1000}
            />
            <Pressable
              accessibilityLabel={t('coach.send')}
              onPress={() => send(input)}
              disabled={!input.trim() || sending}
              style={[styles.send, (!input.trim() || sending) && { opacity: 0.4 }]}>
              <Send color={colors.onPrimary} size={20} />
            </Pressable>
          </View>
        <Text style={styles.note}>{t('coach.note')}</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.sm },
  title: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.text },
  chips: { gap: space.sm, paddingRight: space.lg },
  messages: { padding: space.lg, gap: space.sm, flexGrow: 1 },
  starters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  locked: { opacity: 0.45 },
  proCta: { marginTop: space.sm, alignSelf: 'flex-start', backgroundColor: colors.coral, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  bubble: { maxWidth: '85%', borderRadius: radius.md, paddingVertical: space.sm, paddingHorizontal: space.md },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, paddingHorizontal: space.md, paddingTop: space.sm },
  input: {
    flex: 1,
    ...type.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 120,
  },
  send: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  note: { ...type.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: space.sm },
});
