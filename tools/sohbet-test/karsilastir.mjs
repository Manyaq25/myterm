// Sohbet analizi model karşılaştırması: aynı kurgu sohbeti Haiku 5.5 ve
// Sonnet 5.5'e gönderir; cevapları, token sayılarını, süreyi ve maliyeti
// sonuc/rapor.md dosyasına yazar. Anahtar ANTHROPIC_API_KEY ortam
// değişkeninden okunur (GitHub Actions sırrı), dosyaya veya çıktıya yazılmaz.
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// $ / 1M token (girdi, çıktı)
const MODELS = [
  { id: "claude-haiku-5-5", ad: "Haiku 5.5", girdi: 0.1, cikti: 0.5 },
  { id: "claude-sonnet-5-5", ad: "Sonnet 5.5", girdi: 2, cikti: 10 },
];
const EFFORT = process.env.EFFORT || "medium";
// Gerçek bir analizde AI'a giden girdi tahmini (~400 mesaj + istatistik).
const TIPIK_GIRDI = 12000;
// Uygulamayı kullanan (soruyu soran) taraf
const KULLANICI = {
  "1-soguyan-flort.txt": "Emre",
  "2-kankalar-grubu.txt": "Burak",
  "3-anne-ogul.txt": "Kerem",
  "4-ironik-kavga.txt": "Ozan",
  "5-kanka-sevgisi.txt": "Damla",
};

// WhatsApp dışa aktarma satırları:
//   Android: 02.10.2026 20:14 - Ad: mesaj
//   iOS:     [09.10.2026 19:02:11] Ad: mesaj
const SATIR = [
  /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}) - ([^:]+): (.*)$/,
  /^\[(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):\d{2}\] ([^:]+): (.*)$/,
];

function ayristir(metin) {
  const mesajlar = [];
  for (const satir of metin.split(/\r?\n/)) {
    const m = SATIR.map((r) => satir.match(r)).find(Boolean);
    if (m) {
      const [, g, a, y, s, d, kim, yazi] = m;
      mesajlar.push({ zaman: new Date(+y, +a - 1, +g, +s, +d), kim: kim.trim(), yazi });
    } else if (mesajlar.length && satir.trim()) {
      mesajlar[mesajlar.length - 1].yazi += "\n" + satir;
    }
  }
  return mesajlar;
}

// Kişisel verileri AI'a göndermeden önce maskele.
function maskele(yazi) {
  return yazi
    .replace(/\bTR\d{2}(?:\s?\d{4}){5}\s?\d{2}\b/gi, "[IBAN]")
    .replace(/(?:\+90|0)?\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g, "[TELEFON]");
}

const EMOJI = /\p{Extended_Pictographic}/gu;
const SAAT = 3600 * 1000;

// Uygulamada telefonda hesaplanacak istatistiklerin aynısı.
function istatistik(mesajlar) {
  const kisi = {};
  const al = (k) =>
    (kisi[k] ??= { mesaj: 0, kelime: 0, emoji: 0, baslatma: 0, cevapSureleri: [], ardArda: 0, saatler: {} });
  mesajlar.forEach((m, i) => {
    const p = al(m.kim);
    p.mesaj++;
    p.kelime += m.yazi.split(/\s+/).filter(Boolean).length;
    p.emoji += (m.yazi.match(EMOJI) || []).length;
    const saat = m.zaman.getHours();
    p.saatler[saat] = (p.saatler[saat] || 0) + 1;
    const once = mesajlar[i - 1];
    const ara = once ? m.zaman - once.zaman : Infinity;
    // Uzun aradan sonra ilk yazan başlatmış sayılır; ama başkasının mesajına
    // geç verilen yanıt başlatma değil, (48 saate kadar) cevap süresidir.
    if (!once || (ara > 4 * SAAT && (once.kim === m.kim || ara > 48 * SAAT))) p.baslatma++;
    else if (once.kim !== m.kim) p.cevapSureleri.push(ara);
    // Cevap gelmeden 10 dakikadan sonra yeniden yazmak (çift mesaj)
    if (once && once.kim === m.kim && ara > 10 * 60 * 1000) p.ardArda++;
  });
  const ozet = {};
  for (const [ad, p] of Object.entries(kisi)) {
    const sirali = [...p.cevapSureleri].sort((a, b) => a - b);
    const orta = sirali.length ? sirali[Math.floor(sirali.length / 2)] : null;
    const enCok = Object.entries(p.saatler).sort((a, b) => b[1] - a[1])[0]?.[0];
    ozet[ad] = {
      mesaj_sayisi: p.mesaj,
      ortalama_kelime: +(p.kelime / p.mesaj).toFixed(1),
      emoji: p.emoji,
      sohbeti_baslatma: p.baslatma,
      ortanca_cevap_suresi_dk: orta == null ? null : Math.round(orta / 60000),
      cevapsiz_ard_arda_mesaj: p.ardArda,
      en_aktif_saat: enCok == null ? null : `${enCok}:00`,
    };
  }
  return {
    toplam_mesaj: mesajlar.length,
    ilk_mesaj: mesajlar[0] && tarih(mesajlar[0].zaman),
    son_mesaj: mesajlar.at(-1) && tarih(mesajlar.at(-1).zaman),
    kisiler: ozet,
  };
}

