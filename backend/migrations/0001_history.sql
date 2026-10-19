CREATE TABLE IF NOT EXISTS price_history (
  game_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  observed_at INTEGER NOT NULL,
  current_price REAL NOT NULL CHECK (current_price >= 0),
  original_price REAL NOT NULL CHECK (original_price >= current_price),
  currency TEXT NOT NULL CHECK (currency = 'USD'),
  source TEXT NOT NULL CHECK (source = 'CheapShark'),
  PRIMARY KEY (game_id, store_id, observed_at)
);

CREATE INDEX IF NOT EXISTS idx_price_history_lookup
  ON price_history (game_id, store_id, observed_at DESC);
