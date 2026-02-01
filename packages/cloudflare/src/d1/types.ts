export type OrderSide = "buy" | "sell";
export type OrderStatus = "pending" | "monitoring" | "executed" | "cancelled";
export type OrderBroker = "kis" | "kiwoom";

export interface TradeOrder {
  id: number;
  stockCode: string;
  stockName: string | null;
  side: OrderSide;
  referencePrice: number;
  quantity: number;
  trailingStopPct: number;
  volumeThreshold: number | null;
  broker: OrderBroker;
  status: OrderStatus;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TradeOrderRow {
  id: number;
  stock_code: string;
  stock_name: string | null;
  side: OrderSide;
  reference_price: number;
  quantity: number;
  trailing_stop_pct: number;
  volume_threshold: number | null;
  broker: OrderBroker;
  status: OrderStatus;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTradeOrderInput {
  stockCode: string;
  stockName?: string;
  side: OrderSide;
  referencePrice: number;
  quantity: number;
  trailingStopPct?: number;
  volumeThreshold?: number;
  broker: OrderBroker;
  memo?: string;
}
