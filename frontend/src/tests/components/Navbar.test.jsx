import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Navbar from "@/components/Navbar";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSetIsCartOpen = vi.fn();

const mockCartValues = {
  cartCount: 0,
  setIsCartOpen: mockSetIsCartOpen,
};

vi.mock("@/context/CartContext", () => ({
  useCart: () => mockCartValues,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const renderNavbar = (initialPath = "/") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Navbar />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockCartValues.cartCount = 0;
  // Reset scroll position
  Object.defineProperty(window, "scrollY", { value: 0, writable: true });
});

// ── Cart badge ───────────────────────────────────────────────────────────────

describe("Navbar — cart badge", () => {
  it("does not show cart badge when cartCount is 0", () => {
    mockCartValues.cartCount = 0;
    renderNavbar();
    // The badge span only renders when cartCount > 0
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows the count number when cartCount is between 1 and 9", () => {
    mockCartValues.cartCount = 5;
    renderNavbar();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows '9+' when cartCount exceeds 9", () => {
    mockCartValues.cartCount = 15;
    renderNavbar();
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("calls setIsCartOpen(true) when cart button is clicked", async () => {
    const user = userEvent.setup();
    renderNavbar();
    // The cart button contains "Cart" text on sm+ screens
    const cartBtn = screen.getByRole("button", { name: /cart/i });
    await user.click(cartBtn);
    expect(mockSetIsCartOpen).toHaveBeenCalledWith(true);
  });
});

// ── Hamburger menu ───────────────────────────────────────────────────────────
// Note: The desktop nav links (inside `hidden md:flex`) are always in the DOM.
// jsdom ignores CSS media queries, so the desktop "Products" link is always present.
// The mobile menu (conditionally rendered via {menuOpen && ...}) adds a second copy.

describe("Navbar — hamburger menu", () => {
  it("mobile menu is hidden initially (only 1 copy of each nav link in desktop nav)", () => {
    renderNavbar();
    // When mobile menu is closed, each nav label appears exactly once (desktop nav only)
    expect(screen.queryAllByText("Products")).toHaveLength(1);
  });

  it("mobile menu appears when hamburger is clicked (2 copies of nav links appear)", async () => {
    const user = userEvent.setup();
    renderNavbar();
    const buttons = screen.getAllByRole("button");
    const hamburger = buttons.find((b) => !b.textContent.includes("Cart"));
    await user.click(hamburger);
    // Desktop + mobile menu both have "Products"
    expect(screen.queryAllByText("Products")).toHaveLength(2);
  });

  it("mobile menu closes when hamburger is clicked again (back to 1 copy)", async () => {
    const user = userEvent.setup();
    renderNavbar();
    const buttons = screen.getAllByRole("button");
    const hamburger = buttons.find((b) => !b.textContent.includes("Cart"));
    await user.click(hamburger);
    expect(screen.queryAllByText("Products")).toHaveLength(2);
    await user.click(hamburger);
    expect(screen.queryAllByText("Products")).toHaveLength(1);
  });
});

// ── Scroll behavior ──────────────────────────────────────────────────────────

describe("Navbar — scroll behavior", () => {
  it("applies transparent styles when not scrolled on home page", () => {
    renderNavbar("/");
    const nav = screen.getByRole("navigation");
    expect(nav.className).toContain("bg-transparent");
  });

  it("applies solid styles when scrolled past 20px", () => {
    renderNavbar("/");
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 30, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });
    const nav = screen.getByRole("navigation");
    expect(nav.className).toContain("bg-white/95");
  });

  it("applies solid styles on non-home pages regardless of scroll", () => {
    renderNavbar("/product/123");
    const nav = screen.getByRole("navigation");
    expect(nav.className).toContain("bg-white/95");
  });
});

// ── Navigation links ─────────────────────────────────────────────────────────

describe("Navbar — navigation links", () => {
  it("renders the logo linking to '/'", () => {
    renderNavbar();
    // Logo is the first Link component rendered; nav links use <a href>, not React Router Link
    const logoLink = screen.getAllByRole("link").find((l) => l.getAttribute("href") === "/");
    expect(logoLink).toBeDefined();
    expect(logoLink).toHaveAttribute("href", "/");
  });
});