const iki = (n) => String(n).padStart(2, "0");
const tarih = (z) => `${iki(z.getDate())}.${iki(z.getMonth() + 1)} ${iki(z.getHours())}:${iki(z.getMinutes())}`;
const bicimle = (m) => `${tarih(m.zaman)} ${m.kim}: ${maskele(m.yazi)}`;

const SISTEM = `Sen Türkçe sohbet analizi yapan bir uygulamanın yapay zekâsısın. Kullanıcı kendi WhatsApp/Telegram sohbetini yükledi; telefonda hesaplanan istatistikleri ve mesajları alıyorsun.

Görevin: sohbetteki ilişki dinamiğini Türkçenin inceliklerini gözeterek yorumlamak.
- Türkçe ton işaretlerine dikkat et: noktalı tek kelimelik "Tamam.", "Sen bilirsin", ironik "harikasın", "aynen öyle canım", gülen yüzle biten iğneleme gibi.
- Arkadaşlar arasındaki argo ve sert görünen şakaları ("hain", "salak", "öldürürüm") bağlama göre oku; samimiyetse öyle söyle, yersiz alarm verme.
- Her önemli yorumu sohbetten kısa bir alıntı veya istatistikle destekle.
- Kesin hüküm verme, olasılık dili kullan ("büyük ihtimalle", "işaret ediyor"). İnsanlara teşhis koyma, etiket yapıştırma.
- Kişisel verileri (IBAN, telefon, adres) tekrarlama.
- Sıcak, sade ve eğlenceli bir dil kullan; uzun paragraflardan kaçın.

Cevap biçimi (Markdown):
## Kısa özet
2-3 cümle.
## Kim nasıl yazıyor
Her kişi için 1-2 madde (istatistiğe dayanarak).
## İlişki dinamiği
3-5 madde, alıntılarla.
## Ton ve satır araları
Dikkat çeken 2-4 ifade ve ne anlama gelebileceği.
## İlgi göstergesi
Her kişi için 0-10 arası tahmini ilgi/yakınlık puanı ve tek cümle gerekçe.
## Ne yazabilirsin
Kullanıcının (istemde "Kullanıcı" olarak belirtilen kişi) gönderebileceği 1-2 örnek mesaj.
## Paylaşılabilir kart
En fazla 3 kısa, eğlenceli satır (kimseyi incitmeyecek şekilde).`;

function istem(dosya, mesajlar) {
  return `Sohbet: ${dosya}
Kullanıcı (uygulamayı kullanan kişi): ${KULLANICI[dosya] ?? "belirtilmedi"}
Telefonda hesaplanan istatistikler (JSON):
${JSON.stringify(istatistik(mesajlar), null, 2)}

Mesajlar:
${mesajlar.map(bicimle).join("\n")}`;
}

if (process.env.DRY) {
  for (const f of fs.readdirSync(path.join(here, "sohbetler")).filter((f) => f.endsWith(".txt")).sort()) {
    console.log(istem(f, ayristir(fs.readFileSync(path.join(here, "sohbetler", f), "utf8"))) + "\n");
  }
  process.exit(0);
}

