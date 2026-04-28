PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  immutable INTEGER NOT NULL DEFAULT 0,
  assigned_by TEXT,
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, role),
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT DEFAULT 'website',
  address TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  ip_address TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'request_form',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT,
  address TEXT,
  request_id TEXT,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  client_address TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS project_objects (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  object_id TEXT,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  payout_type TEXT NOT NULL DEFAULT 'percent_profit',
  fixed_amount REAL NOT NULL DEFAULT 0,
  percent_share REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (project_id, object_id, user_id, role),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (object_id) REFERENCES project_objects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS company_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RUB_PMR',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estimates (
  id TEXT PRIMARY KEY,
  estimate_number TEXT NOT NULL UNIQUE,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  request_id TEXT,
  project_id TEXT,
  object_id TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  client_comment TEXT,
  locked INTEGER NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RUB_PMR',
  exchange_rate REAL NOT NULL DEFAULT 1,
  global_discount_pct REAL NOT NULL DEFAULT 0,
  global_discount_amount REAL NOT NULL DEFAULT 0,
  global_tax_pct REAL NOT NULL DEFAULT 0,
  extra_fees REAL NOT NULL DEFAULT 0,
  extra_fees_description TEXT,
  deposit_pct REAL NOT NULL DEFAULT 0,
  deposit_amount REAL NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_recipient TEXT,
  prepayment_confirmed INTEGER NOT NULL DEFAULT 0,
  prepayment_confirmed_at TEXT,
  prepayment_confirmed_by TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  balance_due REAL NOT NULL DEFAULT 0,
  valid_until TEXT,
  payment_due_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT,
  viewed_at TEXT,
  approved_at TEXT,
  public_token TEXT UNIQUE,
  pdf_url TEXT,
  created_by TEXT,
  notes TEXT,
  crm_lead_id TEXT,
  crm_synced_at TEXT,
  snapshot_threshold_rule TEXT NOT NULL DEFAULT 'deposit',
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (object_id) REFERENCES project_objects(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES app_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS estimate_line_items (
  id TEXT PRIMARY KEY,
  estimate_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  item_type TEXT NOT NULL DEFAULT 'service',
  item_code TEXT,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  labor_hours REAL NOT NULL DEFAULT 0,
  labor_rate REAL NOT NULL DEFAULT 0,
  cost_price REAL NOT NULL DEFAULT 0,
  markup_pct REAL NOT NULL DEFAULT 0,
  discount_pct REAL NOT NULL DEFAULT 0,
  tax_pct REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL DEFAULT 0,
  catalog_item_id TEXT,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
  FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  base_price REAL NOT NULL DEFAULT 0,
  market_min REAL,
  market_max REAL,
  category TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  synonyms TEXT NOT NULL DEFAULT '[]',
  complexity TEXT NOT NULL DEFAULT 'low',
  popularity_score INTEGER NOT NULL DEFAULT 0,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  calc_default TEXT,
  special_type TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES app_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS estimate_history (
  id TEXT PRIMARY KEY,
  estimate_id TEXT NOT NULL,
  action TEXT NOT NULL,
  changed_by TEXT,
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES app_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS estimate_send_log (
  id TEXT PRIMARY KEY,
  estimate_id TEXT NOT NULL,
  sent_to_email TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  author_id TEXT,
  author_role TEXT,
  note_type TEXT NOT NULL DEFAULT 'internal_note',
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  estimate_id TEXT NOT NULL,
  project_id TEXT,
  object_id TEXT,
  account_id TEXT,
  amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RUB_PMR',
  method TEXT,
  recipient TEXT,
  reference TEXT,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  verified INTEGER NOT NULL DEFAULT 0,
  verified_by TEXT,
  fees REAL NOT NULL DEFAULT 0,
  gross_amount REAL NOT NULL DEFAULT 0,
  net_amount REAL NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TEXT,
  confirmed_by TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (object_id) REFERENCES project_objects(id) ON DELETE SET NULL,
  FOREIGN KEY (account_id) REFERENCES company_accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS finance_entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RUB_PMR',
  source TEXT NOT NULL DEFAULT 'manual',
  description TEXT,
  estimate_id TEXT,
  payment_id TEXT,
  payout_id TEXT,
  project_id TEXT,
  object_id TEXT,
  fees REAL NOT NULL DEFAULT 0,
  gross_amount REAL NOT NULL DEFAULT 0,
  net_amount REAL NOT NULL DEFAULT 0,
  converted_amount REAL,
  exchange_rate REAL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  receipt_url TEXT,
  reason TEXT,
  approved_by TEXT,
  requires_approval INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE SET NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  FOREIGN KEY (payout_id) REFERENCES employee_payouts(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (object_id) REFERENCES project_objects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT,
  message TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'unread',
  link TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profit_snapshots (
  id TEXT PRIMARY KEY,
  object_id TEXT,
  project_id TEXT,
  revenue REAL NOT NULL DEFAULT 0,
  expenses REAL NOT NULL DEFAULT 0,
  net_profit REAL NOT NULL DEFAULT 0,
  reserve_amount REAL NOT NULL DEFAULT 0,
  distributable_amount REAL NOT NULL DEFAULT 0,
  period_start TEXT,
  period_end TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  locked INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (object_id) REFERENCES project_objects(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS employee_payouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  object_id TEXT,
  snapshot_id TEXT,
  amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TEXT,
  reference TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (object_id) REFERENCES project_objects(id) ON DELETE SET NULL,
  FOREIGN KEY (snapshot_id) REFERENCES profit_snapshots(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS estimate_participants (
  id TEXT PRIMARY KEY,
  estimate_id TEXT NOT NULL,
  project_member_id TEXT,
  user_id TEXT NOT NULL,
  object_id TEXT,
  role TEXT NOT NULL,
  payout_type TEXT NOT NULL,
  percent_share REAL NOT NULL DEFAULT 0,
  fixed_amount REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (estimate_id, user_id, role),
  FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
  FOREIGN KEY (project_member_id) REFERENCES project_members(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
  FOREIGN KEY (object_id) REFERENCES project_objects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS finance_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  reserve_percent REAL NOT NULL DEFAULT 10,
  auto_lock_snapshot INTEGER NOT NULL DEFAULT 1,
  auto_create_payouts INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_examples (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  before_image_url TEXT NOT NULL,
  after_image_url TEXT NOT NULL,
  category TEXT,
  tags TEXT,
  city TEXT,
  is_published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  FOREIGN KEY (created_by) REFERENCES app_users(id) ON DELETE SET NULL
);

INSERT OR IGNORE INTO finance_settings (
  id,
  reserve_percent,
  auto_lock_snapshot,
  auto_create_payouts
) VALUES (1, 10, 1, 1);

CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests (user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests (status);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_action ON rate_limits (ip_address, action_type, created_at);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at);
CREATE INDEX IF NOT EXISTS idx_project_objects_project_id ON project_objects (project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_object ON project_members (project_id, object_id);
CREATE INDEX IF NOT EXISTS idx_estimates_project_object ON estimates (project_id, object_id);
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_estimate_id ON estimate_line_items (estimate_id, position);
CREATE INDEX IF NOT EXISTS idx_catalog_items_category ON catalog_items (category, is_hidden);
CREATE INDEX IF NOT EXISTS idx_payments_estimate_status ON payments (estimate_id, status);
CREATE INDEX IF NOT EXISTS idx_finance_entries_project_type ON finance_entries (project_id, object_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications (user_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_employee_payouts_project_status ON employee_payouts (project_id, status);
