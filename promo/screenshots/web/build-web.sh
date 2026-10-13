#!/bin/bash
# Mağaza ekran görüntüleri için uygulamanın GEÇİCİ web derlemesi ($S/webdist).
# node_modules, metro ayarı ve birkaç kaynak dosyaya geçici yama yapar, derler, hepsini geri alır.
# Gerekli: npm install --no-save react-native-web@~0.21.0
set -e
cd /home/user/myterm
S=${TMPDIR:-/tmp}/synvia-web; mkdir -p $S
SS=node_modules/expo-secure-store/build/ExpoSecureStore.web.js
cp $SS $S/securestore.web.bak
cat > $SS <<'JS'
const k = (key) => 'ss_' + key;
export default {
  getValueWithKeyAsync: async (key) => localStorage.getItem(k(key)),
  getValueWithKeySync: (key) => localStorage.getItem(k(key)),
  setValueWithKeyAsync: async (value, key) => { localStorage.setItem(k(key), value); },
  setValueWithKeySync: (value, key) => { localStorage.setItem(k(key), value); },
  deleteValueWithKeyAsync: async (key) => { localStorage.removeItem(k(key)); },
  canUseBiometricAuthentication: () => false,
};
JS
cp metro.config.js $S/metro.config.js.bak
echo "module.exports.resolver.assetExts.push('wasm');" >> metro.config.js
trap 'git checkout -- src app; cp $S/metro.config.js.bak metro.config.js; cp $S/securestore.web.bak '$SS'' EXIT
python3 - <<'PY'
p='src/services/notificationResponses.tsx'; s=open(p).read()
s=s.replace("const last = Notifications.getLastNotificationResponse();","const last = null as any;")
s=s.replace("const subscription = Notifications.addNotificationResponseReceivedListener(handle);\n    return () => subscription.remove();","return () => {};")
open(p,'w').write(s)
p='src/db/DatabaseProvider.tsx'; s=open(p).read()
s=s.replace("await ensureColumn(db, 'follow_ups', 'recurrence', 'TEXT');","await ensureColumn(db, 'follow_ups', 'recurrence', 'TEXT');\n  const seed = (globalThis as any).__SEED__; if (seed && !(globalThis as any).__SEEDED__) { (globalThis as any).__SEEDED__ = 1; await db.execAsync(seed); }")
open(p,'w').write(s)
p='app/takip/ai-cikar.tsx'; s=open(p).read()
anchor="  const [pdfLoading, setPdfLoading] = useState(false);\n"
assert anchor in s
s=s.replace(anchor, anchor+"""  useEffect(() => {
    const d = (globalThis as any).__DEMO_AI__; if (!d) return;
    setMode(d.mode); if (d.image) setImage(d.image); if (d.transcript) setTranscript(d.transcript);
    if (d.hasRecording) setHasRecording(true);
    setCandidates(toCandidates(d.candidates)); setCandidateSource(d.mode === 'image' ? 'screenshot' : 'voice');
  }, []);
""")
open(p,'w').write(s)
PY
rm -rf $S/webdist
CI=1 npx expo export -p web --output-dir $S/webdist 2>&1 | tail -2
