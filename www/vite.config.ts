import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // lucide-react is now included for better Firefox compatibility
    include: ['lucide-react'],
  },
});
