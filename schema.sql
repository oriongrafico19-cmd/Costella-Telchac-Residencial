CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  project_id TEXT NOT NULL,
  source TEXT,
  qualification TEXT NOT NULL,
  compatible_count INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  name TEXT,
  phone TEXT,
  email TEXT,
  budget TEXT,
  interest TEXT,
  answers_json TEXT,
  notes TEXT DEFAULT '',
  stage_id TEXT DEFAULT 'nuevo'
);
CREATE INDEX IF NOT EXISTS idx_leads_qualification ON leads(qualification);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
