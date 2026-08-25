export const SCHEMA_VERSION = 2;

export const CREATE_TABLES_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  note TEXT,
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
`;
