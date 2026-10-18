import { describe, expect, it } from "vitest";
import { parseForm, safeValues } from "@/lib/forms/form-state";
import { addressSchema, profileSchema } from "./account";
import { signInSchema, signUpSchema, updatePasswordSchema } from "./auth";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

describe("signUpSchema", () => {
  const valid = {
    fullName: "  Ava Thompson ",
    email: " Ava@Example.COM ",
    password: "Sunlit-Oak42",
    confirmPassword: "Sunlit-Oak42",
  };

  it("normalises the name and email", () => {
    const result = signUpSchema.parse(valid);
    expect(result.fullName).toBe("Ava Thompson");
    expect(result.email).toBe("ava@example.com");
  });

  it.each([
    ["short", "Ab1defghi", "at least 10"],
    ["no upper-case", "sunlit-oak42", "upper-case"],
    ["no lower-case", "SUNLIT-OAK42", "lower-case"],
    ["no digit", "Sunlit-Oakwood", "number"],
  ])("rejects a %s password", (_label, password, message) => {
    const result = signUpSchema.safeParse({ ...valid, password, confirmPassword: password });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain(message);
  });

  it("requires matching passwords", () => {
    const result = signUpSchema.safeParse({ ...valid, confirmPassword: "Different-Oak42" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("rejects an invalid email", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("doesn't apply password strength rules to existing passwords", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(true);
  });
});

describe("updatePasswordSchema", () => {
  it("applies the same strength rules as sign-up", () => {
    expect(
      updatePasswordSchema.safeParse({ password: "weak", confirmPassword: "weak" }).success,
    ).toBe(false);
    expect(
      updatePasswordSchema.safeParse({
        password: "Stronger-Pass9",
        confirmPassword: "Stronger-Pass9",
      }).success,
    ).toBe(true);
  });
});

describe("profileSchema", () => {
  it("treats an empty phone as no phone", () => {
    expect(profileSchema.parse({ fullName: "Ava", phone: "" }).phone).toBeNull();
  });

  it("rejects letters in the phone number", () => {
    expect(profileSchema.safeParse({ fullName: "Ava", phone: "call me" }).success).toBe(false);
  });
});

describe("addressSchema", () => {
  const address = {
    label: "",
    fullName: "Ava Thompson",
    phone: "",
    line1: "214 Larch Street",
    line2: "",
    city: "Portland",
    region: "OR",
    postalCode: "97209",
    countryCode: "US",
  };

  it("parses a minimal address and blanks optional fields", () => {
    const result = addressSchema.parse(address);
    expect(result).toMatchObject({ label: null, line2: null, phone: null, isDefault: false });
  });

  it("reads the default checkbox", () => {
    expect(addressSchema.parse({ ...address, isDefault: "on" }).isDefault).toBe(true);
  });

  it("only accepts supported countries", () => {
    expect(addressSchema.safeParse({ ...address, countryCode: "XX" }).success).toBe(false);
  });
});

describe("parseForm", () => {
  it("returns the first error for each field and never echoes passwords", () => {
    const result = parseForm(
      signUpSchema,
      form({ fullName: "", email: "nope", password: "x", confirmPassword: "x" }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(result.state.fieldErrors ?? {})).toEqual(
      expect.arrayContaining(["fullName", "email", "password"]),
    );
    expect(result.state.values).toEqual({ fullName: "", email: "nope" });
  });

  it("drops Next.js internal fields from echoed values", () => {
    expect(safeValues(form({ $ACTION_ID_abc: "", city: "Lyon" }))).toEqual({ city: "Lyon" });
  });
});
