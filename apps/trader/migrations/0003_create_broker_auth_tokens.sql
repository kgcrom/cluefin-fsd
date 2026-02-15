CREATE TABLE IF NOT EXISTS broker_auth_tokens (
  broker TEXT PRIMARY KEY, -- "kis" | "kiwoom"
  token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  expires_at TEXT NOT NULL, -- ISO 8601 string
  updated_at TEXT NOT NULL  -- ISO 8601 string
);
