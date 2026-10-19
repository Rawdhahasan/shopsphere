import { describe, expect, it } from "vitest";
import { compactMoney, dayKeys, niceTicks, parseRange, percentChange } from "./math";

describe("analytics helpers", () => {
  it("accepts only the supported ranges", () => {
    expect(parseRange("7")).toBe(7);
    expect(parseRange("90")).toBe(90);
    expect(parseRange("365")).toBe(30);
    expect(parseRange(undefined)).toBe(30);
  });

  it("computes period-over-period change", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(10, 0)).toBeNull();
  });

  it("lists every day in the range, oldest first", () => {
    const keys = dayKeys(3, new Date("2026-10-18T15:00:00Z"));
    expect(keys).toEqual(["2026-10-16", "2026-10-17", "2026-10-18"]);
  });

  it("makes clean axis ticks", () => {
    expect(niceTicks(113560)).toEqual([0, 50000, 100000, 150000]);
    expect(niceTicks(9)).toEqual([0, 2.5, 5, 7.5, 10]);
    expect(niceTicks(0)).toEqual([0]);
  });

  it("formats compact money", () => {
    expect(compactMoney(113560)).toBe("$1.1K");
    expect(compactMoney(98000)).toBe("$980");
  });
});
