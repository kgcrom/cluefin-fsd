import type { BrokerEnv } from "../types";
import type { KiwoomBuyOrderParams, KiwoomBuyOrderResponse } from "./types";

const BASE_URLS: Record<BrokerEnv, string> = {
  production: "https://api.kiwoom.com",
  dev: "https://mockapi.kiwoom.com",
};

interface RawBuyOrderResponse {
  ord_no: string;
  dmst_stex_tp: string;
}

interface KiwoomOrderClient {
  buyOrder(token: string, params: KiwoomBuyOrderParams): Promise<KiwoomBuyOrderResponse>;
}

export function createKiwoomOrderClient(env: BrokerEnv): KiwoomOrderClient {
  const baseUrl = BASE_URLS[env];

  return {
    async buyOrder(token: string, params: KiwoomBuyOrderParams): Promise<KiwoomBuyOrderResponse> {
      const body: Record<string, string> = {
        dmst_stex_tp: params.dmstStexTp,
        stk_cd: params.stkCd,
        ord_qty: params.ordQty,
        trde_tp: params.trdeTp,
      };
      if (params.ordUv) {
        body.ord_uv = params.ordUv;
      }
      if (params.condUv) {
        body.cond_uv = params.condUv;
      }

      const response = await fetch(`${baseUrl}/api/dostk/ordr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          authorization: `Bearer ${token}`,
          "api-id": "kt10000",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Kiwoom buy order request failed: ${response.status} ${response.statusText}\n${errorBody}`,
        );
      }

      const data: RawBuyOrderResponse = await response.json();

      return {
        ordNo: data.ord_no ?? "",
        dmstStexTp: data.dmst_stex_tp ?? "",
      };
    },
  };
}
