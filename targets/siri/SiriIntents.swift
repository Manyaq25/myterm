import AppIntents

// src/services/widget.ts'nin her önemli değişiklikte App Group'a yazdığı,
// önceden hazırlanmış düz metin özetleri okunuyor — burada AI çağrısı veya
// SQLite erişimi yok, sadece uygulamanın zaten hesapladığı metni okuyup Siri'ye
// söylüyoruz (hızlı, offline, güvenilir).
private let appGroup = "group.com.manyaq25.benimyerimetakipet"

private func readSummary(_ key: String) -> String {
    UserDefaults(suiteName: appGroup)?.string(forKey: key)
        ?? "Takip listene şu an ulaşamıyorum, uygulamayı bir kez açıp tekrar dener misin?"
}

struct TodaySummaryIntent: AppIntent {
    static var title: LocalizedStringResource = "Bugün Neyi Unutmamam Gerekiyor?"
    static var description = IntentDescription("Bugün için açık ve gecikmiş takiplerini özetler.")

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let summary = readSummary("siriTodaySummary")
        return .result(dialog: "\(summary)")
    }
}

struct WaitingOnSummaryIntent: AppIntent {
    static var title: LocalizedStringResource = "Kimden Ne Bekliyorum?"
    static var description = IntentDescription("Birinden beklediğin açık takipleri kişi bazında özetler.")

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let summary = readSummary("siriWaitingOnSummary")
        return .result(dialog: "\(summary)")
    }
}

struct PromisedSummaryIntent: AppIntent {
    static var title: LocalizedStringResource = "Kime Ne Söz Verdim?"
    static var description = IntentDescription("Verdiğin açık sözleri kişi bazında özetler.")

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let summary = readSummary("siriPromisedSummary")
        return .result(dialog: "\(summary)")
    }
}

struct TakipShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: TodaySummaryIntent(),
            phrases: [
                "\(.applicationName)'de bugün neyi unutmamam gerekiyor",
                "\(.applicationName) ile bugünkü takiplerimi söyle",
            ],
            shortTitle: "Bugünün Özeti",
            systemImageName: "checklist"
        )
        AppShortcut(
            intent: WaitingOnSummaryIntent(),
            phrases: [
                "\(.applicationName)'de kimden ne bekliyorum",
                "\(.applicationName) ile beklediklerimi söyle",
            ],
            shortTitle: "Beklediklerim",
            systemImageName: "hourglass"
        )
        AppShortcut(
            intent: PromisedSummaryIntent(),
            phrases: [
                "\(.applicationName)'de kime ne söz verdim",
                "\(.applicationName) ile verdiğim sözleri söyle",
            ],
            shortTitle: "Verdiğim Sözler",
            systemImageName: "hand.raised"
        )
    }
}

@main
struct TakipSiriExtension: AppIntentsExtension {
}
