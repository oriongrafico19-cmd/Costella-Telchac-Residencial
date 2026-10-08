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


CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  cta_id TEXT,
  cta_label TEXT,
  section_id TEXT,
  section_label TEXT,
  step INTEGER,
  qualification TEXT,
  compatible_count INTEGER,
  data_json TEXT DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
