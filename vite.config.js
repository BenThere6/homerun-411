import { defineConfig } from 'vite';

export default defineConfig({
  // Other Vite configurations
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5173', // Your backend server URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});