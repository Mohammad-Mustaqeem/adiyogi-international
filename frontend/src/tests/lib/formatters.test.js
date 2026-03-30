import { describe, it, expect } from "vitest";
import { formatCurrency, formatRupee } from "@/lib/formatters";

describe("formatCurrency", () => {
  it("formats zero as '0'", () => {
    expect(formatCurrency(0)).toBe("0");
  });

  it("formats a 4-digit number with thousands separator", () => {
    expect(formatCurrency(1000)).toBe("1,000");
  });

  it("formats a 6-digit number using Indian grouping (1,00,000)", () => {
    expect(formatCurrency(100000)).toBe("1,00,000");
  });

  it("formats a 7-digit number using Indian grouping (12,34,567)", () => {
    expect(formatCurrency(1234567)).toBe("12,34,567");
  });

  it("coerces a numeric string to number", () => {
    expect(formatCurrency("500")).toBe("500");
  });

  it("handles negative amounts", () => {
    expect(formatCurrency(-1000)).toBe("-1,000");
  });

  it("handles decimal amounts by locale default", () => {
    const result = formatCurrency(1000.5);
    expect(result).toContain("1,000");
  });
});

describe("formatRupee", () => {
  it("prepends ₹ to a formatted number", () => {
    expect(formatRupee(500)).toBe("₹500");
  });

  it("returns '₹0' for zero input", () => {
    expect(formatRupee(0)).toBe("₹0");
  });

  it("returns '₹1,00,000' for 100000", () => {
    expect(formatRupee(100000)).toBe("₹1,00,000");
  });

  it("prepends ₹ to negative amount", () => {
    expect(formatRupee(-500)).toBe("₹-500");
  });
});
