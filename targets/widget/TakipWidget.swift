import WidgetKit
import SwiftUI

// src/services/widget.ts'nin App Group'a JSON metni olarak yazdığı veri (anahtar: "widget").
// Metinler uygulamanın dilinde oradan gelir; burada yalnızca gösterilir.
struct WidgetLabels: Codable {
    var title: String
    var overdue: String
    var open: String
    var waiting: String
    var empty: String
    var lockedTitle: String
    var lockedBody: String
    var lockedCta: String
}

struct WidgetItem: Codable, Identifiable {
    var id: String
    var title: String
    var person: String
    var overdue: Bool
}

struct WidgetPayload: Codable {
    var premium: Bool
    var labels: WidgetLabels
    var overdue: Int
    var open: Int
    var waiting: Int
    var items: [WidgetItem]

    // Uygulama henüz hiç veri yazmadıysa (kurulumdan hemen sonra) gösterilen kilitli görünüm.
    static let fallback = WidgetPayload(
        premium: false,
        labels: WidgetLabels(
            title: "Synvia AI", overdue: "overdue", open: "open", waiting: "waiting", empty: "All clear",
            lockedTitle: "Synvia AI", lockedBody: "Open the app to set up your widget.", lockedCta: "Open"
        ),
        overdue: 0, open: 0, waiting: 0, items: []
    )

    static var sample: WidgetPayload {
        let g = GalleryText.current
        var labels = fallback.labels
        labels.open = g.open
        labels.overdue = g.overdue
        labels.waiting = g.waiting
        var items: [WidgetItem] = []
        for (index, item) in g.items.enumerated() {
            items.append(WidgetItem(id: "\(index)", title: item.0, person: item.1, overdue: index < 2))
        }
        return WidgetPayload(premium: true, labels: labels, overdue: 2, open: 5, waiting: 1, items: items)
    }
}

// Widget galerisi (uygulama verisi yokken) için telefonun diline göre metinler.
struct GalleryText {
    let description: String
    let open: String
    let overdue: String
    let waiting: String
    let items: [(String, String)]

    static var current: GalleryText {
        let code = Locale.current.language.languageCode?.identifier ?? "en"
        return all[code] ?? all["en"]!
    }

    static let all: [String: GalleryText] = [
        "tr": GalleryText(description: "Geciken ve açık takiplerin tek bakışta.", open: "açık", overdue: "gecikmiş", waiting: "bekliyorum",
                          items: [("Satış raporunu gönder", "Ahmet"), ("Sözleşmeyi incele", "Elif"), ("Diş hekimini ara", "")]),
        "en": GalleryText(description: "Overdue and open follow-ups at a glance.", open: "open", overdue: "overdue", waiting: "waiting",
                          items: [("Send the sales report", "James"), ("Review the contract", "Emily"), ("Call the dentist", "")]),
        "de": GalleryText(description: "Überfällige und offene Vorgänge auf einen Blick.", open: "offen", overdue: "überfällig", waiting: "wartend",
                          items: [("Verkaufsbericht senden", "Thomas"), ("Vertrag prüfen", "Anna"), ("Zahnarzt anrufen", "")]),
        "fr": GalleryText(description: "Vos suivis en retard et ouverts en un coup d’œil.", open: "ouverts", overdue: "en retard", waiting: "en attente",
                          items: [("Envoyer le rapport", "Julien"), ("Relire le contrat", "Claire"), ("Appeler le dentiste", "")]),
        "es": GalleryText(description: "Tus seguimientos atrasados y abiertos de un vistazo.", open: "abiertos", overdue: "atrasados", waiting: "esperando",
                          items: [("Enviar el informe", "Carlos"), ("Revisar el contrato", "Lucía"), ("Llamar al dentista", "")]),
        "it": GalleryText(description: "Promemoria in ritardo e aperti a colpo d’occhio.", open: "aperti", overdue: "in ritardo", waiting: "in attesa",
                          items: [("Inviare il report", "Marco"), ("Rivedere il contratto", "Giulia"), ("Chiamare il dentista", "")]),
        "pt": GalleryText(description: "Seus acompanhamentos atrasados e abertos num relance.", open: "abertos", overdue: "atrasados", waiting: "aguardando",
                          items: [("Enviar o relatório", "João"), ("Revisar o contrato", "Ana"), ("Ligar para o dentista", "")]),
        "ru": GalleryText(description: "Просроченные и открытые задачи с первого взгляда.", open: "открыто", overdue: "просрочено", waiting: "жду",
                          items: [("Отправить отчёт", "Алексей"), ("Проверить договор", "Ольга"), ("Позвонить стоматологу", "")]),
        "ar": GalleryText(description: "متابعاتك المتأخرة والمفتوحة بنظرة واحدة.", open: "مفتوحة", overdue: "متأخرة", waiting: "بانتظار",
                          items: [("إرسال تقرير المبيعات", "أحمد"), ("مراجعة العقد", "سارة"), ("الاتصال بطبيب الأسنان", "")]),
        "ja": GalleryText(description: "期限切れと未完了のフォローアップをひと目で。", open: "未完了", overdue: "期限切れ", waiting: "待ち",
                          items: [("売上レポートを送る", "田中"), ("契約書を確認", "佐藤"), ("歯医者に電話", "")]),
        "ko": GalleryText(description: "기한 지난 일과 진행 중인 일을 한눈에.", open: "진행 중", overdue: "기한 지남", waiting: "기다리는 중",
                          items: [("매출 보고서 보내기", "민준"), ("계약서 검토", "지수"), ("치과에 전화", "")]),
        "zh": GalleryText(description: "一眼看清逾期和进行中的跟进事项。", open: "进行中", overdue: "已逾期", waiting: "等待中",
                          items: [("发送销售报告", "王伟"), ("审阅合同", "李娜"), ("给牙医打电话", "")]),
    ]
}

