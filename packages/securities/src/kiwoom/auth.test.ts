import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { createKiwoomAuthClient } from "./auth";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = mock(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          token: "kiwoom-token-xyz",
          token_type: "Bearer",
          expires_dt: "20251231235959",
        }),
        { status: 200 },
      ),
    ),
  );
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("createKiwoomAuthClient", () => {
  const credentials = { appkey: "my-appkey", secretkey: "my-secretkey" };

  describe("production env", () => {
    test("uses production URL", async () => {
      const client = createKiwoomAuthClient("production");
      await client.getToken(credentials);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://api.kiwoom.com/oauth2/token",
        expect.anything(),
      );
    });
  });

  describe("mock env", () => {
    test("uses mock URL", async () => {
      const client = createKiwoomAuthClient("mock");
      await client.getToken(credentials);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://mockapi.kiwoom.com/oauth2/token",
        expect.anything(),
      );
    });
  });

  test("sends POST with correct Content-Type header", async () => {
    const client = createKiwoomAuthClient("production");
    await client.getToken(credentials);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock
      .calls[0];
    const init = callArgs[1] as RequestInit;

    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json;charset=UTF-8",
    );
  });

  test("sends correct request body", async () => {
    const client = createKiwoomAuthClient("production");
    await client.getToken(credentials);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock
      .calls[0];
    const init = callArgs[1] as RequestInit;
    const body = JSON.parse(init.body as string);

    expect(body).toEqual({
      grant_type: "client_credentials",
      appkey: "my-appkey",
      secretkey: "my-secretkey",
    });
  });

  test("parses response into AuthToken", async () => {
    const client = createKiwoomAuthClient("production");
    const token = await client.getToken(credentials);

    expect(token.token).toBe("kiwoom-token-xyz");
    expect(token.tokenType).toBe("Bearer");
    expect(token.expiresAt).toBeInstanceOf(Date);
  });

  test("parses KST datetime correctly", async () => {
    const client = createKiwoomAuthClient("production");
    const token = await client.getToken(credentials);

    const expected = new Date("2025-12-31T23:59:59+09:00");
    expect(token.expiresAt.getTime()).toBe(expected.getTime());
  });

  test("throws on HTTP error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(null, { status: 403, statusText: "Forbidden" })),
    );

    const client = createKiwoomAuthClient("production");

    expect(client.getToken(credentials)).rejects.toThrow(
      "Kiwoom token request failed: 403 Forbidden",
    );
  });
});
