// Dışa aktarma rehberi çizimleri: WhatsApp / Telegram ekranlarının sade
// benzerleri (gerçek ekran görüntüsü değil). Dokunulacak yer kırmızı halkayla
// gösterilir.
import { Image } from 'expo-image';
import { Hand } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, space, type } from '@/theme';

const DARK = '#1E2326';
const PANEL = '#2A3035';
const LINE = '#3A4147';
const LIGHT = '#E9EDEF';
const MUTED = '#8696A0';
const GREEN = '#25D366';
const DANGER = '#F15C6D';

export type Art =
  | { kind: 'chat'; tap: 'name' | 'menu' }
  | { kind: 'list'; header?: string; rows: { label: string; danger?: boolean; hl?: boolean }[]; scrollHint?: boolean }
  | { kind: 'sheet'; title: string; options: string[]; hl: number }
  | { kind: 'share'; apps: { label: string; icon: string; hl?: boolean }[] }
  | { kind: 'desktop'; rows?: string[]; hl?: number; title: string };

function Tap() {
  return (
    <View style={styles.tap}>
      <Hand color="#fff" size={18} />
    </View>
  );
}

function Phone({ children }: { children: ReactNode }) {
  return <View style={styles.phone}>{children}</View>;
}

function ChatArt({ tap }: { tap: 'name' | 'menu' }) {
  return (
    <Phone>
      <View style={styles.chatBar}>
        <Text style={[styles.light, { color: GREEN }]}>‹</Text>
        <View style={[styles.namePill, tap === 'name' && styles.hl]}>
          <View style={styles.avatar} />
          <View>
            <Text style={[styles.light, { fontFamily: fonts.bold }]}>Ece ✨</Text>
            <Text style={styles.mutedSm}>çevrimiçi</Text>
          </View>
          {tap === 'name' ? <Tap /> : null}
        </View>
        <View style={[styles.menuDot, tap === 'menu' && styles.hl]}>
          <Text style={[styles.light, { fontSize: 18 }]}>⋮</Text>
          {tap === 'menu' ? <Tap /> : null}
        </View>
      </View>
      <View style={[styles.msg, styles.msgIn]}>
        <Text style={styles.lightSm}>Kahve için yarın 15:00 uyar mı? ☕</Text>
      </View>
      <View style={[styles.msg, styles.msgOut]}>
        <Text style={styles.lightSm}>Süper olur, oradayım! 🧁</Text>
      </View>
    </Phone>
  );
}

function ListArt({ header, rows, scrollHint }: Extract<Art, { kind: 'list' }>) {
  return (
    <Phone>
      {header ? (
        <View style={{ alignItems: 'center', gap: 4, marginBottom: space.sm }}>
          <View style={[styles.avatar, { width: 44, height: 44, borderRadius: 22 }]} />
          <Text style={[styles.light, { fontFamily: fonts.bold }]}>{header}</Text>
        </View>
      ) : null}
      <View style={styles.listBox}>
        {rows.map((r, i) => (
          <View key={r.label} style={[styles.listRow, i > 0 && styles.listSep, r.hl && styles.hlRow]}>
            <Text style={[styles.lightSm, r.danger && { color: DANGER }, r.hl && { fontFamily: fonts.bold }]}>{r.label}</Text>
            {r.hl ? <Tap /> : null}
          </View>
        ))}
      </View>
      {scrollHint ? <Text style={[styles.mutedSm, { textAlign: 'center', marginTop: space.sm }]}>⬇ en alta kaydır</Text> : null}
    </Phone>
  );
}

function SheetArt({ title, options, hl }: Extract<Art, { kind: 'sheet' }>) {
  return (
    <Phone>
      <View style={{ flex: 1, minHeight: 40 }} />
      <View style={styles.listBox}>
        <Text style={[styles.mutedSm, { textAlign: 'center', padding: space.sm }]}>{title}</Text>
        {options.map((o, i) => (
          <View key={o} style={[styles.listRow, styles.listSep, { justifyContent: 'center' }, i === hl && styles.hlRow]}>
            <Text style={[styles.light, { color: '#53BDEB' }, i === hl && { fontFamily: fonts.bold }]}>{o}</Text>
            {i === hl ? <Tap /> : null}
          </View>
        ))}
      </View>
      <View style={[styles.listBox, { marginTop: 6 }]}>
        <View style={[styles.listRow, { justifyContent: 'center' }]}>
          <Text style={[styles.light, { color: '#53BDEB', fontFamily: fonts.bold }]}>Vazgeç</Text>
        </View>
      </View>
    </Phone>
  );
}

