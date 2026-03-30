import { expect, afterEach } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

expect.extend(matchers);

// Automatically clean up the DOM after each test
// (required when vitest globals: false — afterEach is not injected globally)
afterEach(cleanup);
