import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { createKiwoomMarketClient } from "./market";
import type { KiwoomRankParams, KiwoomVolumeSurgeParams } from "./types";

const originalFetch = globalThis.fetch;

const rawResponse = {
  frg_orgn_trde_upper: [
    {
      for_netslmt_stk_cd: "005930",
      for_netslmt_stk_nm: "삼성전자",
      for_netslmt_amt: "100000",
      for_netslmt_qty: "1500",
      for_netprps_stk_cd: "000660",
      for_netprps_stk_nm: "SK하이닉스",
      for_netprps_amt: "200000",
      for_netprps_qty: "1000",
      orgn_netslmt_stk_cd: "035420",
      orgn_netslmt_stk_nm: "NAVER",
      orgn_netslmt_amt: "300000",
      orgn_netslmt_qty: "500",
      orgn_netprps_stk_cd: "035720",
      orgn_netprps_stk_nm: "카카오",
      orgn_netprps_amt: "400000",
      orgn_netprps_qty: "800",
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

const token = "test-bearer-token";
const params: KiwoomRankParams = {
  mrktTp: "000",
  amtQtyTp: "1",
  qryDtTp: "0",
  stexTp: "1",
};

describe("createKiwoomMarketClient", () => {
  describe("production env", () => {
    test("uses production URL", async () => {
      const client = createKiwoomMarketClient("production");
      await client.getRank(token, params);

      const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
      const url = callArgs[0] as string;

      expect(url).toBe("https://api.kiwoom.com/api/dostk/rkinfo");
    });
  });

  describe("dev env", () => {
    test("uses dev URL", async () => {
      const client = createKiwoomMarketClient("dev");
      await client.getRank(token, params);

      const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
      const url = callArgs[0] as string;

      expect(url).toBe("https://mockapi.kiwoom.com/api/dostk/rkinfo");
    });
  });

  test("sends POST with correct headers", async () => {
    const client = createKiwoomMarketClient("production");
    await client.getRank(token, params);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const headers = init.headers as Record<string, string>;

    expect(init.method).toBe("POST");
    expect(headers["Content-Type"]).toBe("application/json;charset=UTF-8");
    expect(headers["authorization"]).toBe("Bearer test-bearer-token");
    expect(headers["api-id"]).toBe("ka90009");
  });

  test("sends correct request body", async () => {
    const client = createKiwoomMarketClient("production");
    await client.getRank(token, { ...params, date: "20250601" });

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const body = JSON.parse(init.body as string);

    expect(body).toEqual({
      mrkt_tp: "000",
      amt_qty_tp: "1",
      qry_dt_tp: "0",
      stex_tp: "1",
      date: "20250601",
    });
  });

  test("omits date from body when not provided", async () => {
    const client = createKiwoomMarketClient("production");
    await client.getRank(token, params);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const body = JSON.parse(init.body as string);

    expect(body).toEqual({
      mrkt_tp: "000",
      amt_qty_tp: "1",
      qry_dt_tp: "0",
      stex_tp: "1",
    });
    expect(body.date).toBeUndefined();
  });

  test("parses response with camelCase mapping", async () => {
    const client = createKiwoomMarketClient("production");
    const result = await client.getRank(token, params);

    expect(result.frgOrgnTrdeUpper).toHaveLength(1);
    expect(result.frgOrgnTrdeUpper[0]).toEqual({
      forNetslmtStkCd: "005930",
      forNetslmtStkNm: "삼성전자",
      forNetslmtAmt: "100000",
      forNetslmtQty: "1500",
      forNetprpsStkCd: "000660",
      forNetprpsStkNm: "SK하이닉스",
      forNetprpsAmt: "200000",
      forNetprpsQty: "1000",
      orgnNetslmtStkCd: "035420",
      orgnNetslmtStkNm: "NAVER",
      orgnNetslmtAmt: "300000",
      orgnNetslmtQty: "500",
      orgnNetprpsStkCd: "035720",
      orgnNetprpsStkNm: "카카오",
      orgnNetprpsAmt: "400000",
      orgnNetprpsQty: "800",
    });
  });

  test("throws on HTTP error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Forbidden", { status: 403, statusText: "Forbidden" })),
    );

    const client = createKiwoomMarketClient("production");

    expect(client.getRank(token, params)).rejects.toThrow(
      "Kiwoom rank request failed: 403 Forbidden",
    );
  });
});

