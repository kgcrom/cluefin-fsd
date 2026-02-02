import type {
  CreateTradeExecutionInput,
  ExecutionStatus,
  OrderBroker,
  OrderStatus,
  TradeExecution,
  TradeExecutionRow,
  TradeOrder,
  TradeOrderRow,
} from "./types";

function toTradeExecution(row: TradeExecutionRow): TradeExecution {
  return {
    id: row.id,
    orderId: row.order_id,
    brokerOrderId: row.broker_order_id,
    requestedQty: row.requested_qty,
    requestedPrice: row.requested_price,
    filledQty: row.filled_qty,
    filledPrice: row.filled_price,
    status: row.status,
    broker: row.broker,
    brokerResponse: row.broker_response,
    orderedAt: row.ordered_at,
    filledAt: row.filled_at,
  };
}

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

    async getRequestedQuantity(orderId: number): Promise<number> {
      const result = await db
        .prepare(
          "SELECT COALESCE(SUM(requested_qty), 0) as total FROM trade_executions WHERE order_id = ? AND status != 'rejected'",
        )
        .bind(orderId)
        .first<{ total: number }>();

      return result?.total ?? 0;
    },

    async createExecution(input: CreateTradeExecutionInput): Promise<TradeExecution> {
      const result = await db
        .prepare(
          `INSERT INTO trade_executions (order_id, broker_order_id, requested_qty, requested_price, broker, broker_response)
           VALUES (?, ?, ?, ?, ?, ?)
           RETURNING *`,
        )
        .bind(
          input.orderId,
          input.brokerOrderId,
          input.requestedQty,
          input.requestedPrice,
          input.broker,
          input.brokerResponse ?? null,
        )
        .first<TradeExecutionRow>();

      if (!result) {
        throw new Error("Failed to create execution");
      }
      return toTradeExecution(result);
    },

    async getUnfilledExecutions(broker?: OrderBroker): Promise<TradeExecution[]> {
      let stmt: D1PreparedStatement;

      if (broker) {
        stmt = db
          .prepare(
            "SELECT * FROM trade_executions WHERE status = 'ordered' AND broker = ? ORDER BY ordered_at ASC",
          )
          .bind(broker);
      } else {
        stmt = db.prepare(
          "SELECT * FROM trade_executions WHERE status = 'ordered' ORDER BY ordered_at ASC",
        );
      }

      const result = await stmt.all<TradeExecutionRow>();
      return result.results.map(toTradeExecution);
    },

    async updateExecutionFill(
      id: number,
      filledQty: number,
      filledPrice: number,
      status: ExecutionStatus,
    ): Promise<void> {
      await db
        .prepare(
          "UPDATE trade_executions SET filled_qty = ?, filled_price = ?, status = ?, filled_at = datetime('now') WHERE id = ?",
        )
        .bind(filledQty, filledPrice, status, id)
        .run();
    },
  };
}
