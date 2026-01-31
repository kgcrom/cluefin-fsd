import {
  type BrokerEnv,
  createKisMarketClient,
  type KisIntradayChartParams,
} from "@cluefin/securities";
import { Hono } from "hono";
import type { Env } from "./bindings";

const app = new Hono<{ Bindings: Env }>();

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

export default app;
