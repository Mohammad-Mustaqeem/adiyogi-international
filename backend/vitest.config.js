import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/unit/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: [
        // Entry point & infrastructure — not unit-testable without real DB/network
        'src/app.js',
        'src/config/env.js',
        'src/config/db.js',
        'src/config/seed.js',
        'src/config/logger.js',
        // Routes are wiring-only, no business logic
        'src/routes/**',
        // Mongoose schema definitions — hooks require real DB; covered via service/repo tests
        'src/models/**',
        // Heavy external-dep services — WhatsApp (Baileys) and PDF (PDFKit)
        'src/services/whatsapp.service.js',
        'src/utils/generate-invoice-pdf.js',
        // Misc
        'src/**/*.d.js',
        'src/uploads/**',
      ],
      thresholds: {
        lines: 85,
        branches: 80,
        functions: 85,
        statements: 85,
      },
      reporter: ['text', 'lcov', 'html'],
    },
  },
});
