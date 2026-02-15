ALTER TABLE trade_orders ADD COLUMN market TEXT NOT NULL DEFAULT 'kospi' CHECK (market IN ('kospi', 'kosdaq'));
