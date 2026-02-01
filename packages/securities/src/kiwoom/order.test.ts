import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { createKiwoomOrderClient } from "./order";
import type { KiwoomBuyOrderParams } from "./types";

const originalFetch = globalThis.fetch;

const rawResponse = {
  ord_no: "0012345",
  dmst_stex_tp: "KRX",
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
const params: KiwoomBuyOrderParams = {
  dmstStexTp: "KRX",
  stkCd: "005930",
  ordQty: "10",
  trdeTp: "0",
};

describe("createKiwoomOrderClient", () => {
  describe("production env", () => {
    test("uses production URL", async () => {
      const client = createKiwoomOrderClient("production");
      await client.buyOrder(token, params);

      const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
      const url = callArgs[0] as string;

      expect(url).toBe("https://api.kiwoom.com/api/dostk/ordr");
    });
  });

  describe("dev env", () => {
    test("uses dev URL", async () => {
      const client = createKiwoomOrderClient("dev");
      await client.buyOrder(token, params);

      const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
      const url = callArgs[0] as string;

      expect(url).toBe("https://mockapi.kiwoom.com/api/dostk/ordr");
    });
  });

  test("sends POST with correct headers", async () => {
    const client = createKiwoomOrderClient("production");
    await client.buyOrder(token, params);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const headers = init.headers as Record<string, string>;

    expect(init.method).toBe("POST");
    expect(headers["Content-Type"]).toBe("application/json;charset=UTF-8");
    expect(headers["authorization"]).toBe("Bearer test-bearer-token");
    expect(headers["api-id"]).toBe("kt10000");
  });

  test("sends correct request body with snake_case mapping", async () => {
    const client = createKiwoomOrderClient("production");
    await client.buyOrder(token, params);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const body = JSON.parse(init.body as string);

    expect(body).toEqual({
      dmst_stex_tp: "KRX",
      stk_cd: "005930",
      ord_qty: "10",
      trde_tp: "0",
    });
  });

  test("includes ord_uv in body when provided", async () => {
    const client = createKiwoomOrderClient("production");
    await client.buyOrder(token, { ...params, ordUv: "72000" });

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const body = JSON.parse(init.body as string);

    expect(body.ord_uv).toBe("72000");
  });

  test("includes cond_uv in body when provided", async () => {
    const client = createKiwoomOrderClient("production");
    await client.buyOrder(token, { ...params, condUv: "71000" });

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const body = JSON.parse(init.body as string);

    expect(body.cond_uv).toBe("71000");
  });

  test("omits optional fields from body when not provided", async () => {
    const client = createKiwoomOrderClient("production");
    await client.buyOrder(token, params);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const body = JSON.parse(init.body as string);

    expect(body.ord_uv).toBeUndefined();
    expect(body.cond_uv).toBeUndefined();
  });

  test("parses response with camelCase mapping", async () => {
    const client = createKiwoomOrderClient("production");
    const result = await client.buyOrder(token, params);

    expect(result).toEqual({
      ordNo: "0012345",
      dmstStexTp: "KRX",
    });
  });

  test("throws on HTTP error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Forbidden", { status: 403, statusText: "Forbidden" })),
    );

    const client = createKiwoomOrderClient("production");

    expect(client.buyOrder(token, params)).rejects.toThrow(
      "Kiwoom buy order request failed: 403 Forbidden",
    );
  });

  test("returns empty strings when response fields are missing", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
    );

    const client = createKiwoomOrderClient("production");
    const result = await client.buyOrder(token, params);

    expect(result).toEqual({
      ordNo: "",
      dmstStexTp: "",
    });
  });
});
