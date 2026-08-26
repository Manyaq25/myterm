export const SCHEMA_VERSION = 4;

export const CREATE_TABLES_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  note TEXT,
  phone TEXT,
  reminderLeadMinutes INTEGER NOT NULL DEFAULT 0,
  lateSuggestionDismissedAt INTEGER,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  personId TEXT,
  dueAt INTEGER,
  remindAt INTEGER,
  source TEXT NOT NULL DEFAULT 'manual',
  confidence REAL,
  notificationId TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  completedAt INTEGER,
  FOREIGN KEY (personId) REFERENCES people(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_dueAt ON follow_ups(dueAt);
CREATE INDEX IF NOT EXISTS idx_follow_ups_personId ON follow_ups(personId);

-- Akıllı hatırlatma önerisiyle eklenen ek (1 gün önce / aynı gün sabah) hatırlatmalar.
CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id TEXT PRIMARY KEY NOT NULL,
  followUpId TEXT NOT NULL,
  notificationId TEXT NOT NULL,
  triggerAt INTEGER NOT NULL,
  kind TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_followUpId ON follow_up_reminders(followUpId);

-- Aynı güne denk gelen ana hatırlatmaları tek bir bildirimde birleştirmek için.
CREATE TABLE IF NOT EXISTS reminder_days (
  day TEXT PRIMARY KEY NOT NULL,
  notificationId TEXT
);
CREATE TABLE IF NOT EXISTS reminder_day_items (
  day TEXT NOT NULL,
  followUpId TEXT NOT NULL,
  PRIMARY KEY (day, followUpId)
);
CREATE INDEX IF NOT EXISTS idx_reminder_day_items_followUpId ON reminder_day_items(followUpId);
`;
