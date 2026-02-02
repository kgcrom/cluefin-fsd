import type { TradeOrder } from "@cluefin/cloudflare";
import { createOrderRepository } from "@cluefin/cloudflare";
import {
  type BrokerEnv,
  createKisTradingClient,
  createKiwoomOrderClient,
} from "@cluefin/securities";
import type { Env } from "./bindings";

function getKstHour(): number {
  const now = new Date();
  const kstOffset = 9 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const kstMinutes = utcMinutes + kstOffset;
  return Math.floor(kstMinutes / 60) % 24;
}

function getKstMinute(): number {
  const now = new Date();
  const kstOffset = 9 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const kstMinutes = utcMinutes + kstOffset;
  return kstMinutes % 60;
}

function isOrderExecutionTime(): boolean {
  const hour = getKstHour();
  const minute = getKstMinute();
  const totalMinutes = hour * 60 + minute;
  // KST 09:10 ~ 15:00
  return totalMinutes >= 9 * 60 + 10 && totalMinutes <= 15 * 60;
}

function isFillCheckTime(): boolean {
  const hour = getKstHour();
  // KST 16:00 ~ 17:59
  return hour >= 16 && hour <= 17;
}

async function executeKisOrder(
  env: Env,
  order: TradeOrder,
  quantity: number,
): Promise<{ brokerOrderId: string; brokerResponse: string }> {
  const kisEnv = env.KIS_ENV as BrokerEnv;
  const credentials = { appkey: env.KIS_APP_KEY, appsecret: env.KIS_SECRET_KEY };
  const client = createKisTradingClient(kisEnv);

  const params = {
    accountNo: env.KIS_ACCOUNT_NO,
    accountProductCode: env.KIS_ACCOUNT_PRODUCT_CODE,
    stockCode: order.stockCode,
    orderType: "00", // 지정가
    quantity: String(quantity),
    price: String(order.referencePrice),
  };

  const result =
    order.side === "buy"
      ? await client.buyOrder(credentials, env.BROKER_TOKEN_KIS, params)
      : await client.sellOrder(credentials, env.BROKER_TOKEN_KIS, params);

  return {
    brokerOrderId: result.output.odno,
    brokerResponse: JSON.stringify(result),
  };
}

async function executeKiwoomOrder(
  env: Env,
  order: TradeOrder,
  quantity: number,
): Promise<{ brokerOrderId: string; brokerResponse: string }> {
  const kiwoomEnv = env.KIWOOM_ENV as BrokerEnv;
  const client = createKiwoomOrderClient(kiwoomEnv);

  if (order.side === "sell") {
    throw new Error("Kiwoom 매도 주문은 아직 지원되지 않습니다");
  }

  const params = {
    stkCd: order.stockCode,
    ordQty: String(quantity),
    trdeTp: "0",
    dmstStexTp: "1",
    ordUv: String(order.referencePrice),
  };

  const result = await client.buyOrder(env.BROKER_TOKEN_KIWOOM, params);

  return {
    brokerOrderId: result.ordNo,
    brokerResponse: JSON.stringify(result),
  };
}

async function handleOrderExecution(env: Env): Promise<void> {
  const repo = createOrderRepository(env.cluefin_fsd_db);
  const orders = await repo.getActiveOrders();

  for (const order of orders) {
    try {
      const requestedQty = await repo.getRequestedQuantity(order.id);
      const remaining = order.quantity - requestedQty;

      if (remaining <= 0) {
        continue;
      }

      const executeOrder = order.broker === "kis" ? executeKisOrder : executeKiwoomOrder;
      const { brokerOrderId, brokerResponse } = await executeOrder(env, order, remaining);

      await repo.createExecution({
        orderId: order.id,
        brokerOrderId,
        requestedQty: remaining,
        requestedPrice: order.referencePrice,
        broker: order.broker,
        brokerResponse,
      });

      if (order.status === "pending") {
        await repo.updateOrderStatus(order.id, "monitoring");
      }
    } catch (e) {
      console.error(
        `[cron] 주문 실행 실패 (order_id=${order.id}):`,
        e instanceof Error ? e.message : e,
      );
    }
  }
}

async function handleFillCheck(env: Env): Promise<void> {
  const repo = createOrderRepository(env.cluefin_fsd_db);
  const executions = await repo.getUnfilledExecutions();

  for (const execution of executions) {
    try {
      // TODO: 증권사 체결 조회 API 호출
      // KIS: 체결 조회 API, Kiwoom: 체결 조회 API
      // 현재는 스텁 처리 — 체결 조회 API 구현 후 연동 필요
      console.log(
        `[cron] 체결 확인 스텁 (execution_id=${execution.id}, broker_order_id=${execution.brokerOrderId})`,
      );
    } catch (e) {
      console.error(
        `[cron] 체결 확인 실패 (execution_id=${execution.id}):`,
        e instanceof Error ? e.message : e,
      );
    }
  }
}

export async function handleScheduled(
  _event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext,
): Promise<void> {
  if (isOrderExecutionTime()) {
    console.log("[cron] 주문 실행 시작");
    ctx.waitUntil(handleOrderExecution(env));
  }

  if (isFillCheckTime()) {
    console.log("[cron] 체결 확인 시작");
    ctx.waitUntil(handleFillCheck(env));
  }
}
