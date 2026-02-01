CREATE TABLE trade_orders (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_code        TEXT    NOT NULL,
    stock_name        TEXT,
    side              TEXT    NOT NULL CHECK (side IN ('buy', 'sell')),
    reference_price   INTEGER NOT NULL,
    quantity          INTEGER NOT NULL,
    trailing_stop_pct REAL    NOT NULL DEFAULT 3.0,
    volume_threshold  INTEGER,
    broker            TEXT    NOT NULL CHECK (broker IN ('kis', 'kiwoom')),
    status            TEXT    NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'monitoring', 'executed', 'cancelled')),
    memo              TEXT,
    created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_trade_orders_status ON trade_orders(status);
CREATE INDEX idx_trade_orders_broker_status ON trade_orders(broker, status);
