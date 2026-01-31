import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { putSecretToken } from "./secret";

const originalSpawn = Bun.spawn;

function createMockProc(exitCode: number, stdout: string, stderr: string = "") {
  return {
    exited: Promise.resolve(exitCode),
    stdout: new Response(stdout).body!,
    stderr: new Response(stderr).body!,
    pid: 0,
    stdin: undefined,
    killed: false,
    kill: () => {},
    ref: () => {},
    unref: () => {},
    exitCode: null,
    signalCode: null,
    [Symbol.asyncDispose]: async () => {},
    resourceUsage: () => undefined,
  };
}

const baseOptions = {
  storeId: "store-abc-123",
  name: "broker-token-kis",
  value: "test-token-value",
};

describe("putSecretToken", () => {
  let spawnMock: ReturnType<typeof mock>;

  beforeEach(() => {
    spawnMock = mock();
    Bun.spawn = spawnMock as typeof Bun.spawn;
  });

  afterEach(() => {
    Bun.spawn = originalSpawn;
  });

  test("secret이 목록에 존재하면 delete 후 create 실행", async () => {
    spawnMock
      .mockReturnValueOnce(createMockProc(0, "broker-token-kis\t2025-01-01"))
      .mockReturnValueOnce(createMockProc(0, ""))
      .mockReturnValueOnce(createMockProc(0, ""));

    await putSecretToken(baseOptions);

    expect(spawnMock).toHaveBeenCalledTimes(3);

    const listArgs = spawnMock.mock.calls[0][0] as string[];
    expect(listArgs).toEqual([
      "bunx",
      "wrangler",
      "secrets-store",
      "secret",
      "list",
      "store-abc-123",
    ]);

    const deleteArgs = spawnMock.mock.calls[1][0] as string[];
    expect(deleteArgs).toEqual([
      "bunx",
      "wrangler",
      "secrets-store",
      "secret",
      "delete",
      "store-abc-123",
      "--name",
      "broker-token-kis",
    ]);

    const createArgs = spawnMock.mock.calls[2][0] as string[];
    expect(createArgs).toEqual([
      "bunx",
      "wrangler",
      "secrets-store",
      "secret",
      "create",
      "store-abc-123",
      "--name",
      "broker-token-kis",
      "--scopes",
      "workers",
      "--value",
      "test-token-value",
    ]);
  });

  test("secret이 목록에 없으면 delete 없이 create 실행", async () => {
    spawnMock
      .mockReturnValueOnce(createMockProc(0, "other-secret\t2025-01-01"))
      .mockReturnValueOnce(createMockProc(0, ""));

    await putSecretToken(baseOptions);

    expect(spawnMock).toHaveBeenCalledTimes(2);

    const listArgs = spawnMock.mock.calls[0][0] as string[];
    expect(listArgs).toContain("list");

    const createArgs = spawnMock.mock.calls[1][0] as string[];
    expect(createArgs).toContain("create");
  });

  test("remote 옵션이 true이면 모든 명령에 --remote 추가", async () => {
    spawnMock
      .mockReturnValueOnce(createMockProc(0, "broker-token-kis\t2025-01-01"))
      .mockReturnValueOnce(createMockProc(0, ""))
      .mockReturnValueOnce(createMockProc(0, ""));

    await putSecretToken({ ...baseOptions, remote: true });

    const listArgs = spawnMock.mock.calls[0][0] as string[];
    expect(listArgs).toContain("--remote");

    const deleteArgs = spawnMock.mock.calls[1][0] as string[];
    expect(deleteArgs).toContain("--remote");

    const createArgs = spawnMock.mock.calls[2][0] as string[];
    expect(createArgs).toContain("--remote");
  });

  test("secret list 실패 시 에러 throw", async () => {
    spawnMock.mockReturnValueOnce(createMockProc(1, "", "authentication error"));

    expect(putSecretToken(baseOptions)).rejects.toThrow(
      "wrangler secrets-store secret list failed (exit 1): authentication error",
    );
  });

  test("secret create 실패 시 에러 throw", async () => {
    spawnMock
      .mockReturnValueOnce(createMockProc(0, "no-match"))
      .mockReturnValueOnce(createMockProc(1, "", "secret already exists"));

    expect(putSecretToken(baseOptions)).rejects.toThrow(
      "wrangler secrets-store secret create failed (exit 1): secret already exists",
    );
  });
});
