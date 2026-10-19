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
import { isRomantic } from '@/lib/relations';
import { getAnalysis, listAnalyses, updateAnalysis, type Analysis, type AnalysisSummary } from '@/lib/store';
import { colors, fonts, radius, space, type } from '@/theme';

const ROLES: { id: CoachRole | null; label: string; emoji: string }[] = [
  { id: null, label: 'Mila (koç)', emoji: '💬' },
  { id: 'sevgili', label: 'Sevgilim', emoji: '💘' },
  { id: 'hoslandigim', label: 'Hoşlandığım', emoji: '🦋' },
  { id: 'eski', label: 'Eski sevgilim', emoji: '💔' },
  { id: 'hayalimdeki', label: 'Hayalimdeki', emoji: '✨' },
];

function starters(a: Analysis): string[] {
  if (a.participants.length > 2) return ['Grubu en çok kim taşıyor?', 'Kim kime daha çok destek oluyor?', 'Grupta küs olan var mı?'];
  if (isRomantic(a.relation))
    return ['Bana ilgisi var mı?', 'Ona şimdi ne yazmalıyım?', 'Kim daha çok çabalıyor?', 'Beni aldatıyor olabilir mi?'];
  return ['Bu arkadaşlık nasıl gidiyor?', 'Aramızda gerginlik var mı?', 'Ona ne yazmalıyım?'];
}

export default function Koc() {
  const params = useLocalSearchParams<{ id?: string }>();
  const [list, setList] = useState<AnalysisSummary[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [role, setRole] = useState<CoachRole | null>(null);
  const [history, setHistory] = useState<CoachTurn[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<CoachTurn>>(null);

  const select = useCallback((id: string) => {
    const a = getAnalysis(id);
    setAnalysis(a);
    setRole(a?.coach?.role ?? null);
    setHistory(a?.coach?.history ?? []);
  }, []);

  // Rapordan "Mila'ya sor" ile gelindiyse o sohbet bir kez seçilir.
  const handledParam = useRef<string | undefined>(undefined);
  const currentId = analysis?.id;
  useFocusEffect(
    useCallback(() => {
      const all = listAnalyses();
      setList(all);
      if (!all.length) return setAnalysis(null);
      const fromParam = params.id && params.id !== handledParam.current && all.some((x) => x.id === params.id);
      if (fromParam) {
        handledParam.current = params.id;
        select(params.id!);
      } else if (!currentId || !all.some((x) => x.id === currentId)) select(all[0].id);
    }, [params.id, currentId, select]),
  );

  const save = (a: Analysis, r: CoachRole | null, h: CoachTurn[]) => updateAnalysis(a.id, { coach: { role: r, history: h } });

  const changeRole = (r: CoachRole | null) => {
    if (!analysis || r === role) return;
    const apply = () => {
      setRole(r);
      setHistory([]);
      save(analysis, r, []);
    };
    if (history.length)
      Alert.alert('Yeni konuşma başlasın mı?', 'Rol değişince bu konuşma silinir.', [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Başlat', onPress: apply },
      ]);
    else apply();
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!analysis || !q || sending) return;
    const next: CoachTurn[] = [...history, { role: 'user', text: q }];
    setHistory(next);
    setInput('');
    setSending(true);
    try {
      const answer = await askCoach(analysis, role, next);
      const done: CoachTurn[] = [...next, { role: 'assistant', text: answer }];
      setHistory(done);
      save(analysis, role, done);
    } catch (e) {
      setHistory(history);
      setInput(q);
      if (e instanceof ApiError && e.code === 'pro_required') router.push('/pro');
      else Alert.alert('Mila cevap veremedi', errorText(e));
    } finally {
      setSending(false);
    }
  };

  const oneToOne = analysis ? analysis.participants.length <= 2 : false;
  const other = analysis?.participants.find((p) => p !== analysis.me);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>Mila</Text>
          {list.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {list.map((a) => (
                <Pill key={a.id} label={a.title} active={a.id === analysis?.id} onPress={() => select(a.id)} />
              ))}
            </ScrollView>
          ) : null}
          {analysis && oneToOne ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {ROLES.map((r) => (
                <Pill key={r.label} label={r.label} emoji={r.emoji} active={r.id === role} onPress={() => changeRole(r.id)} />
              ))}
            </ScrollView>
          ) : null}
        </View>

        {!analysis ? (
          <View style={styles.content}>
            <Card>
              <Text style={[type.body, { color: colors.textMuted }]}>
                Mila, yüklediğin sohbetlerden birini seçip onun hakkında konuşur. Önce Ana Sayfa’dan bir sohbet yükle.
              </Text>
            </Card>
          </View>
        ) : (
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
                    {role
                      ? `Şimdi ${other ?? 'karşındaki kişi'} gibi konuşuyorum; onun üslubunu sohbetinizden öğrendim. Bir şey yaz, prova edelim.`
                      : `Merhaba, ben Mila. “${analysis.title}” sohbetini okudum. Ne merak ediyorsun?`}
                  </Text>
                </Card>
                {!role ? (
                  <View style={styles.starters}>
                    {starters(analysis).map((s) => (
                      <Pill key={s} label={s} onPress={() => send(s)} />
                    ))}
                  </View>
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.role === 'user' ? styles.mine : styles.theirs]}>
                <Text style={[type.body, { color: item.role === 'user' ? colors.onPrimary : colors.text }]}>{item.text}</Text>
              </View>
            )}
            ListFooterComponent={sending ? <ActivityIndicator color={colors.primary} style={{ marginTop: space.sm }} /> : null}
          />
        )}

        {analysis ? (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={role ? 'Mesajını yaz…' : 'Mila’ya sor…'}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={1000}
            />
            <Pressable
              accessibilityLabel="Gönder"
              onPress={() => send(input)}
              disabled={!input.trim() || sending}
              style={[styles.send, (!input.trim() || sending) && { opacity: 0.4 }]}>
              <Send color={colors.onPrimary} size={20} />
            </Pressable>
          </View>
        ) : null}
        {analysis ? <Text style={styles.note}>Mila yapay zekâdır, yanılabilir; kesin hüküm vermez.</Text> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.sm },
  title: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.text },
  chips: { gap: space.sm, paddingRight: space.lg },
  content: { padding: space.lg },
  messages: { padding: space.lg, gap: space.sm, flexGrow: 1 },
  starters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
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
