import type { BrokerEnv } from "../types";
import type {
  KisCredentials,
  KisIntradayChartOutput1,
  KisIntradayChartOutput2,
  KisIntradayChartParams,
  KisIntradayChartResponse,
  KisStockPriceOutput,
  KisStockPriceParams,
  KisStockPriceResponse,
} from "./types";

const BASE_URLS: Record<BrokerEnv, string> = {
  prod: "https://openapi.koreainvestment.com:9443",
  dev: "https://openapivts.koreainvestment.com:29443",
};

interface KisMarketClient {
  getIntradayChart(
    credentials: KisCredentials,
    token: string,
    params: KisIntradayChartParams,
  ): Promise<KisIntradayChartResponse>;
  getStockPrice(
    credentials: KisCredentials,
    token: string,
    params: KisStockPriceParams,
  ): Promise<KisStockPriceResponse>;
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

interface RawStockPriceOutput {
  iscd_stat_cls_code: string;
  marg_rate: string;
  rprs_mrkt_kor_name: string;
  new_hgpr_lwpr_cls_code: string;
  bstp_kor_isnm: string;
  temp_stop_yn: string;
  oprc_rang_cont_yn: string;
  clpr_rang_cont_yn: string;
  crdt_able_yn: string;
  grmn_rate_cls_code: string;
  elw_pblc_yn: string;
  stck_prpr: string;
  prdy_vrss: string;
  prdy_vrss_sign: string;
  prdy_ctrt: string;
  acml_tr_pbmn: string;
  acml_vol: string;
  prdy_vrss_vol_rate: string;
  stck_oprc: string;
  stck_hgpr: string;
  stck_lwpr: string;
  stck_mxpr: string;
  stck_llam: string;
  stck_sdpr: string;
  wghn_avrg_stck_prc: string;
  hts_frgn_ehrt: string;
  frgn_ntby_qty: string;
  pgtr_ntby_qty: string;
  pvt_scnd_dmrs_prc: string;
  pvt_frst_dmrs_prc: string;
  pvt_pont_val: string;
  pvt_frst_dmsp_prc: string;
  pvt_scnd_dmsp_prc: string;
  dmrs_val: string;
  dmsp_val: string;
  cpfn: string;
  rstc_wdth_prc: string;
  stck_fcam: string;
  stck_sspr: string;
  aspr_unit: string;
  hts_deal_qty_unit_val: string;
  lstn_stcn: string;
  hts_avls: string;
  per: string;
  pbr: string;
  stac_month: string;
  vol_tnrt: string;
  eps: string;
  bps: string;
  d250_hgpr: string;
  d250_hgpr_date: string;
  d250_hgpr_vrss_prpr_rate: string;
  d250_lwpr: string;
  d250_lwpr_date: string;
  d250_lwpr_vrss_prpr_rate: string;
  stck_dryy_hgpr: string;
  dryy_hgpr_vrss_prpr_rate: string;
  dryy_hgpr_date: string;
  stck_dryy_lwpr: string;
  dryy_lwpr_vrss_prpr_rate: string;
  dryy_lwpr_date: string;
  w52_hgpr: string;
  w52_hgpr_vrss_prpr_ctrt: string;
  w52_hgpr_date: string;
  w52_lwpr: string;
  w52_lwpr_vrss_prpr_ctrt: string;
  w52_lwpr_date: string;
  whol_loan_rmnd_rate: string;
  ssts_yn: string;
  stck_shrn_iscd: string;
  fcam_cnnm: string;
  cpfn_cnnm: string;
  apprch_rate: string;
  frgn_hldn_qty: string;
  vi_cls_code: string;
  ovtm_vi_cls_code: string;
  last_ssts_cntg_qty: string;
  invt_caful_yn: string;
  mrkt_warn_cls_code: string;
  short_over_yn: string;
  sltr_yn: string;
  mang_issu_cls_code: string;
}

interface RawStockPriceResponse {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output: RawStockPriceOutput;
}

function mapStockPriceOutput(raw: RawStockPriceOutput): KisStockPriceOutput {
  return {
    iscdStatClsCode: raw.iscd_stat_cls_code,
    margRate: raw.marg_rate,
    rprsMrktKorName: raw.rprs_mrkt_kor_name,
    newHgprLwprClsCode: raw.new_hgpr_lwpr_cls_code,
    bstpKorIsnm: raw.bstp_kor_isnm,
    tempStopYn: raw.temp_stop_yn,
    oprcRangContYn: raw.oprc_rang_cont_yn,
    clprRangContYn: raw.clpr_rang_cont_yn,
    crdtAbleYn: raw.crdt_able_yn,
    grmnRateClsCode: raw.grmn_rate_cls_code,
    elwPblcYn: raw.elw_pblc_yn,
    stckPrpr: raw.stck_prpr,
    prdyVrss: raw.prdy_vrss,
    prdyVrssSign: raw.prdy_vrss_sign,
    prdyCtrt: raw.prdy_ctrt,
    acmlTrPbmn: raw.acml_tr_pbmn,
    acmlVol: raw.acml_vol,
    prdyVrssVolRate: raw.prdy_vrss_vol_rate,
    stckOprc: raw.stck_oprc,
    stckHgpr: raw.stck_hgpr,
    stckLwpr: raw.stck_lwpr,
    stckMxpr: raw.stck_mxpr,
    stckLlam: raw.stck_llam,
    stckSdpr: raw.stck_sdpr,
    wghnAvrgStckPrc: raw.wghn_avrg_stck_prc,
    htsFrgnEhrt: raw.hts_frgn_ehrt,
    frgnNtbyQty: raw.frgn_ntby_qty,
    pgtrNtbyQty: raw.pgtr_ntby_qty,
    pvtScndDmrsPrc: raw.pvt_scnd_dmrs_prc,
    pvtFrstDmrsPrc: raw.pvt_frst_dmrs_prc,
    pvtPontVal: raw.pvt_pont_val,
    pvtFrstDmspPrc: raw.pvt_frst_dmsp_prc,
    pvtScndDmspPrc: raw.pvt_scnd_dmsp_prc,
    dmrsVal: raw.dmrs_val,
    dmspVal: raw.dmsp_val,
    cpfn: raw.cpfn,
    rstcWdthPrc: raw.rstc_wdth_prc,
    stckFcam: raw.stck_fcam,
    stckSspr: raw.stck_sspr,
    asprUnit: raw.aspr_unit,
    htsDealQtyUnitVal: raw.hts_deal_qty_unit_val,
    lstnStcn: raw.lstn_stcn,
    htsAvls: raw.hts_avls,
    per: raw.per,
    pbr: raw.pbr,
    stacMonth: raw.stac_month,
    volTnrt: raw.vol_tnrt,
    eps: raw.eps,
    bps: raw.bps,
    d250Hgpr: raw.d250_hgpr,
    d250HgprDate: raw.d250_hgpr_date,
    d250HgprVrssPrprRate: raw.d250_hgpr_vrss_prpr_rate,
    d250Lwpr: raw.d250_lwpr,
    d250LwprDate: raw.d250_lwpr_date,
    d250LwprVrssPrprRate: raw.d250_lwpr_vrss_prpr_rate,
    stckDryyHgpr: raw.stck_dryy_hgpr,
    dryyHgprVrssPrprRate: raw.dryy_hgpr_vrss_prpr_rate,
    dryyHgprDate: raw.dryy_hgpr_date,
    stckDryyLwpr: raw.stck_dryy_lwpr,
    dryyLwprVrssPrprRate: raw.dryy_lwpr_vrss_prpr_rate,
    dryyLwprDate: raw.dryy_lwpr_date,
    w52Hgpr: raw.w52_hgpr,
    w52HgprVrssPrprCtrt: raw.w52_hgpr_vrss_prpr_ctrt,
    w52HgprDate: raw.w52_hgpr_date,
    w52Lwpr: raw.w52_lwpr,
    w52LwprVrssPrprCtrt: raw.w52_lwpr_vrss_prpr_ctrt,
    w52LwprDate: raw.w52_lwpr_date,
    wholLoanRmndRate: raw.whol_loan_rmnd_rate,
    sstsYn: raw.ssts_yn,
    stckShrnIscd: raw.stck_shrn_iscd,
    fcamCnnm: raw.fcam_cnnm,
    cpfnCnnm: raw.cpfn_cnnm,
    apprchRate: raw.apprch_rate,
    frgnHldnQty: raw.frgn_hldn_qty,
    viClsCode: raw.vi_cls_code,
    ovtmViClsCode: raw.ovtm_vi_cls_code,
    lastSstsCntgQty: raw.last_ssts_cntg_qty,
    invtCafulYn: raw.invt_caful_yn,
    mrktWarnClsCode: raw.mrkt_warn_cls_code,
    shortOverYn: raw.short_over_yn,
    sltrYn: raw.sltr_yn,
    mangIssuClsCode: raw.mang_issu_cls_code,
  };
}

export function createKisMarketClient(env: BrokerEnv): KisMarketClient {
  const baseUrl = BASE_URLS[env];
  if (!baseUrl) {
    throw new Error(`Invalid BrokerEnv: "${env}". Expected "prod" or "dev".`);
  }

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

    async getStockPrice(
      credentials: KisCredentials,
      token: string,
      params: KisStockPriceParams,
    ): Promise<KisStockPriceResponse> {
      const query = new URLSearchParams({
        FID_COND_MRKT_DIV_CODE: params.marketCode,
        FID_INPUT_ISCD: params.stockCode,
      });

      const response = await fetch(
        `${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price?${query}`,
        {
          method: "GET",
          headers: {
            "content-type": "application/json; charset=UTF-8",
            authorization: `Bearer ${token}`,
            appkey: credentials.appkey,
            appsecret: credentials.appsecret,
            tr_id: "FHKST01010100",
            custtype: "P",
          },
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `KIS stock price request failed: ${response.status} ${response.statusText}\n${errorBody}`,
        );
      }

      const data: RawStockPriceResponse = await response.json();

      return {
        rtCd: data.rt_cd,
        msgCd: data.msg_cd,
        msg1: data.msg1,
        output: mapStockPriceOutput(data.output),
      };
    },
  };
}
