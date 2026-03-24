import { describe, it, expect } from "vitest";
import {
  checkoutSchema,
  loginSchema,
  adminSetupSchema,
  productSchema,
  collectionSchema,
  validate,
  validateFields,
} from "@/lib/validators";

// ── Shared valid data ────────────────────────────────────────────────────────

const validCheckout = {
  name: "Ravi Kumar",
  phone: "9876543210",
  whatsapp: "9876543210",
  email: "",
  address: "12 Main Street",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400001",
};

const validProduct = {
  name: "Cotton Kurti",
  itemCode: "CK-001",
  salesPrice: "250",
  purchasePrice: "200",
  stock: "50",
};

// ── checkoutSchema ───────────────────────────────────────────────────────────

describe("checkoutSchema", () => {
  it("passes with all valid fields", () => {
    const result = checkoutSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
  });

  it("fails when name is empty", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, name: "" });
    expect(result.success).toBe(false);
  });

  it("fails when name is only whitespace", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, name: "   " });
    expect(result.success).toBe(false);
  });

  it("fails when phone is 9 digits", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, phone: "987654321" });
    expect(result.success).toBe(false);
  });

  it("fails when phone starts with a digit below 6", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, phone: "5876543210" });
    expect(result.success).toBe(false);
  });

  it("fails when phone is 11 digits", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, phone: "98765432101" });
    expect(result.success).toBe(false);
  });

  it("passes when email is empty string (optional)", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, email: "" });
    expect(result.success).toBe(true);
  });

  it("fails when email is non-empty and invalid", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, email: "notanemail" });
    expect(result.success).toBe(false);
  });

  it("passes when email is a valid address", () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("fails when pincode is 5 digits", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, pincode: "40000" });
    expect(result.success).toBe(false);
  });

  it("fails when pincode contains letters", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, pincode: "40000A" });
    expect(result.success).toBe(false);
  });

  it("fails when state is empty", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, state: "" });
    expect(result.success).toBe(false);
  });

  it("fails when city is empty", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, city: "" });
    expect(result.success).toBe(false);
  });

  it("fails when address is empty", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, address: "" });
    expect(result.success).toBe(false);
  });
});

// ── loginSchema ──────────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("passes with username and password", () => {
    const result = loginSchema.safeParse({ username: "admin", password: "secret" });
    expect(result.success).toBe(true);
  });

  it("fails when username is empty after trim", () => {
    const result = loginSchema.safeParse({ username: "   ", password: "secret" });
    expect(result.success).toBe(false);
  });

  it("fails when password is empty", () => {
    const result = loginSchema.safeParse({ username: "admin", password: "" });
    expect(result.success).toBe(false);
  });
});

// ── adminSetupSchema ─────────────────────────────────────────────────────────

describe("adminSetupSchema", () => {
  const validSetup = {
    username: "admin",
    password: "secret123",
    name: "Admin User",
    whatsappNumber: "9876543210",
  };

  it("passes with all valid fields", () => {
    const result = adminSetupSchema.safeParse(validSetup);
    expect(result.success).toBe(true);
  });

  it("fails when username is 2 characters (minimum is 3)", () => {
    const result = adminSetupSchema.safeParse({ ...validSetup, username: "ab" });
    expect(result.success).toBe(false);
  });

  it("fails when password is 5 characters (minimum is 6)", () => {
    const result = adminSetupSchema.safeParse({ ...validSetup, password: "12345" });
    expect(result.success).toBe(false);
  });

  it("fails when whatsappNumber starts with a digit below 6", () => {
    const result = adminSetupSchema.safeParse({
      ...validSetup,
      whatsappNumber: "5876543210",
    });
    expect(result.success).toBe(false);
  });

  it("fails when name is empty", () => {
    const result = adminSetupSchema.safeParse({ ...validSetup, name: "" });
    expect(result.success).toBe(false);
  });
});

// ── productSchema ────────────────────────────────────────────────────────────

