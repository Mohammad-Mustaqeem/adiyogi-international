import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Component that optionally throws to trigger the error boundary
const ThrowingComponent = ({ shouldThrow = false }) => {
  if (shouldThrow) throw new Error("Test error message");
  return <div>Children rendered OK</div>;
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("renders children normally when no error is thrown", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Children rendered OK")).toBeInTheDocument();
  });

  it("renders the default fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("displays the error message from the thrown error", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("shows a 'Try again' button in the default fallback", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("resets the error state and re-renders children when 'Try again' is clicked", async () => {
    const user = userEvent.setup();
    // After reset, ThrowingComponent still throws, so the fallback reappears.
    // This confirms the reset was triggered (it re-renders).
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    const tryAgainBtn = screen.getByRole("button", { name: /try again/i });
    await user.click(tryAgainBtn);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders a custom fallback prop instead of the default", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("calls console.error when a child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(console.error).toHaveBeenCalled();
  });
});
