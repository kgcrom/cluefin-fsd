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
  /** 매도유형 (매도주문 시): 01@일반매도, 02@임의매매, 05@대차매도 */
  sellType?: string;
  /** 조건가격 (스탑지정가 주문시, ORD_DVSN=22) */
  conditionPrice?: string;
  /** 거래소ID구분코드: KRX, NXT, SOR */
  exchangeId?: string;
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

/** 주식일별주문체결조회 파라미터 */
export interface KisDailyOrderParams {
  /** 계좌번호 체계(8-2)의 앞 8자리 */
  accountNo: string;
  /** 계좌번호 체계(8-2)의 뒤 2자리 */
  accountProductCode: string;
  /** 조회시작일자 (YYYYMMDD) */
  startDate: string;
  /** 조회종료일자 (YYYYMMDD) */
  endDate: string;
  /** 매도매수구분코드 (00:전체, 01:매도, 02:매수) */
  sellBuyDivision?: string;
  /** 종목번호 6자리 (빈값: 전체) */
  stockCode?: string;
  /** 주문채번지점번호 (5자리) */
  orderBranchNo?: string;
  /** 주문번호 (빈값: 전체) */
  orderNo?: string;
  /** 체결구분 (00:전체, 01:체결, 02:미체결) */
  executionDivision?: string;
  /** 조회구분 (00:역순, 01:정순) */
  inquiryDivision?: string;
  /** 조회구분1 (빈값:전체, 1:ELW, 2:프리보드) */
  inquiryDivision1?: string;
  /** 조회구분3 (00:전체, 01:현금, 02:융자, 03:대출, 04:대주) */
  inquiryDivision3?: string;
  /** 거래소ID구분코드 (KRX, NXT, SOR, ALL) */
  exchangeId?: string;
  /** 연속조회검색조건 */
  ctxAreaFk100?: string;
  /** 연속조회키 */
  ctxAreaNk100?: string;
}

/** 주식일별주문체결조회 응답 - 개별 주문 */
export interface KisDailyOrderItem {
  /** 주문일자 (YYYYMMDD) */
  ordDt: string;
  /** 주문채번지점번호 */
  ordGnoNo: string;
  /** 주문번호 */
  odno: string;
  /** 원주문번호 */
  orgnOdno: string;
  /** 매도매수구분명 */
  sllBuyDvsnCdName: string;
  /** 매도매수구분코드 */
  sllBuyDvsnCd: string;
  /** 종목번호 */
  pdno: string;
  /** 종목명 */
  prdt_name: string;
  /** 주문수량 */
  ordQty: string;
  /** 주문단가 */
  ordUnpr: string;
  /** 주문시간 */
  ordTmd: string;
  /** 총체결수량 */
  totCcldQty: string;
  /** 총체결금액 */
  totCcldAmt: string;
  /** 평균가 */
  avgPrvs: string;
  /** 체결단가 */
  ccldCndt: string;
  /** 주문구분명 */
  ordDvsnName: string;
  /** 주문구분코드 */
  ordDvsnCd: string;
  /** 정정확인수량 */
  mdfyCnfmQty: string;
  /** 취소확인수량 */
  cncl_cnfm_qty: string;
  /** 잔여수량 */
  rmnQty: string;
  /** 거부수량 */
  rjctQty: string;
  /** 통신매체코드 */
  commMediaCd: string;
  /** 통신매체구분명 */
  commMediaDvsnName: string;
  /** 조건부지정가구분코드 */
  cndiOrdDvsnCd: string;
  /** 조건부지정가구분명 */
  cndiOrdDvsnCdName: string;
  /** 거래소ID구분코드 */
  excgIdDvsnCd: string;
  /** 거래소ID구분코드명 */
  excgIdDvsnCdName: string;
}

/** 주식일별주문체결조회 응답 - 합계 */
export interface KisDailyOrderSummary {
  /** 총주문수량 */
  totOrdQty: string;
  /** 총체결수량 */
  totCcldQty: string;
  /** 총체결금액 */
  totCcldAmt: string;
  /** 매도체결금액 */
  prdySllAmt: string;
  /** 매수체결금액 */
  prdyBuyAmt: string;
  /** 매도체결수량 */
  sllCcldAmt: string;
  /** 매수체결수량 */
  buyCcldAmt: string;
}

/** 주식일별주문체결조회 응답 */
export interface KisDailyOrderResponse {
  rtCd: string;
  msgCd: string;
  msg1: string;
  output1: KisDailyOrderItem[];
  output2: KisDailyOrderSummary;
  /** 연속조회 여부 (M: 다음 데이터 있음) */
  trCont?: string;
  /** 연속조회검색조건 */
  ctxAreaFk100?: string;
  /** 연속조회키 */
  ctxAreaNk100?: string;
}
