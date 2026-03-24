import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import OrderSuccessPage from "@/pages/OrderSuccessPage";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
let mockLocationState = null;

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockOrder = {
  orderId: "ADI-0042",
  total: 750,
  paymentMode: "UPI",
  customer: {
    name: "Ravi Kumar",
    whatsapp: "9876543210",
    address: "12 Main Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  },
  items: [
    {
      name: "Cotton Kurti",
      itemCode: "CK-001",
      quantity: 2,
      price: 250,
      amount: 500,
    },
    {
      name: "Silk Saree",
      itemCode: "SS-002",
      quantity: 1,
      price: 250,
      amount: 250,
    },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <OrderSuccessPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockLocationState = null;
});

// ── Redirect guard ───────────────────────────────────────────────────────────

describe("OrderSuccessPage — redirect guard", () => {
  it("returns null when location state has no order", () => {
    mockLocationState = null;
    const { container } = renderPage();
    expect(container).toBeEmptyDOMElement();
  });

  it("calls navigate('/') when location state has no order", () => {
    mockLocationState = null;
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});

// ── Order display ────────────────────────────────────────────────────────────

describe("OrderSuccessPage — order display", () => {
  beforeEach(() => {
    mockLocationState = { order: mockOrder, autoSent: null, pdfUrl: null };
  });

  it("renders the order ID", () => {
    renderPage();
    expect(screen.getByText("ADI-0042")).toBeInTheDocument();
  });

  it("renders the customer name", () => {
    renderPage();
    expect(screen.getByText("Ravi Kumar")).toBeInTheDocument();
  });

  it("renders the customer WhatsApp number", () => {
    renderPage();
    expect(screen.getByText("9876543210")).toBeInTheDocument();
  });

  it("renders the payment mode", () => {
    renderPage();
    expect(screen.getByText("UPI")).toBeInTheDocument();
  });

  it("renders the order total", () => {
    renderPage();
    // Total appears twice: in summary grid and in items section
    expect(screen.getAllByText("₹750.00").length).toBeGreaterThanOrEqual(1);
  });

  it("renders delivery address components", () => {
    renderPage();
    expect(screen.getByText(/12 Main Street/)).toBeInTheDocument();
  });

  it("renders each ordered item name", () => {
    renderPage();
    expect(screen.getByText("Cotton Kurti")).toBeInTheDocument();
    expect(screen.getByText("Silk Saree")).toBeInTheDocument();
  });

  it("renders item amounts", () => {
    renderPage();
    expect(screen.getByText("₹500")).toBeInTheDocument();
    expect(screen.getByText("₹250")).toBeInTheDocument();
  });

  it("renders the 'Items Ordered' section header", () => {
    renderPage();
    expect(screen.getByText("Items Ordered")).toBeInTheDocument();
  });
});

// ── PDF section ──────────────────────────────────────────────────────────────

describe("OrderSuccessPage — PDF section", () => {
  it("shows the PDF download banner when pdfUrl is provided", () => {
    mockLocationState = {
      order: mockOrder,
      autoSent: null,
      pdfUrl: "/api/orders/ADI-0042/invoice.pdf",
    };
    renderPage();
    expect(screen.getByText(/open pdf/i)).toBeInTheDocument();
  });

  it("does NOT show the PDF download banner when pdfUrl is absent", () => {
    mockLocationState = { order: mockOrder, autoSent: null, pdfUrl: null };
    renderPage();
    expect(screen.queryByText(/open pdf/i)).not.toBeInTheDocument();
  });

  it("renders the 'Open PDF' anchor with href pointing to pdfUrl", () => {
    const pdfUrl = "/api/orders/ADI-0042/invoice.pdf";
    mockLocationState = { order: mockOrder, autoSent: null, pdfUrl };
    renderPage();
    const link = screen.getByRole("link", { name: /open pdf/i });
    expect(link).toHaveAttribute("href", pdfUrl);
  });
});

// ── WhatsApp status ──────────────────────────────────────────────────────────

describe("OrderSuccessPage — WhatsApp status", () => {
  it("shows '✅ WhatsApp Sent Automatically' when waReady is true", () => {
    mockLocationState = {
      order: mockOrder,
      autoSent: { waReady: true, admin: true, customer: true },
      pdfUrl: null,
    };
    renderPage();
    expect(screen.getByText("✅ WhatsApp Sent Automatically")).toBeInTheDocument();
  });

  it("shows '📱 WhatsApp Notifications' when waReady is false", () => {
    mockLocationState = {
      order: mockOrder,
      autoSent: { waReady: false },
      pdfUrl: null,
    };
    renderPage();
    expect(screen.getByText("📱 WhatsApp Notifications")).toBeInTheDocument();
  });

  it("shows '✓ Sent' for admin when adminSent is true", () => {
    mockLocationState = {
      order: mockOrder,
      autoSent: { waReady: true, admin: true, customer: false },
      pdfUrl: null,
    };
    renderPage();
    const sentElements = screen.getAllByText("✓ Sent");
    expect(sentElements.length).toBeGreaterThan(0);
  });

  it("shows '⚠ Failed' for admin when adminSent is false", () => {
    mockLocationState = {
      order: mockOrder,
      autoSent: { waReady: true, admin: false, customer: false },
      pdfUrl: null,
    };
    renderPage();
    const failedElements = screen.getAllByText("⚠ Failed");
    expect(failedElements.length).toBeGreaterThan(0);
  });

  it("shows the admin and customer sent status grid when waReady is true", () => {
    mockLocationState = {
      order: mockOrder,
      autoSent: { waReady: true, admin: true, customer: true },
      pdfUrl: null,
    };
    renderPage();
    expect(screen.getByText("Admin Notified")).toBeInTheDocument();
    expect(screen.getByText("Your Copy")).toBeInTheDocument();
  });
});

// ── Navigation ───────────────────────────────────────────────────────────────

describe("OrderSuccessPage — navigation", () => {
  it("navigates to '/' when 'Continue Shopping' is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    mockLocationState = { order: mockOrder, autoSent: null, pdfUrl: null };
    renderPage();
    await user.click(screen.getByRole("button", { name: /continue shopping/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
