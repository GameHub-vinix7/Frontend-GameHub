-- Separate verified Indonesia-region prices from earlier USD experiments.
-- Existing price_history remains untouched to avoid cross-currency contamination.
CREATE TABLE IF NOT EXISTS regional_price_history (
  game_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  observed_at INTEGER NOT NULL,
  current_price REAL NOT NULL CHECK (current_price >= 0),
  original_price REAL NOT NULL CHECK (original_price >= current_price),
  currency TEXT NOT NULL CHECK (currency = 'IDR'),
  country TEXT NOT NULL CHECK (country = 'ID'),
  source TEXT NOT NULL,
  PRIMARY KEY (game_id, store_id, observed_at)
);

CREATE INDEX IF NOT EXISTS idx_regional_price_history
  ON regional_price_history(game_id, store_id, observed_at DESC);
