import { describe, expect, test } from "bun:test";
import { parseBrokerEnv, requireEnv } from "./utils";

describe("parseBrokerEnv", () => {
  test('"prod" → "production"', () => {
    expect(parseBrokerEnv("prod")).toBe("production");
  });

  test('"dev" → "dev"', () => {
    expect(parseBrokerEnv("dev")).toBe("dev");
  });

  test("잘못된 값이면 에러", () => {
    expect(() => parseBrokerEnv("invalid")).toThrow("잘못된 환경값");
  });
});

describe("requireEnv", () => {
  test("환경변수가 없으면 에러", () => {
    delete process.env.TEST_MISSING_VAR;
    expect(() => requireEnv("TEST_MISSING_VAR")).toThrow("설정되지 않았습니다");
  });
});
