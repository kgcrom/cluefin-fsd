import type { ScheduledEvent } from "@cloudflare/workers-types";
import type { ExecutionStatus, TradeExecution, TradeOrder } from "@cluefin/cloudflare";
import { createOrderRepository } from "@cluefin/cloudflare";
import {
  type BrokerEnv,
  createKisOrderClient,
  createKiwoomOrderClient,
  type KisDailyOrderParams,
  type KiwoomDailyOrderParams,
} from "@cluefin/securities";
import type { Env } from "./bindings";
import { getTodayKst, isFillCheckTime, isOrderExecutionTime } from "./time-utils";
import { getBrokerToken, refreshBrokerToken } from "./token-store";

const TOKEN_REFRESH_CRON = "0 */3 * * *";

async function executeKisOrder(
  env: Env,
  order: TradeOrder,
  quantity: number,
  kisToken: string,
): Promise<{ brokerOrderId: string; brokerResponse: string }> {
  const kisEnv = env.KIS_ENV as BrokerEnv;
  const credentials = { appkey: env.KIS_APP_KEY, appsecret: env.KIS_SECRET_KEY };
  const client = createKisOrderClient(kisEnv);

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
      ? await client.buyOrder(credentials, kisToken, params)
      : await client.sellOrder(credentials, kisToken, params);

  return {
    brokerOrderId: result.output.odno,
    brokerResponse: JSON.stringify(result),
  };
}

async function executeKiwoomOrder(
  env: Env,
  order: TradeOrder,
  quantity: number,
  kiwoomToken: string,
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

  // NOTE: Kiwoom 주문 클라이언트는 토큰만 받는다.
  // apps/trader는 런타임에서 secret을 갱신할 수 없으므로 D1에 저장한 최신 토큰을 사용한다.
  const result = await client.buyOrder(kiwoomToken, params);

  return {
    brokerOrderId: result.ordNo,
    brokerResponse: JSON.stringify(result),
  };
}

