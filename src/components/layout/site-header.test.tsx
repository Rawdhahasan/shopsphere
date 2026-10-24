import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header";

const routerState = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => routerState.pathname,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("SiteHeader", () => {
  it("closes the mobile menu and restores scrolling when the route changes", async () => {
    routerState.pathname = "/";
    const props = { account: null, cart: null, announcement: "Shipping is complimentary" };
    const { rerender } = render(<SiteHeader {...props} />);

    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("navigation", { name: "Mobile" })).toBeInTheDocument();
    const menuPanel = document.getElementById("mobile-menu");
    expect(menuPanel).not.toHaveClass("animate-fade-in");
    expect(menuPanel?.parentElement?.tagName).not.toBe("HEADER");
    expect(menuPanel).toHaveClass("fixed", "z-50", "bg-canvas");
    expect(screen.getByRole("navigation", { name: "Mobile" })).toHaveClass("animate-fade-in");

    routerState.pathname = "/products";
    rerender(<SiteHeader {...props} />);

    await waitFor(() => expect(document.body.style.overflow).toBe(""));
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
