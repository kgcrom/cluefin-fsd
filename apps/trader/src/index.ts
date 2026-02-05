import type { OrderBroker } from "@cluefin/cloudflare";
import { createOrderRepository } from "@cluefin/cloudflare";
import {
  type BrokerEnv,
  createKisMarketClient,
  createKisOrderClient,
  createKiwoomMarketClient,
  createKiwoomOrderClient,
  type KisIntradayChartParams,
  type KisOrderParams,
  type KiwoomBuyOrderParams,
  type KiwoomRankParams,
  type KiwoomVolumeSurgeParams,
} from "@cluefin/securities";
import { Hono } from "hono";
import type { Env } from "./bindings";

const app = new Hono<{ Bindings: Env }>();

app.get("/orders", async (c) => {
  const broker = c.req.query("broker") as OrderBroker | undefined;
  if (broker && !["kis", "kiwoom"].includes(broker)) {
    return c.json({ error: 'broker는 "kis" 또는 "kiwoom"이어야 합니다' }, 400);
  }

  const repo = createOrderRepository(c.env.cluefin_fsd_db);
  const orders = await repo.getActiveOrders(broker);
  return c.json(orders);
});

app.get("/orders/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) {
    return c.json({ error: "잘못된 주문 ID입니다" }, 400);
  }

  const repo = createOrderRepository(c.env.cluefin_fsd_db);
  const order = await repo.getOrderById(id);
  if (!order) {
    return c.json({ error: "주문을 찾을 수 없습니다" }, 404);
  }
  return c.json(order);
});

app.get("/kis/intraday-chart", async (c) => {
  const raw = c.env.BROKER_TOKEN_KIS;
  if (!raw) {
    return c.json({ error: "KIS 토큰이 설정되지 않았습니다" }, 401);
  }

  const token = raw;
  const env = c.env.KIS_ENV as BrokerEnv;
  const credentials = {
    appkey: c.env.KIS_APP_KEY,
    appsecret: c.env.KIS_SECRET_KEY,
  };

  const params: KisIntradayChartParams = {
    marketCode: (c.req.query("market_code") ?? "J") as KisIntradayChartParams["marketCode"],
    stockCode: c.req.query("stock_code") ?? "",
    inputHour: c.req.query("input_hour") ?? "",
    includePrevData: c.req.query("include_prev_data") ?? "N",
    etcClassCode: c.req.query("etc_class_code") ?? "",
  };

  console.log("[kis/intraday-chart] params:", JSON.stringify(params));

  try {
    const client = createKisMarketClient(env);
    const result = await client.getIntradayChart(credentials, token, params);
    return c.json(result);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Unknown error" }, 502);
  }
});

app.get("/kiwoom/rank", async (c) => {
  const token = c.env.BROKER_TOKEN_KIWOOM;
  if (!token) {
    return c.json({ error: "Kiwoom 토큰이 설정되지 않았습니다" }, 401);
  }

  const env = c.env.KIWOOM_ENV as BrokerEnv;
  const params: KiwoomRankParams = {
    mrktTp: (c.req.query("mrkt_tp") ?? "000") as KiwoomRankParams["mrktTp"],
    amtQtyTp: (c.req.query("amt_qty_tp") ?? "1") as KiwoomRankParams["amtQtyTp"],
    qryDtTp: (c.req.query("qry_dt_tp") ?? "0") as KiwoomRankParams["qryDtTp"],
    date: c.req.query("date"),
    stexTp: (c.req.query("stex_tp") ?? "1") as KiwoomRankParams["stexTp"],
  };

  console.log("[kiwoom/rank] env:", env, "params:", JSON.stringify(params));

  try {
    const client = createKiwoomMarketClient(env);
    const result = await client.getRank(token, params);
    console.log("[kiwoom/rank] result count:", result.frgOrgnTrdeUpper.length);
    return c.json(result);
  } catch (e) {
    console.error("[kiwoom/rank] error:", e);
    return c.json({ error: e instanceof Error ? e.message : "Unknown error" }, 502);
  }
});

