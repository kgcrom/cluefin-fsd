import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { createKisMarketClient } from "./market";
import type { KisIntradayChartParams } from "./types";

const originalFetch = globalThis.fetch;

const rawResponse = {
  rt_cd: "0",
  msg_cd: "MCA00000",
  msg1: "정상처리 되었습니다.",
  output1: {
    prdy_vrss: "100",
    prdy_vrss_sign: "2",
    prdy_ctrt: "0.15",
    stck_prdy_clpr: "66000",
    acml_vol: "10000000",
    acml_tr_pbmn: "660000000000",
    hts_kor_isnm: "삼성전자",
    stck_prpr: "66100",
  },
  output2: [
    {
      stck_bsop_date: "20250601",
      stck_cntg_hour: "130000",
      stck_prpr: "66100",
      stck_oprc: "66000",
      stck_hgpr: "66200",
      stck_lwpr: "65900",
      cntg_vol: "50000",
      acml_tr_pbmn: "330000000",
    },
  ],
};

beforeEach(() => {
  globalThis.fetch = mock(() =>
    Promise.resolve(
      new Response(JSON.stringify(rawResponse), { status: 200 }),
    ),
  );
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const credentials = { appkey: "my-appkey", appsecret: "my-appsecret" };
const token = "test-bearer-token";
const params: KisIntradayChartParams = {
  marketCode: "J",
  stockCode: "005930",
  inputHour: "130000",
  includePrevData: "N",
  etcClassCode: "",
};

describe("createKisMarketClient", () => {
  describe("production env", () => {
    test("uses production URL", async () => {
      const client = createKisMarketClient("production");
      await client.getIntradayChart(credentials, token, params);

      const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock
        .calls[0];
      const url = callArgs[0] as string;

      expect(url).toStartWith(
        "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice",
      );
    });
  });

  describe("dev env", () => {
    test("uses dev URL", async () => {
      const client = createKisMarketClient("dev");
      await client.getIntradayChart(credentials, token, params);

      const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock
        .calls[0];
      const url = callArgs[0] as string;

      expect(url).toStartWith(
        "https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice",
      );
    });
  });

  test("sends GET with correct headers", async () => {
    const client = createKisMarketClient("production");
    await client.getIntradayChart(credentials, token, params);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock
      .calls[0];
    const init = callArgs[1] as RequestInit;
    const headers = init.headers as Record<string, string>;

    expect(init.method).toBe("GET");
    expect(headers["content-type"]).toBe("application/json; charset=UTF-8");
    expect(headers["authorization"]).toBe("Bearer test-bearer-token");
    expect(headers["appkey"]).toBe("my-appkey");
    expect(headers["appsecret"]).toBe("my-appsecret");
    expect(headers["tr_id"]).toBe("FHKST03010200");
    expect(headers["custtype"]).toBe("P");
  });

  test("sends correct query parameters", async () => {
    const client = createKisMarketClient("production");
    await client.getIntradayChart(credentials, token, params);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock
      .calls[0];
    const url = new URL(callArgs[0] as string);

    expect(url.searchParams.get("FID_COND_MRKT_DIV_CODE")).toBe("J");
    expect(url.searchParams.get("FID_INPUT_ISCD")).toBe("005930");
    expect(url.searchParams.get("FID_INPUT_HOUR_1")).toBe("130000");
    expect(url.searchParams.get("FID_PW_DATA_INCU_YN")).toBe("N");
    expect(url.searchParams.get("FID_ETC_CLS_CODE")).toBe("");
  });

  test("parses response with camelCase mapping", async () => {
    const client = createKisMarketClient("production");
    const result = await client.getIntradayChart(credentials, token, params);

    expect(result.rtCd).toBe("0");
    expect(result.msgCd).toBe("MCA00000");
    expect(result.msg1).toBe("정상처리 되었습니다.");

    expect(result.output1).toEqual({
      prdyVrss: "100",
      prdyVrssSign: "2",
      prdyCtrt: "0.15",
      stckPrdyClpr: "66000",
      acmlVol: "10000000",
      acmlTrPbmn: "660000000000",
      htsKorIsnm: "삼성전자",
      stckPrpr: "66100",
    });

    expect(result.output2).toHaveLength(1);
    expect(result.output2[0]).toEqual({
      stckBsopDate: "20250601",
      stckCntgHour: "130000",
      stckPrpr: "66100",
      stckOprc: "66000",
      stckHgpr: "66200",
      stckLwpr: "65900",
      cntgVol: "50000",
      acmlTrPbmn: "330000000",
    });
  });

  test("throws on HTTP error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response("Forbidden", { status: 403, statusText: "Forbidden" }),
      ),
    );

    const client = createKisMarketClient("production");

    expect(
      client.getIntradayChart(credentials, token, params),
    ).rejects.toThrow("KIS intraday chart request failed: 403 Forbidden");
  });
});