struct SynviaEntry: TimelineEntry {
    let date: Date
    let payload: WidgetPayload
}

struct SynviaProvider: TimelineProvider {
    let appGroup = "group.com.manyaq25.benimyerimetakipet"

    func placeholder(in context: Context) -> SynviaEntry {
        SynviaEntry(date: Date(), payload: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (SynviaEntry) -> Void) {
        // Widget galerisinde örnek veri görünsün.
        completion(SynviaEntry(date: Date(), payload: context.isPreview ? .sample : load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SynviaEntry>) -> Void) {
        // Uygulama her değişiklikte widget'ı yeniler; bu yalnızca "gecikmiş" sayısının
        // uygulama açılmadan da güncel kalması için bir yedek.
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
        completion(Timeline(entries: [SynviaEntry(date: Date(), payload: load())], policy: .after(next)))
    }

    private func load() -> WidgetPayload {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let text = defaults.string(forKey: "widget"),
            let data = text.data(using: .utf8),
            let decoded = try? JSONDecoder().decode(WidgetPayload.self, from: data)
        else {
            return .fallback
        }
        return decoded
    }
}

// Uygulamanın marka renkleri (src/theme ile aynı).
extension Color {
    static let synviaTeal = Color(red: 0.0, green: 0.659, blue: 0.588)       // #00A896
    static let synviaCoral = Color(red: 1.0, green: 0.478, blue: 0.349)      // #FF7A59
    static let synviaRed = Color(red: 0.776, green: 0.157, blue: 0.157)      // #C62828
}

struct LockedView: View {
    let labels: WidgetLabels

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 4) {
                Image(systemName: "lock.fill").font(.caption2)
                Text(labels.title).font(.caption).fontWeight(.semibold)
            }
            .foregroundStyle(Color.synviaTeal)
            Spacer(minLength: 0)
            Text(labels.lockedTitle)
                .font(.subheadline).fontWeight(.bold)
                .lineLimit(2).minimumScaleFactor(0.8)
            Text(labels.lockedBody)
                .font(.caption2).foregroundStyle(.secondary)
                .lineLimit(3).minimumScaleFactor(0.8)
            Spacer(minLength: 0)
            Text(labels.lockedCta)
                .font(.caption).fontWeight(.semibold)
                .foregroundStyle(.white)
                .lineLimit(1).minimumScaleFactor(0.7)
                .padding(.horizontal, 10).padding(.vertical, 5)
                .background(Capsule().fill(Color.synviaTeal))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(alignment: .bottomTrailing) {
            LogoWatermark(size: 92).offset(x: 22, y: 22)
        }
    }
}

// Soluk logo filigranı (sol panel ve küçük widget'ın arka planı).
struct LogoWatermark: View {
    var size: CGFloat

    var body: some View {
        Image("SynviaLogo")
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .opacity(0.16)
            .allowsHitTesting(false)
    }
}

