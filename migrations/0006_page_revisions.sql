CREATE TABLE IF NOT EXISTS page_revisions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  content_json TEXT NOT NULL,
  change_note TEXT,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT,
  restored_from_id INTEGER REFERENCES page_revisions(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_page_revisions_current ON page_revisions(event_id,page_path,id DESC);
CREATE INDEX IF NOT EXISTS idx_page_revisions_history ON page_revisions(event_id,created_at DESC);
PRAGMA optimize;
