CREATE TABLE trade_executions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id         INTEGER NOT NULL REFERENCES trade_orders(id),
    broker_order_id  TEXT    NOT NULL,
    requested_qty    INTEGER NOT NULL,
    requested_price  INTEGER NOT NULL,
    filled_qty       INTEGER,
    filled_price     INTEGER,
    status           TEXT    NOT NULL DEFAULT 'ordered'
                     CHECK (status IN ('ordered', 'filled', 'partial', 'rejected')),
    broker           TEXT    NOT NULL CHECK (broker IN ('kis', 'kiwoom')),
    broker_response  TEXT,
    ordered_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    filled_at        TEXT
);

CREATE INDEX idx_trade_executions_order_id ON trade_executions(order_id);
CREATE INDEX idx_trade_executions_status ON trade_executions(status);
