export interface KiwoomCredentials {
  appkey: string;
  secretkey: string;
}

export interface KiwoomTokenRequest {
  grant_type: string;
  appkey: string;
  secretkey: string;
}

export interface KiwoomTokenResponse {
  expires_dt: string;
  token_type: string;
  token: string;
}

export interface KiwoomRankParams {
  mrktTp: "000" | "001" | "101";
  amtQtyTp: "1" | "2";
  qryDtTp: "0" | "1";
  date?: string;
  stexTp: "1" | "2" | "3";
}

export interface KiwoomRankItem {
  forNetslmtStkCd: string;
  forNetslmtStkNm: string;
  forNetslmtAmt: string;
  forNetslmtQty: string;
  forNetprpsStkCd: string;
  forNetprpsStkNm: string;
  forNetprpsAmt: string;
  forNetprpsQty: string;
  orgnNetslmtStkCd: string;
  orgnNetslmtStkNm: string;
  orgnNetslmtAmt: string;
  orgnNetslmtQty: string;
  orgnNetprpsStkCd: string;
  orgnNetprpsStkNm: string;
  orgnNetprpsAmt: string;
  orgnNetprpsQty: string;
}

export interface KiwoomRankResponse {
  frgOrgnTrdeUpper: KiwoomRankItem[];
}

export interface KiwoomVolumeSurgeParams {
  mrktTp: "000" | "001" | "101";
  sortTp: "1" | "2" | "3" | "4";
  tmTp: "1" | "2";
  trdeQtyTp: string;
  tm?: string;
  stkCnd: string;
  pricTp: string;
  stexTp: "1" | "2" | "3";
}

export interface KiwoomVolumeSurgeItem {
  stkCd: string;
  stkNm: string;
  curPrc: string;
  predPreSig: string;
  predPre: string;
  fluRt: string;
  prevTrdeQty: string;
  nowTrdeQty: string;
  sdninQty: string;
  sdninRt: string;
}

export interface KiwoomVolumeSurgeResponse {
  trdeQtySdnin: KiwoomVolumeSurgeItem[];
}

export interface KiwoomBuyOrderParams {
  dmstStexTp: string;
  stkCd: string;
  ordQty: string;
  ordUv?: string;
  trdeTp: string;
  condUv?: string;
}

export interface KiwoomBuyOrderResponse {
  ordNo: string;
  dmstStexTp: string;
}

export interface KiwoomSellOrderParams {
  dmstStexTp: string;
  stkCd: string;
  ordQty: string;
  ordUv?: string;
  trdeTp: string;
  condUv?: string;
}

export interface KiwoomSellOrderResponse {
  ordNo: string;
  dmstStexTp: string;
}

export interface KiwoomDailyOrderParams {
  stkCd?: string;
  qryTp: "0" | "1";
  sellTp: "0" | "1" | "2";
  ordNo?: string;
  stexTp: "0" | "1" | "2";
  contYn?: string;
  nextKey?: string;
}

export interface KiwoomDailyOrderItem {
  ordNo: string;
  stkNm: string;
  ioTpNm: string;
  ordPric: string;
  ordQty: string;
  cntrPric: string;
  cntrQty: string;
  osoQty: string;
  tdyTrdeCmsn: string;
  tdyTrdeTax: string;
  ordStt: string;
  trdeTp: string;
  origOrdNo: string;
  ordTm: string;
  stkCd: string;
  stexTp: string;
  stexTpTxt: string;
  sorYn: string;
  stopPric: string;
}

export interface KiwoomDailyOrderResponse {
  cntr: KiwoomDailyOrderItem[];
  contYn?: string;
  nextKey?: string;
}
