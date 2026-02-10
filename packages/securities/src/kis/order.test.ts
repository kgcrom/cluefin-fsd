import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { createKisOrderClient } from "./order";
import type { KisDailyOrderParams, KisOrderParams } from "./types";

const originalFetch = globalThis.fetch;

const rawResponse = {
  rt_cd: "0",
  msg_cd: "KIOK0000",
  msg1: "주문 전송 완료 되었습니다.",
  output: {
    KRX_FWDG_ORD_ORGNO: "91252",
    ODNO: "0000117057",
    ORD_TMD: "121052",
  },
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
const params: KisOrderParams = {
  accountNo: "50068923",
  accountProductCode: "01",
  stockCode: "005930",
  orderType: "00",
  quantity: "10",
  price: "66000",
};

describe("createKisOrderClient", () => {
  test("throws on HTTP error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Forbidden", { status: 403, statusText: "Forbidden" })),
    );

    const client = createKisOrderClient("prod");

    expect(client.buyOrder(credentials, token, params)).rejects.toThrow(
      "KIS order request failed: 403 Forbidden",
    );
  });
});

const rawDailyOrderResponse = {
  rt_cd: "0",
  msg_cd: "KIOK0000",
  msg1: "정상처리 되었습니다.",
  output1: [
    {
      ord_dt: "20250205",
      ord_gno_brno: "06010",
      odno: "0000117057",
      orgn_odno: "",
      sll_buy_dvsn_cd_name: "매수",
      sll_buy_dvsn_cd: "02",
      pdno: "005930",
      prdt_name: "삼성전자",
      ord_qty: "10",
      ord_unpr: "66000",
      ord_tmd: "121052",
      tot_ccld_qty: "10",
      tot_ccld_amt: "660000",
      avg_prvs: "66000",
      ccld_cndt: "66000",
      ord_dvsn_name: "지정가",
      ord_dvsn_cd: "00",
      mdfy_cnfm_qty: "0",
      cncl_cnfm_qty: "0",
      rmn_qty: "0",
      rjct_qty: "0",
      comm_media_cd: "01",
      comm_media_dvsn_name: "HTS",
      cndi_ord_dvsn_cd: "",
      cndi_ord_dvsn_cd_name: "",
      excg_id_dvsn_cd: "KRX",
      excg_id_dvsn_cd_name: "한국거래소",
    },
  ],
  output2: {
    tot_ord_qty: "10",
    tot_ccld_qty: "10",
    tot_ccld_amt: "660000",
    prdy_sll_amt: "0",
    prdy_buy_amt: "660000",
    sll_ccld_amt: "0",
    buy_ccld_amt: "660000",
  },
  tr_cont: "",
  ctx_area_fk100: "",
  ctx_area_nk100: "",
};

const dailyOrderParams: KisDailyOrderParams = {
  accountNo: "50068923",
  accountProductCode: "01",
  startDate: "20250201",
  endDate: "20250205",
};

describe("getDailyOrders", () => {
  test("fetches daily orders with correct URL and headers (production, recent)", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify(rawDailyOrderResponse), { status: 200 })),
    );

    const client = createKisOrderClient("prod");
    const result = await client.getDailyOrders(credentials, token, dailyOrderParams);

    expect(result.rtCd).toBe("0");
    expect(result.output1).toHaveLength(1);
    expect(result.output1[0].pdno).toBe("005930");
    expect(result.output1[0].ordQty).toBe("10");
    expect(result.output2.totCcldAmt).toBe("660000");

    const fetchCall = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const url = fetchCall[0] as string;
    const options = fetchCall[1] as RequestInit;

    expect(url).toContain("/uapi/domestic-stock/v1/trading/inquire-daily-ccld");
    expect(url).toContain("CANO=50068923");
    expect(url).toContain("INQR_STRT_DT=20250201");
    expect(options.headers).toHaveProperty("tr_id", "TTTC0081R");
  });

  test("uses dev TR ID for dev environment", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify(rawDailyOrderResponse), { status: 200 })),
    );

    const client = createKisOrderClient("dev");
    await client.getDailyOrders(credentials, token, dailyOrderParams);

    const fetchCall = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const options = fetchCall[1] as RequestInit;

    expect(options.headers).toHaveProperty("tr_id", "VTTC0081R");
  });

  test("uses old TR ID when withinThreeMonths is false", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify(rawDailyOrderResponse), { status: 200 })),
    );

    const client = createKisOrderClient("prod");
    await client.getDailyOrders(credentials, token, dailyOrderParams, false);

    const fetchCall = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const options = fetchCall[1] as RequestInit;

    expect(options.headers).toHaveProperty("tr_id", "CTSC9215R");
  });

  test("throws on HTTP error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Forbidden", { status: 403, statusText: "Forbidden" })),
    );

    const client = createKisOrderClient("prod");

    expect(client.getDailyOrders(credentials, token, dailyOrderParams)).rejects.toThrow(
      "KIS daily order inquiry failed: 403 Forbidden",
    );
  });
});