export async function handleOrderExecution(env: Env): Promise<void> {
  const repo = createOrderRepository(env.cluefin_fsd_db);
  const orders = await repo.getActiveOrders();

  console.log(`[cron] 활성 주문 ${orders.length}건 조회`);

  const kisToken = await getBrokerToken(env, "kis");
  const kiwoomToken = await getBrokerToken(env, "kiwoom");

  let processedCount = 0;

  for (const order of orders) {
    try {
      console.log(
        `[cron] 주문 처리 시작: order_id=${order.id}, broker=${order.broker}, stock=${order.stockCode}, side=${order.side}`,
      );

      // TODO: 매수 조건식 — 현재가 조회 후 reference_price 대비 조건 충족 여부 판단
      // TODO: 매도 조건식 — 보유 종목의 수익률/손실률 기반 매도 시점 판단

      const requestedQty = await repo.getRequestedQuantity(order.id);
      const remaining = order.quantity - requestedQty;

      if (remaining <= 0) {
        console.log(
          `[cron] 주문 건너뜀: order_id=${order.id}, 사유=잔여수량 없음 (total=${order.quantity}, requested=${requestedQty})`,
        );
        continue;
      }

      let quantity: number;
      if (order.side === "buy") {
        const maxQty = Math.floor(300000 / order.referencePrice);
        quantity = Math.min(remaining, maxQty);
      } else {
        quantity = remaining === 1 ? 1 : Math.floor(remaining / 2);
      }

      // 한주당 30만원이 넘는 주식을 매수하는 경우 발생
      if (quantity <= 0) {
        console.log(
          `[cron] 주문 건너뜀: order_id=${order.id}, 사유=분할수량 0 (referencePrice=${order.referencePrice})`,
        );
        continue;
      }

      console.log(
        `[cron] 분할 수량 계산: order_id=${order.id}, total=${order.quantity}, requested=${requestedQty}, remaining=${remaining}, thisRound=${quantity}`,
      );

      let brokerOrderId: string;
      let brokerResponse: string;

      if (order.broker === "kis") {
        if (!kisToken) throw new Error("KIS 토큰이 설정되지 않았습니다");
        ({ brokerOrderId, brokerResponse } = await executeKisOrder(env, order, quantity, kisToken));
      } else {
        if (!kiwoomToken) throw new Error("Kiwoom 토큰이 설정되지 않았습니다");
        ({ brokerOrderId, brokerResponse } = await executeKiwoomOrder(
          env,
          order,
          quantity,
          kiwoomToken,
        ));
      }

      await repo.createExecution({
        orderId: order.id,
        brokerOrderId,
        requestedQty: quantity,
        requestedPrice: order.referencePrice,
        broker: order.broker,
        brokerResponse,
      });

      console.log(
        `[cron] 주문 실행 성공: order_id=${order.id}, brokerOrderId=${brokerOrderId}, quantity=${quantity}`,
      );
      processedCount++;

      // TODO: trailing stop — 체결 후 고점 대비 trailing_stop_pct 이상 하락 시 매도 주문 생성
      // TODO: loss cut — 매수 평균가 대비 일정 비율 이하 하락 시 즉시 매도 주문 생성

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

  console.log(`[cron] 주문 실행 완료: ${processedCount}/${orders.length}건 처리`);
}

async function checkKisFills(env: Env, executions: TradeExecution[]): Promise<void> {
  if (executions.length === 0) return;

  console.log(`[fillCheck] KIS 체결 확인 시작: ${executions.length}건`);

  const token = await getBrokerToken(env, "kis");
  if (!token) throw new Error("KIS 토큰이 설정되지 않았습니다");

  const kisEnv = env.KIS_ENV as BrokerEnv;
  const credentials = { appkey: env.KIS_APP_KEY, appsecret: env.KIS_SECRET_KEY };
  const client = createKisOrderClient(kisEnv);
  const repo = createOrderRepository(env.cluefin_fsd_db);

  const today = getTodayKst();
  const params: KisDailyOrderParams = {
    accountNo: env.KIS_ACCOUNT_NO,
    accountProductCode: env.KIS_ACCOUNT_PRODUCT_CODE,
    startDate: today,
    endDate: today,
  };

  const response = await client.getDailyOrders(credentials, token, params);

  // Map: broker_order_id -> order data
  const orderMap = new Map(response.output1.map((order) => [order.odno, order]));

  for (const execution of executions) {
    const orderData = orderMap.get(execution.brokerOrderId);

    if (!orderData) {
      console.warn(`[fillCheck] KIS order not found: ${execution.brokerOrderId}`);
      continue;
    }

    const filledQty = Number(orderData.totCcldQty);
    const filledPrice = Number(orderData.avgPrvs);
    const rejectedQty = Number(orderData.rjctQty);

    let status: ExecutionStatus;
    if (rejectedQty > 0 && filledQty === 0) {
      status = "rejected";
    } else if (filledQty === 0) {
      continue; // Still unfilled
    } else if (filledQty < execution.requestedQty) {
      status = "partial";
    } else {
      status = "filled";
    }

    console.log(
      `[fillCheck] KIS 체결 업데이트: execution_id=${execution.id}, status=${status}, filledQty=${filledQty}`,
    );
    await repo.updateExecutionFill(execution.id, filledQty, filledPrice, status);
  }
}

async function checkKiwoomFills(env: Env, executions: TradeExecution[]): Promise<void> {
  if (executions.length === 0) return;

  console.log(`[fillCheck] Kiwoom 체결 확인 시작: ${executions.length}건`);

  const token = await getBrokerToken(env, "kiwoom");
  if (!token) throw new Error("Kiwoom 토큰이 설정되지 않았습니다");

  const kiwoomEnv = env.KIWOOM_ENV as BrokerEnv;
  const client = createKiwoomOrderClient(kiwoomEnv);
  const repo = createOrderRepository(env.cluefin_fsd_db);

  const params: KiwoomDailyOrderParams = {
    qryTp: "0", // 0: 전체
    sellTp: "0", // 0: 전체
    stexTp: "1", // 1: 국내주식
  };

  const response = await client.getDailyOrders(token, params);

  // Map: broker_order_id -> order data
  const orderMap = new Map(response.cntr.map((order) => [order.ordNo, order]));

  for (const execution of executions) {
    const orderData = orderMap.get(execution.brokerOrderId);

    if (!orderData) {
      console.warn(`[fillCheck] Kiwoom order not found: ${execution.brokerOrderId}`);
      continue;
    }

    const filledQty = Number(orderData.cntrQty);
    const filledPrice = Number(orderData.cntrPric);
    const orderStatus = orderData.ordStt;

    let status: ExecutionStatus;
    if (orderStatus.includes("거부") || orderStatus.includes("취소")) {
      status = "rejected";
    } else if (filledQty === 0) {
      continue; // Still unfilled
    } else if (filledQty < execution.requestedQty) {
      status = "partial";
    } else {
      status = "filled";
    }

    console.log(
      `[fillCheck] Kiwoom 체결 업데이트: execution_id=${execution.id}, status=${status}, filledQty=${filledQty}`,
    );
    await repo.updateExecutionFill(execution.id, filledQty, filledPrice, status);
  }
}

export async function handleFillCheck(env: Env): Promise<void> {
  const repo = createOrderRepository(env.cluefin_fsd_db);
  const executions = await repo.getUnfilledExecutions();

  console.log(`[cron] 체결 확인: ${executions.length}개 미체결 주문`);

  if (executions.length === 0) {
    console.log("[cron] 체결 확인 완료: 미체결 주문 없음, 스킵");
    return;
  }

  // Group by broker
  const kisList = executions.filter((e) => e.broker === "kis");
  const kiwoomList = executions.filter((e) => e.broker === "kiwoom");

  // Check fills for each broker, continue even if one fails
  const errors: Error[] = [];

  try {
    await checkKisFills(env, kisList);
  } catch (e) {
    console.error("[fillCheck] KIS 체결 확인 실패:", e instanceof Error ? e.message : e);
    errors.push(e instanceof Error ? e : new Error(String(e)));
  }

  try {
    await checkKiwoomFills(env, kiwoomList);
  } catch (e) {
    console.error("[fillCheck] Kiwoom 체결 확인 실패:", e instanceof Error ? e.message : e);
    errors.push(e instanceof Error ? e : new Error(String(e)));
  }

  // Only throw if both brokers failed
  if (errors.length === 2) {
    throw new Error(`모든 증권사 체결 확인 실패: ${errors.map((e) => e.message).join(", ")}`);
  }

  console.log("[cron] 체결 확인 완료");
}

export async function handleScheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext,
): Promise<void> {
  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const runOrder = isOrderExecutionTime();
  const runFill = isFillCheckTime();

  console.log(`[cron] 스케줄 트리거: ${now}, 주문실행=${runOrder}, 체결확인=${runFill}`);

  if (event.cron === TOKEN_REFRESH_CRON) {
    console.log("[cron] 토큰 갱신 시작");
    ctx.waitUntil(
      (async () => {
        const results = await Promise.allSettled([
          refreshBrokerToken(env, "kis"),
          refreshBrokerToken(env, "kiwoom"),
        ]);
        const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
        if (failed.length > 0) {
          console.error("[cron] 토큰 갱신 실패:", failed.map((f) => String(f.reason)).join("\n"));
        } else {
          console.log("[cron] 토큰 갱신 완료");
        }
      })(),
    );
  }

  if (runOrder) {
    console.log("[cron] 주문 실행 시작");
    ctx.waitUntil(handleOrderExecution(env));
  }

  if (runFill) {
    console.log("[cron] 체결 확인 시작");
    ctx.waitUntil(handleFillCheck(env));
  }

  if (!runOrder && !runFill) {
    console.log("[cron] 주문 실행/체결 확인 시간이 아님, 스킵");
  }
}
