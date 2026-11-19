/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  server: { host: true },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
