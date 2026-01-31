import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { createKisAuthClient } from "./auth";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = mock(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          access_token: "test-token-abc",
          token_type: "Bearer",
          expires_in: 86400,
          access_token_token_expired: "2025-12-31 23:59:59",
        }),
        { status: 200 },
      ),
    ),
  );
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("createKisAuthClient", () => {
  const credentials = { appkey: "my-appkey", appsecret: "my-appsecret" };

  describe("production env", () => {
    test("uses production URL", async () => {
      const client = createKisAuthClient("production");
      await client.getToken(credentials);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://openapi.koreainvestment.com:9443/oauth2/tokenP",
        expect.anything(),
      );
    });
  });

  describe("dev env", () => {
    test("uses dev URL", async () => {
      const client = createKisAuthClient("dev");
      await client.getToken(credentials);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://openapivts.koreainvestment.com:29443/oauth2/tokenP",
        expect.anything(),
      );
    });
  });

  test("sends POST with correct Content-Type header", async () => {
    const client = createKisAuthClient("production");
    await client.getToken(credentials);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const init = callArgs[1] as RequestInit;

    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json; charset=UTF-8",
    );
  });

  test("sends correct request body", async () => {
    const client = createKisAuthClient("production");
    await client.getToken(credentials);

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0];
    const init = callArgs[1] as RequestInit;
    const body = JSON.parse(init.body as string);

    expect(body).toEqual({
      grant_type: "client_credentials",
      appkey: "my-appkey",
      appsecret: "my-appsecret",
    });
  });

  test("parses response into AuthToken", async () => {
    const client = createKisAuthClient("production");
    const token = await client.getToken(credentials);

    expect(token.token).toBe("test-token-abc");
    expect(token.tokenType).toBe("Bearer");
    expect(token.expiresAt).toBeInstanceOf(Date);
  });

  test("parses KST datetime correctly", async () => {
    const client = createKisAuthClient("production");
    const token = await client.getToken(credentials);

    const expected = new Date("2025-12-31T23:59:59+09:00");
    expect(token.expiresAt.getTime()).toBe(expected.getTime());
  });

  test("throws on HTTP error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(null, { status: 401, statusText: "Unauthorized" })),
    );

    const client = createKisAuthClient("production");

    expect(client.getToken(credentials)).rejects.toThrow(
      "KIS token request failed: 401 Unauthorized",
    );
  });
});
