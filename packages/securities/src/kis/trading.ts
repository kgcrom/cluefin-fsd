import type { BrokerEnv } from "../types";
import type { KisCredentials, KisOrderOutput, KisOrderParams, KisOrderResponse } from "./types";

const BASE_URLS: Record<BrokerEnv, string> = {
  production: "https://openapi.koreainvestment.com:9443",
  dev: "https://openapivts.koreainvestment.com:29443",
};

const BUY_TR_IDS: Record<BrokerEnv, string> = {
  production: "TTTC0802U",
  dev: "VTTC0802U",
};

const SELL_TR_IDS: Record<BrokerEnv, string> = {
  production: "TTTC0801U",
  dev: "VTTC0801U",
};

interface KisTradingClient {
  buyOrder(
    credentials: KisCredentials,
    token: string,
    params: KisOrderParams,
  ): Promise<KisOrderResponse>;
  sellOrder(
    credentials: KisCredentials,
    token: string,
    params: KisOrderParams,
  ): Promise<KisOrderResponse>;
}

interface RawOrderOutput {
  KRX_FWDG_ORD_ORGNO: string;
  ODNO: string;
  ORD_TMD: string;
}

interface RawOrderResponse {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output: RawOrderOutput;
}

function mapOutput(raw: RawOrderOutput): KisOrderOutput {
  return {
    krxFwdgOrdOrgno: raw.KRX_FWDG_ORD_ORGNO,
    odno: raw.ODNO,
    ordTmd: raw.ORD_TMD,
  };
}

async function placeOrder(
  baseUrl: string,
  credentials: KisCredentials,
  token: string,
  params: KisOrderParams,
  trId: string,
): Promise<KisOrderResponse> {
  const response = await fetch(`${baseUrl}/uapi/domestic-stock/v1/trading/order-cash`, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=UTF-8",
      authorization: `Bearer ${token}`,
      appkey: credentials.appkey,
      appsecret: credentials.appsecret,
      tr_id: trId,
      custtype: "P",
    },
    body: JSON.stringify({
      CANO: params.accountNo,
      ACNT_PRDT_CD: params.accountProductCode,
      PDNO: params.stockCode,
      ORD_DVSN: params.orderType,
      ORD_QTY: params.quantity,
      ORD_UNPR: params.price,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `KIS order request failed: ${response.status} ${response.statusText}\n${errorBody}`,
    );
  }

  const data: RawOrderResponse = await response.json();

  return {
    rtCd: data.rt_cd,
    msgCd: data.msg_cd,
    msg1: data.msg1,
    output: mapOutput(data.output),
  };
}

export function createKisTradingClient(env: BrokerEnv): KisTradingClient {
  const baseUrl = BASE_URLS[env];

  return {
    async buyOrder(
      credentials: KisCredentials,
      token: string,
      params: KisOrderParams,
    ): Promise<KisOrderResponse> {
      return placeOrder(baseUrl, credentials, token, params, BUY_TR_IDS[env]);
    },

    async sellOrder(
      credentials: KisCredentials,
      token: string,
      params: KisOrderParams,
    ): Promise<KisOrderResponse> {
      return placeOrder(baseUrl, credentials, token, params, SELL_TR_IDS[env]);
    },
  };
}