const client = new Anthropic();

async function calistir(model, icerik) {
  const bas = Date.now();
  try {
    const r = await client.messages.create({
      model: model.id,
      max_tokens: 16000,
      output_config: { effort: EFFORT },
      system: SISTEM,
      messages: [{ role: "user", content: icerik }],
    });
    const metin = r.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const { input_tokens: girdi, output_tokens: cikti } = r.usage;
    return {
      metin: r.stop_reason === "refusal" ? `(REDDETTİ: ${r.stop_details?.category})` : metin,
      girdi,
      cikti,
      sure: (Date.now() - bas) / 1000,
      maliyet: (girdi * model.girdi + cikti * model.cikti) / 1e6,
      tipikMaliyet: (TIPIK_GIRDI * model.girdi + cikti * model.cikti) / 1e6,
      dur: r.stop_reason,
    };
  } catch (e) {
    const durum = e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : String(e);
    return { metin: `(HATA: ${durum})`, girdi: 0, cikti: 0, sure: 0, maliyet: 0, tipikMaliyet: 0, dur: "error" };
  }
}

const klasor = path.join(here, "sohbetler");
const dosyalar = fs.readdirSync(klasor).filter((f) => f.endsWith(".txt")).sort();
const satirlar = [`# Sohbet analizi model karşılaştırması`, ``, `Tarih: ${new Date().toISOString().slice(0, 10)} · effort: ${EFFORT}`, ``];
const toplam = Object.fromEntries(MODELS.map((m) => [m.id, { girdi: 0, cikti: 0, maliyet: 0, tipik: 0, sure: 0 }]));
const tablo = [];

for (const dosya of dosyalar) {
  const mesajlar = ayristir(fs.readFileSync(path.join(klasor, dosya), "utf8"));
  const icerik = istem(dosya, mesajlar);
  const sonuclar = await Promise.all(MODELS.map((m) => calistir(m, icerik)));
  satirlar.push(`---`, ``, `## ${dosya} (${mesajlar.length} mesaj)`, ``);
  MODELS.forEach((m, i) => {
    const s = sonuclar[i];
    const t = toplam[m.id];
    t.girdi += s.girdi; t.cikti += s.cikti; t.maliyet += s.maliyet; t.tipik += s.tipikMaliyet; t.sure += s.sure;
    tablo.push(`| ${dosya} | ${m.ad} | ${s.girdi} | ${s.cikti} | ${s.sure.toFixed(1)} sn | $${s.maliyet.toFixed(4)} |`);
    satirlar.push(`### ${m.ad}`, ``, `_girdi ${s.girdi} · çıktı ${s.cikti} token · ${s.sure.toFixed(1)} sn · $${s.maliyet.toFixed(4)} · ${s.dur}_`, ``, s.metin, ``);
  });
  console.log(`bitti: ${dosya}`);
}

const n = dosyalar.length;
const ozet = [
  `## Ölçümler`,
  ``,
  `| Sohbet | Model | Girdi | Çıktı | Süre | Maliyet |`,
  `|---|---|---|---|---|---|`,
  ...tablo,
  ``,
  `## Analiz başına ortalama`,
  ``,
  `| Model | Ort. çıktı token | Ort. süre | Bu testte $/analiz | Gerçek boyutta tahmini $/analiz (${TIPIK_GIRDI} girdi) | 300 analiz/ay |`,
  `|---|---|---|---|---|---|`,
  ...MODELS.map((m) => {
    const t = toplam[m.id];
    const tipik = t.tipik / n;
    return `| ${m.ad} | ${Math.round(t.cikti / n)} | ${(t.sure / n).toFixed(1)} sn | $${(t.maliyet / n).toFixed(4)} | $${tipik.toFixed(4)} | $${(tipik * 300).toFixed(2)} |`;
  }),
  ``,
];
satirlar.splice(4, 0, ...ozet);

const rapor = satirlar.join("\n");
fs.mkdirSync(path.join(here, "sonuc"), { recursive: true });
fs.writeFileSync(path.join(here, "sonuc", "rapor.md"), rapor);
console.log("\n===== RAPOR =====\n" + rapor);
