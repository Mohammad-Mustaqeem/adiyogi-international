import { describe, it, expect, beforeEach } from "vitest";
import api from "@/lib/api-client";
import { STORAGE_KEYS } from "@/constants";

// Extract interceptor handlers directly from the axios instance
const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;
const responseSuccessInterceptor = api.interceptors.response.handlers[0].fulfilled;
const responseErrorInterceptor = api.interceptors.response.handlers[0].rejected;

beforeEach(() => {
  localStorage.clear();
});

// ── Request interceptor ──────────────────────────────────────────────────────

describe("api-client request interceptor", () => {
  it("attaches Authorization header when token exists in localStorage", () => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, "test-jwt-token");
    const config = { headers: {} };
    const result = requestInterceptor(config);
    expect(result.headers.Authorization).toBe("Bearer test-jwt-token");
  });

  it("does not attach Authorization header when no token in localStorage", () => {
    const config = { headers: {} };
    const result = requestInterceptor(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it("returns the config object", () => {
    const config = { headers: {}, baseURL: "/api" };
    const result = requestInterceptor(config);
    expect(result).toBe(config);
  });
});

// ── Response success interceptor ─────────────────────────────────────────────

describe("api-client response success interceptor", () => {
  it("passes through successful responses unchanged", () => {
    const res = { data: { ok: true }, status: 200 };
    const result = responseSuccessInterceptor(res);
    expect(result).toBe(res);
  });
});

// ── Response error interceptor ───────────────────────────────────────────────

describe("api-client response error interceptor", () => {
  it("removes the admin token from localStorage on 401 response", async () => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, "my-token");
    const err = { response: { status: 401 } };
    await expect(responseErrorInterceptor(err)).rejects.toBe(err);
    expect(localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)).toBeNull();
  });

  it("does NOT remove the token on a 403 response", async () => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, "my-token");
    const err = { response: { status: 403 } };
    await expect(responseErrorInterceptor(err)).rejects.toBe(err);
    expect(localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)).toBe("my-token");
  });

  it("does NOT remove the token on a 500 response", async () => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, "my-token");
    const err = { response: { status: 500 } };
    await expect(responseErrorInterceptor(err)).rejects.toBe(err);
    expect(localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)).toBe("my-token");
  });

  it("re-rejects the error after handling 401 (does not swallow the error)", async () => {
    const err = { response: { status: 401 } };
    await expect(responseErrorInterceptor(err)).rejects.toBe(err);
  });

  it("re-rejects when there is no response object (network error)", async () => {
    const err = new Error("Network Error");
    await expect(responseErrorInterceptor(err)).rejects.toBe(err);
  });
});