const volumeSurgeRawResponse = {
  trde_qty_sdnin: [
    {
      stk_cd: "005930",
      stk_nm: "삼성전자",
      cur_prc: "72000",
      pred_pre_sig: "2",
      pred_pre: "1500",
      flu_rt: "2.13",
      prev_trde_qty: "5000000",
      now_trde_qty: "15000000",
      sdnin_qty: "10000000",
      sdnin_rt: "300.00",
    },
  ],
};

const volumeSurgeParams: KiwoomVolumeSurgeParams = {
  mrktTp: "000",
  sortTp: "1",
  tmTp: "1",
  trdeQtyTp: "5",
  stkCnd: "0",
  pricTp: "0",
  stexTp: "1",
};

describe("getVolumeSurge", () => {
  test("sends POST with correct headers", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify(volumeSurgeRawResponse), { status: 200 })),
    );

    const client = createKiwoomMarketClient("production");
    await client.getVolumeSurge(token, volumeSurgeParams);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const url = callArgs[0] as string;
    const init = callArgs[1] as RequestInit;
    const headers = init.headers as Record<string, string>;

    expect(url).toBe("https://api.kiwoom.com/api/dostk/rkinfo");
    expect(init.method).toBe("POST");
    expect(headers["Content-Type"]).toBe("application/json;charset=UTF-8");
    expect(headers["authorization"]).toBe("Bearer test-bearer-token");
    expect(headers["api-id"]).toBe("ka10023");
  });

  test("sends correct request body with snake_case mapping", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify(volumeSurgeRawResponse), { status: 200 })),
    );

    const client = createKiwoomMarketClient("production");
    await client.getVolumeSurge(token, volumeSurgeParams);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const body = JSON.parse(init.body as string);

    expect(body).toEqual({
      mrkt_tp: "000",
      sort_tp: "1",
      tm_tp: "1",
      trde_qty_tp: "5",
      stk_cnd: "0",
      pric_tp: "0",
      stex_tp: "1",
    });
  });

  test("omits tm from body when not provided", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify(volumeSurgeRawResponse), { status: 200 })),
    );

    const client = createKiwoomMarketClient("production");
    await client.getVolumeSurge(token, volumeSurgeParams);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const body = JSON.parse(init.body as string);

    expect(body.tm).toBeUndefined();
  });

  test("includes tm in body when provided", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify(volumeSurgeRawResponse), { status: 200 })),
    );

    const client = createKiwoomMarketClient("production");
    await client.getVolumeSurge(token, { ...volumeSurgeParams, tm: "10" });

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const body = JSON.parse(init.body as string);

    expect(body.tm).toBe("10");
  });

  test("parses response with camelCase mapping", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify(volumeSurgeRawResponse), { status: 200 })),
    );

    const client = createKiwoomMarketClient("production");
    const result = await client.getVolumeSurge(token, volumeSurgeParams);

    expect(result.trdeQtySdnin).toHaveLength(1);
    expect(result.trdeQtySdnin[0]).toEqual({
      stkCd: "005930",
      stkNm: "삼성전자",
      curPrc: "72000",
      predPreSig: "2",
      predPre: "1500",
      fluRt: "2.13",
      prevTrdeQty: "5000000",
      nowTrdeQty: "15000000",
      sdninQty: "10000000",
      sdninRt: "300.00",
    });
  });

  test("throws on HTTP error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Forbidden", { status: 403, statusText: "Forbidden" })),
    );

    const client = createKiwoomMarketClient("production");

    expect(client.getVolumeSurge(token, volumeSurgeParams)).rejects.toThrow(
      "Kiwoom volume surge request failed: 403 Forbidden",
    );
  });
});
