import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial"));
    expect(result.current).toBe("initial");
  });

  it("does not update value before the delay expires", () => {
    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 500), {
      initialProps: { val: "a" },
    });
    rerender({ val: "b" });
    act(() => vi.advanceTimersByTime(499));
    expect(result.current).toBe("a");
  });

  it("updates to the new value after the delay expires", () => {
    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 500), {
      initialProps: { val: "a" },
    });
    rerender({ val: "b" });
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe("b");
  });

  it("resets the timer when value changes rapidly (only last value is emitted)", () => {
    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 300), {
      initialProps: { val: "a" },
    });
    rerender({ val: "b" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ val: "c" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ val: "d" });
    // Only 200ms passed since last change — still debouncing
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("d");
  });

  it("uses 400ms as the default delay", () => {
    const { result, rerender } = renderHook(({ val }) => useDebounce(val), {
      initialProps: { val: "x" },
    });
    rerender({ val: "y" });
    act(() => vi.advanceTimersByTime(399));
    expect(result.current).toBe("x");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("y");
  });

  it("respects a custom delay when provided", () => {
    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 1000), {
      initialProps: { val: "start" },
    });
    rerender({ val: "end" });
    act(() => vi.advanceTimersByTime(999));
    expect(result.current).toBe("start");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("end");
  });

  it("cleans up the timer on unmount without updating state", () => {
    const { result, rerender, unmount } = renderHook(
      ({ val }) => useDebounce(val, 500),
      { initialProps: { val: "before" } },
    );
    rerender({ val: "after" });
    unmount();
    // Advancing timer after unmount should not cause errors
    act(() => vi.advanceTimersByTime(500));
    // The hook is unmounted — it should still have the old value at time of unmount
    expect(result.current).toBe("before");
  });
});