// Widget zemini: sistem rengi üzerine çok hafif teal → mercan geçişi.
struct WidgetBackground: View {
    var body: some View {
        ZStack {
            Color(.systemBackground)
            LinearGradient(
                colors: [Color.synviaTeal.opacity(0.10), Color.synviaCoral.opacity(0.06)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        }
    }
}

struct BrandHeader: View {
    let title: String

    var body: some View {
        HStack(spacing: 4) {
            Image("SynviaLogo").resizable().scaledToFit().frame(width: 14, height: 14)
            Text(title)
                .font(.caption).fontWeight(.bold)
                .foregroundStyle(Color.synviaTeal)
                .lineLimit(1)
        }
    }
}

struct CountsView: View {
    let payload: WidgetPayload

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            BrandHeader(title: payload.labels.title)
            Spacer(minLength: 0)
            if payload.open == 0 {
                Text(payload.labels.empty)
                    .font(.subheadline).fontWeight(.semibold)
                    .lineLimit(2).minimumScaleFactor(0.8)
            } else {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("\(payload.open)").font(.system(size: 36, weight: .heavy, design: .rounded))
                    Text(payload.labels.open).font(.caption).fontWeight(.medium).foregroundStyle(.secondary).lineLimit(1)
                }
                if payload.overdue > 0 {
                    countRow(payload.overdue, payload.labels.overdue, Color.synviaRed)
                }
                if payload.waiting > 0 {
                    countRow(payload.waiting, payload.labels.waiting, Color.synviaTeal)
                }
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background(alignment: .bottomTrailing) {
            LogoWatermark(size: 92).offset(x: 22, y: 22)
        }
    }

    private func countRow(_ count: Int, _ label: String, _ color: Color) -> some View {
        HStack(spacing: 5) {
            Circle().fill(color).frame(width: 7, height: 7)
            Text("\(count) \(label)")
                .font(.caption).fontWeight(.semibold)
                .foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.75)
        }
    }
}

struct ItemsView: View {
    let items: [WidgetItem]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                if index > 0 {
                    Divider().padding(.vertical, 5)
                }
                Link(destination: URL(string: "benim-yerime-takip-et://takip/\(item.id)") ?? URL(string: "benim-yerime-takip-et://")!) {
                    HStack(alignment: .top, spacing: 6) {
                        Circle()
                            .fill(item.overdue ? Color.synviaRed : Color.synviaTeal)
                            .frame(width: 7, height: 7)
                            .padding(.top, 5)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(item.title)
                                .font(.system(size: 13, weight: .semibold))
                                .lineLimit(2)
                                .fixedSize(horizontal: false, vertical: true)
                            if !item.person.isEmpty {
                                Text(item.person)
                                    .font(.caption2).foregroundStyle(.secondary)
                                    .lineLimit(1)
                            }
                        }
                    }
                }
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct SynviaWidgetView: View {
    @Environment(\.widgetFamily) var family
    var entry: SynviaProvider.Entry

    // Uzun başlıklar iki satıra iner; sığması için o zaman iki madde gösterilir.
    private func visibleItems(_ items: [WidgetItem]) -> [WidgetItem] {
        let firstThree = Array(items.prefix(3))
        let hasLong = firstThree.contains { $0.title.count > 26 }
        return Array(firstThree.prefix(hasLong ? 2 : 3))
    }

    var body: some View {
        let payload = entry.payload
        Group {
            if !payload.premium {
                LockedView(labels: payload.labels)
                    .widgetURL(URL(string: "benim-yerime-takip-et://premium"))
            } else if family == .systemMedium && !payload.items.isEmpty {
                HStack(alignment: .top, spacing: 12) {
                    CountsView(payload: payload)
                        .padding(10)
                        .frame(width: 120)
                        .background(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .fill(Color.synviaTeal.opacity(0.10))
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    ItemsView(items: visibleItems(payload.items))
                        .padding(.vertical, 4)
                }
                .widgetURL(URL(string: "benim-yerime-takip-et://"))
            } else {
                CountsView(payload: payload)
                    .widgetURL(URL(string: "benim-yerime-takip-et://"))
            }
        }
    }
}

struct TakipWidget: Widget {
    let kind: String = "TakipWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SynviaProvider()) { entry in
            SynviaWidgetView(entry: entry)
                .containerBackground(for: .widget) { WidgetBackground() }
        }
        .configurationDisplayName("Synvia AI")
        .description(GalleryText.current.description)
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct TakipWidgetBundle: WidgetBundle {
    var body: some Widget {
        TakipWidget()
    }
}
