import type { BrokerEnv } from "../types";
import type {
  KisCredentials,
  KisIntradayChartParams,
  KisIntradayChartResponse,
  KisIntradayChartOutput1,
  KisIntradayChartOutput2,
} from "./types";

const BASE_URLS: Record<BrokerEnv, string> = {
  production: "https://openapi.koreainvestment.com:9443",
  dev: "https://openapivts.koreainvestment.com:29443",
};

interface KisMarketClient {
  getIntradayChart(
    credentials: KisCredentials,
    token: string,
    params: KisIntradayChartParams,
  ): Promise<KisIntradayChartResponse>;
}

interface RawIntradayChartOutput1 {
  prdy_vrss: string;
  prdy_vrss_sign: string;
  prdy_ctrt: string;
  stck_prdy_clpr: string;
  acml_vol: string;
  acml_tr_pbmn: string;
  hts_kor_isnm: string;
  stck_prpr: string;
}

interface RawIntradayChartOutput2 {
  stck_bsop_date: string;
  stck_cntg_hour: string;
  stck_prpr: string;
  stck_oprc: string;
  stck_hgpr: string;
  stck_lwpr: string;
  cntg_vol: string;
  acml_tr_pbmn: string;
}

interface RawIntradayChartResponse {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output1: RawIntradayChartOutput1;
  output2: RawIntradayChartOutput2[];
}

function mapOutput1(raw: RawIntradayChartOutput1): KisIntradayChartOutput1 {
  return {
    prdyVrss: raw.prdy_vrss,
    prdyVrssSign: raw.prdy_vrss_sign,
    prdyCtrt: raw.prdy_ctrt,
    stckPrdyClpr: raw.stck_prdy_clpr,
    acmlVol: raw.acml_vol,
    acmlTrPbmn: raw.acml_tr_pbmn,
    htsKorIsnm: raw.hts_kor_isnm,
    stckPrpr: raw.stck_prpr,
  };
}

function mapOutput2(raw: RawIntradayChartOutput2): KisIntradayChartOutput2 {
  return {
    stckBsopDate: raw.stck_bsop_date,
    stckCntgHour: raw.stck_cntg_hour,
    stckPrpr: raw.stck_prpr,
    stckOprc: raw.stck_oprc,
    stckHgpr: raw.stck_hgpr,
    stckLwpr: raw.stck_lwpr,
    cntgVol: raw.cntg_vol,
    acmlTrPbmn: raw.acml_tr_pbmn,
  };
}

export function createKisMarketClient(env: BrokerEnv): KisMarketClient {
  const baseUrl = BASE_URLS[env];

  return {
    async getIntradayChart(
      credentials: KisCredentials,
      token: string,
      params: KisIntradayChartParams,
    ): Promise<KisIntradayChartResponse> {
      const query = new URLSearchParams({
        FID_COND_MRKT_DIV_CODE: params.marketCode,
        FID_INPUT_ISCD: params.stockCode,
        FID_INPUT_HOUR_1: params.inputHour,
        FID_PW_DATA_INCU_YN: params.includePrevData,
        FID_ETC_CLS_CODE: params.etcClassCode,
      });

      const response = await fetch(
        `${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice?${query}`,
        {
          method: "GET",
          headers: {
            "content-type": "application/json; charset=UTF-8",
            authorization: `Bearer ${token}`,
            appkey: credentials.appkey,
            appsecret: credentials.appsecret,
            tr_id: "FHKST03010200",
            custtype: "P",
          },
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `KIS intraday chart request failed: ${response.status} ${response.statusText}\n${errorBody}`,
        );
      }

      const data: RawIntradayChartResponse = await response.json();

      return {
        rtCd: data.rt_cd,
        msgCd: data.msg_cd,
        msg1: data.msg1,
        output1: mapOutput1(data.output1),
        output2: data.output2.map(mapOutput2),
      };
    },
  };
}
