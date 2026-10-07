CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  email TEXT,
  project_id TEXT NOT NULL,
  source TEXT,
  qualification TEXT NOT NULL,
  compatible_count INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  budget TEXT,
  interest TEXT,
  answers_json TEXT,
  notes TEXT DEFAULT '',
  stage_id TEXT DEFAULT 'nuevo'
);
CREATE INDEX IF NOT EXISTS idx_leads_qualification ON leads(qualification);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON leads(stage_id);
