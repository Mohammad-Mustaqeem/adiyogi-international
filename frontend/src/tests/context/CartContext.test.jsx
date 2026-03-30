import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "@/context/CartContext";
import { STORAGE_KEYS } from "@/constants";

const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

const renderCart = () => renderHook(() => useCart(), { wrapper });

const mockProduct = (overrides = {}) => ({
  _id: "prod-1",
  name: "Cotton Kurti",
  itemCode: "CK-001",
  salesPrice: 250,
  price: 300,
  images: ["https://example.com/img1.jpg"],
  unit: "PAC",
  packSize: 10,
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
});

// ── Initial state ────────────────────────────────────────────────────────────

describe("CartProvider — initial state", () => {
  it("initializes with an empty cart when localStorage is empty", () => {
    const { result } = renderCart();
    expect(result.current.cart).toEqual([]);
  });

  it("hydrates cart from a valid localStorage value on mount", () => {
    const savedCart = [
      { productId: "prod-1", name: "Test", price: 100, quantity: 2 },
    ];
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(savedCart));
    const { result } = renderCart();
    expect(result.current.cart).toEqual(savedCart);
  });

  it("initializes with empty cart when localStorage contains invalid JSON", () => {
    localStorage.setItem(STORAGE_KEYS.CART, "not-valid-json");
    const { result } = renderCart();
    expect(result.current.cart).toEqual([]);
  });

  it("starts with isCartOpen as false", () => {
    const { result } = renderCart();
    expect(result.current.isCartOpen).toBe(false);
  });
});

// ── addToCart ────────────────────────────────────────────────────────────────

describe("addToCart", () => {
  it("adds a new product to an empty cart", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct()));
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].productId).toBe("prod-1");
    expect(result.current.cart[0].name).toBe("Cotton Kurti");
  });

  it("increases quantity when adding a product already in the cart", () => {
    const { result } = renderCart();
    const product = mockProduct();
    act(() => result.current.addToCart(product, 1));
    act(() => result.current.addToCart(product, 2));
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(3);
  });

  it("sets isCartOpen to true when a product is added", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct()));
    expect(result.current.isCartOpen).toBe(true);
  });

  it("uses salesPrice over price when salesPrice is present", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct({ salesPrice: 250, price: 300 })));
    expect(result.current.cart[0].price).toBe(250);
  });

  it("falls back to price when salesPrice is absent", () => {
    const { result } = renderCart();
    const product = mockProduct();
    delete product.salesPrice;
    act(() => result.current.addToCart(product));
    expect(result.current.cart[0].price).toBe(300);
  });

  it("uses the first image from images array", () => {
    const { result } = renderCart();
    act(() =>
      result.current.addToCart(
        mockProduct({ images: ["img1.jpg", "img2.jpg"] }),
      ),
    );
    expect(result.current.cart[0].image).toBe("img1.jpg");
  });

  it("uses empty string for image when images array is empty", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct({ images: [] })));
    expect(result.current.cart[0].image).toBe("");
  });

  it("defaults unit to 'Nos' when unit is absent", () => {
    const { result } = renderCart();
    const product = mockProduct();
    delete product.unit;
    act(() => result.current.addToCart(product));
    expect(result.current.cart[0].unit).toBe("Nos");
  });

  it("defaults packSize to 1 when packSize is absent", () => {
    const { result } = renderCart();
    const product = mockProduct();
    delete product.packSize;
    act(() => result.current.addToCart(product));
    expect(result.current.cart[0].packSize).toBe(1);
  });
});

// ── updateQuantity ───────────────────────────────────────────────────────────

describe("updateQuantity", () => {
  it("updates quantity for an existing item", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct(), 1));
    act(() => result.current.updateQuantity("prod-1", 5));
    expect(result.current.cart[0].quantity).toBe(5);
  });

  it("removes the item when quantity is set to 0", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct(), 3));
    act(() => result.current.updateQuantity("prod-1", 0));
    expect(result.current.cart).toHaveLength(0);
  });

  it("removes the item when quantity is set to a negative number", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct(), 3));
    act(() => result.current.updateQuantity("prod-1", -1));
    expect(result.current.cart).toHaveLength(0);
  });
});

// ── removeFromCart ───────────────────────────────────────────────────────────

describe("removeFromCart", () => {
  it("removes the correct item by productId", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct({ _id: "prod-1" })));
    act(() => result.current.addToCart(mockProduct({ _id: "prod-2", name: "Saree" })));
    act(() => result.current.removeFromCart("prod-1"));
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].productId).toBe("prod-2");
  });

  it("leaves other items intact", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct({ _id: "prod-A" })));
    act(() => result.current.addToCart(mockProduct({ _id: "prod-B" })));
    act(() => result.current.removeFromCart("prod-A"));
    expect(result.current.cart[0].name).toBe("Cotton Kurti");
    expect(result.current.cart[0].productId).toBe("prod-B");
  });
});

// ── clearCart ────────────────────────────────────────────────────────────────

describe("clearCart", () => {
  it("empties the cart", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct()));
    act(() => result.current.clearCart());
    expect(result.current.cart).toEqual([]);
  });
});

// ── cartTotal ────────────────────────────────────────────────────────────────

describe("cartTotal computed value", () => {
  it("returns 0 for empty cart", () => {
    const { result } = renderCart();
    expect(result.current.cartTotal).toBe(0);
  });

  it("returns sum of price * quantity for all items", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct({ _id: "p1", salesPrice: 100 }), 2));
    act(() => result.current.addToCart(mockProduct({ _id: "p2", salesPrice: 50 }), 3));
    expect(result.current.cartTotal).toBe(350);
  });
});

// ── cartCount ────────────────────────────────────────────────────────────────

describe("cartCount computed value", () => {
  it("returns 0 for empty cart", () => {
    const { result } = renderCart();
    expect(result.current.cartCount).toBe(0);
  });

  it("returns total quantity across all items", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct({ _id: "p1" }), 3));
    act(() => result.current.addToCart(mockProduct({ _id: "p2" }), 2));
    expect(result.current.cartCount).toBe(5);
  });
});

// ── localStorage persistence ─────────────────────────────────────────────────

describe("localStorage persistence", () => {
  it("writes cart to localStorage after addToCart", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct()));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART));
    expect(stored).toHaveLength(1);
    expect(stored[0].productId).toBe("prod-1");
  });

  it("writes cart to localStorage after removeFromCart", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct({ _id: "p1" })));
    act(() => result.current.addToCart(mockProduct({ _id: "p2" })));
    act(() => result.current.removeFromCart("p1"));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART));
    expect(stored).toHaveLength(1);
    expect(stored[0].productId).toBe("p2");
  });

  it("writes empty array to localStorage after clearCart", () => {
    const { result } = renderCart();
    act(() => result.current.addToCart(mockProduct()));
    act(() => result.current.clearCart());
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART));
    expect(stored).toEqual([]);
  });
});
