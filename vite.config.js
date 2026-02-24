import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // use a relative base so assets load regardless of host path (Vercel, GitHub Pages, etc.)
  // removing the hard-coded "/monivra/" prevents 404s on the root domain.
  base: './',
});
