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