function ShareArt({ apps }: Extract<Art, { kind: 'share' }>) {
  return (
    <Phone>
      <View style={styles.fileChip}>
        <Text style={styles.lightSm}>🗂️ WhatsApp Sohbeti – Ece.zip</Text>
      </View>
      <View style={styles.appsRow}>
        {apps.map((a) => (
          <View key={a.label} style={styles.appCell}>
            <View style={[styles.appIcon, a.hl && styles.hlIcon]}>
              {a.icon === 'unwrap' ? (
                <Image source={require('../../assets/images/icon.png')} style={styles.appImg} />
              ) : (
                <Text style={{ fontSize: 24 }}>{a.icon}</Text>
              )}
              {a.hl ? <Tap /> : null}
            </View>
            <Text style={[styles.mutedSm, a.hl && { color: LIGHT, fontFamily: fonts.bold }]} numberOfLines={1}>
              {a.label}
            </Text>
          </View>
        ))}
      </View>
    </Phone>
  );
}

function DesktopArt({ title, rows, hl }: Extract<Art, { kind: 'desktop' }>) {
  return (
    <View style={styles.desktop}>
      <View style={styles.winBar}>
        <View style={[styles.winDot, { backgroundColor: '#FF5F57' }]} />
        <View style={[styles.winDot, { backgroundColor: '#FEBC2E' }]} />
        <View style={[styles.winDot, { backgroundColor: '#28C840' }]} />
        <Text style={[styles.mutedSm, { marginLeft: space.sm }]}>{title}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm, padding: space.sm }}>
        <View style={{ flex: 1, gap: 6 }}>
          {['Ece', 'Kankalar', 'Annem'].map((n, i) => (
            <View key={n} style={[styles.deskChat, i === 0 && { backgroundColor: '#2B5278' }]}>
              <Text style={styles.lightSm}>{n}</Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1.4 }}>
          {rows ? (
            <View style={styles.listBox}>
              {rows.map((r, i) => (
                <View key={r} style={[styles.listRow, i > 0 && styles.listSep, i === hl && styles.hlRow]}>
                  <Text style={[styles.lightSm, i === hl && { fontFamily: fonts.bold }]}>{r}</Text>
                  {i === hl ? <Tap /> : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.lightSm, { color: MUTED }]}>💻 Bilgisayardaki Telegram Desktop</Text>
          )}
        </View>
      </View>
    </View>
  );
}

export function GuideArt({ art }: { art: Art }) {
  switch (art.kind) {
    case 'chat':
      return <ChatArt tap={art.tap} />;
    case 'list':
      return <ListArt {...art} />;
    case 'sheet':
      return <SheetArt {...art} />;
    case 'share':
      return <ShareArt {...art} />;
    case 'desktop':
      return <DesktopArt {...art} />;
  }
}

const styles = StyleSheet.create({
  phone: { backgroundColor: DARK, borderRadius: radius.lg, padding: space.md, gap: space.sm, minHeight: 230, overflow: 'visible' },
  light: { ...type.body, color: LIGHT },
  lightSm: { ...type.bodySm, color: LIGHT },
  mutedSm: { ...type.caption, color: MUTED },
  chatBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: PANEL, borderRadius: radius.sm, padding: space.sm },
  namePill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: 6, borderRadius: radius.md },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.coral },
  menuDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  msg: { maxWidth: '80%', borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 12 },
  msgIn: { alignSelf: 'flex-start', backgroundColor: PANEL },
  msgOut: { alignSelf: 'flex-end', backgroundColor: '#005C4B' },
  listBox: { backgroundColor: PANEL, borderRadius: radius.sm, overflow: 'visible' },
  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: space.md },
  listSep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LINE },
  hl: { borderWidth: 2, borderColor: colors.coral },
  hlRow: { borderWidth: 2, borderColor: colors.coral, borderRadius: radius.sm },
  hlIcon: { borderWidth: 3, borderColor: colors.coral },
  tap: {
    position: 'absolute',
    right: -6,
    bottom: -10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  fileChip: { backgroundColor: PANEL, borderRadius: radius.sm, padding: space.sm, alignSelf: 'center' },
  appsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: space.md },
  appCell: { alignItems: 'center', gap: 6, width: 64 },
  appIcon: { width: 54, height: 54, borderRadius: 14, backgroundColor: PANEL, alignItems: 'center', justifyContent: 'center' },
  appImg: { width: 48, height: 48, borderRadius: 11 },
  desktop: { backgroundColor: DARK, borderRadius: radius.md, overflow: 'visible', minHeight: 200 },
  winBar: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LINE },
  winDot: { width: 10, height: 10, borderRadius: 5 },
  deskChat: { backgroundColor: PANEL, borderRadius: 8, padding: 8 },
});
