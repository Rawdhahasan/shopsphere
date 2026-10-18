import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FormState } from "@/lib/forms/form-state";
import { LoginForm, RegisterForm } from "./auth-forms";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const respond = (state: FormState) => vi.fn(async () => state);

describe("LoginForm", () => {
  it("submits the email, password and return path", async () => {
    const action = respond({ status: "error", message: "Incorrect email or password." });
    render(<LoginForm action={action} next="/checkout" />);

    await userEvent.type(screen.getByLabelText("Email"), "ava@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Sunlit-Oak42");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    const formData = (action.mock.calls[0] as unknown[])[1] as FormData;
    expect(formData.get("email")).toBe("ava@example.com");
    expect(formData.get("password")).toBe("Sunlit-Oak42");
    expect(formData.get("next")).toBe("/checkout");
    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
  });

  it("shows field errors next to the right input and keeps the typed email", async () => {
    const action = respond({
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: { email: "Enter a valid email address." },
      values: { email: "not-an-email" },
    });
    render(<LoginForm action={action} />);
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    const email = await screen.findByLabelText("Email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Enter a valid email address.");
    expect(email).toHaveValue("not-an-email");
  });

  it("shows a notice passed from the URL, e.g. an expired email link", () => {
    render(<LoginForm action={respond({ status: "idle" })} notice="That link has expired." />);
    expect(screen.getByRole("alert")).toHaveTextContent("That link has expired.");
  });
});

describe("RegisterForm", () => {
  it("replaces the form with the confirmation message on success", async () => {
    const action = respond({ status: "success", message: "We've sent a confirmation link." });
    render(<RegisterForm action={action} />);
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("status")).toHaveTextContent("We've sent a confirmation link.");
    expect(screen.queryByRole("button", { name: "Create account" })).not.toBeInTheDocument();
  });

  it("explains the password rules", () => {
    render(<RegisterForm action={respond({ status: "idle" })} />);
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      /at least 10 characters/i,
    );
  });
});

describe("PasswordInput", () => {
  it("toggles password visibility", async () => {
    render(<LoginForm action={respond({ status: "idle" })} />);
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
