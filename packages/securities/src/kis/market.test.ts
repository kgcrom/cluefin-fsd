import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
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
    Promise.resolve(new Response(JSON.stringify(rawResponse), { status: 200 })),
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
  test("sends correct query parameters", async () => {
    const client = createKisMarketClient("production");
    await client.getIntradayChart(credentials, token, params);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const url = new URL(callArgs[0] as string);

    expect(url.searchParams.get("FID_COND_MRKT_DIV_CODE")).toBe("J");
    expect(url.searchParams.get("FID_INPUT_ISCD")).toBe("005930");
    expect(url.searchParams.get("FID_INPUT_HOUR_1")).toBe("130000");
    expect(url.searchParams.get("FID_PW_DATA_INCU_YN")).toBe("N");
    expect(url.searchParams.get("FID_ETC_CLS_CODE")).toBe("");
  });

  test("throws on HTTP error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Forbidden", { status: 403, statusText: "Forbidden" })),
    );

    const client = createKisMarketClient("production");

    expect(client.getIntradayChart(credentials, token, params)).rejects.toThrow(
      "KIS intraday chart request failed: 403 Forbidden",
    );
  });
});
