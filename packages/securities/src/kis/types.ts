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
