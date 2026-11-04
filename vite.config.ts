import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset paths, so the build works under GitHub Pages' /Calculator/.
  base: './',
  plugins: [tailwindcss()],
  test: { include: ['src/**/*.test.ts'] },
});
