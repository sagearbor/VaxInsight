import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    // Vite automatically exposes VITE_* prefixed env vars via import.meta.env
    // So .env should have: VITE_GEMINI_API_KEY=your_key
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
});
