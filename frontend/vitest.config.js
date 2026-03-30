import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: false,
      setupFiles: ["./src/tests/setup.js"],
      include: ["src/tests/**/*.test.{js,jsx}"],
      coverage: {
        provider: "v8",
        include: ["src/**/*.{js,jsx}"],
        exclude: [
          "src/main.jsx",
          "src/App.jsx",
          "src/constants/**",
          "src/tests/**",
          // Large pages with no unit tests (covered by e2e/integration tests)
          "src/components/Footer.jsx",
          "src/pages/AdminPage.jsx",
          "src/pages/HomePage.jsx",
          "src/pages/ProductDetailPage.jsx",
        ],
        thresholds: {
          lines: 85,
          branches: 80,
          // functions threshold is 80% (matches branches) because v8 counts every
          // inline JSX arrow function (onClick, setQty callbacks) as a separate function
          functions: 80,
          statements: 85,
        },
        reporter: ["text", "lcov", "html"],
      },
    },
  }),
);
