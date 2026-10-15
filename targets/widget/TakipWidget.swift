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

    static let sample = WidgetPayload(
        premium: true,
        labels: fallback.labels,
        overdue: 2, open: 5, waiting: 1,
        items: [
            WidgetItem(id: "1", title: "Send the sales report", person: "James", overdue: true),
            WidgetItem(id: "2", title: "Review the contract", person: "Emily", overdue: true),
            WidgetItem(id: "3", title: "Call the dentist", person: "", overdue: false)
        ]
    )
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
    }
}

struct CountsView: View {
    let payload: WidgetPayload

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(payload.labels.title)
                .font(.caption).fontWeight(.semibold)
                .foregroundStyle(Color.synviaTeal)
            Spacer(minLength: 0)
            if payload.open == 0 {
                Text(payload.labels.empty)
                    .font(.subheadline).fontWeight(.semibold)
                    .lineLimit(2).minimumScaleFactor(0.8)
            } else {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("\(payload.open)").font(.system(size: 34, weight: .bold, design: .rounded))
                    Text(payload.labels.open).font(.caption).foregroundStyle(.secondary).lineLimit(1)
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
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func countRow(_ count: Int, _ label: String, _ color: Color) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 6, height: 6)
            Text("\(count) \(label)")
                .font(.caption).fontWeight(.medium)
                .foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.8)
        }
    }
}

struct ItemsView: View {
    let items: [WidgetItem]

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            ForEach(items) { item in
                Link(destination: URL(string: "benim-yerime-takip-et://takip/\(item.id)") ?? URL(string: "benim-yerime-takip-et://")!) {
                    HStack(alignment: .top, spacing: 6) {
                        Circle()
                            .fill(item.overdue ? Color.synviaRed : Color.synviaTeal)
                            .frame(width: 6, height: 6)
                            .padding(.top, 5)
                        VStack(alignment: .leading, spacing: 0) {
                            Text(item.title)
                                .font(.caption).fontWeight(.semibold)
                                .lineLimit(1)
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

    var body: some View {
        let payload = entry.payload
        Group {
            if !payload.premium {
                LockedView(labels: payload.labels)
                    .widgetURL(URL(string: "benim-yerime-takip-et://premium"))
            } else if family == .systemMedium && !payload.items.isEmpty {
                HStack(alignment: .top, spacing: 12) {
                    CountsView(payload: payload).frame(width: 110)
                    ItemsView(items: Array(payload.items.prefix(3)))
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
                .containerBackground(.background, for: .widget)
        }
        .configurationDisplayName("Synvia AI")
        .description("Overdue and open follow-ups at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct TakipWidgetBundle: WidgetBundle {
    var body: some Widget {
        TakipWidget()
    }
}