app.get("/kiwoom/volume-surge", async (c) => {
  const token = c.env.BROKER_TOKEN_KIWOOM;
  if (!token) {
    return c.json({ error: "Kiwoom 토큰이 설정되지 않았습니다" }, 401);
  }

  const env = c.env.KIWOOM_ENV as BrokerEnv;
  const params: KiwoomVolumeSurgeParams = {
    mrktTp: (c.req.query("mrkt_tp") ?? "000") as KiwoomVolumeSurgeParams["mrktTp"],
    sortTp: (c.req.query("sort_tp") ?? "1") as KiwoomVolumeSurgeParams["sortTp"],
    tmTp: (c.req.query("tm_tp") ?? "1") as KiwoomVolumeSurgeParams["tmTp"],
    trdeQtyTp: c.req.query("trde_qty_tp") ?? "",
    tm: c.req.query("tm"),
    stkCnd: c.req.query("stk_cnd") ?? "",
    pricTp: c.req.query("pric_tp") ?? "",
    stexTp: (c.req.query("stex_tp") ?? "1") as KiwoomVolumeSurgeParams["stexTp"],
  };

  try {
    const client = createKiwoomMarketClient(env);
    const result = await client.getVolumeSurge(token, params);
    return c.json(result);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Unknown error" }, 502);
  }
});

app.post("/kis/order", async (c) => {
  const token = c.env.BROKER_TOKEN_KIS;
  if (!token) {
    return c.json({ error: "KIS 토큰이 설정되지 않았습니다" }, 401);
  }

  const env = c.env.KIS_ENV as BrokerEnv;
  const credentials = {
    appkey: c.env.KIS_APP_KEY,
    appsecret: c.env.KIS_SECRET_KEY,
  };

  const body = await c.req.json<{
    side: "buy" | "sell";
    stockCode: string;
    orderType: string;
    quantity: string;
    price: string;
    accountNo: string;
    accountProductCode: string;
  }>();

  if (!body.side || !["buy", "sell"].includes(body.side)) {
    return c.json({ error: 'side는 "buy" 또는 "sell"이어야 합니다' }, 400);
  }

  const orderParams: KisOrderParams = {
    accountNo: body.accountNo,
    accountProductCode: body.accountProductCode,
    stockCode: body.stockCode,
    orderType: body.orderType,
    quantity: body.quantity,
    price: body.price,
  };

  // TODO: 시장 데이터 수집 및 매매 판단 로직
  const shouldExecute = true;

  if (!shouldExecute) {
    return c.json({ message: "주문 조건이 충족되지 않았습니다", executed: false });
  }

  try {
    const client = createKisOrderClient(env);
    const result =
      body.side === "buy"
        ? await client.buyOrder(credentials, token, orderParams)
        : await client.sellOrder(credentials, token, orderParams);
    return c.json({ executed: true, result });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Unknown error" }, 502);
  }
});

app.post("/kiwoom/order", async (c) => {
  const token = c.env.BROKER_TOKEN_KIWOOM;
  if (!token) {
    return c.json({ error: "Kiwoom 토큰이 설정되지 않았습니다" }, 401);
  }

  const env = c.env.KIWOOM_ENV as BrokerEnv;

  const body = await c.req.json<{
    side: "buy" | "sell";
    stkCd: string;
    ordQty: string;
    trdeTp: string;
    dmstStexTp: string;
    ordUv?: string;
    condUv?: string;
  }>();

  if (!body.side || !["buy", "sell"].includes(body.side)) {
    return c.json({ error: 'side는 "buy" 또는 "sell"이어야 합니다' }, 400);
  }

  // TODO: 시장 데이터 수집 및 매매 판단 로직
  const shouldExecute = true;

  if (!shouldExecute) {
    return c.json({ message: "주문 조건이 충족되지 않았습니다", executed: false });
  }

  if (body.side === "sell") {
    // TODO: Kiwoom 매도 주문 구현
    return c.json({ error: "Kiwoom 매도 주문은 아직 지원되지 않습니다" }, 501);
  }

  const orderParams: KiwoomBuyOrderParams = {
    stkCd: body.stkCd,
    ordQty: body.ordQty,
    trdeTp: body.trdeTp,
    dmstStexTp: body.dmstStexTp,
    ordUv: body.ordUv,
    condUv: body.condUv,
  };

  try {
    const client = createKiwoomOrderClient(env);
    const result = await client.buyOrder(token, orderParams);
    return c.json({ executed: true, result });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Unknown error" }, 502);
  }
});

import { handleScheduled } from "./cron";

export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
};
