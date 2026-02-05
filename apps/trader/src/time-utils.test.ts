import { describe, expect, test } from "bun:test";
import { getKstHour, getKstMinute, isFillCheckTime, isOrderExecutionTime } from "./time-utils";

/** 주어진 UTC 시각의 Date 객체 생성 */
function utcDate(hour: number, minute: number): Date {
  return new Date(Date.UTC(2025, 0, 6, hour, minute));
}

describe("getKstHour", () => {
  test("UTC 00:00 → KST 09:00", () => {
    expect(getKstHour(utcDate(0, 0))).toBe(9);
  });
  test("UTC 15:00 → KST 00:00 (다음날)", () => {
    expect(getKstHour(utcDate(15, 0))).toBe(0);
  });
  test("UTC 23:00 → KST 08:00", () => {
    expect(getKstHour(utcDate(23, 0))).toBe(8);
  });
});

describe("getKstMinute", () => {
  test("분은 UTC와 동일", () => {
    expect(getKstMinute(utcDate(12, 30))).toBe(30);
  });
});

describe("isOrderExecutionTime", () => {
  // KST = UTC + 9h
  test("KST 09:10 → true (시작 경계)", () => {
    expect(isOrderExecutionTime(utcDate(0, 10))).toBe(true);
  });
  test("KST 09:09 → false (시작 전)", () => {
    expect(isOrderExecutionTime(utcDate(0, 9))).toBe(false);
  });
  test("KST 15:00 → true (종료 경계)", () => {
    expect(isOrderExecutionTime(utcDate(6, 0))).toBe(true);
  });
  test("KST 15:01 → false (종료 후)", () => {
    expect(isOrderExecutionTime(utcDate(6, 1))).toBe(false);
  });
  test("KST 12:00 → true (중간)", () => {
    expect(isOrderExecutionTime(utcDate(3, 0))).toBe(true);
  });
});

describe("isFillCheckTime", () => {
  test("KST 16:00 → true (시작)", () => {
    expect(isFillCheckTime(utcDate(7, 0))).toBe(true);
  });
  test("KST 17:59 → true (종료 경계)", () => {
    expect(isFillCheckTime(utcDate(8, 59))).toBe(true);
  });
  test("KST 15:59 → false (시작 전)", () => {
    expect(isFillCheckTime(utcDate(6, 59))).toBe(false);
  });
  test("KST 18:00 → false (종료 후)", () => {
    expect(isFillCheckTime(utcDate(9, 0))).toBe(false);
  });
});
