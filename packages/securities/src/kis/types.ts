export interface KisCredentials {
  appkey: string;
  appsecret: string;
}

export interface KisTokenRequest {
  grant_type: string;
  appkey: string;
  appsecret: string;
}

export interface KisTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  access_token_token_expired: string;
}

export interface KisIntradayChartParams {
  marketCode: "J" | "NX" | "UN";
  stockCode: string;
  inputHour: string;
  includePrevData: string;
  etcClassCode: string;
}

export interface KisIntradayChartOutput1 {
  prdyVrss: string;
  prdyVrssSign: string;
  prdyCtrt: string;
  stckPrdyClpr: string;
  acmlVol: string;
  acmlTrPbmn: string;
  htsKorIsnm: string;
  stckPrpr: string;
}

export interface KisIntradayChartOutput2 {
  stckBsopDate: string;
  stckCntgHour: string;
  stckPrpr: string;
  stckOprc: string;
  stckHgpr: string;
  stckLwpr: string;
  cntgVol: string;
  acmlTrPbmn: string;
}

export interface KisIntradayChartResponse {
  rtCd: string;
  msgCd: string;
  msg1: string;
  output1: KisIntradayChartOutput1;
  output2: KisIntradayChartOutput2[];
}

/** 국내주식주문(현금) 파라미터 */
export interface KisOrderParams {
  /** 계좌번호 체계(8-2)의 앞 8자리 */
  accountNo: string;
  /** 계좌번호 체계(8-2)의 뒤 2자리 */
  accountProductCode: string;
  /** 종목코드(6자리), ETN은 7자리 */
  stockCode: string;
  /** 주문구분 (00:지정가, 01:시장가, ...) */
  orderType: string;
  /** 주문수량 */
  quantity: string;
  /** 주문단가 (시장가 등은 "0") */
  price: string;
}

export interface KisOrderOutput {
  /** 거래소코드 */
  krxFwdgOrdOrgno: string;
  /** 주문번호 */
  odno: string;
  /** 주문시간 */
  ordTmd: string;
}

export interface KisOrderResponse {
  rtCd: string;
  msgCd: string;
  msg1: string;
  output: KisOrderOutput;
}
