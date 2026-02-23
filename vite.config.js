import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true,
  },
  test: {
    // Vitest configuration
    globals: false,
  },
});
