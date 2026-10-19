import { describe, expect, it } from "vitest";
import { addressLines, readShippingAddress } from "./address";

describe("order shipping address", () => {
  it("reads the database (snake_case) format", () => {
    const address = readShippingAddress({
      full_name: "Ava Thompson",
      line1: "214 Larch Street",
      city: "Portland",
      region: "OR",
      postal_code: "97209",
      country_code: "US",
    });
    expect(addressLines(address)).toEqual([
      "Ava Thompson",
      "214 Larch Street",
      "Portland, OR 97209",
      "United States",
    ]);
  });

  it("also reads camelCase and survives malformed rows", () => {
    expect(readShippingAddress({ fullName: "Noah", postalCode: "N1" }).postalCode).toBe("N1");
    expect(addressLines(readShippingAddress(null))).toEqual([]);
    expect(addressLines(readShippingAddress({ line1: 42, city: "Oslo" }))).toEqual(["Oslo"]);
  });
});
