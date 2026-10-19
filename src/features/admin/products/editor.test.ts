import { describe, expect, it } from "vitest";
import {
  cartesian,
  formatOptionsText,
  makeSku,
  parseOptionsText,
  parseSpecifications,
  slugify,
} from "./editor";

describe("product editor helpers", () => {
  it("makes URL slugs", () => {
    expect(slugify("Café Linen Throw & Cushion!")).toBe("cafe-linen-throw-and-cushion");
    expect(slugify("  --Oak  ")).toBe("oak");
  });

  it("parses specification lines", () => {
    expect(
      parseSpecifications("Size: 50 × 50 cm\nno colon here\nCare: Wash at 40°C: gentle"),
    ).toEqual([
      { label: "Size", value: "50 × 50 cm" },
      { label: "Care", value: "Wash at 40°C: gentle" },
    ]);
  });

  it("parses options with swatches and round-trips them", () => {
    const text = "Color: Ivory #eee8dd, Rust #B25A33\nSize: S, M, L";
    const result = parseOptionsText(text);
    expect(result).toEqual({
      ok: true,
      options: [
        {
          name: "Color",
          values: [
            { value: "Ivory", swatch: "#EEE8DD" },
            { value: "Rust", swatch: "#B25A33" },
          ],
        },
        {
          name: "Size",
          values: [
            { value: "S", swatch: null },
            { value: "M", swatch: null },
            { value: "L", swatch: null },
          ],
        },
      ],
    });
    if (result.ok) expect(parseOptionsText(formatOptionsText(result.options))).toEqual(result);
  });

  it("rejects bad option input", () => {
    expect(parseOptionsText("Color Ivory").ok).toBe(false);
    expect(parseOptionsText("Size: S, s").ok).toBe(false);
    expect(parseOptionsText("A: 1\nB: 2\nC: 3\nD: 4").ok).toBe(false);
    expect(
      parseOptionsText(
        "A: " +
          Array.from({ length: 11 }, (_, i) => i).join(",") +
          "\nB: " +
          Array.from({ length: 10 }, (_, i) => i).join(","),
      ).ok,
    ).toBe(false);
    expect(parseOptionsText("").ok).toBe(true);
  });

  it("builds every combination", () => {
    expect(
      cartesian<string | number>([
        ["a", "b"],
        [1, 2],
      ]),
    ).toEqual([
      ["a", 1],
      ["a", 2],
      ["b", 1],
      ["b", 2],
    ]);
    expect(cartesian([])).toEqual([[]]);
  });

  it("makes readable SKUs", () => {
    expect(makeSku("rug", ["Ivory", "5 × 8 ft"])).toBe("RUG-IVORY-58FT");
  });
});
