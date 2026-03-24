import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CheckoutPage from "@/pages/CheckoutPage";
import { CartProvider } from "@/context/CartContext";
import { STORAGE_KEYS, PAYMENT_MODES } from "@/constants";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}));

vi.mock("@/lib/api-client", () => ({
  default: { post: vi.fn() },
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import api from "@/lib/api-client";
import toast from "react-hot-toast";

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

const renderCheckout = (initialCart = []) => {
  if (initialCart.length) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(initialCart));
  }
  return render(
    <MemoryRouter>
      <CartProvider>
        <CheckoutPage />
      </CartProvider>
    </MemoryRouter>,
  );
};

const fillValidForm = async (user) => {
  await user.type(screen.getByPlaceholderText("John Doe"), "Ravi Kumar");
  // Phone and whatsapp share the same placeholder; use name attribute to distinguish
  await user.type(document.querySelector('input[name="phone"]'), "9876543210");
  await user.type(document.querySelector('input[name="whatsapp"]'), "9876543210");
  await user.type(screen.getByPlaceholderText(/house\/flat/i), "12 Main Street");
  await user.type(screen.getByPlaceholderText("Mumbai"), "Mumbai");
  await user.type(screen.getByPlaceholderText("400001"), "400001");
  await user.selectOptions(screen.getByRole("combobox"), "Maharashtra");
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// ── Empty cart ───────────────────────────────────────────────────────────────

describe("CheckoutPage — empty cart", () => {
  it("renders empty cart message when cart is empty", () => {
    renderCheckout([]);
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("renders 'Browse Products' button that navigates to '/'", async () => {
    const user = userEvent.setup();
    renderCheckout([]);
    await user.click(screen.getByRole("button", { name: /browse products/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});

// ── Form rendering ───────────────────────────────────────────────────────────

describe("CheckoutPage — form rendering", () => {
  it("renders the Personal Information section", () => {
    renderCheckout([cartItem()]);
    expect(screen.getByText("Personal Information")).toBeInTheDocument();
  });

  it("renders the Delivery Address section", () => {
    renderCheckout([cartItem()]);
    expect(screen.getByText("Delivery Address")).toBeInTheDocument();
  });

  it("renders the Payment Mode section", () => {
    renderCheckout([cartItem()]);
    expect(screen.getByText("Payment Mode")).toBeInTheDocument();
  });

  it("renders all PAYMENT_MODES as radio options", () => {
    renderCheckout([cartItem()]);
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(PAYMENT_MODES.length);
  });

  it("defaults payment mode to 'Credit' (first radio is checked)", () => {
    renderCheckout([cartItem()]);
    // PAYMENT_MODES = ["Credit", "Cash", "UPI", "Online"] — Credit is first
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toBeChecked();
  });

  it("renders the order summary with cart item names", () => {
    renderCheckout([cartItem({ name: "Cotton Kurti" })]);
    expect(screen.getByText("Cotton Kurti")).toBeInTheDocument();
  });

  it("renders the Order Summary heading", () => {
    renderCheckout([cartItem()]);
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
  });
});

// ── Validation on submit ─────────────────────────────────────────────────────

describe("CheckoutPage — validation on submit", () => {
  it("shows error and does not call api.post when name is empty", async () => {
    const user = userEvent.setup();
    renderCheckout([cartItem()]);
    await user.click(screen.getByRole("button", { name: /place order/i }));
    expect(api.post).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it("clears field error when user corrects the input", async () => {
    const user = userEvent.setup();
    renderCheckout([cartItem()]);
    // Submit to trigger errors
    await user.click(screen.getByRole("button", { name: /place order/i }));
    // Type in name field — the error should clear
    await user.type(screen.getByPlaceholderText("John Doe"), "Ravi");
    expect(screen.queryByText("Please enter your full name")).not.toBeInTheDocument();
  });
});

// ── Successful submission ────────────────────────────────────────────────────

describe("CheckoutPage — successful submission", () => {
  it("calls api.post('/orders') with correct payload on valid form", async () => {
    const user = userEvent.setup();
    const mockOrder = { orderId: "ADI-0001", total: 500 };
    api.post.mockResolvedValue({
      data: { order: mockOrder, autoSent: {}, pdfUrl: null },
    });

    renderCheckout([cartItem({ productId: "prod-1", quantity: 2 })]);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/orders", expect.objectContaining({
        customer: expect.objectContaining({ name: "Ravi Kumar" }),
        paymentMode: "Credit",
        items: expect.arrayContaining([
          expect.objectContaining({ productId: "prod-1", quantity: 2 }),
        ]),
      }));
    });
  });

  it("navigates to /order-success with state on success", async () => {
    const user = userEvent.setup();
    const mockOrder = { orderId: "ADI-0001", total: 500 };
    api.post.mockResolvedValue({
      data: { order: mockOrder, autoSent: { waReady: true }, pdfUrl: "/pdf.pdf" },
    });

    renderCheckout([cartItem()]);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/order-success",
        expect.objectContaining({
          state: expect.objectContaining({ order: mockOrder }),
        }),
      );
    });
  });

  it("clears the cart after successful order", async () => {
    const user = userEvent.setup();
    const mockOrder = { orderId: "ADI-0001", total: 500 };
    api.post.mockResolvedValue({
      data: { order: mockOrder, autoSent: {}, pdfUrl: null },
    });

    renderCheckout([cartItem()]);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART));
      expect(stored).toEqual([]);
    });
  });

  it("disables the submit button while loading", async () => {
    const user = userEvent.setup();
    // Create a promise we can control to keep loading state active
    let resolvePost;
    const pendingPromise = new Promise((res) => { resolvePost = res; });
    api.post.mockReturnValue(pendingPromise);

    renderCheckout([cartItem()]);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    // Immediately after click, button shows "Placing Order..."
    await waitFor(() => {
      expect(screen.getByText("Placing Order...")).toBeInTheDocument();
    });

    resolvePost({ data: { order: {}, autoSent: {}, pdfUrl: null } });
  });
});

// ── API error handling ───────────────────────────────────────────────────────

describe("CheckoutPage — API error handling", () => {
  it("shows the API error message as a toast when api.post rejects", async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValue({
      response: { data: { message: "Order limit reached" } },
    });

    renderCheckout([cartItem()]);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Order limit reached");
    });
  });

  it("shows a generic fallback message when the API error has no message", async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValue(new Error("Network error"));

    renderCheckout([cartItem()]);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to place order. Please try again.",
      );
    });
  });

  it("re-enables the submit button after a failed request", async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValue(new Error("fail"));

    renderCheckout([cartItem()]);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /place order/i })).not.toBeDisabled();
    });
  });
});
