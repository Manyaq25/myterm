import WidgetKit
import SwiftUI

// src/services/widget.ts'nin ExtensionStorage ile yazdığı özet ile birebir
// aynı alan adları (App Group üzerinden JSON olarak paylaşılıyor).
struct SummaryData: Codable {
    var critical: Int
    var total: Int
    var waitingOn: Int
}

struct SummaryEntry: TimelineEntry {
    let date: Date
    let summary: SummaryData
}

struct SummaryProvider: TimelineProvider {
    let appGroup = "group.com.manyaq25.benimyerimetakipet"

    func placeholder(in context: Context) -> SummaryEntry {
        SummaryEntry(date: Date(), summary: SummaryData(critical: 2, total: 5, waitingOn: 3))
    }

    func getSnapshot(in context: Context, completion: @escaping (SummaryEntry) -> Void) {
        completion(SummaryEntry(date: Date(), summary: loadSummary()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SummaryEntry>) -> Void) {
        let entry = SummaryEntry(date: Date(), summary: loadSummary())
        // Uygulama her önemli değişiklikte reloadWidget() çağırıyor; bu zaman
        // çizelgesi sadece uygulama hiç açılmasa bile widget'ın bayatlamamasını
        // sağlayan bir yedek.
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadSummary() -> SummaryData {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let data = defaults.data(forKey: "summary"),
            let decoded = try? JSONDecoder().decode(SummaryData.self, from: data)
        else {
            return SummaryData(critical: 0, total: 0, waitingOn: 0)
        }
        return decoded
    }
}

struct TakipWidgetView: View {
    var entry: SummaryProvider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Bugün")
                .font(.caption)
                .foregroundStyle(.secondary)

            Spacer()

            if entry.summary.total == 0 {
                Text("Takip listen temiz 🎉")
                    .font(.subheadline)
                    .fontWeight(.semibold)
            } else {
                VStack(alignment: .leading, spacing: 4) {
                    if entry.summary.critical > 0 {
                        row(count: entry.summary.critical, label: "kritik", color: .red)
                    }
                    row(count: entry.summary.total, label: "takip", color: .blue)
                    if entry.summary.waitingOn > 0 {
                        row(count: entry.summary.waitingOn, label: "kişiden cevap bekleniyor", color: .green)
                    }
                }
            }

            Spacer()
        }
        .padding()
        .widgetURL(URL(string: "benim-yerime-takip-et://"))
    }

    private func row(count: Int, label: String, color: Color) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 4) {
            Text("\(count)")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
    }
}

struct TakipWidget: Widget {
    let kind: String = "TakipWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SummaryProvider()) { entry in
            TakipWidgetView(entry: entry)
                .containerBackground(.background, for: .widget)
        }
        .configurationDisplayName("Benim Yerime Takip Et")
        .description("Bugünün takip özeti: kritik, toplam ve kişiden beklenen madde sayısı.")
        .supportedFamilies([.systemSmall])
    }
}

@main
struct TakipWidgetBundle: WidgetBundle {
    var body: some Widget {
        TakipWidget()
    }
}
