// "Arkadaşını getir": kendi davet kodunu paylaş, arkadaşın kodu girince ikinize
// de 1 hafta Pro. Bağlantıyla açılırsa (unwrap://davet?kod=ABC123) kod hazır gelir.
// Aynı ekranda "1 ay Pro hediyesi" satın alınır; her satın alma bir hediye kodu
// (8 hane) üretir. Davet (6 hane) ve hediye kodu aynı kutuya girilir.
import { useLocalSearchParams } from 'expo-router';
import { Gift, Share2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import Purchases from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton, Button, Card, Sticker, useTopInset } from '@/components/ui';
import { t } from '@/i18n';
import { ApiError, errorText, giftCodes, inviteInfo, redeemInvite, type GiftCode, type InviteInfo } from '@/lib/ai/api';
import { STORE_LINKS } from '@/lib/links';
import { buyGift, giftProduct, initPurchases } from '@/lib/purchases';
import type { PurchasesStoreProduct } from 'react-native-purchases';
import { colors, fonts, radius, space, type } from '@/theme';

export default function Davet() {
  const { kod } = useLocalSearchParams<{ kod?: string }>();
  const topInset = useTopInset();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [code, setCode] = useState((kod ?? '').toUpperCase().slice(0, 8));
  const [busy, setBusy] = useState(false);
  const [gift, setGift] = useState<PurchasesStoreProduct | null>(null);
  const [gifts, setGifts] = useState<GiftCode[]>([]);
  const [buying, setBuying] = useState(false);

  const load = () => {
    setLoadError(null);
    inviteInfo().then(setInfo, (e) => setLoadError(errorText(e)));
    giftCodes().then(setGifts, () => undefined);
  };
  useEffect(load, []);
  useEffect(() => {
    giftProduct().then(setGift, () => undefined);
  }, []);

  const shareGift = (c: string) =>
    Share.share({ message: t('invite.gift.shareText', { code: c, ios: STORE_LINKS.ios, android: STORE_LINKS.android }) }).catch(() => undefined);

  const purchaseGift = async () => {
    if (!gift) return;
    setBuying(true);
    try {
      if (!(await buyGift(gift))) return;
      // Satın alma RevenueCat'e birkaç saniyede düşer; kod gelene kadar kısa aralıklarla sor.
      for (let i = 0; i < 6; i++) {
        const list = await giftCodes().catch(() => null);
        if (list && list.length > gifts.length) {
          setGifts(list);
          const fresh = list[list.length - 1];
          Alert.alert(t('invite.gift.readyTitle'), t('invite.gift.readyText', { code: fresh.code }), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('invite.share'), onPress: () => shareGift(fresh.code) },
          ]);
          return;
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
      Alert.alert(t('invite.gift.pendingTitle'), t('invite.gift.pendingText'));
    } catch {
      Alert.alert(t('paywall.errors.purchaseTitle'), t('paywall.errors.purchaseBody'));
    } finally {
      setBuying(false);
    }
  };

  const share = () =>
    info &&
    Share.share({
      message: t('invite.shareText', { code: info.code, ios: STORE_LINKS.ios, android: STORE_LINKS.android }),
    }).catch(() => undefined);

  const redeem = async () => {
    setBusy(true);
    try {
      const r = await redeemInvite(code);
      if (r.result === 'ok') {
        if (await initPurchases()) {
          await Purchases.invalidateCustomerInfoCache();
          await Purchases.getCustomerInfo().catch(() => undefined);
        }
        Alert.alert(t('invite.okTitle'), t(r.gift ? 'invite.gift.okText' : 'invite.okText'));
        setCode('');
        load();
      } else {
        Alert.alert(t('invite.failTitle'), t(`invite.fail.${r.result}`));
      }
    } catch (e) {
      Alert.alert(t('invite.failTitle'), e instanceof ApiError || e instanceof Error ? errorText(e) : t('common.apiErrors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: topInset }]} edges={['bottom', 'left', 'right']}>
      <View style={styles.top}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[type.headline, { color: colors.text }]}>{t('invite.title')}</Text>
        <Text style={[type.body, { color: colors.textMuted }]}>{t('invite.subtitle')}</Text>

        <Card style={styles.codeCard}>
          <Sticker text={t('invite.sticker')} rotate={-6} bg={colors.cardButter} />
          {info ? (
            <>
              <Text style={styles.code} selectable>{info.code}</Text>
              <Text style={[type.bodySm, { color: colors.textMuted, textAlign: 'center' }]}>
                {t('invite.progress', { count: info.rewards, max: info.max })}
              </Text>
              <Button label={t('invite.share')} icon={<Share2 color="#fff" size={20} />} onPress={share} style={{ alignSelf: 'stretch' }} />
            </>
          ) : loadError ? (
            <>
              <Text style={[type.bodySm, { color: colors.text, textAlign: 'center' }]}>{loadError}</Text>
              <Button label={t('report.retry')} variant="ghost" onPress={load} />
            </>
          ) : (
            <ActivityIndicator color={colors.primary} style={{ height: 80 }} />
          )}
        </Card>

        <Text style={styles.section}>{t('invite.how')}</Text>
        {(['step1', 'step2', 'step3'] as const).map((k, i) => (
          <View key={k} style={styles.step}>
            <Text style={styles.stepNum}>{i + 1}</Text>
            <Text style={[type.body, { color: colors.text, flex: 1 }]}>{t(`invite.${k}`)}</Text>
          </View>
        ))}

        {/* Hediye Pro */}
        <Card style={[{ gap: space.sm }, { backgroundColor: colors.cardCoral }]}>
          <Text style={[type.title, { color: colors.text }]}>💝 {t('invite.gift.title')}</Text>
          <Text style={[type.bodySm, { color: colors.textMuted }]}>{t('invite.gift.text')}</Text>
          {gift ? (
            <Button
              label={t('invite.gift.buy', { price: gift.priceString })}
              variant="coral"
              icon={<Gift color="#fff" size={20} />}
              onPress={purchaseGift}
              loading={buying}
              disabled={buying}
            />
          ) : (
            <Text style={[type.caption, { color: colors.textMuted }]}>{t('invite.gift.soon')}</Text>
          )}
          {gifts.map((g) => (
            <View key={g.code} style={styles.giftRow}>
              <Text style={[styles.giftCode, g.redeemed && { textDecorationLine: 'line-through', color: colors.textMuted }]} selectable>{g.code}</Text>
              {g.redeemed ? (
                <Text style={[type.caption, { color: colors.textMuted }]}>{t('invite.gift.used')}</Text>
              ) : (
                <Button label={t('invite.share')} variant="ghost" onPress={() => shareGift(g.code)} />
              )}
            </View>
          ))}
        </Card>

        {info ? (
          <Card style={{ gap: space.sm }}>
            <Text style={[type.title, { color: colors.text }]}>{t('invite.haveCode')}</Text>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
              placeholder="ABC123"
              placeholderTextColor={colors.outline}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
              maxLength={8}
            />
            <Button
              label={t('invite.redeem')}
              variant="coral"
              icon={<Gift color="#fff" size={20} />}
              onPress={redeem}
              loading={busy}
              disabled={(code.length !== 6 && code.length !== 8) || busy}
            />
          </Card>
        ) : null}
        <Text style={[type.caption, { color: colors.textMuted, textAlign: 'center' }]}>{t('invite.terms', { max: info?.max ?? 10 })}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  top: { paddingHorizontal: space.lg, paddingTop: space.sm },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl },
  codeCard: { alignItems: 'center', gap: space.md, backgroundColor: colors.cardLilac },
  code: { fontFamily: fonts.extrabold, fontSize: 44, letterSpacing: 6, color: colors.text },
  section: { fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1, color: colors.primary, marginTop: space.sm },
  step: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  stepNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.cardCoral, textAlign: 'center', lineHeight: 30, fontFamily: fonts.extrabold, color: colors.text, overflow: 'hidden' },
  giftRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: 4 },
  giftCode: { fontFamily: fonts.extrabold, fontSize: 18, letterSpacing: 3, color: colors.text },
  input: {
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.outline, backgroundColor: colors.surface,
    paddingHorizontal: space.md, paddingVertical: 14, fontFamily: fonts.extrabold, fontSize: 22, letterSpacing: 4, color: colors.text, textAlign: 'center',
  },
});
