import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProductCard from "@/components/ProductCard";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockAddToCart = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/context/CartContext", () => ({
  useCart: () => ({
    addToCart: mockAddToCart,
    cart: [],
    cartTotal: 0,
    cartCount: 0,
    isCartOpen: false,
    setIsCartOpen: vi.fn(),
    updateQuantity: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
  }),
}));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockProduct = (overrides = {}) => ({
  _id: "prod-123",
  name: "Cotton Kurti",
  itemCode: "CK-001",
  salesPrice: 250,
  purchasePrice: 320,
  stock: 10,
  images: ["https://example.com/img.jpg"],
  unit: "PAC",
  packSize: 10,
  unitConversionRate: 10,
  ...overrides,
});

const renderCard = (product) =>
  render(
    <MemoryRouter>
      <ProductCard product={product} />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Rendering ────────────────────────────────────────────────────────────────

describe("ProductCard — rendering", () => {
  it("renders the product name", () => {
    renderCard(mockProduct());
    expect(screen.getByText("Cotton Kurti")).toBeInTheDocument();
  });

  it("renders the item code", () => {
    renderCard(mockProduct());
    expect(screen.getAllByText("CK-001").length).toBeGreaterThan(0);
  });

  it("renders the formatted sales price", () => {
    renderCard(mockProduct({ salesPrice: 1000 }));
    expect(screen.getByText(/₹1,000/)).toBeInTheDocument();
  });

  it("shows the discount badge when purchasePrice > salesPrice", () => {
    renderCard(mockProduct({ salesPrice: 250, purchasePrice: 320 }));
    expect(screen.getByText(/% OFF/)).toBeInTheDocument();
  });

  it("does not show the discount badge when purchasePrice equals salesPrice", () => {
    renderCard(mockProduct({ salesPrice: 250, purchasePrice: 250 }));
    expect(screen.queryByText(/% OFF/)).not.toBeInTheDocument();
  });

  it("does not show the discount badge when purchasePrice is absent", () => {
    renderCard(mockProduct({ purchasePrice: undefined }));
    expect(screen.queryByText(/% OFF/)).not.toBeInTheDocument();
  });

  it("shows the Out of Stock badge when stock is 0", () => {
    renderCard(mockProduct({ stock: 0 }));
    // Both the badge and the disabled button contain "Out of Stock"
    expect(screen.getAllByText("Out of Stock").length).toBeGreaterThanOrEqual(1);
  });

  it("does not show Out of Stock badge when stock is > 0", () => {
    renderCard(mockProduct({ stock: 5 }));
    // There's an "Out of Stock" button shown when stock===0; there should be none here
    expect(screen.queryByText("Out of Stock")).not.toBeInTheDocument();
  });

  it("renders the product image when images[0] is present", () => {
    renderCard(mockProduct({ images: ["https://example.com/img.jpg"] }));
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.getByRole("img").src).toContain("example.com");
  });

  it("renders the PackageIcon fallback when images array is empty", () => {
    renderCard(mockProduct({ images: [] }));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    // Item code appears twice: once in fallback area, once in details section
    expect(screen.getAllByText("CK-001").length).toBeGreaterThanOrEqual(1);
  });

  it("renders unit conversion info", () => {
    renderCard(mockProduct({ unitConversionRate: 12 }));
    expect(screen.getByText("1 PAC = 12 NOS")).toBeInTheDocument();
  });

  it("renders the collection name when product.collection is present", () => {
    renderCard(mockProduct({ collection: { name: "Summer Collection" } }));
    expect(screen.getByText("Summer Collection")).toBeInTheDocument();
  });

  it("does not render collection name when product.collection is absent", () => {
    renderCard(mockProduct({ collection: undefined }));
    expect(screen.queryByText("Summer Collection")).not.toBeInTheDocument();
  });

  it("shows Add to Cart button when stock > 0", () => {
    renderCard(mockProduct({ stock: 5 }));
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("shows a disabled Out of Stock button when stock is 0", () => {
    renderCard(mockProduct({ stock: 0 }));
    const btn = screen.getByRole("button", { name: /out of stock/i });
    expect(btn).toBeDisabled();
  });
});

// ── Quantity controls ────────────────────────────────────────────────────────

describe("ProductCard — quantity controls", () => {
  it("starts quantity at 1", () => {
    renderCard(mockProduct());
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("increments quantity when + is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    renderCard(mockProduct());
    await user.click(screen.getByText("+"));
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("decrements quantity when − is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    renderCard(mockProduct());
    await user.click(screen.getByText("+"));
    await user.click(screen.getByText("−"));
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("does not allow quantity below 1", async () => {
    const user = userEvent.setup({ delay: null });
    renderCard(mockProduct());
    await user.click(screen.getByText("−"));
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

// ── Add to cart ──────────────────────────────────────────────────────────────

describe("ProductCard — add to cart", () => {
  it("calls addToCart with the product and current quantity", async () => {
    const user = userEvent.setup({ delay: null });
    const product = mockProduct();
    renderCard(product);
    await user.click(screen.getByText("+"));
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(mockAddToCart).toHaveBeenCalledWith(product, 2);
  });

  it("shows '✓ Added!' text after clicking Add to Cart", async () => {
    const user = userEvent.setup({ delay: null });
    renderCard(mockProduct());
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(screen.getByText("✓ Added!")).toBeInTheDocument();
  });

  it("disables the button immediately after clicking Add to Cart", () => {
    renderCard(mockProduct());
    const btn = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(btn);
    expect(btn).toBeDisabled();
  });
});

// ── Navigation ───────────────────────────────────────────────────────────────

describe("ProductCard — navigation", () => {
  it("navigates to /product/:id when card body is clicked", () => {
    renderCard(mockProduct({ _id: "prod-123" }));
    fireEvent.click(screen.getByText("Cotton Kurti"));
    expect(mockNavigate).toHaveBeenCalledWith("/product/prod-123");
  });

  it("does not navigate when the Add to Cart button is clicked", () => {
    renderCard(mockProduct());
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not navigate when quantity + button is clicked", () => {
    renderCard(mockProduct());
    fireEvent.click(screen.getByText("+"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not navigate when quantity − button is clicked", () => {
    renderCard(mockProduct());
    fireEvent.click(screen.getByText("−"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
