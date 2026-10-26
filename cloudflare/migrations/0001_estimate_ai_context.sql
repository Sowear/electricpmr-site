CREATE TABLE IF NOT EXISTS estimate_ai_context (
  id TEXT PRIMARY KEY,
  estimate_id TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  inspection_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES app_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_estimate_ai_context_estimate_id
  ON estimate_ai_context (estimate_id);
