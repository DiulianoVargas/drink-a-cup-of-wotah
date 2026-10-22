import type { SqlDb } from './sqlDb';

// Schema v1 — data-model.md §2. Append new entries; never edit a shipped migration.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE profile (
    id                    INTEGER PRIMARY KEY CHECK (id = 1),
    weight_kg             INTEGER NOT NULL CHECK (weight_kg BETWEEN 30 AND 250),
    daily_goal_ml         INTEGER NOT NULL CHECK (daily_goal_ml BETWEEN 500 AND 6000 AND daily_goal_ml % 250 = 0),
    wake_minutes          INTEGER NOT NULL CHECK (wake_minutes BETWEEN 0 AND 1439),
    sleep_minutes         INTEGER NOT NULL CHECK (sleep_minutes BETWEEN 0 AND 1439),
    reminders_enabled     INTEGER NOT NULL DEFAULT 1,
    onboarding_completed  INTEGER NOT NULL DEFAULT 0,
    updated_at            INTEGER NOT NULL
  );

  CREATE TABLE day (
    day_key     TEXT PRIMARY KEY,
    goal_ml     INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE sip (
    id           TEXT PRIMARY KEY,
    day_key      TEXT NOT NULL REFERENCES day(day_key),
    amount_ml    INTEGER NOT NULL DEFAULT 250,
    occurred_at  INTEGER NOT NULL,
    source       TEXT NOT NULL,
    undone_at    INTEGER
  );
  CREATE INDEX sip_day ON sip(day_key, occurred_at);

  CREATE TABLE processed_event (
    event_key     TEXT PRIMARY KEY,
    processed_at  INTEGER NOT NULL
  );

  CREATE TABLE scheduled_reminder (
    notification_id  TEXT PRIMARY KEY,
    day_key          TEXT NOT NULL,
    fire_at          INTEGER NOT NULL
  );
  `,
];

export function migrate(db: SqlDb): void {
  const current = db.getFirst<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
  for (let version = current; version < MIGRATIONS.length; version++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[version]);
      db.exec(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
