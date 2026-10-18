import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./form-field";
import { Input } from "./input";

describe("FormField", () => {
  it("links the label and hint to the control", () => {
    render(
      <FormField label="Email" hint="We'll send your receipt here.">
        <Input type="email" />
      </FormField>,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAccessibleDescription("We'll send your receipt here.");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("marks the control invalid and describes the error", () => {
    render(
      <FormField label="Email" hint="Hint" error="Enter a valid email address.">
        <Input type="email" />
      </FormField>,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a valid email address.");
  });
});
