import type { OrderBroker, OrderStatus, TradeOrder, TradeOrderRow } from "./types";

function toTradeOrder(row: TradeOrderRow): TradeOrder {
  return {
    id: row.id,
    stockCode: row.stock_code,
    stockName: row.stock_name,
    side: row.side,
    referencePrice: row.reference_price,
    quantity: row.quantity,
    trailingStopPct: row.trailing_stop_pct,
    volumeThreshold: row.volume_threshold,
    broker: row.broker,
    status: row.status,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createOrderRepository(db: D1Database) {
  return {
    async getActiveOrders(broker?: OrderBroker): Promise<TradeOrder[]> {
      const activeStatuses = ["pending", "monitoring"];
      let stmt: D1PreparedStatement;

      if (broker) {
        stmt = db
          .prepare(
            "SELECT * FROM trade_orders WHERE status IN (?, ?) AND broker = ? ORDER BY created_at DESC",
          )
          .bind(activeStatuses[0], activeStatuses[1], broker);
      } else {
        stmt = db
          .prepare("SELECT * FROM trade_orders WHERE status IN (?, ?) ORDER BY created_at DESC")
          .bind(activeStatuses[0], activeStatuses[1]);
      }

      const result = await stmt.all<TradeOrderRow>();
      return result.results.map(toTradeOrder);
    },

    async getOrderById(id: number): Promise<TradeOrder | null> {
      const result = await db
        .prepare("SELECT * FROM trade_orders WHERE id = ?")
        .bind(id)
        .first<TradeOrderRow>();

      return result ? toTradeOrder(result) : null;
    },

    async updateOrderStatus(id: number, status: OrderStatus): Promise<void> {
      await db
        .prepare("UPDATE trade_orders SET status = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(status, id)
        .run();
    },
  };
}