describe("productSchema", () => {
  it("passes with required fields and coerces numeric strings", () => {
    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
    expect(result.data.salesPrice).toBe(250);
    expect(result.data.stock).toBe(50);
  });

  it("fails when salesPrice is negative", () => {
    const result = productSchema.safeParse({ ...validProduct, salesPrice: "-10" });
    expect(result.success).toBe(false);
  });

  it("fails when salesPrice is zero", () => {
    const result = productSchema.safeParse({ ...validProduct, salesPrice: "0" });
    expect(result.success).toBe(false);
  });

  it("passes when stock is zero (zero stock is allowed)", () => {
    const result = productSchema.safeParse({ ...validProduct, stock: "0" });
    expect(result.success).toBe(true);
    expect(result.data.stock).toBe(0);
  });

  it("fails when stock is negative", () => {
    const result = productSchema.safeParse({ ...validProduct, stock: "-1" });
    expect(result.success).toBe(false);
  });

  it("passes when hsnCode is omitted (optional)", () => {
    const { hsnCode: _, ...withoutHsn } = { ...validProduct, hsnCode: undefined };
    const result = productSchema.safeParse(withoutHsn);
    expect(result.success).toBe(true);
  });

  it("defaults collections to empty array when omitted", () => {
    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
    expect(result.data.collections).toEqual([]);
  });

  it("fails when name is empty", () => {
    const result = productSchema.safeParse({ ...validProduct, name: "" });
    expect(result.success).toBe(false);
  });

  it("fails when itemCode is empty", () => {
    const result = productSchema.safeParse({ ...validProduct, itemCode: "" });
    expect(result.success).toBe(false);
  });
});

// ── collectionSchema ─────────────────────────────────────────────────────────

describe("collectionSchema", () => {
  it("passes with a valid name", () => {
    const result = collectionSchema.safeParse({ name: "New Arrivals" });
    expect(result.success).toBe(true);
  });

  it("fails when name is empty", () => {
    const result = collectionSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("fails when name is only whitespace", () => {
    const result = collectionSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  it("passes when description is omitted (optional)", () => {
    const result = collectionSchema.safeParse({ name: "Summer" });
    expect(result.success).toBe(true);
  });

  it("passes when description is provided", () => {
    const result = collectionSchema.safeParse({
      name: "Summer",
      description: "Summer collection",
    });
    expect(result.success).toBe(true);
  });
});

// ── validate helper ──────────────────────────────────────────────────────────

describe("validate helper", () => {
  it("returns null for valid data", () => {
    expect(validate(loginSchema, { username: "admin", password: "pass123" })).toBeNull();
  });

  it("returns the first error message string for invalid data", () => {
    const message = validate(loginSchema, { username: "", password: "" });
    expect(typeof message).toBe("string");
    expect(message.length).toBeGreaterThan(0);
  });

  it("returns a specific error message from the schema", () => {
    const message = validate(checkoutSchema, { ...validCheckout, pincode: "123" });
    expect(message).toBe("Enter a valid 6-digit pincode");
  });
});

// ── validateFields helper ────────────────────────────────────────────────────

describe("validateFields helper", () => {
  it("returns {} for valid data", () => {
    expect(validateFields(loginSchema, { username: "admin", password: "pass" })).toEqual(
      {},
    );
  });

  it("returns an object keyed by field with error messages", () => {
    const errors = validateFields(loginSchema, { username: "", password: "" });
    expect(errors).toHaveProperty("username");
    expect(errors).toHaveProperty("password");
    expect(typeof errors.username).toBe("string");
  });

  it("only keeps the first error per field", () => {
    const errors = validateFields(checkoutSchema, {
      ...validCheckout,
      name: "",
      pincode: "123",
    });
    expect(Object.keys(errors)).toContain("name");
    expect(Object.keys(errors)).toContain("pincode");
    // Each field has exactly one error message (a string, not an array)
    expect(typeof errors.name).toBe("string");
    expect(typeof errors.pincode).toBe("string");
  });
});
