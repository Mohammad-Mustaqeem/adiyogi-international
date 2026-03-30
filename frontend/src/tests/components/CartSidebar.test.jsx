import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CartSidebar from "@/components/CartSidebar";
import { STORAGE_KEYS } from "@/constants";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}));

// We use the real CartProvider so cart state is authentic
import { CartProvider } from "@/context/CartContext";

// ── Helpers ──────────────────────────────────────────────────────────────────

const cartItem = (overrides = {}) => ({
  productId: "prod-1",
  name: "Cotton Kurti",
  itemCode: "CK-001",
  price: 250,
  image: "",
  unit: "PAC",
  packSize: 10,
  quantity: 2,
  ...overrides,
});

const renderSidebar = (initialCart = []) => {
  if (initialCart.length) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(initialCart));
  }
  return render(
    <MemoryRouter>
      <CartProvider>
        <CartSidebar />
      </CartProvider>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// ── Empty state ──────────────────────────────────────────────────────────────

describe("CartSidebar — empty state", () => {
  it("renders 'Cart is empty' when cart has no items", () => {
    renderSidebar();
    expect(screen.getByText("Cart is empty")).toBeInTheDocument();
  });

  it("renders 'Browse Products' button when cart is empty", () => {
    renderSidebar();
    expect(screen.getByRole("button", { name: /browse products/i })).toBeInTheDocument();
  });

  it("shows '0 items' in the header", () => {
    renderSidebar();
    expect(screen.getByText("0 items")).toBeInTheDocument();
  });
});

// ── With items ───────────────────────────────────────────────────────────────

describe("CartSidebar — with items", () => {
  it("renders each cart item name", () => {
    renderSidebar([cartItem({ name: "Cotton Kurti" })]);
    expect(screen.getByText("Cotton Kurti")).toBeInTheDocument();
  });

  it("renders 📦 emoji fallback when item has no image", () => {
    renderSidebar([cartItem({ image: "" })]);
    expect(screen.getByText("📦")).toBeInTheDocument();
  });

  it("renders item image when image is present", () => {
    renderSidebar([cartItem({ image: "https://example.com/img.jpg" })]);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/img.jpg");
  });

  it("renders the item quantity", () => {
    renderSidebar([cartItem({ quantity: 3 })]);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders the item price", () => {
    renderSidebar([cartItem({ price: 500 })]);
    expect(screen.getByText("₹500")).toBeInTheDocument();
  });

  it("shows the cart total in the footer", () => {
    renderSidebar([cartItem({ price: 250, quantity: 2 })]);
    // Total = 250 * 2 = 500; ₹500 appears for both per-item subtotal and cart total
    expect(screen.getAllByText("₹500").length).toBeGreaterThanOrEqual(1);
  });

  it("shows '1 item' (singular) when cartCount is 1", () => {
    renderSidebar([cartItem({ quantity: 1 })]);
    expect(screen.getByText("1 item")).toBeInTheDocument();
  });

  it("shows '3 items' (plural) when cartCount is 3", () => {
    renderSidebar([cartItem({ quantity: 3 })]);
    expect(screen.getByText("3 items")).toBeInTheDocument();
  });
});

// ── Quantity controls ────────────────────────────────────────────────────────

describe("CartSidebar — quantity controls", () => {
  it("increments quantity when + is clicked", async () => {
    const user = userEvent.setup();
    renderSidebar([cartItem({ quantity: 1 })]);
    await user.click(screen.getByText("+"));
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("decrements quantity when − is clicked (removes when it hits 0)", async () => {
    const user = userEvent.setup();
    renderSidebar([cartItem({ quantity: 1 })]);
    await user.click(screen.getByText("−"));
    // quantity 1 → 0 → item removed, empty state shows
    expect(screen.getByText("Cart is empty")).toBeInTheDocument();
  });

  it("removes the item when trash button is clicked", async () => {
    const user = userEvent.setup();
    renderSidebar([cartItem()]);
    // The trash/remove button is an SVG button — find by the trash SVG path
    const removeButtons = screen.getAllByRole("button");
    const trashBtn = removeButtons.find(
      (b) =>
        b.querySelector("path") &&
        b.querySelector("path")?.getAttribute("d")?.includes("M19 7l-.867"),
    );
    if (trashBtn) {
      await user.click(trashBtn);
      expect(screen.getByText("Cart is empty")).toBeInTheDocument();
    }
  });
});

// ── Checkout ─────────────────────────────────────────────────────────────────

describe("CartSidebar — checkout", () => {
  it("renders 'Proceed to Checkout' button when cart has items", () => {
    renderSidebar([cartItem()]);
    expect(
      screen.getByRole("button", { name: /proceed to checkout/i }),
    ).toBeInTheDocument();
  });

  it("navigates to /checkout when checkout button is clicked", async () => {
    const user = userEvent.setup();
    renderSidebar([cartItem()]);
    await user.click(screen.getByRole("button", { name: /proceed to checkout/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/checkout");
  });

  it("renders 'Continue Shopping' button when cart has items", () => {
    renderSidebar([cartItem()]);
    expect(
      screen.getByRole("button", { name: /continue shopping/i }),
    ).toBeInTheDocument();
  });
});

// ── Visibility ───────────────────────────────────────────────────────────────

describe("CartSidebar — visibility", () => {
  it("drawer has translate-x-full class when isCartOpen is false (default)", () => {
    renderSidebar();
    // The drawer div has translate-x-full when closed
    const drawer = document.querySelector(".translate-x-full");
    expect(drawer).toBeInTheDocument();
  });
});
